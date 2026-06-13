import "dotenv/config";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";
import Anthropic from "@anthropic-ai/sdk";
import { detectPython, stripMarkdown, validatePython, validatePrompt } from "./utils.js";

const PORT = process.env.PORT || 3001;
const FUSION_ADDIN_URL = process.env.FUSION_ADDIN_URL || "http://localhost:8080";
const GENERATION_TIMEOUT = 120000; // 2 minutes


const PYTHON_CMD = detectPython();
console.log(`[PYTHON] Using: ${PYTHON_CMD}`);

// ---------------------------------------------------------------------------
// MiMo client (Anthropic-compatible)
// ---------------------------------------------------------------------------
const anthropic = new Anthropic({
  apiKey: process.env.MIMO_API_KEY,
  baseURL: process.env.MIMO_BASE_URL || "https://token-plan-sgp.xiaomimimo.com/anthropic",
});

// ---------------------------------------------------------------------------
// System prompt — Fusion 360 Python API expert
// ---------------------------------------------------------------------------
import { SYSTEM_PROMPT } from "./system-prompt.js";

// Express app setup
// ---------------------------------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// REST: GET /fusion/status — check if addin is alive
// ---------------------------------------------------------------------------
app.get("/fusion/status", async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(FUSION_ADDIN_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      res.json({ connected: true, addin: data });
    } else {
      res.json({ connected: false, error: "Addin returned non-200" });
    }
  } catch {
    res.json({ connected: false, error: "Addin unreachable" });
  }
});

// ---------------------------------------------------------------------------
// REST: POST /fusion/send — proxy to Fusion addin
// ---------------------------------------------------------------------------
app.post("/fusion/send", async (req, res) => {
  console.log("[API] POST /fusion/send received, body keys:", Object.keys(req.body || {}));
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "No code provided" });
  try {
    const result = await sendToFusion(code);
    console.log("[API] Fusion result:", result);
    res.json(result);
  } catch (err) {
    console.log("[API] Fusion error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// REST: POST /generate — non-streaming fallback
// ---------------------------------------------------------------------------
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  try {
    const code = await generateValidatedCode(prompt);
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Helper: kirim script ke Fusion addin
// ---------------------------------------------------------------------------
async function sendToFusion(code) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(FUSION_ADDIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    });
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}



// ---------------------------------------------------------------------------
// Helper: ask MiMo to fix broken code
// ---------------------------------------------------------------------------
async function fixCodeWithMiMo(brokenCode, syntaxError) {
  const message = await anthropic.messages.create({
    model: process.env.MIMO_MODEL || "mimo-v2.5-pro",
    max_tokens: 16384,
    thinking: { type: "disabled" },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `The following Python code has a syntax error. Fix ONLY the syntax error, keep all logic the same. Output ONLY the corrected raw Python code.\n\nSyntax Error: ${syntaxError}\n\nBroken Code:\n${brokenCode}`,
      },
    ],
  });
  const textBlock = message.content.find((b) => b.type === "text");
  const fixed = stripMarkdown(textBlock?.text || "");
  if (!fixed.trim()) {
    console.log("[FIX] Warning: MiMo returned empty fix, returning original code");
    return brokenCode;
  }
  return fixed;
}

// ---------------------------------------------------------------------------
// Helper: generate + validate + auto-fix pipeline
// ---------------------------------------------------------------------------
const MAX_RETRIES = 2;

async function generateValidatedCode(prompt, ws = null) {
  let fullCode = "";

  const enhancedPrompt = `Write a Fusion 360 Python script for: ${prompt}`;

  const stream = anthropic.messages.stream({
    model: process.env.MIMO_MODEL || "mimo-v2.5-pro",
    max_tokens: 16384,
    thinking: { type: "disabled" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: enhancedPrompt }],
  });

  let inputTokens = 0;
  let outputTokens = 0;

  for await (const event of stream) {
    if (event.type === "message_start" && event.message?.usage) {
      inputTokens = event.message.usage.input_tokens || 0;
    }
    if (event.type === "message_delta" && event.usage) {
      outputTokens = event.usage.output_tokens || 0;
    }
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullCode += event.delta.text || "";
    }
  }

  console.log(`[TOKENS] input=${inputTokens} output=${outputTokens} total=${inputTokens + outputTokens}`);

  fullCode = stripMarkdown(fullCode);

  if (!fullCode.trim()) {
    console.log("[GENERATE] WARNING: Empty code after all extraction attempts");
    throw new Error("AI returned empty code. Try a simpler prompt or retry.");
  }

  // Validate + auto-fix loop
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = validatePython(fullCode);
    if (result.valid) return fullCode;

    console.log(`[VALIDATE] Syntax error (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${result.error}`);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "validating", attempt: attempt + 1, error: result.error }));
    }

    if (attempt < MAX_RETRIES) {
      fullCode = await fixCodeWithMiMo(fullCode, result.error);
      if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "fixing", attempt: attempt + 1 }));
      }
    }
  }

  return fullCode;
}

// ---------------------------------------------------------------------------
// HTTP + WebSocket server
// ---------------------------------------------------------------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/generate" });

wss.on("connection", (ws) => {
  console.log("[WS] Client connected");

  ws.on("message", async (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    const { prompt, autoSend } = data;

    if (!prompt) {
      ws.send(JSON.stringify({ type: "error", message: "No prompt provided" }));
      return;
    }

    if (prompt.length > 2000) {
      ws.send(JSON.stringify({ type: "error", message: "Prompt too long (max 2000 characters)" }));
      return;
    }

    console.log(`\n[REQUEST] Prompt: "${prompt}"`);
    console.log(`[REQUEST] Auto-send: ${autoSend}`);

    ws.send(JSON.stringify({ type: "start" }));

    try {
      ws.send(JSON.stringify({ type: "generating", message: "Generating script..." }));

      // Generate with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Generation timed out after 2 minutes")), GENERATION_TIMEOUT)
      );

      let code;
      try {
        code = await Promise.race([generateValidatedCode(prompt, ws), timeoutPromise]);
      } catch (genErr) {
        console.log(`[ERROR] Generation failed: ${genErr.message}`);
        ws.send(JSON.stringify({ type: "error", message: genErr.message }));
        return;
      }

      console.log(`[CODE] ${code.split("\n").length} lines, ${code.length} chars`);
      console.log(`[CODE] First 3 lines: ${code.split("\n").slice(0, 3).join(" | ")}`);

      ws.send(JSON.stringify({ type: "complete", code }));

      // Send to Fusion if auto-send
      if (autoSend && code.trim()) {
        ws.send(JSON.stringify({ type: "fusion_sending", message: "Sending to Fusion 360..." }));
        try {
          const result = await sendToFusion(code);
          console.log(`[FUSION] Success: ${result.success}, Message: ${result.message}`);
          ws.send(JSON.stringify({
            type: "fusion_result",
            success: result.success,
            message: result.message,
          }));
          if (!result.success) {
            console.log(`[FUSION] FAILED — full error: ${JSON.stringify(result)}`);
            ws.send(JSON.stringify({ type: "error", message: `Fusion error: ${result.message}` }));
          }
        } catch (fusionErr) {
          console.log(`[FUSION] Exception: ${fusionErr.message}`);
          ws.send(JSON.stringify({ type: "fusion_error", message: fusionErr.message }));
        }
      }

      ws.send(JSON.stringify({ type: "done", message: "Done!" }));

    } catch (err) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "error", message: err.message }));
      }
    }
  });

  ws.on("close", () => {
    console.log("[WS] Client disconnected");
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
server.listen(PORT, () => {
  console.log(`\nFusion AI Backend v3.0 — ${new Date().toISOString()}`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws/generate`);
  console.log(`   Fusion addin: ${FUSION_ADDIN_URL}`);
  console.log(`   Python: ${PYTHON_CMD}\n`);
});

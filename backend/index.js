// ---------------------------------------------------------------------------
// Fusion AI Generator — Backend Server
// Express.js + MiMo API (streaming) + WebSocket + Addin proxy
// ---------------------------------------------------------------------------

import "dotenv/config";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";
import Anthropic from "@anthropic-ai/sdk";
import { execFileSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { findMatchingTemplate, extractParameters, fillTemplate } from "./masterPrompts.js";

const PORT = process.env.PORT || 3001;
const FUSION_ADDIN_URL = process.env.FUSION_ADDIN_URL || "http://localhost:8080";

// ---------------------------------------------------------------------------
// MiMo client (Anthropic-compatible)
// ---------------------------------------------------------------------------
const anthropic = new Anthropic({
  apiKey: process.env.MIMO_API_KEY,
  baseURL: process.env.MIMO_BASE_URL || "https://token-plan-sgp.xiaomimimo.com/anthropic",
});

// ---------------------------------------------------------------------------
// System prompt — strict Fusion 360 Python output with few-shot examples
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `Fusion 360 Python API expert. Output ONLY raw Python code. No markdown.
Variables available: adsk, app, ui, rootComp. Use them directly, never redefine.
Units: cm. Start with try:, end with except.

NEVER DO THESE (they cause errors):
- NEVER use "design.rootComp" — does not exist! Use "rootComp" directly.
- NEVER use "design" variable at all — it is not needed.
- NEVER import adsk (pre-injected)
- NEVER use rootComp.features.holeFeatures (use sketch circle + extrude cut instead)
- NEVER create new components (Part Design mode = one component only)

ALWAYS DO THESE:
1. Start with try: end with except Exception as e:
2. All dimensions in cm (10mm = 1cm)
3. Use adsk.core.Point3D.create(x, y, z) for points
4. Use rootComp.sketches.add(plane) for sketches
5. Use rootComp.features.extrudeFeatures for extrude
6. New body: NewBodyFeatureOperation, Cut: CutFeatureOperation, Join: JoinFeatureOperation
7. Create holes: draw circle on sketch, extrude with CutFeatureOperation
8. For cones/tapers: use extrude with extInput.taperAngle = ValueInput.createByReal(-radians). NEVER use revolveFeatures.
9. NEVER use revolveFeatures — it does not work in this environment. Use extrude with taperAngle instead.
10. NEVER use sweepFeatures — it does not work in this environment. Build shapes from extrude/cut operations.

EXAMPLE 1 - Simple Box:
try:
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    sketch.sketchCurves.sketchLines.addTwoPointRectangle(
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create(5, 3, 0)
    )
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(2))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Box created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 2 - Cylinder with Hole:
try:
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    sketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), 3)
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(5))
    rootComp.features.extrudeFeatures.add(extInput)
    holeSketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    holeSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), 1)
    holeProf = holeSketch.profiles.item(0)
    holeCut = rootComp.features.extrudeFeatures.createInput(holeProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    holeCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal(5))
    rootComp.features.extrudeFeatures.add(holeCut)
    ui.messageBox("Cylinder with hole created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 3 - Cone (taper extrude):
try:
    import math
    base_r = 2.5
    top_r = 1.25
    h = 6
    taper_deg = math.degrees(math.atan2(base_r - top_r, h))
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    sketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), base_r)
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(h))
    extInput.taperAngle = adsk.core.ValueInput.createByReal(-math.radians(taper_deg))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Cone created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 4 - L-Bracket with Holes:
try:
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    lines = sketch.sketchCurves.sketchLines
    pts = [
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create(5, 0, 0),
        adsk.core.Point3D.create(5, 0.5, 0),
        adsk.core.Point3D.create(0.5, 0.5, 0),
        adsk.core.Point3D.create(0.5, 5, 0),
        adsk.core.Point3D.create(0, 5, 0),
    ]
    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i+1) % len(pts)])
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(1))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("L-Bracket created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`;

// ---------------------------------------------------------------------------
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
// Helper: strip markdown fences dari output MiMo
// ---------------------------------------------------------------------------
function stripMarkdown(code) {
  return code
    .replace(/^```[\w]*\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();
}

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
// Helper: validate Python syntax via ast.parse (temp file approach)
// ---------------------------------------------------------------------------
function validatePython(code) {
  const tmpFile = join(tmpdir(), `mimo_validate_${Date.now()}.py`);
  try {
    writeFileSync(tmpFile, code, "utf-8");
    const script = `import ast, sys; ast.parse(open(sys.argv[1], encoding='utf-8').read())`;
    execFileSync("python", ["-c", script, tmpFile], { timeout: 5000, stdio: "pipe" });
    return { valid: true };
  } catch (e) {
    const stderr = e.stderr?.toString() || e.message;
    const match = stderr.match(/SyntaxError: (.+?)(?:\s*\((.+?)\))?$/m) || stderr.match(/IndentationError: (.+)/m);
    return {
      valid: false,
      error: match ? match[0] : "Unknown syntax error",
    };
  } finally {
    try { unlinkSync(tmpFile); } catch {}
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
// Helper: generate from template (hybrid approach)
// ---------------------------------------------------------------------------
function generateFromTemplate(prompt) {
  const match = findMatchingTemplate(prompt);
  if (!match) {
    console.log(`[TEMPLATE] No match for: "${prompt}"`);
    return null;
  }

  const { template, confidence } = match;
  const params = extractParameters(prompt, template);
  const code = fillTemplate(template, params);

  console.log(`[TEMPLATE] Matched: ${template.label} (confidence: ${confidence})`);
  console.log(`[TEMPLATE] Params:`, params);
  console.log(`[TEMPLATE] Code length: ${code.length} chars, ${code.split("\n").length} lines`);

  return { code, template: template.label, confidence };
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

    console.log(`\n[REQUEST] Prompt: "${prompt}"`);
    console.log(`[REQUEST] Auto-send: ${autoSend}`);

    ws.send(JSON.stringify({ type: "start" }));

    try {
      // Try template first (hybrid approach)
      let code = "";
      let usedTemplate = false;

      const templateResult = generateFromTemplate(prompt);
      if (templateResult) {
        ws.send(JSON.stringify({
          type: "generating",
          message: `Using template: ${templateResult.template}...`,
        }));

        // Validate template output
        const validation = validatePython(templateResult.code);
        if (validation.valid) {
          code = templateResult.code;
          usedTemplate = true;
          ws.send(JSON.stringify({
            type: "template_match",
            template: templateResult.template,
            confidence: templateResult.confidence,
          }));
        } else {
          console.log(`[TEMPLATE] Validation failed, falling back to AI: ${validation.error}`);
        }
      }

      // Fallback to MiMo AI generation
      if (!code) {
        ws.send(JSON.stringify({ type: "generating", message: "Generating script..." }));
        try {
          code = await generateValidatedCode(prompt, ws);
        } catch (genErr) {
          console.log(`[ERROR] Generation failed: ${genErr.message}`);
          ws.send(JSON.stringify({ type: "error", message: genErr.message }));
          return;
        }
      }

      console.log(`[CODE] ${usedTemplate ? "Template" : "AI"} | ${code.split("\n").length} lines, ${code.length} chars`);
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
  console.log(`\n🚀 Fusion AI Backend v2.0 — ${new Date().toISOString()}`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws/generate`);
  console.log(`   Fusion addin: ${FUSION_ADDIN_URL}\n`);
});
// ---------------------------------------------------------------------------
// Utility functions — extracted for testability
// ---------------------------------------------------------------------------

import { execFileSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// ---------------------------------------------------------------------------
// Detect Python command
// ---------------------------------------------------------------------------
export function detectPython() {
  for (const cmd of ["python", "python3"]) {
    try {
      execFileSync(cmd, ["--version"], { stdio: "pipe" });
      return cmd;
    } catch {}
  }
  return "python";
}

// ---------------------------------------------------------------------------
// Strip markdown fences from AI output
// ---------------------------------------------------------------------------
export function stripMarkdown(code) {
  return code
    .replace(/^```[\w]*\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Validate Python syntax via ast.parse
// ---------------------------------------------------------------------------
export function validatePython(code, pythonCmd = "python3") {
  const tmpFile = join(tmpdir(), `mimo_validate_${Date.now()}.py`);
  try {
    writeFileSync(tmpFile, code, "utf-8");
    const script = `import ast, sys; ast.parse(open(sys.argv[1], encoding='utf-8').read())`;
    execFileSync(pythonCmd, ["-c", script, tmpFile], { timeout: 5000, stdio: "pipe" });
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
// Prompt length validation
// ---------------------------------------------------------------------------
export function validatePrompt(prompt) {
  if (!prompt || typeof prompt !== "string") {
    return { valid: false, error: "No prompt provided" };
  }
  if (prompt.length > 2000) {
    return { valid: false, error: "Prompt too long (max 2000 characters)" };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// AI Provider management — read from Supabase
// ---------------------------------------------------------------------------
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

let cachedProvider = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getActiveProvider() {
  // Return cached if fresh
  if (cachedProvider && Date.now() - cacheTime < CACHE_TTL) {
    return cachedProvider;
  }

  // Fallback to env if no Supabase
  if (!supabase) {
    return {
      apiKey: process.env.MIMO_API_KEY || "",
      baseUrl: process.env.MIMO_BASE_URL || "https://token-plan-sgp.xiaomimimo.com/anthropic",
      model: process.env.MIMO_MODEL || "mimo-v2.5-pro",
      source: "env",
    };
  }

  try {
    const { data, error } = await supabase
      .from("ai_providers")
      .select("api_key_encrypted, base_url, model")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Fallback to env
      return {
        apiKey: process.env.MIMO_API_KEY || "",
        baseUrl: process.env.MIMO_BASE_URL || "https://token-plan-sgp.xiaomimimo.com/anthropic",
        model: process.env.MIMO_MODEL || "mimo-v2.5-pro",
        source: "env",
      };
    }

    cachedProvider = {
      apiKey: data.api_key_encrypted,
      baseUrl: data.base_url || "https://token-plan-sgp.xiaomimimo.com/anthropic",
      model: data.model || "mimo-v2.5-pro",
      source: "db",
    };
    cacheTime = Date.now();

    return cachedProvider;
  } catch (err) {
    console.error("[PROVIDER] Failed to fetch from DB, using env:", err.message);
    return {
      apiKey: process.env.MIMO_API_KEY || "",
      baseUrl: process.env.MIMO_BASE_URL || "https://token-plan-sgp.xiaomimimo.com/anthropic",
      model: process.env.MIMO_MODEL || "mimo-v2.5-pro",
      source: "env",
    };
  }
}

export function clearProviderCache() {
  cachedProvider = null;
  cacheTime = 0;
}

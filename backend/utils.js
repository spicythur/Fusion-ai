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

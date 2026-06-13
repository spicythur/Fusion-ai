import { describe, it, expect } from "vitest";
import { stripMarkdown, validatePrompt } from "../utils.js";

// ---------------------------------------------------------------------------
// stripMarkdown
// ---------------------------------------------------------------------------
describe("stripMarkdown", () => {
  it("strips triple backtick fences with language tag", () => {
    const input = '```python\nprint("hello")\n```';
    const result = stripMarkdown(input);
    expect(result).toBe('print("hello")');
  });

  it("strips triple backtick fences without language tag", () => {
    const input = "```\nprint('hello')\n```";
    const result = stripMarkdown(input);
    expect(result).toBe("print('hello')");
  });

  it("strips multiple code blocks", () => {
    const input = "```python\ncode1\n```\n\n```python\ncode2\n```";
    const result = stripMarkdown(input);
    // After stripping fences, we get "code1\n\ncode2" (the empty line between blocks remains)
    expect(result).toContain("code1");
    expect(result).toContain("code2");
    expect(result).not.toContain("```");
  });

  it("returns plain code unchanged", () => {
    const input = 'print("hello")';
    const result = stripMarkdown(input);
    expect(result).toBe('print("hello")');
  });

  it("handles empty string", () => {
    expect(stripMarkdown("")).toBe("");
  });

  it("trims leading and trailing whitespace from plain code", () => {
    const input = "  some code  ";
    expect(stripMarkdown(input)).toBe("some code");
  });

  it("strips fences then trims", () => {
    const input = "```python\ncode\n```";
    const result = stripMarkdown(input);
    expect(result).toBe("code");
  });
});

// ---------------------------------------------------------------------------
// validatePrompt
// ---------------------------------------------------------------------------
describe("validatePrompt", () => {
  it("accepts valid prompt", () => {
    const result = validatePrompt("Create a box 5x5x5cm");
    expect(result).toEqual({ valid: true });
  });

  it("rejects empty string", () => {
    const result = validatePrompt("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("No prompt provided");
  });

  it("rejects null", () => {
    const result = validatePrompt(null);
    expect(result.valid).toBe(false);
  });

  it("rejects undefined", () => {
    const result = validatePrompt(undefined);
    expect(result.valid).toBe(false);
  });

  it("rejects non-string", () => {
    const result = validatePrompt(123);
    expect(result.valid).toBe(false);
  });

  it("rejects prompt over 2000 characters", () => {
    const longPrompt = "a".repeat(2001);
    const result = validatePrompt(longPrompt);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("2000");
  });

  it("accepts prompt at exactly 2000 characters", () => {
    const maxPrompt = "a".repeat(2000);
    const result = validatePrompt(maxPrompt);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validatePython (integration — requires python3)
// ---------------------------------------------------------------------------
describe("validatePython", () => {
  let validatePython;
  beforeAll(async () => {
    const mod = await import("../utils.js");
    validatePython = mod.validatePython;
  });

  it("validates correct Python syntax", () => {
    const result = validatePython('print("hello")');
    expect(result.valid).toBe(true);
  });

  it("detects syntax error", () => {
    const result = validatePython("def foo(:\n  pass");
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("detects indentation error", () => {
    const result = validatePython("def foo():\npass");
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("handles empty input", () => {
    const result = validatePython("");
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// detectPython
// ---------------------------------------------------------------------------
describe("detectPython", () => {
  let detectPython;
  beforeAll(async () => {
    const mod = await import("../utils.js");
    detectPython = mod.detectPython;
  });

  it("returns a string", () => {
    const result = detectPython();
    expect(typeof result).toBe("string");
  });

  it("returns python or python3", () => {
    const result = detectPython();
    expect(["python", "python3"]).toContain(result);
  });
});

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync } from "fs";
import { stripMarkdown, validatePython } from "./utils.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import "dotenv/config";

const anthropic = new Anthropic({
  apiKey: process.env.MIMO_API_KEY,
  baseURL: process.env.MIMO_BASE_URL || "https://token-plan-sgp.xiaomimimo.com/anthropic",
});

// ---------------------------------------------------------------------------
// Test prompts — one per feature
// ---------------------------------------------------------------------------
const TEST_PROMPTS = {
  // === CREATE ===
  "Extrude":          "Create a 5x5x5cm box using sketch and extrude",
  "Revolve":          "Create a cylinder 3cm radius 8cm height using revolve",
  "Sweep":            "Create a circular pipe 1cm radius along 10cm straight path",
  "Loft":             "Loft between 4cm square at bottom and 2cm circle at top 5cm height",
  "Rib":              "Create box 10x10x5cm then add rib 3cm tall 0.5cm thick",
  "Web":              "Create two walls 5cm apart then add web connecting them",
  "Emboss":           "Create box 10x10x2cm then emboss text 'A' on top face 0.2cm deep",
  "Hole":             "Create cylinder 5cm diameter 10cm height then add M6 hole at center",
  "Thread":           "Create cylinder 0.6cm radius 3cm height then add M6 thread",
  "Box":              "Create a box primitive 5x4x3cm",
  "Cylinder":         "Create cylinder primitive 2cm radius 8cm height",
  "Sphere":           "Create sphere primitive 3cm radius",
  "Torus":            "Create torus major radius 4cm minor radius 1cm",
  "Coil":             "Create compression spring coil diameter 2cm wire 0.2cm 8 turns 4cm height",
  "Pipe":             "Create pipe 1cm radius along 10cm straight line",
  "Pattern":          "Create 2x2x2cm box then rectangular pattern 3x3 spacing 5cm",
  "Mirror":           "Create box 3x3x3cm offset 3cm then mirror across YZ plane",
  "Thicken":          "Create flat surface 10x10cm then thicken 0.5cm",
  "Boundary Fill":    "Create enclosed volume with surfaces then boundary fill",

  // === MODIFY ===
  "Press Pull":       "Create box 5x5x5cm then press pull top face outward 2cm",
  "Fillet":           "Create box 5x5x5cm then add 0.3cm fillet on all top edges",
  "Chamfer":          "Create box 5x5x5cm then add 0.2cm chamfer on top edges",
  "Shell":            "Create box 10x8x6cm then shell with 0.3cm wall removing top face",
  "Draft":            "Create box 5x5x5cm then add 5 degree draft to side faces",
  "Scale":            "Create box 3x3x3cm then scale by factor 2",
  "Combine":          "Create two overlapping 4x4x4cm boxes then join them",
  "Offset Face":      "Create box 5x5x5cm then offset top face by 1cm",
  "Replace Face":     "Create box 5x5x5cm then replace top face with angled face",
  "Split Face":       "Create box 5x5x5cm then split top face with a line",
  "Split Body":       "Create box 10x10x10cm then split with XY construction plane",
  "Silhouette Split": "Create sphere 5cm radius then silhouette split on XY plane",
  "Move/Copy":        "Create box 3x3x3cm then move it 5cm along X axis",
  "Align":            "Create two boxes then align second box to first",
  "Scale Body":       "Create cylinder 2cm radius 5cm height then scale by 1.5",
  "Physical Material": "Create box 5x5x5cm then assign Steel material",
  "Appearance":       "Create box 5x5x5cm then assign brushed aluminum appearance",
  "Change Parameters": "Create box with parameter width=5cm then change width to 8cm",
};

// ---------------------------------------------------------------------------
// STRESS TEST — Complex multi-feature prompts
// Run with: node test-features.js --stress
// ---------------------------------------------------------------------------
const STRESS_PROMPTS = {
  "Gearbox Assembly":    "Create a simple gearbox: 4 spur gears (20 teeth each, module 0.2) mounted on 4 parallel shafts inside a rectangular enclosure 15x10x8cm with 0.3cm walls. Each shaft should be 0.8cm diameter passing through the enclosure walls.",
  "Piston Assembly":     "Create a piston assembly: cylinder bore 5cm diameter 10cm height, piston head 4.8cm diameter 3cm height inside the bore, connecting rod 1cm diameter 8cm long attached to piston, and a wrist pin 0.5cm diameter through the piston.",
  "Drone Frame X-Shape": "Create an X-frame drone body: center plate 5x5x0.5cm, four arms extending 12cm each at 45-degree angles, each arm 1.5cm wide 0.5cm thick, with circular motor mount pads 3cm diameter at each arm tip, and 4 mounting holes 0.3cm diameter on each pad.",
  "Flanged Pipe Network": "Create a T-shaped pipe junction: main pipe 3cm outer diameter 2.4cm inner diameter 20cm long, with a perpendicular branch pipe 2cm outer diameter 1.6cm inner diameter 10cm long at the center, plus flanges 7cm diameter 0.5cm thick at all 3 open ends with 4 bolt holes each.",
  "Bearing Block Array":  "Create 3 bearing blocks in a row: each block has a rectangular base 8x4x2cm, a cylindrical bore 3cm diameter through the center, two mounting holes 0.8cm diameter at each end, spaced 15cm apart center-to-center, connected by a base plate 45x4x0.5cm.",
  "Multi-Feature Part":   "Create a complex mechanical part: start with a cylinder 5cm radius 15cm height, add a flange 8cm radius 1cm thick at the bottom, add 6 bolt holes 0.4cm radius on the flange in a circle, add a keyway 1cm wide 0.5cm deep on the cylinder shaft, then fillet all edges 0.1cm.",
  "Enclosure with Ribs":  "Create an electronics enclosure: outer box 15x10x5cm with 0.3cm walls, add 4 internal ribs 0.3cm thick running the full height spaced equally, add 4 mounting bosses 1cm diameter with 0.4cm holes in the corners, and add a lip 0.2cm tall 0.3cm wide around the top edge.",
  "Helical Gear Pair":    "Create two meshing spur gears: gear 1 with 24 teeth module 0.2 on a shaft 1cm diameter, gear 2 with 16 teeth module 0.2 on a parallel shaft spaced 4cm apart, both gears 1cm thick, with bearing blocks supporting each shaft.",
};

// ---------------------------------------------------------------------------
// Test one feature
// ---------------------------------------------------------------------------
async function testFeature(featureName, prompt) {
  process.stdout.write("  " + featureName.padEnd(22) + " ");
  try {
    const message = await anthropic.messages.create({
      model: process.env.MIMO_MODEL || "mimo-v2.5-pro",
      max_tokens: 4096,
      thinking: { type: "disabled" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content.find(b => b.type === "text")?.text || "";
    const code = stripMarkdown(raw);

    if (!code.trim()) {
      console.log("❌ EMPTY");
      return { feature: featureName, status: "❌ EMPTY", error: "AI returned empty response", code: "" };
    }

    const validation = validatePython(code);

    if (validation.valid) {
      console.log("✅ PASS (" + code.length + " chars)");
      return { feature: featureName, status: "✅ PASS", codeLength: code.length, code };
    } else {
      console.log("⚠️  SYNTAX ERROR: " + (validation.error || "").slice(0, 60));
      return { feature: featureName, status: "⚠️ SYNTAX ERROR", error: validation.error, code };
    }
  } catch (err) {
    console.log("❌ API ERROR: " + (err.message || "").slice(0, 60));
    return { feature: featureName, status: "❌ API ERROR", error: err.message, code: "" };
  }
}

// ---------------------------------------------------------------------------
// Generate markdown report
// ---------------------------------------------------------------------------
function generateMarkdownReport(report, results) {
  const { summary } = report;
  const passed = results.filter(r => r.status.includes("✅"));
  const warned = results.filter(r => r.status.includes("⚠️"));
  const failed = results.filter(r => r.status.includes("❌"));
  const sep = "---";

  return "# Fusion 360 Feature Coverage Report\n\n" +
    "Generated: " + report.timestamp + "\n" +
    "Model: " + report.model + "\n\n" +
    "## Summary\n\n" +
    "| Metric | Value |\n|--------|-------|\n" +
    "| ✅ Passed | " + summary.passed + "/" + summary.total + " |\n" +
    "| ⚠️ Syntax Errors | " + summary.warned + "/" + summary.total + " |\n" +
    "| ❌ Failed/Empty | " + summary.failed + "/" + summary.total + " |\n" +
    "| 📊 Coverage | " + summary.coverage + "% |\n\n" +
    sep + "\n\n" +
    "## ✅ Working Features (" + passed.length + ")\n\n" +
    "| Feature | Code Length |\n|---------|-------------|\n" +
    passed.map(r => "| " + r.feature + " | " + r.codeLength + " chars |").join("\n") + "\n\n" +
    sep + "\n\n" +
    "## ⚠️ Features with Syntax Errors (" + warned.length + ")\n\n" +
    "| Feature | Error |\n|---------|-------|\n" +
    warned.map(r => "| " + r.feature + " | " + (r.error || "").slice(0, 80) + " |").join("\n") + "\n\n" +
    sep + "\n\n" +
    "## ❌ Failed / Missing Features (" + failed.length + ")\n\n" +
    "| Feature | Error | Action |\n|---------|-------|--------|\n" +
    failed.map(r => "| " + r.feature + " | " + (r.error || "").slice(0, 50) + " | Add to system prompt |").join("\n") + "\n\n" +
    sep + "\n\n" +
    "## Recommendations\n\n" +
    (failed.length > 0 ? "### Must Add to System Prompt:\n" + failed.map(r => "- **" + r.feature + "**: " + (r.error || "").slice(0, 80)).join("\n") : "All features covered! ✅") +
    (warned.length > 0 ? "\n\n### Must Fix Syntax:\n" + warned.map(r => "- **" + r.feature + "**: " + (r.error || "").slice(0, 80)).join("\n") : "");
}

// ---------------------------------------------------------------------------
// Run standard tests
// ---------------------------------------------------------------------------
async function runAllTests() {
  const sep = "=".repeat(60);
  console.log(sep);
  console.log("FUSION 360 FEATURE COVERAGE TEST");
  console.log("Model: " + (process.env.MIMO_MODEL || "mimo-v2.5-pro"));
  console.log("Time: " + new Date().toISOString());
  console.log("Features: " + Object.keys(TEST_PROMPTS).length);
  console.log(sep + "\n");

  const results = [];

  for (const [feature, prompt] of Object.entries(TEST_PROMPTS)) {
    const result = await testFeature(feature, prompt);
    results.push(result);
    await new Promise(r => setTimeout(r, 1500));
  }

  const passed  = results.filter(r => r.status.includes("✅")).length;
  const warned  = results.filter(r => r.status.includes("⚠️")).length;
  const failed  = results.filter(r => r.status.includes("❌")).length;
  const total   = results.length;
  const coverage = Math.round((passed / total) * 100);

  console.log("\n" + sep);
  console.log("RESULTS");
  console.log(sep);
  results.forEach(r => {
    console.log(r.status.padEnd(20) + " " + r.feature);
    if (r.error) console.log("".padEnd(20) + " → " + r.error.slice(0, 80));
  });

  console.log("\n" + sep);
  console.log("SUMMARY");
  console.log("✅ Passed:        " + passed + "/" + total);
  console.log("⚠️  Syntax errors: " + warned + "/" + total);
  console.log("❌ Failed/Empty:  " + failed + "/" + total);
  console.log("📊 Coverage:      " + coverage + "%");
  console.log(sep);

  const report = {
    timestamp: new Date().toISOString(),
    model: process.env.MIMO_MODEL || "mimo-v2.5-pro",
    summary: { passed, warned, failed, total, coverage },
    results: results.map(r => ({
      feature: r.feature,
      status: r.status,
      codeLength: r.codeLength || 0,
      error: r.error || null,
    })),
  };

  writeFileSync("test-report.json", JSON.stringify(report, null, 2));
  writeFileSync("test-report.md", generateMarkdownReport(report, results));

  console.log("\n📄 Reports saved:");
  console.log("   test-report.json");
  console.log("   test-report.md");
}

// ---------------------------------------------------------------------------
// Run stress tests
// ---------------------------------------------------------------------------
async function runStressTests() {
  const sep = "=".repeat(60);
  console.log(sep);
  console.log("FUSION 360 STRESS TEST — Complex Multi-Feature");
  console.log("Model: " + (process.env.MIMO_MODEL || "mimo-v2.5-pro"));
  console.log("Time: " + new Date().toISOString());
  console.log("Features: " + Object.keys(STRESS_PROMPTS).length);
  console.log(sep + "\n");

  const results = [];

  for (const [feature, prompt] of Object.entries(STRESS_PROMPTS)) {
    const result = await testFeature(feature, prompt);
    results.push(result);
    await new Promise(r => setTimeout(r, 2000));
  }

  const passed  = results.filter(r => r.status.includes("✅")).length;
  const warned  = results.filter(r => r.status.includes("⚠️")).length;
  const failed  = results.filter(r => r.status.includes("❌")).length;
  const total   = results.length;
  const coverage = Math.round((passed / total) * 100);

  console.log("\n" + sep);
  console.log("STRESS TEST RESULTS");
  console.log(sep);
  results.forEach(r => {
    console.log(r.status.padEnd(20) + " " + r.feature);
    if (r.error) console.log("".padEnd(20) + " → " + r.error.slice(0, 80));
  });

  console.log("\n" + sep);
  console.log("SUMMARY");
  console.log("✅ Passed:        " + passed + "/" + total);
  console.log("⚠️  Syntax errors: " + warned + "/" + total);
  console.log("❌ Failed/Empty:  " + failed + "/" + total);
  console.log("📊 Coverage:      " + coverage + "%");
  console.log(sep);

  const report = {
    timestamp: new Date().toISOString(),
    model: process.env.MIMO_MODEL || "mimo-v2.5-pro",
    type: "stress",
    summary: { passed, warned, failed, total, coverage },
    results: results.map(r => ({
      feature: r.feature,
      status: r.status,
      codeLength: r.codeLength || 0,
      error: r.error || null,
    })),
  };

  writeFileSync("stress-report.json", JSON.stringify(report, null, 2));
  writeFileSync("stress-report.md", generateMarkdownReport(report, results).replace("Coverage Report", "Stress Test Report"));

  console.log("\n📄 Reports saved:");
  console.log("   stress-report.json");
  console.log("   stress-report.md");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
const isStress = process.argv.includes("--stress");
if (isStress) {
  console.log("🔥 STRESS TEST MODE\n");
  runStressTests().catch(console.error);
} else {
  runAllTests().catch(console.error);
}

// ---------------------------------------------------------------------------
// Fusion AI Generator — Backend Server
// Express.js + Groq API (streaming) + WebSocket + Addin proxy
// ---------------------------------------------------------------------------

import "dotenv/config";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";
import Groq from "groq-sdk";

const PORT = process.env.PORT || 3001;
const FUSION_ADDIN_URL = process.env.FUSION_ADDIN_URL || "http://localhost:8080";

// ---------------------------------------------------------------------------
// Groq client
// ---------------------------------------------------------------------------
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ---------------------------------------------------------------------------
// System prompt — strict Fusion 360 Python output
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a Fusion 360 Python scripting expert. Your ONLY job is to output valid, executable Python code for the Fusion 360 API.

STRICT RULES:
1. Output ONLY raw Python code. No markdown fences, no explanations, no comments about what the code does before or after.
2. The code will be executed via exec() with these variables pre-injected into scope:
   - adsk, adsk.core, adsk.fusion
   - app (adsk.core.Application)
   - ui (app.userInterface)
   - design (adsk.fusion.Design — the active product)
   - rootComp (design.rootComponent)
3. Do NOT import adsk or call adsk.core.Application.get() — they are already available.
4. Fusion 360 internal units are CENTIMETERS (cm). All dimensions must be in cm.
   - If user says "5mm", convert to 0.5 cm.
   - If user says "1 inch", convert to 2.54 cm.
   - If user says "5cm", use 5.0 directly.
   - If no unit is specified, assume cm.
5. Always wrap the main logic in try/except and show errors via ui.messageBox().
6. Use design.designType = adsk.fusion.DesignTypes.DirectDesignType when needed.
7. Prefer creating sketches, profiles, and extrude features for solid bodies.
8. Always call adsk.autoTerminate(False) at the start if doing UI operations.

CRITICAL RULES TO AVOID COMMON ERRORS:
- "Bad index parameter" error means sketch.profiles.item(0) failed — profile not formed. Always ensure sketch is CLOSED before accessing profiles.
- For hexagon: NEVER draw 6 separate lines. Use a polygon via sketchCurves.sketchLines and close it properly, OR use a circumscribed polygon approach with sketchCurves.
- Always verify sketch is closed: all line endpoints must connect exactly.
- For complex shapes like hex, use this pattern:
  import math
  cx, cy, r = 0, 0, radius
  points = [adsk.core.Point3D.create(cx + r*math.cos(math.pi/180*(60*i+30)), cy + r*math.sin(math.pi/180*(60*i+30)), 0) for i in range(6)]
  lines = sketch.sketchCurves.sketchLines
  for i in range(6):
      lines.addByTwoPoints(points[i], points[(i+1)%6])
- After drawing, always check: prof = sketch.profiles.item(0) — wrap in try/except
- For multi-body (e.g. bolt head + shaft): create separate sketches on separate planes for each body
- NEVER use extInput.setDirection() — it does not exist
- For extrude direction use: extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(value)) for one direction
- For extrude downward (negative): extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(-value))
- NEVER use rootComp.occurrences.component — rootComp IS the component, use it directly
- NEVER use rootComp.occurrences for geometry access — only use rootComp.sketches, rootComp.features, rootComp.constructionPlanes directly
- For offset plane (e.g. shaft below head): use rootComp.constructionPlanes with createInput + setByOffset

CORRECT FUSION 360 API METHODS (follow exactly):
- Rectangle : sketch.sketchCurves.sketchLines.addTwoPointRectangle(p1, p2)
- Circle    : sketch.sketchCurves.sketchCircles.addByCenterRadius(center, radius) — NEVER .add()
- Line      : sketch.sketchCurves.sketchLines.addByTwoPoints(p1, p2)
- Extrude   : rootComp.features.extrudeFeatures.createInput(profile, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
             then extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(value))
             then rootComp.features.extrudeFeatures.add(extInput)
- Fillet    : filletInput = rootComp.features.filletFeatures.createInput()
             filletInput.addConstantRadiusEdgeSet(edges, adsk.core.ValueInput.createByReal(radius), True)
             rootComp.features.filletFeatures.add(filletInput)
- Shell     : shellInput = rootComp.features.shellFeatures.createInput(faces, False)
             shellInput.insideThickness = adsk.core.ValueInput.createByReal(thickness)
             rootComp.features.shellFeatures.add(shellInput)
- Hole      : holeInput = rootComp.features.holeFeatures.createSimpleInput(adsk.core.ValueInput.createByReal(diameter))
             holeInput.setPositionByPoint(sketch, centerPoint)
             rootComp.features.holeFeatures.add(holeInput)
- Point3D   : adsk.core.Point3D.create(x, y, z)
- ValueInput: adsk.core.ValueInput.createByReal(value)

EXAMPLE — HEX BOLT (head diameter 13mm=1.3cm, head height 5mm=0.5cm, shaft diameter 8mm=0.8cm, shaft length 30mm=3.0cm):
try:
    # --- Hex head (EXACTLY 6 points, EXACTLY 6 lines) ---
    xyPlane = rootComp.xYConstructionPlane
    headSketch = rootComp.sketches.add(xyPlane)
    r = 0.65  # half of 1.3cm
    pts = []
    for i in range(6):
        angle = math.radians(60 * i)
        pts.append(adsk.core.Point3D.create(r * math.cos(angle), r * math.sin(angle), 0))
    lines = headSketch.sketchCurves.sketchLines
    for i in range(6):
        lines.addByTwoPoints(pts[i], pts[(i + 1) % 6])
    headProf = headSketch.profiles.item(0)
    extHeadInput = rootComp.features.extrudeFeatures.createInput(headProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extHeadInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(0.5))
    rootComp.features.extrudeFeatures.add(extHeadInput)

    # --- Shaft ---
    planes = rootComp.constructionPlanes
    planeInput = planes.createInput()
    planeInput.setByOffset(xyPlane, adsk.core.ValueInput.createByReal(0.5))
    shaftPlane = planes.add(planeInput)
    shaftSketch = rootComp.sketches.add(shaftPlane)
    shaftSketch.sketchCurves.sketchCircles.addByCenterRadius(
        adsk.core.Point3D.create(0, 0, 0), 0.4)
    shaftProf = shaftSketch.profiles.item(0)
    extShaftInput = rootComp.features.extrudeFeatures.createInput(shaftProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extShaftInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(3.0))
    rootComp.features.extrudeFeatures.add(extShaftInput)
    ui.messageBox("Hex bolt created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE OUTPUT FORMAT (for "create a 5cm cube"):
try:
    sketches = rootComp.sketches
    xyPlane = rootComp.xYConstructionPlane
    sketch = sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    lines.addTwoPointRectangle(
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create(5, 5, 0)
    )
    prof = sketch.profiles.item(0)
    extrudes = rootComp.features.extrudeFeatures
    extInput = extrudes.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    distance = adsk.core.ValueInput.createByReal(5)
    extInput.setDistanceExtent(False, distance)
    extrudes.add(extInput)
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
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const code = completion.choices[0]?.message?.content || "";
    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Helper: strip markdown fences dari output Groq
// ---------------------------------------------------------------------------
function stripMarkdown(code) {
  return code
    .replace(/^```[\w]*\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();
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

    // Signal generation start
    ws.send(JSON.stringify({ type: "start" }));

    let fullCode = "";

    try {
      // Stream dari Groq
      const stream = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          fullCode += text;
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: "token", content: text }));
          }
        }
      }

      // Generation complete — strip markdown dulu
      fullCode = stripMarkdown(fullCode);

      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "complete", code: fullCode }));
      }

      // Auto-send to Fusion addin if requested
      if (autoSend && fullCode.trim()) {
        try {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: "fusion_sending" }));
          }

          const fusionRes = await fetch(FUSION_ADDIN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: fullCode }),
          });

          const fusionResult = await fusionRes.json();

          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({
              type: "fusion_result",
              success: fusionResult.success,
              message: fusionResult.message,
            }));
          }
        } catch (fusionErr) {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({
              type: "fusion_error",
              message: "Cannot reach Fusion 360 addin: " + fusionErr.message,
            }));
          }
        }
      }
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
  console.log(`\n🚀 Fusion AI Backend running on http://localhost:${PORT}`);
  console.log(`   WebSocket endpoint: ws://localhost:${PORT}/ws/generate`);
  console.log(`   Fusion addin target: ${FUSION_ADDIN_URL}\n`);
});
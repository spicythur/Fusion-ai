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
- Extrude   : extInput = rootComp.features.extrudeFeatures.createInput(profile, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
              extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(value))
              rootComp.features.extrudeFeatures.add(extInput)
- Revolve   : revInput = rootComp.features.revolveFeatures.createInput(profile, axis, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
              revInput.setAngleExtent(False, adsk.core.ValueInput.createByReal(math.radians(360)))
              rootComp.features.revolveFeatures.add(revInput)
- Fillet    : edges = adsk.core.ObjectCollection.create()
              edges.add(body.faces.item(0).edges.item(0))
              filletInput = rootComp.features.filletFeatures.createInput()
              filletInput.addConstantRadiusEdgeSet(edges, adsk.core.ValueInput.createByReal(radius), True)
              rootComp.features.filletFeatures.add(filletInput)
- Chamfer   : edges = adsk.core.ObjectCollection.create()
              edges.add(body.faces.item(0).edges.item(0))
              chamferInput = rootComp.features.chamferFeatures.createInput(edges, True)
              chamferInput.setToEqualDistance(adsk.core.ValueInput.createByReal(value))
              rootComp.features.chamferFeatures.add(chamferInput)
              NOTE: createInput needs (edges, isTangentChain) — 2 required args
- Shell     : faces = adsk.core.ObjectCollection.create()
              faces.add(body.faces.item(0))
              shellInput = rootComp.features.shellFeatures.createInput(faces, False)
              shellInput.insideThickness = adsk.core.ValueInput.createByReal(thickness)
              rootComp.features.shellFeatures.add(shellInput)
- Hole      : holeInput = rootComp.features.holeFeatures.createSimpleInput(adsk.core.ValueInput.createByReal(diameter))
              holeInput.setPositionByPoint(sketch, centerPoint)
              rootComp.features.holeFeatures.add(holeInput)
- Thread    : threadFace = body.faces.item(0)
              threadInfo = rootComp.features.threadFeatures.threadDataQuery.recommendThreadData(threadFace)
              threadInput = rootComp.features.threadFeatures.createInput(threadFace, threadInfo)
              rootComp.features.threadFeatures.add(threadInput)
- Mirror    : mirrorEntities = adsk.core.ObjectCollection.create()
              mirrorEntities.add(extFeature)
              mirrorInput = rootComp.features.mirrorFeatures.createInput(mirrorEntities, mirrorPlane)
              rootComp.features.mirrorFeatures.add(mirrorInput)
- Pattern   : inputEntities = adsk.core.ObjectCollection.create()
              inputEntities.add(body)
              patternInput = rootComp.features.rectangularPatternFeatures.createInput(
                  inputEntities, xAxis,
                  adsk.core.ValueInput.createByReal(countX),
                  adsk.core.ValueInput.createByReal(spacingX),
                  adsk.fusion.PatternDistanceType.SpacingPatternDistanceType)
              rootComp.features.rectangularPatternFeatures.add(patternInput)
              NOTE: NEVER use PatternDistanceType.ModelParameter — use SpacingPatternDistanceType
- Move      : bodies = adsk.core.ObjectCollection.create()
              bodies.add(body)
              transform = adsk.core.Matrix3D.create()
              transform.translation = adsk.core.Vector3D.create(x, y, z)
              moveInput = rootComp.features.moveFeatures.createInput(bodies, transform)
              rootComp.features.moveFeatures.add(moveInput)
              NOTE: createInput needs (bodies, transform) — 2 required args
- Sweep     : sweepInput = rootComp.features.sweepFeatures.createInput(profile, path, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
              rootComp.features.sweepFeatures.add(sweepInput)
- Loft      : loftInput = rootComp.features.loftFeatures.createInput(adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
              loftInput.loftSections.add(profile1)
              loftInput.loftSections.add(profile2)
              rootComp.features.loftFeatures.add(loftInput)
- Sphere    : NEVER use rootComp.features.sphereFeatures.createInput() — it does NOT exist!
              Create sphere via revolve: draw semicircle on sketch, revolve 360 degrees around diameter axis:
              sk = rootComp.sketches.add(rootComp.xYConstructionPlane)
              lines = sk.sketchCurves.sketchLines
              arcs = sk.sketchCurves.sketchArcs
              center = adsk.core.Point3D.create(0, 0, 0)
              top = adsk.core.Point3D.create(0, radius, 0)
              bot = adsk.core.Point3D.create(0, -radius, 0)
              arcs.addByCenterStartEnd(center, top, bot)
              lines.addByTwoPoints(bot, top)
              prof = sk.profiles.item(0)
              axisLine = sk.sketchCurves.sketchLines.item(sk.sketchCurves.sketchLines.count - 1)
              revInput = rootComp.features.revolveFeatures.createInput(prof, axisLine, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
              revInput.setAngleExtent(False, adsk.core.ValueInput.createByReal(math.radians(360)))
              rootComp.features.revolveFeatures.add(revInput)
- BRepEdge  : NEVER use edge.loop — it does NOT exist!
              To get all edges of a face: face.edges (returns BRepEdges collection)
              To get edges of a body: body.edges
              To loop edges: for edge in body.edges: ...
              To get specific edge by index: body.edges.item(0) Always use small radius (max 10-20% of smallest dimension). If fillet fails, skip it and inform user via ui.messageBox.
- Invalid input points: sketch points must be valid 3D points. Always use adsk.core.Point3D.create(x, y, z) with explicit float values. Never pass None or invalid coordinates.
              toolBodies.add(toolBody)
              combineInput = rootComp.features.combineFeatures.createInput(targetBody, toolBodies)
              combineInput.operation = adsk.fusion.FeatureOperations.JoinFeatureOperation
              rootComp.features.combineFeatures.add(combineInput)
              NOTE: createInput needs (targetBody, toolBodies) — toolBodies must be ObjectCollection
- SplitBody : splitInput = rootComp.features.splitBodyFeatures.createInput(bodyToSplit, splittingTool, True)
              rootComp.features.splitBodyFeatures.add(splitInput)
              NOTE: createInput needs (bodyToSplit, splittingTool, isSplittingToolExtended) — 3 required args
- Get body  : body = rootComp.bRepBodies.item(0) — NEVER rootComp.bodies or component.bodies
- Point3D   : adsk.core.Point3D.create(x, y, z)
- ValueInput: adsk.core.ValueInput.createByReal(value)
- Collection: adsk.core.ObjectCollection.create() then .add() items

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
// Helper: fix indentasi — normalize ke 4 spaces
// ---------------------------------------------------------------------------
function fixIndentation(code) {
  const lines = code.split("\n");
  const fixed = lines.map((line) => {
    // Convert tabs to 4 spaces
    return line.replace(/\t/g, "    ");
  });
  return fixed.join("\n");
}

// ---------------------------------------------------------------------------
// Helper: pecah prompt kompleks jadi array of steps via Groq
// ---------------------------------------------------------------------------
async function decomposePrompt(prompt) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a 3D modeling planning expert for Fusion 360.
Your job is to break down a complex 3D modeling request into simple sequential steps.
Each step must be ONE simple geometry operation (create a shape, add a feature, etc).
Output ONLY a valid JSON array of strings. No explanation, no markdown, no extra text.
Example output: ["Create hexagon head 13mm diameter 5mm height", "Create cylinder shaft 8mm diameter 30mm length centered below head", "Add chamfer 1mm on bottom edge of shaft"]`
      },
      {
        role: "user",
        content: `Break this into simple sequential Fusion 360 modeling steps: ${prompt}`
      }
    ],
  });

  const raw = stripMarkdown(completion.choices[0]?.message?.content || "[]");
  try {
    const steps = JSON.parse(raw);
    return Array.isArray(steps) ? steps : [prompt];
  } catch {
    return [prompt]; // fallback ke prompt original kalau parse gagal
  }
}

// ---------------------------------------------------------------------------
// Helper: generate script untuk satu step
// ---------------------------------------------------------------------------
async function generateScript(stepPrompt) {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: stepPrompt },
    ],
  });
  return stripMarkdown(completion.choices[0]?.message?.content || "");
}

// ---------------------------------------------------------------------------
// Helper: kirim script ke Fusion addin
// ---------------------------------------------------------------------------
async function sendToFusion(code) {
  const fusionRes = await fetch(FUSION_ADDIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return fusionRes.json();
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

    ws.send(JSON.stringify({ type: "start" }));

    try {
      // Step 1: Decompose prompt jadi beberapa step
      ws.send(JSON.stringify({ type: "decomposing", message: "Memecah prompt jadi langkah-langkah..." }));
      const steps = await decomposePrompt(prompt);
      ws.send(JSON.stringify({ type: "steps", steps }));

      // Step 2: Loop tiap step — generate script + kirim ke Fusion
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepNum = i + 1;
        const totalSteps = steps.length;

        // Kasih tau frontend lagi di step berapa
        ws.send(JSON.stringify({
          type: "step_start",
          step: stepNum,
          total: totalSteps,
          message: `Step ${stepNum}/${totalSteps}: ${step}`,
        }));

        // Generate script untuk step ini
        ws.send(JSON.stringify({ type: "generating", step: stepNum, message: `Generating script untuk step ${stepNum}...` }));
        let code = "";

        const stream = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: step },
          ],
          stream: true,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            code += text;
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ type: "token", step: stepNum, content: text }));
            }
          }
        }

        code = stripMarkdown(code);
      code = fixIndentation(code);

        ws.send(JSON.stringify({ type: "step_complete", step: stepNum, code }));

        // Kirim ke Fusion kalau autoSend
        if (autoSend && code.trim()) {
          ws.send(JSON.stringify({ type: "fusion_sending", step: stepNum, message: `Mengirim step ${stepNum} ke Fusion 360...` }));
          try {
            const result = await sendToFusion(code);
            ws.send(JSON.stringify({
              type: "fusion_result",
              step: stepNum,
              success: result.success,
              message: result.message,
            }));

            // Kalau step gagal di Fusion, stop dan kasih tau user
            if (!result.success) {
              ws.send(JSON.stringify({
                type: "error",
                message: `Step ${stepNum} gagal di Fusion: ${result.message}`,
              }));
              break;
            }
          } catch (fusionErr) {
            ws.send(JSON.stringify({
              type: "fusion_error",
              step: stepNum,
              message: "Cannot reach Fusion 360 addin: " + fusionErr.message,
            }));
            break;
          }
        }
      }

      ws.send(JSON.stringify({ type: "done", message: "Semua step selesai!" }));

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
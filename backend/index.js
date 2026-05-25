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

const PORT = process.env.PORT || 3001;
const FUSION_ADDIN_URL = process.env.FUSION_ADDIN_URL || "http://localhost:8080";
const GENERATION_TIMEOUT = 120000; // 2 minutes

// ---------------------------------------------------------------------------
// Detect Python command once at startup
// ---------------------------------------------------------------------------
function detectPython() {
  for (const cmd of ["python", "python3"]) {
    try {
      execFileSync(cmd, ["--version"], { stdio: "pipe" });
      return cmd;
    } catch {}
  }
  return "python";
}
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
const SYSTEM_PROMPT = `You are a Fusion 360 Python API expert. Output ONLY raw Python code. No markdown, no explanations.

VARIABLES (pre-injected, NEVER redefine):
- adsk, adsk.core, adsk.fusion
- app, ui, rootComp
- math, traceback

UNITS: Always cm. 10mm = 1cm. Example: 50mm = 5.0, 8mm = 0.8

STRUCTURE: Always wrap in try:/except:
try:
    # your code here
    ui.messageBox("Done!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

===== FORBIDDEN (will cause errors) =====
- NEVER use rootComp.features.revolveFeatures (does not exist)
- NEVER use rootComp.features.sweepFeatures for non-sweepable profiles (use only for helical/pipe paths with simple cross-sections)
- NEVER use rootComp.features.shellFeatures (face indexing unreliable)
- NEVER use rootComp.features.holeFeatures (use sketch circle + extrude cut)
- NEVER use rootComp.features.threadFeatures (does not exist)
- NEVER use "design" variable (not available, use rootComp directly)
- NEVER use "design.rootComp" (does not exist)
- NEVER import adsk (already pre-injected)
- NEVER create new components (single component mode only)
- NEVER use faces.item(N) with hardcoded N (face ordering not guaranteed)
- NEVER use Profile.area (does not exist — use profiles.item(0) or profileLoops.count)
- NEVER create constructionPlanes inside loops (use one shared plane for all similar features)

===== PERFORMANCE LIMIT =====
- MAX 15 extrude operations per script. More than that may timeout.
- For decorative features (ridges, knurling): use max 8 cuts, not 24+.
- Prefer fewer, larger operations over many tiny ones.
- NEVER create construction planes inside loops — use a single shared plane.
- NEVER use Profile.area — this attribute does not exist. Use profileLoops.count or just profiles.item(0).
- For D-shaft: draw circle + flat line on same sketch. profiles.item(0) gives the D-profile (largest closed region).

===== ALLOWED API =====
- Sketches: rootComp.sketches.add(plane)
- Lines: sketch.sketchCurves.sketchLines.addByTwoPoints(p1, p2)
- Rectangles: sketch.sketchCurves.sketchLines.addTwoPointRectangle(p1, p2)
- Circles: sketch.sketchCurves.sketchCircles.addByCenterRadius(center, radius)
- Splines: sketch.sketchCurves.sketchFittedSplines.add(pointsCollection)
- Points: adsk.core.Point3D.create(x, y, z)
- Collections: adsk.core.ObjectCollection.create()
- Extrude: rootComp.features.extrudeFeatures
- Sweep: pathCurves = adsk.core.ObjectCollection.create(); pathCurves.add(curve); path = rootComp.features.createPath(pathCurves); sweepInput = rootComp.features.sweepFeatures.createInput(profile, path, operation); sweepInput.isSolid = True; rootComp.features.sweepFeatures.add(sweepInput)
- Profiles: sketch.profiles.item(0)
- Construction planes: rootComp.xYConstructionPlane, rootComp.xZConstructionPlane, rootComp.yZConstructionPlane
- Offset planes: rootComp.constructionPlanes.createInput() + .setByOffset()
- Fillet: rootComp.features.filletFeatures
- Chamfer: rootComp.features.chamferFeatures
- Taper: extInput.taperAngle = adsk.core.ValueInput.createByReal(radians) — property, NOT method
- Join to existing body: extInput.participantBodies = [body]

===== EXTRUDE OPERATIONS =====
- New body: adsk.fusion.FeatureOperations.NewBodyFeatureOperation
- Cut: adsk.fusion.FeatureOperations.CutFeatureOperation
- Join: adsk.fusion.FeatureOperations.JoinFeatureOperation

===== JOINING BODIES =====
When adding features to an existing body (posts, bosses, flanges, shafts):
1. Use JoinFeatureOperation
2. MUST set extInput.participantBodies = [body] where body is the target body
3. Get body from: bodyFeat = rootComp.features.extrudeFeatures.add(...); body = bodyFeat.bodies.item(0)
Without participantBodies, JoinFeatureOperation creates a SEPARATE body (won't merge).
For the FIRST feature: use NewBodyFeatureOperation, capture body = feat.bodies.item(0)
For SUBSEQUENT features: use JoinFeatureOperation + participantBodies = [body]

===== PROFILE SELECTION RULES =====
When a sketch has multiple closed regions (e.g., concentric circles):
- profiles.item(0) is the FIRST closed region found, but ordering is NOT guaranteed
- For annular ring (hollow): draw outer circle first, inner second. profiles.item(0) is usually the ring.
- CRITICAL: For multiple cut holes (bolt holes, mounting holes): use SEPARATE sketch per hole.
  Do NOT put multiple circles in one sketch for cutting — profiles.item(0) only selects ONE profile.
  Loop pattern: for each hole, create a new sketch, draw one circle, extrude-cut.
- When unsure, use sketch.profiles.count to check.

===== TAPER / CONE =====
Use extrude with taperAngle PROPERTY (not a method). taperAngle is in RADIANS.
CORRECT: extInput.taperAngle = adsk.core.ValueInput.createByReal(math.radians(taper_deg))
POSITIVE radians = inward taper (top smaller than base). NEGATIVE = outward (top larger).
Example for cone from base_r to top_r:
    taper_deg = math.degrees(math.atan((base_r - top_r) / height))
    extInput.taperAngle = adsk.core.ValueInput.createByReal(math.radians(taper_deg))
IMPORTANT: To join tapered body to existing body, use participantBodies:
    extInput.participantBodies = [body]

===== GEAR TEETH =====
For spur gears, use trapezoidal tooth profile (7 points per tooth, connected with lines):
- pitch_r = (teeth * module) / 2
- outer_r = pitch_r + module
- root_r = pitch_r - 1.25 * module
- tooth_angle = 2 * PI / teeth
- Per tooth, 7 points at fractions of tooth_angle:
    0.00: root (gap start)
    0.15: root (rising flank base)
    0.25: outer (rising flank tip)
    0.50: outer (tip center)
    0.60: outer (falling flank tip)
    0.70: root (falling flank base)
    0.85: root (gap end)
- Connect ALL points with lines (NOT splines — splines fail to form closed profiles)
- Close polygon: last point connects back to first point
- See Example 10 for complete working code
- NEVER use sketchFittedSplines for gear profiles — lines are more reliable

===== COMMON DIMENSIONS (all in cm) =====
M4 bolt: head dia 0.7, head height 0.28, shaft dia 0.4
M5 bolt: head dia 0.8, head height 0.35, shaft dia 0.5
M6 bolt: head dia 1.0, head height 0.4, shaft dia 0.6
M8 bolt: head dia 1.3, head height 0.5, shaft dia 0.8
M10 bolt: head dia 1.6, head height 0.6, shaft dia 1.0
M12 bolt: head dia 1.8, head height 0.7, shaft dia 1.2

===== EXAMPLES =====

EXAMPLE 1 — Simple Box:
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

EXAMPLE 2 — Cylinder:
try:
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    sketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), 3)
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(5))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Cylinder created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 3 — Hollow Cylinder (annular profile):
try:
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    circles = sketch.sketchCurves.sketchCircles
    circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), 3)  # outer
    circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), 2)  # inner
    prof = sketch.profiles.item(0)  # annular ring between circles
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(5))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Hollow cylinder created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 4 — Cone (taper extrude):
try:
    import math
    base_r = 2.5
    top_r = 1.25
    h = 6
    taper_deg = math.degrees(math.atan((base_r - top_r) / h))
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    sketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), base_r)
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(h))
    extInput.taperAngle = adsk.core.ValueInput.createByReal(math.radians(taper_deg))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Cone created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 5 — L-Bracket with Holes:
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

    # Mounting holes — one sketch per hole
    for pos in [adsk.core.Point3D.create(0.25, 2.5, 0), adsk.core.Point3D.create(2.5, 0.25, 0)]:
        hs = rootComp.sketches.add(rootComp.xYConstructionPlane)
        hs.sketchCurves.sketchCircles.addByCenterRadius(pos, 0.15)
        hp = hs.profiles.item(0)
        hc = rootComp.features.extrudeFeatures.createInput(hp, adsk.fusion.FeatureOperations.CutFeatureOperation)
        hc.setDistanceExtent(False, adsk.core.ValueInput.createByReal(1))
        rootComp.features.extrudeFeatures.add(hc)
    ui.messageBox("L-Bracket with holes created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 6 — Hexagonal Profile (bolt head):
try:
    import math
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    lines = sketch.sketchCurves.sketchLines
    r = 0.65  # M8 head radius
    pts = [adsk.core.Point3D.create(r * math.cos(math.pi/3 * i), r * math.sin(math.pi/3 * i), 0) for i in range(6)]
    for i in range(6):
        lines.addByTwoPoints(pts[i], pts[(i+1) % 6])
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(0.5))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Hex profile created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 7 — Array of Bolt Holes (flange pattern):
try:
    import math
    xyPlane = rootComp.xYConstructionPlane

    # Solid disk
    sketch = rootComp.sketches.add(xyPlane)
    sketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), 5)
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(1))
    rootComp.features.extrudeFeatures.add(extInput)

    # Center bore
    boreSketch = rootComp.sketches.add(xyPlane)
    boreSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), 2.5)
    boreProf = boreSketch.profiles.item(0)
    boreCut = rootComp.features.extrudeFeatures.createInput(boreProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    boreCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal(1))
    rootComp.features.extrudeFeatures.add(boreCut)

    # 6 bolt holes — one sketch per hole (CRITICAL: do NOT put all circles in one sketch)
    num_holes = 6
    bcd = 7.5  # bolt circle diameter
    hole_r = 0.4
    for i in range(num_holes):
        angle = 2 * math.pi * i / num_holes
        cx = (bcd/2) * math.cos(angle)
        cy = (bcd/2) * math.sin(angle)
        hs = rootComp.sketches.add(xyPlane)
        hs.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(cx, cy, 0), hole_r)
        hp = hs.profiles.item(0)
        hc = rootComp.features.extrudeFeatures.createInput(hp, adsk.fusion.FeatureOperations.CutFeatureOperation)
        hc.setDistanceExtent(False, adsk.core.ValueInput.createByReal(1))
        rootComp.features.extrudeFeatures.add(hc)
    ui.messageBox("Flange with bolt holes created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 8 — Joined Multi-Body (bottle shape):
try:
    import math
    xyPlane = rootComp.xYConstructionPlane

    # Body cylinder
    bodySketch = rootComp.sketches.add(xyPlane)
    bodySketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), 3)
    bodyProf = bodySketch.profiles.item(0)
    bodyExt = rootComp.features.extrudeFeatures.createInput(bodyProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    bodyExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(8))
    rootComp.features.extrudeFeatures.add(bodyExt)

    # Shoulder (tapered)
    shoulderPlane = rootComp.constructionPlanes.add(
        rootComp.constructionPlanes.createInput()
    )
    shoulderInput = rootComp.constructionPlanes.createInput()
    shoulderInput.setByOffset(xyPlane, adsk.core.ValueInput.createByReal(8))
    shoulderPlane = rootComp.constructionPlanes.add(shoulderInput)

    shoulderSketch = rootComp.sketches.add(shoulderPlane)
    shoulderSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), 3)
    shoulderProf = shoulderSketch.profiles.item(0)
    shoulderExt = rootComp.features.extrudeFeatures.createInput(shoulderProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
    shoulderExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(3))
    taper_deg = math.degrees(math.atan((3 - 1) / 3))
    shoulderExt.taperAngle = adsk.core.ValueInput.createByReal(math.radians(taper_deg))
    rootComp.features.extrudeFeatures.add(shoulderExt)

    # Neck
    neckPlane = rootComp.constructionPlanes.createInput()
    neckPlane.setByOffset(xyPlane, adsk.core.ValueInput.createByReal(11))
    neckP = rootComp.constructionPlanes.add(neckPlane)

    neckSketch = rootComp.sketches.add(neckP)
    neckSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), 1)
    neckProf = neckSketch.profiles.item(0)
    neckExt = rootComp.features.extrudeFeatures.createInput(neckProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
    neckExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(2))
    rootComp.features.extrudeFeatures.add(neckExt)
    ui.messageBox("Bottle shape created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 9 — Enclosure (box with cut interior):
try:
    xyPlane = rootComp.xYConstructionPlane
    w, d, h, wall = 8, 6, 4, 0.2

    # Outer box
    sketch = rootComp.sketches.add(xyPlane)
    sketch.sketchCurves.sketchLines.addTwoPointRectangle(
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create(w, d, 0)
    )
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(h))
    rootComp.features.extrudeFeatures.add(extInput)

    # Cut interior (leaves walls)
    cutSketch = rootComp.sketches.add(xyPlane)
    cutSketch.sketchCurves.sketchLines.addTwoPointRectangle(
        adsk.core.Point3D.create(wall, wall, 0),
        adsk.core.Point3D.create(w - wall, d - wall, 0)
    )
    cutProf = cutSketch.profiles.item(0)
    cutExt = rootComp.features.extrudeFeatures.createInput(cutProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    cutExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(h - wall))
    rootComp.features.extrudeFeatures.add(cutExt)
    ui.messageBox("Enclosure created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 10 — Spur Gear (trapezoidal tooth profile):
try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    teeth = 20
    module = 0.2
    face_width = 1.0
    bore_r = 0.5

    pitch_r = (teeth * module) / 2.0
    outer_r = pitch_r + module
    root_r = pitch_r - 1.25 * module
    tooth_angle = 2.0 * math.pi / teeth

    # 7 points per tooth: root gap, rising flank (root+tip), tip, falling flank (tip+root), root gap
    pts = []
    for i in range(teeth):
        a = tooth_angle * i
        pts.append((root_r * math.cos(a), root_r * math.sin(a)))
        a1 = a + tooth_angle * 0.15
        pts.append((root_r * math.cos(a1), root_r * math.sin(a1)))
        a2 = a + tooth_angle * 0.25
        pts.append((outer_r * math.cos(a2), outer_r * math.sin(a2)))
        a3 = a + tooth_angle * 0.50
        pts.append((outer_r * math.cos(a3), outer_r * math.sin(a3)))
        a4 = a + tooth_angle * 0.60
        pts.append((outer_r * math.cos(a4), outer_r * math.sin(a4)))
        a5 = a + tooth_angle * 0.70
        pts.append((root_r * math.cos(a5), root_r * math.sin(a5)))
        a6 = a + tooth_angle * 0.85
        pts.append((root_r * math.cos(a6), root_r * math.sin(a6)))

    # Draw with lines (NOT splines)
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        lines.addByTwoPoints(
            adsk.core.Point3D.create(x1, y1, 0),
            adsk.core.Point3D.create(x2, y2, 0)
        )

    prof = sketch.profiles.item(0)
    ext = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    ext.setDistanceExtent(False, adsk.core.ValueInput.createByReal(face_width))
    rootComp.features.extrudeFeatures.add(ext)

    # Bore hole
    bore = rootComp.sketches.add(xyPlane)
    bore.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), bore_r)
    bc = rootComp.features.extrudeFeatures.createInput(bore.profiles.item(0), adsk.fusion.FeatureOperations.CutFeatureOperation)
    bc.setDistanceExtent(False, adsk.core.ValueInput.createByReal(face_width))
    rootComp.features.extrudeFeatures.add(bc)
    ui.messageBox(f"Spur gear: {teeth} teeth, module {module}")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 11 — Geneva Wheel Mechanism (4-slot):
try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    n = 4  # number of slots
    R = 4.0  # driven disc radius
    d = R * math.sqrt(2)  # center distance for 4-slot Geneva
    pin_orbit = d  # pin orbits at center distance
    slot_w = 0.5
    slot_inner = 1.0
    slot_outer = R - 0.2
    t = 1.0
    hw = slot_w / 2

    # Driven wheel disc
    sk1 = rootComp.sketches.add(xyPlane)
    sk1.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), R)
    e1 = rootComp.features.extrudeFeatures.createInput(sk1.profiles.item(0), adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    e1.setDistanceExtent(False, adsk.core.ValueInput.createByReal(t))
    f1 = rootComp.features.extrudeFeatures.add(e1)
    body = f1.bodies.item(0)

    # Slots (radial with semicircular ends, one sketch per slot)
    for i in range(n):
        a = 2 * math.pi * i / n
        ca = math.cos(a)
        sa = math.sin(a)
        cp = math.cos(a + math.pi/2)
        sp = math.sin(a + math.pi/2)
        ix = slot_inner * ca
        iy = slot_inner * sa
        ox = slot_outer * ca
        oy = slot_outer * sa
        p1 = adsk.core.Point3D.create(ix + hw*cp, iy + hw*sp, 0)
        p2 = adsk.core.Point3D.create(ox + hw*cp, oy + hw*sp, 0)
        p3 = adsk.core.Point3D.create(ox - hw*cp, oy - hw*sp, 0)
        p4 = adsk.core.Point3D.create(ix - hw*cp, iy - hw*sp, 0)
        outer_mid = adsk.core.Point3D.create(ox + hw*ca, oy + hw*sa, 0)
        inner_mid = adsk.core.Point3D.create(ix - hw*ca, iy - hw*sa, 0)
        sk = rootComp.sketches.add(xyPlane)
        sk.sketchCurves.sketchLines.addByTwoPoints(p1, p2)
        sk.sketchCurves.sketchArcs.addByThreePoints(p2, outer_mid, p3)
        sk.sketchCurves.sketchLines.addByTwoPoints(p3, p4)
        sk.sketchCurves.sketchArcs.addByThreePoints(p4, inner_mid, p1)
        if sk.profiles.count > 0:
            c = rootComp.features.extrudeFeatures.createInput(sk.profiles.item(0), adsk.fusion.FeatureOperations.CutFeatureOperation)
            c.setDistanceExtent(False, adsk.core.ValueInput.createByReal(t))
            rootComp.features.extrudeFeatures.add(c)

    # Driven bore
    bore = rootComp.sketches.add(xyPlane)
    bore.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), 0.4)
    bc = rootComp.features.extrudeFeatures.createInput(bore.profiles.item(0), adsk.fusion.FeatureOperations.CutFeatureOperation)
    bc.setDistanceExtent(False, adsk.core.ValueInput.createByReal(t))
    rootComp.features.extrudeFeatures.add(bc)

    # Driver disc
    driver_r = pin_orbit * 0.7
    dsk = rootComp.sketches.add(xyPlane)
    dsk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(d, 0, 0), driver_r)
    de = rootComp.features.extrudeFeatures.createInput(dsk.profiles.item(0), adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    de.setDistanceExtent(False, adsk.core.ValueInput.createByReal(t))
    df = rootComp.features.extrudeFeatures.add(de)
    drvBody = df.bodies.item(0)

    # Driver bore
    dbsk = rootComp.sketches.add(xyPlane)
    dbsk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(d, 0, 0), 0.35)
    dbc = rootComp.features.extrudeFeatures.createInput(dbsk.profiles.item(0), adsk.fusion.FeatureOperations.CutFeatureOperation)
    dbc.setDistanceExtent(False, adsk.core.ValueInput.createByReal(t))
    rootComp.features.extrudeFeatures.add(dbc)

    # Pin on driver
    psk = rootComp.sketches.add(xyPlane)
    psk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(d + pin_orbit, 0, 0), 0.2)
    pe = rootComp.features.extrudeFeatures.createInput(psk.profiles.item(0), adsk.fusion.FeatureOperations.JoinFeatureOperation)
    pe.setDistanceExtent(False, adsk.core.ValueInput.createByReal(t * 1.5))
    pe.participantBodies = [drvBody]
    rootComp.features.extrudeFeatures.add(pe)

    # Locking disc on driver
    lsk = rootComp.sketches.add(xyPlane)
    lsk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(d, 0, 0), pin_orbit - 0.1)
    le = rootComp.features.extrudeFeatures.createInput(lsk.profiles.item(0), adsk.fusion.FeatureOperations.JoinFeatureOperation)
    le.setDistanceExtent(False, adsk.core.ValueInput.createByReal(t * 0.6))
    le.participantBodies = [drvBody]
    rootComp.features.extrudeFeatures.add(le)

    ui.messageBox("Geneva wheel mechanism created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 12 — Valve Body (side ports on hollow cylinder):
Key insight: Create side ports as SOLID tubes first (joined), then bore through everything.
NEVER try to cut from inside the bore — there is no material there to cut.
try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    xzPlane = rootComp.xZConstructionPlane
    yzPlane = rootComp.yZConstructionPlane

    main_r = 2.0       # main cylinder radius
    main_h = 6.0       # main cylinder height
    flange_r = 3.0     # top flange radius
    flange_h = 0.4     # top flange thickness
    bore_r = 1.2       # main bore radius (through all)
    port_r = 0.8       # side port outer radius
    port_bore = 0.5    # side port inner radius
    port_len = 2.5     # side port extension length

    # 1. Main cylinder (solid)
    sk = rootComp.sketches.add(xyPlane)
    sk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), main_r)
    ei = rootComp.features.extrudeFeatures.createInput(sk.profiles.item(0), adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    ei.setDistanceExtent(False, adsk.core.ValueInput.createByReal(main_h))
    feat = rootComp.features.extrudeFeatures.add(ei)
    body = feat.bodies.item(0)

    # 2. Top flange (joined)
    fp = rootComp.constructionPlanes.createInput()
    fp.setByOffset(xyPlane, adsk.core.ValueInput.createByReal(main_h))
    flangePlane = rootComp.constructionPlanes.add(fp)
    fsk = rootComp.sketches.add(flangePlane)
    fsk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), flange_r)
    fei = rootComp.features.extrudeFeatures.createInput(fsk.profiles.item(0), adsk.fusion.FeatureOperations.JoinFeatureOperation)
    fei.setDistanceExtent(False, adsk.core.ValueInput.createByReal(flange_h))
    fei.participantBodies = [body]
    rootComp.features.extrudeFeatures.add(fei)

    # 3. Side port +X (solid tube, joined)
    port_z = main_h * 0.6  # port center height
    psk = rootComp.sketches.add(yzPlane)
    psk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, port_z, 0), port_r)
    pei = rootComp.features.extrudeFeatures.createInput(psk.profiles.item(0), adsk.fusion.FeatureOperations.JoinFeatureOperation)
    pei.setDistanceExtent(False, adsk.core.ValueInput.createByReal(main_r + port_len))
    pei.participantBodies = [body]
    rootComp.features.extrudeFeatures.add(pei)

    # 4. Side port -X (solid tube, joined)
    psk2 = rootComp.sketches.add(yzPlane)
    psk2.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, port_z, 0), port_r)
    pei2 = rootComp.features.extrudeFeatures.createInput(psk2.profiles.item(0), adsk.fusion.FeatureOperations.JoinFeatureOperation)
    pei2.setDistanceExtent(False, adsk.core.ValueInput.createByReal(main_r + port_len))
    pei2.participantBodies = [body]
    rootComp.features.extrudeFeatures.add(pei2)

    # 5. Side port +Y (solid tube, joined)
    psk3 = rootComp.sketches.add(xzPlane)
    psk3.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, port_z, 0), port_r)
    pei3 = rootComp.features.extrudeFeatures.createInput(psk3.profiles.item(0), adsk.fusion.FeatureOperations.JoinFeatureOperation)
    pei3.setDistanceExtent(False, adsk.core.ValueInput.createByReal(main_r + port_len))
    pei3.participantBodies = [body]
    rootComp.features.extrudeFeatures.add(pei3)

    # 6. Main bore through all (cuts through body AND port tubes)
    boreSk = rootComp.sketches.add(xyPlane)
    boreSk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), bore_r)
    boreCut = rootComp.features.extrudeFeatures.createInput(boreSk.profiles.item(0), adsk.fusion.FeatureOperations.CutFeatureOperation)
    boreCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal(main_h + flange_h + 0.1))
    rootComp.features.extrudeFeatures.add(boreCut)

    # 7. Port hollows (cut through port tubes)
    phSk = rootComp.sketches.add(yzPlane)
    phSk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, port_z, 0), port_bore)
    phCut = rootComp.features.extrudeFeatures.createInput(phSk.profiles.item(0), adsk.fusion.FeatureOperations.CutFeatureOperation)
    phCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal(2 * (main_r + port_len) + 0.1))
    rootComp.features.extrudeFeatures.add(phCut)

    phSk2 = rootComp.sketches.add(xzPlane)
    phSk2.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, port_z, 0), port_bore)
    phCut2 = rootComp.features.extrudeFeatures.createInput(phSk2.profiles.item(0), adsk.fusion.FeatureOperations.CutFeatureOperation)
    phCut2.setDistanceExtent(False, adsk.core.ValueInput.createByReal(2 * (main_r + port_len) + 0.1))
    rootComp.features.extrudeFeatures.add(phCut2)

    ui.messageBox("Valve body created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 13 — Flanged Pipe (clean, no artifacts):
Key rules: NO bolt holes (causes artifacts). Through hole must go from z=0 through entire length.
try:
    import math
    xyPlane = rootComp.xYConstructionPlane

    pipe_r = 1.5       # pipe outer radius (30mm dia)
    pipe_len = 8.0     # pipe length (80mm)
    flange_r = 2.5     # flange radius (50mm dia)
    flange_h = 0.5     # flange thickness (5mm)
    bore_r = 1.0       # through hole radius (20mm dia)

    # 1. Pipe cylinder (solid)
    sk = rootComp.sketches.add(xyPlane)
    sk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), pipe_r)
    ei = rootComp.features.extrudeFeatures.createInput(sk.profiles.item(0), adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    ei.setDistanceExtent(False, adsk.core.ValueInput.createByReal(pipe_len))
    feat = rootComp.features.extrudeFeatures.add(ei)
    body = feat.bodies.item(0)

    # 2. Flange at base (joined, thicker than pipe for visual solidity)
    fsk = rootComp.sketches.add(xyPlane)
    fsk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), flange_r)
    fei = rootComp.features.extrudeFeatures.createInput(fsk.profiles.item(0), adsk.fusion.FeatureOperations.JoinFeatureOperation)
    fei.setDistanceExtent(False, adsk.core.ValueInput.createByReal(flange_h))
    fei.participantBodies = [body]
    rootComp.features.extrudeFeatures.add(fei)

    # 3. Through hole (from z=0 through entire length + flange + margin)
    boreSk = rootComp.sketches.add(xyPlane)
    boreSk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), bore_r)
    boreCut = rootComp.features.extrudeFeatures.createInput(boreSk.profiles.item(0), adsk.fusion.FeatureOperations.CutFeatureOperation)
    boreCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal(pipe_len + flange_h + 0.1))
    rootComp.features.extrudeFeatures.add(boreCut)

    ui.messageBox("Flanged pipe created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")

EXAMPLE 14 — Helical Spring (sweep along helix path):
Units: coil_d and wire_d are in mm — divide by 10 to get cm. free_length is total spring height in mm.
try:
    import math
    coil_d = 20      # mm
    wire_d = 2        # mm
    coils = 8
    free_length = 40  # mm

    coil_r = (coil_d / 10.0) / 2.0   # cm
    wire_r = (wire_d / 10.0) / 2.0   # cm
    height = free_length / 10.0       # cm
    segments = int(coils * 24)

    xyPlane = rootComp.xYConstructionPlane

    # Helix path as 3D spline
    pathSketch = rootComp.sketches.add(xyPlane)
    pathPoints = adsk.core.ObjectCollection.create()
    for i in range(segments + 1):
        t = i / segments
        angle = 2 * math.pi * coils * t
        x = coil_r * math.cos(angle)
        y = coil_r * math.sin(angle)
        z = height * t
        pathPoints.add(adsk.core.Point3D.create(x, y, z))
    spline = pathSketch.sketchCurves.sketchFittedSplines.add(pathPoints)

    # Wire cross-section circle at start of path
    startSketch = rootComp.sketches.add(xyPlane)
    startSketch.sketchCurves.sketchCircles.addByCenterRadius(
        adsk.core.Point3D.create(coil_r, 0, 0), wire_r
    )
    wireProf = startSketch.profiles.item(0)

    # Sweep profile along helix path
    pathCurves = adsk.core.ObjectCollection.create()
    pathCurves.add(spline)
    path = rootComp.features.createPath(pathCurves)
    sweepInput = rootComp.features.sweepFeatures.createInput(
        wireProf, path, adsk.fusion.FeatureOperations.NewBodyFeatureOperation
    )
    sweepInput.isSolid = True
    rootComp.features.sweepFeatures.add(sweepInput)
    ui.messageBox("Spring created!")
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
// Helper: validate Python syntax via ast.parse
// ---------------------------------------------------------------------------
function validatePython(code) {
  const tmpFile = join(tmpdir(), `mimo_validate_${Date.now()}.py`);
  try {
    writeFileSync(tmpFile, code, "utf-8");
    const script = `import ast, sys; ast.parse(open(sys.argv[1], encoding='utf-8').read())`;
    execFileSync(PYTHON_CMD, ["-c", script, tmpFile], { timeout: 5000, stdio: "pipe" });
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

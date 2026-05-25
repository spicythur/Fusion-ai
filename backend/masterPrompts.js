// ==========================================================================
// REFERENCE ONLY — This file is not imported by index.js.
// It is kept as a knowledge base of Fusion 360 Python patterns.
// The AI generation pipeline is the sole code generation path.
// ==========================================================================

// ---------------------------------------------------------------------------
// Master Prompts — Template Library for Fusion 360 (Reference)
// ---------------------------------------------------------------------------

export const MASTER_PROMPTS = [
  // =========================================================================
  // BASIC SHAPES
  // =========================================================================
  {
    id: "box",
    keywords: ["box", "kotak", "cube", "kubus", "rectangular", "persegi", "balok", "block"],
    label: "Box",
    params: ["width", "depth", "height"],
    defaults: { width: 5, depth: 5, height: 5 },
    template: `try:
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    sketch.sketchCurves.sketchLines.addTwoPointRectangle(
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create({width}, {depth}, 0)
    )
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({height}))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Box created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "cylinder",
    keywords: ["cylinder", "silinder", "tabung", "round", "circular", "lingkaran"],
    label: "Cylinder",
    params: ["radius", "height"],
    defaults: { radius: 2.5, height: 5 },
    template: `try:
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    sketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {radius})
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({height}))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Cylinder created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "hollow_cylinder",
    keywords: ["hollow", "berlubang", "tube", "pipa", "pipe", "ring", "annular", "shell"],
    label: "Hollow Cylinder",
    params: ["outer_r", "inner_r", "height"],
    defaults: { outer_r: 3, inner_r: 2, height: 5 },
    template: `try:
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    circles = sketch.sketchCurves.sketchCircles
    circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {outer_r})
    circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {inner_r})
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({height}))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Hollow cylinder created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "torus",
    keywords: ["torus", "donut", "donat", "ring", "cincin", "o-ring"],
    label: "Torus",
    params: ["major_r", "minor_r"],
    defaults: { major_r: 4, minor_r: 1 },
    template: `try:
    import math
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    center = adsk.core.Point3D.create(0, 0, 0)
    arcCenter = adsk.core.Point3D.create({major_r}, 0, 0)
    sketch.sketchCurves.sketchCircles.addByCenterRadius(center, {major_r})
    prof = sketch.profiles.item(0)
    revolveInput = rootComp.features.revolveFeatures.createInput(prof, rootComp.zConstructionAxis, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    revolveInput.setAngleExtent(6.283185307179586)
    rootComp.features.revolveFeatures.add(revolveInput)
    ui.messageBox("Torus created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  // =========================================================================
  // MECHANICAL PARTS
  // =========================================================================
  {
    id: "hex_bolt",
    keywords: ["bolt", "baut", "hex bolt", "hexagon bolt", "fastener"],
    label: "Hex Bolt",
    params: ["head_d", "head_h", "shaft_d", "shaft_l"],
    defaults: { head_d: 1.3, head_h: 0.5, shaft_d: 0.8, shaft_l: 3.0 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    headSketch = rootComp.sketches.add(xyPlane)
    r = {head_d} / 2
    # Single sketch: hex head + shaft circle, extrude as one body
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    r = {head_d} / 2
    pts = [adsk.core.Point3D.create(r * math.cos(math.pi/3 * i), r * math.sin(math.pi/3 * i), 0) for i in range(6)]
    for i in range(6):
        lines.addByTwoPoints(pts[i], pts[(i+1) % 6])
    # Shaft circle (inside hex, will merge)
    sketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {shaft_d} / 2)

    # Extrude hex head
    headProf = sketch.profiles.item(0)
    extHead = rootComp.features.extrudeFeatures.createInput(headProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extHead.setDistanceExtent(False, adsk.core.ValueInput.createByReal({head_h}))
    rootComp.features.extrudeFeatures.add(extHead)

    # Extrude shaft (joined, extends from z=0 through head)
    shaftProf = sketch.profiles.item(1)
    extShaft = rootComp.features.extrudeFeatures.createInput(shaftProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
    extShaft.setDistanceExtent(False, adsk.core.ValueInput.createByReal({head_h} + {shaft_l}))
    rootComp.features.extrudeFeatures.add(extShaft)
    ui.messageBox("Hex bolt created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "washer",
    keywords: ["washer", "ring", "cincin", "gasket", "shim", "spacer"],
    label: "Washer",
    params: ["outer_r", "inner_r", "thickness"],
    defaults: { outer_r: 2, inner_r: 1, thickness: 0.2 },
    template: `try:
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    circles = sketch.sketchCurves.sketchCircles
    circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {outer_r})
    circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {inner_r})
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({thickness}))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Washer created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "l_bracket",
    keywords: ["bracket", "l-bracket", "l bracket", "angle", "siku", "sudut", "mounting"],
    label: "L-Bracket",
    params: ["width", "height", "thickness", "depth"],
    defaults: { width: 5, height: 5, thickness: 0.5, depth: 1 },
    template: `try:
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    lines = sketch.sketchCurves.sketchLines
    t = {thickness}
    w = {width}
    h = {height}
    pts = [
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create(w, 0, 0),
        adsk.core.Point3D.create(w, t, 0),
        adsk.core.Point3D.create(t, t, 0),
        adsk.core.Point3D.create(t, h, 0),
        adsk.core.Point3D.create(0, h, 0),
    ]
    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i+1) % len(pts)])
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({depth}))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("L-Bracket created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "enclosure",
    keywords: ["enclosure", "housing", "casing", "case", "wadah", "container", "electronics box"],
    label: "Enclosure Box",
    params: ["width", "depth", "height", "wall"],
    defaults: { width: 8, depth: 6, height: 4, wall: 0.2 },
    template: `try:
    sketch = rootComp.sketches.add(rootComp.xYConstructionPlane)
    sketch.sketchCurves.sketchLines.addTwoPointRectangle(
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create({width}, {depth}, 0)
    )
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({height}))
    box = rootComp.features.extrudeFeatures.add(extInput)
    faces = adsk.core.ObjectCollection.create()
    faces.add(box.bodies.item(0).faces.item(4))
    shellInput = rootComp.features.shellFeatures.createInput(faces, False)
    shellInput.insideThickness = adsk.core.ValueInput.createByReal({wall})
    rootComp.features.shellFeatures.add(shellInput)
    ui.messageBox("Enclosure created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "spur_gear",
    keywords: ["spur gear", "spur", "involute gear", "gear", "gigi"],
    label: "Spur Gear",
    params: ["teeth", "module", "face_width", "bore_d"],
    defaults: { teeth: 20, module: 0.15, face_width: 1.0, bore_d: 0.8 },
    template: `try:
    import math
    teeth = {teeth}
    module = {module}
    face_width = {face_width}
    bore_d = {bore_d}

    pitch_r = (teeth * module) / 2
    addendum = module
    dedendum = 1.25 * module
    outer_r = pitch_r + addendum
    root_r = pitch_r - dedendum
    bore_r = bore_d / 2

    xyPlane = rootComp.xYConstructionPlane

    # --- Gear body: single closed profile with tooth outline ---
    gearSketch = rootComp.sketches.add(xyPlane)
    lines = gearSketch.sketchCurves.sketchLines

    tooth_angle = 2 * math.pi / teeth
    # Tooth occupies ~45% of the pitch, gap ~55%
    tooth_arc = tooth_angle * 0.45
    gap_arc = tooth_angle - tooth_arc

    pts = []
    for i in range(teeth):
        base_angle = tooth_angle * i
        # Root arc start (gap region)
        a0 = base_angle - gap_arc / 2
        # Root arc end / tooth flank start
        a1 = base_angle + gap_arc / 2
        # Tooth tip start
        a2 = base_angle + gap_arc / 2
        # Tooth tip end
        a3 = base_angle + gap_arc / 2 + tooth_arc

        pts.append(adsk.core.Point3D.create(root_r * math.cos(a0), root_r * math.sin(a0), 0))
        pts.append(adsk.core.Point3D.create(root_r * math.cos(a1), root_r * math.sin(a1), 0))
        pts.append(adsk.core.Point3D.create(outer_r * math.cos(a2), outer_r * math.sin(a2), 0))
        pts.append(adsk.core.Point3D.create(outer_r * math.cos(a3), outer_r * math.sin(a3), 0))

    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i + 1) % len(pts)])

    prof = gearSketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(face_width))
    rootComp.features.extrudeFeatures.add(extInput)

    # --- Bore hole (cut) ---
    boreSketch = rootComp.sketches.add(xyPlane)
    boreSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), bore_r)
    boreProf = boreSketch.profiles.item(0)
    boreCut = rootComp.features.extrudeFeatures.createInput(boreProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    boreCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal(face_width))
    rootComp.features.extrudeFeatures.add(boreCut)

    ui.messageBox(f"Spur gear created: {teeth} teeth, module {module}")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "knob",
    keywords: ["knob", "putar", "handle", "pegangan", "tombol", "dial", "control knob"],
    label: "Knob",
    params: ["bottom_d", "bottom_h", "top_d", "top_h", "bore_d"],
    defaults: { bottom_d: 3.0, bottom_h: 1.0, top_d: 2.0, top_h: 2.0, bore_d: 0.6 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    axis = sketch.sketchCurves.sketchLines
    bore_r = {bore_d} / 2

    # Profile for revolve (half cross-section)
    pts = [
        adsk.core.Point3D.create(bore_r, 0, 0),              # bore bottom
        adsk.core.Point3D.create({bottom_d}/2, 0, 0),        # bottom outer
        adsk.core.Point3D.create({bottom_d}/2, {bottom_h}, 0), # bottom top outer
        adsk.core.Point3D.create({top_d}/2, {bottom_h}, 0),  # step inward
        adsk.core.Point3D.create({top_d}/2, {bottom_h} + {top_h}, 0), # top outer
        adsk.core.Point3D.create(bore_r, {bottom_h} + {top_h}, 0),    # bore top
    ]
    for i in range(len(pts) - 1):
        lines.addByTwoPoints(pts[i], pts[i + 1])
    # Close the profile
    lines.addByTwoPoints(pts[-1], pts[0])

    prof = sketch.profiles.item(0)
    axisLine = rootComp.zConstructionAxis
    revolveInput = rootComp.features.revolveFeatures.createInput(prof, axisLine, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    revolveInput.setAngleExtent(6.283185307179586)
    rootComp.features.revolveFeatures.add(revolveInput)
    ui.messageBox("Knob created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "flange",
    keywords: ["flange", "flensa", "pipe flange", "connection plate", "mounting plate"],
    label: "Flange",
    params: ["outer_d", "inner_d", "thickness", "bolt_holes", "bolt_bolt_circle_d", "bolt_hole_d"],
    defaults: { outer_d: 10, inner_d: 5, thickness: 1.0, bolt_holes: 4, bolt_bolt_circle_d: 7.5, bolt_hole_d: 0.8 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    circles = sketch.sketchCurves.sketchCircles

    # Main flange body
    circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {outer_d}/2)
    circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {inner_d}/2)

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({thickness}))
    rootComp.features.extrudeFeatures.add(extInput)

    # Bolt holes
    bolt_holes = {bolt_holes}
    bcd = {bolt_bolt_circle_d}
    hole_r = {bolt_hole_d} / 2
    holeSketch = rootComp.sketches.add(xyPlane)
    for i in range(bolt_holes):
        angle = 2 * math.pi * i / bolt_holes
        cx = (bcd/2) * math.cos(angle)
        cy = (bcd/2) * math.sin(angle)
        holeSketch.sketchCurves.sketchCircles.addByCenterRadius(
            adsk.core.Point3D.create(cx, cy, 0), hole_r
        )

    holeProf = holeSketch.profiles.item(0)
    holeCut = rootComp.features.extrudeFeatures.createInput(holeProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    holeCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal({thickness}))
    rootComp.features.extrudeFeatures.add(holeCut)
    ui.messageBox("Flange created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "u_bracket",
    keywords: ["u-bracket", "u bracket", "channel", "u channel", "u-shape", "u shape", "c bracket"],
    label: "U-Bracket",
    params: ["width", "height", "depth", "thickness", "hole_d"],
    defaults: { width: 6, height: 4, depth: 2, thickness: 0.5, hole_d: 0.6 },
    template: `try:
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    t = {thickness}
    w = {width}
    h = {height}

    # U-shape profile
    pts = [
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create(w, 0, 0),
        adsk.core.Point3D.create(w, h - t, 0),
        adsk.core.Point3D.create(w - t, h - t, 0),
        adsk.core.Point3D.create(w - t, t, 0),
        adsk.core.Point3D.create(t, t, 0),
        adsk.core.Point3D.create(t, h - t, 0),
        adsk.core.Point3D.create(0, h - t, 0),
    ]
    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i+1) % len(pts)])

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({depth}))
    rootComp.features.extrudeFeatures.add(extInput)

    # Mounting holes
    holeSketch = rootComp.sketches.add(xyPlane)
    holeSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(t/2, h - t/2, 0), {hole_d}/2)
    holeSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(w - t/2, h - t/2, 0), {hole_d}/2)

    holeProf = holeSketch.profiles.item(0)
    holeCut = rootComp.features.extrudeFeatures.createInput(holeProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    holeCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal({depth}))
    rootComp.features.extrudeFeatures.add(holeCut)
    ui.messageBox("U-Bracket created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "t_joint",
    keywords: ["t-joint", "t joint", "t-connector", "t connector", "t-shape", "t shape", "tee joint"],
    label: "T-Joint",
    params: ["width", "height", "thickness", "depth"],
    defaults: { width: 6, height: 6, thickness: 1.0, depth: 1.5 },
    template: `try:
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    t = {thickness}
    w = {width}
    h = {height}

    # T-shape profile
    pts = [
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create(w, 0, 0),
        adsk.core.Point3D.create(w, t, 0),
        adsk.core.Point3D.create((w + t)/2, t, 0),
        adsk.core.Point3D.create((w + t)/2, h, 0),
        adsk.core.Point3D.create((w - t)/2, h, 0),
        adsk.core.Point3D.create((w - t)/2, t, 0),
        adsk.core.Point3D.create(0, t, 0),
    ]
    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i+1) % len(pts)])

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({depth}))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("T-Joint created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "bearing_block",
    keywords: ["bearing", "bearing block", "bearing housing", "pillow block", "bushing", "dudukan bearing", "dudukan"],
    label: "Bearing Block",
    params: ["outer_d", "bore_d", "width", "mount_hole_d", "mount_spacing"],
    defaults: { outer_d: 5, bore_d: 2, width: 3, mount_hole_d: 0.8, mount_spacing: 7 },
    template: `try:
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    circles = sketch.sketchCurves.sketchCircles

    # Main body (rectangular base with cylindrical bearing seat)
    lines = sketch.sketchCurves.sketchLines
    base_w = {mount_spacing} + 2
    base_h = {outer_d} / 2 + 1
    lines.addTwoPointRectangle(
        adsk.core.Point3D.create(-base_w/2, -base_h/2, 0),
        adsk.core.Point3D.create(base_w/2, base_h/2, 0)
    )

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({width}))
    rootComp.features.extrudeFeatures.add(extInput)

    # Bearing bore
    boreSketch = rootComp.sketches.add(xyPlane)
    boreSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {bore_d}/2)
    boreProf = boreSketch.profiles.item(0)
    boreCut = rootComp.features.extrudeFeatures.createInput(boreProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    boreCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal({width}))
    rootComp.features.extrudeFeatures.add(boreCut)

    # Mounting holes
    holeSketch = rootComp.sketches.add(xyPlane)
    holeSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(-{mount_spacing}/2, 0, 0), {mount_hole_d}/2)
    holeSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create({mount_spacing}/2, 0, 0), {mount_hole_d}/2)
    holeProf = holeSketch.profiles.item(0)
    holeCut = rootComp.features.extrudeFeatures.createInput(holeProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    holeCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal({width}))
    rootComp.features.extrudeFeatures.add(holeCut)
    ui.messageBox("Bearing block created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "shaft_coupler",
    keywords: ["coupler", "coupling", "shaft coupler", "shaft coupling", "connector", "joint"],
    label: "Shaft Coupler",
    params: ["outer_d", "bore_d", "length", "set_screw_d"],
    defaults: { outer_d: 3, bore_d: 1.0, length: 4, set_screw_d: 0.4 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    circles = sketch.sketchCurves.sketchCircles

    # Main body
    circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {outer_d}/2)
    circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {bore_d}/2)

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({length}))
    body = rootComp.features.extrudeFeatures.add(extInput)

    # Set screw holes (2 on opposite sides, perpendicular to bore)
    planes = rootComp.constructionPlanes
    midPlane = planes.createInput()
    midPlane.setByOffset(xyPlane, adsk.core.ValueInput.createByReal({length}/2))
    mp = planes.add(midPlane)

    ssSketch = rootComp.sketches.add(mp)
    ssSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, {outer_d}/2, 0), {set_screw_d}/2)
    ssSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, -{outer_d}/2, 0), {set_screw_d}/2)

    ssProf = ssSketch.profiles.item(0)
    ssCut = rootComp.features.extrudeFeatures.createInput(ssProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    ssCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal({outer_d}/2))
    rootComp.features.extrudeFeatures.add(ssCut)
    ui.messageBox("Shaft coupler created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "spring",
    keywords: ["spring", "pegas", "coil", "compression spring", "helical", "spiral"],
    label: "Spring",
    params: ["coil_r", "wire_d", "coils", "pitch"],
    defaults: { coil_r: 2, wire_d: 0.3, coils: 6, pitch: 1.0 },
    template: `try:
    import math
    coil_r = {coil_r}
    wire_d = {wire_d}
    coils = {coils}
    pitch = {pitch}
    height = coils * pitch
    segments = int(coils * 36)

    xyPlane = rootComp.xYConstructionPlane

    # Create path as 3D sketch
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

    # Create wire cross-section at start
    startSketch = rootComp.sketches.add(xyPlane)
    startSketch.sketchCurves.sketchCircles.addByCenterRadius(
        adsk.core.Point3D.create(coil_r, 0, 0), wire_d / 2
    )
    wireProf = startSketch.profiles.item(0)

    # Sweep along path
    pathCurves = adsk.core.ObjectCollection.create()
    pathCurves.add(spline)
    path = rootComp.features.createPath(pathCurves)
    sweepInput = rootComp.features.sweepFeatures.createInput(wireProf, path, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    sweepInput.isSolid = True
    rootComp.features.sweepFeatures.add(sweepInput)
    ui.messageBox("Spring created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "xframe_drone",
    keywords: ["drone", "frame", "x-frame", "xframe", "quadcopter", "quad", "fpv", "racing drone", "multirotor"],
    label: "X-Frame Drone",
    params: ["arm_length", "arm_width", "arm_thickness", "center_size", "motor_hole_d", "motor_spacing"],
    defaults: { arm_length: 12.5, arm_width: 1.5, arm_thickness: 0.5, center_size: 5, motor_hole_d: 0.3, motor_spacing: 1.6 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane

    # --- Center plate (first body) ---
    centerSketch = rootComp.sketches.add(xyPlane)
    cs = {center_size} / 2
    centerSketch.sketchCurves.sketchLines.addTwoPointRectangle(
        adsk.core.Point3D.create(-cs, -cs, 0),
        adsk.core.Point3D.create(cs, cs, 0)
    )
    centerProf = centerSketch.profiles.item(0)
    centerExt = rootComp.features.extrudeFeatures.createInput(centerProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    centerExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal({arm_thickness}))
    mainBody = rootComp.features.extrudeFeatures.add(centerExt).bodies.item(0)

    # --- 4 Arms at 45-degree angles (joined to main body) ---
    arm_l = {arm_length}
    arm_w = {arm_width}
    arm_t = {arm_thickness}
    motor_hole_r = {motor_hole_d} / 2
    motor_spacing_r = {motor_spacing} / 2

    angles = [math.pi/4, 3*math.pi/4, 5*math.pi/4, 7*math.pi/4]

    for angle in angles:
        armSketch = rootComp.sketches.add(xyPlane)
        cos_a = math.cos(angle)
        sin_a = math.sin(angle)
        cos_p = -sin_a
        sin_p = cos_a
        start_dist = cs * 0.8
        end_dist = arm_l
        sx = start_dist * cos_a
        sy = start_dist * sin_a
        ex = end_dist * cos_a
        ey = end_dist * sin_a
        half_w = arm_w / 2
        pts = [
            adsk.core.Point3D.create(sx + half_w * cos_p, sy + half_w * sin_p, 0),
            adsk.core.Point3D.create(ex + half_w * cos_p, ey + half_w * sin_p, 0),
            adsk.core.Point3D.create(ex - half_w * cos_p, ey - half_w * sin_p, 0),
            adsk.core.Point3D.create(sx - half_w * cos_p, sy - half_w * sin_p, 0),
        ]
        lines = armSketch.sketchCurves.sketchLines
        for i in range(4):
            lines.addByTwoPoints(pts[i], pts[(i+1) % 4])

        armProf = armSketch.profiles.item(0)
        armExt = rootComp.features.extrudeFeatures.createInput(armProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
        armExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(arm_t))
        rootComp.features.extrudeFeatures.add(armExt)

    # Motor mount holes (cut)
    for angle in angles:
        mx = arm_l * math.cos(angle)
        my = arm_l * math.sin(angle)
        motorSketch = rootComp.sketches.add(xyPlane)
        motorSketch.sketchCurves.sketchCircles.addByCenterRadius(
            adsk.core.Point3D.create(mx, my, 0), motor_spacing_r
        )
        motorSketch.sketchCurves.sketchCircles.addByCenterRadius(
            adsk.core.Point3D.create(mx, my, 0), motor_hole_r
        )
        motorProf = motorSketch.profiles.item(0)
        motorCut = rootComp.features.extrudeFeatures.createInput(motorProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
        motorCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal(arm_t))
        rootComp.features.extrudeFeatures.add(motorCut)

    ui.messageBox("X-Frame drone created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "phone_stand",
    keywords: ["phone stand", "phone holder", "stand", "holder", "dudukan hp", "dudukan handphone"],
    label: "Phone Stand",
    params: ["base_width", "base_depth", "base_thickness", "back_height", "angle"],
    defaults: { base_width: 8, base_depth: 10, base_thickness: 0.5, back_height: 12, angle: 70 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines

    bw = {base_width}
    bd = {base_depth}
    bt = {base_thickness}
    bh = {back_height}
    angle_rad = math.radians({angle})

    # L-shape profile (side view)
    pts = [
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create(bd, 0, 0),
        adsk.core.Point3D.create(bd, bt, 0),
        adsk.core.Point3D.create(bt, bt, 0),
        adsk.core.Point3D.create(bt, bt + bh * math.sin(angle_rad), 0),
        adsk.core.Point3D.create(0, bt + bh * math.sin(angle_rad), 0),
    ]
    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i+1) % len(pts)])

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(bw))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Phone stand created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "pipe_elbow",
    keywords: ["elbow", "pipe elbow", "90 degree", "bent pipe", "siku pipa", "elbow pipe"],
    label: "Pipe Elbow",
    params: ["outer_d", "inner_d", "bend_radius", "leg_length"],
    defaults: { outer_d: 3, inner_d: 2.4, bend_radius: 5, leg_length: 5 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    xzPlane = rootComp.xZConstructionPlane

    # Create path on XZ plane (90 degree arc + straight legs)
    pathSketch = rootComp.sketches.add(xzPlane)
    pathPoints = adsk.core.ObjectCollection.create()

    bend_r = {bend_radius}
    leg_l = {leg_length}
    outer_r = {outer_d} / 2
    inner_r = {inner_d} / 2

    # Start leg (along -Z)
    pathPoints.add(adsk.core.Point3D.create(0, 0, -leg_l))
    pathPoints.add(adsk.core.Point3D.create(0, 0, 0))

    # 90 degree arc
    segments = 18
    for i in range(segments + 1):
        angle = (math.pi / 2) * i / segments
        x = bend_r * math.sin(angle)
        z = -bend_r * math.cos(angle) + bend_r
        pathPoints.add(adsk.core.Point3D.create(x, 0, z))

    # End leg (along +X)
    pathPoints.add(adsk.core.Point3D.create(bend_r + leg_l, 0, bend_r))

    spline = pathSketch.sketchCurves.sketchFittedSplines.add(pathPoints)

    # Cross-section at start
    csSketch = rootComp.sketches.add(xyPlane)
    csSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, -leg_l), outer_r)
    csSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, -leg_l), inner_r)
    csProf = csSketch.profiles.item(0)

    pathCurves = adsk.core.ObjectCollection.create()
    pathCurves.add(spline)
    path = rootComp.features.createPath(pathCurves)
    sweepInput = rootComp.features.sweepFeatures.createInput(csProf, path, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    sweepInput.isSolid = True
    rootComp.features.sweepFeatures.add(sweepInput)
    ui.messageBox("Pipe elbow created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  // =========================================================================
  // STRUCTURAL SHAPES
  // =========================================================================
  {
    id: "i_beam",
    keywords: ["i-beam", "ibeam", "i beam", "profile", "balok", "structural", "beam", "girder"],
    label: "I-Beam",
    params: ["height", "flange_w", "flange_t", "web_t", "length"],
    defaults: { height: 10, flange_w: 5, flange_t: 0.8, web_t: 0.5, length: 20 },
    template: `try:
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    h = {height}
    fw = {flange_w}
    ft = {flange_t}
    wt = {web_t}

    # I-beam profile
    pts = [
        adsk.core.Point3D.create(-fw/2, -h/2, 0),
        adsk.core.Point3D.create(fw/2, -h/2, 0),
        adsk.core.Point3D.create(fw/2, -h/2 + ft, 0),
        adsk.core.Point3D.create(wt/2, -h/2 + ft, 0),
        adsk.core.Point3D.create(wt/2, h/2 - ft, 0),
        adsk.core.Point3D.create(fw/2, h/2 - ft, 0),
        adsk.core.Point3D.create(fw/2, h/2, 0),
        adsk.core.Point3D.create(-fw/2, h/2, 0),
        adsk.core.Point3D.create(-fw/2, h/2 - ft, 0),
        adsk.core.Point3D.create(-wt/2, h/2 - ft, 0),
        adsk.core.Point3D.create(-wt/2, -h/2 + ft, 0),
        adsk.core.Point3D.create(-fw/2, -h/2 + ft, 0),
    ]
    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i+1) % len(pts)])

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({length}))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("I-Beam created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "channel_beam",
    keywords: ["channel beam", "c-channel", "c channel", "u-channel", "u channel", "kanal", "profile c", "beam channel"],
    label: "Channel Beam",
    params: ["height", "flange_w", "flange_t", "web_t", "length"],
    defaults: { height: 8, flange_w: 4, flange_t: 0.6, web_t: 0.5, length: 20 },
    template: `try:
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    h = {height}
    fw = {flange_w}
    ft = {flange_t}
    wt = {web_t}

    # C-channel profile
    pts = [
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create(fw, 0, 0),
        adsk.core.Point3D.create(fw, ft, 0),
        adsk.core.Point3D.create(wt, ft, 0),
        adsk.core.Point3D.create(wt, h - ft, 0),
        adsk.core.Point3D.create(fw, h - ft, 0),
        adsk.core.Point3D.create(fw, h, 0),
        adsk.core.Point3D.create(0, h, 0),
    ]
    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i+1) % len(pts)])

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({length}))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Channel beam created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "t_beam",
    keywords: ["t-beam", "tbeam", "t beam", "t-profile", "profile t"],
    label: "T-Beam",
    params: ["height", "flange_w", "flange_t", "web_t", "length"],
    defaults: { height: 8, flange_w: 6, flange_t: 0.8, web_t: 0.5, length: 20 },
    template: `try:
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    h = {height}
    fw = {flange_w}
    ft = {flange_t}
    wt = {web_t}

    # T-beam profile
    pts = [
        adsk.core.Point3D.create(-fw/2, 0, 0),
        adsk.core.Point3D.create(fw/2, 0, 0),
        adsk.core.Point3D.create(fw/2, ft, 0),
        adsk.core.Point3D.create(wt/2, ft, 0),
        adsk.core.Point3D.create(wt/2, h, 0),
        adsk.core.Point3D.create(-wt/2, h, 0),
        adsk.core.Point3D.create(-wt/2, ft, 0),
        adsk.core.Point3D.create(-fw/2, ft, 0),
    ]
    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i+1) % len(pts)])

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({length}))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("T-Beam created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "l_beam",
    keywords: ["l-beam", "lbeam", "l beam", "angle iron", "angle beam", "angle profile"],
    label: "L-Beam",
    params: ["width", "height", "thickness", "length"],
    defaults: { width: 5, height: 5, thickness: 0.5, length: 20 },
    template: `try:
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    w = {width}
    h = {height}
    t = {thickness}

    # L-beam profile
    pts = [
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create(w, 0, 0),
        adsk.core.Point3D.create(w, t, 0),
        adsk.core.Point3D.create(t, t, 0),
        adsk.core.Point3D.create(t, h, 0),
        adsk.core.Point3D.create(0, h, 0),
    ]
    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i+1) % len(pts)])

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({length}))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("L-Beam created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  // =========================================================================
  // GEAR VARIANTS
  // =========================================================================
  {
    id: "bevel_gear",
    keywords: ["bevel", "bevel gear", "conical gear", "gear bevel", "gigi bevel"],
    label: "Bevel Gear",
    params: ["teeth", "module", "face_width", "cone_angle", "bore_d"],
    defaults: { teeth: 20, module: 0.15, face_width: 1.0, cone_angle: 45, bore_d: 0.8 },
    template: `try:
    import math
    teeth = {teeth}
    module = {module}
    face_width = {face_width}
    cone_angle = {cone_angle}
    bore_d = {bore_d}

    pitch_r = (teeth * module) / 2
    outer_r = pitch_r + module
    bore_r = bore_d / 2
    taper = math.radians(90 - cone_angle)

    xyPlane = rootComp.xYConstructionPlane

    # Outer cone (extrude circle with taper)
    outerSketch = rootComp.sketches.add(xyPlane)
    outerSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), outer_r)
    outerProf = outerSketch.profiles.item(0)
    outerExt = rootComp.features.extrudeFeatures.createInput(outerProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    outerExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(face_width))
    outerExt.taperAngle = adsk.core.ValueInput.createByReal(-taper)
    rootComp.features.extrudeFeatures.add(outerExt)

    # Bore hole (cut)
    boreSketch = rootComp.sketches.add(xyPlane)
    boreSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), bore_r)
    boreProf = boreSketch.profiles.item(0)
    boreCut = rootComp.features.extrudeFeatures.createInput(boreProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    boreCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal(face_width))
    rootComp.features.extrudeFeatures.add(boreCut)

    ui.messageBox(f"Bevel gear created: {teeth} teeth, cone angle {cone_angle} deg")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "gear_rack",
    keywords: ["rack", "gear rack", "rack gear", "linear gear", "rel gigi", "rak"],
    label: "Gear Rack",
    params: ["teeth", "module", "face_width", "height", "length"],
    defaults: { teeth: 20, module: 0.15, face_width: 1.0, height: 2.0, length: 10 },
    template: `try:
    import math
    teeth = {teeth}
    module = {module}
    face_width = {face_width}
    height = {height}
    length = {length}

    pitch = module * math.pi
    tooth_h = module * 2.25
    tooth_w = pitch * 0.5

    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines

    # Rack profile with teeth
    pts = [adsk.core.Point3D.create(0, 0, 0)]
    for i in range(teeth):
        x_base = i * pitch
        pts.append(adsk.core.Point3D.create(x_base, height, 0))
        pts.append(adsk.core.Point3D.create(x_base + tooth_w/2, height + tooth_h, 0))
        pts.append(adsk.core.Point3D.create(x_base + tooth_w, height, 0))
    pts.append(adsk.core.Point3D.create(teeth * pitch, 0, 0))

    for i in range(len(pts) - 1):
        lines.addByTwoPoints(pts[i], pts[i + 1])
    lines.addByTwoPoints(pts[-1], pts[0])

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(face_width))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox(f"Gear rack created: {teeth} teeth")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  // =========================================================================
  // MECHANICAL COMPONENTS
  // =========================================================================
  {
    id: "cam",
    keywords: ["cam", "eccentric", "lobe", "camshaft"],
    label: "Cam",
    params: ["base_r", "lobe_r", "eccentricity", "thickness", "bore_d"],
    defaults: { base_r: 3, lobe_r: 4, eccentricity: 1.5, thickness: 1.0, bore_d: 1.0 },
    template: `try:
    import math
    base_r = {base_r}
    lobe_r = {lobe_r}
    ecc = {eccentricity}
    thickness = {thickness}
    bore_d = {bore_d}

    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)

    # Cam profile using spline points
    points = adsk.core.ObjectCollection.create()
    segments = 72
    for i in range(segments + 1):
        angle = 2 * math.pi * i / segments
        # Base circle + lobe
        r = base_r + ecc * (1 + math.cos(angle)) / 2
        x = r * math.cos(angle)
        y = r * math.sin(angle)
        points.add(adsk.core.Point3D.create(x, y, 0))

    sketch.sketchCurves.sketchFittedSplines.add(points)

    # Bore hole
    sketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), bore_d / 2)

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(thickness))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Cam created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "lever",
    keywords: ["lever", "tuas", "arm", "handle", "control arm"],
    label: "Lever",
    params: ["length", "width", "thickness", "pivot_d", "hole_d"],
    defaults: { length: 15, width: 3, thickness: 1.0, pivot_d: 2.0, hole_d: 0.8 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    length = {length}
    width = {width}
    thickness = {thickness}
    pivot_d = {pivot_d}
    hole_d = {hole_d}

    # Lever profile (rounded rectangle with holes)
    r = width / 2
    pts = [
        adsk.core.Point3D.create(0, -r, 0),
        adsk.core.Point3D.create(length - r, -r, 0),
        adsk.core.Point3D.create(length, 0, 0),
        adsk.core.Point3D.create(length - r, r, 0),
        adsk.core.Point3D.create(0, r, 0),
    ]
    for i in range(len(pts) - 1):
        lines.addByTwoPoints(pts[i], pts[i + 1])
    lines.addByTwoPoints(pts[-1], pts[0])

    # Pivot hole at start
    sketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), pivot_d / 2)
    # End hole
    sketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(length - r, 0, 0), hole_d / 2)

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(thickness))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Lever created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "piston",
    keywords: ["piston", "torak", "plunger", "cylinder piston"],
    label: "Piston",
    params: ["diameter", "height", "bore_d", "ring_grooves", "pin_d"],
    defaults: { diameter: 5, height: 8, bore_d: 1.5, ring_grooves: 3, pin_d: 1.0 },
    template: `try:
    import math
    diameter = {diameter}
    height = {height}
    bore_d = {bore_d}
    ring_grooves = {ring_grooves}
    pin_d = {pin_d}

    xyPlane = rootComp.xYConstructionPlane

    # Main piston body (revolve)
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    r = diameter / 2
    bore_r = bore_d / 2

    # Piston profile
    pts = [
        adsk.core.Point3D.create(bore_r, 0, 0),
        adsk.core.Point3D.create(r, 0, 0),
        adsk.core.Point3D.create(r, height, 0),
        adsk.core.Point3D.create(bore_r, height, 0),
    ]
    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i+1) % len(pts)])

    prof = sketch.profiles.item(0)
    revolveInput = rootComp.features.revolveFeatures.createInput(prof, rootComp.zConstructionAxis, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    revolveInput.setAngleExtent(6.283185307179586)
    rootComp.features.revolveFeatures.add(revolveInput)

    # Pin hole through center
    pinSketch = rootComp.sketches.add(rootComp.xZConstructionPlane)
    pinSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, height * 0.3, 0), pin_d / 2)
    pinProf = pinSketch.profiles.item(0)
    pinCut = rootComp.features.extrudeFeatures.createInput(pinProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    pinCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal(diameter))
    rootComp.features.extrudeFeatures.add(pinCut)

    ui.messageBox("Piston created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "nut",
    keywords: ["nut", "mur", "hex nut", "fastener nut", "m4 nut", "m6 nut", "m8 nut"],
    label: "Hex Nut",
    params: ["outer_d", "height", "bore_d"],
    defaults: { outer_d: 1.3, height: 0.65, bore_d: 0.8 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    r = {outer_d} / 2
    pts = [adsk.core.Point3D.create(r * math.cos(math.pi/3 * i), r * math.sin(math.pi/3 * i), 0) for i in range(6)]
    lines = sketch.sketchCurves.sketchLines
    for i in range(6):
        lines.addByTwoPoints(pts[i], pts[(i+1) % 6])

    # Bore hole
    sketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {bore_d} / 2)

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({height}))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox("Hex nut created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "pipe_tee",
    keywords: ["tee", "pipe tee", "t-pipe", "t pipe", "tee fitting", "t-fitting"],
    label: "Pipe Tee",
    params: ["outer_d", "inner_d", "branch_d", "length", "branch_length"],
    defaults: { outer_d: 3, inner_d: 2.4, branch_d: 2, length: 10, branch_length: 5 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane

    # Main pipe body (first body)
    mainSketch = rootComp.sketches.add(xyPlane)
    circles = mainSketch.sketchCurves.sketchCircles
    circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {outer_d}/2)
    circles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {inner_d}/2)
    mainProf = mainSketch.profiles.item(0)
    mainExt = rootComp.features.extrudeFeatures.createInput(mainProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    mainExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal({length}))
    rootComp.features.extrudeFeatures.add(mainExt)

    # Branch pipe (perpendicular along Y, overlaps main pipe at origin)
    branchSketch = rootComp.sketches.add(rootComp.xZConstructionPlane)
    branchCircles = branchSketch.sketchCurves.sketchCircles
    branchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {branch_d}/2)
    branchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {branch_d}/2 - ({outer_d}/2 - {inner_d}/2))
    branchProf = branchSketch.profiles.item(0)
    branchExt = rootComp.features.extrudeFeatures.createInput(branchProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
    branchExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal({branch_length}))
    rootComp.features.extrudeFeatures.add(branchExt)
    ui.messageBox("Pipe tee created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "valve_body",
    keywords: ["valve", "valve body", "katup", "shut-off", "ball valve", "gate valve"],
    label: "Valve Body",
    params: ["body_d", "bore_d", "flange_d", "height", "port_d"],
    defaults: { body_d: 5, bore_d: 2, flange_d: 7, height: 8, port_d: 1.5 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane

    # Main body cylinder (first body)
    bodySketch = rootComp.sketches.add(xyPlane)
    bodySketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {body_d}/2)
    bodyProf = bodySketch.profiles.item(0)
    bodyExt = rootComp.features.extrudeFeatures.createInput(bodyProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    bodyExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal({height}))
    rootComp.features.extrudeFeatures.add(bodyExt)

    # Main bore (cut)
    boreSketch = rootComp.sketches.add(xyPlane)
    boreSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {bore_d}/2)
    boreProf = boreSketch.profiles.item(0)
    boreCut = rootComp.features.extrudeFeatures.createInput(boreProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    boreCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal({height}))
    rootComp.features.extrudeFeatures.add(boreCut)

    # Side port (cut)
    yzPlane = rootComp.yZConstructionPlane
    portSketch = rootComp.sketches.add(yzPlane)
    portSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, {height}/2, 0), {port_d}/2)
    portProf = portSketch.profiles.item(0)
    portCut = rootComp.features.extrudeFeatures.createInput(portProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    portCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal({body_d}/2))
    rootComp.features.extrudeFeatures.add(portCut)

    # Flanges at top and bottom (joined, overlap into main body)
    flange_t = 0.3
    overlap = 0.05
    flange_positions = [-overlap, {height} - flange_t + overlap]
    for z_pos in flange_positions:
        planeInput = rootComp.constructionPlanes.createInput()
        planeInput.setByOffset(xyPlane, adsk.core.ValueInput.createByReal(z_pos))
        flangePlane = rootComp.constructionPlanes.add(planeInput)
        flangeSketch = rootComp.sketches.add(flangePlane)
        flangeSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {flange_d}/2)
        flangeSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), {body_d}/2)
        flangeProf = flangeSketch.profiles.item(0)
        flangeExt = rootComp.features.extrudeFeatures.createInput(flangeProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
        flangeExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(flange_t))
        rootComp.features.extrudeFeatures.add(flangeExt)

    ui.messageBox("Valve body created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "bracket_gusset",
    keywords: ["gusset", "reinforced bracket", "bracket gusset", "stiffened bracket", "bracket reinforcement", "bracket with gusset", "gusset bracket", "dengan gusset", "bracket gusset"],
    label: "Bracket with Gussets",
    params: ["width", "height", "thickness", "depth", "gusset_size"],
    defaults: { width: 8, height: 6, thickness: 0.5, depth: 2, gusset_size: 2 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines
    t = {thickness}
    w = {width}
    h = {height}
    gs = {gusset_size}

    # L-bracket profile
    pts = [
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create(w, 0, 0),
        adsk.core.Point3D.create(w, t, 0),
        adsk.core.Point3D.create(t, t, 0),
        adsk.core.Point3D.create(t, h, 0),
        adsk.core.Point3D.create(0, h, 0),
    ]
    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i+1) % len(pts)])

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({depth}))
    rootComp.features.extrudeFeatures.add(extInput)

    # Gusset (triangular reinforcement, joined — overlaps into bracket arms)
    overlap = 0.05
    gussetSketch = rootComp.sketches.add(xyPlane)
    gLines = gussetSketch.sketchCurves.sketchLines
    gPts = [
        adsk.core.Point3D.create(t - overlap, t - overlap, 0),
        adsk.core.Point3D.create(t + gs, t - overlap, 0),
        adsk.core.Point3D.create(t - overlap, t + gs, 0),
    ]
    for i in range(3):
        gLines.addByTwoPoints(gPts[i], gPts[(i+1) % 3])
    gProf = gussetSketch.profiles.item(0)
    gExt = rootComp.features.extrudeFeatures.createInput(gProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
    gExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal({depth}))
    rootComp.features.extrudeFeatures.add(gExt)
    ui.messageBox("Bracket with gusset created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "crankshaft",
    keywords: ["crankshaft", "crank", "crank shaft", "engkol", "engine shaft"],
    label: "Crankshaft",
    params: ["main_journal_d", "crank_pin_d", "throw", "web_thickness", "length"],
    defaults: { main_journal_d: 3, crank_pin_d: 2.5, throw: 3, web_thickness: 1.5, length: 15 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    mj_r = {main_journal_d} / 2
    cp_r = {crank_pin_d} / 2
    crank_throw = {throw}
    wt = {web_thickness}
    half_w = max(mj_r, cp_r) * 1.2

    # Single profile crankshaft (side view on XY, extrude in Z)
    sketch = rootComp.sketches.add(xyPlane)
    lines = sketch.sketchCurves.sketchLines

    # Outline: journal1-bottom → journal1-right → web-right → pin-right → pin-top-right → web-right → journal2-right → journal2-top → journal2-left → web-left → pin-top-left → pin-left → web-left → journal1-left → close
    pts = [
        adsk.core.Point3D.create(-half_w, 0, 0),
        adsk.core.Point3D.create(half_w, 0, 0),
        adsk.core.Point3D.create(half_w, mj_r, 0),
        adsk.core.Point3D.create(cp_r, crank_throw - cp_r, 0),
        adsk.core.Point3D.create(cp_r, crank_throw + cp_r, 0),
        adsk.core.Point3D.create(half_w, crank_throw * 2 - mj_r, 0),
        adsk.core.Point3D.create(half_w, crank_throw * 2, 0),
        adsk.core.Point3D.create(-half_w, crank_throw * 2, 0),
        adsk.core.Point3D.create(-half_w, crank_throw * 2 - mj_r, 0),
        adsk.core.Point3D.create(-cp_r, crank_throw + cp_r, 0),
        adsk.core.Point3D.create(-cp_r, crank_throw - cp_r, 0),
        adsk.core.Point3D.create(-half_w, mj_r, 0),
    ]
    for i in range(len(pts)):
        lines.addByTwoPoints(pts[i], pts[(i+1) % len(pts)])

    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(wt))
    rootComp.features.extrudeFeatures.add(extInput)

    ui.messageBox("Crankshaft created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "housing_ribs",
    keywords: ["housing", "ribbed", "ribs", "reinforced housing", "finned", "heatsink", "heat sink"],
    label: "Housing with Ribs",
    params: ["width", "depth", "height", "wall", "ribs", "rib_thickness"],
    defaults: { width: 10, depth: 8, height: 6, wall: 0.3, ribs: 4, rib_thickness: 0.3 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane

    # Main housing body (first body)
    sketch = rootComp.sketches.add(xyPlane)
    sketch.sketchCurves.sketchLines.addTwoPointRectangle(
        adsk.core.Point3D.create(0, 0, 0),
        adsk.core.Point3D.create({width}, {depth}, 0)
    )
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal({height}))
    box = rootComp.features.extrudeFeatures.add(extInput)

    # Shell the box
    faces = adsk.core.ObjectCollection.create()
    faces.add(box.bodies.item(0).faces.item(4))
    shellInput = rootComp.features.shellFeatures.createInput(faces, False)
    shellInput.insideThickness = adsk.core.ValueInput.createByReal({wall})
    rootComp.features.shellFeatures.add(shellInput)

    # Add ribs on the outside (joined to main body)
    ribs = {ribs}
    rib_t = {rib_thickness}
    rib_h = {height}
    spacing = {depth} / (ribs + 1)

    for i in range(1, ribs + 1):
        y = spacing * i
        ribSketch = rootComp.sketches.add(xyPlane)
        ribLines = ribSketch.sketchCurves.sketchLines
        ribPts = [
            adsk.core.Point3D.create(0, y - rib_t/2, 0),
            adsk.core.Point3D.create({width}, y - rib_t/2, 0),
            adsk.core.Point3D.create({width}, y + rib_t/2, 0),
            adsk.core.Point3D.create(0, y + rib_t/2, 0),
        ]
        for j in range(4):
            ribLines.addByTwoPoints(ribPts[j], ribPts[(j+1) % 4])
        ribProf = ribSketch.profiles.item(0)
        ribExt = rootComp.features.extrudeFeatures.createInput(ribProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
        ribExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(rib_h * 0.6))
        rootComp.features.extrudeFeatures.add(ribExt)

    ui.messageBox("Housing with ribs created!")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "spoked_wheel",
    keywords: ["roda", "wheel", "spoke", "spoked", "jari-jari roda", "rim", "hub wheel"],
    label: "Spoked Wheel",
    params: ["outer_d", "hub_d", "bore_d", "spokes", "spoke_w", "thickness"],
    defaults: { outer_d: 10, hub_d: 3, bore_d: 2, spokes: 5, spoke_w: 1.0, thickness: 1.0 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    outer_r = {outer_d} / 2
    hub_r = {hub_d} / 2
    bore_r = {bore_d} / 2
    n_spokes = {spokes}
    sw = {spoke_w}
    t = {thickness}
    rim_inner = outer_r - sw

    # Rim (outer ring)
    rimSketch = rootComp.sketches.add(xyPlane)
    rimSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), outer_r)
    rimSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), rim_inner)
    rimProf = rimSketch.profiles.item(0)
    rimExt = rootComp.features.extrudeFeatures.createInput(rimProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    rimExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(t))
    rootComp.features.extrudeFeatures.add(rimExt)

    # Hub (inner ring)
    hubSketch = rootComp.sketches.add(xyPlane)
    hubSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), hub_r)
    hubSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), bore_r)
    hubProf = hubSketch.profiles.item(0)
    hubExt = rootComp.features.extrudeFeatures.createInput(hubProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
    hubExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(t))
    rootComp.features.extrudeFeatures.add(hubExt)

    # Spokes (rectangular bars from hub to rim)
    spoke_l = rim_inner - hub_r
    for i in range(n_spokes):
        angle = 2 * math.pi * i / n_spokes
        cos_a = math.cos(angle)
        sin_a = math.sin(angle)
        cos_p = -sin_a
        sin_p = cos_a
        hw = sw / 2
        cx = (hub_r + rim_inner) / 2 * cos_a
        cy = (hub_r + rim_inner) / 2 * sin_a
        pts = [
            adsk.core.Point3D.create(cx + spoke_l/2 * cos_a + hw * cos_p, cy + spoke_l/2 * sin_a + hw * sin_p, 0),
            adsk.core.Point3D.create(cx - spoke_l/2 * cos_a + hw * cos_p, cy - spoke_l/2 * sin_a + hw * sin_p, 0),
            adsk.core.Point3D.create(cx - spoke_l/2 * cos_a - hw * cos_p, cy - spoke_l/2 * sin_a - hw * sin_p, 0),
            adsk.core.Point3D.create(cx + spoke_l/2 * cos_a - hw * cos_p, cy + spoke_l/2 * sin_a - hw * sin_p, 0),
        ]
        sSketch = rootComp.sketches.add(xyPlane)
        sLines = sSketch.sketchCurves.sketchLines
        for j in range(4):
            sLines.addByTwoPoints(pts[j], pts[(j+1) % 4])
        sProf = sSketch.profiles.item(0)
        sExt = rootComp.features.extrudeFeatures.createInput(sProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
        sExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(t))
        rootComp.features.extrudeFeatures.add(sExt)

    ui.messageBox(f"Spoked wheel created: {n_spokes} spokes, Ø{outer_d}cm")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "cone",
    keywords: ["cone", "kerucut", "tapered cylinder", "truncated cone", "frustum"],
    label: "Cone",
    params: ["base_d", "top_d", "height"],
    defaults: { base_d: 5, top_d: 2.5, height: 6 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    base_r = {base_d} / 2
    top_r = {top_d} / 2
    h = {height}
    taper = math.degrees(math.atan2(base_r - top_r, h))

    # Base circle with taper extrude
    sketch = rootComp.sketches.add(xyPlane)
    sketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), base_r)
    prof = sketch.profiles.item(0)
    extInput = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extInput.setDistanceExtent(False, adsk.core.ValueInput.createByReal(h))
    extInput.taperAngle = adsk.core.ValueInput.createByReal(-math.radians(taper))
    rootComp.features.extrudeFeatures.add(extInput)
    ui.messageBox(f"Cone created: base Ø{base_d}cm, top Ø{top_d}cm, height {h}cm")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "spiral_staircase",
    keywords: ["spiral", "staircase", "tangga spiral", "spiral stair", "helical stair", "tangga putar"],
    label: "Spiral Staircase",
    params: ["radius", "height", "steps", "step_thickness", "step_depth", "pole_d"],
    defaults: { radius: 50, height: 300, steps: 15, step_thickness: 2, step_depth: 25, pole_d: 5 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    r = {radius}
    total_h = {height}
    n = {steps}
    st = {step_thickness}
    sd = {step_depth}
    pole_r = {pole_d} / 2
    step_angle = 2 * math.pi / n
    rise = total_h / n

    # Central pole
    poleSketch = rootComp.sketches.add(xyPlane)
    poleSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), pole_r)
    poleProf = poleSketch.profiles.item(0)
    poleExt = rootComp.features.extrudeFeatures.createInput(poleProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    poleExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(total_h))
    rootComp.features.extrudeFeatures.add(poleExt)

    # Steps (each step is a wedge shape)
    for i in range(n):
        angle_start = step_angle * i
        angle_end = angle_start + step_angle * 0.7
        z = rise * i

        # Create construction plane at z height
        planeInput = rootComp.constructionPlanes.createInput()
        planeInput.setByOffset(xyPlane, adsk.core.ValueInput.createByReal(z))
        stepPlane = rootComp.constructionPlanes.add(planeInput)

        stepSketch = rootComp.sketches.add(stepPlane)
        lines = stepSketch.sketchCurves.sketchLines

        # Wedge shape: inner arc to outer arc
        inner_r = pole_r
        outer_r = r
        segments = 8

        # Outer arc points
        outer_pts = []
        for s in range(segments + 1):
            a = angle_start + (angle_end - angle_start) * s / segments
            outer_pts.append(adsk.core.Point3D.create(outer_r * math.cos(a), outer_r * math.sin(a), 0))

        # Inner arc points (reverse)
        inner_pts = []
        for s in range(segments + 1):
            a = angle_end - (angle_end - angle_start) * s / segments
            inner_pts.append(adsk.core.Point3D.create(inner_r * math.cos(a), inner_r * math.sin(a), 0))

        all_pts = outer_pts + inner_pts
        for j in range(len(all_pts)):
            lines.addByTwoPoints(all_pts[j], all_pts[(j + 1) % len(all_pts)])

        stepProf = stepSketch.profiles.item(0)
        stepExt = rootComp.features.extrudeFeatures.createInput(stepProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
        stepExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(st))
        rootComp.features.extrudeFeatures.add(stepExt)

    ui.messageBox(f"Spiral staircase: {n} steps, radius {r}cm, height {total_h}cm")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  {
    id: "bottle",
    keywords: ["bottle", "botol", "flask", "tabung", "container"],
    label: "Bottle",
    params: ["body_d", "body_h", "neck_d", "neck_h", "wall"],
    defaults: { body_d: 6, body_h: 20, neck_d: 2, neck_h: 3, wall: 0.2 },
    template: `try:
    import math
    xyPlane = rootComp.xYConstructionPlane
    body_r = {body_d} / 2
    neck_r = {neck_d} / 2
    bh = {body_h}
    nh = {neck_h}
    wall = {wall}
    shoulder_h = (body_r - neck_r) * 1.2

    # Body cylinder
    bodySketch = rootComp.sketches.add(xyPlane)
    bodySketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), body_r)
    bodyProf = bodySketch.profiles.item(0)
    bodyExt = rootComp.features.extrudeFeatures.createInput(bodyProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    bodyExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(bh))
    rootComp.features.extrudeFeatures.add(bodyExt)

    # Shoulder (taper from body_r to neck_r)
    shoulderPlane = rootComp.constructionPlanes.createInput()
    shoulderPlane.setByOffset(xyPlane, adsk.core.ValueInput.createByReal(bh))
    sPlane = rootComp.constructionPlanes.add(shoulderPlane)
    shoulderSketch = rootComp.sketches.add(sPlane)
    shoulderSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), body_r)
    shoulderProf = shoulderSketch.profiles.item(0)
    shoulderExt = rootComp.features.extrudeFeatures.createInput(shoulderProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
    shoulderExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(shoulder_h))
    taper = math.atan2(body_r - neck_r, shoulder_h)
    shoulderExt.taperAngle = adsk.core.ValueInput.createByReal(-taper)
    rootComp.features.extrudeFeatures.add(shoulderExt)

    # Neck cylinder
    neckPlane = rootComp.constructionPlanes.createInput()
    neckPlane.setByOffset(xyPlane, adsk.core.ValueInput.createByReal(bh + shoulder_h))
    nPlane = rootComp.constructionPlanes.add(neckPlane)
    neckSketch = rootComp.sketches.add(nPlane)
    neckSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), neck_r)
    neckProf = neckSketch.profiles.item(0)
    neckExt = rootComp.features.extrudeFeatures.createInput(neckProf, adsk.fusion.FeatureOperations.JoinFeatureOperation)
    neckExt.setDistanceExtent(False, adsk.core.ValueInput.createByReal(nh))
    rootComp.features.extrudeFeatures.add(neckExt)

    # Hollow interior (cut)
    innerSketch = rootComp.sketches.add(xyPlane)
    innerSketch.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(0, 0, 0), body_r - wall)
    innerProf = innerSketch.profiles.item(0)
    innerCut = rootComp.features.extrudeFeatures.createInput(innerProf, adsk.fusion.FeatureOperations.CutFeatureOperation)
    innerCut.setDistanceExtent(False, adsk.core.ValueInput.createByReal(bh + shoulder_h + nh))
    rootComp.features.extrudeFeatures.add(innerCut)

    ui.messageBox(f"Bottle created: body Ø{body_d}cm, neck Ø{neck_d}cm")
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },

  // =========================================================================
  // AGRI-TRUST: L-SHAPE CAMERA POLE
  // =========================================================================
  {
    id: "l_shape_camera_pole",
    keywords: [
      "tiang kamera", "camera pole", "camera mount", "l-shape camera",
      "l shape camera", "tiang ov2640", "camera stand", "dudukan kamera",
      "acrylic pole", "tiang akrilik", "independent mount", "load cell mount",
      "agri-trust", "agritrust", "tiang timbangan", "camera bracket timbangan",
      "l-shape pole", "l shape pole", "tiang l", "tiang camera independent",
    ],
    label: "L-Shape Camera Pole (Agri-Trust)",
    params: [
      "tinggi_tiang", "lebar_tiang", "panjang_lengan", "lebar_lengan",
      "tebal", "base_size", "notch_width", "notch_depth",
      "lubang_lensa", "poke_d", "poke_pitch", "num_poke",
    ],
    defaults: {
      tinggi_tiang: 250,
      lebar_tiang: 120,
      panjang_lengan: 120,
      lebar_lengan: 50,
      tebal: 3,
      base_size: 100,
      notch_width: 30,
      notch_depth: 60,
      lubang_lensa: 9,
      poke_d: 2,
      poke_pitch: 12,
      num_poke: 4,
    },
    template: `try:
    import math
    design = adsk.fusion.Design.cast(app.activeProduct)
    rootComp = design.rootComponent

    def mm(v):
        return v / 10.0

    T       = {tebal}
    TINGGI  = {tinggi_tiang}
    LEBAR_T = {lebar_tiang}
    LENGA   = {panjang_lengan}
    LEBAR_L = {lebar_lengan}
    BASE    = {base_size}
    N_W     = {notch_width}
    N_D     = {notch_depth}
    LUBANG  = {lubang_lensa}
    POKE    = {poke_d}
    PITCH   = {poke_pitch}
    N_POKE  = {num_poke}

    half = mm(BASE) / 2.0

    # === BASE + C-NOTCH ===
    baseSk = rootComp.sketches.add(rootComp.xYConstructionPlane)
    baseSk.name = "Base_CNotch"
    L = baseSk.sketchCurves.sketchLines
    h = half
    L.addByTwoPoints(adsk.core.Point3D.create(-h, -h, 0), adsk.core.Point3D.create( h, -h, 0))
    L.addByTwoPoints(adsk.core.Point3D.create( h, -h, 0), adsk.core.Point3D.create( h,  h, 0))
    L.addByTwoPoints(adsk.core.Point3D.create( h,  h, 0), adsk.core.Point3D.create(-h,  h, 0))
    L.addByTwoPoints(adsk.core.Point3D.create(-h,  h, 0), adsk.core.Point3D.create(-h, -h, 0))
    nw = mm(N_W) / 2.0
    nd = mm(N_D)
    L.addByTwoPoints(adsk.core.Point3D.create(-nw, -h, 0), adsk.core.Point3D.create(-nw, -h + nd, 0))
    L.addByTwoPoints(adsk.core.Point3D.create(-nw, -h + nd, 0), adsk.core.Point3D.create( nw, -h + nd, 0))
    L.addByTwoPoints(adsk.core.Point3D.create( nw, -h + nd, 0), adsk.core.Point3D.create( nw, -h, 0))
    baseProf = baseSk.profiles.item(0)
    extBase = rootComp.features.extrudeFeatures.createInput(baseProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extBase.setDistanceExtent(False, adsk.core.ValueInput.createByReal(mm(T)))
    baseFeat = rootComp.features.extrudeFeatures.add(extBase)
    baseFeat.name = "Base"

    # === TIANG VERTIKAL ===
    tSk = rootComp.sketches.add(rootComp.xYConstructionPlane)
    tSk.name = "Tiang_Vertikal"
    TL = tSk.sketchCurves.sketchLines
    tw = mm(LEBAR_T) / 2.0
    y0 = -h + mm(T)
    y1 = y0 + mm(TINGGI)
    TL.addByTwoPoints(adsk.core.Point3D.create(-tw, y0, 0), adsk.core.Point3D.create( tw, y0, 0))
    TL.addByTwoPoints(adsk.core.Point3D.create( tw, y0, 0), adsk.core.Point3D.create( tw, y1, 0))
    TL.addByTwoPoints(adsk.core.Point3D.create( tw, y1, 0), adsk.core.Point3D.create(-tw, y1, 0))
    TL.addByTwoPoints(adsk.core.Point3D.create(-tw, y1, 0), adsk.core.Point3D.create(-tw, y0, 0))
    tProf = tSk.profiles.item(0)
    extT = rootComp.features.extrudeFeatures.createInput(tProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extT.setDistanceExtent(False, adsk.core.ValueInput.createByReal(mm(T)))
    tiangFeat = rootComp.features.extrudeFeatures.add(extT)
    tiangFeat.name = "Tiang_Vertikal"

    # === LENGAN HORIZONTAL ===
    lSk = rootComp.sketches.add(rootComp.xYConstructionPlane)
    lSk.name = "Lengan_Horizontal"
    LL = lSk.sketchCurves.sketchLines
    lw = mm(LENGA) / 2.0
    y2 = y1 + mm(LEBAR_L)
    LL.addByTwoPoints(adsk.core.Point3D.create(-lw, y1, 0), adsk.core.Point3D.create( lw, y1, 0))
    LL.addByTwoPoints(adsk.core.Point3D.create( lw, y1, 0), adsk.core.Point3D.create( lw, y2, 0))
    LL.addByTwoPoints(adsk.core.Point3D.create( lw, y2, 0), adsk.core.Point3D.create(-lw, y2, 0))
    LL.addByTwoPoints(adsk.core.Point3D.create(-lw, y2, 0), adsk.core.Point3D.create(-lw, y1, 0))
    lProf = lSk.profiles.item(0)
    extL = rootComp.features.extrudeFeatures.createInput(lProf, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    extL.setDistanceExtent(False, adsk.core.ValueInput.createByReal(mm(T)))
    lenganFeat = rootComp.features.extrudeFeatures.add(extL)
    lenganFeat.name = "Lengan_Horizontal"

    # === LUBANG LENSA OV2640 + SMALL POKE (satu per satu) ===
    lenganBody = lenganFeat.bodies.item(0)
    cx = 0.0
    cy = y1 + mm(LEBAR_L) / 2.0

    def cutHole(hx, hy, hr, body, name):
        sk = rootComp.sketches.add(rootComp.xYConstructionPlane)
        sk.sketchCurves.sketchCircles.addByCenterRadius(adsk.core.Point3D.create(hx, hy, 0), hr)
        prof = sk.profiles.item(0)
        extIn = rootComp.features.extrudeFeatures.createInput(prof, adsk.fusion.FeatureOperations.CutFeatureOperation)
        bodies = adsk.core.ObjectCollection.create()
        bodies.add(body)
        extIn.participantBodies = bodies
        extIn.setDistanceExtent(False, adsk.core.ValueInput.createByReal(mm(T) + 1.0))
        feat = rootComp.features.extrudeFeatures.add(extIn)
        feat.name = name

    try:
        cutHole(cx, cy, mm(LUBANG) / 2.0, lenganBody, "Cut_Lensa")
    except Exception as e1:
        ui.messageBox(f"Cut lensa gagal: {e1}\\nBody: {lenganBody.isValid if lenganBody else 'None'}\\nBodies count: {rootComp.bRepBodies.count}")
    for i in range(N_POKE):
        a = 2 * math.pi * i / N_POKE
        sx = cx + mm(PITCH) * math.cos(a)
        sy = cy + mm(PITCH) * math.sin(a)
        try:
            cutHole(sx, sy, mm(POKE) / 2.0, lenganBody, f"Cut_Poke_{i+1}")
        except:
            pass

    # === FILLET R8 (simulasi hot bend) ===
    try:
        filletFeats = rootComp.features.filletFeatures
        filletInput = filletFeats.createInput()
        edges = adsk.core.ObjectCollection.create()
        for body in [tiangFeat.bodies.item(0), lenganFeat.bodies.item(0)]:
            for edge in body.edges:
                bbox = edge.boundingBox
                if bbox and abs(bbox.minPoint.y - y1) < mm(2):
                    edges.add(edge)
        if edges.count > 0:
            filletInput.addConstantRadiusEdgeSet(edges, adsk.core.ValueInput.createByReal(mm(8)), False)
            filletFeat = filletFeats.add(filletInput)
            filletFeat.name = "Tekuk_R8"
    except:
        pass

    ui.messageBox(
        "L-Shape Camera Pole selesai!\\\\n\\\\n"
        "Komponen:\\\\n"
        "  1. Base 100x100mm + C-Notch 30x60mm\\\\n"
        "  2. Tiang Vertikal 250x120mm\\\\n"
        "  3. Lengan Horizontal 120x50mm\\\\n"
        "  4. Lubang Lensa OV2640 (9mm) + 4x Poke (2mm)\\\\n"
        "  5. Fillet R8 (simulasi hot bend)"
    )
except Exception as e:
    ui.messageBox(f"Error: {str(e)}")`,
  },
];

// ---------------------------------------------------------------------------
// Parameter extraction from user prompt
// ---------------------------------------------------------------------------
const PARAM_PATTERNS = {
  // Dimensions
  width:       /(\d+(?:\.\d+)?)\s*(?:mm|cm)?\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/,
  depth:       null, // handled by width pattern (2nd value)
  height:      null, // handled by width pattern (3rd value)
  radius:      /[rR]\s*=?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?|(?:radius|jari-jari|jari)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  outer_r:     /(?:outer|luar)\s*(?:radius|jari)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  inner_r:     /(?:inner|dalam|bore)\s*(?:radius|jari)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  outer_d:     /(?:outer|luar)\s*(?:diameter|dia|Ø)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?|Ø\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  inner_d:     /(?:inner|dalam|bore)\s*(?:diameter|dia|Ø)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  thickness:   /(?:thickness|tebal|ketebalan|t)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  wall:        /(?:wall|dinding)\s*(?:thickness)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Gear
  teeth:       /(\d+)\s*(?:teeth|tooth|T|gigi)/i,
  module:      /module\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)/i,
  face_width:  /(?:face\s*width|lebar)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Bolt
  head_d:      /(?:head|kepala)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  head_h:      /(?:head|kepala)\s*(?:height|tinggi|h)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  shaft_d:     /(?:shaft|batang)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  shaft_l:     /(?:shaft|batang)\s*(?:length|panjang|l)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Drone
  arm_length:  /(?:arm|lengan)\s*(?:length|panjang)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  arm_width:   /(?:arm|lengan)\s*(?:width|lebar)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  arm_thickness: /(?:arm|lengan)\s*(?:thickness|tebal)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  center_size: /(?:center|tengah)\s*(?:size|ukuran)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  motor_hole_d: /(?:motor|mesin)\s*(?:hole|lubang)?\s*(?:diameter|dia)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  motor_spacing: /(?:motor|mesin)\s*(?:spacing|jarak)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Knob
  bottom_d:    /(?:bottom|bawah)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  bottom_h:    /(?:bottom|bawah)\s*(?:height|tinggi|h)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  top_d:       /(?:top|atas)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  top_h:       /(?:top|atas)\s*(?:height|tinggi|h)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  bore_d:      /(?:bore|lubang(?:\s*tengah)?)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Flange
  bolt_holes:  /(\d+)\s*(?:bolt\s*)?holes?/i,
  bolt_bolt_circle_d: /(?:bolt\s*circle|bcd|pcd)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  bolt_hole_d: /(?:bolt\s*hole|mounting\s*hole)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Spring
  coil_r:      /(?:coil|spiral)\s*(?:radius|jari)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  coil_d:      /(?:coil|spiral)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  wire_d:      /(?:wire|kawat)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  coils:       /(\d+)\s*(?:coils?|turns?|putaran)/i,
  pitch:       /pitch\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  free_length: /(?:free\s*length|panjang\s*bebas)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Bearing
  mount_hole_d: /(?:mount|mounting)\s*(?:hole|lubang)?\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  mount_spacing: /(?:mount|mounting)\s*(?:spacing|jarak)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Coupler
  set_screw_d: /(?:set\s*screw|baut)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Phone stand
  base_width:  /(?:base|alas)\s*(?:width|lebar)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  base_depth:  /(?:base|alas)\s*(?:depth|kedalaman)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  base_thickness: /(?:base|alas)\s*(?:thickness|tebal)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  back_height: /(?:back|belakang)\s*(?:height|tinggi)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  angle:       /(?:angle|sudut)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:deg|derajat|°)?/i,

  // Generic
  length:      /(?:length|panjang)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Indonesian language support
  diameter_id: /(?:diameter|dia|Ø)\s*(\d+(?:\.\d+)?)\s*(?:mm|cm|milimeter|sentimeter)?/i,
  radius_id:   /(?:radius|jari-jari|jari)\s*(\d+(?:\.\d+)?)\s*(?:mm|cm|milimeter|sentimeter)?/i,
  height_id:   /(?:tinggi)\s*(\d+(?:\.\d+)?)\s*(?:mm|cm|milimeter|sentimeter)?/i,
  width_id:    /(?:lebar)\s*(\d+(?:\.\d+)?)\s*(?:mm|cm|milimeter|sentimeter)?/i,
  length_id:   /(?:panjang)\s*(\d+(?:\.\d+)?)\s*(?:mm|cm|milimeter|sentimeter)?/i,
  thickness_id: /(?:tebal|ketebalan)\s*(\d+(?:\.\d+)?)\s*(?:mm|cm|milimeter|sentimeter)?/i,

  // Structural beams
  flange_w:    /(?:flange|sayap)\s*(?:width|lebar)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  flange_t:    /(?:flange|sayap)\s*(?:thickness|tebal)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  web_t:       /(?:web|badan)\s*(?:thickness|tebal)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Bevel gear
  cone_angle:  /(?:cone|kerucut)\s*(?:angle|sudut)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:deg|derajat|°)?/i,

  // Cam
  base_r:      /(?:base|dasar)\s*(?:radius|jari)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  lobe_r:      /(?:lobe|tonjolan)\s*(?:radius|jari)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  eccentricity: /(?:eccentric|eksentrik)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Lever
  pivot_d:     /(?:pivot|poros)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Piston
  ring_grooves: /(\d+)\s*(?:ring|ring groove|alur)/i,
  pin_d:       /(?:pin|pen)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Pipe tee
  branch_d:    /(?:branch|cabang)\s+(?:diameter|dia)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  branch_length: /(?:branch|cabang)\s+(?:(?:length|panjang)\s*(?:of|:|=)?\s*)?(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Valve
  body_d:      /(?:body|badan)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  flange_d:    /(?:flange|flensa)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  port_d:      /(?:port|lubang)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Bracket gusset
  gusset_size: /(?:gusset|penyokong)\s*(?:size|ukuran)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Crankshaft
  main_journal_d: /(?:main\s*journal|journal)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  crank_pin_d: /(?:crank\s*pin|pin)\s*(?:diameter|dia|d)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  throw:       /(?:throw|stroke)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // Housing ribs
  ribs:        /(\d+)\s*(?:ribs?|sirip)/i,
  rib_thickness: /(?:rib|sirip)\s*(?:thickness|tebal)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,

  // L-Shape Camera Pole (Agri-Trust)
  tinggi_tiang:  /(?:tinggi|height)\s*(?:tiang|pole)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  lebar_tiang:   /(?:lebar|width)\s*(?:tiang|pole)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  panjang_lengan: /(?:panjang|length)\s*(?:lengan|arm)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  lebar_lengan:  /(?:lebar|width)\s*(?:lengan|arm)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  base_size:     /(?:base|alas|dudukan)\s*(?:size|ukuran)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  notch_width:   /(?:notch|coakan)\s*(?:width|lebar)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  notch_depth:   /(?:notch|coakan)\s*(?:depth|kedalaman)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  lubang_lensa:  /(?:lensa|lens|lubang)\s*(?:diameter|dia)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  poke_d:        /(?:poke|small\s*hole)\s*(?:diameter|dia)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  poke_pitch:    /(?:poke|small\s*hole)\s*(?:pitch|jarak)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:mm|cm)?/i,
  num_poke:      /(\d+)\s*(?:poke|small\s*hole)/i,
};

// M8 bolt table: common bolt sizes mapped to dimensions
const BOLT_TABLE = {
  m4:  { head_d: 0.7, head_h: 0.28, shaft_d: 0.4, shaft_l: 2.0 },
  m5:  { head_d: 0.8, head_h: 0.35, shaft_d: 0.5, shaft_l: 2.5 },
  m6:  { head_d: 1.0, head_h: 0.4,  shaft_d: 0.6, shaft_l: 3.0 },
  m8:  { head_d: 1.3, head_h: 0.5,  shaft_d: 0.8, shaft_l: 4.0 },
  m10: { head_d: 1.6, head_h: 0.6,  shaft_d: 1.0, shaft_l: 5.0 },
  m12: { head_d: 1.8, head_h: 0.7,  shaft_d: 1.2, shaft_l: 6.0 },
};

function extractValue(pattern, prompt) {
  if (!pattern) return null;
  const match = prompt.match(pattern);
  if (!match) return null;
  // Find the first non-undefined capture group with a value
  for (let i = 1; i < match.length; i++) {
    if (match[i] !== undefined) {
      const val = parseFloat(match[i]);
      if (!isNaN(val)) return val;
    }
  }
  return null;
}

// Check if a specific value in the prompt is in mm (look at context around the number)
function isValueInMm(pattern, prompt) {
  if (!pattern) return false;
  const match = prompt.match(pattern);
  if (!match) return false;
  // Check if "mm" or "milimeter" appears after the captured number
  const fullMatch = match[0];
  return /\d+\s*(?:mm|milimeter)\b/i.test(fullMatch);
}

// Skip unit conversion for these count/angle params
const NO_CONVERT_PARAMS = new Set(["teeth", "coils", "bolt_holes", "angle", "ribs", "ring_grooves"]);

// Always convert from mm for these params (standard CAD convention)
const ALWAYS_MM_PARAMS = new Set(["module"]);

export function extractParameters(prompt, template) {
  const lower = prompt.toLowerCase();
  const params = {};

  // Pre-extract common dimensions (available for auto-derive even if not in template params)
  const commonPatterns = {
    thickness: /(?:thickness|tebal|ketebalan)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(mm|cm|milimeter|sentimeter)?/i,
    wall: /(?:wall|dinding)\s*(?:thickness)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(mm|cm|milimeter|sentimeter)?/i,
    outer_d: /(?:outer|luar)\s*(?:diameter|dia|Ø)?\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(mm|cm|milimeter|sentimeter)?/i,
    diameter: /(?:diameter|dia|Ø)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(mm|cm|milimeter|sentimeter)?/i,
  };
  for (const [key, pattern] of Object.entries(commonPatterns)) {
    if (params[key] !== undefined) continue;
    const match = prompt.match(pattern);
    if (match) {
      let val = parseFloat(match[1]);
      if (match[2] && (match[2].toLowerCase() === "mm" || match[2].toLowerCase() === "milimeter")) val /= 10;
      params[key] = val;
    }
  }
  // If "diameter" found but no "outer_d", use diameter as outer_d
  if (params.diameter && !params.outer_d) params.outer_d = params.diameter;

  // Check for bolt size table lookup (M4, M5, M6, M8, M10, M12)
  const boltMatch = lower.match(/\bm(\d+)\b/);
  if (boltMatch) {
    const size = `m${boltMatch[1]}`;
    if (BOLT_TABLE[size]) {
      if (template.id === "hex_bolt") {
        return { ...template.defaults, ...BOLT_TABLE[size] };
      }
      // For other templates: set mount_hole_d / bolt_hole_d to bolt shaft diameter
      const boltInfo = BOLT_TABLE[size];
      if (template.params.includes("mount_hole_d") && params.mount_hole_d === undefined) {
        params.mount_hole_d = boltInfo.shaft_d;
      }
      if (template.params.includes("bolt_hole_d") && params.bolt_hole_d === undefined) {
        params.bolt_hole_d = boltInfo.shaft_d;
      }
    }
  }

  // Extract each parameter using specific patterns first
  for (const paramName of template.params) {
    // Skip if already pre-extracted
    if (params[paramName] !== undefined) continue;

    let value = null;

    // Try specific pattern first
    if (PARAM_PATTERNS[paramName]) {
      value = extractValue(PARAM_PATTERNS[paramName], prompt);
      if (value !== null) {
        if (ALWAYS_MM_PARAMS.has(paramName)) {
          value = value / 10; // always assume mm
        } else if (!NO_CONVERT_PARAMS.has(paramName) && isValueInMm(PARAM_PATTERNS[paramName], prompt)) {
          value = value / 10;
        }
      }
    }

    // Handle width x depth x height pattern
    if (value === null && (paramName === "width" || paramName === "depth" || paramName === "height")) {
      const dimMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(mm|cm)?\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(mm|cm)?\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(mm|cm)?/i);
      if (dimMatch) {
        const vals = [parseFloat(dimMatch[1]), parseFloat(dimMatch[3]), parseFloat(dimMatch[5])];
        const units = [dimMatch[2], dimMatch[4], dimMatch[6]];
        const idx = paramName === "width" ? 0 : paramName === "depth" ? 1 : 2;
        value = vals[idx];
        if (units[idx] && units[idx].toLowerCase() === "mm") value = value / 10;
      }
    }

    if (value !== null) {
      params[paramName] = value;
    }
  }

  // Only use generic patterns for params that weren't extracted yet
  const genericPatterns = {
    diameter: /(?:diameter|dia|Ø)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(mm|cm|milimeter|sentimeter)?/i,
    radius:   /(?:radius|jari-jari|jari)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(mm|cm|milimeter|sentimeter)?/i,
    height:   /(?:height|tinggi)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(mm|cm|milimeter|sentimeter)?/i,
    width:    /(?:width|lebar)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(mm|cm|milimeter|sentimeter)?/i,
    length:   /(?:length|panjang)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(mm|cm|milimeter|sentimeter)?/i,
    thickness: /(?:thickness|tebal|ketebalan)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*(mm|cm|milimeter|sentimeter)?/i,
  };

  const genericMap = {
    outer_d: "diameter", inner_d: "diameter", bore_d: "diameter",
    bottom_d: "diameter", top_d: "diameter", head_d: "diameter",
    shaft_d: "diameter", motor_hole_d: "diameter", bolt_hole_d: "diameter",
    set_screw_d: "diameter", mount_hole_d: "diameter",
    body_d: "diameter", flange_d: "diameter", port_d: "diameter",
    branch_d: "diameter", main_journal_d: "diameter", crank_pin_d: "diameter",
    outer_r: "radius", inner_r: "radius", coil_r: "radius", radius: "radius",
    base_r: "radius", lobe_r: "radius",
    height: "height", head_h: "height", bottom_h: "height", top_h: "height", back_height: "height",
    tinggi_tiang: "height",
    width: "width", arm_width: "width", base_width: "width",
    flange_w: "width", lebar_tiang: "width", lebar_lengan: "width",
    length: "length", arm_length: "length", shaft_l: "length", leg_length: "length",
    branch_length: "length", panjang_lengan: "length",
    thickness: "thickness", wall: "thickness", arm_thickness: "thickness", base_thickness: "thickness",
    flange_t: "thickness", web_t: "thickness", rib_thickness: "thickness",
    tebal: "thickness",
    lubang_lensa: "diameter", poke_d: "diameter", base_size: "width",
    notch_width: "width", notch_depth: "length", poke_pitch: "width",
  };

  for (const paramName of template.params) {
    if (params[paramName] !== undefined) continue;

    const genericKey = genericMap[paramName];
    if (!genericKey) continue;

    const pattern = genericPatterns[genericKey];
    if (!pattern) continue;

    const match = prompt.match(pattern);
    if (!match) continue;

    let value = parseFloat(match[1]);
    if (isNaN(value)) continue;

    // Check if value has explicit unit
    if (match[2] && (match[2].toLowerCase() === "mm" || match[2].toLowerCase() === "milimeter")) {
      value = value / 10;
    }

    params[paramName] = value;
  }

  // Auto-derive inner_d from outer_d and thickness (tebal) if not explicitly set
  if (template.params.includes("inner_d") && params.inner_d === undefined) {
    const thickness = params.thickness || params.wall;
    const outer_d = params.outer_d;
    if (thickness && outer_d) {
      params.inner_d = outer_d - 2 * thickness;
      console.log(`[EXTRACT] Auto-derived inner_d=${params.inner_d} from outer_d=${outer_d} - 2*${thickness}`);
    }
  }

  // Auto-derive coil_r from coil_d (user says "coil diameter 20mm" but template needs coil_r)
  if (template.params.includes("coil_r") && params.coil_r === undefined && params.coil_d !== undefined) {
    params.coil_r = params.coil_d / 2;
    console.log(`[EXTRACT] Auto-derived coil_r=${params.coil_r} from coil_d=${params.coil_d}`);
  }

  // Auto-derive pitch from free_length / coils (user says "free length 40mm" but template needs pitch)
  if (template.params.includes("pitch") && params.pitch === undefined && params.free_length !== undefined && params.coils) {
    params.pitch = params.free_length / params.coils;
    console.log(`[EXTRACT] Auto-derived pitch=${params.pitch} from free_length=${params.free_length} / coils=${params.coils}`);
  }

  // Auto-derive face_width from thickness (tebal) for gear/beam templates
  if (template.params.includes("face_width") && params.face_width === undefined) {
    const thickness = params.thickness;
    if (thickness) {
      params.face_width = thickness;
      console.log(`[EXTRACT] Auto-derived face_width=${thickness} from thickness`);
    }
  }

  // Auto-derive depth from thickness (tebal) for bracket templates
  if (template.params.includes("depth") && params.depth === undefined) {
    const thickness = params.thickness;
    if (thickness) {
      params.depth = thickness;
      console.log(`[EXTRACT] Auto-derived depth=${thickness} from thickness`);
    }
  }

  return { ...template.defaults, ...params };
}

// ---------------------------------------------------------------------------
// Improved template matching with confidence scoring
// ---------------------------------------------------------------------------
export function findMatchingTemplate(prompt) {
  const lower = prompt.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const template of MASTER_PROMPTS) {
    let score = 0;
    for (const kw of template.keywords) {
      // Require word boundary match (prevents "standar" matching "stand")
      const regex = new RegExp(`(?:^|\\b|\\s)${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\b|\\s)`, "i");
      if (regex.test(lower)) {
        // Multi-word keywords get higher weight
        score += kw.split(" ").length + 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = template;
    }
  }

  // Require at least 1 keyword match
  return bestScore > 0 ? { template: bestMatch, confidence: bestScore } : null;
}

// ---------------------------------------------------------------------------
// Fill template with extracted parameters
// ---------------------------------------------------------------------------
export function fillTemplate(template, params) {
  let code = template.template;
  for (const [key, value] of Object.entries(params)) {
    code = code.replaceAll(`{${key}}`, String(value));
  }
  return code;
}

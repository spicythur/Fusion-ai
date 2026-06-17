# Implementation Plan: System Prompt Expansion

## PRD Reference
`.claude/prds/ai-quality-improvement.prd.md` — Milestone #1

## Goal
Expand system prompt coverage supaya AI bisa handle lebih banyak geometry types tanpa error.

## Current State
System prompt (`backend/system-prompt.js`) sudah punya 16 examples:
- Simple Box, Cylinder, Hollow Cylinder, Cone
- L-Bracket with Holes, Hexagonal Profile, Array of Bolt Holes
- Joined Multi-Body, Enclosure, Spur Gear
- Geneva Wheel, Valve Body (2x), Flanged Pipe
- Helical Spring, Piston Assembly

## Gaps Identified
1. **Sheet Metal** — nggak ada sama sekali
2. **Threads** — explicitly forbidden, tapi user sering minta
3. **Complex Assemblies** — cuma 1 example (Piston)
4. **Organic Shapes** — nggak ada spline/surface examples
5. **Pattern Features** — nggak ada circular/rectangular pattern
6. **Draft/Angled Features** — cuma taper, nggak ada draft angle

## Implementation Steps

### Step 1: Add Sheet Metal Examples
File: `backend/system-prompt.js`

Add 2 new examples:
- **Example 17**: Simple L-bracket sheet metal (base + flange, bend)
- **Example 18**: Enclosure with multiple bends

Key rules to add:
```
===== SHEET METAL =====
- Fusion 360 API sheet metal features are LIMITED in this environment
- For bent parts: create as solid extrude, then use shell/fillet for realism
- For L-bracket: draw L-shape profile, extrude to thickness
- For flanges: create separate sketch on edge plane, extrude join
- NEVER use rootComp.features.sheetMetalFeatures (not available)
- For bend simulation: use fillet on bend edge with radius = bend radius
```

### Step 2: Add Thread Workaround
File: `backend/system-prompt.js`

Since `threadFeatures` doesn't exist, add visual thread approximation:
```
===== THREADS (Visual Only) =====
- Thread features do NOT exist in this API
- For visual threads: create helical groove using sweep
- For simple bolt threads: skip threading, just create shaft
- For nut threads: create bore only (no thread detail)
- If user asks for threads: create shaft/bore without thread, mention in messageBox
```

### Step 3: Add Pattern Features
File: `backend/system-prompt.js`

Add circular and rectangular pattern examples:
```
===== PATTERNS =====
- Circular pattern: manually calculate positions using math.cos/sin loop
- Rectangular pattern: manually calculate positions using nested loop
- ONE sketch per feature (do NOT put multiple features in one sketch)
- For bolt holes on PCD: use Example 7 pattern
```

### Step 4: Improve Error Messages
File: `backend/system-prompt.js`

Add more specific error guidance:
```
===== COMMON ERRORS =====
- "bad index parameter": profiles.item(N) with wrong N. Use profiles.item(0) or create separate sketch.
- "No target body found": tried to cut before creating body. Create body FIRST.
- "Profile is not closed": sketch has gaps. Close all sketch loops.
- "Input is not valid": wrong operation type. Check NewBody/Cut/Join.
- "Cannot compute": geometry too complex. Simplify the shape.
```

### Step 5: Add Validation Rules
File: `backend/system-prompt.js`

Add pre-execution checks:
```
===== VALIDATION RULES =====
Before outputting code, verify:
1. All sketches have closed profiles (lines connect end-to-end)
2. profiles.item(0) is used (not profiles.item(N) for N>0)
3. Body is created before any cut/join operations
4. participantBodies is set for Join/Cut operations
5. Units are in cm (not mm)
6. No forbidden API calls (sheetMetalFeatures, threadFeatures, etc.)
```

## Testing
Test with these prompts after changes:
1. "Create a sheet metal L-bracket 100x50mm, 2mm thick, 50mm flange"
2. "Create a bolt M8 with thread"
3. "Create a circular pattern of 6 holes on a 50mm PCD"
4. "Create an enclosure box with 4 bends"

## Success Criteria
- All 4 test prompts generate valid scripts
- No "bad index parameter" errors
- Scripts execute successfully in Fusion 360

## Files Modified
- `backend/system-prompt.js` — main file, add examples and rules

## Estimated Effort
- 2-3 hours untuk write dan test examples
- 1 hour untuk validate dengan real Fusion 360

---
*Status: READY — implementation can start*

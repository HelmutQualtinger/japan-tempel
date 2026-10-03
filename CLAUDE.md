# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A scratch directory (`Playground/`, inside the parent `training` repo, which has its own CLAUDE.md for the unrelated cycling log). It currently holds one file: `tempel.html`, a self-contained, navigable three.js scene of a Japanese temple. No build system, no package manager, no tests.

## Running

`tempel.html` loads three.js as ES modules via an `importmap` pointing at `cdn.jsdelivr.net` (three@0.160.0 + `OrbitControls` from `examples/jsm`), so it needs internet and must be served over HTTP, not opened via `file://`:

```bash
python3 -m http.server 8757   # from this directory; avoid port 5000 (macOS AirPlay)
# then open http://localhost:8757/tempel.html
```

Published via GitHub Pages at https://helmutqualtinger.github.io/japan-tempel/ (`index.html` redirects to `tempel.html`). Both pages carry Open Graph/Twitter tags pointing at `preview.jpg` (1200×630 screenshot with title overlay) — retake it when the scene changes noticeably.

## Architecture of tempel.html

Everything is one `<script type="module">`, top to bottom in dependency order — later sections reference helpers and materials defined earlier, so keep that order when inserting code:

1. **Scene/camera/OrbitControls/lights** (`hemi`, `sun` with shadows).
2. **Textures + materials.** All textures are generated procedurally on a `<canvas>` (`canvasTex`, `woodDraw`, `speckle`, with a local seeded `trnd`) — the only image file is `face.png` (Carl's face). Materials live in the `M` object. `M.<x>.userData.tile` (world units per texture tile) and `.grain` drive UV scaling in `box()`. `cyl()` swaps `M.wood`/`M.dark` for `M.woodC`/`M.darkC` (cloned textures with their own repeat) because box UVs are rescaled to world size but cylinder UVs are not.
3. **Geometry helpers** (`mesh`, `box`, `cyl`) — `box()` rewrites UVs per face; `roofGeometry()` builds the curved hip roof as a heightfield (concave profile + lifted corners) with world-scale UVs.
4. **Buildings** (main hall, pagoda, torii, stone lanterns, pond/bridge, trees), then **animals** (`makeDeer`/`updateDeer`, `makeGiraffe`/`updateGiraffe`). Animals are built facing +Z and move along closed `CatmullRomCurve3` loops (`getPointAt`/`getTangentAt`), with leg/neck swing driven by a phase counter. Loop waypoints are hand-picked to avoid buildings and the pond; re-check them if you move scenery.
   **Carl** (`makeCarl`/`updateCarl`) is a jointed figure (hips/knees, shoulders/elbows) whose face is `face.png`, projected from the front onto a sphere cap over the head ellipsoid; `carlGlow` materials get a small emissive so the face reads like the photo. His loop runs down the centre of the lantern avenue (lanterns at x=±3.4), back on the pond side, across the bridge, up the hall steps, once around the hall on the stone plinth (the strip between the engawa and the plinth edge) and down the steps again. `groundY(x,z)` supplies his height from the top surfaces of the geometry (grass 0, gravel yard 0.2, stone path 0.25 / slabs 0.295, hall plinth 1.7, steps as a ramp, pond rim + bridge plank arc) — keep it in sync when any of those move. The `#speedIn` slider sets `carl.speed` (0–7); `updateCarl` derives `run` (0 = walk, 1 = jog) from it and scales swing, knee/elbow bend, lean, flight and step rate. `updateCarl` plants the lowest foot on the ground each frame and calls `puff()` (sprite pool `dust`, `updateDust`) on every footstrike where `onGravel()` is true (i.e. `groundY` returns the yard height). Each footstrike also calls `stepSound(surfaceAt(x,z), vol)` (Web Audio noise bursts per surface: grass/gravel/stone/wood, quieter with camera distance); its `AudioContext` (`sfx`) starts on the first pointerdown/keydown and is separate from the music's. A fallow deer (`chaser`/`updateChaser`) trails him on the same curve `gap` units behind at his speed, pitched to the ground under its legs and offset sideways only on open ground. `#carlBtn` toggles `follow` (`updateFollow` keeps the camera in front of him each frame, preserving the user's zoom distance and height but overriding horizontal orbit).
5. **Rain** (`LineSegments` of 8000 drops, `raining`/`rainB` blend) and **day/night** (`night`/`blend`); both feed `applyLight()`, which blends sky color, fog, `hemi`/`sun` intensity, lantern emissive and `PointLight`s each frame. Buttons (`#rainBtn`, `#dayBtn`, `#rotBtn`) just flip these flags and mirror them in `aria-pressed`.
   **Sky dome** (`sky`/`skyMat`, declared right after `applyLight`): a camera-centred `ShaderMaterial` sphere drawing the horizon→zenith gradient, sun/moon, stars and fBm clouds that drift with `uTime`. `applyLight()` feeds it `uHorizon` (= `scene.background`, so fog and horizon match), `uZenith`, `uNight`, `uRain` (rain raises cloud cover and greys them).
6. **Render loop** (`setAnimationLoop`): eases `blend`/`rainB`, steps animals with a shared clamped `dt`, animates rain, updates controls, renders.

There are two random generators: `trnd` (textures, seed 11) and `rnd` (scenery/tree placement and deer spots, seed 7, declared in the trees section). `rnd` is used by code that runs after its declaration — don't call it earlier.

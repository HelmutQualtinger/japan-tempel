# Prompt: Japanese temple scene with Carl

Paste everything below the line into a coding assistant that can write files and, ideally, open a browser to check its work. It needs one input from you: a front-facing portrait photo of the person who should appear as "Carl".

---

Build a navigable 3D scene of a Japanese temple precinct as a single web page, `tempel.html`, using three.js. A boy called Carl jogs through it, followed by a fallow deer and escorted by a drone. The page is a toy for one family, so charm and things that move matter more than realism. All visible UI text is German.

## Ground rules

- **One file.** Everything lives in one `<script type="module">` inside `tempel.html`. No build step, no package manager, no bundler.
- **three.js from a CDN** through an `importmap`: `three@0.160.0` from `cdn.jsdelivr.net`, plus `OrbitControls` and `RoomEnvironment` from `three/addons/`. The page is served over HTTP (`python3 -m http.server 8757`), never opened as `file://`.
- **No asset files except one.** Every texture is drawn on a `<canvas>` at load (wood grain, stone blocks, gravel, roof tiles, plaster, grass, blossom, paper). The only image is `face.png`, cut from the portrait photo I give you.
- **No audio files.** Music and footsteps are synthesised with Web Audio.
- **Deterministic scenery.** Use a small seeded random generator for tree placement so the scene looks the same on every load. Keep a second seeded generator for textures.
- **Scale.** 1 metre is about 2 scene units. Carl is about 3.4 units tall.
- Shadows on (`PCFSoftShadowMap`), one directional sun plus a hemisphere light, fog that matches the horizon colour.

## Layout

The origin is the centre of the precinct. +Z is "front" (towards the viewer at start), +X is right. The camera starts at about (22, 14, 34) looking at (0, 5, 0), with `OrbitControls` (damping, cannot go below the ground, distance 5 to 90).

| Thing | Where | Notes |
|---|---|---|
| Grass | circle, radius 120, y = 0 | |
| Gravel yard | 46 × 46 square centred on the origin, top at y = 0.2 | |
| Stone path | 4 wide, from z = 15 to z = 45, top at y = 0.25 | stepping slabs on top, y = 0.295 |
| Main hall | centred at (0, −8) | details below |
| Lantern avenue | 14 stone lanterns at x = ±3.4, z = 8 to 33.2, every 4.2 | plus two larger ones at (±9, 5) |
| Torii | large at z = 42, a 0.7-scale one at z = 28 | both straddle the path |
| Pond | ellipse centred (16, 12), radius 7 in x, 0.7 of that in z | stone rim; the water's normal is perturbed in the fragment shader by a moving wave height field |
| Bridge | arched plank bridge across the pond, x = 10 to 22 at z = 12 | rail posts at z = ±1 from the centre line |
| Tokyo Tower | (−26, −4) | about 34 units tall |
| Osaka Castle keep | (32, −6) | scaled-down model, about 13 units tall |
| Tesla | parked at (16.5, −8), nose towards +Z | on the gravel beside the hall |
| Trees | about 70 random pines and cherry trees in a ring 30 to 80 units out, plus six cherry trees near the yard | keep them off the path, the tower and the castle |

Everything must stand on its surface. Nothing floats and nothing is sunk into the gravel.

## Buildings

**Main hall.** A two-step stone plinth (22 × 16 then 20 × 14, top at y = 1.7) with five stone steps at the front. On it: plaster walls with dark shoji frames, wooden pillars, a dark wooden veranda with a railing along the front, paper lanterns hanging under the eaves. Two stacked hip roofs with the classic concave profile and upturned corners. Build the roof as a heightfield, not as flat planes. Gold ornaments on the ridge.

**Tokyo Tower.** A lattice of thin box beams between points along a width profile that narrows with height. Four corner legs, cross-bracing on every face above the feet, shallow arches between the feet, a low building underneath. A two-storey white main deck about halfway up, a smaller top deck, then a tall antenna. Paint in alternating orange and white height bands, orange at the bottom. At night it glows orange.

**Osaka Castle keep.** A sloped stone base, five storeys of white walls with green copper roofs that get smaller going up, a decorative triangular gable on each lower roof, a black top storey with gold panels, gold ornaments on the ridge.

**Tesla.** A white sedan built from an extruded side profile with wheel-arch cutouts and a smooth nose without a grille. Tinted see-through glass cabin with a visible interior (white seats, steering wheel on the right, large centre screen). Door seams, flush handles, mirrors, five-double-spoke wheels with red brake calipers, headlights with a daytime strip, a full-width rear light bar, Japanese number plates. Give the paint, glass and chrome a `RoomEnvironment` reflection map on those materials only; do not use it to light the scene. Lights brighten at night.

## Carl

Carl is the centre of the scene, so spend effort here.

- **Body.** A jointed figure: hips and knees, shoulders and elbows. Grey knitted zip sweater with a stand-up collar over a grey turtleneck, "54" on the chest, a white-and-black stripe down each sleeve, striped cuffs and hem. Light blue jeans, white trainers with dark soles. Draw the sweater details on canvas textures.
- **Head.** An ellipsoid with ears and a hair cap. Project the face photo from the front onto a sphere cap that sits just over the head, with a soft elliptical alpha edge so it blends into the skin and hair. Sample the hair colour from the photo. Give the head materials a little emissive so the face reads like the photo in daylight, and dim that at night and in rain.
- **Preparing `face.png`.** Crop the photo to the head's bounding box, soften any colour cast slightly, apply the elliptical alpha fade, save at about 256 × 324.
- **Gait.** One function drives walking through jogging from a single speed value. As speed rises: longer leg swing, more knee lift, bent elbows, forward lean, a short flight phase. Tie step frequency to stride length so the feet do not slide. Each frame, find the lowest point of either shoe sole (heel and toe) and place Carl so that point touches the ground. When he stops, ease into a standing pose.
- **Footsteps.** On every footstrike: a small dust puff if the foot is on gravel (one instanced billboard mesh; the vertex shader computes each puff's flight from its start, velocity and birth time), and a short synthesised sound that depends on the surface: crunch on gravel, click on stone, hollow thump on the bridge, soft on grass. Quieter with camera distance.

## Ground height and getting around

This is the part that is easy to get wrong. Do it deliberately.

- Write one function `groundY(x, z)` that returns the top surface under any point: grass 0, yard 0.2, path 0.25, slabs 0.295, hall plinth 1.7, the lower plinth step 0.9, the steps as a ramp just under the step edges, the pond rim, and the arc of the bridge planks. Every walking creature uses it.
- **Default behaviour.** Carl jogs a closed loop: down the middle of the lantern avenue, through the small torii, back along the pond side, over the bridge, up the hall steps, once around the hall on the stone plinth (outside the veranda, which is too narrow), and down the steps again.
- **Click to move.** A click on the ground (pointer up without a drag) sends Carl there. Find the point by marching the camera ray against `groundY`. Route with A* on a 0.5-unit grid. A cell is blocked if it is inside the hall, the tower footprint, the castle footprint, the car, the pond (except the bridge corridor), a lantern, a torii post or a tree, each padded by Carl's radius. A step between neighbouring cells is allowed only if the height difference is small; that rule alone forces routes onto the stairs and the bridge. Smooth the path by line-of-sight. Show a gold ring at the goal. He stands still when he arrives.
- **The deer.** A fallow doe follows Carl by walking his recorded trail a few units behind, so she takes the same obstacle-free route in both modes. She pitches to match stairs and the bridge and stops at a distance when he stops.
- **The drone.** A white quadcopter with spinning rotors and flashing position lights hovers about 4 m (8 units) above Carl's head and eases after him, banking in turns. It climbs over the hall roof, the tower, the castle and tree crowns.

## Other animals

Three more fallow deer (two bucks with antlers, one doe) and a giraffe walk their own closed loops. Legs swing, necks bob. Their loops must not pass through buildings, the pond or the castle.

## Sky and weather

- **Sky dome.** A camera-centred sphere with a shader: gradient from horizon to zenith, sun (moon at night), stars at night, and procedural fBm-noise clouds that drift slowly and are lit from the sun side. The horizon colour equals the fog colour.
- **Night.** Sky, fog and lights blend smoothly. Stone lanterns and the hall's paper lanterns glow and cast warm point lights.
- **Rain.** About 8000 falling streaks animated entirely in the vertex shader (static start points, fall and wind from a time uniform, wrapped in a box around the camera), ripple rings on the pond, greyer sky, thicker cloud, closer fog, almost no dust from Carl's feet.

## Controls

A small title panel top left with the hints, and a rounded button bar bottom centre. Buttons show their on state in gold and set `aria-pressed`. On narrow screens the bar wraps.

| Control | Effect |
|---|---|
| Carl folgen | Camera stays in front of Carl, looking at his face. Zoom and height stay free. Carl returns to his loop. Clicks on the ground are ignored. Turning it off restores the previous view. |
| Tempo (slider, 0 to 7, start 3.2) | Carl's speed. 0 stands still, low values walk, higher values jog. The deer keeps his pace. |
| Regen | Rain on and off |
| Nacht | Day and night |
| Auto-Rotation | Slow orbit |
| Musik | Generative Japanese-sounding music: plucked koto notes in the Hirajōshi scale with pauses, occasional glissandi and bass notes, a slow shakuhachi line now and then, light reverb. Never repeats. |

Audio may only start after a user gesture.

## Sharing

- Add an `index.html` that redirects to `tempel.html`.
- Put Open Graph and Twitter card tags on both pages, pointing at a 1200 × 630 `preview.jpg`: a screenshot of Carl in front of the hall with the title "Japanischer Tempel" overlaid at the bottom.

## How to work

- Write the code in dependency order: scene and lights, textures and materials, geometry helpers, buildings, animals, Carl, ground height, navigation, sky, rain, controls, render loop.
- Comments in German, short, only where the reason is not obvious.
- After each larger step, load the page in a browser and check the console for errors and a screenshot for obvious problems. A single syntax error leaves the whole scene black, so check before moving on.
- When you place anything new, update `groundY` and the navigation's blocked areas to match.
- Tell me plainly what you checked by looking and what you did not.

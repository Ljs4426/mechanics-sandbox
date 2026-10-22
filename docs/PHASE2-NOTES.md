# Phase 2 (core physics): notes and remaining work

`mechanics-sandbox.html` on `main` is **partway through Phase 2 and does not run yet**. It references `run` and `inertiaOf`, which aren't written yet, so the page throws on its first render. The working Phase 1 editor is at git tag `phase-1`.

## Already in the file

- Planck.js pinned to **1.5.0** (`<script src="https://cdn.jsdelivr.net/npm/planck@1.5.0/dist/planck.min.js">`). 1.5.1 was published 2026-10-12, which is too new to pin.
- New scene settings: `g` (9.81), `dt` (1/240), `restThreshold` (0.05 m/s), `velIters` (30), `posIters` (10).
- Body fields (`PHYS()`): `collide`, `stick`, `Iover` ('' = auto), and initial conditions `vx`, `vy`, `omega`.
- Pulley semantics: `mass: 0` means an ideal pulley (the rope slides). `mass > 0` means a real pulley (no slip, it spins). `fixed` means the axle is fixed. A pulley also has a `shape` used for its moment of inertia.
- Other new fields:
  - New `weld` type, plus the Weld tool. It's not drawn in exports unless `show` is on.
  - Pin: `show` (`false` = hidden pin, e.g. point O in Ref 2).
  - Track: `rotate`, which switches between a prismatic joint and a wheel joint.
  - Rope: `slack`.
  - Actuator: `restLen`, and an "EM damper" button that sets `law = -(K²/R_L)*v`.
- Body-local anchors: a point `{ref, a: '@', lx, ly}` is a spot on a body given in the body's own coordinates. `P()` and `copyPt()` already handle it.
- Initial-velocity tool (mode `'drag'`): drag from a body to set v₀. The arrows are drawn in the overlay (`V0_SCALE = 0.2` m per m/s).
- The editor is locked while `run.sim` exists. This covers pointer handling, keys, undo/redo, paste, delete, `setTool`, and the panel (`lockPanel`).
- Panel field groups: `PHYS_FIELDS`, `PULLEY_PHYS`, `CONTACT_FIELDS`, `INIT_FIELDS`, `fmtI`, and the new `Fd.text` type.
- Top-bar HTML for Play / Step / Reset / speed / time / Run tests, plus the test window HTML and CSS (`#testBox`, `#testRows`, `#testSummary`, `#bTestRun`, `#bTestClose`).

## Still to write

1. **Settings panel physics inputs.** In `settingsHTML` / `bindSettings`, add inputs for g, Δt (1/120, 1/240, 1/480, 1/960), bounce threshold, and velocity/position iterations.
2. **Section 16: building a Planck world from the scene.**
   - `inertiaOf(o)` with the override:
     - block/cart: m(w²+h²)/12
     - disk/pulley: ½mr² (solid disk), mr² (hoop), or 2/5·mr² (sphere)
     - rod: mL²/12
     - point mass: 4e-5·m
   - Helpers: `W2L`, `containsPoint`, `bodiesAt(p, pt, exclude)`, `isMasslessRod` (a rod with mass 0 that isn't fixed).
   - `class Sim`:
     - **Bodies.** Fixtures with userData `{mu_s, mu_k, e, stick}`. `filterMaskBits: 0` when `collide` is false. Call `setMassData({mass, center: (0,0), I})` after creating the fixtures. Cart wheels are circle fixtures with μ = 0.
     - **Surfaces.** An Edge (2 points) or Chain on the ground body.
     - **Pins.** Revolute joints between all bodies at the point. A pin joins to the ground if it's ground-mounted or only one body is there. Optional torsion spring.
     - **Welds.** Weld joints, built the same way as pins.
     - **Massless rods.** A `DistanceJoint` with `frequencyHz: 0` between the bodies at each end (or the ground if none).
     - **Tracks.** A prismatic joint with limits at the track ends, or a wheel joint with `frequencyHz: 0` when `rotate` is on.
     - **Massive fixed pulleys.** A dynamic body plus a revolute joint to the ground.
     - **"Glue".** Free pin/weld/force/moment points that lie on a dynamic body become `'@'` refs, so they follow the body.
   - **Explicit forces**, applied before every substep. For springs, dampers, spring+dampers and actuators: T = kΔ (or k₂Δ + k₃Δ³) + c·dL/dt − F_act, applied along the line between the two attachment points. Applied forces F(t) use world or body direction, plus moments M(t) and torsion springs.
   - **Friction.** In `world.on('pre-solve')`, compute the sliding speed at the contact points. Above `SLIP_SPEED = 1e-3` m/s use min(μ_k); otherwise use min(μ_s). Restitution = max(e) (0 if `stick`).
   - **Stick on contact.** `begin-contact` queues the pair, and a `WeldJoint` is created after the step (the world is locked during callbacks).
   - **Substeps:** n = ceil(ω_max·Δt / 0.01).
     - ω = √(k_eff · m⁻¹_eff). For damping, use rate = c · m⁻¹_eff.
     - m⁻¹_eff = m⁻¹_A + I⁻¹_A·(r_A×u)² + (the same for B).
     - Torsion springs: ω = √(κ(I⁻¹_A + I⁻¹_B)).
     - Cap n at 400 and warn when the system is too stiff.
   - `sync()` writes body x, y, angle back into the scene objects. It also recomputes massless rod geometry and rotates body-frame force arrows.
   - `energy()` returns K_trans + K_rot + U_g + U_s.
3. **Section 17: custom rope constraint**, `class RopeSegment extends planck.Joint`. See the math below.
4. **Section 18: simulation controls.**
   - `run = {sim, snapshot, playing, acc}`. Play takes a JSON snapshot of the scene; Reset restores it, so the same run replays exactly.
   - A `requestAnimationFrame` loop with an accumulator: `while (acc >= dt) sim.step()`. It has a ~14 ms time budget per frame; if it runs out, the leftover time is dropped (the sim slows down rather than changing the trajectory) and the "slower than real time" warning shows.
   - Wire up the speed slider and the time readout.
5. **Section 19: built-in tests.** Use `testScene(build, g)` and `withScene(sc, fn)`, which swaps the global `scene` synchronously. Then `await` between tests so the table fills in progressively. Setups:
   1. Block 0.4×0.4, m = 1, on a frictionless line; spring k = 100 from a wall, displaced 0.1 m. Measure the period from v_x zero crossings (expect 0.6283).
   2. Ground pin + massless rod L = 1 + point mass at 5°. Measure the period from the bob's v_x (expect 2.006 ±1%).
   3. 30° incline 7 m long, block at 6 m. μ_s 0.5 / μ_k 0.3 → a from v(1.5) − v(0.5) (2.356). With μ_s 0.6, the displacement after 2 s should be < 1 mm.
   4. Pulley r = 0.2 at (0, 3), blocks 2 kg and 3 kg at x = ±0.2, rope wrap s = −1 (over the top). Massless pulley → 1.962; 2 kg solid disk pulley → 1.635.
   5. Solid disk r = 0.2 on the incline → a = 3.27, and max |v − ωR|/v < 1%.
   6. g = 0, two disks r = 0.1, e = 1, one at 2 m/s → velocities swap; p and K within 0.5%.
   7. Test 1's scene run for 10 s → max |E − E₀|/E₀ ≤ 1%, plus drift (mean of the last second − mean of the first second).
6. **Init and startup.** Bind the new buttons, start the rAF loop, and fill missing default fields for old autosaves (shared `fillDefaults`). Add a hidden pin at O to Ref 2 and a weld at the bob to Ref 3.

## Verified Planck 1.5.0 internals

- `planck.Settings.velocityThreshold` (default 1), `linearSlop` 0.005, `maxLinearCorrection` 0.2, `maxTranslation` 2 m per step.
- `Solver.solveIsland` order:
  1. Copy each body's sweep and velocity into `body.c_position` (`.c`, `.a`) and `body.c_velocity` (`.v`, `.w`), adding gravity and forces.
  2. Init the contacts, then warm-start them.
  3. `joint.initVelocityConstraints(step)`.
  4. Velocity iterations, joints before contacts.
  5. Integrate positions.
  6. Position iterations: contacts, then `joint.solvePositionConstraints(step)` (must return `true` when solved).
  7. Copy the results back.
- `c_position` and `c_velocity` are only valid for bodies **in the current island**. For static bodies, read `body.m_sweep.c` / `.a` instead.
- Islands are found by depth-first search through contacts and through each joint's `m_bodyA` / `m_bodyB` edges, and the search never continues from a static body. A rope constraint that touches more than two bodies therefore needs no-op "link" joints between its dynamic bodies, and its base `bodyA` / `bodyB` should be dynamic bodies where possible.
- The `Joint` base constructor is `(def, bodyA, bodyB)` and sets `m_edgeA` / `m_edgeB`. `world.createJoint(joint)` links the joint into both bodies. An ES class `extends planck.Joint` works.
- `step` gives you `dt`, `inv_dt`, `dtRatio`, and `warmStarting`.
- Contacts:
  - `contact.setFriction` / `setRestitution` take effect when called from pre-solve.
  - `contact.getWorldManifold(wm)` returns `wm.normal`, `wm.points[0..pointCount-1]`. Pass a reusable `new planck.WorldManifold()`.
- `body.setMassData({mass, center, I})` takes I about the body origin.
- The fixture def accepts `filterMaskBits`.
- World def: `{gravity, allowSleep: false}`. `world.step(dt, velIters, posIters)`.
- Joint constructors (use `new`):
  - `RevoluteJoint(def, A, B, anchor)`
  - `WeldJoint(def, A, B, anchor)` (`frequencyHz: 0` = rigid)
  - `DistanceJoint(def, A, B, anchorA, anchorB)`
  - `PrismaticJoint(def, A, B, anchor, axis)` with `enableLimit`, `lowerTranslation`, `upperTranslation`
  - `WheelJoint(def, A, B, anchor, axis)` (set `frequencyHz: 0` explicitly)

## Rope constraint math (Section 17)

A rope is a list of nodes: an end point, then pulleys, then another end point. Each pulley node stores its wrap direction `s` (+1 = the rope goes counter-clockwise around it, in the direction of travel). The rope is split into **segments** at every no-slip pulley (a dynamic pulley body). Ideal pulleys (static bodies) stay inside a segment as "slide" nodes.

For each segment, using the same tangent-line geometry as `ropeGeom`:

- **Length:** L = Σ free spans + Σ R·mod(s·(φ_out − φ_in), 2π) over the slide pulleys. Add wrap terms for no-slip ends:
  - Start end: + R·s·(φ − φ₀) − R·s·(θ − θ₀)
  - Finish end: − R·s·(φ − φ₀) + R·s·(θ − θ₀)
  - Here φ is the unwrapped angle of the tangent point and θ is the pulley body's angle. φ is unwrapped incrementally and committed once per step, in `initVelocityConstraints`.
- **Jacobian.** E = the sum of unit vectors pointing from the node's contact point into its spans.
  - For each node: J_v = −E and J_w = −cross(r, E).
  - r is measured from the body's center of mass to the contact point: the attachment point for end nodes, the tangent point for no-slip nodes, and the pulley center for slide nodes.
  - Add up J for each body before computing m_eff = 1 / Σ(m⁻¹|J_v|² + I⁻¹·J_w²).
- **Velocity solve** (same as Box2D's `RopeJoint`, which is tension-only):
  - Cdot = Σ J·v; when C = L − L_rest < 0 (slack), add C·inv_dt.
  - λ = −m_eff·Cdot; accumulated impulse = min(0, acc + λ); apply Δλ through invM·J.
  - Tension = −acc·inv_dt.
- **Position solve:** C clamped to [0, 0.2], λ = −m_eff·C applied to `c_position`. Return C < linearSlop.
- **Warm start:** acc *= dtRatio at init.
- L_rest = the length at build time + `rope.slack`.
- Sign checks are worked out in the conversation: a counter-clockwise pulley at the start end with the rope leaving its top going right gives rotation term −R·s·ω = Rω. This matches −cross(r_t, e)·ω.

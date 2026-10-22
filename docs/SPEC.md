# Mechanics Sandbox — Requirements

The original project brief, kept as written, followed by answers to the clarifying questions.

## GOAL
Build an interactive 2D mechanics sandbox where I draw systems that look exactly like engineering-dynamics textbook diagrams, then press Play and watch them move with real physics in SI units. It has to cover everything in AP Physics C: Mechanics and be accurate enough to check homework answers.

## CONTEXT
- Me: high school senior in AP Physics C: Mechanics, going into civil engineering. I code in Python and can read JavaScript, but I'm still learning, so keep the code organized and explain it.
- What I'll use it for: checking problem answers, building intuition with FBDs, energy, and graphs, and exporting clean diagrams for my notes.
- Style reference: 4 textbook diagrams (rebuilt in the app as Examples → Ref 1–4). Description:
  - White background, black lines, light gray (#d3d3d3) fill on blocks and disks, no color in the diagram itself. Keep the toolbars plain so the canvas reads like a textbook page.
  - Line weights: about 3 px for bodies, rods, and ropes, 2 px for springs and dampers, 1 px for hatching, dimensions, and leader lines.
  - Fixed surfaces (ground, walls, ceilings, channels): solid line with short 45° hatch ticks on the fixed side.
  - Pins: white circle, black outline, center dot. Ground pins sit on a small triangle attached to a hatched base.
  - Carts: rectangle on two wheels. Point masses: filled black circle. Pendulum bobs: black circle with a white center dot.
  - Springs: zigzag and helical-coil styles with a fixed coil count so they visibly stretch. Nonlinear spring: zigzag with a diagonal arrow through it.
  - Dampers: dashpot (open cup + piston). Spring and damper in parallel: two branches between end plates.
  - Actuator: square with an X inside, with an optional resistor box R_L in parallel.
  - Pulleys and disks: gray circle, center pin, optional radius arrow labeled r. Ropes: thick lines that run tangent to pulleys and wrap around them.
  - Forces: straight arrow with a filled head, labeled like F_1(t). Moments: curved arrow labeled M(t).
  - Annotations: plain lines (solid, dashed, or dash-dot, no physics), angle arcs off a reference line (θ(t), φ), dimension lines with arrowheads and end ticks (ℓ_1, X(t), Z(t)), coordinate markers (small hatched tick + arrow labeled x_1), axes (X/Y or \vec{e}_1/\vec{e}_2), a gravity arrow labeled g, and leader lines from labels to parts. Dimensions and angle arcs attached to moving parts update live and can show their current value.
  - Every label is LaTeX math: italic, subscripts, Greek letters, \vec{e}_1, \mu \neq 0.

## ACTION
Build this in 5 phases. Finish a phase, stop, and wait for me to say "next."

### Rules for every phase
- One self-contained HTML file. No build step, opens by double-clicking, works in current Chrome and Edge. Pin exact versions of any CDN libraries.
- Physics: Planck.js (Box2D port) for rigid bodies, contacts, friction, and joints. If you want a different engine, explain why before switching. Simulate in meters, kilograms, and seconds, and convert to pixels only for drawing (default 100 px = 1 m, editable).
- Fixed time step (start at 1/240 s) decoupled from frame rate. Reset replays the exact same run. Raise solver iterations so joints and ropes don't visibly stretch.
- Springs, dampers, actuators, and applied forces are explicit forces (F = -k·ΔL, F = -c·v_rel), not the engine's soft joints, so k in N/m and c in N·s/m mean exactly what they mean in a textbook. Auto-substep stiff systems (aim for ω·dt ≤ 0.01 with ω = √(k/m)) and warn me when something is too stiff to run in real time.
- Friction: every surface and body has μ_s and μ_k, with μ_k ≤ μ_s enforced. A contact uses the smaller value of the two objects. Bodies default to 1.0 so the surface I draw controls friction. Box2D only has one friction coefficient, so switch each contact between μ_s and μ_k every step based on sliding speed (Planck's pre-solve callback can set per-contact friction).
- Lower the engine's restitution velocity threshold so slow collisions still bounce.
- Labels: LaTeX through MathJax's SVG output (fontCache 'local') so they look like Computer Modern and survive export.
- Render the scene as SVG and hold 60 fps with about 50 objects.
- Inputs like F(t) = 5 sin(2t) go through a safe expression parser, never eval(). Support t, sin, cos, exp, sqrt, abs, pi, and a step function.
- Code style: labeled sections, comments that explain the physics, no clever one-liners.

### Phase 1: Editor and look
- Tools: select/move/rotate, surface (line, polyline, and arc for ramps and loops; Shift snaps to 15°; type exact length and angle), block, cart, disk, rod, point mass, pin, slider/track, spring, damper, spring+damper, rope, pulley, force, moment, actuator, plus the annotation tools above.
- Snap to grid and to anchor points (centers, corners, edge midpoints, rims). Springs, ropes, and dampers attach anchor-to-anchor and stay attached when I move things.
- Properties panel: mass, size, fixed/movable, μ_s, μ_k, restitution, k, c, rest length (with "set to current length"), label text, display style.
- Undo/redo, copy/paste, delete, zoom/pan, scale bar, save/load scenes as JSON, export the drawing as SVG and PNG.
- Done when I can redraw all 4 reference diagrams and they look like the originals.

### Phase 2: Core physics
- Play, pause, single step, reset, speed (0.1x to 2x), time readout.
- Gravity: 9.81 m/s² by default, editable, can be 0.
- Editable mass. Moment of inertia computed from shape (solid disk, hoop, sphere, rod, rectangle), with an override.
- Contacts and collisions with restitution from 0 to 1, plus a "stick on contact" option for perfectly inelastic collisions.
- Joints: pin (body-to-ground or body-to-body, optional torsion spring), slider along a line, weld, massless rigid rod, rope (tension only, can go slack).
- Linear springs, nonlinear springs F = -(k_2·Δ + k_3·Δ³), dampers, forces F(t) at a point (world or body direction), moments M(t).
- Initial conditions: set each body's velocity and angular velocity by dragging an arrow or typing values.
- Fixed pulleys: massless first, then massive with a moment of inertia (rope doesn't slip, pulley spins).
- Done when the built-in tests below pass.

### Phase 3: AP analysis tools
- Free-body diagram for the selected body: every force as a labeled arrow with its magnitude (mg, N, f_s or f_k, T, spring, damper, applied). Get normal, friction, and tension from contact impulses and joint reaction forces (add up the impulses over the substeps and divide by the elapsed time). Show ΣF next to m·a as a check.
- Toggleable overlays, color allowed here: velocity, acceleration, momentum, angular velocity, motion trails.
- Live readouts: position, velocity, acceleration (components and magnitude), θ, ω, α, K_trans, K_rot, U_g, U_s, total energy, momentum, angular momentum and net torque about a point I pick, moment of inertia about the pivot, normal force, friction (and whether it's static or kinetic), tension, and the work done and power for each force.
- Graphs where I pick the variables: position, velocity, acceleration, θ, and ω vs t; any force vs t with impulse shown as the area; energy vs t with thermal energy from friction and dampers included so the total adds up; system momentum vs t. CSV export.
- Center of mass marker, a rolling indicator (compares v_cm to ωR and says "rolling without slipping" or "slipping"), measured period for oscillators (next to the textbook value when it's a standard setup), ruler, protractor.

### Phase 4: Advanced elements
- Carts with real rolling wheels, or a "frictionless cart" mode where the wheels are just drawn.
- Elastic pendulum: mass on a slider along a pinned rod with a spring-damper along it (the cart-and-pendulum diagram).
- Disk rolling on a moving block with friction (the 3m block diagram).
- Ropes over moving pulleys and multiple pulleys (the diagram with the big disk hanging from a spring). This is the hardest part. If Planck's joints can't handle it, write a custom inextensible-rope constraint (total length along the pulley path stays constant, tension only) and explain how it works.
- Actuator: a general force element with a typed force law F(t, Δ, v), including an "electromagnetic damper" preset with c = K²/R_L so the R_L symbol means something mechanically.
- Air resistance per body: none, linear (F = -b·v), or quadratic (F = -c·|v|·v).
- Universal gravitation mode for orbits (F = G·m_1·m_2/r², adjustable G).

### Phase 5: Presets
- Each reference diagram as a working scene.
- Classic AP setups: block on an incline with friction, Atwood machine (massless and massive pulley), spring-mass, simple and physical pendulums, disk rolling down an incline, 1D and 2D collisions, ball sticking to a pinned rod (angular momentum), projectile with and without drag, vertical loop, circular orbit.

### Built-in tests ("Run tests" button showing measured vs expected and pass/fail)
1. Spring-mass, m = 1 kg, k = 100 N/m, frictionless: period 0.628 s (±1%).
2. Simple pendulum, L = 1 m, 5° amplitude: period 2.006 s (±1%).
3. Block on a 30° incline, μ_s = 0.5, μ_k = 0.3: slides with a = 2.356 m/s² (±1%). With μ_s = 0.6, it stays put.
4. Atwood, 2 kg and 3 kg, massless pulley: a = 1.962 m/s². With a 2 kg solid-disk pulley: a = 1.635 m/s² (both ±1%).
5. Solid disk rolling down a 30° incline, μ_s = 0.5: a = 3.27 m/s² (±1%), with v_cm = ωR the whole way.
6. 1D elastic collision, 1 kg at 2 m/s into 1 kg at rest: velocities swap, and momentum and kinetic energy are conserved within 0.5%.
7. Frictionless spring-mass: total mechanical energy stays within ±1% over 10 s with no drift.

### Out of scope
3D, fluids, deformable bodies, real circuit simulation (R_L only matters through the damper preset), accounts, servers.

## OUTPUT
- Before any code: give me your Phase 1 plan as a short list and ask up to 5 questions if anything's unclear.
- After each phase: the complete working file (or edit it in place if you can work with files), then a short report covering what works, how to test it, known bugs, and a plain-English walkthrough of the key code, especially the physics loop and how forces get applied. Compare the JavaScript to Python where it helps, since Python is what I know.
- If something turns out to be impractical, tell me why and offer the closest workable version. Don't quietly skip it.

## Answers to clarifying questions
1. Reference images: provided (rebuilt as Examples → Ref 1–4).
2. Coordinates: +y up, origin bottom-left (textbook convention).
3. LaTeX input: type raw TeX, with a live preview box and quick-insert buttons.
4. File size: one large HTML file is fine.
5. Offline: loading MathJax and Planck from a CDN is fine (needs internet the first time).

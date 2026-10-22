# Phase 4 (advanced elements): design notes

Phase 4 is complete (git tag `phase-4`). **Run tests** now has 25 checks; the 9 new Phase 4 checks cover every item in the spec, and all pass.

## Carts
- `rolling: false` (the default) is the "frictionless cart": the wheels are fixtures on the cart body with μ = 0.
- `rolling: true` builds the wheels in `buildWheels()`:
  - Two solid-disk bodies of mass `wheelMass` each, pinned to the body at their centers. Friction makes them roll.
  - They start rolling (ω = −v/R) rather than skidding.
  - Each wheel gets a stand-in record (`o.id + '.wl'`/`'.wr'`, not in the scene), so energy, momentum, the ledger and the recorder include it.
- The FBD and the force table show the cart as one system (`viewOf()`): body + wheels, axle forces dropped as internal, weights merged at the system's center of mass, and the check ΣF = M·a_cm.
- Check: on 30° with a 1 kg body and two 0.5 kg wheels, a = M g sinθ / (M + m_w) = 3.924 m/s². Measured: 3.916 m/s² (the 0.2% gap is the 1 mm contact skin).

## Mounting ("Mounted on", `host`)
- Pins, welds, forces, moments and tracks have `host`: '' (auto), 'ground', or a body id.
- **Auto** keeps the Phase 2 rules.
- **A body:** the point rides with that body even if it's off its outline, like a bracket. A pin mounted on a body joins it to every other body at that point; with no other body there, it's only an attachment point.
- **Ground:** the point is fixed in the world.
- A track rides on a moving body if it's mounted there. In auto mode it also rides on the body that one of its ends is attached to, provided some other body sits on it (`glueTrack()`). The prismatic or wheel joint then joins the host body to the slider. That's the elastic pendulum.
- `attach()` now follows `refBodyId()` first, so a spring attached to a pin mounted on a body pulls on that body.

## Ropes over moving pulleys
- The Section 17 constraint already handles moving pulleys: slide nodes on moving ideal pulleys, grip nodes on moving real pulleys and disks.
- New: segments whose ends are both on one body are skipped (the rope still wound on a yo-yo).
- **Solver iterations.** A moving ideal pulley is a 1 g body between two constraints. Gauss–Seidel converges through it at roughly 1 − 0.6·m_pulley per iteration, so 30 iterations left tensions about 20% low. Scenes with one get `IDEAL_PULLEY_ITERS = 300` velocity iterations, shown as a note in the top bar.
- Checks:
  - Block and tackle (3 kg load, 1 kg counterweight): a = 2(M − 2m)g/(M + 4m) = 2.803 m/s²
  - Massive moving pulley: a = 2(M_p − 2m)g/(1.5 M_p + 4m) = 3.924 m/s²
  - Yo-yo: a = 2g/3, T = mg/3
  - Disk hanging in a rope loop: T = Mg/2 on each side

## Actuator
- `mode: 'em'` is the electromagnetic damper. The back-EMF K·v drives a current K·v/R_L through R_L, which pushes back with F = (K²/R_L)·v.
- Its impulses are logged as `damper` kind, so the energy shows up as heat in R_L.
- Check: the motion is identical to a damper with c = 1 (K = 2, R_L = 4).
- The typed law accepts `delta` as well as `d`.

## Air resistance
- Per body: `drag` = 'none' | 'linear' (F = −b·v) | 'quadratic' (F = −c·|v|·v), applied at the center every substep.
- Logged as kind `drag`, with its energy loss going into `Eloss.drag`.
- Substeps count rates b/m and 2c·v/m.

## Universal gravitation
- `settings.gMode = 'universal'` turns off Box2D's uniform field. Every pair attracts with F = G m₁m₂/(r² + ε²), where ε = 1 cm.
- Fixed bodies attract too, using their panel mass.
- U_g = −Σ G m₁m₂/√(r² + ε²), so energy is exactly consistent with the force.
- The substep rate includes √(G(m₁ + m₂)/r³).
- G defaults to 1 for sandbox-size orbits (real value 6.674e-11).
- Check: circular orbit at r = 5 m with M = 1000 kg gives T = 2.2229 s (theory 2.2214 s). The radius stays within 0.3% and the energy within 0.003%.

## Reference scenes
- **Ref 1:** springs start at rest length; the disk spring is pre-stretched by mg/k, so the scene starts in equilibrium.
- **Ref 2:** m₂ rides a hidden track along the rod (elastic pendulum). The R_L actuator is an EM damper with K = R_L = 1.
- **Ref 3:**
  - The block weighs 3 kg on an invisible frictionless floor.
  - The posts and their pins are attached to the block (`'@'` points, `host`).
  - The "2k" spring is 200 N/m.
  - The disk rolls on the moving block.

# Phase 6 (more presets, flexible rods): design notes

**Run tests** now has 72 checks, all passing: Phases 2–5, three for flexible rods, and one per preset (42 presets). The examples menu has the 4 reference diagrams plus the presets grouped by topic.

## Reference diagrams (Ref 1–4) now actually move
| Scene | What was wrong | Fix |
|---|---|---|
| Ref 1 | Every load was zero, and once loaded, the bead C got pulled into pulley 2 within 2 s | Spring on m₁ with an initial push; F(t) = 12(1 − e^(−3t)) + 4 sin 2.5t on a handle; the disk rides a hidden vertical guide (`rotate: true`) on a stiffer k = 300 N/m spring |
| Ref 2 | Static | Loads F₁ = 15 sin 1.3t, F₂ = 4 sin 6t along the rod, nonlinear spring k₂ = 100, k₃ = 400 |
| Ref 3 | Static | Block starts at 0.8 m/s; wall springs re-tuned |
| Ref 4 | Completely locked | The hidden guide for the block also caught the link rod's center and held it on a prismatic joint. The guide now spans only the block's travel (y 0.8 to 3.0) |

Planck 1.5.0 bug found on the way: `WheelJoint` with `frequencyHz: 0` (a track with "slider may rotate") never sets `m_sAx`/`m_sBx`, and multiplying by `undefined` turns every body in the island into NaN on the first step. `buildTrack` now sets both to 0. That option had never worked before this.

## Flexible rods (bending stiffness EI)
A rod with `EI > 0` (N·m²) and mass is split into rigid pieces when Play starts (`expandFlexRods`, start of the `Sim` constructor):
- **Discretization:** n bend points at the middles of n equal lengths ℓ = L/n, so the two end pieces are ℓ/2 long. Each bend point is an angular spring K = EI/ℓ. This is the midpoint rule for curvature:
  - cantilever, tip load: δ = (PL³/3EI)(1 − 1/4n²);
  - simply supported, point load at a piece's middle: about 1/n² low (1% at n = 10);
  - smooth loads converge faster (self-weight sag is 0.7% low at n = 12).
- **Scene bookkeeping:** the pieces are ordinary `rod` objects in the live scene while it runs. Reset restores the pre-Play snapshot, so the single rod comes back exactly. The end-b piece keeps the rod's id (graphs and selection follow that end). Every point anchored to the rod (`a`, `b`, `m`, `q1`, `q3`, `@`) and every `host` is remapped to the piece under it.
- **Joints:** each bend point is a soft `WeldJoint`. Box2D sets a soft joint's stiffness as k = m_eff·ω² with m_eff = 1/(1/I_A + 1/I_B), so `frequencyHz = √(K·(1/I_A + 1/I_B))/2π` gives exactly K. It's implicit, so it's stable however stiff.
- **Substeps (two rules):**
  1. The soft joint damps a mode of frequency ω by about ζ = ω·h/2. The lowest mode is estimated as a cantilever carrying everything joined to it, ω² = (3EI/L³)/(0.243m + M_attached), and kept at ω·h ≤ 0.002 (`BEND_TARGET`, ζ ≈ 0.1%).
  2. Each joint's own frequency w needs w·h ≤ 2 (`BEND_STAB`). Above about 4, Box2D's iterative solver stops converging along the chain: a 0.1 kg rod holding a 5 kg tip mass came out 2.8× too stiff and created energy.
  w grows as n², which is why the beams preset uses 8 and 10 bend points (default 10).
- **Energy:** bending energy Σ½K(Δθ)² is in U_s. The joints' work is tallied separately (`bendWork`), and what they lose (−W − U_bend, the numerical damping) is shown under ropes/joints in E_thermal. In every test it's ≥ 0: they never create energy.

## Solver fixes
1. **Bobs on strings and massless rods lost energy.** `leverSpin()` only looked at each body's own rotation rate, and a bob on a string barely rotates. It now also counts how fast each massless rod and straight rope swings, |Δv × d|/|d|², at a tighter target (`SWING_TARGET` = 0.0004 rad per substep).
   - Before: a ball whirled at 8 rad/s lost 9% of its energy in half a turn, and a 160° pendulum's period was 26% short.
   - After: tension difference top to bottom is 6mg within 0.1%, and the 160° period is within 1%.
2. **Turning blocks and rods in contact** (the ladder) got single steps, so the touching corner swung a hair off the surface each step and the contact flickered. The ladder left the wall at 53° instead of 39°. `leverSpin()` now also counts polygons in touching contacts. Circles are exempt: a rolling wheel's contact point doesn't move round it.
3. **Preset view:** `fitView(frame)` fits an optional world rectangle as well as the drawing (for orbits, a thrown baton and so on). With the free-body diagram on, it fits to the left of the FBD window. Presets fit after the graphs dock opens; they used to fit first, then get covered.
4. **Atwood presets** had no floor, so after 1.3 s the rising block hit the pulley and the rope and contact fought (88% energy error). Now m₂ lands first.

## Presets added (27, plus the car and beams)
Grouped in the menu by `topic` (`PRESET_TOPICS`):
- **Kinematics:** thrown spinning baton (COM parabola, constant ω); falling with linear and quadratic drag (v(τ) = 0.632 v_t, v = v_t tanh(gt/v_t)).
- **Forces:** block on a table with a hanging mass; incline + pulley + hanging mass; stacked blocks that slip (a_top = μk g); elevator apparent weight (N = m(g + a) at three stages); 2:1 moving pulley.
- **Energy:** sliding off a dome (cos φ = (2 + v₀²/gρ)/3); ball on a string in a vertical circle (T_bottom − T_top = 6mg); spring launcher up a ramp (h = kx²/2g(m + m_p)).
- **Momentum:** ballistic pendulum (two parallel strings so the block doesn't tilt); carts pushed apart by an actuator impulse; bouncing balls (heights go as e²).
- **Rotation:** balanced seesaw (Στ = 0, pivot force = total weight); ladder leaving a frictionless wall (sin θ = ⅔ sin θ₀); bowling ball skidding into rolling (v = 5v₀/7); falling meter stick that drops a coin (α = 3g/2L); beads sliding out on a spinning rod (I₀ω₀ = I₁ω₁).
- **Oscillations:** hanging spring; under/critical/over damping; driven resonance at 0.5, 1 and 1.5 ω₀; coupled oscillators (both normal modes plus beats); two-body oscillator (reduced mass); rolling disk vs sliding block on springs (T = 2π√(3m/2k)); large-amplitude pendulums at 10°, 90° and 160° (exact T via the arithmetic-geometric mean).
- **Gravitation:** elliptical orbit (T = 2π√(a³/GM), r_p = 2a − r_a); binary stars (COM fixed, T = 2π√(d³/G(M₁ + M₂))).
- **Engineering:**
  - Car with suspension: a half-car with wheels on struts riding the body (rotating tracks), springs pre-loaded by Mg/2k. The check is static drift < 1 mm plus a drop test: T_d and ζ = c/√(2kM) from the decay.
  - Flexible beams: a cantilever with a tip mass, and a simply supported beam with a midspan mass (pin + roller). The check covers periods and mean sags against PL³/3EI and PL³/48EI.

## Known limits (measured, left as they are)
- **Bouncing balls:** with continuous collision on, Box2D resolves fast impacts in its time-of-impact pass, which the energy bookkeeping doesn't see. An e = 1 ball's peaks go 1.985, 2.000, 1.985 m (jitter, not steady loss), and the energy total wobbles by about 3% of the peak K. With continuous collision off, it gains height every bounce, which is worse.
- **Rolling radius:** a disk rolls on its radius minus 0.5 mm. Box2D puts the contact point midway through the 1 mm resting overlap. That's 0.45% for an 11 cm bowling ball.
- **Ref 4:** a closed linkage (block on a guide, link, beam on a pin) drifts about 3% of its peak kinetic energy over 4 s, from Box2D's position correction around the loop.

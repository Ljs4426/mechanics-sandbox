# Phase 3 (AP analysis tools): design notes

Phase 3 is complete (git tag `phase-3`). The **Run tests** window now has 16 checks: the 7 required physics tests (9 rows) plus 7 checks of the analysis tools. All pass.

## The force ledger (Section 16, inside `class Sim`)

Every impulse that changes a body's motion is logged while the step runs:

| Source | Where it's captured | Ledger key |
|---|---|---|
| Gravity | `pushGravity()`: m·g·h per substep | `g` |
| Springs, dampers, actuators | `applyElement()`: each part logged separately | `sp:`, `dp:`, `ac:` + element id |
| Applied F(t), M(t) | `applyLoad()` | `ld:` + load id |
| Torsion springs | `applyTorsion()` (pure moments) | `ts:` + pin id |
| Contact normal and friction | `post-solve` callback: `v_points[i].normalImpulse / tangentImpulse` along `v_normal` and t = (n.y, −n.x), lever arms `rA`, `rB` | `cn:` / `cf:` + own fixture tag + other id |
| Joint reactions | `pushJoints()`: `getReactionForce(1)` is the impulse on body B; A gets the opposite. Revolute, weld and distance joints use their stored `m_rA`/`m_rB`. Prismatic and wheel joints apply A's force at B's anchor (`useB`). | `jt:` + joint index |
| Rope tension | `pushRopes()`: per node, impulse E·|acc| at the node's lever arm (stored in `RopeSegment.nodeInfo` at `initVelocityConstraints`) | `rp:` + segment index |

At the end of each step, impulse / dt gives the average force. Because these are exactly the impulses the solver applied, ΣF = m·Δv/dt holds to round-off (about 1e-14 N in the tests). The FBD shows this check.

Work per force is impulse · (average velocity of the application point over the substep), using the trapezoid rule. That form is exact for kinetic-energy change.

## Energy bookkeeping

- Conservative forces (gravity, springs, torsion springs) are tracked as U_g and U_s.
- Heat E_th = −(work by contact forces) − (work by dampers) − (work by ropes and joints). Ideal joints do about 0 work; a rope snapping taut doesn't.
- W_in is the work done by applied forces, moments and actuators.
- Total = K + U + E_th − W_in should stay constant. What remains is the integrator's energy error, about ω·h/2 (≈0.4% in the tests). It's bounded, not drift. The reason is that semi-implicit Euler moves positions with the end-of-substep velocity, while the work uses the average velocity.

## Recorder (Section 20) and graphs (Section 22)

- Sampled about every 1/120 s. Positions and velocities are instantaneous. Forces and accelerations are averages over the interval since the previous sample, so Σ value × interval is exactly the impulse, even for a collision that lasts a single step.
- After 24,000 samples it merges neighbouring pairs, time-weighting the averaged channels so impulse areas don't change.
- Force channels are named `<bodyId>.F.<ledger key>[.x|.y|.M]`. The net force is `<bodyId>.F.net`.

## Readouts

- Period: velocity zero crossings of the component with the largest swing. Rejected if the intervals vary by more than 15%.
- Textbook period is recognized from `rec.links`:
  - Spring-mass (parallel springs along a common axis or a track): 2π√(m/k)
  - Simple pendulum (massless rod or rope from a fixed point to the center): 2π√(L/g)
  - Physical pendulum (one pin to the ground): 2π√(I_P/(m g d))
  - Torsion pendulum: 2π√(I_P/κ)
- Rolling indicator: the speed of the contact point relative to the other body at that point. Rolling if it's below max(2 mm/s, 1% of v_cm).

## Known limits

- The analysis adds about 0.4 ms per step (63 objects, 8 substeps).
- Graph samples are about 120 Hz. Positions between samples aren't stored (forces are, as averages).
- The FBD uses step-averaged forces, so a collision appears as one large spike for one step.

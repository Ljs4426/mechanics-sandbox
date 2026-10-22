# Phase 5 (presets): design notes

Phase 5 is complete (git tag `phase-5`). **Run tests** now has 40 checks: Phases 2–4, two accuracy guards, and one check per preset proving the sim matches the numbers in its About card. All pass.

## Presets (Section 15)
- `PRESETS[key]` is `{ name, build(add, R, sc, ctx), show, graphs(ctx), O, trailSec, notes, check(sc, ctx) }`.
- `loadPreset()` builds the scene, turns on the listed analysis views, sets up the graphs, selects `ctx.main`, and shows the notes. The notes live in `scene.notes` (plain text), are rendered as an "About" card at the top of the panel, and are saved with the scene.
- Run tests calls `presetScene()` + `check()` for every preset, so a preset can't silently drift away from its own textbook answer.

| Preset | What the check verifies |
|---|---|
| Block on incline | a = g(sin θ − μk cos θ) = 2.356 m/s² |
| Atwood, massless / massive pulley | a = 1.962 / 1.635 m/s² |
| Spring-mass | T = 2π√(m/k) |
| Simple / physical pendulum | T vs 2π√(L/g) and 2π√(I_P/mgd), 10° amplitude correction included |
| Rolling race | a = g sin θ/(1 + I/mR²) for sphere, disk, hoop |
| 1D collisions | elastic and stick velocities |
| 2D collision | 90° separation, p and K conserved |
| Ball sticks to rod | L about the pivot conserved, ω = L/I_P |
| Projectile | range v₀² sin 2θ/g; the drag ball lands shorter |
| Vertical loop | stays on the track, average N at the top = m(v²/ρ − g) |
| Circular orbit | T = 2π√(r³/GM) |

## Engine changes made while building the presets
1. **Stick on contact** now applies only between two bodies. It used to weld a block to the floor it was resting on.
2. **"Collides with other bodies" switch.** Collision categories: bodies are category 1, surfaces category 2. A "surfaces only" body (`collideBodies: false`) masks out category 1. Used for the two overlapping projectiles.
3. **One-sided surfaces** (`oneSided`). The pre-solve callback disables a contact when the body's center is on the hatched side of the edge it touches. Not used by the loop in the end, but it's a general one-way-platform feature.
4. **Curved surfaces lost energy.**
   - At every corner of a segmented track, the contact removes the velocity component pointing into the next piece. That's a loss of about Δθ² of the KE per corner, Θ·Δθ over an arc of angle Θ. It was about 50% around a loop drawn with 5° pieces.
   - Fix 1: `kind: 'arc'` surfaces are rebuilt from 0.1° pieces for the physics (`densifyArc`).
   - Fix 2: the same loss happens per time step, at (v·h/ρ)² per substep. Scenes with arcs get substeps so that v_max·h/ρ ≤ 0.002 (`CURVE_TARGET`), with v_max taken from the energy available.
   - Result: 0.5% loss over the loop preset's ramp plus one loop.
   - Polylines you draw by hand aren't densified (there's no way to tell which corners are meant to be curves), so use the Arc tool for curved tracks.
5. **Ghost vertices.** Surfaces that meet end to end get ghost vertices (`setPrevVertex`/`setNextVertex`), so bodies don't catch on the joint. Where several meet, the smoothest continuation is used.
6. **Broadphase margin** is 0.02 m instead of 0.1 m. The finely divided arcs otherwise put hundreds of edges in a ball's margin box (3× slower, same physics).
7. **Spinning jointed bodies lost energy** (the biggest one).
   - A joint fixes velocities using the start-of-substep geometry; the body then turns by ωh, and the next solve strips off the sideways velocity that built up.
   - Measured loss ≈ 0.3·ω²·h per second: 12.7%/s for a rod at 10 rad/s at Δt = 1/240.
   - Fix: `step()` now chooses substeps every step from `leverSpin()`, the fastest spin among bodies held off-center by a joint or rope end, so that ω·h ≤ 0.001 (`ROT_TARGET`).
   - Result: 0.37%/s at 10 rad/s, 0.07%/s at 2 rad/s. Slow scenes don't pay for it.

## Known limits
- The normal force on a curved track jitters about ±10% from step to step as the body crosses the tiny track pieces. Averages are right (0.4% at the top of the loop). The graph shows the jitter.
- A 2D loop can't close (it would cross its own entry), so the loop preset is open at the lower left.
- Very fast spinners (more than about 100 rad/s) hit the 400-substep cap and slow down to stay accurate.

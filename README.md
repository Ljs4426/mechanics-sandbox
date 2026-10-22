# Mechanics Sandbox

An interactive 2D mechanics sandbox for AP Physics C: Mechanics. You draw systems that look like engineering-dynamics textbook diagrams, then press Play and watch them move with real physics in SI units.

- One self-contained HTML file: open `mechanics-sandbox.html` by double-clicking it (Chrome or Edge). There's no build step.
- Libraries load from a CDN, pinned to exact versions: MathJax 3.2.2 for LaTeX labels and Planck.js 1.5.0 (a Box2D port) for physics. It needs internet the first time.
- Full requirements: [docs/SPEC.md](docs/SPEC.md).

## Quick start

1. **Examples & presets…** (top bar): the 4 reference diagrams and 13 classic AP setups. Each preset opens with an "About" card listing the textbook answers to check.
2. **Play / Step / Reset.** Reset always returns to exactly the scene you started from.
3. **Show** (bottom of the left toolbar): free-body diagram, graphs, v/a/p/ω arrows, trails, center of mass, rolling indicator. Select a body for its live readouts.
4. **Run tests:** 40 checks of the physics and the analysis tools against textbook answers.
5. **Export SVG / PNG** for clean diagrams; **Export CSV** (in the graphs dock) for the data.

## Status

| Phase | What | State |
|---|---|---|
| 1 | Editor and textbook look | Done (git tag `phase-1`) |
| 2 | Core physics | Done (git tag `phase-2`) |
| 3 | AP analysis tools (FBD, graphs, readouts) | Done (git tag `phase-3`) |
| 4 | Advanced elements (moving pulleys, actuators, drag, orbits) | Done (git tag `phase-4`) |
| 5 | Presets | Done (git tag `phase-5`). 40 checks in **Run tests**, all pass |

To get an older phase's file:

```bash
git show phase-1:mechanics-sandbox.html > mechanics-sandbox-phase1.html
```

## Layout

- `mechanics-sandbox.html`: the app, split into labeled sections (see the comment at the top of the file)
- `docs/SPEC.md`: the original requirements and answers to clarifying questions
- `docs/PHASE2-NOTES.md`: Phase 2 design notes (Planck internals, rope constraint math, test setups)
- `docs/PHASE3-NOTES.md`: Phase 3 design notes (force ledger, energy bookkeeping, recorder)
- `docs/PHASE4-NOTES.md`: Phase 4 design notes (rolling wheels, mounting, moving pulleys, EM damper, drag, orbits)
- `docs/PHASE5-NOTES.md`: Phase 5 design notes (presets, plus the curved-track and spinning-joint accuracy fixes)

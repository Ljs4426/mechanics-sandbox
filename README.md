# Mechanics Sandbox

An interactive 2D mechanics sandbox for AP Physics C: Mechanics. You draw systems that look like engineering-dynamics textbook diagrams, then press Play and watch them move with real physics in SI units.

- One self-contained HTML file: open `mechanics-sandbox.html` by double-clicking it (Chrome or Edge). There's no build step.
- Libraries load from a CDN, pinned to exact versions: MathJax 3.2.2 for LaTeX labels and Planck.js 1.5.0 (a Box2D port) for physics.
- Full requirements: [docs/SPEC.md](docs/SPEC.md).

## Status

| Phase | What | State |
|---|---|---|
| 1 | Editor and textbook look | Done (git tag `phase-1`) |
| 2 | Core physics | Done (git tag `phase-2`). All 7 built-in tests pass (**Run tests** button) |
| 3 | AP analysis tools (FBD, graphs, readouts) | Done (git tag `phase-3`). 16 checks in **Run tests**, all pass |
| 4 | Advanced elements (moving pulleys, actuators, drag, orbits) | Done (git tag `phase-4`). 25 checks in **Run tests**, all pass |
| 5 | Presets | Not started |

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

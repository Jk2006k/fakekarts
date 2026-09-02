# FakeKarts contributor guide

## Commands

- `npm install` installs dependencies.
- `npm run dev` starts the local game.
- `npm test` checks driving physics.
- `npm run build` must pass before a PR is opened.

## Module boundaries

- `src/game/Game.ts` only coordinates the render loop and game systems.
- `src/game/arena.ts` owns arena geometry, lighting, and arena boundaries.
- `src/game/kart.ts` owns the procedural kart model.
- `src/game/physics.ts` owns deterministic kart movement.
- `src/game/input.ts` maps keyboard and touch input to controls.
- `src/game/hud.ts` updates in-game interface values.
- `src/game/multiplayer.ts` owns peer discovery and state transport.
- `src/main.ts` owns menu interactions and game startup.
- `src/styles/base.css` owns the canvas and top bar.
- `src/styles/menu.css` owns the start menu.
- `src/styles/hud.css` owns race HUD and touch controls.
- `index.html` owns static UI structure.

## Working together

- Change the narrowest owning module instead of adding behavior to `Game.ts`.
- Keep shared state expressed through the existing `KartState`, `Controls`, and `Peer` types.
- Do not add frameworks, asset pipelines, or abstractions without a concrete need.
- Avoid drive-by formatting and generated-file edits so parallel branches stay mergeable.
- Add one focused test when changing non-trivial game logic.

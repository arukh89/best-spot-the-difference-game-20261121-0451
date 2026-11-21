# Twin Worlds — Spot the Difference

A complete, original spot-the-difference game for the make.fun bounty
"Make the best spot the difference game" (best-spot-the-difference-game-20261121-0451).

Two near-identical pictures side by side, seven fair differences per scene, three
hand-drawn worlds: an orchid greenhouse, an old station at dusk, and a rooftop
observatory. Click a change in either panel to mark it; hints, a 180-second timer,
score streaks, and a wrong-click time penalty keep the hunt honest. All art is
drawn procedurally on canvas — no image files, no network requests, no libraries.

## Play

```sh
node serve.ts   # serves game/ at http://localhost:8080
```

Open the page in a desktop browser. Click a scene (or press 1–3), then click the
changes you spot. `H` spends a hint (−25 pts), `R` restarts the scene, arrow keys
move a cursor and `Space`/`Enter` marks at it.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to
`/output` and writes `/output/dossier.json` with the kit's `buildDossier`.

## Layout

- `game/index.html` — page shell, 1280×720 canvas
- `game/src/config.js` — constants (sizes, timer, scoring)
- `game/src/scenes.js` — the three procedural scenes and their 7 differences each
- `game/src/render.js` — panels, HUD, markers, menu and overlays
- `game/src/main.js` — game loop, rules, scoring
- `game/src/input.js` — mouse + keyboard wiring
- `game/src/audio.js` — synthesized WebAudio effects, no audio files
- `game/src/shots.js` — deterministic `?shot=` modes for screenshots
- `screenshots/` — four real renders: cover (3 found, 4 left), play, scene 3, win
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see `LICENSE`.

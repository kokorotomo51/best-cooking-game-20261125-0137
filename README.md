![Sizzle & Serve](https://make.fun/badge/best-cooking-game-20261125-0137.svg)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/kokorotomo51/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/kokorotomo51/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# Sizzle & Serve

A midnight diner cooking game, built for the [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) bounty. It runs offline in a desktop browser from its own files — no network, no build step.

## How it plays

You are the night cook. Tickets arrive on the order board, each naming the
fillings of one dish. Walk the kitchen (click a station, or WASD / arrow
keys), prep each ingredient the way it needs — patties on the grill, taken
off inside the green zone for a perfect sear; lettuce, tomato and onion on
the chop board, three cuts each — stack the dish on the assembly plate, and
ring the serve bell when the plate matches a ticket. Patience bars drain
while you work; a fast serve pays a bigger tip, and back-to-back serves
build a combo. Three shifts of 150 seconds, each harder than the last.

## Why this design

The whole game reads in one glance: the order board on the left, the
ingredient bins and the grill across the back, the dish stacking up on the
plate, and the shift timer as a bar you can feel. Depth comes from route
planning — one item in hand at a time, so every ticket is a small path
through the kitchen — and from the grill's timing ring, which turns a
simple cook step into a judgement call. Everything is drawn procedurally
on canvas and every sound is synthesized with WebAudio, so the game is
only its own files.

## Run it

```sh
node serve.ts
# open http://localhost:8901/ — screenshots via ?shot=start, ?shot=play, ?shot=end
```

`main.ts` hands the entry in: it copies `game/` and `screenshots/` to the
output directory and writes `dossier.json` with the kit's `buildDossier`.

## Layout

- `game/src/main.js` — boot and frame loop
- `game/src/config.js` — tuning, ingredients, recipes, station layout
- `game/src/state.js` — the shift, tickets, cook, plate, grill and board
- `game/src/kitchen.js` — what working each station does
- `game/src/input.js` — click-to-walk, hotkeys, pending actions
- `game/src/render.js` — all canvas drawing: room, stations, food, cook, HUD
- `game/src/shots.js` — seeded screenshot poses
- `game/src/sound.js` — synthesized WebAudio feedback
- `game/src/random.js` — seeded randomness

// Mouse and keyboard input: click-to-walk, click-to-work, and hotkeys.
// One job: turn pointer and key events into cook targets and station work.
// Station work itself lives in kitchen.js; this file only decides what the
// player meant and whether the cook is close enough to do it now or must
// walk there first (a pending action fires on arrival).

import { STATIONS, INGREDIENTS } from './config.js';
import { near, grabIngredient, workGrill, workBoard, workPlate, workServe, workTrash } from './kitchen.js';
import { sfx, ensureAudio, toggleMute } from './sound.js';

export function createInput() {
  return { keys: new Set(), pending: null };
}

function standPoint(station) {
  return { x: station.x, y: 620 };
}

function clampFloor(x, y) {
  return { x: Math.max(60, Math.min(1220, x)), y: Math.max(520, Math.min(700, y)) };
}

function walkTo(state, x, y) {
  const p = clampFloor(x, y);
  state.cook.tx = p.x;
  state.cook.ty = p.y;
}

function stationHit(x, y) {
  // Returns { station, kind } for a click on a station or an ingredient slot.
  for (const [key, st] of Object.entries(STATIONS)) {
    if (x >= st.x - st.w / 2 && x <= st.x + st.w / 2 && y >= st.y && y <= st.y + st.h) {
      if (key === 'fridge') return { station: key, kind: 'patty' };
      if (key === 'veg' && st.slots) {
        const i = Math.min(2, Math.max(0, Math.floor(((x - (st.x - st.w / 2)) / st.w) * 3)));
        return { station: key, kind: st.slots[i] };
      }
      if (key === 'shelf' && st.slots) {
        const i = x < st.x ? 0 : 1;
        return { station: key, kind: st.slots[i] };
      }
      return { station: key, kind: null };
    }
  }
  return null;
}

export function workStation(input, state, station, kind) {
  const st = STATIONS[station];
  if (!st) return;
  if (near(state, st)) {
    doWork(state, station, kind);
    return;
  }
  const stand = standPoint(st);
  walkTo(state, stand.x, stand.y);
  input.pending = { station, kind };
}

function doWork(state, station, kind) {
  if (station === 'fridge' || station === 'veg' || station === 'shelf') {
    if (kind) grabIngredient(state, kind);
  } else if (station === 'grill') workGrill(state);
  else if (station === 'board') workBoard(state);
  else if (station === 'plate') workPlate(state);
  else if (station === 'serve') workServe(state);
  else if (station === 'trash') workTrash(state);
}

// Fire a pending action once the cook has walked into reach.
export function updatePending(input, state) {
  if (!input.pending) return;
  const st = STATIONS[input.pending.station];
  if (near(state, st)) {
    const { station, kind } = input.pending;
    input.pending = null;
    doWork(state, station, kind);
  }
}

export function clickAt(input, state, x, y, hooks) {
  ensureAudio();
  if (state.screen === 'title') { hooks.start(); return; }
  if (state.screen === 'end') { hooks.restart(); return; }
  if (state.paused) return;
  // HUD buttons: mute, then pause.
  if (y < 64) {
    if (x >= 1208) { toggleMute(); return; }
    if (x >= 1140) { hooks.togglePause(); return; }
  }
  const hit = stationHit(x, y);
  if (hit) {
    workStation(input, state, hit.station, hit.kind);
    return;
  }
  input.pending = null;
  walkTo(state, x, y);
}

export function keyDown(input, state, key, hooks) {
  ensureAudio();
  const k = key.toLowerCase();
  if (k === 'm') { toggleMute(); return; }
  if (state.screen === 'title' && (k === 'enter' || k === ' ')) { hooks.start(); return; }
  if (state.screen === 'end' && (k === 'r' || k === 'enter')) { hooks.restart(); return; }
  if (state.screen !== 'play') return;
  if (k === 'p') { hooks.togglePause(); return; }
  if (state.paused) return;
  if (k === ' ') {
    // Work the nearest station in reach.
    let best = null;
    let bestDist = 1e9;
    for (const [name, st] of Object.entries(STATIONS)) {
      if (near(state, st)) {
        const d = Math.hypot(state.cook.x - st.x, state.cook.y - 620);
        if (d < bestDist) { bestDist = d; best = name; }
      }
    }
    if (best) {
      const st = STATIONS[best];
      const kind = best === 'fridge' ? 'patty' : null;
      doWork(state, best, kind);
    }
    return;
  }
  if (/^[1-6]$/.test(k)) {
    const kind = Object.keys(INGREDIENTS).find((id) => INGREDIENTS[id].key === k);
    if (!kind) return;
    // Number keys grab from the bin the cook stands at.
    const atBin = ['fridge', 'veg', 'shelf'].find((name) => near(state, STATIONS[name]));
    if (atBin) {
      const st = STATIONS[atBin];
      const holds = atBin === 'fridge' ? ['patty'] : st.slots;
      if (holds.includes(kind)) grabIngredient(state, kind);
    }
    return;
  }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
    input.keys.add(k);
    input.pending = null;
  }
}

export function keyUp(input, key) {
  input.keys.delete(key.toLowerCase());
}

// Held movement keys steer the cook directly, cancelling click-to-walk.
export function applyHeldKeys(input, state, dt) {
  if (state.screen !== 'play' || state.paused) return;
  const keys = input.keys;
  let dx = 0;
  let dy = 0;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (dx === 0 && dy === 0) return;
  const len = Math.hypot(dx, dy);
  const speed = 300 * dt;
  const p = clampFloor(state.cook.x + (dx / len) * speed, state.cook.y + (dy / len) * speed);
  state.cook.x = p.x;
  state.cook.y = p.y;
  state.cook.tx = p.x;
  state.cook.ty = p.y;
  state.cook.face = dx < 0 ? -1 : dx > 0 ? 1 : state.cook.face;
  state.cook.walk += dt * 10;
}

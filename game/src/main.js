// Boot and the game loop: one canvas, requestAnimationFrame, and the wiring
// between input, kitchen rules, and the renderer.
// One job: own the frame — read the ?shot= pose when present, advance the
// shift and the cook otherwise, and draw.

import { VIEW_W, VIEW_H } from './config.js';
import { freshState, startShift, updateShift, updateCook } from './state.js';
import { createInput, clickAt, keyDown, keyUp, applyHeldKeys, updatePending } from './input.js';
import { render } from './render.js';
import { ensureAudio, sfx } from './sound.js';
import { poseForShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const input = createInput();

let state;
if (shot === 'start' || shot === 'play' || shot === 'end') {
  state = poseForShot(shot);
} else {
  state = freshState(1, (Date.now() % 2147483647) || 1);
}

let day = 1;

function startDay(nextDay) {
  day = nextDay;
  const seed = (Date.now() % 2147483647) || 1;
  state = startShift(freshState(nextDay, seed), nextDay, seed);
}

const hooks = {
  start() {
    ensureAudio();
    sfx.click();
    startDay(1);
  },
  restart() {
    ensureAudio();
    sfx.click();
    startDay(day >= 3 ? 1 : day + 1);
  },
  togglePause() {
    if (state.screen === 'play') state.paused = !state.paused;
  },
};

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * VIEW_W;
  const y = ((event.clientY - rect.top) / rect.height) * VIEW_H;
  return { x, y };
}

canvas.addEventListener('pointerdown', (event) => {
  const { x, y } = canvasPoint(event);
  clickAt(input, state, x, y, hooks);
});

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
    event.preventDefault();
  }
  keyDown(input, state, event.key, hooks);
});

window.addEventListener('keyup', (event) => {
  keyUp(input, event.key);
});

let last = performance.now();
let time = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!state.frozen) {
    time += dt;
    if (state.screen === 'play' && !state.paused) {
      applyHeldKeys(input, state, dt);
      updateCook(state, dt);
      updatePending(input, state);
      updateShift(state, dt);
      if (state.screen === 'end') sfx.dayEnd();
    }
  }
  render(ctx, state, time);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

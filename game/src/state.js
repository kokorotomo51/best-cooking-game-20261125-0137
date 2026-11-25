// The game's state: screen, shift clock, tickets, the cook, the plate, and the
// grill and chop board. One job: hold every fact the renderer and the kitchen
// rules read, and build fresh states for play and for the screenshot poses.

import {
  SHIFT_SECONDS, RECIPES, PATIENCE, MAX_TICKETS, TICKET_GAP_SECONDS,
  CHOPS_NEEDED, GRILL_SECONDS, GRILL_BURNT,
} from './config.js';
import { mulberry32, pick, shuffle } from './random.js';

export function newTicket(rng, day, id) {
  const pool = RECIPES.filter((r) => r.day <= day);
  const recipe = pick(rng, pool);
  return {
    id,
    recipe,
    patience: PATIENCE[day],
    patienceMax: PATIENCE[day],
    born: 0,
  };
}

export function freshState(day, seed) {
  return {
    screen: 'title', // 'title' | 'play' | 'end'
    day,
    seed,
    rng: mulberry32(seed),
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    score: 0,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    nextTicketId: 1,
    ticketTimer: 2,
    tickets: [],
    cook: { x: 640, y: 620, tx: 640, ty: 620, face: 1, walk: 0 },
    hand: null, // { kind, state: 'raw' | 'ready' | 'chopped' | 'grilled' | 'perfect' }
    grill: { kind: null, progress: 0 }, // one patty slot
    chopping: { kind: null, chops: 0 }, // one veg at a time
    plate: [], // kinds, in stacking order
    platePerfect: false, // a perfectly seared patty is stacked on the plate
    message: '',
    messageTimer: 0,
    flash: 0, // serve-window glow timer
    paused: false,
    frozen: false, // screenshot poses do not advance
  };
}

export function startShift(state, day, seed) {
  const next = freshState(day, seed);
  next.screen = 'play';
  next.rng = mulberry32(seed);
  // Deal two opening tickets so the board reads at once.
  next.tickets.push(newTicket(next.rng, day, next.nextTicketId++));
  next.tickets.push(newTicket(next.rng, day, next.nextTicketId++));
  next.tickets[0].born = 0;
  next.tickets[1].born = 0;
  return next;
}

export function dealTicket(state) {
  if (state.tickets.length >= MAX_TICKETS) return;
  const ticket = newTicket(state.rng, state.day, state.nextTicketId++);
  ticket.born = state.elapsed;
  state.tickets.push(ticket);
}

export function updateShift(state, dt) {
  if (state.screen !== 'play' || state.paused || state.frozen) return;
  state.elapsed += dt;
  state.timeLeft -= dt;
  state.messageTimer = Math.max(0, state.messageTimer - dt);
  state.flash = Math.max(0, state.flash - dt);
  state.comboTimer = Math.max(0, state.comboTimer - dt);
  if (state.comboTimer <= 0) state.combo = 0;

  // Grill cooks while a patty sits on it.
  if (state.grill.kind) {
    state.grill.progress += (dt / GRILL_SECONDS) * 100;
    if (state.grill.progress >= GRILL_BURNT) {
      state.grill = { kind: null, progress: 0 };
      state.message = 'Burnt! The patty is ruined.';
      state.messageTimer = 2;
    }
  }

  // Tickets lose patience; an empty bar walks out.
  for (const ticket of state.tickets) {
    ticket.patience -= dt;
  }
  const expired = state.tickets.filter((t) => t.patience <= 0);
  if (expired.length) {
    state.tickets = state.tickets.filter((t) => t.patience > 0);
    state.missed += expired.length;
    state.combo = 0;
    state.message = 'A customer walked out…';
    state.messageTimer = 2;
  }

  // New tickets arrive on a steady gap.
  state.ticketTimer -= dt;
  if (state.ticketTimer <= 0) {
    dealTicket(state);
    state.ticketTimer = TICKET_GAP_SECONDS;
  }

  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    state.screen = 'end';
  }
}

export function updateCook(state, dt) {
  const cook = state.cook;
  const dx = cook.tx - cook.x;
  const dy = cook.ty - cook.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) { cook.walk = 0; return; }
  const speed = 300 * dt;
  const step = Math.min(dist, speed);
  cook.x += (dx / dist) * step;
  cook.y += (dy / dist) * step;
  cook.face = dx < 0 ? -1 : 1;
  cook.walk += dt * 10;
}

export function plateMatchesTicket(plate, recipe) {
  if (plate.length !== recipe.fillings.length) return false;
  const have = plate.slice().sort().join(',');
  const want = recipe.fillings.slice().sort().join(',');
  return have === want;
}

export function matchingTicket(state) {
  return state.tickets.find((t) => plateMatchesTicket(state.plate, t.recipe)) || null;
}

export function chopProgress(state) {
  if (!state.chopping.kind) return 0;
  return state.chopping.chops / CHOPS_NEEDED;
}

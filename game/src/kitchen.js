// Kitchen rules: what happens when the cook works a station.
// One job: grab, grill, chop, assemble, serve, and trash — each answering at
// once, with the sound and message to match.

import {
  INGREDIENTS, GRILL_OK_MIN, GRILL_GOOD_MIN, GRILL_GOOD_MAX, GRILL_BURNT,
  CHOPS_NEEDED, PLATE_MAX,
} from './config.js';
import { matchingTicket } from './state.js';
import { sfx } from './sound.js';

function say(state, text) {
  state.message = text;
  state.messageTimer = 2.2;
}

// The cook works every station from the floor lane in front of the counters,
// so reach is measured to the station's stand point on the floor (y 620).
export function near(state, station, reach) {
  const dx = state.cook.x - station.x;
  const dy = state.cook.y - 620;
  return Math.hypot(dx, dy) <= (reach || 160);
}

export function grabIngredient(state, kind) {
  const def = INGREDIENTS[kind];
  if (!def) return;
  if (state.hand) { say(state, 'Hands full — place it or trash it first.'); sfx.bad(); return; }
  if (def.prep === 'grill') {
    state.hand = { kind, state: 'raw' };
  } else {
    state.hand = { kind, state: def.prep === 'ready' ? 'ready' : 'raw' };
  }
  sfx.grab();
}

// Grill: place a raw patty, or take the patty off with its doneness judged.
export function workGrill(state) {
  const grill = state.grill;
  if (!grill.kind) {
    if (state.hand && state.hand.kind === 'patty' && state.hand.state === 'raw') {
      state.grill = { kind: 'patty', progress: 0 };
      state.hand = null;
      sfx.sizzle();
      say(state, 'Patty on the grill…');
    } else if (state.hand) {
      say(state, 'Only a raw patty goes on the grill.');
      sfx.bad();
    } else {
      say(state, 'Grab a patty from the fridge first.');
    }
    return;
  }
  const p = grill.progress;
  state.grill = { kind: null, progress: 0 };
  if (p < GRILL_OK_MIN) {
    state.hand = { kind: 'patty', state: 'raw' };
    say(state, 'Still raw — back on the grill.');
    sfx.bad();
    return;
  }
  if (p >= GRILL_BURNT) {
    say(state, 'Burnt! The patty is ruined.');
    sfx.bad();
    return;
  }
  const perfect = p >= GRILL_GOOD_MIN && p <= GRILL_GOOD_MAX;
  state.hand = { kind: 'patty', state: perfect ? 'perfect' : 'grilled' };
  if (perfect) { sfx.sear(); say(state, 'Perfect sear! Extra tip on this one.'); }
  else { sfx.grab(); say(state, 'Grilled. Get it on the plate.'); }
}

// Chop board: place a raw vegetable, or chop it once per press.
export function workBoard(state) {
  const chopping = state.chopping;
  if (!chopping.kind) {
    if (state.hand && INGREDIENTS[state.hand.kind].prep === 'chop' && state.hand.state === 'raw') {
      state.chopping = { kind: state.hand.kind, chops: 0 };
      state.hand = null;
      sfx.click();
      say(state, 'Chop it: three good cuts.');
    } else if (state.hand) {
      say(state, 'Only lettuce, tomato or onion go on the board.');
      sfx.bad();
    } else {
      say(state, 'Bring a vegetable from the crate.');
    }
    return;
  }
  chopping.chops += 1;
  if (chopping.chops >= CHOPS_NEEDED) {
    state.hand = { kind: chopping.kind, state: 'chopped' };
    state.chopping = { kind: null, chops: 0 };
    sfx.chopped();
    say(state, 'Chopped fine. On the plate it goes.');
  } else {
    sfx.chop();
  }
}

// Assembly plate: add the carried item, if it is cooked or prepped.
export function workPlate(state) {
  const hand = state.hand;
  if (!hand) { say(state, 'Bring an ingredient to build the dish.'); return; }
  if (hand.state === 'raw') {
    say(state, `${INGREDIENTS[hand.kind].name} still needs prep — grill or chop it first.`);
    sfx.bad();
    return;
  }
  if (state.plate.length >= PLATE_MAX) { say(state, 'The plate is full — serve it or trash it.'); sfx.bad(); return; }
  if (hand.kind === 'patty' && hand.state === 'perfect') state.platePerfect = true;
  state.plate.push(hand.kind);
  state.hand = null;
  sfx.place();
  const match = matchingTicket(state);
  if (match) {
    sfx.ready();
    say(state, `${match.recipe.name} is ready — ring the serve bell!`);
    state.flash = 1.2;
  }
}

// Serve window: hand over the plate when it matches a ticket.
export function workServe(state) {
  const match = matchingTicket(state);
  if (!match) {
    if (state.plate.length === 0) { say(state, 'Nothing on the plate yet.'); return; }
    say(state, 'No ticket matches this plate — check the order board.');
    sfx.bad();
    return;
  }
  const patienceFrac = Math.max(0, match.patience / match.patienceMax);
  const tip = Math.round(patienceFrac * 6);
  const searBonus = state.platePerfect ? 4 : 0;
  const pay = match.recipe.value + tip + searBonus;
  state.tickets = state.tickets.filter((t) => t.id !== match.id);
  state.plate = [];
  state.platePerfect = false;
  state.coins += pay;
  state.served += 1;
  state.combo = state.comboTimer > 0 ? state.combo + 1 : 1;
  state.comboTimer = 10;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const comboPay = state.combo > 1 ? (state.combo - 1) * 2 : 0;
  state.coins += comboPay;
  state.score += pay * 10 + comboPay * 10;
  state.flash = 1.2;
  sfx.serve();
  say(state, `Served ${match.recipe.name} — ${pay + comboPay} coins${state.combo > 1 ? `, combo x${state.combo}!` : ''}`);
}

// Trash: dump the hand, the plate, or both.
export function workTrash(state) {
  if (state.hand || state.plate.length) {
    state.hand = null;
    state.plate = [];
    state.platePerfect = false;
    sfx.bad();
    say(state, 'Trashed. Fresh plate, fresh start.');
  } else {
    say(state, 'Nothing to trash.');
  }
}

// Screenshot poses for ?shot=start|play|end: fixed, seeded scenes so the
// screenshots are real renders of the game's own code, reproducible every run.
// One job: build the exact state each named shot shows. The live game never
// uses these paths.

import { freshState, startShift, newTicket } from './state.js';
import { mulberry32 } from './random.js';

// The play shot must show, in one frame: the kitchen and the order board,
// ingredients on the counter, one dish mid-assembly, the shift timer, and a
// plate ready to serve — so it poses a matching plate, a patty in the grill's
// green zone, and three live tickets.
export function poseForShot(shot) {
  if (shot === 'start') {
    const state = freshState(1, 11);
    state.screen = 'title';
    state.frozen = true;
    return state;
  }
  if (shot === 'end') {
    const state = freshState(1, 11);
    state.screen = 'end';
    state.served = 14;
    state.missed = 2;
    state.coins = 186;
    state.score = 2140;
    state.bestCombo = 3;
    state.frozen = true;
    return state;
  }
  // 'play'
  const state = startShift(freshState(1, 20261125), 1, 20261125);
  state.frozen = true;
  state.elapsed = 58;
  state.timeLeft = 92;
  state.score = 1250;
  state.coins = 42;
  state.served = 4;
  state.combo = 2;
  // Three tickets with readable patience bars.
  const rng = mulberry32(77);
  state.tickets = [newTicket(rng, 1, 1), newTicket(rng, 1, 2), newTicket(rng, 1, 3)];
  state.tickets[0].patience = 40;
  state.tickets[1].patience = 26;
  state.tickets[2].patience = 12;
  // Force the first ticket to be the Classic, and stack its fillings so the
  // plate reads as mid-assembly AND ready to serve.
  state.tickets[0].recipe = {
    name: 'Classic',
    fillings: ['patty', 'lettuce', 'tomato'],
    value: 12,
    day: 1,
  };
  state.plate = ['patty', 'lettuce', 'tomato'];
  // A patty on the grill inside the green zone, mid-sizzle.
  state.grill = { kind: 'patty', progress: 72 };
  // Chopped tomato waiting on the board.
  state.chopping = { kind: 'tomato', chops: 2 };
  // The cook stands left of the assembly counter, cheese in hand, clear of
  // the station label.
  state.cook.x = 870;
  state.cook.y = 620;
  state.cook.tx = 870;
  state.cook.ty = 620;
  state.hand = { kind: 'cheese', state: 'ready' };
  state.message = 'Classic is ready — ring the serve bell!';
  state.messageTimer = 99;
  state.flash = 99;
  return state;
}

// Sizzle & Serve — tuning, ingredients, recipes, and the look of the diner.
// One job: every number and name the rest of the game shares lives here.

export const VIEW_W = 1280;
export const VIEW_H = 800;

export const SHIFT_SECONDS = 150;

// Ingredients. `prep` says what the ingredient needs before it can join a dish:
// 'grill' (timed on the grill), 'chop' (three chops on the board), 'ready' (grab and go).
export const INGREDIENTS = {
  patty:   { name: 'Patty',   prep: 'grill', color: '#7a4a2b', dark: '#5a3320', key: '1' },
  cheese:  { name: 'Cheese',  prep: 'ready', color: '#f5b921', dark: '#d99a0d', key: '2' },
  lettuce: { name: 'Lettuce', prep: 'chop',  color: '#58b368', dark: '#3d8a4c', key: '3' },
  tomato:  { name: 'Tomato',  prep: 'chop',  color: '#e14b3a', dark: '#b23226', key: '4' },
  onion:   { name: 'Onion',   prep: 'chop',  color: '#c9a7e8', dark: '#a67fd1', key: '5' },
  sauce:   { name: 'Sauce',   prep: 'ready', color: '#e8873a', dark: '#c26a24', key: '6' },
};

// Recipes: the filling sets tickets ask for. `value` is the base coin pay.
export const RECIPES = [
  { name: 'Classic',     fillings: ['patty', 'lettuce', 'tomato'],            value: 12, day: 1 },
  { name: 'Cheese Melt',  fillings: ['patty', 'cheese'],                       value: 10, day: 1 },
  { name: 'Garden',       fillings: ['lettuce', 'tomato', 'onion'],            value: 10, day: 1 },
  { name: 'Double Stack', fillings: ['patty', 'patty', 'cheese'],              value: 16, day: 2 },
  { name: 'Deluxe',       fillings: ['patty', 'cheese', 'lettuce', 'tomato', 'onion'], value: 20, day: 2 },
  { name: 'Saucy',        fillings: ['patty', 'sauce', 'cheese'],              value: 14, day: 2 },
  { name: 'The Works',    fillings: ['patty', 'patty', 'cheese', 'lettuce', 'tomato', 'sauce'], value: 26, day: 3 },
];

export const GRILL_SECONDS = 5;      // raw patty -> 100% cooked
export const GRILL_OK_MIN = 30;      // below this the patty is still raw
export const GRILL_GOOD_MIN = 55;    // the green zone: a perfect sear, extra tip
export const GRILL_GOOD_MAX = 90;
export const GRILL_BURNT = 97;       // past this the patty burns and is lost
export const CHOPS_NEEDED = 3;

export const MAX_TICKETS = 3;
export const TICKET_GAP_SECONDS = 11;
export const PATIENCE = { 1: 52, 2: 44, 3: 36 };
export const PLATE_MAX = 6;

export const COOK_SPEED = 300; // px per second

// Station layout, in canvas pixels. The cook walks the floor lane (y 560-680)
// and works the stations from below.
export const STATIONS = {
  fridge:  { x: 400, y: 190, w: 130, h: 110, label: 'FRIDGE',  slot: 'patty' },
  veg:     { x: 570, y: 190, w: 190, h: 110, label: 'VEG CRATE', slots: ['lettuce', 'tomato', 'onion'] },
  shelf:   { x: 800, y: 190, w: 150, h: 110, label: 'SHELF', slots: ['cheese', 'sauce'] },
  grill:   { x: 450, y: 375, w: 230, h: 130, label: 'GRILL' },
  board:   { x: 700, y: 375, w: 140, h: 130, label: 'CHOP BOARD' },
  plate:   { x: 950, y: 385, w: 240, h: 150, label: 'ASSEMBLY' },
  serve:   { x: 1180, y: 385, w: 130, h: 150, label: 'SERVE' },
  trash:   { x: 1180, y: 560, w: 130, h: 90, label: 'TRASH' },
};

export const PALETTE = {
  wallTop: '#1f4e4a',
  wallTile: '#27635d',
  wallBottom: '#f3e4c8',
  floor: '#b98a5a',
  floorDark: '#a3764a',
  wood: '#8a5a33',
  woodDark: '#6f4525',
  steel: '#c8ccd2',
  steelDark: '#9aa0a8',
  cream: '#fff6e3',
  ink: '#2b2118',
  ticket: '#fffaf0',
  gold: '#f5b921',
  red: '#d94f3d',
  green: '#58b368',
};

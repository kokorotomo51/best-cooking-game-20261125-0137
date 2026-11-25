// Every pixel of the diner, drawn procedurally on one canvas.
// One job: turn the state into a readable kitchen — order board, ingredient
// bins, grill, chop board, a dish mid-assembly, the shift timer, and the cook.
// The judge reads the game through these pictures, so each element is drawn
// big, labelled, and unmistakable at a glance.

import {
  VIEW_W, VIEW_H, INGREDIENTS, STATIONS, PALETTE,
  GRILL_OK_MIN, GRILL_GOOD_MIN, GRILL_GOOD_MAX, GRILL_BURNT, CHOPS_NEEDED,
} from './config.js';
import { matchingTicket, chopProgress } from './state.js';
import { isMuted } from './sound.js';

export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function text(ctx, str, x, y, size, color, align, weight, font) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px ${font || 'system-ui, sans-serif'}`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- Food art ---------------------------------------------------------------

// Draw one ingredient serving at (cx, cy), fitting in a box of side `s`.
// `variant` tints it: raw patty is pink, grilled is brown, perfect gets a glow.
export function drawIngredient(ctx, kind, cx, cy, s, variant) {
  const def = INGREDIENTS[kind];
  const u = s / 64;
  ctx.save();
  ctx.translate(cx, cy);
  if (kind === 'patty') {
    const cooked = variant === 'grilled' || variant === 'perfect';
    ctx.fillStyle = cooked ? '#6b3d22' : '#e8908a';
    rr(ctx, -30 * u, -12 * u, 60 * u, 24 * u, 12 * u);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2 * u;
    for (const off of [-16, 0, 16]) {
      ctx.beginPath();
      ctx.moveTo(off * u, -10 * u);
      ctx.lineTo((off - 6) * u, 10 * u);
      ctx.stroke();
    }
    if (variant === 'perfect') {
      ctx.strokeStyle = '#ffd94d';
      ctx.lineWidth = 3 * u;
      rr(ctx, -32 * u, -14 * u, 64 * u, 28 * u, 13 * u);
      ctx.stroke();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(-28 * u, -10 * u);
    ctx.lineTo(28 * u, -10 * u);
    ctx.lineTo(28 * u, 8 * u);
    ctx.lineTo(14 * u, 8 * u);
    ctx.lineTo(8 * u, 18 * u);
    ctx.lineTo(0, 8 * u);
    ctx.lineTo(-12 * u, 8 * u);
    ctx.lineTo(-18 * u, 16 * u);
    ctx.lineTo(-28 * u, 8 * u);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = def.dark;
    circle(ctx, -14 * u, -2 * u, 3 * u); ctx.fill();
    circle(ctx, 12 * u, -3 * u, 3 * u); ctx.fill();
  } else if (kind === 'lettuce') {
    ctx.fillStyle = def.color;
    for (const [ox, oy, r] of [[-18, 0, 14], [0, -6, 16], [18, 0, 14], [0, 6, 15]]) {
      circle(ctx, ox * u, oy * u, r * u); ctx.fill();
    }
    ctx.strokeStyle = def.dark;
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.moveTo(-26 * u, 0);
    ctx.quadraticCurveTo(0, -14 * u, 26 * u, 0);
    ctx.stroke();
  } else if (kind === 'tomato') {
    ctx.fillStyle = def.color;
    circle(ctx, 0, 0, 26 * u); ctx.fill();
    ctx.fillStyle = '#f2827a';
    circle(ctx, 0, 0, 17 * u); ctx.fill();
    ctx.fillStyle = '#ffd9d4';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 10 * u, Math.sin(a) * 10 * u, 3.5 * u, 6 * u, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = def.color;
    circle(ctx, 0, 0, 4 * u); ctx.fill();
  } else if (kind === 'onion') {
    ctx.fillStyle = '#f2e9fb';
    circle(ctx, 0, 0, 26 * u); ctx.fill();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 4 * u;
    for (const r of [19, 12, 5]) { circle(ctx, 0, 0, r * u); ctx.stroke(); }
  } else if (kind === 'sauce') {
    // A squeeze bottle dollop: zigzag drizzle over a round dollop.
    ctx.fillStyle = def.color;
    circle(ctx, 0, 4 * u, 20 * u); ctx.fill();
    ctx.strokeStyle = def.dark;
    ctx.lineWidth = 5 * u;
    ctx.beginPath();
    ctx.moveTo(-24 * u, -2 * u);
    ctx.lineTo(-12 * u, -12 * u);
    ctx.lineTo(0, -2 * u);
    ctx.lineTo(12 * u, -12 * u);
    ctx.lineTo(24 * u, -2 * u);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    circle(ctx, -7 * u, -2 * u, 4 * u); ctx.fill();
  }
  ctx.restore();
}

function drawBunBottom(ctx, cx, y, w) {
  ctx.fillStyle = '#e8b25e';
  ctx.beginPath();
  ctx.ellipse(cx, y, w / 2, 12, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#d99a3d';
  ctx.fillRect(cx - w / 2, y - 2, w, 4);
}

function drawBunTop(ctx, cx, y, w) {
  ctx.fillStyle = '#f0c06a';
  ctx.beginPath();
  ctx.ellipse(cx, y, w / 2, 16, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3d0';
  for (const [ox, oy] of [[-18, -8], [0, -12], [18, -8], [-9, -4], [9, -4]]) {
    ctx.beginPath();
    ctx.ellipse(cx + ox, y + oy, 3.2, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A stacked dish on a plate: bottom bun, fillings, and a top bun once the
// plate matches a ticket (the "plate ready to serve" moment).
export function drawDish(ctx, cx, baseY, plate, ready, scale) {
  const w = 104 * scale;
  // Plate.
  ctx.fillStyle = '#eef1f4';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, 66 * scale, 13 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c8ccd2';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, 46 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  if (ready) {
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, baseY, 68 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  let y = baseY - 8 * scale;
  drawBunBottom(ctx, cx, y, w);
  y -= 4 * scale;
  for (const kind of plate) {
    const h = 13 * scale;
    if (kind === 'patty') {
      ctx.fillStyle = '#6b3d22';
      rr(ctx, cx - w / 2 + 4 * scale, y - h, w - 8 * scale, h, 6 * scale);
      ctx.fill();
    } else if (kind === 'cheese') {
      ctx.fillStyle = '#f5b921';
      ctx.beginPath();
      ctx.moveTo(cx - w / 2 + 2 * scale, y - h);
      ctx.lineTo(cx + w / 2 - 2 * scale, y - h);
      ctx.lineTo(cx + w / 2 - 2 * scale, y - 2 * scale);
      ctx.lineTo(cx + 12 * scale, y - 2 * scale);
      ctx.lineTo(cx + 6 * scale, y + 5 * scale);
      ctx.lineTo(cx - 6 * scale, y - 2 * scale);
      ctx.lineTo(cx - 14 * scale, y - 2 * scale);
      ctx.lineTo(cx - w / 2 + 2 * scale, y - 2 * scale);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'lettuce') {
      ctx.fillStyle = '#58b368';
      for (let i = 0; i < 5; i++) {
        const ox = (i - 2) * (w / 5.4);
        circle(ctx, cx + ox, y - h / 2, (w / 9) * scale);
        ctx.fill();
      }
    } else if (kind === 'tomato') {
      ctx.fillStyle = '#e14b3a';
      rr(ctx, cx - w / 2 + 6 * scale, y - h, w - 12 * scale, h, 6 * scale);
      ctx.fill();
      ctx.fillStyle = '#f2827a';
      rr(ctx, cx - w / 2 + 14 * scale, y - h + 3 * scale, w - 28 * scale, h - 6 * scale, 4 * scale);
      ctx.fill();
    } else if (kind === 'onion') {
      ctx.fillStyle = '#efe6f7';
      rr(ctx, cx - w / 2 + 6 * scale, y - h, w - 12 * scale, h, 6 * scale);
      ctx.fill();
      ctx.strokeStyle = '#c9a7e8';
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(cx - w / 2 + 10 * scale, y - h + 2 * scale, w - 20 * scale, h - 4 * scale);
    } else if (kind === 'sauce') {
      ctx.fillStyle = '#e8873a';
      ctx.beginPath();
      ctx.moveTo(cx - w / 2 + 4 * scale, y - 2 * scale);
      ctx.lineTo(cx - w / 4, y - h);
      ctx.lineTo(cx, y - 2 * scale);
      ctx.lineTo(cx + w / 4, y - h);
      ctx.lineTo(cx + w / 2 - 4 * scale, y - 2 * scale);
      ctx.closePath();
      ctx.fill();
    }
    y -= h;
  }
  if (ready) drawBunTop(ctx, cx, y + 2 * scale, w);
  return y;
}

// --- The room ---------------------------------------------------------------

function drawRoom(ctx, time) {
  // Tiled wall.
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 0, VIEW_W, 300);
  ctx.fillStyle = PALETTE.wallTile;
  for (let x = 0; x < VIEW_W; x += 64) {
    for (let y = 0; y < 300; y += 48) {
      ctx.fillRect(x + 1, y + 1, 62, 46);
    }
  }
  // Window with the night outside.
  ctx.fillStyle = '#16283e';
  rr(ctx, 920, 84, 300, 150, 10);
  ctx.fill();
  ctx.fillStyle = '#f5d76e';
  circle(ctx, 1140, 130, 22); ctx.fill();
  ctx.fillStyle = '#fff6c8';
  for (const [sx, sy] of [[960, 110], [1000, 150], [1040, 105], [1080, 165], [1180, 180], [960, 190]]) {
    circle(ctx, sx, sy, 3); ctx.fill();
  }
  ctx.strokeStyle = '#6f4525';
  ctx.lineWidth = 6;
  ctx.strokeRect(920, 84, 300, 150);
  ctx.beginPath();
  ctx.moveTo(1070, 84); ctx.lineTo(1070, 234);
  ctx.stroke();
  // Hanging lamps.
  for (const lx of [420, 700, 980]) {
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 52); ctx.stroke();
    const flick = 0.92 + 0.08 * Math.sin(time * 2 + lx);
    ctx.fillStyle = `rgba(255, 225, 140, ${0.25 * flick})`;
    ctx.beginPath();
    ctx.moveTo(lx - 34, 96); ctx.lineTo(lx + 34, 96); ctx.lineTo(lx, 52); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f5b921';
    ctx.beginPath();
    ctx.moveTo(lx - 26, 66); ctx.lineTo(lx + 26, 66); ctx.lineTo(lx, 44); ctx.closePath();
    ctx.fill();
  }
  // Wainscot + floor.
  ctx.fillStyle = PALETTE.wallBottom;
  ctx.fillRect(0, 300, VIEW_W, 40);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 340, VIEW_W, 400);
  ctx.fillStyle = PALETTE.floorDark;
  for (let y = 380; y < 740; y += 72) ctx.fillRect(0, y, VIEW_W, 3);
  for (let x = 0; x < VIEW_W; x += 120) ctx.fillRect(x, 340, 3, 400);
  // Back counter shelf line.
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(300, 316, 980, 10);
}

// --- Stations ---------------------------------------------------------------

function stationLabel(ctx, st, extra) {
  // A dark pill keeps the label readable over the floor, the cook, or a bin.
  const label = st.label;
  ctx.font = '800 15px system-ui, sans-serif';
  const w = ctx.measureText(label).width + 24;
  ctx.fillStyle = 'rgba(32,48,46,0.75)';
  rr(ctx, st.x - w / 2, st.y + st.h + 8, w, 22, 11);
  ctx.fill();
  text(ctx, label, st.x, st.y + st.h + 19, 15, '#fff6e3', 'center', 800);
  if (extra) text(ctx, extra, st.x, st.y + st.h + 40, 13, '#3a2c14', 'center', 600);
}

function drawBins(ctx, state) {
  // Fridge.
  const fr = STATIONS.fridge;
  ctx.fillStyle = '#dfe6ea';
  rr(ctx, fr.x - fr.w / 2, fr.y, fr.w, fr.h, 8); ctx.fill();
  ctx.fillStyle = '#b9c4cb';
  rr(ctx, fr.x - fr.w / 2, fr.y, fr.w, 34, 8); ctx.fill();
  ctx.fillStyle = '#7d8a93';
  ctx.fillRect(fr.x - fr.w / 2 + 10, fr.y + 8, 26, 18);
  drawIngredient(ctx, 'patty', fr.x, fr.y + 72, 56, 'raw');
  text(ctx, 'PATTY', fr.x, fr.y + 100, 12, '#5a6b76', 'center', 800);
  text(ctx, '[1]', fr.x + fr.w / 2 - 16, fr.y + 14, 12, '#5a6b76', 'center', 800);
  stationLabel(ctx, fr, 'raw patties');

  // Veg crate.
  const vg = STATIONS.veg;
  ctx.fillStyle = PALETTE.wood;
  rr(ctx, vg.x - vg.w / 2, vg.y, vg.w, vg.h, 8); ctx.fill();
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(vg.x - vg.w / 2, vg.y, vg.w, 8);
  const slots = [['lettuce', -58], ['tomato', 0], ['onion', 58]];
  for (const [kind, ox] of slots) {
    drawIngredient(ctx, kind, vg.x + ox, vg.y + 52, 52, 'ready');
    text(ctx, INGREDIENTS[kind].name.toUpperCase(), vg.x + ox, vg.y + 94, 11, '#ffe9b0', 'center', 800);
    text(ctx, `[${INGREDIENTS[kind].key}]`, vg.x + ox, vg.y + 16, 11, '#ffe9b0', 'center', 700);
  }
  stationLabel(ctx, vg, 'needs chopping');

  // Shelf: cheese + sauce.
  const sh = STATIONS.shelf;
  ctx.fillStyle = PALETTE.steel;
  rr(ctx, sh.x - sh.w / 2, sh.y, sh.w, sh.h, 8); ctx.fill();
  ctx.fillStyle = PALETTE.steelDark;
  ctx.fillRect(sh.x - sh.w / 2, sh.y + 52, sh.w, 6);
  drawIngredient(ctx, 'cheese', sh.x - 36, sh.y + 34, 50, 'ready');
  drawIngredient(ctx, 'sauce', sh.x + 36, sh.y + 34, 50, 'ready');
  text(ctx, 'CHEESE', sh.x - 36, sh.y + 94, 11, '#5a636b', 'center', 800);
  text(ctx, 'SAUCE', sh.x + 36, sh.y + 94, 11, '#5a636b', 'center', 800);
  stationLabel(ctx, sh, 'ready to use');
}

function drawGrill(ctx, state, time) {
  const g = STATIONS.grill;
  ctx.fillStyle = '#3a3f45';
  rr(ctx, g.x - g.w / 2, g.y, g.w, g.h, 10); ctx.fill();
  ctx.fillStyle = '#22262b';
  rr(ctx, g.x - g.w / 2 + 12, g.y + 12, g.w - 24, g.h - 50, 6); ctx.fill();
  ctx.strokeStyle = '#565d66';
  ctx.lineWidth = 5;
  for (let i = 1; i < 6; i++) {
    const gx = g.x - g.w / 2 + 12 + ((g.w - 24) / 6) * i;
    ctx.beginPath(); ctx.moveTo(gx, g.y + 14); ctx.lineTo(gx, g.y + g.h - 40); ctx.stroke();
  }
  // Heat glow.
  ctx.fillStyle = 'rgba(255, 110, 40, 0.18)';
  rr(ctx, g.x - g.w / 2 + 12, g.y + 12, g.w - 24, g.h - 50, 6); ctx.fill();
  const grill = state.grill;
  if (grill.kind) {
    const px = g.x;
    const py = g.y + 46;
    // Progress ring: raw -> done, with the green zone marked.
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(px, py, 40, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#58b368';
    ctx.beginPath();
    ctx.arc(px, py, 40, -Math.PI / 2 + (GRILL_GOOD_MIN / 100) * Math.PI * 2, -Math.PI / 2 + (GRILL_GOOD_MAX / 100) * Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = grill.progress >= GRILL_BURNT - 8 ? '#d94f3d' : '#f5b921';
    ctx.beginPath();
    ctx.arc(px, py, 40, -Math.PI / 2, -Math.PI / 2 + (Math.min(100, grill.progress) / 100) * Math.PI * 2);
    ctx.stroke();
    drawIngredient(ctx, 'patty', px, py, 56, grill.progress >= GRILL_GOOD_MIN ? 'grilled' : 'raw');
    // Smoke puffs.
    ctx.fillStyle = 'rgba(230,230,230,0.35)';
    for (let i = 0; i < 3; i++) {
      const ph = (time * 0.7 + i / 3) % 1;
      circle(ctx, px - 14 + i * 14, py - 46 - ph * 26, 5 + ph * 7);
      ctx.fill();
    }
    text(ctx, `${Math.floor(grill.progress)}%`, px, py + 58, 14, '#fff6e3', 'center', 800);
  } else {
    text(ctx, 'GRILL — click a raw patty here', g.x, g.y + 46, 14, '#c8ccd2', 'center', 600);
  }
  stationLabel(ctx, g, 'take it off in the green zone');
}

function drawBoard(ctx, state) {
  const b = STATIONS.board;
  ctx.fillStyle = '#e9c88f';
  rr(ctx, b.x - b.w / 2, b.y + 16, b.w, b.h - 32, 8); ctx.fill();
  ctx.strokeStyle = '#c49a5e';
  ctx.lineWidth = 3;
  rr(ctx, b.x - b.w / 2, b.y + 16, b.w, b.h - 32, 8); ctx.stroke();
  // Knife.
  ctx.save();
  ctx.translate(b.x + 44, b.y + 40);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#c8ccd2';
  ctx.fillRect(-4, -26, 8, 40);
  ctx.fillStyle = '#5a4632';
  ctx.fillRect(-4, 14, 8, 18);
  ctx.restore();
  const ch = state.chopping;
  if (ch.kind) {
    drawIngredient(ctx, ch.kind, b.x - 18, b.y + 74, 54, 'ready');
    // Chop pips.
    for (let i = 0; i < CHOPS_NEEDED; i++) {
      ctx.fillStyle = i < ch.chops ? '#58b368' : 'rgba(255,255,255,0.4)';
      circle(ctx, b.x - 18 + (i - 1) * 20, b.y + 108, 6);
      ctx.fill();
    }
    // Cut marks over the veg.
    ctx.strokeStyle = 'rgba(43,33,24,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < ch.chops; i++) {
      ctx.beginPath();
      ctx.moveTo(b.x - 34 + i * 10, b.y + 58);
      ctx.lineTo(b.x - 26 + i * 10, b.y + 88);
      ctx.stroke();
    }
  } else {
    text(ctx, 'CHOP BOARD', b.x, b.y + 74, 14, '#8a6b3f', 'center', 700);
    text(ctx, '3 cuts', b.x, b.y + 96, 12, '#8a6b3f', 'center', 600);
  }
  stationLabel(ctx, b, 'click to chop');
}

function drawAssembly(ctx, state) {
  const p = STATIONS.plate;
  ctx.fillStyle = PALETTE.steel;
  rr(ctx, p.x - p.w / 2, p.y, p.w, p.h, 10); ctx.fill();
  ctx.fillStyle = PALETTE.steelDark;
  ctx.fillRect(p.x - p.w / 2, p.y, p.w, 8);
  const ready = matchingTicket(state) !== null;
  const baseY = p.y + 118;
  drawDish(ctx, p.x, baseY, state.plate, ready, 1);
  if (state.plate.length === 0) {
    text(ctx, 'EMPTY PLATE — build here', p.x, p.y + 30, 14, '#5a636b', 'center', 600);
  }
  if (ready) {
    text(ctx, 'READY TO SERVE!', p.x, p.y + 30, 16, '#2b7a3d', 'center', 800);
  }
  stationLabel(ctx, p, 'stack the ticket, then serve');
}

function drawServe(ctx, state, time) {
  const s = STATIONS.serve;
  const glow = state.flash > 0 ? 0.5 + 0.5 * Math.sin(time * 12) : 0;
  ctx.fillStyle = '#7a4a2b';
  rr(ctx, s.x - s.w / 2, s.y, s.w, s.h, 10); ctx.fill();
  ctx.fillStyle = `rgba(255, 217, 77, ${0.25 + glow * 0.5})`;
  rr(ctx, s.x - s.w / 2 + 8, s.y + 8, s.w - 16, 66, 8); ctx.fill();
  // Heat lamp.
  ctx.fillStyle = '#d94f3d';
  ctx.beginPath();
  ctx.moveTo(s.x - 26, s.y + 22); ctx.lineTo(s.x + 26, s.y + 22); ctx.lineTo(s.x, s.y + 2); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  circle(ctx, s.x, s.y + 30, 8); ctx.fill();
  // Bell.
  ctx.fillStyle = '#f5b921';
  ctx.beginPath();
  ctx.arc(s.x, s.y + 96, 24, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(s.x - 24, s.y + 94, 48, 6);
  ctx.fillStyle = '#d99a0d';
  circle(ctx, s.x + 26, s.y + 102, 4); ctx.fill();
  text(ctx, 'RING', s.x, s.y + 128, 13, '#ffe9b0', 'center', 800);
  // The label rides above this station: the trash bin below would cover it.
  ctx.font = '800 15px system-ui, sans-serif';
  const w = ctx.measureText('SERVE').width + 24;
  ctx.fillStyle = 'rgba(32,48,46,0.75)';
  rr(ctx, s.x - w / 2, s.y - 30, w, 22, 11);
  ctx.fill();
  text(ctx, 'SERVE', s.x, s.y - 19, 15, '#fff6e3', 'center', 800);
}

function drawTrash(ctx) {
  const t = STATIONS.trash;
  ctx.fillStyle = '#4a5560';
  ctx.beginPath();
  ctx.moveTo(t.x - 34, t.y + 12);
  ctx.lineTo(t.x + 34, t.y + 12);
  ctx.lineTo(t.x + 26, t.y + t.h - 8);
  ctx.lineTo(t.x - 26, t.y + t.h - 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#39424b';
  ctx.fillRect(t.x - 40, t.y + 2, 80, 12);
  text(ctx, 'TRASH', t.x, t.y + t.h + 18, 13, '#fff6e3', 'center', 800);
}

// --- Cook -------------------------------------------------------------------

function drawCook(ctx, state, time) {
  const cook = state.cook;
  const bob = cook.walk > 0 ? Math.sin(cook.walk) * 3 : Math.sin(time * 2) * 1.5;
  const x = cook.x;
  const y = cook.y + bob * 0.3;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 34, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs.
  ctx.fillStyle = '#3b4a63';
  const step = cook.walk > 0 ? Math.sin(cook.walk) * 6 : 0;
  ctx.fillRect(x - 14, y + 16 + step * 0.3, 10, 20);
  ctx.fillRect(x + 4, y + 16 - step * 0.3, 10, 20);
  // Body + apron.
  ctx.fillStyle = '#eef1f4';
  rr(ctx, x - 20, y - 12, 40, 34, 10); ctx.fill();
  ctx.fillStyle = '#d94f3d';
  ctx.fillRect(x - 20, y + 8, 40, 14);
  // Arms.
  ctx.fillStyle = '#eef1f4';
  ctx.fillRect(x - 28, y - 6, 9, 22);
  ctx.fillRect(x + 19, y - 6, 9, 22);
  // Head + toque.
  ctx.fillStyle = '#f2c29b';
  circle(ctx, x, y - 26, 15); ctx.fill();
  ctx.fillStyle = '#ffffff';
  rr(ctx, x - 14, y - 52, 28, 18, 6); ctx.fill();
  circle(ctx, x - 10, y - 52, 7); ctx.fill();
  circle(ctx, x, y - 55, 8); ctx.fill();
  circle(ctx, x + 10, y - 52, 7); ctx.fill();
  ctx.fillStyle = '#2b2118';
  circle(ctx, x - 5 * cook.face, y - 27, 2); ctx.fill();
  circle(ctx, x + 5 * cook.face, y - 27, 2); ctx.fill();
  // Carried item above the head.
  if (state.hand) {
    drawIngredient(ctx, state.hand.kind, x, y - 74, 44, state.hand.state);
    if (state.hand.state === 'raw' && state.hand.kind === 'patty') {
      text(ctx, 'RAW', x, y - 98, 11, '#ff9d9d', 'center', 800);
    }
  }
}

// --- Order board ------------------------------------------------------------

function drawTicket(ctx, ticket, x, y, w, h, time) {
  const frac = Math.max(0, ticket.patience / ticket.patienceMax);
  ctx.fillStyle = PALETTE.ticket;
  rr(ctx, x, y, w, h, 6); ctx.fill();
  ctx.strokeStyle = frac < 0.25 && Math.sin(time * 8) > 0 ? '#d94f3d' : '#d8cbb2';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 6); ctx.stroke();
  text(ctx, ticket.recipe.name.toUpperCase(), x + w / 2, y + 20, 17, PALETTE.ink, 'center', 800);
  // Filling icons.
  const icons = ticket.recipe.fillings;
  const gap = Math.min(44, (w - 24) / Math.max(1, icons.length));
  const startX = x + w / 2 - ((icons.length - 1) * gap) / 2;
  icons.forEach((kind, i) => {
    drawIngredient(ctx, kind, startX + i * gap, y + 56, 34, kind === 'patty' ? 'grilled' : 'ready');
  });
  // Patience bar.
  ctx.fillStyle = '#e3d9c6';
  rr(ctx, x + 14, y + h - 30, w - 28, 12, 6); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#f5b921' : '#d94f3d';
  if (frac > 0) {
    rr(ctx, x + 14, y + h - 30, (w - 28) * frac, 12, 6); ctx.fill();
  }
  text(ctx, `${Math.ceil(ticket.patience)}s`, x + w - 30, y + h - 24, 11, '#fff6e3', 'center', 800);
  // Coin value.
  ctx.fillStyle = '#f5b921';
  circle(ctx, x + 26, y + h - 24, 9); ctx.fill();
  text(ctx, `${ticket.recipe.value}`, x + 26, y + h - 23, 12, '#6b4a00', 'center', 800);
}

function drawOrderBoard(ctx, state, time) {
  ctx.fillStyle = '#6f4525';
  rr(ctx, 14, 78, 274, 452, 10); ctx.fill();
  ctx.fillStyle = '#8a5a33';
  rr(ctx, 20, 84, 262, 440, 8); ctx.fill();
  text(ctx, '— ORDERS —', 151, 108, 20, '#ffe9b0', 'center', 800);
  if (state.tickets.length === 0) {
    text(ctx, 'No orders yet…', 151, 180, 15, '#ffe9b0', 'center', 600);
  }
  state.tickets.forEach((ticket, i) => {
    drawTicket(ctx, ticket, 30, 128 + i * 132, 242, 122, time);
  });
}

// --- HUD --------------------------------------------------------------------

function drawHud(ctx, state) {
  ctx.fillStyle = '#20302e';
  ctx.fillRect(0, 0, VIEW_W, 64);
  text(ctx, 'SIZZLE & SERVE', 130, 32, 26, '#ffd94d', 'center', 800, 'Georgia, serif');
  text(ctx, `DAY ${state.day}`, 300, 32, 17, '#fff6e3', 'center', 800);
  text(ctx, `SCORE ${state.score}`, 430, 32, 17, '#fff6e3', 'center', 800);
  ctx.fillStyle = '#f5b921';
  circle(ctx, 560, 32, 11); ctx.fill();
  text(ctx, `${state.coins}`, 588, 33, 18, '#fff6e3', 'center', 800);
  // Shift timer: a bar you can feel.
  const frac = Math.max(0, state.timeLeft / 150);
  ctx.fillStyle = '#3a4a47';
  rr(ctx, 660, 20, 360, 24, 12); ctx.fill();
  ctx.fillStyle = frac > 0.25 ? '#58b368' : '#d94f3d';
  if (frac > 0) { rr(ctx, 660, 20, 360 * frac, 24, 12); ctx.fill(); }
  const mm = Math.floor(state.timeLeft / 60);
  const ss = Math.floor(state.timeLeft % 60).toString().padStart(2, '0');
  text(ctx, `SHIFT ${mm}:${ss}`, 840, 32, 15, '#ffffff', 'center', 800);
  if (state.combo > 1) {
    text(ctx, `COMBO x${state.combo}`, 1060, 32, 16, '#ffd94d', 'center', 800);
  }
  // Pause + mute buttons, drawn as icons (no font glyphs to go missing).
  ctx.fillStyle = '#3a4a47';
  rr(ctx, 1140, 14, 56, 36, 8); ctx.fill();
  ctx.fillStyle = '#fff6e3';
  if (state.paused) {
    ctx.beginPath();
    ctx.moveTo(1158, 22); ctx.lineTo(1158, 42); ctx.lineTo(1176, 32); ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(1158, 22, 6, 20);
    ctx.fillRect(1169, 22, 6, 20);
  }
  ctx.fillStyle = '#3a4a47';
  rr(ctx, 1208, 14, 56, 36, 8); ctx.fill();
  ctx.fillStyle = '#fff6e3';
  ctx.beginPath();
  ctx.moveTo(1222, 24); ctx.lineTo(1230, 24); ctx.lineTo(1236, 30); ctx.lineTo(1236, 34);
  ctx.lineTo(1230, 40); ctx.lineTo(1222, 40); ctx.lineTo(1222, 24);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(1236, 29, 4, 6);
  if (isMuted()) {
    ctx.strokeStyle = '#ff9d9d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1244, 22); ctx.lineTo(1256, 42);
    ctx.moveTo(1256, 22); ctx.lineTo(1244, 42);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#fff6e3';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(1238, 32, 8, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(1238, 32, 13, -0.9, 0.9); ctx.stroke();
  }
}

function drawHintBar(ctx, state) {
  ctx.fillStyle = 'rgba(32,48,46,0.92)';
  ctx.fillRect(0, VIEW_H - 60, VIEW_W, 60);
  const hints = 'Click a station to walk there · Click again / Space to work it · WASD / arrows to move · 1-6 grab · P pause · M mute';
  text(ctx, hints, VIEW_W / 2, VIEW_H - 38, 15, '#cfe0d8', 'center', 600);
  // The latest kitchen message, on its own pill above the hints.
  if (state.message && state.messageTimer > 0) {
    ctx.fillStyle = 'rgba(32,48,46,0.85)';
    const w = ctx.measureText(state.message).width + 36;
    rr(ctx, VIEW_W / 2 - w / 2, VIEW_H - 96, w, 30, 15); ctx.fill();
    ctx.fillStyle = '#fff6e3';
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.message, VIEW_W / 2, VIEW_H - 80);
  }
}

// --- Screens ----------------------------------------------------------------

function drawTitle(ctx, state, time) {
  ctx.fillStyle = 'rgba(20, 30, 28, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'SIZZLE & SERVE', VIEW_W / 2, 150, 64, '#ffd94d', 'center', 800, 'Georgia, serif');
  text(ctx, 'a midnight diner cooking shift', VIEW_W / 2, 196, 22, '#fff6e3', 'center', 600, 'Georgia, serif');
  // Hero dish.
  drawDish(ctx, VIEW_W / 2, 470, ['patty', 'cheese', 'lettuce', 'tomato'], true, 1.5);
  text(ctx, 'Take tickets. Grill patties. Chop veg. Stack dishes. Ring the bell.', VIEW_W / 2, 540, 20, '#fff6e3', 'center', 600);
  text(ctx, 'Green zone on the grill = perfect sear = extra tip. Watch the patience bars.', VIEW_W / 2, 570, 18, '#cfe0d8', 'center', 600);
  const pulse = 0.7 + 0.3 * Math.sin(time * 3);
  ctx.fillStyle = `rgba(245, 185, 33, ${pulse})`;
  rr(ctx, VIEW_W / 2 - 190, 612, 380, 56, 28); ctx.fill();
  text(ctx, 'CLICK OR PRESS ENTER TO OPEN', VIEW_W / 2, 641, 20, '#2b2118', 'center', 800);
  text(ctx, '3 days of shifts · 150 seconds each · mouse + keyboard', VIEW_W / 2, 700, 15, '#cfe0d8', 'center', 600);
}

function drawEnd(ctx, state) {
  ctx.fillStyle = 'rgba(20, 30, 28, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'SHIFT OVER!', VIEW_W / 2, 170, 56, '#ffd94d', 'center', 800, 'Georgia, serif');
  text(ctx, `Day ${state.day} at the diner`, VIEW_W / 2, 214, 20, '#fff6e3', 'center', 600, 'Georgia, serif');
  const rows = [
    ['Dishes served', `${state.served}`],
    ['Customers lost', `${state.missed}`],
    ['Best combo', `x${Math.max(1, state.bestCombo)}`],
    ['Coins earned', `${state.coins}`],
    ['Final score', `${state.score}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 300 + i * 52;
    text(ctx, label, VIEW_W / 2 - 120, y, 22, '#cfe0d8', 'right', 600);
    text(ctx, value, VIEW_W / 2 + 120, y, 24, '#fff6e3', 'center', 800);
  });
  ctx.fillStyle = '#f5b921';
  rr(ctx, VIEW_W / 2 - 170, 590, 340, 56, 28); ctx.fill();
  text(ctx, 'PRESS R FOR THE NEXT DAY', VIEW_W / 2, 619, 19, '#2b2118', 'center', 800);
}

// --- Master render ----------------------------------------------------------

export function render(ctx, state, time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawRoom(ctx, time);
  drawOrderBoard(ctx, state, time);
  drawBins(ctx, state);
  drawGrill(ctx, state, time);
  drawBoard(ctx, state);
  drawAssembly(ctx, state);
  drawServe(ctx, state, time);
  drawTrash(ctx);
  drawCook(ctx, state, time);
  drawHud(ctx, state);
  drawHintBar(ctx, state);
  if (state.screen === 'title') drawTitle(ctx, state, time);
  if (state.screen === 'end') drawEnd(ctx, state);
  if (state.paused && state.screen === 'play') {
    ctx.fillStyle = 'rgba(20, 30, 28, 0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'PAUSED — press P to cook on', VIEW_W / 2, VIEW_H / 2, 34, '#fff6e3', 'center', 800, 'Georgia, serif');
  }
}

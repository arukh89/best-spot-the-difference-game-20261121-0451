// Twin Worlds — three procedural scenes.
// Each scene draws the FULL picture for variant 0 (original) or 1 (changed).
// The ONLY visual differences between variants are the 7 listed in `diffs`.
// Scene-local coordinates: 0..560 x 0..460. Deterministic: no random, no Date.

const CREAM = '#f6ecd9';
const INK   = '#3a2e2a';
const WOOD  = '#b98a5e';
const CLAY  = '#c96f5a';

/* ---------- tiny drawing helpers ---------- */

function E(ctx, x, y, rx, ry, c, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = c; ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function C(ctx, x, y, r, c) { E(ctx, x, y, r, r, c); }
function RR(ctx, x, y, w, h, r, c) {
  ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function LN(ctx, x1, y1, x2, y2, c, w = 2) {
  ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function QLN(ctx, x1, y1, cx, cy, x2, y2, c, w = 2) {
  ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
}
function pot(ctx, x, y, w, h, c) { // trapezoid pot, base at y
  ctx.fillStyle = c; ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x + w / 2, y - h);
  ctx.lineTo(x + w / 2 - 4, y); ctx.lineTo(x - w / 2 + 4, y);
  ctx.closePath(); ctx.fill();
  RR(ctx, x - w / 2 - 2, y - h - 5, w + 4, 6, 2, c);
}
function flower(ctx, x, y, r, c) { // 5-petal bloom
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5 - Math.PI / 2;
    E(ctx, x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75,
      r * 0.62, r * 0.42, c, a);
  }
  C(ctx, x, y, r * 0.34, CREAM);
}
function star5(ctx, x, y, r, c) {
  ctx.fillStyle = c; ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = i * Math.PI / 5 - Math.PI / 2;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.fill();
}
function qPoint(t, ax, ay, cx, cy, bx, by) {
  const u = 1 - t;
  return [u * u * ax + 2 * u * t * cx + t * t * bx,
          u * u * ay + 2 * u * t * cy + t * t * by];
}

/* =========================================================
   SCENE 1 — Orchid Greenhouse
   ========================================================= */

const P1 = { sky: '#cde8d8', ground: '#e8c9a8', accent1: '#e8739e', accent2: '#7fb069', accent3: '#f4a259' };

function drawGreenhouse(ctx, ox, oy, w, h, v, t) {
  ctx.save(); ctx.translate(ox, oy);
  const sw = Math.sin(t * 0.9) * 2; // gentle sway, identical in both variants

  // glasshouse light + roof beams
  ctx.fillStyle = P1.sky; ctx.fillRect(0, 0, 560, 460);
  for (let i = 0; i < 5; i++) LN(ctx, i * 140 - 30, 0, i * 140 + 55, 150, '#a9cdb8', 4);
  LN(ctx, 0, 148, 560, 148, '#a9cdb8', 5);

  // back wall + floor
  ctx.fillStyle = '#f3e6cf'; ctx.fillRect(0, 150, 560, 170);
  ctx.fillStyle = P1.ground; ctx.fillRect(0, 320, 560, 140);
  ctx.globalAlpha = 0.12;
  for (let x = 40; x < 560; x += 80) LN(ctx, x, 320, x - 24, 460, INK, 2);
  LN(ctx, 0, 392, 560, 392, INK, 2);
  ctx.globalAlpha = 1;

  // window — diff 5: sun (v0) vs cloud (v1)
  RR(ctx, 45, 40, 130, 108, 8, '#e6f4ec');
  if (v === 0) {
    C(ctx, 110, 92, 18, '#f4c95d');
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      LN(ctx, 110 + Math.cos(a) * 24, 92 + Math.sin(a) * 24,
         110 + Math.cos(a) * 32, 92 + Math.sin(a) * 32, '#f4c95d', 3);
    }
  } else {
    E(ctx, 98, 96, 18, 12, CREAM); E(ctx, 120, 90, 15, 11, CREAM);
    E(ctx, 110, 101, 24, 10, CREAM);
  }
  ctx.strokeStyle = CREAM; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.roundRect(45, 40, 130, 108, 8); ctx.stroke();
  LN(ctx, 110, 42, 110, 146, CREAM, 4); LN(ctx, 47, 94, 173, 94, CREAM, 4);

  // shelf unit (right)
  RR(ctx, 330, 160, 10, 162, 3, WOOD); RR(ctx, 538, 160, 10, 162, 3, WOOD);
  RR(ctx, 326, 208, 226, 9, 3, WOOD); RR(ctx, 326, 298, 226, 9, 3, WOOD);

  // books on top board — diff 6: middle spine colour
  const spines = [P1.accent3, CLAY, v === 0 ? P1.accent2 : P1.accent3, P1.accent1, '#8a6f52'];
  let bx = 340;
  for (let i = 0; i < 5; i++) {
    const bw = i % 2 ? 14 : 12;
    RR(ctx, bx, 174 + (i % 2) * 3, bw, 34 - (i % 2) * 3, 2, spines[i]);
    bx += bw + 2;
  }

  // pots on lower board — diff 4: 5 pots (v0) vs 6 (v1)
  const potXs = [348, 384, 420, 456, 492];
  if (v === 1) potXs.push(528);
  for (const x of potXs) {
    pot(ctx, x, 298, 26, 24, CLAY);
    E(ctx, x - 4, 268, 7, 4, P1.accent2, -0.5);
    E(ctx, x + 4, 268, 7, 4, P1.accent2, 0.5);
  }

  // orchid on the floor — diff 1: top bloom colour
  pot(ctx, 245, 404, 44, 32, WOOD);
  E(ctx, 228, 372, 17, 7, P1.accent2, -0.5);
  E(ctx, 262, 372, 17, 7, P1.accent2, 0.5);
  QLN(ctx, 245, 372, 238, 320, 252, 288, '#5f8f4e', 3);
  QLN(ctx, 248, 340, 260, 320, 268, 306, '#5f8f4e', 2);
  flower(ctx, 232, 303, 9, P1.accent1);
  flower(ctx, 268, 305, 9, P1.accent1);
  flower(ctx, 252, 284, 10, v === 0 ? P1.accent1 : P1.accent3);

  // butterfly on a leaf — diff 2: which wing is raised
  E(ctx, 312, 360, 16, 7, P1.accent2, -0.2);
  const wingC = P1.accent3;
  if (v === 0) { // left wing up
    E(ctx, 300, 342, 8, 12, wingC, -0.5);
    E(ctx, 320, 352, 8, 11, wingC, 0.3);
  } else {       // right wing up
    E(ctx, 300, 352, 8, 11, wingC, -0.3);
    E(ctx, 320, 342, 8, 12, wingC, 0.5);
  }
  E(ctx, 310, 348, 3, 9, INK);
  LN(ctx, 309, 340, 305, 333, INK, 1.5); LN(ctx, 311, 340, 315, 333, INK, 1.5);

  // watering can — diff 3: spout direction
  RR(ctx, 468, 402, 50, 40, 8, '#7d9b76');
  E(ctx, 493, 402, 25, 6, '#8faf86');
  ctx.strokeStyle = '#7d9b76'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(493, 402, 16, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  if (v === 0) { LN(ctx, 468, 416, 448, 398, '#7d9b76', 7); C(ctx, 448, 398, 6, '#8faf86'); }
  else         { LN(ctx, 518, 416, 538, 398, '#7d9b76', 7); C(ctx, 538, 398, 6, '#8faf86'); }

  // hanging plant — diff 7: snail on a leaf (v0 only)
  LN(ctx, 470, 0, 470 + sw * 0.3, 54, INK, 2);
  pot(ctx, 470 + sw * 0.3, 80, 34, 24, CLAY);
  for (let k = 0; k < 3; k++) {
    const vx = 458 + k * 10 + sw;
    QLN(ctx, 462 + k * 8, 80, vx - 6, 120, vx, 148 + k * 8, '#5f8f4e', 2);
    E(ctx, vx - 5, 112 + k * 6, 7, 4, P1.accent2, -0.6);
    E(ctx, vx + 4, 132 + k * 6, 7, 4, P1.accent2, 0.6);
  }
  E(ctx, 472 + sw, 160, 15, 7, P1.accent2, 0.15);
  if (v === 0) {
    E(ctx, 478 + sw, 158, 7, 3, '#d9a066');
    C(ctx, 470 + sw, 153, 6, CLAY);
    ctx.strokeStyle = '#8f4a3a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(470 + sw, 153, 3.2, 0, Math.PI * 1.6); ctx.stroke();
    LN(ctx, 483 + sw, 156, 486 + sw, 151, '#d9a066', 1.5);
  }
  ctx.restore();
}

/* =========================================================
   SCENE 2 — Old Station at Dusk
   ========================================================= */

const P2 = { sky: '#5b4a6b', ground: '#b8a08e', accent1: '#f2b04c', accent2: '#c96f5a', accent3: '#7d9b76' };

function drawStation(ctx, ox, oy, w, h, v, t) {
  ctx.save(); ctx.translate(ox, oy);

  // dusk sky + far skyline
  ctx.fillStyle = P2.sky; ctx.fillRect(0, 0, 560, 460);
  ctx.fillStyle = '#7a6382'; ctx.fillRect(0, 150, 560, 52);
  ctx.fillStyle = '#4a3d59';
  const blocks = [[0, 168, 70, 34], [80, 158, 54, 44], [150, 172, 90, 30],
                  [330, 162, 60, 40], [410, 174, 70, 28], [500, 160, 60, 42]];
  for (const [x, y, bw, bh] of blocks) ctx.fillRect(x, y, bw, bh);

  // station wall + platform
  ctx.fillStyle = '#7a6880'; ctx.fillRect(0, 202, 560, 128);
  LN(ctx, 0, 202, 560, 202, '#8d7a92', 4);
  ctx.fillStyle = P2.ground; ctx.fillRect(0, 330, 560, 130);
  ctx.fillStyle = P2.accent1; ctx.fillRect(0, 336, 560, 7);
  ctx.globalAlpha = 0.12;
  for (let x = 30; x < 560; x += 76) LN(ctx, x, 348, x - 18, 460, INK, 2);
  ctx.globalAlpha = 1;

  // telegraph wire — diff 7: bird (v0 only)
  QLN(ctx, 0, 55, 280, 80, 560, 50, '#3d3348', 2.5);
  if (v === 0) {
    E(ctx, 403, 56, 8, 6, '#3d3348');
    C(ctx, 410, 51, 4, '#3d3348');
    LN(ctx, 414, 51, 418, 52, '#3d3348', 2);
    LN(ctx, 396, 55, 389, 50, '#3d3348', 2.5);
    LN(ctx, 402, 62, 402, 65, '#3d3348', 1.5);
    LN(ctx, 406, 62, 406, 65, '#3d3348', 1.5);
  }

  // posters — diff 4: letter on the first poster
  RR(ctx, 60, 215, 70, 75, 4, CREAM);
  ctx.fillStyle = v === 0 ? P2.accent2 : '#5b8bb0';
  ctx.font = 'bold 42px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(v === 0 ? 'A' : 'B', 95, 246);
  ctx.fillStyle = INK; ctx.globalAlpha = 0.5;
  ctx.fillRect(72, 272, 46, 3); ctx.fillRect(78, 279, 34, 3);
  ctx.globalAlpha = 1;
  RR(ctx, 150, 220, 65, 65, 4, P2.accent3);
  ctx.fillStyle = CREAM; ctx.beginPath();
  ctx.moveTo(160, 272); ctx.lineTo(182, 240); ctx.lineTo(204, 272);
  ctx.closePath(); ctx.fill();
  C(ctx, 196, 232, 6, P2.accent1);

  // station clock — diff 1: hand time (6:00 vs 9:00)
  RR(ctx, 296, 158, 8, 172, 3, '#3d3348');
  C(ctx, 300, 132, 32, '#3d3348');
  C(ctx, 300, 132, 27, CREAM);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    LN(ctx, 300 + Math.cos(a) * 22, 132 + Math.sin(a) * 22,
       300 + Math.cos(a) * 25, 132 + Math.sin(a) * 25, INK, 2);
  }
  LN(ctx, 300, 132, 300, 111, INK, 3);                    // minute hand: up
  if (v === 0) LN(ctx, 300, 132, 300, 150, INK, 4);      // hour: down (6:00)
  else         LN(ctx, 300, 132, 282, 132, INK, 4);      // hour: left (9:00)
  C(ctx, 300, 132, 3, P2.accent2);

  // platform lamp — diff 5: lit (v0) vs dark (v1)
  RR(ctx, 476, 128, 8, 202, 3, '#3d3348');
  if (v === 0) {
    ctx.globalAlpha = 0.14; C(ctx, 480, 116, 46, P2.accent1);
    ctx.globalAlpha = 0.16; C(ctx, 480, 116, 32, P2.accent1);
    ctx.globalAlpha = 0.20; C(ctx, 480, 116, 20, P2.accent1);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#3d3348'; ctx.beginPath();
  ctx.moveTo(462, 108); ctx.lineTo(498, 108); ctx.lineTo(490, 94); ctx.lineTo(470, 94);
  ctx.closePath(); ctx.fill();
  C(ctx, 480, 116, 8, v === 0 ? '#ffe9a8' : '#6b6270');

  // bench — diff 6: 4 back slats (v0) vs 3 (v1)
  RR(ctx, 128, 330, 9, 58, 3, WOOD); RR(ctx, 263, 330, 9, 58, 3, WOOD);
  const slatYs = v === 0 ? [334, 344, 354, 364] : [336, 349, 362];
  for (const y of slatYs) RR(ctx, 136, y, 128, 6, 3, WOOD);
  RR(ctx, 120, 380, 160, 10, 4, '#a3774e');
  RR(ctx, 132, 390, 8, 40, 2, '#8a6240'); RR(ctx, 260, 390, 8, 40, 2, '#8a6240');

  // suitcases — diff 3: sticker on the top case (v0 only)
  RR(ctx, 350, 400, 85, 45, 6, P2.accent2);
  LN(ctx, 350, 415, 435, 415, '#a3543f', 3);
  RR(ctx, 360, 368, 65, 32, 5, P2.accent3);
  ctx.strokeStyle = '#5f7d5a'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(392, 368, 9, Math.PI, 0); ctx.stroke();
  if (v === 0) {
    C(ctx, 392, 384, 9, CREAM);
    star5(ctx, 392, 384, 6, P2.accent1);
  }

  // cat — diff 2: tail up (v0) vs down (v1)
  const fur = '#3a3140';
  if (v === 0) QLN(ctx, 519, 432, 536, 424, 532, 398, fur, 7);
  else         QLN(ctx, 519, 436, 532, 444, 538, 442, fur, 7);
  E(ctx, 505, 421, 16, 21, fur);
  C(ctx, 505, 392, 11, fur);
  ctx.fillStyle = fur;
  ctx.beginPath(); ctx.moveTo(497, 385); ctx.lineTo(494, 374); ctx.lineTo(502, 381); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(513, 385); ctx.lineTo(516, 374); ctx.lineTo(508, 381); ctx.closePath(); ctx.fill();
  C(ctx, 501, 391, 1.8, P2.accent1); C(ctx, 509, 391, 1.8, P2.accent1);
  LN(ctx, 494, 395, 486, 393, CREAM, 1); LN(ctx, 494, 398, 486, 399, CREAM, 1);
  LN(ctx, 516, 395, 524, 393, CREAM, 1); LN(ctx, 516, 398, 524, 399, CREAM, 1);

  ctx.restore();
}

/* =========================================================
   SCENE 3 — Rooftop Observatory
   ========================================================= */

const P3 = { sky: '#232a4d', ground: '#4a3f5c', accent1: '#f2c14e', accent2: '#e07a5f', accent3: '#81b29a' };

const STARS = [[60, 40], [150, 80], [210, 130], [90, 170], [330, 110], [420, 40],
               [520, 150], [500, 60], [40, 240], [250, 180], [360, 230], [120, 260],
               [540, 240], [300, 30]];
const BULB_T = [0.08, 0.2, 0.32, 0.44, 0.56, 0.68, 0.8, 0.92];

function drawObservatory(ctx, ox, oy, w, h, v, t) {
  ctx.save(); ctx.translate(ox, oy);

  // night sky
  ctx.fillStyle = P3.sky; ctx.fillRect(0, 0, 560, 460);
  ctx.fillStyle = '#2c3560'; ctx.fillRect(0, 250, 560, 90);

  // stars — diff 3: star at (150,80) missing in v1
  for (let i = 0; i < STARS.length; i++) {
    if (v === 1 && i === 1) continue;
    const [sx, sy] = STARS[i];
    ctx.globalAlpha = 0.55 + 0.4 * Math.sin(t * 2 + i * 1.7);
    if (i % 3 === 0) star5(ctx, sx, sy, 5, CREAM);
    else C(ctx, sx, sy, i % 2 ? 2 : 2.8, CREAM);
  }
  ctx.globalAlpha = 1;

  // comet — diff 7: present in v0 only
  if (v === 0) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = CREAM; ctx.beginPath();
    ctx.moveTo(300, 48); ctx.lineTo(346, 30); ctx.lineTo(302, 58);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    C(ctx, 299, 53, 5, CREAM);
    C(ctx, 299, 53, 2.5, '#ffffff');
  }

  // moon — diff 1: 3 craters (v0) vs 2 (v1)
  C(ctx, 460, 90, 38, '#f4e3b2');
  ctx.globalAlpha = 0.25; C(ctx, 452, 84, 30, '#fff6dd'); ctx.globalAlpha = 1;
  const craters = [[450, 80, 5], [472, 98, 4], [452, 104, 3]];
  for (let i = 0; i < craters.length; i++) {
    if (v === 1 && i === 1) continue;
    const [cx, cy, cr] = craters[i];
    C(ctx, cx, cy, cr, '#d9c48d');
  }

  // string lights — diff 6: bulb index 5 out in v1
  QLN(ctx, 20, 140, 280, 215, 540, 140, '#1c1f33', 2.5);
  for (let i = 0; i < BULB_T.length; i++) {
    const [bx, by] = qPoint(BULB_T[i], 20, 140, 280, 215, 540, 140);
    LN(ctx, bx, by, bx, by + 8, '#1c1f33', 2);
    const out = v === 1 && i === 5;
    if (!out) {
      ctx.globalAlpha = 0.22 + 0.06 * Math.sin(t * 3 + i);
      C(ctx, bx, by + 14, 12, P3.accent1);
      ctx.globalAlpha = 1;
    }
    C(ctx, bx, by + 14, 6, out ? '#565a70' : P3.accent1);
    if (!out) C(ctx, bx - 1.5, by + 12.5, 1.8, '#fff2c8');
  }

  // rooftop railing + floor
  LN(ctx, 0, 322, 560, 322, '#332c44', 5);
  for (let x = 20; x < 560; x += 40) LN(ctx, x, 322, x, 340, '#332c44', 3);
  ctx.fillStyle = P3.ground; ctx.fillRect(0, 340, 560, 120);
  ctx.globalAlpha = 0.15;
  LN(ctx, 0, 384, 560, 384, CREAM, 1.5); LN(ctx, 0, 424, 560, 424, CREAM, 1.5);
  ctx.globalAlpha = 1;

  // telescope — diff 2: tube angle
  LN(ctx, 220, 300, 185, 432, '#2b2536', 7);
  LN(ctx, 220, 300, 255, 432, '#2b2536', 7);
  LN(ctx, 220, 300, 222, 436, '#2b2536', 7);
  ctx.save();
  ctx.translate(220, 300);
  ctx.rotate(v === 0 ? -0.9 : -0.45);
  RR(ctx, -14, -9, 110, 18, 8, P3.accent3);
  RR(ctx, 78, -10, 18, 20, 4, '#5f8f7a');
  RR(ctx, 8, -10, 8, 20, 2, CREAM);
  RR(ctx, -20, -5, 8, 10, 2, '#2b2536');
  ctx.restore();
  C(ctx, 220, 300, 7, '#2b2536');

  // table with mugs + notebook
  RR(ctx, 360, 358, 185, 12, 4, '#a8845c');
  RR(ctx, 372, 370, 9, 75, 2, '#8a6a48'); RR(ctx, 524, 370, 9, 75, 2, '#8a6a48');

  // mug 1 (same in both variants)
  RR(ctx, 388, 334, 20, 24, 3, P3.accent2);
  ctx.strokeStyle = P3.accent2; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(410, 346, 6, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  E(ctx, 398, 334, 10, 3, '#b85c44');

  // mug 2 — diff 4: colour
  const mugC = v === 0 ? P3.accent2 : P3.accent3;
  RR(ctx, 432, 334, 20, 24, 3, mugC);
  ctx.strokeStyle = mugC; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(454, 346, 6, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  E(ctx, 442, 334, 10, 3, v === 0 ? '#b85c44' : '#5f8f7a');

  // notebook — diff 5: page doodle (star vs crescent)
  RR(ctx, 488, 340, 48, 20, 3, CREAM);
  LN(ctx, 512, 340, 512, 360, '#cbbfa4', 2);
  ctx.globalAlpha = 0.4;
  LN(ctx, 492, 346, 508, 346, INK, 1); LN(ctx, 492, 351, 506, 351, INK, 1);
  ctx.globalAlpha = 1;
  if (v === 0) star5(ctx, 524, 350, 6, P3.accent1);
  else {
    C(ctx, 524, 350, 6, P3.accent3);
    C(ctx, 527, 348, 5, CREAM);
  }

  ctx.restore();
}

/* ========================================================= */

export const SCENES = [
  {
    id: 'greenhouse',
    name: 'Orchid Greenhouse',
    tagline: 'Warm glass, patient orchids, one busy snail.',
    palette: P1,
    draw: drawGreenhouse,
    diffs: [
      { id: 'g-bloom',     x: 250, y: 290, r: 36, label: 'Orchid bloom colour' },
      { id: 'g-butterfly', x: 310, y: 348, r: 32, label: 'Butterfly wing' },
      { id: 'g-spout',     x: 493, y: 414, r: 46, label: 'Watering-can spout' },
      { id: 'g-pots',      x: 490, y: 285, r: 46, label: 'Pot count' },
      { id: 'g-window',    x: 110, y: 92,  r: 42, label: 'Sun or cloud' },
      { id: 'g-book',      x: 372, y: 193, r: 30, label: 'Book spine colour' },
      { id: 'g-snail',     x: 472, y: 158, r: 30, label: 'Snail on the leaf' }
    ]
  },
  {
    id: 'station',
    name: 'Old Station at Dusk',
    tagline: 'The 6:05 is late. The cat is not worried.',
    palette: P2,
    draw: drawStation,
    diffs: [
      { id: 's-clock',    x: 300, y: 132, r: 36, label: 'Clock hands' },
      { id: 's-cat',      x: 516, y: 416, r: 42, label: 'Cat tail' },
      { id: 's-sticker',  x: 392, y: 384, r: 34, label: 'Suitcase sticker' },
      { id: 's-poster',   x: 95,  y: 252, r: 36, label: 'Poster letter' },
      { id: 's-lamp',     x: 480, y: 112, r: 40, label: 'Lamp glow' },
      { id: 's-bench',    x: 200, y: 350, r: 40, label: 'Bench slats' },
      { id: 's-bird',     x: 403, y: 58,  r: 30, label: 'Bird on the wire' }
    ]
  },
  {
    id: 'observatory',
    name: 'Rooftop Observatory',
    tagline: 'Two mugs, one telescope, all the sky.',
    palette: P3,
    draw: drawObservatory,
    diffs: [
      { id: 'o-moon',      x: 460, y: 90,  r: 44, label: 'Moon craters' },
      { id: 'o-telescope', x: 268, y: 252, r: 46, label: 'Telescope angle' },
      { id: 'o-star',      x: 150, y: 80,  r: 30, label: 'Missing star' },
      { id: 'o-mug',       x: 442, y: 346, r: 30, label: 'Mug colour' },
      { id: 'o-notebook',  x: 512, y: 350, r: 32, label: 'Notebook doodle' },
      { id: 'o-bulb',      x: 374, y: 181, r: 32, label: 'String-light bulb' },
      { id: 'o-comet',     x: 312, y: 46,  r: 34, label: 'Comet' }
    ]
  }
];

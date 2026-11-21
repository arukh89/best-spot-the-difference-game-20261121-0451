// Twin Worlds — all screen rendering: panels, HUD, markers, menu, overlays.
import { W, H, PANEL, PANEL2, TIME_PER_SCENE, SCENE_NAMES } from './config.js';
import { SCENES } from './scenes.js';

const CREAM = '#f6ecd9';
const INK   = '#3a2e2a';
const BG    = '#221a14';
const BAR   = '#2b2118';
const AMBER = '#f2a541';
const GOLD  = '#e9c46a';
const GREEN = '#7fb069';
const RED   = '#e07a5f';
const FONT  = '"Trebuchet MS", Verdana, sans-serif';

function txt(ctx, s, x, y, size, color, align = 'left', weight = '') {
  ctx.fillStyle = color;
  ctx.font = `${weight ? weight + ' ' : ''}${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

/* ---------- scene panels ---------- */

export function drawScene(ctx, scene, variant, panel, t = 0) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(panel.x, panel.y, panel.w, panel.h);
  ctx.clip();
  scene.draw(ctx, panel.x, panel.y, panel.w, panel.h, variant, t);
  ctx.restore();
}

export function drawPanels(ctx, state, t = 0) {
  const scene = SCENES[state.sceneIndex];
  drawScene(ctx, scene, 0, PANEL, t);
  drawScene(ctx, scene, 1, PANEL2, t);

  // frames — warm cream, turning red when time runs short
  const low = state.timeLeft < 30;
  const pulse = low && state.timeLeft < 15 ? 0.6 + 0.4 * Math.sin(t * 6) : 1;
  ctx.lineWidth = 3;
  ctx.strokeStyle = low ? RED : CREAM;
  ctx.globalAlpha = low ? pulse : 0.9;
  for (const p of [PANEL, PANEL2]) {
    ctx.beginPath();
    ctx.roundRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8, 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // A / B tags
  for (const [p, tag] of [[PANEL, 'A'], [PANEL2, 'B']]) {
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(p.x + 22, p.y + 22, 14, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    txt(ctx, tag, p.x + 22, p.y + 23, 16, CREAM, 'center', 'bold');
  }

  // vertical divider with the scene name
  const mx = (PANEL.x + PANEL.w + PANEL2.x) / 2;
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = CREAM; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(mx, 150); ctx.lineTo(mx, 290); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx, 430); ctx.lineTo(mx, 570); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(mx, 360);
  ctx.rotate(-Math.PI / 2);
  txt(ctx, scene.name.toUpperCase(), 0, 0, 15, GOLD, 'center', 'bold');
  ctx.restore();

  // found markers on BOTH panels at the same spot
  for (const id of state.found) {
    const d = scene.diffs.find(dd => dd.id === id);
    if (!d) continue;
    drawMarker(ctx, PANEL.x + d.x, PANEL.y + d.y, d.r, 'found', t);
    drawMarker(ctx, PANEL2.x + d.x, PANEL2.y + d.y, d.r, 'found', t);
  }

  // optional live hint (main.js may set state.hintId)
  if (state.hintId) {
    const d = scene.diffs.find(dd => dd.id === state.hintId);
    if (d) {
      drawMarker(ctx, PANEL.x + d.x, PANEL.y + d.y, d.r, 'hint', t);
      drawMarker(ctx, PANEL2.x + d.x, PANEL2.y + d.y, d.r, 'hint', t);
    }
  }

  // soft aiming ring at the cursor while playing
  if (state.screen === 'play' && state.cursor) {
    const c = state.cursor;
    const inside = (c.x >= PANEL.x && c.x <= PANEL.x + PANEL.w ||
                    c.x >= PANEL2.x && c.x <= PANEL2.x + PANEL2.w) &&
                   c.y >= PANEL.y && c.y <= PANEL.y + PANEL.h;
    if (inside) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = CREAM; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(c.x, c.y, 10, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

/* ---------- markers ---------- */

export function drawMarker(ctx, x, y, r, kind, t = 0) {
  ctx.save();
  if (kind === 'found') {
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = GREEN;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = GOLD; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = GREEN; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r - 5, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.34, y + r * 0.02);
    ctx.lineTo(x - r * 0.08, y + r * 0.28);
    ctx.lineTo(x + r * 0.38, y - r * 0.26);
    ctx.stroke();
  } else { // hint: pulsing amber ring
    const p = 0.5 + 0.5 * Math.sin(t * 5);
    ctx.globalAlpha = 0.45 + 0.5 * p;
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 3 + 2 * p;
    ctx.setLineDash([9, 7]);
    ctx.lineDashOffset = -t * 30;
    ctx.beginPath(); ctx.arc(x, y, r * (0.85 + 0.15 * p), 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.25 + 0.3 * p;
    ctx.fillStyle = AMBER;
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* ---------- HUD ---------- */

export function drawHUD(ctx, state) {
  const scene = SCENES[state.sceneIndex];

  // top bar
  ctx.fillStyle = BAR; ctx.fillRect(0, 0, W, 118);
  ctx.fillStyle = GOLD; ctx.globalAlpha = 0.5; ctx.fillRect(0, 116, W, 2); ctx.globalAlpha = 1;

  txt(ctx, 'TWIN WORLDS', 40, 38, 30, CREAM, 'left', 'bold');
  txt(ctx, 'spot the difference', 40, 64, 13, GOLD);
  txt(ctx, `${scene.name}  ·  Scene ${state.sceneIndex + 1}/3`, 40, 95, 18, CREAM);

  // timer: shrinking amber bar + seconds
  const frac = Math.max(0, state.timeLeft / TIME_PER_SCENE);
  const low = state.timeLeft < 30;
  txt(ctx, 'TIME', 380, 28, 12, CREAM);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.roundRect(380, 38, 340, 16, 8); ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = low ? RED : AMBER;
    ctx.beginPath(); ctx.roundRect(380, 38, Math.max(10, 340 * frac), 16, 8); ctx.fill();
  }
  txt(ctx, `${Math.ceil(state.timeLeft)}s`, 732, 47, 18, low ? RED : CREAM, 'left', 'bold');
  txt(ctx, 'wrong click −5s', 380, 72, 12, 'rgba(246,236,217,0.55)');

  // score
  txt(ctx, 'SCORE', 900, 28, 12, CREAM);
  txt(ctx, String(state.score), 900, 56, 28, GOLD, 'left', 'bold');

  // hints
  txt(ctx, `Hints: ${state.hintsLeft} (H)`, 1080, 40, 18, CREAM);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < state.hintsLeft ? AMBER : 'rgba(246,236,217,0.2)';
    ctx.beginPath(); ctx.arc(1088 + i * 22, 66, 6, 0, Math.PI * 2); ctx.fill();
  }
  txt(ctx, '−25 pts each', 1080, 90, 12, 'rgba(246,236,217,0.55)');

  // bottom bar: big counter + message line
  ctx.fillStyle = BAR; ctx.fillRect(0, 600, W, H - 600);
  ctx.fillStyle = GOLD; ctx.globalAlpha = 0.5; ctx.fillRect(0, 600, W, 2); ctx.globalAlpha = 1;

  const left = scene.diffs.length - state.found.length;
  const label = left === 1 ? '1 difference left' : `${left} differences left`;
  txt(ctx, label, W / 2, 648, 36, left === 0 ? GREEN : CREAM, 'center', 'bold');
  if (state.message) txt(ctx, state.message, W / 2, 692, 17, 'rgba(246,236,217,0.8)', 'center');

  // per-difference progress pips
  for (let i = 0; i < scene.diffs.length; i++) {
    ctx.fillStyle = i < state.found.length ? GREEN : 'rgba(246,236,217,0.2)';
    ctx.beginPath(); ctx.arc(W / 2 - 66 + i * 22, 670, 4, 0, Math.PI * 2); ctx.fill();
  }
}

/* ---------- menu / win / overlays ---------- */

export function drawMenu(ctx, state, t = 0) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  txt(ctx, 'TWIN WORLDS', W / 2, 100, 56, CREAM, 'center', 'bold');
  txt(ctx, 'Spot the Difference — three hand-drawn worlds, seven changes each', W / 2, 150, 19, GOLD, 'center');

  for (let i = 0; i < SCENES.length; i++) {
    const sc = SCENES[i];
    const x = 90 + i * 380, y = 210, cw = 340, ch = 330;
    const sel = state.selectedScene === i;
    ctx.fillStyle = sel ? '#3a2c1f' : '#31261c';
    ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 14); ctx.fill();
    ctx.lineWidth = sel ? 3 : 2;
    ctx.strokeStyle = sel ? GOLD : 'rgba(246,236,217,0.35)';
    ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 14); ctx.stroke();

    // live miniature of the scene
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x + 20, y + 18, 300, 160, 8); ctx.clip();
    const s = 160 / 460;
    ctx.translate(x + 20 + (300 - 560 * s) / 2, y + 18);
    ctx.scale(s, s);
    sc.draw(ctx, 0, 0, 560, 460, 0, t);
    ctx.restore();

    // key badge
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(x + cw - 26, y + 26, 15, 0, Math.PI * 2); ctx.fill();
    txt(ctx, String(i + 1), x + cw - 26, y + 27, 17, INK, 'center', 'bold');

    txt(ctx, sc.name, x + cw / 2, y + 208, 22, CREAM, 'center', 'bold');
    txt(ctx, sc.tagline, x + cw / 2, y + 236, 13, 'rgba(246,236,217,0.7)', 'center');
    txt(ctx, '7 differences · 3 hints · 180 seconds', x + cw / 2, y + 272, 13, GOLD, 'center');
    txt(ctx, `palette`, x + 24, y + 300, 11, 'rgba(246,236,217,0.45)');
    const cols = [sc.palette.sky, sc.palette.ground, sc.palette.accent1, sc.palette.accent2, sc.palette.accent3];
    cols.forEach((c, k) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.roundRect(x + 76 + k * 26, y + 293, 20, 14, 4); ctx.fill();
    });
  }

  txt(ctx, 'Click a scene or press 1–3', W / 2, 590, 24, CREAM, 'center', 'bold');
  txt(ctx, 'Click a change in either panel to mark it  ·  H = hint (−25 pts)  ·  wrong click −5s  ·  R = restart',
      W / 2, 632, 15, 'rgba(246,236,217,0.7)', 'center');
  txt(ctx, 'Find all 7 before the amber bar runs out. Both panels share every find.',
      W / 2, 662, 14, 'rgba(246,236,217,0.5)', 'center');
}

export function drawWin(ctx, state, t = 0) {
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  // deterministic celebratory dots
  for (let i = 0; i < 40; i++) {
    const a = i * 2.4, rr = 120 + (i * 37) % 260;
    const x = W / 2 + Math.cos(a + t * 0.3) * rr * 1.6;
    const y = 330 + Math.sin(a + t * 0.3) * rr * 0.7;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = [GOLD, GREEN, AMBER, CREAM][i % 4];
    ctx.beginPath(); ctx.arc(x, y, 3 + (i % 3), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  txt(ctx, 'All worlds matched!', W / 2, 260, 52, GOLD, 'center', 'bold');
  txt(ctx, `Total score: ${state.score}`, W / 2, 330, 32, CREAM, 'center', 'bold');
  txt(ctx, '3 scenes · 21 differences · every one found', W / 2, 375, 17, 'rgba(246,236,217,0.7)', 'center');
  txt(ctx, 'Press R to play again', W / 2, 440, 24, CREAM, 'center');
}

function drawOverlay(ctx, title, sub, action, color) {
  ctx.fillStyle = 'rgba(20,14,10,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = BAR;
  ctx.beginPath(); ctx.roundRect(W / 2 - 330, 250, 660, 220, 16); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(W / 2 - 330, 250, 660, 220, 16); ctx.stroke();
  txt(ctx, title, W / 2, 305, 38, color, 'center', 'bold');
  txt(ctx, sub, W / 2, 360, 20, CREAM, 'center');
  txt(ctx, action, W / 2, 420, 22, GOLD, 'center', 'bold');
}

/* ---------- top-level dispatch (used by main.js) ---------- */

export function drawScreen(ctx, state, t = 0) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

  if (state.screen === 'menu') { drawMenu(ctx, state, t); return; }
  if (state.screen === 'win')  { drawWin(ctx, state, t); return; }

  drawPanels(ctx, state, t);
  drawHUD(ctx, state);

  const scene = SCENES[state.sceneIndex];
  if (state.screen === 'sceneDone') {
    drawOverlay(ctx, 'World matched!',
      `${scene.name} — all ${scene.diffs.length} differences found`,
      state.sceneIndex < SCENES.length - 1 ? 'Press Enter for the next scene' : 'Press Enter to finish',
      GREEN);
  } else if (state.screen === 'timeUp') {
    drawOverlay(ctx, 'Time slipped away…',
      `${state.found.length}/${scene.diffs.length} found in ${scene.name}`,
      'Press R to retry this scene', RED);
  }
}

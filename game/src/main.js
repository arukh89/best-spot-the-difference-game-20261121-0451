// Twin Worlds — game loop, rules and wiring. Rendering lives in render.js,
// scenes in scenes.js, sound in audio.js, input in input.js, ?shot= in shots.js.

import {
  W, H, PANEL, PANEL2,
  TIME_PER_SCENE, HINTS_PER_SCENE,
  POINTS_FIND, POINTS_HINT_COST, WRONG_PENALTY_SECONDS
} from './config.js';
import { SCENES } from './scenes.js';
import { drawScreen } from './render.js';
import { attachInput } from './input.js';
import { ensureAudio, playFound, playWrong, playWin, playTick } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let state = {
  sceneIndex: 0,
  found: [],
  timeLeft: TIME_PER_SCENE,
  score: 0,
  hintsLeft: HINTS_PER_SCENE,
  message: '',
  cursor: null,
  screen: 'menu',
  selectedScene: 0,
  hintId: null,
  shotFrozen: false
};
state = applyShot(state);

/* ---------- rule bookkeeping (not part of the rendered state) ---------- */

let streak = 0;               // consecutive finds without a wrong click
let scoreAtSceneStart = 0;    // so R / retry undoes only this scene's points
let hintUntil = 0;            // performance.now() deadline for the live hint
let lastTickSec = null;       // last whole second that ticked (<= 10 s left)
let shiftDown = false;        // Shift held → bigger cursor steps

const PRAISE = ['Nice eye!', 'Sharp!', 'Well spotted!', 'There it is!', 'Lovely find!', 'Exactly!', 'Beautiful!'];
const CARD = { y: 210, w: 340, h: 330 }; // menu scene cards, x = 90 + i*380

const scene = () => SCENES[state.sceneIndex];
const cardX = (i) => 90 + i * 380;
const inCard = (x, y, i) =>
  x >= cardX(i) && x <= cardX(i) + CARD.w && y >= CARD.y && y <= CARD.y + CARD.h;

/* ---------- screen transitions ---------- */

function startScene(i) {
  state.sceneIndex = i;
  state.selectedScene = i;
  state.found = [];
  state.timeLeft = TIME_PER_SCENE;
  state.hintsLeft = HINTS_PER_SCENE;
  state.hintId = null;
  state.screen = 'play';
  state.cursor = null;
  state.message = `${SCENES[i].name} — find all ${SCENES[i].diffs.length} changes.`;
  streak = 0;
  scoreAtSceneStart = state.score;
  hintUntil = 0;
  lastTickSec = null;
}

function restartScene() {
  state.score = scoreAtSceneStart; // undo this scene's finds, hints and bonus
  startScene(state.sceneIndex);
}

function toMenu() {
  state.screen = 'menu';
  state.selectedScene = 0;
  state.found = [];
  state.score = 0;
  state.hintId = null;
  state.cursor = null;
  state.message = '';
  streak = 0;
  scoreAtSceneStart = 0;
  lastTickSec = null;
}

function advance() {
  if (state.sceneIndex < SCENES.length - 1) {
    startScene(state.sceneIndex + 1);
  } else {
    state.screen = 'win';
    state.hintId = null;
    state.cursor = null;
    playWin();
  }
}

/* ---------- play rules ---------- */

function panelAt(x, y) {
  for (const p of [PANEL, PANEL2]) {
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return p;
  }
  return null;
}

/** A click (or Space/Enter at the cursor) inside a panel marks a difference. */
function markAt(x, y) {
  if (state.screen !== 'play') return;
  const p = panelAt(x, y);
  if (!p) return; // clicks outside the panels are ignored

  const sx = x - p.x, sy = y - p.y; // scene-local coordinates
  const sc = scene();
  const hit = sc.diffs.find(d =>
    !state.found.includes(d.id) && Math.hypot(sx - d.x, sy - d.y) <= d.r);

  if (hit) {
    state.score += POINTS_FIND + 10 * streak; // streak bonus for the run so far
    streak += 1;
    state.found.push(hit.id);
    if (state.hintId === hit.id) state.hintId = null;
    state.message = `${hit.label} — ${PRAISE[(state.found.length - 1) % PRAISE.length]}`;
    playFound();

    if (state.found.length === sc.diffs.length) {
      const bonus = Math.ceil(state.timeLeft);
      state.score += bonus;
      state.screen = 'sceneDone';
      state.message = `All ${sc.diffs.length} found! Time bonus +${bonus}.`;
      playWin();
    }
  } else {
    streak = 0;
    state.timeLeft = Math.max(0, state.timeLeft - WRONG_PENALTY_SECONDS);
    state.message = 'Not quite — 5 seconds lost.';
    playWrong();
    if (state.timeLeft <= 0) state.screen = 'timeUp';
  }
}

function useHint() {
  if (state.screen !== 'play' || state.hintsLeft <= 0) return;
  const d = scene().diffs.find(dd => !state.found.includes(dd.id));
  if (!d) return;
  state.hintsLeft -= 1;
  state.score = Math.max(0, state.score - POINTS_HINT_COST);
  state.hintId = d.id;
  hintUntil = performance.now() + 2500;
  state.message = 'Hint: look near — ' + d.label;
}

/* ---------- input handlers ---------- */

function onMove(x, y) {
  if (state.shotFrozen) return;
  state.cursor = { x, y };
  if (state.screen === 'menu') {
    for (let i = 0; i < SCENES.length; i++) {
      if (inCard(x, y, i)) { state.selectedScene = i; break; }
    }
  }
}

function onClick(x, y) {
  ensureAudio(); // first user gesture unlocks WebAudio
  if (state.shotFrozen) return;
  if (state.screen === 'menu') {
    for (let i = 0; i < SCENES.length; i++) {
      if (inCard(x, y, i)) { startScene(i); return; }
    }
    return;
  }
  markAt(x, y); // only 'play' reacts; overlays wait for their keys
}

function onKey(key) {
  ensureAudio();
  if (key === 'Shift') { shiftDown = true; return; }
  if (state.shotFrozen) return;

  switch (key) {
    case 'ArrowUp': case 'ArrowDown': case 'ArrowLeft': case 'ArrowRight': {
      if (state.screen !== 'play') return;
      if (!state.cursor) {
        state.cursor = { x: PANEL.x + PANEL.w / 2, y: PANEL.y + PANEL.h / 2 };
      }
      const step = shiftDown ? 40 : 12;
      const c = state.cursor;
      if (key === 'ArrowUp') c.y -= step;
      if (key === 'ArrowDown') c.y += step;
      if (key === 'ArrowLeft') c.x -= step;
      if (key === 'ArrowRight') c.x += step;
      c.x = Math.max(0, Math.min(W, c.x));
      c.y = Math.max(0, Math.min(H, c.y));
      return;
    }
    case ' ': case 'Enter':
      if (state.screen === 'play') {
        if (state.cursor) markAt(state.cursor.x, state.cursor.y);
      } else if (key === 'Enter' && state.screen === 'sceneDone') {
        advance();
      } else if (key === 'Enter' && state.screen === 'menu') {
        startScene(state.selectedScene);
      }
      return;
    case 'h': case 'H':
      useHint();
      return;
    case 'r': case 'R':
      if (state.screen === 'win') toMenu();
      else if (state.screen === 'play' || state.screen === 'sceneDone' || state.screen === 'timeUp') restartScene();
      return;
    case '1': case '2': case '3':
      if (state.screen === 'menu') startScene(Number(key) - 1);
      return;
  }
}

attachInput(canvas, { onMove, onClick, onKey });
window.addEventListener('keyup', (e) => { if (e.key === 'Shift') shiftDown = false; });

/* ---------- main loop ---------- */

const startTime = performance.now();
let lastFrame = startTime;

function frame(now) {
  const t = (now - startTime) / 1000;
  // Real elapsed time, capped so a backgrounded tab doesn't drain the clock.
  const dt = Math.min((now - lastFrame) / 1000, 0.25);
  lastFrame = now;

  if (state.screen === 'play') {
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.screen = 'timeUp';
      state.hintId = null;
      playWrong();
    } else if (state.timeLeft <= 10) {
      const sec = Math.ceil(state.timeLeft);
      if (sec !== lastTickSec) { lastTickSec = sec; playTick(); }
    }
    if (state.hintId && now >= hintUntil) state.hintId = null;
  }

  drawScreen(ctx, state, t);
  requestAnimationFrame(frame);
}

if (state.shotFrozen) {
  drawScreen(ctx, state, 1.2); // one deterministic frame, no timer, no loop
} else {
  requestAnimationFrame(frame);
}

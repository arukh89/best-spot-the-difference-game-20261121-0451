// Twin Worlds — deterministic screenshot modes via ?shot=<mode>.
// A shot freezes the game (state.shotFrozen): main.js renders once at t=1.2
// and runs no timer. Without ?shot= the state is returned unchanged.

import { SCENES } from './scenes.js';

export function applyShot(state) {
  const mode = new URLSearchParams(location.search).get('shot');
  if (!mode) return state;

  const frozen = { ...state, shotFrozen: true };

  switch (mode) {
    case 'cover':
      return {
        ...frozen,
        sceneIndex: 0,
        screen: 'play',
        found: SCENES[0].diffs.slice(0, 3).map(d => d.id),
        timeLeft: 137,
        score: 300,
        hintsLeft: 2,
        message: 'Nice — 3 found! Keep looking.'
      };
    case 'play':
      return {
        ...frozen,
        sceneIndex: 1,
        screen: 'play',
        found: SCENES[1].diffs.slice(0, 2).map(d => d.id),
        timeLeft: 142,
        score: 200,
        hintsLeft: 3,
        message: 'Two down — the cat knows something.'
      };
    case 'scene3':
      return {
        ...frozen,
        sceneIndex: 2,
        screen: 'play',
        found: [],
        timeLeft: 180,
        score: 0,
        hintsLeft: 3,
        message: 'A new sky. Seven changes hide here.'
      };
    case 'win':
      return { ...frozen, screen: 'win', score: 2450 };
    default:
      return state;
  }
}

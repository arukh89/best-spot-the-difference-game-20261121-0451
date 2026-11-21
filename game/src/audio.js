// Twin Worlds — synthesized sound effects, WebAudio only. No audio files.
// The AudioContext is created lazily on the first user gesture (ensureAudio),
// and every effect is a no-op when WebAudio is unavailable.

let ctx = null;

/** Create (once) and resume the shared AudioContext; null when unsupported. */
export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

/** One enveloped oscillator note, scheduled `start` seconds from now. */
function tone(freq, start, dur, type = 'sine', peak = 0.16) {
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Audio is a garnish, never a crash.
  }
}

/** Found a difference: pleasant two-note chime (E5 → B5). */
export function playFound() {
  if (!ensureAudio()) return;
  tone(659.25, 0, 0.16, 'sine', 0.16);
  tone(987.77, 0.09, 0.24, 'sine', 0.16);
}

/** Wrong click: short low buzz. */
export function playWrong() {
  if (!ensureAudio()) return;
  tone(110, 0, 0.18, 'sawtooth', 0.10);
  tone(82.41, 0.02, 0.16, 'square', 0.05);
}

/** Scene or game complete: four-note arpeggio (C5 E5 G5 C6). */
export function playWin() {
  if (!ensureAudio()) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  for (let i = 0; i < notes.length; i++) tone(notes[i], i * 0.12, 0.3, 'triangle', 0.15);
}

/** Last-ten-seconds countdown: a single soft click. */
export function playTick() {
  if (!ensureAudio()) return;
  tone(1200, 0, 0.035, 'triangle', 0.05);
}

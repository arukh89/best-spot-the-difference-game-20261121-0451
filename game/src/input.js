// Twin Worlds — mouse + keyboard wiring. Converts client coordinates to the
// canvas's own 1280x720 space (the page may scale the canvas with CSS) and
// passes raw e.key values through; main.js interprets them.

const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar']);

/**
 * Attach listeners to `canvas` (mouse) and window (keys).
 * handlers: { onMove(x, y), onClick(x, y), onKey(key) } — each optional.
 * Returns a detach function.
 */
export function attachInput(canvas, handlers) {
  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height)
    };
  };

  const onMove = (e) => {
    const p = toCanvas(e);
    if (p && handlers.onMove) handlers.onMove(p.x, p.y);
  };
  const onClick = (e) => {
    const p = toCanvas(e);
    if (p && handlers.onClick) handlers.onClick(p.x, p.y);
  };
  const onKey = (e) => {
    // Only arrows/space scroll the page; everything else keeps its default.
    if (PREVENT.has(e.key)) e.preventDefault();
    if (handlers.onKey) handlers.onKey(e.key);
  };

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  return () => {
    canvas.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
  };
}

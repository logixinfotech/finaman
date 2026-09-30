/* ------------------------------------------------------------------
   Tiny toast store — no dependency. Mount <Toaster /> once per page
   (see Toaster.jsx) and call toast.error("...") from anywhere.
   If no Toaster is mounted, errors fall back to window.alert so the
   user is never left without feedback.
------------------------------------------------------------------ */
const listeners = new Set();
let seq = 0;

function push(type, message, opts = {}) {
  if (!message) return;
  if (listeners.size === 0) {
    if (type === "error") window.alert(message);
    else console.info(`[toast:${type}]`, message);
    return;
  }
  const item = { id: ++seq, type, message, duration: opts.duration ?? (type === "error" ? 6000 : 3500) };
  listeners.forEach((fn) => fn(item));
}

export const toast = {
  success: (m, o) => push("success", m, o),
  error:   (m, o) => push("error", m, o),
  info:    (m, o) => push("info", m, o),
};

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

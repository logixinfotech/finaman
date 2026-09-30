 
export const DEFAULT_SHORTCUTS = [
  // ── Records (button-driven: Add/Update/Delete components register khud) ──
  { id: "add",       group: "Records", label: "Add new record",   keys: "alt+a" },
  { id: "modify",    group: "Records", label: "Modify record",    keys: "alt+m" },
  { id: "save",      group: "Records", label: "Save / Update",    keys: "alt+s" },
  { id: "delete",    group: "Records", label: "Delete record",    keys: "alt+d" },
  { id: "clone",     group: "Records", label: "Duplicate",        keys: "alt+c" },

  // ── Workflow ──
  { id: "draft",   group: "Workflow", label: "Save as draft", keys: "alt+r" },
  { id: "reject",  group: "Workflow", label: "Reject",        keys: "alt+j" },
  { id: "approve", group: "Workflow", label: "Approve",       keys: "alt+v" },
  { id: "post",    group: "Workflow", label: "Post",          keys: "alt+o" },
  { id: "lock",    group: "Workflow", label: "Lock",          keys: "alt+l" },

  // ── Output ──
  { id: "print",  group: "Output", label: "Preview", keys: "alt+p" },
  { id: "export", group: "Output", label: "Export",  keys: "alt+e" },
  { id: "import", group: "Output", label: "Import",  keys: "alt+i" },
  { id: "attach", group: "Output", label: "Attach",  keys: "alt+t" },

  // ── Find and refresh ──
  { id: "search",       group: "Find and refresh", label: "Search this list", keys: "alt+f" },
  { id: "refresh",      group: "Find and refresh", label: "Refresh",          keys: "alt+y" },
  { id: "global.search",  group: "Find and refresh", label: "Global search",     keys: "mod+k" },

  // ── Other ──
  { id: "reset", group: "Other", label: "Reset", keys: "alt+z" },

  // ── Legacy: koi Button component nahi hai iske liye, sirf setERPHandlers se chalta hai ──
  { id: "record.duplicate", group: "Records", label: "Duplicate record (legacy)", keys: "mod+d", action: "onDuplicateRecord" },
];

// Ye built-in hain (erpShortcuts.js mein hardcoded), sirf dikhane ke liye. Change nahi hote.
export const FIXED_SHORTCUTS = [
  { id: "fixed.esc",            label: "Cancel or close",       description: "Closes the open form or dialog", keys: "esc" },
  { id: "fixed.enter",          label: "Go to next field",      description: "From the last field, moves to Save", keys: "enter" },
  { id: "fixed.shiftenter",     label: "Go to previous field",  description: "In a text area, adds a new line", keys: "shift+enter" },
  { id: "fixed.shiftbackspace", label: "Go to previous field",  description: "Works even when the field has text", keys: "shift+backspace" },
  { id: "fixed.enterbutton",    label: "Press Save or Update",  description: "While that button has focus", keys: "enter" },
  { id: "fixed.tabswitch",      label: "Switch open tabs",      description: "Alt+1 goes to the first open tab, Alt+2 the second, and so on through Alt+9", keys: "alt+1" },
 
];

// Browser ya editing ke liye reserved: inhe assign nahi kar sakte
const RESERVED = new Set([
  "mod+w", "mod+t", "mod+n", "mod+q",
  "mod+shift+n", "mod+shift+t", "mod+shift+w",
  "mod+tab", "mod+shift+tab", "alt+f4",
  // editing: erpShortcuts.js inhe jaan-bujh kar browser ko chhodta hai
  "mod+a", "mod+c", "mod+v", "mod+x", "mod+z", "mod+y",
]);

const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt", "Meta", "AltGraph"]);

// Punctuation ke liye e.code use karte hain, kyunki Shift/Alt se e.key badal jaata hai
const CODE_KEYS = {
  Slash: "/", Comma: ",", Period: ".", Semicolon: ";", Quote: "'",
  BracketLeft: "[", BracketRight: "]", Backslash: "\\", Minus: "-",
  Equal: "=", Backquote: "`",
};

const NAMED_KEYS = {
  Escape: "esc", " ": "space", ArrowUp: "up", ArrowDown: "down",
  ArrowLeft: "left", ArrowRight: "right", Enter: "enter",
  Backspace: "backspace", Delete: "delete", Tab: "tab",
  Home: "home", End: "end", PageUp: "pageup", PageDown: "pagedown",
};

const DISPLAY = {
  esc: "Esc", space: "Space", up: "↑", down: "↓", left: "←", right: "→",
  enter: "Enter", backspace: "Backspace", delete: "Del", tab: "Tab",
  home: "Home", end: "End", pageup: "PgUp", pagedown: "PgDn",
};

export const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || "");

function normalizeKey(e) {
  if (/^Key[A-Z]$/.test(e.code)) return e.code.slice(3).toLowerCase();
  if (/^Digit\d$/.test(e.code)) return e.code.slice(5);
  if (CODE_KEYS[e.code]) return CODE_KEYS[e.code];
  if (NAMED_KEYS[e.key]) return NAMED_KEYS[e.key];
  if (/^F\d{1,2}$/.test(e.key)) return e.key.toLowerCase();
  return null;
}

// KeyboardEvent -> "mod+shift+k" (ya null agar sirf modifier dabaya ho)
export function eventToCombo(e) {
  if (MODIFIER_KEYS.has(e.key)) return null;
  const key = normalizeKey(e);
  if (!key) return null;
  // Kuch keyboards par right-Alt (AltGr) browser ko Ctrl+Alt bhejta hai: usse sirf Alt maano
  const altGr = typeof e.getModifierState === "function" && e.getModifierState("AltGraph");
  const parts = [];
  if ((e.ctrlKey && !altGr) || e.metaKey) parts.push("mod");
  if (e.altKey || altGr) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  parts.push(key);
  return parts.join("+");
}

// "mod+shift+k" -> ["Ctrl", "Shift", "K"] (display chips ke liye)
export function formatCombo(combo) {
  const mac = isMac();
  return combo.split("+").map((p) => {
    if (p === "mod") return mac ? "⌘" : "Ctrl";
    if (p === "alt") return mac ? "⌥" : "Alt";
    if (p === "shift") return mac ? "⇧" : "Shift";
    if (DISPLAY[p]) return DISPLAY[p];
    return p.toUpperCase(); // a -> A, f1 -> F1
  });
}

// Kuch F-keys browser/OS pehle se pakड़ lete hain (F1=Help, F11=Fullscreen, F12=DevTools);
// inhe akele (bina Shift/Alt) assign karne dena users ke liye confusing hoga kyunki
// kabhi-kabhi ERP tak pahunchengi hi nahi. F2-F10 aur Shift+F1 jaisi combos free hain.
const BROWSER_RESERVED_PLAIN_FKEYS = new Set(["f1", "f11", "f12"]);

// Error message return karta hai, ya null agar combo theek hai
export function validateCombo(combo) {
  const parts = combo.split("+");
  const key = parts[parts.length - 1];
  const mods = parts.slice(0, -1);
  const isFn = /^f\d{1,2}$/.test(key);
  if (!isFn && !mods.includes("mod") && !mods.includes("alt")) {
    return "Use Ctrl (⌘ on Mac) or Alt with a key, so it never clashes with typing.";
  }
  if (isFn && mods.length === 0 && BROWSER_RESERVED_PLAIN_FKEYS.has(key)) {
    return "Some browsers reserve this key (Help, Fullscreen or DevTools) and may block it. Try another key, or add Shift (e.g. Shift+F1).";
  }
  if (RESERVED.has(combo)) {
    return "The browser or text editing (copy, paste, undo) uses this combo. Try another.";
  }
  return null;
}
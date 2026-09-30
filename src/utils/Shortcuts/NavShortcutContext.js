import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { useAuth } from "../../theme/AuthContext";
import { useShortcuts } from "./ShortcutsContext";
import { FIXED_SHORTCUTS, eventToCombo, formatCombo, validateCombo } from "./ShortcutRegistry";
import { fetchNavShortcuts, saveNavShortcuts } from "../api";

const NavShortcutsContext = createContext(null);

// Keys handled by hard-coded listeners elsewhere in the ERP (not in ShortcutRegistry).
// Custom shortcuts can never take these. Add more here if another hard-coded key is found.
const HARDCODED_COMBOS = {
  "mod+f": "the dashboard menu search (Ctrl+F)",
  "alt+1": "an existing ERP shortcut (Alt+1)",
  "alt+2": "an existing ERP shortcut (Alt+2)",
};

// Keys the browser may keep for itself: allowed, but the user gets a heads-up.
const SOFT_WARN = {
  f5: "reloads the page",
  f11: "toggles full screen",
  f12: "opens the browser developer tools",
};

const cacheKey = (uid) => `erpNavShortcuts:${uid ?? "anon"}`;
const dirtyKey = (uid) => `erpNavShortcutsDirty:${uid ?? "anon"}`;

function readCache(uid) {
  try {
    const raw = JSON.parse(localStorage.getItem(cacheKey(uid)) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}
function writeCache(uid, list) {
  try { localStorage.setItem(cacheKey(uid), JSON.stringify(list)); } catch { /* ignore */ }
}
const isDirty = (uid) => {
  try { return localStorage.getItem(dirtyKey(uid)) === "1"; } catch { return false; }
};
const setDirty = (uid, on) => {
  try {
    if (on) localStorage.setItem(dirtyKey(uid), "1");
    else localStorage.removeItem(dirtyKey(uid));
  } catch { /* ignore */ }
};

const newId = () => `nav_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const pretty = (combo) => formatCombo(combo).join(" + ");

// True when the key event comes from somewhere the user is typing or picking from a list.
function isTypingTarget(el) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return !!el.closest(
    "[contenteditable='true'], [role='combobox'], [role='listbox'], [role='textbox'], [data-dropdown-open='true']"
  );
}

const findTarget = (list, entry) =>
  list.find((t) => String(t.masmnu_id) === String(entry.masmnu_id)) ||
  list.find((t) => t.appl_name === entry.appl_name) ||
  null;

export function NavShortcutsProvider({
  children, menus, tabs, activeTabId, onOpenPage, onChangeActiveTab,
}) {
  const { user, token, isAuthenticated } = useAuth();
  const { shortcuts } = useShortcuts();
  const uid = isAuthenticated && token
    ? (user?.user_id ?? user?.userma_id ?? user?.id ?? user?._id ?? "me")
    : null;

  const [entries, setEntries] = useState(() => readCache(uid));
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState("idle"); // idle | local | saving | saved | error
  const latest = useRef(entries);
  const saveTimer = useRef(null);

  // Load this user's shortcuts (only when logged in)
  useEffect(() => {
    let alive = true;
    const cached = readCache(uid);
    latest.current = cached;
    setEntries(cached);
    setSyncState("idle");

    if (!uid) { setLoading(false); return undefined; }

    setLoading(true);
    fetchNavShortcuts()
      .then((remote) => {
        if (!alive) return;
        if (isDirty(uid)) {
          // Local changes never reached the server: push them instead of overwriting
          saveNavShortcuts(latest.current).then(() => setDirty(uid, false)).catch(() => {});
          return;
        }
        latest.current = remote;
        setEntries(remote);
        writeCache(uid, remote);
      })
      .catch(() => { /* server down or 401: keep the cached copy */ })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [uid]);

  const commit = useCallback((updater) => {
    const next = updater(latest.current);
    latest.current = next;
    setEntries(next);
    writeCache(uid, next);
    setDirty(uid, true);
    if (!uid) { setSyncState("local"); return; }
    setSyncState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveNavShortcuts(latest.current);
        setDirty(uid, false);
        setSyncState("saved");
      } catch {
        setSyncState("error");
      }
    }, 600);
  }, [uid]);

  // Screens the user can open, taken from the menu list App already loaded
  const targets = useMemo(() => {
    const base = (menus || [])
      .filter((m) => m && m.appl_name && m.menu_hide !== "Y")
      .map((m) => ({
        masmnu_id: m.masmnu_id,
        appl_name: m.appl_name,
        label: m.bar_name || m.appl_name,
        menu: m,
      }));
    const count = {};
    base.forEach((t) => { count[t.label] = (count[t.label] || 0) + 1; });
    return base
      .map((t) => ({ ...t, display: count[t.label] > 1 ? `${t.label} (${t.appl_name})` : t.label }))
      .sort((a, b) => a.display.localeCompare(b.display));
  }, [menus]);

  // Who already owns a combo among the existing (non-custom) shortcuts
  const existingOwner = useCallback((combo) => {
    if (HARDCODED_COMBOS[combo]) return HARDCODED_COMBOS[combo];
    const fixed = FIXED_SHORTCUTS.find((f) => f.keys === combo);
    if (fixed) return `the built-in "${fixed.label}" key`;
    const s = shortcuts.find((x) => x.enabled && x.keys === combo);
    if (s) return `"${s.label}"`;
    return null;
  }, [shortcuts]);

  // Active bindings: existing shortcuts always win, then the first custom entry wins
  const { bindings, status } = useMemo(() => {
    const map = new Map();
    const st = {};
    entries.forEach((e) => {
      if (!e.enabled) return;
      const owner = existingOwner(e.keys);
      if (owner) {
        st[e.id] = { kind: "blocked", text: `Not active: ${pretty(e.keys)} is used by ${owner}.` };
        return;
      }
      if (map.has(e.keys)) {
        st[e.id] = { kind: "blocked", text: `Not active: same keys as "${map.get(e.keys).label}".` };
        return;
      }
      map.set(e.keys, e);
    });
    return { bindings: map, status: st };
  }, [entries, existingOwner]);

  // Latest values for the long-lived key listener
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;
  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const activeTabIdRef = useRef(activeTabId);
  activeTabIdRef.current = activeTabId;
  const openRef = useRef(onOpenPage);
  openRef.current = onOpenPage;
  const changeRef = useRef(onChangeActiveTab);
  changeRef.current = onChangeActiveTab;

  // The listener: document + capture phase, same level as the existing dispatcher.
  // A recorder that calls stopImmediatePropagation on window (capture) hides keys from it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || e.isComposing) return;
      if (bindingsRef.current.size === 0) return;
      if (document.body.classList.contains("swal2-shown")) return;
      if (isTypingTarget(e.target)) return;

      const combo = eventToCombo(e);
      if (!combo) return;
      const entry = bindingsRef.current.get(combo);
      if (!entry) return;
      const target = findTarget(targetsRef.current, entry);
      if (!target) return; // screen no longer available: leave the key alone

      e.preventDefault();

      const openTabs = tabsRef.current || [];
      const active = openTabs.find((t) => t.id === activeTabIdRef.current);
      if (active && active.appl_name === target.appl_name) return; // already here

      const open = openTabs.find((t) => t.appl_name === target.appl_name);
      if (open) {
        if (changeRef.current) changeRef.current(open.id);
        return;
      }
      if (openRef.current) openRef.current(target.menu, { newTab: true });
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  // Validation used by the Settings screen. Returns { level, text } or null.
  const check = useCallback((combo, exceptId) => {
    const err = validateCombo(combo);
    if (err) return { level: "error", text: err };
    const owner = existingOwner(combo);
    if (owner) {
      return { level: "error", text: `${pretty(combo)} is already used by ${owner}. Pick different keys.` };
    }
    const other = entries.find((e) => e.enabled && e.id !== exceptId && e.keys === combo);
    if (other) {
      return { level: "error", text: `${pretty(combo)} already opens "${other.label}". Pick different keys.` };
    }
    if (SOFT_WARN[combo]) {
      return { level: "warn", text: `Your browser ${SOFT_WARN[combo]} with this key, so it may not always work.` };
    }
    return null;
  }, [existingOwner, entries]);

  const add = useCallback((data) => {
    commit((list) => [...list, { id: newId(), enabled: true, ...data }]);
  }, [commit]);

  const update = useCallback((id, patch) => {
    commit((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, [commit]);

  const remove = useCallback((id) => {
    commit((list) => list.filter((e) => e.id !== id));
  }, [commit]);

  // Returns { level:"error", text } if it cannot be turned on
  const toggle = useCallback((id) => {
    const e = entries.find((x) => x.id === id);
    if (!e) return null;
    if (!e.enabled) {
      const res = check(e.keys, id);
      if (res && res.level === "error") return res;
    }
    commit((list) => list.map((x) => (x.id === id ? { ...x, enabled: !e.enabled } : x)));
    return null;
  }, [entries, check, commit]);

  const resolveTarget = useCallback((entry) => findTarget(targets, entry), [targets]);

  const value = useMemo(() => ({
    entries, loading, syncState, targets, status,
    resolveTarget, check, add, update, remove, toggle,
  }), [entries, loading, syncState, targets, status, resolveTarget, check, add, update, remove, toggle]);

  return <NavShortcutsContext.Provider value={value}>{children}</NavShortcutsContext.Provider>;
}

export const useNavShortcuts = () => {
  const ctx = useContext(NavShortcutsContext);
  if (!ctx) throw new Error("useNavShortcuts must be used inside <NavShortcutsProvider>");
  return ctx;
};

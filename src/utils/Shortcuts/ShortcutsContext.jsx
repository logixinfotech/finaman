// import React, {
//   createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
// } from "react";
// import { useAuth } from "../../theme/AuthContext";
// import { DEFAULT_SHORTCUTS, formatCombo, validateCombo } from "./ShortcutRegistry";
// // TODO: apni api.js ka sahi path daalo (wahi jahan baaki saare API functions hain)
// import { fetchUserShortcuts, saveUserShortcuts } from "../api";
// // TODO: apni erpShortcuts.js ka sahi path daalo
// import { setERPBindings } from "../erpShortcuts";

// const ShortcutsContext = createContext(null);

// // localStorage sirf instant-load / offline fallback ke liye. Source of truth backend hai.
// // (Logout par aapka localStorage.clear() ise bhi saaf kar deta hai, jo theek hai.)
// const cacheKey = (uid) => `erpShortcuts:${uid ?? "anon"}`;

// function readCache(uid) {
//   try {
//     const raw = JSON.parse(localStorage.getItem(cacheKey(uid)) || "{}");
//     return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
//   } catch {
//     return {};
//   }
// }

// function writeCache(uid, overrides) {
//   try {
//     localStorage.setItem(cacheKey(uid), JSON.stringify(overrides));
//   } catch {
//     /* storage full / blocked: ignore */
//   }
// }

// // overrides[id] mein sirf wahi rakhta hai jo default se alag ho
// function patchOverride(overrides, id, change) {
//   const def = DEFAULT_SHORTCUTS.find((s) => s.id === id);
//   if (!def) return overrides;
//   const cur = { ...(overrides[id] || {}), ...change };
//   if (cur.keys === def.keys) delete cur.keys;
//   if (cur.enabled !== false) delete cur.enabled;
//   const next = { ...overrides };
//   if (Object.keys(cur).length) next[id] = cur;
//   else delete next[id];
//   return next;
// }

// export function ShortcutsProvider({ children }) {
//   const { user } = useAuth();
//   // Logged-in hai to kuch na kuch id milegi; "me" fallback se fetch kabhi skip nahi hota.
//   // TODO: agar aapke user object mein id ka naam alag hai to yahan jod do.
//   const uid = user
//     ? (user.user_id ?? user.userma_id ?? user.id ?? user._id ?? "me")
//     : null;

//   const [overrides, setOverrides] = useState(() => readCache(uid));
//   const [loading, setLoading] = useState(true);
//   const [syncState, setSyncState] = useState("idle"); // idle | saving | saved | error

//   const saveTimer = useRef(null);
//   const latest = useRef(overrides);

//   // User badalne par (login/logout) uske overrides load karo
//   useEffect(() => {
//     let alive = true;
//     const cached = readCache(uid);
//     latest.current = cached;
//     setOverrides(cached);
//     setSyncState("idle");
//     if (!uid) { setLoading(false); return undefined; }
//     setLoading(true);
//     fetchUserShortcuts()
//       .then((remote) => {
//         if (!alive) return;
//         latest.current = remote;
//         setOverrides(remote);
//         writeCache(uid, remote);
//       })
//       .catch(() => { /* backend down: cached copy se kaam chalta rahega */ })
//       .finally(() => { if (alive) setLoading(false); });
//     return () => { alive = false; };
//   }, [uid]);

//   const commit = useCallback((updater) => {
//     const next = updater(latest.current);
//     latest.current = next;
//     setOverrides(next);
//     writeCache(uid, next);
//     setSyncState("saving");
//     clearTimeout(saveTimer.current);
//     saveTimer.current = setTimeout(async () => {
//       try {
//         await saveUserShortcuts(latest.current);
//         setSyncState("saved");
//       } catch {
//         setSyncState("error");
//       }
//     }, 600);
//   }, [uid]);

//   // Defaults + user overrides = final shortcuts
//   const shortcuts = useMemo(
//     () => DEFAULT_SHORTCUTS.map((d) => {
//       const o = overrides[d.id] || {};
//       const keys = o.keys && !validateCombo(o.keys) ? o.keys : d.keys;
//       const enabled = o.enabled !== false;
//       const customKeys = keys !== d.keys;
//       return { ...d, keys, enabled, customKeys, customized: customKeys || !enabled, defaultKeys: d.keys };
//     }),
//     [overrides]
//   );

//   // Resolved keys ko erpShortcuts.js ke dispatcher tak pahunchao: { "alt+s": "onSave", ... }
//   useEffect(() => {
//     const map = {};
//     shortcuts.forEach((s) => { if (s.enabled && s.action) map[s.keys] = s.action; });
//     setERPBindings(map);
//   }, [shortcuts]);

//   const findConflict = useCallback(
//     (combo, exceptId) => shortcuts.find((s) => s.enabled && s.id !== exceptId && s.keys === combo) || null,
//     [shortcuts]
//   );

//   const setKeys = useCallback((id, combo, swapWithId) => {
//     const mine = shortcuts.find((s) => s.id === id);
//     commit((o) => {
//       let next = patchOverride(o, id, { keys: combo });
//       if (swapWithId && mine) next = patchOverride(next, swapWithId, { keys: mine.keys });
//       return next;
//     });
//   }, [shortcuts, commit]);

//   // Returns { conflict } agar on karne par same keys kisi aur ke paas hain
//   const toggle = useCallback((id) => {
//     const s = shortcuts.find((x) => x.id === id);
//     if (!s) return null;
//     if (!s.enabled) {
//       const conflict = findConflict(s.keys, id);
//       if (conflict) return { conflict };
//     }
//     commit((o) => patchOverride(o, id, { enabled: !s.enabled }));
//     return null;
//   }, [shortcuts, findConflict, commit]);

//   const resetOne = useCallback((id) => {
//     const def = DEFAULT_SHORTCUTS.find((s) => s.id === id);
//     const conflict = def && findConflict(def.keys, id);
//     if (conflict) {
//       // Default keys kisi aur ne le li hain: pehle unhe unke default pe wapas bhejo
//       commit((o) => patchOverride(patchOverride(o, conflict.id, { keys: conflict.defaultKeys }), id, { keys: def.keys, enabled: true }));
//       return;
//     }
//     commit((o) => {
//       const next = { ...o };
//       delete next[id];
//       return next;
//     });
//   }, [findConflict, commit]);

//   const resetAll = useCallback(() => commit(() => ({})), [commit]);

//   const value = useMemo(() => ({
//     shortcuts,
//     loading,
//     syncState,
//     customizedCount: shortcuts.filter((s) => s.customized).length,
//     findConflict, setKeys, toggle, resetOne, resetAll,
//   }), [shortcuts, loading, syncState, findConflict, setKeys, toggle, resetOne, resetAll]);

//   return <ShortcutsContext.Provider value={value}>{children}</ShortcutsContext.Provider>;
// }

// export const useShortcuts = () => {
//   const ctx = useContext(ShortcutsContext);
//   if (!ctx) throw new Error("useShortcuts must be used inside <ShortcutsProvider>");
//   return ctx;
// };

// // Button tooltip ke liye: useShortcutLabel("record.save") -> "Alt+S" (custom ho to custom keys)
// export function useShortcutLabel(id) {
//   const { shortcuts } = useShortcuts();
//   const s = shortcuts.find((x) => x.id === id);
//   return s && s.enabled ? formatCombo(s.keys).join("+") : "";
// }
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { useAuth } from "../../theme/AuthContext";
import { DEFAULT_SHORTCUTS, formatCombo, validateCombo } from "./ShortcutRegistry";
import { setERPBindings } from "../erpShortcuts";
// TODO: apni api.js ka sahi path daalo
import { fetchUserShortcuts, saveUserShortcuts } from "../api";

const ShortcutsContext = createContext(null);

// ── Settings ────────────────────────────────────────────────────────────────
// true = server (GET/PUT /api/user/shortcuts) se sync, localStorage cache ke roop mein.
// false = sirf browser mein, server ko koi call nahi.
const SERVER_SYNC = true;

// Login state AuthContext se aata hai (isAuthenticated + token), localStorage key guess nahi karni.

// "dirty" = local changes jo abhi server tak nahi pahunche
const dirtyKey = (uid) => `erpShortcutsDirty:${uid ?? "anon"}`;
const isDirty = (uid) => {
  try { return localStorage.getItem(dirtyKey(uid)) === "1"; } catch { return false; }
};
const setDirty = (uid, on) => {
  try {
    if (on) localStorage.setItem(dirtyKey(uid), "1");
    else localStorage.removeItem(dirtyKey(uid));
  } catch { /* ignore */ }
};

const cacheKey = (uid) => `erpShortcuts:${uid ?? "anon"}`;

function readCache(uid) {
  try {
    const raw = JSON.parse(localStorage.getItem(cacheKey(uid)) || "{}");
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

function writeCache(uid, overrides) {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(overrides));
  } catch { /* ignore */ }
}

// overrides[id] mein sirf wahi rakhta hai jo default se alag ho
function patchOverride(overrides, id, change) {
  const def = DEFAULT_SHORTCUTS.find((s) => s.id === id);
  if (!def) return overrides;
  const cur = { ...(overrides[id] || {}), ...change };
  if (cur.keys === def.keys) delete cur.keys;
  if (cur.enabled !== false) delete cur.enabled;
  const next = { ...overrides };
  if (Object.keys(cur).length) next[id] = cur;
  else delete next[id];
  return next;
}

export function ShortcutsProvider({ children }) {
  const { user, token, isAuthenticated } = useAuth();
  // Logged in nahi (login page) to uid null: koi API call nahi jayegi
  const uid = isAuthenticated && token
    ? (user?.user_id ?? user?.userma_id ?? user?.id ?? user?._id ?? "me")
    : null;

  const [overrides, setOverrides] = useState(() => readCache(uid));
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState("idle"); // idle | local | saving | saved | error

  const saveTimer = useRef(null);
  const latest = useRef(overrides);

  // User badalne par (login/logout) overrides load karo. Sirf tab jab logged in ho.
  useEffect(() => {
    let alive = true;
    const cached = readCache(uid);
    latest.current = cached;
    setOverrides(cached);
    setSyncState("idle");

    // login page / bina token: API call bilkul nahi (401 loop + blinking yahin se band)
    if (!uid || !SERVER_SYNC) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    fetchUserShortcuts()
      .then((remote) => {
        if (!alive) return;
        if (isDirty(uid)) {
          // local changes server tak nahi pahunche the: server se overwrite mat karo, ulta bhej do
          saveUserShortcuts(latest.current)
            .then(() => setDirty(uid, false))
            .catch(() => {});
          return;
        }
        latest.current = remote;
        setOverrides(remote);
        writeCache(uid, remote);
      })
      .catch(() => { /* backend down ya 401: cache se kaam chalega, retry nahi */ })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [uid]);

  const commit = useCallback((updater) => {
    const next = updater(latest.current);
    latest.current = next;
    setOverrides(next);
    writeCache(uid, next); // hamesha pehle local save
    if (!SERVER_SYNC) { setSyncState("local"); return; }
    setDirty(uid, true); // token na ho tab bhi mark karo, taaki agla load server se overwrite na kare
    if (!uid) { setSyncState("local"); return; }
    setSyncState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveUserShortcuts(latest.current);
        setDirty(uid, false);
        setSyncState("saved");
      } catch {
        setSyncState("error");
      }
    }, 600);
  }, [uid]);

  // Defaults + user overrides = final shortcuts
  const shortcuts = useMemo(
    () => DEFAULT_SHORTCUTS.map((d) => {
      const o = overrides[d.id] || {};
      const keys = o.keys && !validateCombo(o.keys) ? o.keys : d.keys;
      const enabled = o.enabled !== false;
      const customKeys = keys !== d.keys;
      return { ...d, keys, enabled, customKeys, customized: customKeys || !enabled, defaultKeys: d.keys };
    }),
    [overrides]
  );

  // Resolved keys ko erpShortcuts.js ke dispatcher tak pahunchao
 useEffect(() => {
  setERPBindings(shortcuts);   // poora array bhejo, map mat banao
}, [shortcuts]);
  const findConflict = useCallback(
    (combo, exceptId) => shortcuts.find((s) => s.enabled && s.id !== exceptId && s.keys === combo) || null,
    [shortcuts]
  );

  const setKeys = useCallback((id, combo, swapWithId) => {
    const mine = shortcuts.find((s) => s.id === id);
    commit((o) => {
      let next = patchOverride(o, id, { keys: combo });
      if (swapWithId && mine) next = patchOverride(next, swapWithId, { keys: mine.keys });
      return next;
    });
  }, [shortcuts, commit]);

  // Returns { conflict } agar on karne par same keys kisi aur ke paas hain
  const toggle = useCallback((id) => {
    const s = shortcuts.find((x) => x.id === id);
    if (!s) return null;
    if (!s.enabled) {
      const conflict = findConflict(s.keys, id);
      if (conflict) return { conflict };
    }
    commit((o) => patchOverride(o, id, { enabled: !s.enabled }));
    return null;
  }, [shortcuts, findConflict, commit]);

  const resetOne = useCallback((id) => {
    const def = DEFAULT_SHORTCUTS.find((s) => s.id === id);
    const conflict = def && findConflict(def.keys, id);
    if (conflict) {
      commit((o) => patchOverride(patchOverride(o, conflict.id, { keys: conflict.defaultKeys }), id, { keys: def.keys, enabled: true }));
      return;
    }
    commit((o) => {
      const next = { ...o };
      delete next[id];
      return next;
    });
  }, [findConflict, commit]);

  const resetAll = useCallback(() => commit(() => ({})), [commit]);

  const value = useMemo(() => ({
    shortcuts,
    loading,
    syncState,
    customizedCount: shortcuts.filter((s) => s.customized).length,
    findConflict, setKeys, toggle, resetOne, resetAll,
  }), [shortcuts, loading, syncState, findConflict, setKeys, toggle, resetOne, resetAll]);

  return <ShortcutsContext.Provider value={value}>{children}</ShortcutsContext.Provider>;
}

export const useShortcuts = () => {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error("useShortcuts must be used inside <ShortcutsProvider>");
  return ctx;
};

// Button tooltip ke liye: useShortcutLabel("record.save") -> "Alt+S"
export function useShortcutLabel(id) {
  const { shortcuts } = useShortcuts();
  const s = shortcuts.find((x) => x.id === id);
  return s && s.enabled ? formatCombo(s.keys).join("+") : "";
}
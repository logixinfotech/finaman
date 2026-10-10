// src/theme/RecentContext.jsx
// USE_API = true  -> backend (DB, har device par same)
// USE_API = false -> sirf browser localStorage (fallback)
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { fetchRecent, trackRecentApi, toggleRecentPinApi, clearRecentApi } from "../utils/api";

const MAX = 20;
const USE_API = true;

const RecentCtx = createContext({ items: [], track: () => {}, togglePin: () => {}, clear: () => {} });
export const useRecent = () => useContext(RecentCtx);

const keyOf = (i) => `${i.kind}:${i.applName || i.path || ""}:${i.recordId ?? ""}`;
const tidy = (arr) => {
  const pinned = arr.filter((x) => x.pinned);
  const rest = arr.filter((x) => !x.pinned).sort((a, b) => b.openedAt - a.openedAt).slice(0, MAX);
  return [...pinned, ...rest];
};
const read = (k) => { try { const v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

export function RecentProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.user_id || user?.user_name || "guest";
  const storeKey = `erp_recent_v1_${uid}`;

  const [items, setItems] = useState([]);
  const loadedFor = useRef("");
  const last = useRef({ key: "", at: 0 });

  // localStorage mode: write effect pehle declare hai (user badalne par purana data naye key me nahi jaata)
  useEffect(() => {
    if (USE_API || loadedFor.current !== storeKey) return;
    write(storeKey, items);
  }, [items, storeKey]);

  const hasUser = !!user;
  useEffect(() => {
    if (!hasUser) return;                       // login ke baad hi load karo
    let alive = true;
    if (USE_API) {
      fetchRecent()
        .then((r) => { if (alive) setItems(Array.isArray(r?.data) ? r.data : []); })
        .catch(() => { /* Recent fail ho to ERP na ruke */ });
      loadedFor.current = storeKey;
      return () => { alive = false; };
    }
    setItems(read(storeKey));
    loadedFor.current = storeKey;
    const onStorage = (e) => { if (e.key === storeKey) setItems(read(storeKey)); };
    window.addEventListener("storage", onStorage);
    return () => { alive = false; window.removeEventListener("storage", onStorage); };
  }, [storeKey, hasUser]);

  /** item = { kind:'screen'|'record', title, applName, moduleKey?, path?, recordId?, recordNo?, page } */
  const track = useCallback((item) => {
    if (!item?.title) return;
    const key = keyOf(item);
    const now = Date.now();
    if (last.current.key === key && now - last.current.at < 1000) return;   // double-fire rokne ke liye
    last.current = { key, at: now };

    setItems((prev) => {
      const old = prev.find((x) => x.key === key);
      const row = { ...old, ...item, key, id: key, pinned: old?.pinned || false, count: (old?.count || 0) + 1, openedAt: now };
      return tidy([row, ...prev.filter((x) => x.key !== key)]);
    });
    if (USE_API) trackRecentApi(item).catch(() => {});
  }, []);

  const togglePin = useCallback((it) => {
    setItems((prev) => tidy(prev.map((x) => (x.key === it.key ? { ...x, pinned: !x.pinned } : x))));
    if (USE_API) toggleRecentPinApi(it.key).catch(() => {});
  }, []);

  const clear = useCallback(() => {
    setItems((prev) => prev.filter((x) => x.pinned));
    if (USE_API) clearRecentApi().catch(() => {});
  }, []);

  const value = useMemo(() => ({ items, track, togglePin, clear }), [items, track, togglePin, clear]);
  return <RecentCtx.Provider value={value}>{children}</RecentCtx.Provider>;
}
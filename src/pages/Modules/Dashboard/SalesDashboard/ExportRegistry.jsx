import { createContext, useContext, useEffect, useMemo, useRef, useCallback } from "react";

/* ------------------------------------------------------------------
   ExportRegistry

   Every ExportMenu on the page registers a lazy getter:
       id -> () => ({ title, columns, rows })
   FiltersBar reads them all through `collect()` and builds a multi-sheet
   workbook ("Export all charts"). Getters are lazy so registering costs
   nothing until the user actually clicks Export.

   The provider is optional: standalone pages that render cards without it
   simply get per-card export and no "all charts" option.
------------------------------------------------------------------ */
const Ctx = createContext(null);

export function ExportRegistryProvider({ children }) {
  const sources = useRef(new Map());   // id -> { order, get }
  const seq = useRef(0);

  const register = useCallback((id, get) => {
    const prev = sources.current.get(id);
    sources.current.set(id, { order: prev?.order ?? seq.current++, get });
    return () => { sources.current.delete(id); };
  }, []);

  const collect = useCallback(() => {
    return [...sources.current.values()]
      .sort((a, b) => a.order - b.order)
      .map((s) => { try { return s.get(); } catch { return null; } })
      .filter((s) => s && s.columns?.length);
  }, []);

  const count = useCallback(() => sources.current.size, []);

  const value = useMemo(() => ({ register, collect, count }), [register, collect, count]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExportRegistry() {
  return useContext(Ctx);
}

/* Register a dataset getter for the lifetime of the component.
   `get` is read through a ref, so callers can pass a fresh closure each render. */
export function useExportSource(id, get) {
  const ctx = useContext(Ctx);
  const getRef = useRef(get);
  useEffect(() => { getRef.current = get; });   // keep the latest closure without re-registering
  useEffect(() => {
    if (!ctx || !id) return undefined;
    return ctx.register(id, () => getRef.current());
  }, [ctx, id]);
}

/* Arrow-key navigation inside a dropdown: Up/Down move between items, Home/End jump. */
export function menuKeyNav(e) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
  const items = [...e.currentTarget.querySelectorAll('[role="menuitem"]:not(:disabled)')];
  if (!items.length) return;
  e.preventDefault();
  const i = items.indexOf(document.activeElement);
  let next = 0;
  if (e.key === "ArrowDown") next = i < 0 ? 0 : (i + 1) % items.length;
  else if (e.key === "ArrowUp") next = i < 0 ? items.length - 1 : (i - 1 + items.length) % items.length;
  else if (e.key === "End") next = items.length - 1;
  items[next].focus();
}

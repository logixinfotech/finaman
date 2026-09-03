import { useState, useEffect, useMemo } from "react";
import { getRefOptions } from "./QmsAPI";

// module-level cache — ek session me ek hi baar fetch
const cache = {};

/**
 * Ref dropdowns ke liye RecordNo list.
 * useRefOptions(["deviation", "capa"]) → { deviation: [...], capa: [...] }
 */
export function useRefOptions(modules = []) {
  const key = modules.join(",");
  const list = useMemo(() => modules, [key]);   // eslint-disable-line
  const [opts, setOpts] = useState({});

  useEffect(() => {
    if (!list.length) return;
    let alive = true;

    Promise.all(
      list.map(async (mk) => {
        if (cache[mk]) return [mk, cache[mk]];
        try {
          const res = await getRefOptions(mk);
          const data = res?.data || [];
          cache[mk] = data;
          return [mk, data];
        } catch (e) {
          console.error("[ref-options]", mk, e);
          return [mk, []];
        }
      })
    ).then((pairs) => { if (alive) setOpts(Object.fromEntries(pairs)); });

    return () => { alive = false; };
  }, [list]);

  return opts;
}

// naya record banne ke baad list refresh karne ke liye
export const clearRefCache = (mk) => {
  if (mk) delete cache[mk];
  else Object.keys(cache).forEach((k) => delete cache[k]);
};
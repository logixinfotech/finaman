import { useCallback, useRef, useState } from "react";
import { toDraft, tidy, toKey, uniqueKey, uid, buildCols } from "./model";

/**
 * Editable copy of a template definition with undo / redo and all column operations.
 * `lockedKeys` = keys that exist in the effective version (their key and type can't change).
 */
export default function useTemplateDraft(lockedKeys) {
  const [draft, setDraftState] = useState(null);
  const [selId, setSelId] = useState(null);
  const ref = useRef(null);
  const hist = useRef({ past: [], future: [], t: 0 });
  const locked = useRef(lockedKeys); locked.current = lockedKeys;

  const put = (n) => { ref.current = n; setDraftState(n); };

  /** Load a definition (API shape) — clears history */
  const load = useCallback((def) => {
    const d = def ? toDraft(def) : null;
    hist.current = { past: [], future: [], t: 0 };
    put(d);
    setSelId(d?.columns[0]?._id || null);
  }, []);

  /** Every change goes through here. merge=true groups fast typing into one undo step. */
  const apply = useCallback((fn, merge = false) => {
    const p = ref.current; if (!p) return;
    const n = fn(p); if (n === p) return;
    const h = hist.current; const now = Date.now();
    if (!(merge && now - h.t < 800 && h.past.length)) { h.past.push(p); if (h.past.length > 80) h.past.shift(); }
    h.t = now; h.future = [];
    put(n);
  }, []);
  const undo = useCallback(() => { const h = hist.current; if (!h.past.length) return; h.future.push(ref.current); put(h.past.pop()); }, []);
  const redo = useCallback(() => { const h = hist.current; if (!h.future.length) return; h.past.push(ref.current); put(h.future.pop()); }, []);

  const setD = useCallback((patch, merge) => apply((p) => ({ ...p, ...patch }), merge), [apply]);

  const setCol = useCallback((id, patch, merge = false) => apply((p) => {
    const old = p.columns.find((c) => c._id === id); if (!old) return p;
    const next = tidy({ ...old, ...patch });
    if (patch.label !== undefined && old._auto && !locked.current.has(old.key)) {
      const nk = toKey(patch.label);
      if (nk) next.key = uniqueKey(nk, p.columns.filter((c) => c._id !== id));
    }
    let cols = p.columns.map((c) => (c._id === id ? next : c));
    let endTimeKey = p.endTimeKey;
    if (next.key !== old.key) {   // keep references pointing at the renamed key
      cols = cols.map((c) => {
        let n = c;
        if (c.showIf?.field === old.key) n = { ...n, showIf: { ...n.showIf, field: next.key } };
        if (c.afterField === old.key) n = { ...n, afterField: next.key };
        return n;
      });
      if (endTimeKey === old.key) endTimeKey = next.key;
    }
    if (old.type !== next.type) {  // type changed → drop references that no longer make sense
      if (endTimeKey === old.key && next.type !== "time") endTimeKey = "";
      cols = cols.map((c) => (c.afterField === next.key && c.type !== next.type ? tidy({ ...c, afterField: undefined }) : c));
    }
    return { ...p, columns: cols, endTimeKey };
  }, merge), [apply]);

  const insertItem = useCallback((at, item) => {
    const nc = buildCols(item, ref.current.columns);
    apply((p) => { const cols = [...p.columns]; cols.splice(Math.min(Math.max(at, 0), cols.length), 0, ...nc); return { ...p, columns: cols }; });
    setSelId(nc[0]._id);
  }, [apply]);

  const moveCol = useCallback((from, to) => apply((p) => {
    if (from == null || to == null || from === to || to === from + 1) return p;
    const cols = [...p.columns]; const [it] = cols.splice(from, 1); cols.splice(to > from ? to - 1 : to, 0, it);
    return { ...p, columns: cols };
  }), [apply]);

  const moveBy = useCallback((i, d) => apply((p) => {
    const j = i + d; if (j < 0 || j >= p.columns.length) return p;
    const cols = [...p.columns]; [cols[i], cols[j]] = [cols[j], cols[i]]; return { ...p, columns: cols };
  }), [apply]);

  const removeCol = useCallback((id) => {
    const cols = ref.current.columns; const i = cols.findIndex((c) => c._id === id); const c = cols[i]; if (!c) return;
    if (locked.current.has(c.key) && !window.confirm(`“${c.label}” is used by the effective version.\n\nRemoving it hides it from new entries; data of earlier entries stays in the record. Continue?`)) return;
    apply((p) => ({
      ...p,
      columns: p.columns.filter((x) => x._id !== id).map((x) => {
        let n = x;
        if (x.showIf?.field === c.key) n = tidy({ ...n, showIf: undefined });
        if (x.afterField === c.key) n = tidy({ ...n, afterField: undefined });
        return n;
      }),
      endTimeKey: p.endTimeKey === c.key ? "" : p.endTimeKey,
    }));
    setSelId((cols[i + 1] || cols[i - 1])?._id || null);
  }, [apply]);

  const dupCol = useCallback((id) => {
    const cols = ref.current.columns; const i = cols.findIndex((c) => c._id === id); const s = cols[i]; if (!s) return;
    const copy = { ...s, _id: uid(), _auto: true, label: `${s.label} (copy)`, key: uniqueKey(toKey(`${s.label} copy`), cols) };
    apply((p) => { const cc = [...p.columns]; cc.splice(i + 1, 0, copy); return { ...p, columns: cc }; });
    setSelId(copy._id);
  }, [apply]);

  /** Replace all fields (import / copy from / load standard) — one undo step */
  const replaceAll = useCallback((def, keepHeader = true) => {
    const d = toDraft(def);
    apply((p) => (keepHeader ? { ...p, columns: d.columns, endTimeKey: d.endTimeKey || "" } : { ...d }));
    setSelId(d.columns[0]?._id || null);
  }, [apply]);

  return {
    draft, ref, load, apply, undo, redo, setD, setCol, insertItem, moveCol, moveBy, removeCol, dupCol, replaceAll,
    selId, setSelId, canUndo: hist.current.past.length > 0, canRedo: hist.current.future.length > 0,
  };
}
// Utils/qmsIntent.js
// My Work -> module page ko batata hai: "naya form kholo" ya "ye record kholo".
// Module page abhi mount nahi hua to intent window par rakha rehta hai aur mount/load ke baad mil jata hai.
import { useEffect, useRef } from "react";

const DEBUG = true; // sab theek chalne ke baad false kar dena
const MAX_AGE = 15000; // 15 sec se purana intent ignore
const log = (...a) => DEBUG && console.log("[qms-intent]", ...a);

export const setQmsIntent = (intent) => {
  log("set", intent);
  window.__qmsIntent = intent;                                             // page baad mein mount ho to
  window.dispatchEvent(new CustomEvent("qms-intent", { detail: intent })); // page pehle se khula ho to
};

// useQmsModule ke andar (return se pehle) ek baar lagao:
//   useQmsIntent(moduleKey, { handleAddNewGuarded, handleRowSelect, list, loading });
export function useQmsIntent(moduleKey, api) {
  const ref = useRef(api);
  ref.current = api;

  const run = (i) => {
    if (!i) return;
    if (i.module !== moduleKey) { log(`${moduleKey}: ignore, intent "${i.module}" ka hai`); return; }
    if (Date.now() - i.at > MAX_AGE) { log(`${moduleKey}: intent expire ho gaya`); return; }
    const a = ref.current;
    if (i.type === "new") {
      if (a.loading) { log(`${moduleKey}: data load hone ka wait`); return; }
      if (!a.handleAddNewGuarded) { log(`${moduleKey}: handleAddNewGuarded nahi mila`); return; }
      log(`${moduleKey}: naya form khol raha hoon`);
      window.__qmsIntent = null;
      a.handleAddNewGuarded();
    } else if (i.type === "open") {
      const row = (a.list || []).find((r) => String(r.Id) === String(i.id));
      if (!row) { log(`${moduleKey}: record ${i.id} list mein nahi mila (abhi)`); return; }
      log(`${moduleKey}: record ${i.id} khol raha hoon`);
      window.__qmsIntent = null;
      a.handleRowSelect?.(row);
    } else if (i.type === "open") {
  const row = (a.list || []).find((r) => String(r.Id) === String(i.id));
  if (!row) { log(`${moduleKey}: record ${i.id} list mein nahi mila (abhi)`); return; }
  window.__qmsIntent = null;   // pehle clear
  a.handleRowSelect?.(row);
}
  };

  // mount par, aur jab loading/list badle (data aane ke baad retry)
  useEffect(() => { run(window.__qmsIntent); }, [api.loading, api.list]);
  // page pehle se khula ho to
  useEffect(() => {
    const h = (e) => run(e.detail);
    window.addEventListener("qms-intent", h);
    return () => window.removeEventListener("qms-intent", h);
  }, []);
}
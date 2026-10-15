import { createContext, Suspense, useCallback, useContext, useMemo, useState } from "react";
import ERPModal from "../ERPform";
import { QUICK_ADD_REGISTRY } from "./quickAddRegistry";

const QuickAddContext = createContext(null);

export const useQuickAdd = () => {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd must be used inside <QuickAddProvider>");
  return ctx;
};

export function QuickAddProvider({ children }) {
  const [state, setState] = useState(null); // { key, name, onSaved, onClose }

  const openQuickAdd = useCallback((key, opts = {}) => {
    if (!QUICK_ADD_REGISTRY[key]) {
      console.warn(`QuickAdd: "${key}" registry mein nahi hai`);
      return;
    }
    setState({ key, ...opts });
  }, []);

  const close = useCallback(() => {
    setState((s) => { s?.onClose?.(); return null; });
  }, []);

  const handleSaved = useCallback((name) => {
    setState((s) => { s?.onSaved?.(name); s?.onClose?.(); return null; });
  }, []);

  const value = useMemo(() => ({ openQuickAdd }), [openQuickAdd]);
  const def = state && QUICK_ADD_REGISTRY[state.key];

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      {def && (
        <ERPModal title={def.title} subtitle={def.subtitle} size={def.size} onClose={close}>
          <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading…</div>}>
            <def.Component
              embedded
              tab={{ appl_name: def.applName }}
              initialName={state.name || ""}
              onSaved={handleSaved}
              onClose={close}
            />
          </Suspense>
        </ERPModal>
      )}
    </QuickAddContext.Provider>
  );
}
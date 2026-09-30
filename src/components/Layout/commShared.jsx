import React, { useState, useRef, useCallback, useEffect } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

// Single department list for Communication Setup — replace with Department Master API later
export const DEPARTMENTS = [
  { id: "sales", name: "Sales" },
  { id: "accounts", name: "Accounts" },
  { id: "support", name: "Support" },
  { id: "hr", name: "HR" },
];

export const deptName = (id) => DEPARTMENTS.find((d) => d.id === id)?.name || id;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LABEL_CLS = "block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1";
export const INPUT_CLS =
  "w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-[13.5px] text-slate-700 outline-none " +
  "placeholder:text-slate-300 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] " +
  "transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-400";

export const timeAgo = (ts) => {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
};

// Toast with success / error types
export const useToast = () => {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = useCallback((msg, type = "success") => {
    clearTimeout(timer.current);
    setToast({ msg, type });
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [toast, show];
};

export const Toast = ({ toast }) => {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={`fixed bottom-6 right-6 z-[80] flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-medium shadow-lg
                  ${isError ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}
    >
      {isError ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      {toast.msg}
    </div>
  );
};

// In-app confirm dialog — replaces window.confirm. Usage: const ok = await ask(title, message, label, tone)
export const useConfirm = () => {
  const [state, setState] = useState(null);

  const ask = useCallback(
    (title, message, confirmLabel = "Confirm", tone = "indigo") =>
      new Promise((resolve) => setState({ title, message, confirmLabel, tone, resolve })),
    []
  );

  const close = (result) => {
    state?.resolve(result);
    setState(null);
  };

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const dialog = state ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 px-4" onClick={() => close(false)}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5">
          <h3 className="text-[15px] font-bold text-slate-900">{state.title}</h3>
          {state.message && <p className="mt-1.5 text-[13px] text-slate-500">{state.message}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button onClick={() => close(false)} className="h-9 px-4 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => close(true)}
            className={`h-9 px-4 rounded-lg text-sm font-semibold text-white
                        ${state.tone === "rose" ? "bg-rose-600 hover:bg-rose-500" : "bg-indigo-600 hover:bg-indigo-500"}`}
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return [dialog, ask];
};

export const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50
                ${checked ? "bg-indigo-600" : "bg-slate-300"}`}
  >
    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
  </button>
);
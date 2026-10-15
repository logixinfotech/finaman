import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const SIZES = { sm: "max-w-[520px]", md: "max-w-[620px]", lg: "max-w-[820px]" };
const FOCUSABLE =
  'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]';

export default function ERPModal({
  title, subtitle, size = "md", onClose,
  closeOnBackdrop = true, busy = false, children,
}) {
  const boxRef = useRef(null);
  const opener = useRef(document.activeElement);

  const close = useCallback(() => { if (!busy) onClose?.(); }, [busy, onClose]);

  // scroll lock + focus wapas opener par
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = opener.current;
    return () => { document.body.style.overflow = prev; el?.focus?.(); };
  }, []);

  // Esc sirf is modal ko band kare (capture phase: page ke shortcuts na chalein)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      close();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [close]);

  // focus trap
  const onKeyDown = (e) => {
    if (e.key !== "Tab") return;
    const f = [...boxRef.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => { if (closeOnBackdrop && e.target === e.currentTarget) close(); }}
    >
      <style>{`
        @keyframes erpIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
        .erp-modal-card{animation:erpIn .16s ease-out}
        @media (prefers-reduced-motion:reduce){.erp-modal-card{animation:none}}
      `}</style>

      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={onKeyDown}
        className={`erp-modal-card flex max-h-[98vh]   w-full ${SIZES[size]} flex-col overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_-12px_rgba(15,23,42,.35)] ring-1 ring-slate-900/5`}
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-slate-800">{title}</h2>
          </div>
          <button
            type="button" onClick={close} disabled={busy} aria-label="Close"
            className="-mr-1 ml-3 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>,
    document.body
  );
}
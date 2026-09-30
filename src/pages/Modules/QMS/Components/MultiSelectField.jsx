import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

export default function MultiSelectField({ options = [], value = "", onChange, disabled,error }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const selected = String(value || "").split(",").map((s) => s.trim()).filter(Boolean);

  // button ke hisaab se dropdown ki jagah — upar ya neeche
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const place = () => {
      const r = btnRef.current.getBoundingClientRect();
      const H = 260;
      const below = window.innerHeight - r.bottom;
      const openUp = below < H && r.top > below;
      setPos({
        left: r.left,
        width: r.width,
        top: openUp ? Math.max(8, r.top - H - 4) : r.bottom + 4,
        maxHeight: openUp ? Math.min(H, r.top - 12) : Math.min(H, below - 12),
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const toggle = (opt) => {
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onChange(next.join(", "));
  };

  return (
    <>
       <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full min-h-[28px] px-2 py-[3px] text-[12.5px] text-left border-[1.5px] rounded-[5px] outline-none transition-all ${
          disabled
            ? "bg-[#f0f3f8] text-[#64748b] border-[#e2e8f4] cursor-default"
            : error
              ? "bg-[#fafbfd] text-[#0f172a] border-[#dc2626] hover:border-[#dc2626] focus:border-[#dc2626]" // 🆕 error state
              : "bg-[#fafbfd] text-[#0f172a] border-[#c8d2e4] hover:border-[#a0b0c8] focus:border-[#1a56db]"
        }`}
      >
        {selected.length === 0
          ? <span className="text-[#94a3b8]">Select…</span>
          : <span className="flex flex-wrap gap-1">
              {selected.map((s) => (
                <span key={s} className="bg-[#eef3fd] text-[#2f63c4] text-[10.5px] font-semibold px-1.5 py-[1px] rounded">
                  {s}
                </span>
              ))}
            </span>}
      </button>

      {open && !disabled && pos && createPortal(
        <div
          ref={popRef}
          style={{
            position: "fixed",
            left: pos.left,
            top: pos.top,
            width: pos.width,
            maxHeight: pos.maxHeight,
            zIndex: 99999,
          }}
          className="overflow-y-auto bg-white border border-[#c8d2e4] rounded-[6px] shadow-lg p-1"
        >
          <div className="flex items-center justify-between px-1.5 py-1 border-b border-[#eef1f6] mb-1 sticky top-0 bg-white">
            <span className="text-[10px] uppercase tracking-[0.5px] text-[#94a3b8] font-semibold">
              {selected.length} selected
            </span>
            {selected.length > 0 && (
              <button type="button" onClick={() => onChange("")}
                      className="text-[10.5px] text-[#c25a5a] font-semibold hover:underline">
                Clear
              </button>
            )}
          </div>
          {options.map((opt) => (
            <label key={opt}
                   className="flex items-center gap-2 px-1.5 py-[3px] rounded hover:bg-[#f4f7fc] cursor-pointer">
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)}
                     className="w-[13px] h-[13px] accent-[#1a56db]" />
              <span className="text-[12px] text-[#334155]">{opt}</span>
            </label>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
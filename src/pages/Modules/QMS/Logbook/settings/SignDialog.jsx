import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import * as FaIcons from "react-icons/fa";
import { Kbd } from "../LogbookUi";
import { FONT, Button, area, inp } from "./ui";

/**
 * One dialog for every controlled action on a template (submit / approve / return / retire / discard).
 *   sign     — ask for the typed login name (21 CFR Part 11 style e-signature)
 *   comment  — { label, required, min, placeholder, initial }
 *   checkbox — { label, hint } (e.g. "apply to running registers")
 */
export default function SignDialog({ title, meaning, sign, comment, checkbox, confirmLabel = "Confirm", danger, busy, onCancel, onConfirm, children, width = "max-w-xl" }) {
  const [typedName, setTypedName] = useState("");
  const [text, setText] = useState(comment?.initial || "");
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") { e.stopImmediatePropagation(); e.preventDefault(); if (!busy) onCancel(); } };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [onCancel, busy]);
  const min = comment?.required ? (comment.min || 5) : 0;
  const ok = (!sign || typedName.trim().length > 0) && text.trim().length >= min;
  const go = () => ok && !busy && onConfirm({ typedName: typedName.trim(), comment: text.trim(), checked });

  return createPortal(
    <div className={`fixed inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/45 p-4 ${FONT}`}>
      <div className={`w-full ${width} bg-white rounded-[10px] shadow-[0_20px_50px_rgba(15,23,42,0.25)] overflow-hidden`}>
        <div className="flex items-center gap-3 px-5 h-[54px] border-b border-[#f3f4f6]">
          <span className={`w-[30px] h-[30px] rounded-[8px] flex items-center justify-center ${danger ? "bg-[#fef2f2] text-[#b91c1c]" : "bg-[#eff6ff] text-[#1a56db]"}`}>{sign ? <FaIcons.FaSignature size={13} /> : <FaIcons.FaShieldAlt size={12} />}</span>
          <div className="text-[15px] font-semibold text-[#111827]">{title}</div>
          <button type="button" onClick={onCancel} disabled={busy} title="Close" className="ml-auto w-[30px] h-[30px] rounded-[6px] text-[#6b7280] hover:bg-[#f3f4f6] flex items-center justify-center"><FaIcons.FaTimes size={12} /></button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {children}
          {comment && (
            <div>
              <div className="text-[12px] font-semibold text-[#374151] mb-1.5">{comment.label}{comment.required && <span className="text-[#dc2626]"> *</span>}</div>
              <textarea autoFocus={!sign} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={comment.placeholder} className={area} />
              {comment.required && text.trim().length < min && <div className="text-[12px] text-[#9ca3af] mt-1">Minimum {min} characters.</div>}
            </div>
          )}
          {checkbox && (
            <label className="flex items-start gap-2.5 text-[13px] text-[#111827] cursor-pointer rounded-[8px] border border-[#e5e7eb] p-3 hover:bg-[#f9fafb]">
              <input type="checkbox" className="mt-[3px] w-[15px] h-[15px] accent-[#1a56db]" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
              <span><span className="font-semibold">{checkbox.label}</span>{checkbox.hint && <span className="block text-[12px] text-[#6b7280] mt-0.5">{checkbox.hint}</span>}</span>
            </label>
          )}
          {sign && (
            <div className="rounded-[8px] bg-[#f9fafb] border border-[#e5e7eb] p-4">
              <div className="text-[13px] text-[#111827] mb-3"><span className="font-semibold">Meaning of signature:</span> {meaning}</div>
              <div className="text-[12px] font-semibold text-[#374151] mb-1.5">Type your login name to sign <span className="text-[#dc2626]">*</span></div>
              <input autoFocus value={typedName} onChange={(e) => setTypedName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") go(); }} className={inp} autoComplete="off" />
              <div className="text-[12px] text-[#6b7280] mt-1.5">Stored with your user ID, role, date and time in the e-signature register and audit trail.</div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-5 py-3 border-t border-[#f3f4f6] bg-[#f9fafb] justify-end">
          <Button onClick={onCancel} disabled={busy}>Cancel <Kbd>Esc</Kbd></Button>
          <Button kind={danger ? "danger" : "primary"} disabled={!ok || busy} onClick={go}>{busy ? "Please wait…" : confirmLabel}</Button>
        </div>
      </div>
    </div>, document.body);
}

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import * as FaIcons from "react-icons/fa";
import { Btn, Kbd, erp } from "../LogbookUi";

/**
 * One dialog for every controlled action on a template (submit / approve / return / retire / discard).
 *   sign     — ask for the typed login name (21 CFR Part 11 style e-signature)
 *   comment  — { label, required, min, placeholder }
 *   checkbox — { label, hint } (e.g. "apply to active registers")
 */
export default function SignDialog({ title, meaning, sign, comment, checkbox, confirmLabel = "Confirm", danger, busy, onCancel, onConfirm, children }) {
  const [typedName, setTypedName] = useState("");
  const [text, setText] = useState("");
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
    <div className={`fixed inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/55 p-4 ${erp.font}`}>
      <div className="w-full max-w-xl bg-white rounded-[8px] shadow-2xl border border-[#c8d4e8] overflow-hidden">
        <div className="px-4 py-3 bg-[#e8edf7] border-b border-[#c8d4e8] flex items-center gap-2">
          {sign ? <FaIcons.FaSignature className="text-[#1a56db]" /> : <FaIcons.FaShieldAlt className="text-[#1a56db]" />}
          <div className="text-[13px] font-bold uppercase tracking-[0.3px] text-[#1e293b]">{title}</div>
        </div>
        <div className="p-4 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
          {children}
          {comment && (
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.3px] text-[#5b6b85] mb-1">{comment.label}{comment.required && <span className="text-[#dc2626]"> *</span>}</div>
              <textarea autoFocus={!sign} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={comment.placeholder} className={`${erp.input} !h-auto py-1.5`} />
              {comment.required && text.trim().length < min && <div className="text-[11px] text-[#94a3b8] mt-0.5">Minimum {min} characters.</div>}
            </div>
          )}
          {checkbox && (
            <label className="flex items-start gap-2 text-[12.5px] text-[#1e293b] cursor-pointer rounded-[6px] border border-[#e3e9f4] bg-[#fbfcfe] p-2.5">
              <input type="checkbox" className="mt-0.5" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
              <span><b>{checkbox.label}</b>{checkbox.hint && <span className="block text-[11.5px] text-[#5b6b85]">{checkbox.hint}</span>}</span>
            </label>
          )}
          {sign && (
            <div className="rounded-[6px] border border-[#c8d4e8] bg-[#f4f7fc] p-3">
              <div className="text-[12px] text-[#1e293b] mb-2"><b>Meaning of signature:</b> {meaning}</div>
              <div className="text-[10.5px] font-bold uppercase tracking-[0.3px] text-[#5b6b85] mb-1">Type your login name to sign <span className="text-[#dc2626]">*</span></div>
              <input autoFocus value={typedName} onChange={(e) => setTypedName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") go(); }} className={erp.input} autoComplete="off" />
              <div className="text-[11px] text-[#64748b] mt-1">Stored with your user ID, role, date &amp; time in the e-signature register and audit trail.</div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[#dde1ea] justify-end">
          <Btn onClick={onCancel} disabled={busy}>Cancel <Kbd>Esc</Kbd></Btn>
          <Btn kind={danger ? "danger" : "primary"} disabled={!ok || busy} onClick={go}>{busy ? "Please wait…" : confirmLabel}</Btn>
        </div>
      </div>
    </div>, document.body);
}
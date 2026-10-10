import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ESignDialog({
  meaning, signingAsLabel, onConfirm, onCancel,
  requireReason = false, reasonLabel = "Reason",
}) {
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");

  const canConfirm = password.trim() && (!requireReason || reason.trim());

  const handleConfirm = async () => {
    if (!canConfirm || busy) return;
    setBusy(true);
    setError("");
    try {
      await onConfirm(password, reason.trim());
      setPassword("");                      // memory me password mat chhodo
    } catch (err) {
      setError(err?.message || "Signature failed");
      setPassword("");                      // galat password → field saaf
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleConfirm();
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">✍️</span>
          <h3 className="text-[14px] font-bold text-slate-800">E-Signature Required</h3>
        </div>
        <p className="text-[12px] text-slate-500 mb-3">{meaning}</p>

        <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 mb-3">
          <span className="text-[11px] text-slate-400 uppercase tracking-wide">Signing as</span>
          <div className="text-[13px] font-semibold text-slate-700">{signingAsLabel}</div>
        </div>

        {requireReason && (
          <div className="mb-3">
            <label className="text-[11px] font-semibold text-[#334155] block mb-1">
              {reasonLabel} <span className="text-[#dc2626]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why is this record being rejected?"
              className="w-full px-2 py-1.5 text-[12px] border-[1.5px] border-[#c8d2e4] rounded-[5px] bg-[#fafbfd] outline-none focus:border-[#1a56db] resize-none"
            />
          </div>
        )}

        <label className="text-[11px] text-slate-500 mb-1 block">
          Enter your password to confirm this signature
        </label>
        <div className="relative">
          <input
            autoFocus
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full h-9 pl-3 pr-9 text-[13px] border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPwd((v) => !v)}
            title={showPwd ? "Hide password" : "Show password"}
            className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            {showPwd ? <FaEyeSlash className="text-[13px]" /> : <FaEye className="text-[13px]" />}
          </button>
        </div>

        {error && <p className="text-[11.5px] text-red-500 mt-2">✕ {error}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || busy}
            className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12.5px] font-semibold rounded-md transition-colors"
          >
            {busy ? "Signing..." : "✓ Confirm Signature"}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="h-9 px-4 border border-slate-300 text-slate-600 text-[12.5px] font-medium rounded-md hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
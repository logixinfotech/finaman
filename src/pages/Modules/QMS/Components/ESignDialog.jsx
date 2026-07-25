import { useState } from "react";

export default function ESignDialog({ meaning, signingAsLabel, onConfirm, onCancel }) {
  const [typedName, setTypedName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!typedName.trim()) return;
    setBusy(true);
    setError("");
    try {
      await onConfirm(typedName.trim());
    } catch (err) {
      setError(err?.message || "Signature failed");
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

        <label className="text-[11px] text-slate-500 mb-1 block">
          Type your full name to confirm this signature
        </label>
        <input
          autoFocus
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Full name"
          className="w-full h-9 px-3 text-[13px] border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />

        {error && (
          <p className="text-[11.5px] text-red-500 mt-2">✕ {error}</p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleConfirm}
            disabled={!typedName.trim() || busy}
            className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12.5px] font-semibold rounded-md transition-colors"
          >
            {busy ? "Signing…" : "✓ Confirm Signature"}
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
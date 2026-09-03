import { useEffect, useState } from "react";
import WorkflowProgressBar from "./WorkflowProgressBar";
import ESignDialog from "./ESignDialog";
import { advanceState, getEsignatures, getAuditTrail, createLinkedCapa } from "../Utils/QmsAPI";
import { showToast, alertError } from "../../../../components/Reusable/alert"; 
 import { useAuth } from "../../../../theme/AuthContext";
export default function RecordDetailModal({ moduleKey, record, wfConfig, onClose, onStatusChanged }) {
 
  const cfg = wfConfig?.[moduleKey];
  const { user } = useAuth();  
  const [esignatures, setEsignatures] = useState(null);
  const [auditHist, setAuditHist] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // { newStatus, meaning }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
const [sigRes, auditRes] = await Promise.all([
  getEsignatures(moduleKey, record.Id),
  getAuditTrail({ moduleKey, recordNo: record.RecordNo }),
]);
        if (cancelled) return;
        setEsignatures(sigRes?.data || []);
        setAuditHist(auditRes?.data || []);
      } catch (err) {
        if (!cancelled) console.error("Failed to load workflow history", err);
      }
    })();
    return () => { cancelled = true; };
  }, [moduleKey, record.Id, record.RecordNo]);

  // Escape se close
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !pendingAction) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, pendingAction]);

  if (!cfg) return null;

  const curIdx = cfg.wf.indexOf(record.Status);
  const locked = cfg.closedStates.includes(record.Status) || record.Status === "Rejected";
  const nextStage = curIdx >= 0 && curIdx + 1 < cfg.wf.length ? cfg.wf[curIdx + 1] : null;

  const confirmSign = async (typedName) => {
    const res = await advanceState(moduleKey, record.Id, pendingAction.newStatus, typedName);
    if (!res?.success) throw new Error(res?.message || "Signature rejected");
    showToast({ icon: "success", title: `${record.RecordNo} → ${pendingAction.newStatus}` });
    onStatusChanged(pendingAction.newStatus);
    setPendingAction(null);
    // audit trail turant refresh ho jaye
    getAuditTrail({ moduleKey, recordNo: record.RecordNo }).then((r) => setAuditHist(r?.data || []));
    getEsignatures(moduleKey, record.Id).then((r) => setEsignatures(r?.data || []));
  };

  const handleLinkedCapa = async () => {
    try {
      const res = await createLinkedCapa(moduleKey, record.Id, "");
      if (res?.success) {
        showToast({ icon: "success", title: `CAPA created: ${res.capaRecordNo}` });
      }
    } catch (err) {
      alertError("CAPA Error", err.message || "Failed to create linked CAPA");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[250] flex items-start justify-center overflow-auto p-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-3xl p-6 my-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              {record.RecordNo}
              <span className={[
                "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                locked ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-700",
              ].join(" ")}>
                {record.Status}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              {cfg.moduleName} · Created by {record.CreatedBy || "—"} on {record.CreatedAt ? new Date(record.CreatedAt).toLocaleString() : "—"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-[18px] leading-none">✕</button>
        </div>

        {/* Progress bar */}
        <WorkflowProgressBar stages={cfg.wf} currentStatus={record.Status} />

        {/* Quick summary fields — extend as needed */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] border-t border-slate-100 pt-3 mt-1">
          {["Product", "BatchNo", "Department", "Classification", "OccurrenceDate", "TargetDate"]
            .filter((k) => record[k] !== undefined)
            .map((k) => (
              <div key={k} className="flex justify-between border-b border-dashed border-slate-100 py-1">
                <span className="text-slate-400">{k}</span>
                <span className="text-slate-700 font-medium">{String(record[k] ?? "-")}</span>
              </div>
            ))}
        </div>

        {/* Actions */}
        {!locked && (
          <div className="flex gap-2 flex-wrap mt-4">
            {nextStage && (
              <button
                onClick={() => setPendingAction({
                  newStatus: nextStage,
                  meaning: `Status change approval: ${record.Status} → ${nextStage}`,
                })}
                className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-semibold rounded-md"
              >
                → {nextStage}
              </button>
            )}
            <button
              onClick={() => setPendingAction({ newStatus: "Rejected", meaning: `Reject record: ${record.RecordNo}` })}
              className="h-8 px-3.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[12px] font-semibold rounded-md"
            >
              ⛛ Reject
            </button>
            {cfg.capaEligible && (
              <button
                onClick={handleLinkedCapa}
                className="h-8 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[12px] font-semibold rounded-md"
              >
                ➕ Linked CAPA
              </button>
            )}
          </div>
        )}
        {locked && (
          <div className="mt-4 text-[12px] text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 inline-block">
            🔒 Record closed — read only
          </div>
        )}

        {/* Signatures */}
        {esignatures?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[12.5px] font-bold text-slate-600 mb-2">Electronic Signatures</h3>
            <div className="space-y-1.5">
              {esignatures.map((s) => (
                <div key={s.id} className="text-[11.5px] bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
                  ✍️ <b>{s.meaning_text}</b> — {s.signed_by}{s.signed_role ? ` (${s.signed_role})` : ""} @ {new Date(s.signed_at).toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit trail */}
        <div className="mt-5">
          <h3 className="text-[12.5px] font-bold text-slate-600 mb-2">Audit Trail</h3>
          {auditHist === null ? (
            <p className="text-[11.5px] text-slate-400">Loading…</p>
          ) : auditHist.length === 0 ? (
            <p className="text-[11.5px] text-slate-400">No history yet.</p>
          ) : (
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <table className="w-full text-[11.5px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-2.5 py-1.5 font-semibold text-slate-500">Timestamp</th>
                    <th className="text-left px-2.5 py-1.5 font-semibold text-slate-500">User</th>
                    <th className="text-left px-2.5 py-1.5 font-semibold text-slate-500">Action</th>
                    <th className="text-left px-2.5 py-1.5 font-semibold text-slate-500">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditHist.slice(0, 15).map((a) => (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="px-2.5 py-1.5 text-slate-500 whitespace-nowrap">{new Date(a.performed_at).toLocaleString()}</td>
                      <td className="px-2.5 py-1.5 text-slate-600">{a.performed_by}</td>
                      <td className="px-2.5 py-1.5 text-slate-600">{a.action_type}</td>
                      <td className="px-2.5 py-1.5 text-slate-500">{a.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {pendingAction && (
        <ESignDialog
          meaning={pendingAction.meaning}
          signingAsLabel={`${user?.user_name || user?.user_id || "Unknown"}${user?.role ? " · " + user.role : ""}`}
          onConfirm={confirmSign}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}
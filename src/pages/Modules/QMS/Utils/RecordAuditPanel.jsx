export default function RecordAuditPanel({ history, loading }) {
  const signatures = history?.signatures || [];
  const audit = history?.audit || [];
const fmt = (d) =>
    d ? new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }) : "—";

  if (loading) return <div className="p-6 text-[12px] text-[#64748b]">Loading history…</div>;
  if (!history) return <div className="p-6 text-[12px] text-[#64748b]">Save the record to view its audit trail.</div>;

  return (
    <div className="flex flex-col gap-[8px]">
      {/* E-SIGNATURES */}
      {/* <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm">
        <div className="px-[14px] py-[7px] border-b border-[#dde1ea] bg-[#f8fafc] rounded-t-[5px] flex items-center gap-2.5">
          <div className="w-[18px] h-[18px] rounded-[3px] bg-[#e2e8f4] flex items-center justify-center text-[11px]">🔏</div>
          <h3 className="text-[11.5px] font-bold uppercase tracking-[0.4px] text-[#334155]">
            Electronic Signatures ({signatures.length})
          </h3>
        </div>
        <div className="p-[10px] flex flex-col gap-[6px]">
          {signatures.length === 0 && <div className="text-[11px] text-[#94aabf] px-1">No signatures yet.</div>}
          {signatures.map((s, i) => (
            <div key={i} className="flex items-start gap-2 border border-[#eef1f7] rounded-[5px] px-[10px] py-[6px] bg-[#fafbfd]">
              <span className="text-[12px] leading-[16px]">🔏</span>
              <div className="min-w-0">
                <div className="text-[11.5px] font-semibold text-[#0f172a]">{s.MeaningText}</div>
                <div className="text-[10px] text-[#64748b]">
                  {s.SignedBy}{s.SignedRole ? ` (${s.SignedRole})` : ""} · {fmt(s.SignedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div> */}

      {/* AUDIT TRAIL */}
      <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm flex-1">
        <div className="px-[14px] py-[7px] border-b border-[#dde1ea] bg-[#f8fafc] rounded-t-[5px] flex items-center gap-2.5">
          <div className="w-[18px] h-[18px] rounded-[3px] bg-[#e2e8f4] flex items-center justify-center text-[11px]">📜</div>
          <h3 className="text-[11.5px] font-bold uppercase tracking-[0.4px] text-[#334155]">
            Audit Trail ({audit.length})
          </h3>
        </div>
        <div className="p-[10px] overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#f1f5fb] text-[#475569]">
                <th className="text-left font-semibold px-2 py-1.5 border-b border-[#dde1ea] w-[150px]">Timestamp</th>
                <th className="text-left font-semibold px-2 py-1.5 border-b border-[#dde1ea] w-[110px]">User</th>
                <th className="text-left font-semibold px-2 py-1.5 border-b border-[#dde1ea] w-[90px]">Action</th>
                <th className="text-left font-semibold px-2 py-1.5 border-b border-[#dde1ea]">Details</th>
              </tr>
            </thead>
            <tbody>
              {audit.length === 0 && (
                <tr><td colSpan={4} className="px-2 py-3 text-[#94aabf]">No audit entries.</td></tr>
              )}
              {[...audit].reverse().map((r, i) => (
                <tr key={i} className={i % 2 ? "bg-[#fafbfd]" : ""}>
                  <td className="px-2 py-1.5 border-b border-[#f0f2f7] align-top whitespace-nowrap text-[#64748b]">{fmt(r.PerformedAt)}</td>
                  <td className="px-2 py-1.5 border-b border-[#f0f2f7] align-top">
                    <div className="font-semibold text-[#0f172a]">{r.PerformedBy}</div>
                    <div className="text-[9.5px] text-[#94aabf]">{r.PerformedRole || "—"}</div>
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#f0f2f7] align-top">
                    <span className={`px-1.5 py-[1px] rounded-[3px] text-[9.5px] font-bold ${
                      r.ActionType === "CREATE" ? "bg-emerald-50 text-emerald-600" :
                      r.ActionType === "DELETE" ? "bg-rose-50 text-rose-600" :
                      r.ActionType === "STATUS_CHANGE" ? "bg-blue-50 text-blue-600" :
                      "bg-slate-100 text-slate-500"
                    }`}>{r.ActionType}</span>
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#f0f2f7] align-top text-[#334155] break-words">{r.Details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
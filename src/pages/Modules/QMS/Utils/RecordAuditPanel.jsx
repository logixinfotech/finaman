import { useState, useMemo } from "react";
import {
  FaHistory, FaSearch, FaTimes, FaSignature, FaArrowRight, FaCalendarAlt,
  FaPlusCircle, FaPen, FaExchangeAlt, FaLink, FaPaperclip, FaTrash, FaChevronDown,
} from "react-icons/fa";

const ACTION = {
  CREATE:        { label: "Created",      Icon: FaPlusCircle,  c: "#2f9e7e", bg: "#e8f5f0" },
  UPDATE:        { label: "Updated",      Icon: FaPen,         c: "#5b6b85", bg: "#eef1f8" },
  STATUS_CHANGE: { label: "Stage Change", Icon: FaExchangeAlt, c: "#3b6fd4", bg: "#eaf1fd" },
  LINK:          { label: "Linked",       Icon: FaLink,        c: "#7a5cd6", bg: "#f0ecfb" },
  ATTACH:        { label: "Attachment",   Icon: FaPaperclip,   c: "#c98a2e", bg: "#fdf4e6" },
  DELETE:        { label: "Deleted",      Icon: FaTrash,       c: "#c25a5a", bg: "#fbeded" },
};
const of = (a) => ACTION[a] || { label: a || "Action", Icon: FaPen, c: "#5b6b85", bg: "#eef1f8" };

function parseDetails(text) {
  const raw = String(text || "").trim();
  if (!raw) return { rows: [], plain: "" };
  const parts = raw.split(/;\s*(?=[A-Za-z][A-Za-z0-9 _/().&-]{0,60}:)/g);
  const rows = [];
  parts.forEach((p) => {
    const m = p.match(/^([^:]{1,60}):\s*(.*)$/s);
    if (!m) return;
    const arrow = m[2].trim().split(/\s*(?:→|->)\s*/);
    rows.push(arrow.length === 2
      ? { field: m[1].trim(), from: clean(arrow[0]), to: clean(arrow[1]) }
      : { field: m[1].trim(), note: clean(m[2]) });
  });
  return rows.length ? { rows, plain: "" } : { rows: [], plain: raw };
}
const clean = (s) => String(s || "").replace(/^['"]|['"]$/g, "").trim() || "—";
const pretty = (k) => String(k).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim();

const Val = ({ children, old }) => (
  <span className={`inline-block max-w-[240px] truncate align-bottom px-[6px] py-[1px] rounded-[3px] text-[11px] font-medium ${
        old ? "bg-[#f4f6fa] text-[#94a3b8] line-through decoration-[#cbd5e1]"
            : "bg-[#eaf1fd] text-[#2f63c4]"}`}
        title={typeof children === "string" ? children : undefined}>
    {children}
  </span>
);

export default function RecordAuditPanel({ history, loading }) {
  const signatures = history?.signatures || [];
  const audit = history?.audit || [];
  const [q, setQ] = useState("");
  const [action, setAction] = useState("All");
  const [expanded, setExpanded] = useState({});

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN",
    { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—";
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("en-IN",
    { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "";

  const actionsPresent = useMemo(
    () => ["All", ...new Set(audit.map((r) => r.ActionType).filter(Boolean))], [audit]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return [...audit].reverse().filter((r) => {
      if (action !== "All" && r.ActionType !== action) return false;
      if (!n) return true;
      return [r.PerformedBy, r.PerformedRole, r.ActionType, r.Details]
        .some((v) => String(v || "").toLowerCase().includes(n));
    });
  }, [audit, q, action]);

  // date-wise grouping
  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const k = fmtDate(r.PerformedAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    });
    return [...map.entries()];
  }, [filtered]);

  if (loading) return <div className="p-6 text-[12px] text-[#64748b]">Loading history…</div>;
  if (!history) return <div className="p-6 text-[12px] text-[#64748b]">Save the record to view its audit trail.</div>;

  const counts = audit.reduce((a, r) => ({ ...a, [r.ActionType]: (a[r.ActionType] || 0) + 1 }), {});

  return (
    <div className="flex flex-col gap-[8px]">

      {/* ═══ SUMMARY STRIP ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-[8px]">
        {[
          { label: "Total Entries", value: audit.length, c: "#3b6fd4" },
          { label: "Field Changes", value: counts.UPDATE || 0, c: "#5b6b85" },
          { label: "Stage Changes", value: counts.STATUS_CHANGE || 0, c: "#2f9e7e" },
          { label: "E-Signatures", value: signatures.length, c: "#7a5cd6" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-[#dde1ea] rounded-[6px] px-[12px] py-[9px] shadow-sm">
            <div className="text-[9.5px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">{k.label}</div>
            <div className="text-[20px] font-bold leading-[24px] mt-[2px]" style={{ color: k.c }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ═══ E-SIGNATURES ═══ */}
      {signatures.length > 0 && (
        <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm">
          <div className="px-[14px] py-[7px] border-b border-[#dde1ea] bg-[#f8fafc] rounded-t-[5px] flex items-center gap-2.5">
            <div className="w-[18px] h-[18px] rounded-[3px] bg-[#f0ecfb] flex items-center justify-center text-[10px] text-[#6244b8]">
              <FaSignature />
            </div>
            <h3 className="text-[11.5px] font-bold uppercase tracking-[0.4px] text-[#334155]">Electronic Signatures</h3>
          </div>
          <div className="p-[10px] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[8px]">
            {signatures.map((s, i) => (
              <div key={i} className="border-l-[3px] border-[#7a5cd6] bg-[#fcfbff] border border-l-[3px] border-y-[#eee9fb] border-r-[#eee9fb] rounded-[5px] px-[11px] py-[8px]">
                <div className="text-[11px] font-semibold text-[#1e293b] leading-[15px]">{s.MeaningText || "Signed"}</div>
                <div className="flex items-baseline gap-2 mt-[5px]">
                  <span className="text-[12.5px] font-bold text-[#0f172a]">{s.SignedBy}</span>
                  <span className="text-[10px] text-[#94a3b8]">{s.SignedRole || "—"}</span>
                </div>
                <div className="text-[10.5px] text-[#64748b] mt-[1px]">
                  {fmtDate(s.SignedAt)} · {fmtTime(s.SignedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TIMELINE ═══ */}
      <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm flex-1">
        <div className="px-[14px] py-[7px] border-b border-[#dde1ea] bg-[#f8fafc] rounded-t-[5px] flex items-center gap-2.5">
          <div className="w-[18px] h-[18px] rounded-[3px] bg-[#e2e8f4] flex items-center justify-center text-[10px] text-[#54637a]">
            <FaHistory />
          </div>
          <h3 className="text-[11.5px] font-bold uppercase tracking-[0.4px] text-[#334155]">Audit Trail</h3>
          <span className="text-[10.5px] text-[#94a3b8] ml-auto">
            {filtered.length === audit.length ? "Newest first" : `${filtered.length} of ${audit.length}`}
          </span>
        </div>

        <div className="px-[12px] py-[8px] bg-[#fafbfd] border-b border-[#eef1f6] flex flex-wrap items-center gap-2">
          <div className="relative">
            <FaSearch className="absolute left-[8px] top-1/2 -translate-y-1/2 text-[10px] text-[#b6c2d6]" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
                   placeholder="Search user, field or value"
                   className="h-[26px] w-[230px] pl-[25px] pr-[24px] text-[12px] border-[1.5px] border-[#dbe2ee]
                              rounded-[5px] bg-white outline-none focus:border-[#1a56db]" />
            {q && (
              <button onClick={() => setQ("")}
                      className="absolute right-[7px] top-1/2 -translate-y-1/2 text-[#b6c2d6] hover:text-[#64748b]">
                <FaTimes className="text-[9px]" />
              </button>
            )}
          </div>
          <div className="flex gap-[2px] p-[2px] bg-[#eef2f9] rounded-[5px]">
            {actionsPresent.map((a) => (
              <button key={a} onClick={() => setAction(a)}
                      className={`h-[22px] px-[9px] text-[10.5px] font-semibold rounded-[3px] ${
                        action === a ? "bg-white text-[#1a56db] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                                     : "text-[#64748b] hover:text-[#1e293b]"}`}>
                {a === "All" ? "All" : of(a).label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-[12px]">
          {groups.length === 0 && (
            <div className="py-[30px] text-center text-[11.5px] text-[#94a3b8]">
              {audit.length ? "No entry matches this filter." : "No audit entries yet."}
            </div>
          )}

          {groups.map(([day, entries]) => (
            <div key={day}>
              {/* date band */}
              <div className="flex items-center gap-2 mb-[8px] mt-[4px]">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.5px]
                                 text-[#64748b] bg-[#eef1f8] px-[9px] py-[3px] rounded-full">
                  <FaCalendarAlt className="text-[8px]" /> {day}
                </span>
                <div className="flex-1 h-px bg-[#eef1f6]" />
                <span className="text-[10px] text-[#b6c2d6]">{entries.length} entr{entries.length > 1 ? "ies" : "y"}</span>
              </div>

              {/* timeline */}
              <div className="relative pl-[26px] pb-[6px]">
                <div className="absolute left-[9px] top-[6px] bottom-[6px] w-px bg-[#e3e8f0]" />

                {entries.map((r, i) => {
                  const meta = of(r.ActionType);
                  const id = `${day}-${i}`;
                  const { rows: diffs, plain } = parseDetails(r.Details);
                  const many = diffs.length > 3;
                  const open = !!expanded[id];
                  const shown = many && !open ? diffs.slice(0, 3) : diffs;

                  return (
                    <div key={id} className="relative pb-[10px] last:pb-0">
                      {/* node */}
                      <div className="absolute left-[-24px] top-[3px] w-[19px] h-[19px] rounded-full
                                      flex items-center justify-center border-2 border-white shadow-[0_0_0_1px_#e3e8f0]"
                           style={{ background: meta.bg, color: meta.c }}>
                        <meta.Icon className="text-[8.5px]" />
                      </div>

                      <div className="border border-[#e8edf6] rounded-[6px] bg-white overflow-hidden">
                        <div className="flex items-center gap-[9px] px-[11px] py-[6px] bg-[#fcfdfe] border-b border-[#f2f5fa]">
                          <span className="text-[10px] font-bold uppercase tracking-[0.4px] px-[7px] py-[2px] rounded-[3px] shrink-0"
                                style={{ background: meta.bg, color: meta.c }}>
                            {meta.label}
                          </span>
                          <span className="text-[12px] font-semibold text-[#1e293b] truncate">{r.PerformedBy}</span>
                          {r.PerformedRole && (
                            <span className="text-[10.5px] text-[#94a3b8] truncate">· {r.PerformedRole}</span>
                          )}
                          <span className="ml-auto text-[11px] font-medium text-[#64748b] shrink-0">
                            {fmtTime(r.PerformedAt)}
                          </span>
                        </div>

                        <div className="px-[11px] py-[6px]">
                          {plain && <p className="text-[12px] text-[#334155] leading-[17px]">{plain}</p>}
                          {!plain && diffs.length === 0 && (
                            <p className="text-[11.5px] text-[#94a3b8]">No further detail recorded.</p>
                          )}

                          {shown.map((d, j) => (
                            <div key={j} className="flex items-baseline gap-[8px] py-[3px]
                                                    border-b border-[#f6f8fb] last:border-b-0">
                              <span className="text-[11px] font-semibold text-[#64748b] w-[180px] shrink-0 truncate"
                                    title={pretty(d.field)}>{pretty(d.field)}</span>
                              {d.note !== undefined ? (
                                <span className="text-[11.5px] text-[#334155] break-words">{d.note}</span>
                              ) : (
                                <span className="flex items-center gap-[7px] flex-wrap min-w-0">
                                  <Val old>{d.from}</Val>
                                  <FaArrowRight className="text-[8px] text-[#b6c2d6] shrink-0" />
                                  <Val>{d.to}</Val>
                                </span>
                              )}
                            </div>
                          ))}

                          {many && (
                            <button onClick={() => setExpanded((e) => ({ ...e, [id]: !e[id] }))}
                                    className="mt-[4px] inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1a56db] hover:underline">
                              <FaChevronDown className={`text-[8px] transition-transform ${open ? "rotate-180" : ""}`} />
                              {open ? "Show less" : `${diffs.length - 3} more field(s)`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
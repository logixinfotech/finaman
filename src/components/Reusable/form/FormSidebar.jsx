import { useMemo, useState } from "react";
import { useERPFormMeta, useERPFormData } from "../../../theme/ERPFormContext";
import config from "../../../config";
import { FaProjectDiagram, FaPaperclip, FaChartPie, FaCloudUploadAlt, FaFileAlt, FaChevronDown } from "react-icons/fa";
import AttachmentPanel from "./AttachmentsPanel";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  }) : "—";

const fmtTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  }) : "";

/** 🆕 Hexagon stage-badge — done (green) / current (amber-yellow) / skip (gray, cut-line) / pending (outline gray) */
function StageHex({ state, index, size = 20 }) {
  const pts = [
    [size * 0.28, size * 0.04], [size * 0.72, size * 0.04],
    [size * 1.0, size * 0.5], [size * 0.72, size * 0.96],
    [size * 0.28, size * 0.96], [size * 0.0, size * 0.5],
  ].map((p) => p.join(",")).join(" ");

  const fill = {
    done: "#059669",     // emerald — complete
    current: "#d97706",  // amber/yellow — active
    skip: "#cbd5e1",     // gray — bypassed / not required
    pending: "#eef1f7",  // light gray — pending
  }[state];
  const stroke = state === "pending" ? "#c8d2e4" : "none";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 z-10">
      <polygon points={pts} fill={fill} stroke={stroke} strokeWidth="1.5" />
      {state === "done" && (
        <path d={`M${size * 0.27} ${size * 0.5} L${size * 0.42} ${size * 0.66} L${size * 0.75} ${size * 0.32}`}
          fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {state === "skip" && (
        <line x1={size * 0.24} y1={size * 0.24} x2={size * 0.76} y2={size * 0.76}
          stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" />
      )}
      {(state === "current" || state === "pending") && (
        <text x="50%" y="53%" textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.46} fontWeight="700" fill={state === "current" ? "white" : "#8b9ab5"}>
          {index}
        </text>
      )}
    </svg>
  );
}

/** Card — FormBody ke section card jaisa look */
function Card({ title, icon, children, bodyClass = "p-[12px]" }) {
  return (
    <div className="bg-white border border-[#dde1ea] rounded-[6px] shadow-sm overflow-hidden shrink-0">
      <div className="px-[12px] py-[7px] bg-[#eef4ff] border-b border-[#dde1ea] flex items-center gap-2">
        <div className="w-[17px] h-[17px] rounded-[3px] bg-[#dce6f5] flex items-center justify-center shrink-0">
          <span className="text-[9px] text-[#1a56db]">{icon}</span>
        </div>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.4px] text-[#1a56db]">{title}</h3>
      </div>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}

export default function FormSidebar() {
  const {
    isViewMode, sidebarName, sidebarSub, sidebarConfig = {},
    fileInputRef, handleFileChange, getInitials,
    moduleKey, workflowSidebarData, completionPercentage,
    stageHistory, stageRoles, recordHistory, isRecordClosed,
  } = useERPFormMeta();
  const { formData } = useERPFormData();

  const recordId = formData?.Id || null;
  const pct = sidebarConfig.completionPercentage ?? completionPercentage;

  // ── mode: workflow (QMS) ya classic (masters) ──
  const isWorkflowMode = !!workflowSidebarData;

  // 🆕 mobile accordion state — sidebar default collapsed rahega mobile pe
  const [mobileOpen, setMobileOpen] = useState(false);

  const last = useMemo(() => {
    const a = recordHistory?.audit || [];
    return a.length ? a[a.length - 1] : null;
  }, [recordHistory]);

  const displayTitle = formData[sidebarName];
  const displaySubtitle = formData[sidebarSub] || "—";
  const rawPhoto = sidebarConfig.photoUrl || formData.photo_url || formData.logo;
  const displayPhoto = (rawPhoto && typeof rawPhoto === "string")
    ? (rawPhoto.startsWith("data:") || rawPhoto.startsWith("http") || rawPhoto.startsWith("blob:")
      ? rawPhoto : `${config.apiUrl}${rawPhoto}`)
    : null;

  const R = 20, CIRC = 2 * Math.PI * R;

  // ═══════════════════════════════════════════════════════════════════
  //  CLASSIC MODE — Company Master, Employee Master, etc.
  // ═══════════════════════════════════════════════════════════════════
  if (!isWorkflowMode) {
    return (
      <div className="w-full lg:w-[220px] max-h-[42vh] lg:max-h-none bg-white border-b lg:border-b-0 lg:border-r border-[#dde1ea] flex flex-col overflow-hidden shrink-0 z-10">

        {/* 🆕 mobile-only collapsible summary header */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="lg:hidden flex items-center justify-between px-3 py-2.5 bg-[#f8fafc] border-b border-[#dde1ea]"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="w-[26px] h-[26px] rounded-full bg-[#dde3ef] flex items-center justify-center text-[10px] font-bold text-[#8a9ab5] shrink-0 overflow-hidden">
              {displayPhoto ? (
                <img src={displayPhoto} className="w-full h-full object-cover" alt="profile" />
              ) : (
                getInitials(displayTitle)
              )}
            </span>
            <span className="text-[12.5px] font-bold text-[#0f2137] truncate">{displayTitle || "Details"}</span>
            <span className="text-[11px] font-bold text-[#059669] shrink-0">{pct}%</span>
          </span>
          <FaChevronDown className={`text-[11px] text-[#8b9ab5] transition-transform shrink-0 ${mobileOpen ? "rotate-180" : ""}`} />
        </button>

        {/* 🆕 body — mobile pe conditional (open/collapsed), desktop pe hamesha visible */}
        <div className={`${mobileOpen ? "flex" : "hidden"} lg:flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide`}>
          {!sidebarConfig.hideHeader && (
            <div className="bg-[#f8fafc] border-b border-[#dde1ea] py-[18px] px-3 flex-col items-center hidden lg:flex">
              {!sidebarConfig.hidePhoto && (
                <>
                  <div
                    className="relative z-10 cursor-pointer w-[88px] h-[88px] rounded-full bg-[#dde3ef] border-[3px] border-[#dde1ea] flex items-center justify-center overflow-hidden group"
                    onClick={() => !isViewMode && fileInputRef.current?.click()}
                  >
                    {displayPhoto ? (
                      <img src={displayPhoto} className="w-full h-full object-cover" alt="profile" />
                    ) : (
                      <span className="text-[28px] font-bold text-[#8a9ab5] tracking-wider">
                        {getInitials(displayTitle)}
                      </span>
                    )}
                    {!isViewMode && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <FaCloudUploadAlt className="text-white text-xl" />
                      </div>
                    )}
                  </div>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                </>
              )}

              {displayTitle && (
                <h2 className="text-[15px] font-bold text-[#0f2137] text-center mt-2.5 truncate w-full px-1">
                  {displayTitle}
                </h2>
              )}
              {formData[sidebarSub] && (
                <h4 className="text-[10.5px] font-semibold text-[#718096] text-center mt-0.5 tracking-[0.4px] truncate w-full">
                  {displaySubtitle}
                </h4>
              )}

              {!sidebarConfig.hidePhoto && !isViewMode && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2.5 flex items-center justify-center gap-1.5 px-3.5 py-[5px] rounded border-none bg-[#1a56db] hover:bg-[#1647c0] text-white text-[11px] font-semibold transition-colors w-max"
                >
                  <FaCloudUploadAlt className="text-[13px]" /> Upload Image
                </button>
              )}
            </div>
          )}

          <div className="p-3 flex flex-col flex-1 bg-white">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-[12px] font-bold text-[#374151]">Completion</h3>
                <span className="text-[13px] font-bold text-[#059669]">{pct}%</span>
              </div>
              <div className="w-full bg-[#eef1f7] rounded-full h-1.5 mb-2 overflow-hidden">
                <div className="bg-[#059669] h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <hr className="border-[#dde1ea] mb-3" />

            {sidebarConfig.quickInfo?.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold tracking-[0.6px] text-[#94aabf] uppercase mb-2">Quick Info</h3>
                <div className="space-y-1.5">
                  {sidebarConfig.quickInfo.map((info, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-[#f0f2f7] pb-1 last:border-0 last:pb-0">
                      <span className="flex items-center gap-1.5 text-[#718096] text-[11px]">
                        {info.icon || <FaFileAlt className="text-[9px]" />} {info.label}
                      </span>
                      <span className="text-[#1a202c] font-bold text-[11px] truncate max-w-[100px]" title={info.value}>
                        {info.value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  WORKFLOW MODE — QMS modules
  // ═══════════════════════════════════════════════════════════════════
  return (
    // Workflow-mode wapas return wala outer div
    <div className="w-full lg:w-[248px] max-h-[42vh] lg:max-h-none bg-[#eef1f8] border-b lg:border-b-0 lg:border-r border-[#dde1ea] flex flex-col overflow-hidden shrink-0 z-10 font-['Inter','Segoe_UI',system-ui,Arial,sans-serif]">
      {/* 🆕 mobile-only collapsible summary header */}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="lg:hidden flex items-center justify-between px-3 py-2.5 bg-white border-b border-[#dde1ea]"
      >
        <span className="flex items-center gap-2 min-w-0">
          <FaProjectDiagram className="text-[12px] text-[#1a56db] shrink-0" />
          <span className="text-[12.5px] font-bold text-[#0f2137] truncate">
            Stage {(workflowSidebarData.currentStage ?? 0) + 1} of {workflowSidebarData.stages.length}
          </span>
          <span className="text-[11px] font-bold text-[#059669] shrink-0">{pct}%</span>
        </span>
        <FaChevronDown className={`text-[11px] text-[#8b9ab5] transition-transform shrink-0 ${mobileOpen ? "rotate-180" : ""}`} />
      </button>

      {/* 🆕 body — mobile pe conditional (open/collapsed), desktop pe hamesha visible */}
      <div className={`${mobileOpen ? "flex" : "hidden"} lg:flex flex-col gap-[8px] overflow-y-auto overflow-x-hidden scrollbar-hide p-[8px]`}>

        {/* ══ WORKFLOW ══ */}
        <Card title="Workflow" icon={<FaProjectDiagram />}>
          <div className="flex flex-col">
            {workflowSidebarData.stages.map((s, i) => {
              const skipped = (workflowSidebarData.skippedStages || []).includes(i);
              const done = !skipped && (i < workflowSidebarData.currentStage
                || (workflowSidebarData.isClosed && i <= workflowSidebarData.currentStage));
              const current = !done && !skipped && i === workflowSidebarData.currentStage;
              const isLast = i === workflowSidebarData.stages.length - 1;
              const h = stageHistory?.[s] || (i === 0 ? stageHistory?.__created : null);
              const state = skipped ? "skip" : done ? "done" : current ? "current" : "pending";  // 🆕

              return (
                <div key={s} className="flex items-start gap-2.5 relative h-[52px] shrink-0">
                  {!isLast && (
                    <div className={`absolute left-[9px] top-[21px] h-[32px] w-[2px] ${done ? "bg-emerald-400" : "bg-[#e2e8f4]"}`} />
                  )}
                  <StageHex state={state} index={i + 1} size={20} />

                  <div className="flex flex-col min-w-0 flex-1 h-[46px] overflow-hidden">
                    <span className={`text-[10.5px] leading-[15px] truncate uppercase tracking-[0.3px] ${skipped ? "text-[#8b9ab5] line-through"
                      : current ? "font-bold text-[#b45309]"
                        : done ? "font-semibold text-emerald-700"
                          : "text-[#8b9ab5]"}`}>
                      {s}
                    </span>
                    <span className="text-[11px] text-[#5b6b85] leading-[15px] truncate">
                      {skipped ? "Not required"
                        : h ? `${fmtDate(h.at)}, ${fmtTime(h.at)}`
                          : current ? `Pending — ${stageRoles?.[i]?.join(", ") || "in progress"}`
                            : "Pending"}
                    </span>
                    <span className="text-[11px] text-[#5b6b85] leading-[15px] truncate">
                      {h ? `By: ${h.by}` : "\u00A0"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ══ OVERALL COMPLETION ══ */}
        <Card title="Overall Completion" icon={<FaChartPie />}>
          <div className="flex items-center gap-3 h-[62px]">
            <div className="flex flex-col justify-center gap-[2px] min-w-0 flex-1 h-full">
              <span className="text-[12px] text-[#8b9ab5] uppercase tracking-[0.3px] font-semibold leading-[12px]">
                Last Updated
              </span>
              <span className="text-[10px] font-semibold text-[#1a202c] leading-[14px]">
                {last ? fmtDate(last.PerformedAt) : "—"}
              </span>
              <span className="text-[11px] text-[#5b6b85] leading-[13px]">
                {last ? fmtTime(last.PerformedAt) : "\u00A0"}
              </span>
              <span className="text-[11px] text-[#5b6b85] leading-[13px] truncate" title={last?.PerformedBy}>
                By: {last?.PerformedBy || "—"}
              </span>
            </div>

            <div className="relative shrink-0">
              <svg width="80" height="80" viewBox="0 0 56 56" className="-rotate-90">
                <circle cx="28" cy="28" r={R} fill="none" stroke="#eef1f7" strokeWidth="6" />
                <circle cx="28" cy="28" r={R} fill="none" stroke="#059669" strokeWidth="6"
                  strokeLinecap="round" strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - pct / 100)}
                  style={{ transition: "stroke-dashoffset .45s ease" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[13px] font-bold text-[#059669] leading-[14px]">{pct}%</span>
                <span className="text-[7.5px] text-[#94aabf] leading-[9px]">Done</span>
              </div>
            </div>
          </div>
        </Card>

        {/* ══ ATTACHMENTS ══ */}
        {sidebarConfig.showAttachments !== false && moduleKey && (
          <Card title="Attachments" icon={<FaPaperclip />} bodyClass="p-[10px] h-[196px]">
            <AttachmentPanel
              moduleKey={moduleKey}
              recordId={recordId}
              recordNo={formData?.RecordNo}
              readOnly={isViewMode || isRecordClosed}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
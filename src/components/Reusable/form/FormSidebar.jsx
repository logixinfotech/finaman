import { useERPFormMeta, useERPFormData } from "../../../theme/ERPFormContext";
import config from "../../../config";
import { FaCloudUploadAlt, FaFileAlt } from "react-icons/fa";
export default function FormSidebar() {
  const {
    isViewMode, sidebarName, sidebarSub, sidebarConfig,
    fileInputRef, handleFileChange, getInitials,
    workflowSidebarData, completionPercentage, stageHistory, stageEntered, // 🆕
  } = useERPFormMeta();
  const { formData } = useERPFormData();

  const displayTitle = formData[sidebarName];
  const displaySubtitle = formData[sidebarSub] || "—";
  const rawPhoto = sidebarConfig.photoUrl || formData.photo_url || formData.logo;

  const displayPhoto = (rawPhoto && typeof rawPhoto === "string")
    ? (rawPhoto.startsWith("data:") || rawPhoto.startsWith("http") || rawPhoto.startsWith("blob:")
      ? rawPhoto
      : `${config.apiUrl}${rawPhoto}`)
    : null;

  return (
    <div className="w-full md:w-[220px] bg-white border-r border-[#dde1ea] flex flex-col overflow-y-auto overflow-x-hidden shrink-0 scrollbar-hide z-10">
      
      {!sidebarConfig.hideHeader && (
        <div className="bg-[#f8fafc] border-b border-[#dde1ea] py-[18px] px-3 flex flex-col items-center">
          {!sidebarConfig.hidePhoto && (
            <>
              <div
                className="relative z-10 cursor-pointer w-[88px] h-[88px] rounded-full bg-[#dde3ef] border-[3px] border-[#dde1ea] flex items-center justify-center overflow-hidden group"
                onClick={() => !isViewMode && fileInputRef.current?.click()}
              >
                {displayPhoto ? (
                  <img src={displayPhoto} className="w-full h-full object-cover" alt="profile" />
                ) : (
                  <span className="text-[28px] font-bold text-[#8a9ab5] tracking-wider">{getInitials(displayTitle)}</span>
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
            <h2 className="text-[15px] font-bold text-[#0f2137] text-center mt-2.5 truncate w-full px-1">{displayTitle}</h2>
          )}
          {formData[sidebarSub] && (
            <h4 className="text-[10.5px] font-semibold text-[#718096] text-center mt-0.5 tracking-[0.4px] truncate w-full">{displaySubtitle}</h4>
          )}

          {!sidebarConfig.hidePhoto && !isViewMode && (
            <button onClick={() => fileInputRef.current?.click()} className="mt-2.5 flex items-center justify-center gap-1.5 px-3.5 py-[5px] rounded border-none bg-[#1a56db] hover:bg-[#1647c0] text-white text-[11px] font-semibold transition-colors w-max">
              <FaCloudUploadAlt className="text-[13px]" /> Upload Image
            </button>
          )}
        </div>
      )}

      <div className="p-3 flex flex-col flex-1 bg-white">
        {/* 🆕 Workflow progress — sirf tab dikhega jab workflowConfig pass hua ho */}
        {workflowSidebarData && (
          <div className="mb-4">
            <h3 className="text-[10px] font-bold tracking-[0.6px] text-[#94aabf] uppercase mb-2">Workflow</h3>
            <div className="flex flex-col gap-0">
              {workflowSidebarData.stages.map((s, i) => {
                const done = i < workflowSidebarData.currentStage
                  || (workflowSidebarData.isClosed && i <= workflowSidebarData.currentStage);
                const current = !done && i === workflowSidebarData.currentStage;
                const isLastStage = i === workflowSidebarData.stages.length - 1;
                return (
                  <div key={s} className="flex items-start gap-2 pb-2 relative">
                    {!isLastStage && (
                      <div
                        className={`absolute left-[9px] top-[18px] bottom-0 w-[1.5px] ${done ? "bg-emerald-400" : "bg-[#e2e8f4]"}`}
                      />
                    )}
                    <div
                      className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 z-10 ${done
                        ? "bg-emerald-500 text-white"
                        : current
                          ? "bg-[#1a56db] text-white"
                          : "bg-[#eef1f7] text-[#94aabf]"
                        }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[11px] leading-[18px] ${current ? "font-bold text-[#1a56db]" : done ? "text-emerald-600" : "text-[#94aabf]"}`}>
                        {s}
                      </span>
                      {(() => {
                        const h = stageHistory?.[s]          // isne stage complete kiya
                          || stageEntered?.[s]           // ya isne stage me daala (current)
                          || (i === 0 ? stageHistory?.__created : null);
                        if (!h) return null;
                        return (
                          <span className="text-[9px] text-[#94aabf] leading-[12px] truncate">
                           {h.by} · {new Date(h.at).toLocaleString("en-IN", {
                              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                              timeZone: "Asia/Kolkata",
                            })}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
            <hr className="border-[#dde1ea] mt-1 mb-3" />
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-[12px] font-bold text-[#374151]">Completion</h3>
            <span className="text-[13px] font-bold text-[#059669]">
              {sidebarConfig.completionPercentage ?? completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-[#eef1f7] rounded-full h-1.5 mb-2 overflow-hidden">
            <div
              className="bg-[#059669] h-1.5 rounded-full transition-all"
              style={{ width: `${sidebarConfig.completionPercentage ?? completionPercentage}%` }}
            ></div>
          </div>
        </div>
        <hr className="border-[#dde1ea] mb-3" />
        {sidebarConfig.quickInfo && sidebarConfig.quickInfo.length > 0 && (
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
  );
}

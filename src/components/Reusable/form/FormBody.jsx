import { memo } from "react";
import { useERPFormMeta, useERPFormData } from "../../../theme/ERPFormContext";
import { useFieldNavigation } from "../../../Hooks/useFormHandlers";
import FieldRenderer from "./FieldRenderer";

const FormFieldRow = memo(function FormFieldRow({ fieldObj, index = 0, forceDisabled = false  }) {
const { isViewMode, requiredFields, myRequiredKeys, widthConfig } = useERPFormMeta(); 
 const { formData, errors, handleChange, handleDomainSelect, focusedEmailField, setFocusedEmailField } = useERPFormData();

  const key = fieldObj.key;
  const label = fieldObj.label ?? key;
  const nameStr = label.toLowerCase();

  let colSpanClass = "col-span-1";
  if (nameStr.includes("address line") || (nameStr.includes("name") && !nameStr.includes("first") && !nameStr.includes("last")) || nameStr.includes("remarks") || fieldObj.type === "textarea") {
    colSpanClass = "col-span-2";
  } else if (nameStr.includes("email") || nameStr.includes("bank name") || nameStr.includes("qualification")) {
    colSpanClass = "col-span-1 sm:col-span-2";
  }
  if (widthConfig[label] || widthConfig[key]) colSpanClass = widthConfig[label] || widthConfig[key];
  if (fieldObj.breakAfter) colSpanClass += " [&:not(:last-child)]:mr-auto";

  const isEmailInput = fieldObj.type === "email" || nameStr.includes("email") || nameStr.includes("alt email");
  const emailValue = formData[key] ?? "";
  const isEmailFocused = focusedEmailField === key;
  const showEmailSuggestions = isEmailFocused && isEmailInput && emailValue.length > 0 &&
    !emailValue.match(/@(gmail\.com|yahoo\.com|outlook\.com)$/i);

  const zIndexStyle = { zIndex: isEmailFocused ? 9999 : 50 - index };

  return (
    <div key={key} id={`field-container-${key}`} style={zIndexStyle} className={`flex flex-col gap-[3px] w-full relative overflow-visible ${colSpanClass}`}>
      <label className="text-[#1e293b] font-semibold text-[12px] tracking-[0.1px] flex items-center mb-[2px]">
        {label}
        {(myRequiredKeys?.length ? myRequiredKeys : requiredFields).includes(key) && (
          <span className="text-[#dc2626] ml-[2px] text-[12px] leading-none">*</span>
        )}
      </label>
      <div
        className="w-full relative flex flex-col overflow-visible"
        onFocusCapture={() => { if (isEmailInput && !isViewMode) setFocusedEmailField(key); }}
        onBlurCapture={() => { if (isEmailInput) setTimeout(() => setFocusedEmailField(null), 250); }}
      >
        <FieldRenderer
          fieldObj={fieldObj}
          value={formData[key] ?? ""}
          disabled={isViewMode || fieldObj.disabled || forceDisabled} 
          onChange={(val) => handleChange(key, val, fieldObj)}
          error={errors[key]}
          className={`w-full h-[28px] px-[5px] text-[12.5px] border-[1.5px] border-[#c8d2e4] rounded-[5px] bg-[#fafbfd] outline-none transition-all font-['Segoe_UI',system-ui,Arial,sans-serif] ${isViewMode ? "bg-[#f0f3f8] text-[#64748b] border-[#e2e8f4] cursor-default" : "text-[#0f172a] focus:border-[#1a56db] focus:bg-[#ffffff] focus:ring-[3px] focus:ring-[#1a56db]/10 hover:border-[#a0b0c8]"}`}
        />
        {isEmailInput && showEmailSuggestions && (
          <div className="flex gap-1.5 mt-1 bg-white p-1 rounded border border-[#c8d2e4] w-max shadow-md z-[99999] absolute top-[100%] left-0">
            {["@gmail.com", "@yahoo.com", "@outlook.com"].map((domain) => {
              const parts = emailValue.split('@');
              if (parts.length > 1 && parts[1] && !domain.startsWith(`@${parts[1].toLowerCase()}`)) return null;
              return (
                <button key={domain} type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleDomainSelect(key, domain, fieldObj); }}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-[#1a56db] hover:text-white text-slate-700 border border-slate-200 rounded transition-colors cursor-pointer">
                  {domain}
                </button>
              );
            })}
          </div>
        )}
        {errors[key] && !showEmailSuggestions && (
          <div className="absolute left-0 top-[100%] z-[40] mt-[2px] pointer-events-none">
            <div className="bg-[#dc2626] text-white text-[10px] px-1.5 py-[2px] rounded-[3px] shadow whitespace-nowrap font-medium pointer-events-auto">
              {errors[key]}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const FormCard = memo(function FormCard({ sectionTitle, fields, isLast, globalIndex = 0 }) {
  const { getHeaderStyle, configs, sectionAccess } = useERPFormMeta();
  const { formData } = useERPFormData();
  const headerStyle = getHeaderStyle(sectionTitle);
  const access = sectionAccess?.[sectionTitle] || null;
  const isLocked = access?.state === "locked";
    const isPending = access?.state === "pending";   
   const isDone = access?.state === "done";
  const getGridConfig = (t) => configs[t] || "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4";
return (
    <div style={{ zIndex: 100 - globalIndex }} className={`bg-white w-full flex flex-col border border-[#dde1ea] rounded-[6px] shadow-sm shrink-0 relative overflow-visible ${isLast ? 'flex-1' : ''} ${isLocked ? 'opacity-90' : ''}`}>
      <div className={`px-[14px] py-[7px] shrink-0 flex items-center justify-between border-b ${headerStyle.border} ${headerStyle.barBg} rounded-t-[5px]`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-[18px] h-[18px] rounded-[3px] flex items-center justify-center text-[11px] shadow-sm ${headerStyle.iconBg}`}>{headerStyle.icon}</div>
          <h3 className={`text-[11.5px] font-bold uppercase tracking-[0.4px] ${headerStyle.text}`}>{sectionTitle}</h3>
        </div> 
     {access && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isDone ? "bg-emerald-50 text-emerald-600" :
            isPending ? "bg-slate-100 text-slate-500" :
            isLocked ? "bg-slate-100 text-slate-400" :
            "bg-amber-50 text-amber-600"
          }`}>
            {isDone ? "✓ Done"
              : isPending ? `⏳ ${access.role}`
              : isLocked ? `🔒 ${access.role}`
              : "✏ Your turn"}
          </span>
        )}
      </div>     
      <div className={`p-[14px] grid ${getGridConfig(sectionTitle)} gap-x-[12px] gap-y-[5px] content-start items-start flex-1 overflow-visible`}>
        {(fields || []).map((fieldObj, index) => {
          if (fieldObj.showIf && !fieldObj.showIf(formData)) return null;
          if (fieldObj.type === "row-break") return <div key={`break-${index}`} className="col-span-full h-0" />;
          if (fieldObj.type === "section-divider") {
            return (
              <div key={`${fieldObj.label}-${index}`} className="col-span-full mt-2 mb-1 flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-[#64748b]">
                  <span className="text-[11px] font-bold uppercase tracking-[0.5px]">{fieldObj.label}</span>
                </div>
                <div className="flex-1 h-px bg-[#dde1ea]"></div>
              </div>
            );
          } 
          return <FormFieldRow key={fieldObj.key} fieldObj={fieldObj} index={index} forceDisabled={isLocked || isDone || isPending}/>;
        })}
      </div>
    </div>
  );
});

export default function FormBody() {
const { hideTabBar, tabs, tabLabels, activeTab, setActiveTab, completedTabs, TabIcon, customTabs, fieldGroups, scrollContainerRef } = useERPFormMeta();  const handleKeyDown = useFieldNavigation();

  const groupData = fieldGroups[activeTab];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#eef1f8] overflow-visible">
     {!hideTabBar && (
        <div className="flex items-end gap-[3px] px-[14px] pt-[7px] bg-[#e8edf7] border-b border-[#c8d4e8] shrink-0 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const isCompleted = completedTabs.includes(tab);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex items-center gap-[7px] px-[15px] pt-[8px] pb-[7px] text-[12.5px] cursor-pointer whitespace-nowrap outline-none rounded-t-[7px] border border-b-0 transition-all duration-150 ${
                  isActive
                    ? "bg-white border-[#c8d4e8] text-[#1a56db] font-bold shadow-[0_-1px_3px_rgba(15,23,42,0.06)] mb-[-1px] pb-[8px] z-10"
                    : "bg-[#f4f7fc] border-transparent text-[#5b6b85] font-semibold hover:bg-[#fbfcfe] hover:text-[#1e293b]"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-0 right-0 h-[2.5px]   rounded-t-[7px]" />
                )}
                <span className={`flex items-center justify-center text-[13px] ${isActive ? "text-[#1a56db]" : "text-[#8b9ab5]"}`}>
                  <TabIcon tab={tab} />
                </span>
                <span>{tabLabels?.[tab] || tab.replace(/_/g, " ")}</span>
                {isCompleted && (
                  <span className="w-[15px] h-[15px] rounded-full bg-[#059669] text-white text-[9px] font-bold flex items-center justify-center">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div id={`tab-content-${activeTab}`} ref={scrollContainerRef} className="flex-1 p-[8px] overflow-y-auto overflow-x-hidden min-h-0 flex flex-col" onKeyDown={handleKeyDown}>
        {customTabs[activeTab] ? customTabs[activeTab] : Array.isArray(groupData) ? (
          <div className="flex flex-col gap-[2px] flex-1 overflow-visible">
            {groupData.map((row, rowIndex) => {
              let gIdx = 0;
              return (
                <div key={`row-${rowIndex}`} className="flex flex-col lg:flex-row gap-[2px] items-stretch overflow-visible">
                  {row.map(([secTitle, fields]) => {
                    const globalIndex = gIdx++;
                    return (
                      <div key={secTitle} className="flex-1 min-w-0 overflow-visible flex flex-col">
                        <FormCard sectionTitle={secTitle} fields={fields} isLast={rowIndex === groupData.length - 1} globalIndex={globalIndex} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          (() => {
            const entries = Object.entries(groupData || {});
            const leftCol = [], rightCol = [];
            entries.forEach(([secTitle, fields], index) => {
              const item = { secTitle, fields, globalIndex: index };
              if (index % 2 === 0) leftCol.push(item); else rightCol.push(item);
            });
            return (
              <div className="flex flex-col lg:flex-row gap-[8px] flex-1 items-stretch overflow-visible">
                <div className="flex-1 flex flex-col gap-[8px] min-w-0 overflow-visible">
                  {leftCol.map((item, i) => <FormCard key={item.secTitle} sectionTitle={item.secTitle} fields={item.fields} isLast={i === leftCol.length - 1} globalIndex={item.globalIndex} />)}
                </div>
                {rightCol.length > 0 && (
                  <div className="flex-1 flex flex-col gap-[8px] min-w-0 overflow-visible">
                    {rightCol.map((item, i) => <FormCard key={item.secTitle} sectionTitle={item.secTitle} fields={item.fields} isLast={i === rightCol.length - 1} globalIndex={item.globalIndex} />)}
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
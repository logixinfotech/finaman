import React from "react";

/**
 * Horizontal form tab strip (Employee Master style).
 *  - tabs:         [{ id, label, icon?, complete? }] — `complete: true` shows the green ✓ tick
 *  - activeTab:    id of the selected tab
 *  - onChange:     (id) => void
 *  - rightContent: optional node pinned to the right end of the strip
 */
const ERPTabBar = ({ tabs = [], activeTab, onChange, rightContent, className = "" }) => (
  <div
    className={`flex items-end gap-0 px-[6px] bg-white border-b-2 border-[#e1e7f2] shrink-0 w-full overflow-x-auto no-scrollbar ${className}`}
  >
    {tabs.map((tab) => {
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange?.(tab.id)}
          title={tab.label}
          className={`flex items-center gap-[6px] px-[12px] sm:px-[16px] pt-[10px] pb-[9px] text-[12px] font-semibold cursor-pointer border-b-2 mb-[-2px] transition-all duration-150 whitespace-nowrap outline-none shrink-0 ${isActive
            ? "text-[#1a56db] border-[#1a56db]"
            : "text-[#64748b] border-transparent hover:text-[#334155] hover:border-[#c4cfe4]"
            }`}
        >
          {tab.icon && (
            <div
              className={`w-[20px] h-[20px] rounded-[5px] flex items-center justify-center text-[14px] ${isActive ? "bg-[#eef3fd]" : "bg-transparent"}`}
            >
              {tab.icon}
            </div>
          )}
          <span className={tab.icon ? "hidden sm:inline" : ""}>{tab.label}</span>
          {tab.complete !== undefined && (
            <div
              className={`hidden sm:flex w-[16px] h-[16px] rounded-[8px] bg-[#059669] text-white text-[9px] font-bold items-center justify-center ml-1 ${tab.complete ? "opacity-100" : "opacity-0"}`}
            >
              ✓
            </div>
          )}
        </button>
      );
    })}
    {rightContent && <div className="ml-auto pl-2 self-center shrink-0">{rightContent}</div>}
  </div>
);

export default ERPTabBar;

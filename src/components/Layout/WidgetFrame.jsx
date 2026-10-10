// components/Layout/HomeDashboard/WidgetFrame.jsx
import { FaGripVertical, FaEye, FaEyeSlash, FaExpandAlt } from "react-icons/fa";

const SPAN_LABEL = { 1: "S", 2: "M", 3: "L" };

export default function WidgetFrame({
  title, editing, visible, span,
  onToggle, onResize, children,
}) {
  return (
    <div className={`h-full flex flex-col bg-white rounded-xl border overflow-hidden transition
      ${editing ? "border-dashed border-[#0f5c6e]/40 shadow-sm" : "border-gray-100"}
      ${!visible ? "opacity-50" : ""}`}>

      {/* Header bar: edit mode mein controls yahin, content ke upar overlap nahi */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-gray-50">
        <div className="flex items-center gap-2 min-w-0">
          {editing && <FaGripVertical size={11} className="text-gray-300 cursor-grab flex-shrink-0" />}
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 truncate">{title}</p>
        </div>
        {editing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onResize} title="Resize"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-gray-500 hover:bg-gray-100">
              <FaExpandAlt size={9} /> {SPAN_LABEL[span]}
            </button>
            <button onClick={onToggle} title={visible ? "Hide" : "Show"}
              className="p-1 rounded text-gray-500 hover:bg-gray-100">
              {visible ? <FaEye size={11} /> : <FaEyeSlash size={11} />}
            </button>
          </div>
        )}
      </div>

      {/* Content: scroll ho sakta hai, kabhi bahar nahi nikalega */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        {children}
      </div>
    </div>
  );
}
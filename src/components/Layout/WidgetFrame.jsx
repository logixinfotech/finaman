// // components/Layout/HomeDashboard/WidgetFrame.jsx
// import { FaGripVertical, FaEye, FaEyeSlash, FaExpandAlt } from "react-icons/fa";

// const SPAN_LABEL = { 1: "S", 2: "M", 3: "L" };

// export default function WidgetFrame({
//   title, editing, visible, span,
//   onToggle, onResize, children,
// }) {
//   return (
//     <div className={`h-full flex flex-col bg-white rounded-xl border overflow-hidden transition
//       ${editing ? "border-dashed border-[#0f5c6e]/40 shadow-sm" : "border-gray-100"}
//       ${!visible ? "opacity-50" : ""}`}>

//       {/* Header bar: edit mode mein controls yahin, content ke upar overlap nahi */}
//       <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-gray-50">
//         <div className="flex items-center gap-2 min-w-0">
//           {editing && <FaGripVertical size={11} className="text-gray-300 cursor-grab flex-shrink-0" />}
      
//         </div>
//         {editing && (
//           <div className="flex items-center gap-1 flex-shrink-0">
//             <button onClick={onResize} title="Resize"
//               className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-gray-500 hover:bg-gray-100">
//               <FaExpandAlt size={9} /> {SPAN_LABEL[span]}
//             </button>
//             <button onClick={onToggle} title={visible ? "Hide" : "Show"}
//               className="p-1 rounded text-gray-500 hover:bg-gray-100">
//               {visible ? <FaEye size={11} /> : <FaEyeSlash size={11} />}
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Content: scroll ho sakta hai, kabhi bahar nahi nikalega */}
//       <div className="flex-1 min-h-0 overflow-auto p-3">
//         {children}
//       </div>
//     </div>
//   );
// }
import { FaEye, FaEyeSlash, FaExpandAlt } from "react-icons/fa";

export default function WidgetFrame({
  title, hasOwnTitle, editing, visible, span, onToggle, onResize, children,
}) {
  // header bar sirf tab jab widget ka apna title NAHI hai
  const showHeader = !hasOwnTitle;

  return (
    <div
      className={`relative h-full flex flex-col rounded-xl  border border-gray-100 bg-white overflow-hidden ${
        !visible ? "opacity-50" : "",
        showHeader?"p-2":""
      }`}
    >
      {/* header bar: sirf jinka apna title nahi */}
      {showHeader && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <p className="text-[12px] font-bold tracking-wide uppercase text-gray-700">{title}</p>
        </div>
      )}

      {/* edit controls: floating, header area nahi leta */}
      {editing && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-lg bg-white/95 shadow border border-gray-200 px-1.5 py-1">
          <button
            onClick={onResize}
            title={`Width: ${span}/3 (click to change)`}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100"
          >
            <FaExpandAlt size={11} />
          </button>
          <button
            onClick={onToggle}
            title={visible ? "Hide widget" : "Show widget"}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100"
          >
            {visible ? <FaEye size={12} /> : <FaEyeSlash size={12} />}
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  );
}
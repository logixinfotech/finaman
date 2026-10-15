//  // components/Layout/HomeDashboard/CustomizableHomeDashboard.jsx
// import { useEffect, useMemo, useRef, useState } from "react";
// import { FaCog, FaCheck } from "react-icons/fa";
// import { fetchSidebarMenu, fetchDashboardLayout, saveDashboardLayout } from "../../utils/api";
// import { useAuth } from "../../theme/AuthContext";
// import { WIDGET_REGISTRY, DEFAULT_LAYOUT } from "./widgetRegistry";
// import WidgetFrame from "./WidgetFrame";

// // utils/api.js additions:
// //   export const fetchDashboardLayout = () => api.get("/api/dashboard/layout").then(r => r.data);
// //   export const saveDashboardLayout = (layout) => api.post("/api/dashboard/layout", { layout }).then(r => r.data);

// const norm = (s = "") => s.trim().toLowerCase();

// // Agar registry mein naye widgets aaye hain jo user ke saved layout mein nahi hain,
// // to unhe visible + default span ke saath append karo. Registry se hate hue widgets drop honge.
// function mergeWithRegistry(saved) {
//   const savedIds = new Set(saved.map((s) => s.id));
//   const extras = WIDGET_REGISTRY.filter((w) => !savedIds.has(w.id)).map((w) => ({
//     id: w.id, visible: true, span: w.span,
//   }));
//   return [...saved, ...extras].filter((s) => WIDGET_REGISTRY.some((w) => w.id === s.id));
// }

// export default function CustomizableHomeDashboard({ onOpenPage }) {
//   const { token } = useAuth();
//   const [enabledModules, setEnabledModules] = useState(new Set());
//   const [layout, setLayout] = useState(null);           
//   const [savedLayout, setSavedLayout] = useState(null);  
//   const [dirty, setDirty] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [editing, setEditing] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [saveError, setSaveError] = useState("");
//   const dragId = useRef(null);
//   const [dragOverId, setDragOverId] = useState(null);

//   /* ---------- load ---------- */
//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       setLoading(true);
//       try {
//         const [menus, layoutRes] = await Promise.all([
//           fetchSidebarMenu(),
//           fetchDashboardLayout(),
//         ]);
//         if (!alive) return;

//         const visible = (menus || []).filter((m) => m.show_stat === "Y").map((m) => norm(m.mod_name));
//         setEnabledModules(new Set(visible));

//         const saved = layoutRes?.layout;
//         const initial = saved && saved.length ? mergeWithRegistry(saved) : DEFAULT_LAYOUT;
//         setLayout(initial);
//         setSavedLayout(initial);
//         setDirty(false);
//       } catch (err) {
//         console.error("HomeDashboard load error:", err);
//         if (!alive) return;
//         setLayout(DEFAULT_LAYOUT);
//         setSavedLayout(DEFAULT_LAYOUT);
//       } finally {
//         if (alive) setLoading(false);
//       }
//     })();
//     return () => { alive = false; };
//   }, [token]);

//   /* ---------- unsaved changes warning (tab close / refresh) ---------- */
//   useEffect(() => {
//     if (!dirty) return;
//     const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
//     window.addEventListener("beforeunload", warn);
//     return () => window.removeEventListener("beforeunload", warn);
//   }, [dirty]);

//   /* ---------- derived ---------- */
//   const availableWidgets = useMemo(
//     () => WIDGET_REGISTRY.filter((w) => enabledModules.has(norm(w.module))),
//     [enabledModules]
//   );

//   const visibleLayout = useMemo(() => {
//     if (!layout) return [];
//     const list = editing ? layout : layout.filter((l) => l.visible);
//     return list
//       .map((l) => ({ ...l, def: availableWidgets.find((w) => w.id === l.id) }))
//       .filter((l) => l.def);
//   }, [layout, availableWidgets, editing]);

//   const hiddenCount = useMemo(
//     () => (layout || []).filter((l) => !l.visible && availableWidgets.some((w) => w.id === l.id)).length,
//     [layout, availableWidgets]
//   );

//   /* ---------- draft edits (DB mein kuch save nahi hota) ---------- */
//   const update = (next) => {
//     setLayout(next);
//     setDirty(true);
//     setSaveError("");
//   };

//   const toggleVisible = (id) =>
//     update(layout.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));

//   const cycleSpan = (id) =>
//     update(layout.map((l) => (l.id === id ? { ...l, span: l.span === 1 ? 2 : l.span === 2 ? 3 : 1 } : l)));

//   const onDragStart = (id) => { dragId.current = id; };
//   const onDragEnd = () => { dragId.current = null; setDragOverId(null); };
//   const onDrop = (targetId) => {
//     setDragOverId(null);
//     const from = dragId.current;
//     dragId.current = null;
//     if (!from || from === targetId) return;
//     const current = [...layout];
//     const fromIdx = current.findIndex((l) => l.id === from);
//     const toIdx = current.findIndex((l) => l.id === targetId);
//     if (fromIdx === -1 || toIdx === -1) return;
//     const [moved] = current.splice(fromIdx, 1);
//     current.splice(toIdx, 0, moved);
//     update(current);
//   };

//   /* ---------- save / cancel / reset ---------- */
//   const handleSave = async () => {
//     setSaving(true);
//     setSaveError("");
//     try {
//       await saveDashboardLayout(layout);
//       setSavedLayout(layout);
//       setDirty(false);
//       setEditing(false);
//     } catch (err) {
//       console.error("Save layout failed:", err);
//       setSaveError("Save nahi ho paya, dobara try karo.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleCancel = () => {
//     setLayout(savedLayout);
//     setDirty(false);
//     setSaveError("");
//     setEditing(false);
//   };

//   const handleReset = () => update(DEFAULT_LAYOUT);

//   /* ---------- render ---------- */
//   if (loading || !layout) {
//     return <div className="h-full flex items-center justify-center text-sm text-gray-400">Loading your dashboard…</div>;
//   }

//   return (
//     <div className="h-full flex flex-col overflow-hidden">
//       {/* header */}
//       <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white">
//         <p className="text-[13px] font-semibold text-gray-700">Home</p>

//         <div className="flex items-center gap-2">
//           {editing ? (
//             <>
//               {saveError && <span className="text-[11px] text-red-500">{saveError}</span>}
//               {!saveError && dirty && <span className="text-[11px] text-amber-600">Unsaved changes</span>}
//               <button
//                 onClick={handleReset}
//                 disabled={saving}
//                 className="text-[12px] font-medium px-3 py-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50"
//               >
//                 Reset
//               </button>
//               <button
//                 onClick={handleCancel}
//                 disabled={saving}
//                 className="text-[12px] font-medium px-3 py-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSave}
//                 disabled={saving || !dirty}
//                 className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded bg-[#0f5c6e] text-white disabled:opacity-50"
//               >
//                 <FaCheck size={11} />
//                 {saving ? "Saving…" : "Save"}
//               </button>
//             </>
//           ) : (
//             <button
//               onClick={() => setEditing(true)}
//               className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded text-gray-500 hover:bg-gray-100"
//             >
//               <FaCog size={11} /> Customize
//             </button>
//           )}
//         </div>
//       </div>

//       {/* body */}
//       <div className="flex-1 min-h-0 overflow-auto p-4">
//         {editing && hiddenCount > 0 && (
//           <p className="text-[11.5px] text-gray-400 mb-3">
//             {hiddenCount} widget{hiddenCount > 1 ? "s are" : " is"} hidden below — tap the eye to bring it back.
//           </p>
//         )}

//         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-[340px]">
//           {visibleLayout.map(({ id, visible, span, def }) => {
//             const Comp = def.Component;
//             const spanClass =
//               span === 3 ? "md:col-span-2 xl:col-span-3"
//               : span === 2 ? "md:col-span-2"
//               : "";
//             return (
//               <div
//                 key={id}
//                 draggable={editing}
//                 onDragStart={() => onDragStart(id)}
//                 onDragEnd={onDragEnd}
//                 onDragOver={(e) => { if (editing) { e.preventDefault(); setDragOverId(id); } }}
//                 onDragLeave={() => setDragOverId(null)}
//                 onDrop={() => onDrop(id)}
//                 className={`min-h-0 ${spanClass} ${dragOverId === id ? "ring-2 ring-[#0f5c6e] rounded-xl" : ""}`}
//               >
//                 <WidgetFrame
//                   title={def.label}
//                   editing={editing}
//                   visible={visible}
//                   span={span}
//                   onToggle={() => toggleVisible(id)}
//                   onResize={() => cycleSpan(id)}
//                 >
//                   <Comp onOpenPage={onOpenPage} {...(def.props || {})} />
//                 </WidgetFrame>
//               </div>
//             );
//           })}

//           {!editing && visibleLayout.length === 0 && (
//             <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
//               <p className="text-sm">No widgets on your dashboard yet.</p>
//               <button
//                 onClick={() => setEditing(true)}
//                 className="mt-2 text-[12.5px] font-semibold text-[#0f5c6e]"
//               >
//                 Customize to add widgets
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
// components/Layout/HomeDashboard/CustomizableHomeDashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchSidebarMenu, fetchDashboardLayout, saveDashboardLayout } from "../../utils/api";
import { useAuth } from "../../theme/AuthContext";
import { WIDGET_REGISTRY, DEFAULT_LAYOUT } from "./widgetRegistry";
import WidgetFrame from "./WidgetFrame";
import { useDashboard } from "../../Hooks/useDashboard";

const norm = (s = "") => s.trim().toLowerCase();

function mergeWithRegistry(saved) {
  const savedIds = new Set(saved.map((s) => s.id));
  const extras = WIDGET_REGISTRY.filter((w) => !savedIds.has(w.id)).map((w) => ({
    id: w.id, visible: true, span: w.span,
  }));
  return [...saved, ...extras].filter((s) => WIDGET_REGISTRY.some((w) => w.id === s.id));
}

/**
 * Controlled by parent (HomeDashboard):
 *  - editing:   customize mode on/off
 *  - controlRef: parent isko actions leta hai { save, cancel, reset }
 *  - onStatus:  parent ko { dirty, saving, saveError } batata hai
 *  - onEditingChange: Save/Cancel ke baad editing band karne ke liye
 */
export default function CustomizableHomeDashboard({
  onOpenPage, editing = false, onEditingChange, onStatus, controlRef,
}) {
  const { token } = useAuth();
  const [enabledModules, setEnabledModules] = useState(new Set());
  const [layout, setLayout] = useState(null);
  const [savedLayout, setSavedLayout] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);
    const { data,  } = useDashboard();

  /* ---------- load ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [menus, layoutRes] = await Promise.all([fetchSidebarMenu(), fetchDashboardLayout()]);
        if (!alive) return;
        const visible = (menus || []).filter((m) => m.show_stat === "Y").map((m) => norm(m.mod_name));
        setEnabledModules(new Set(visible));
        const saved = layoutRes?.layout;
        const initial = saved && saved.length ? mergeWithRegistry(saved) : DEFAULT_LAYOUT;
        setLayout(initial);
        setSavedLayout(initial);
        setDirty(false);
      } catch (err) {
        console.error("HomeDashboard load error:", err);
        if (!alive) return;
        setLayout(DEFAULT_LAYOUT);
        setSavedLayout(DEFAULT_LAYOUT);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token]);

  /* ---------- unsaved changes warning ---------- */
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /* ---------- parent ko status do ---------- */
  useEffect(() => {
    onStatus?.({ dirty, saving, saveError });
  }, [dirty, saving, saveError]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- derived ---------- */
  const availableWidgets = useMemo(
    () => WIDGET_REGISTRY.filter((w) => enabledModules.has(norm(w.module))),
    [enabledModules]
  );

  const visibleLayout = useMemo(() => {
    if (!layout) return [];
    const list = editing ? layout : layout.filter((l) => l.visible);
    return list
      .map((l) => ({ ...l, def: availableWidgets.find((w) => w.id === l.id) }))
      .filter((l) => l.def);
  }, [layout, availableWidgets, editing]);

  const hiddenCount = useMemo(
    () => (layout || []).filter((l) => !l.visible && availableWidgets.some((w) => w.id === l.id)).length,
    [layout, availableWidgets]
  );

  /* ---------- draft edits ---------- */
  const update = (next) => { setLayout(next); setDirty(true); setSaveError(""); };

  const toggleVisible = (id) =>
    update(layout.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));

  const cycleSpan = (id) =>
    update(layout.map((l) => (l.id === id ? { ...l, span: l.span === 1 ? 2 : l.span === 2 ? 3 : 1 } : l)));

  const onDragStart = (id) => { dragId.current = id; };
  const onDragEnd = () => { dragId.current = null; setDragOverId(null); };
  const onDrop = (targetId) => {
    setDragOverId(null);
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    const current = [...layout];
    const fromIdx = current.findIndex((l) => l.id === from);
    const toIdx = current.findIndex((l) => l.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = current.splice(fromIdx, 1);
    current.splice(toIdx, 0, moved);
    update(current);
  };

  /* ---------- save / cancel / reset (parent ke buttons se chalte hain) ---------- */
  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await saveDashboardLayout(layout);
      setSavedLayout(layout);
      setDirty(false);
      onEditingChange?.(false);
    } catch (err) {
      console.error("Save layout failed:", err);
      setSaveError("Save nahi ho paya, dobara try karo.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLayout(savedLayout);
    setDirty(false);
    setSaveError("");
    onEditingChange?.(false);
  };

  const handleReset = () => update(DEFAULT_LAYOUT);
  

  // parent ke liye hamesha latest actions
  useEffect(() => {
    if (controlRef) controlRef.current = { save: handleSave, cancel: handleCancel, reset: handleReset };
  });

  /* ---------- render ---------- */
  if (loading || !layout) {
    return <div className="h-full flex items-center justify-center text-sm text-gray-400">Loading your dashboard…</div>;
  }

  return (
    <div className="h-full overflow-auto p-4">
      {editing && hiddenCount > 0 && (
        <p className="text-[11.5px] text-gray-400 mb-3">
          {hiddenCount} widget{hiddenCount > 1 ? "s are" : " is"} hidden below — tap the eye to bring it back.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-[340px]">
        {visibleLayout.map(({ id, visible, span, def }) => {
          const Comp = def.Component;
          const spanClass =
            span === 3 ? "md:col-span-2 xl:col-span-3"
            : span === 2 ? "md:col-span-2"
            : "";
          return (
            <div
              key={id}
              draggable={editing}
              onDragStart={() => onDragStart(id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => { if (editing) { e.preventDefault(); setDragOverId(id); } }}
              onDragLeave={() => setDragOverId(null)}
              onDrop={() => onDrop(id)}
              className={`min-h-0 ${spanClass} ${dragOverId === id ? "ring-2 ring-[#0f5c6e] rounded-xl" : ""}`}
            >
              <WidgetFrame
                title={def.label}
                hasOwnTitle={!!def.hasOwnTitle}
                editing={editing}
                visible={visible}
                span={span}
                onToggle={() => toggleVisible(id)}
                onResize={() => cycleSpan(id)}
              >
                <Comp onOpenPage={onOpenPage} {...(def.props || {})} data={data}/>
              </WidgetFrame>
            </div>
          );
        })}

        {!editing && visibleLayout.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm">No widgets on your dashboard yet.</p>
            <button
              onClick={() => onEditingChange?.(true)}
              className="mt-2 text-[12.5px] font-semibold text-[#0f5c6e]"
            >
              Customize to add widgets
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
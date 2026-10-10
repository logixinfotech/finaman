import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaCog, FaCheck, FaGripVertical, FaEye, FaEyeSlash, FaPlus, FaExpandAlt } from "react-icons/fa";
import { fetchSidebarMenu, fetchDashboardLayout, saveDashboardLayout } from "../../utils/api"; // TODO: add the 2 functions below to utils/api.js
import { useAuth } from "../../theme/AuthContext";
import { WIDGET_REGISTRY, DEFAULT_LAYOUT } from "./widgetRegistry";
import WidgetFrame from "./WidgetFrame";

// utils/api.js additions:
//   export const fetchDashboardLayout = () => api.get("/api/dashboard/layout").then(r => r.data);
//   export const saveDashboardLayout = (layout) => api.post("/api/dashboard/layout", { layout }).then(r => r.data);

const norm = (s = "") => s.trim().toLowerCase();

export default function CustomizableHomeDashboard() {
  const { token } = useAuth();
  const [enabledModules, setEnabledModules] = useState(new Set()); // company-visible module names, lowercased
  const [layout, setLayout] = useState(null);      // [{id, visible, span}], in display order
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const dragId = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [menus, savedLayout] = await Promise.all([
          fetchSidebarMenu(),
          fetchDashboardLayout(),
        ]);
        const visible = (menus || []).filter((m) => m.show_stat === "Y").map((m) => norm(m.mod_name));
        setEnabledModules(new Set(visible));

        const saved = savedLayout?.layout;
        setLayout(saved && saved.length ? mergeWithRegistry(saved) : DEFAULT_LAYOUT);
      } catch (err) {
        console.error("HomeDashboard load error:", err);
        setLayout(DEFAULT_LAYOUT);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // If new widgets were added to the registry after a user last saved,
  // append them (visible, default span) instead of silently dropping them.
  function mergeWithRegistry(saved) {
    const savedIds = new Set(saved.map((s) => s.id));
    const extras = WIDGET_REGISTRY.filter((w) => !savedIds.has(w.id)).map((w) => ({
      id: w.id, visible: true, span: w.span,
    }));
    return [...saved, ...extras].filter((s) => WIDGET_REGISTRY.some((w) => w.id === s.id));
  }

  // Widgets whose module is enabled for this company — everything else is
  // not offered at all, customize mode included.
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

  const persist = useCallback(async (next) => {
    setLayout(next);
    setSaving(true);
    try {
      await saveDashboardLayout(next);
    } catch (err) {
      console.error("Save layout failed:", err);
    } finally {
      setSaving(false);
    }
  }, []);

  const toggleVisible = (id) => {
    persist(layout.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  };
  const cycleSpan = (id) => {
    persist(layout.map((l) => (l.id === id ? { ...l, span: l.span === 1 ? 2 : l.span === 2 ? 3 : 1 } : l)));
  };

  const onDragStart = (id) => { dragId.current = id; };
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
    persist(current);
  };

  if (loading || !layout) {
    return <div className="h-full flex items-center justify-center text-sm text-gray-400">Loading your dashboard…</div>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white">
        <p className="text-[13px] font-semibold text-gray-700">Home</p>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[11px] text-gray-400">Saving…</span>}
          <button
            onClick={() => setEditing((v) => !v)}
            className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded transition-colors ${
              editing ? "bg-[#0f5c6e] text-white" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {editing ? <FaCheck size={11} /> : <FaCog size={11} />}
            {editing ? "Done" : "Customize"}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
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
        onDragOver={(e) => { e.preventDefault(); setDragOverId(id); }}
        onDragLeave={() => setDragOverId(null)}
        onDrop={() => onDrop(id)}
        className={`${spanClass} ${dragOverId === id ? "ring-2 ring-[#0f5c6e] rounded-xl" : ""}`}
      >
        <WidgetFrame
          title={def.label}
          editing={editing}
          visible={visible}
          span={span}
          onToggle={() => toggleVisible(id)}
          onResize={() => cycleSpan(id)}
        >
          <Comp {...(def.props || {})} />
        </WidgetFrame>
      </div>
    );
  })}
</div>
      </div>
    </div>
  );
}
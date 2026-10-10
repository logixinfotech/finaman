import React, { useEffect, useMemo, useState } from "react";
import ERPSettings from "../../Reusable/ERPSettings";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { fetchSidebarMenu } from "../../../utils/api";
import { useNavShortcuts } from "../../../utils/Shortcuts/NavShortcutContext";
import { Dropdown } from "../../Layout/NavigationShortcuts";
import QmsModulePanel from "./QmsModulePanel";

// Modules that have a module-wide panel (shared rules across their screens); others fall through to the screen form.
// Keyed by mod_name exactly as it appears in the sidebar.
const MODULE_PANELS = { QMS: QmsModulePanel };

// One screen's own settings — same form the screen's Settings tab shows
function ScreenSettings({ applName }) {
  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(applName);
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <ERPSettings applName={applName} config={settingsConfig} initialValues={settingsDefaults} onSave={onSettingsSave} />
    </div>
  );
}

export default function ApplicationSettings() {
  const { targets } = useNavShortcuts();                    // all menus the user can open (has appl_name)
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState("");
  const [screenId, setScreenId] = useState("");             // "" = whole module

  // same source and filter as the sidebar / Navigation Shortcuts
  useEffect(() => {
    let alive = true;
    fetchSidebarMenu()
      .then((data) => {
        if (!alive) return;
        setModules((Array.isArray(data) ? data : [])
          .filter((m) => m.show_stat === "Y")
          .sort((a, b) => (a.mod_srl || 0) - (b.mod_srl || 0))
          .map((m) => ({ id: String(m.masmod_id), text: m.mod_name })));
      })
      .catch(() => alive && setModules([]));
    return () => { alive = false; };
  }, []);

  const mod = modules.find((m) => m.id === moduleId);
  const ModulePanel = mod ? MODULE_PANELS[mod.text] : null;

  const screenOptions = useMemo(() => {
    if (!moduleId) return [];
    const inModule = targets.filter((t) => String(t.menu?.masmod_id) === moduleId);
    const count = {};
    inModule.forEach((t) => { count[t.label] = (count[t.label] || 0) + 1; });
    const list = inModule
      .map((t) => ({ id: String(t.masmnu_id), text: count[t.label] > 1 ? `${t.label} (${t.appl_name})` : t.label, appl_name: t.appl_name }))
      .sort((a, b) => a.text.localeCompare(b.text));
    if (ModulePanel) list.unshift({ id: "", text: `All ${mod.text} screens (module-wide)` });
    return list;
  }, [targets, moduleId, ModulePanel, mod]);

  const screen = screenOptions.find((s) => s.id === screenId && s.id !== "");

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: "'Inter','Tahoma',system-ui,sans-serif" }}>
      <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-slate-600">Module</label>
          <Dropdown
            value={moduleId} options={modules}
            onChange={(id) => { setModuleId(id); setScreenId(""); }}
            placeholder={modules.length ? "Select a module…" : "Loading modules…"}
            emptyText="No modules found"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-slate-600">Screen</label>
          <Dropdown
            value={screenId} options={screenOptions}
            onChange={setScreenId}
            disabled={!moduleId}
            placeholder={moduleId ? (ModulePanel ? `All ${mod.text} screens (module-wide)` : "Select a screen…") : "Choose a module first"}
            emptyText="No screens in this module"
          />
        </div>
      </div>

      {!mod && <p className="text-[12.5px] text-slate-400 px-1">Choose a module to see its settings.</p>}
      {mod && !screenId && ModulePanel && <ModulePanel />}
      {mod && !screenId && !ModulePanel && <p className="text-[12.5px] text-slate-400 px-1">Choose a screen — this module has no module-wide settings.</p>}
      {screen && (screen.appl_name
        ? <ScreenSettings key={screen.appl_name} applName={screen.appl_name} />
        : <p className="text-[12.5px] text-slate-400 px-1">This screen has no configurable settings.</p>)}
    </div>
  );
}
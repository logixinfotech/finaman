import React, { useCallback, useEffect, useMemo, useState, Suspense, lazy } from "react";
import {
  SlidersHorizontal, Search, ChevronRight, ChevronDown, Check, Boxes, MonitorCog, Hash,
  MessageSquare, ShieldCheck, Keyboard,
} from "lucide-react";
import ERPSettings from "../../Reusable/ERPSettings";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { fetchSidebarMenu, api } from "../../../utils/api";
import { useNavShortcuts } from "../../../utils/Shortcuts/NavShortcutContext";
import { handleApi } from "../../../utils/apiHandler";
import { showToast, alertError } from "../../Reusable/alert";
import QmsModulePanel from "./QmsModulePanel";
import { SaveCtx, useSaveSlot } from "./SaveBus";
export { useSaveSlot }; // QmsModulePanel etc. ke purane imports na tootein

export const ERP_FONT = "'Segoe UI', system-ui, Arial, sans-serif";

const KeyboardShortcuts = lazy(() => import("../KeyboardShortcuts"));
const NavigationShortcuts = lazy(() => import("../NavigationShortcuts"));

// ek hi tab me dono: pehle ERP ke shortcuts, uske neeche navigation shortcuts
function ShortcutsTab() {
  return (
    <div>
      <KeyboardShortcuts />
      <div className="my-6 border-t border-slate-100" />
      <NavigationShortcuts />
    </div>
  );
}

/* ── static sections (non-module) ──────────────────────────────────────── */
const STATIC_SECTIONS = [
  { id: "communication", label: "Communication Setup", meta: "Email & WhatsApp channels, message templates", icon: MessageSquare, component: lazy(() => import("../CommunicationSetup")) },
  { id: "shortcuts", label: "Keyboard Shortcuts", meta: "View, change or turn off shortcuts, and open any screen with your own keys", icon: Keyboard, component: ShortcutsTab },
  { id: "authentication", label: "Authentication", meta: "Coming soon", icon: ShieldCheck, comingSoon: true },
   { id: "textsizes", label: "Text Sizes", meta: "Coming soon", icon: ShieldCheck,component: lazy(() => import("../../../components/FontSizeControl"))  },
  
];

// modules with a module-wide panel (shared rules), keyed by sidebar mod_name
const MODULE_PANELS = { QMS: { label: "Record numbering & auto-create rules", component: QmsModulePanel } };

/* ── one sidebar item ──────────────────────────────────────────────────── */
function NavItem({ icon: Icon, label, meta, active, disabled, dirty, onClick, depth = 0, chevron, trail }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px]
        ${depth ? "pl-4" : ""}
        ${disabled ? "cursor-not-allowed text-slate-400"
          : active ? "bg-blue-50 font-semibold text-blue-700"
            : "text-slate-700 hover:bg-slate-50"}`}>
      {chevron}
      {Icon && <Icon className={`h-4 w-4 shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`} aria-hidden="true" />}
      <span className="truncate">{label}</span>
      {dirty && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" title="Unsaved" />}
      {meta !== undefined && meta !== "" && <span className="ml-auto shrink-0 text-[11px] text-slate-400">{meta}</span>}
      {trail && <span className={`shrink-0 ${meta !== undefined && meta !== "" ? "" : "ml-auto"}`}>{trail}</span>}
    </button>
  );
}

/* ── one screen's settings (ERPSettings without its own footer) ─────────── */
// function ApplRow({ applName }) {
//   const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(applName);
//   const [draft, setDraft] = useState(null);
//   const [k, setK] = useState(0);
//   const save = useCallback(async () => { await onSettingsSave(draft); setDraft(null); setK((x) => x + 1); }, [draft, onSettingsSave]);
//   useSaveSlot(applName, !!draft, save);
//   return (
//     <div className="rounded-md border border-slate-200 overflow-hidden">
//       <ERPSettings key={k} applName={applName} config={settingsConfig} initialValues={settingsDefaults} hideFooter onChange={setDraft} />
//     </div>
//   );
// }

function ApplRow({ applName }) {
  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings(applName);
  const [draft, setDraft] = useState(null);
  const [k, setK] = useState(0);

  // numbering ka section yahan nahi, wo "Record numbering & auto-create rules" tab mein hai
  const visibleConfig = useMemo(
    () => (settingsConfig || []).filter((sec) => !/record number/i.test(sec.section || "")),
    [settingsConfig]
  );
  // sirf wahi keys save karo jo is screen par dikh rahi hain
  const allowed = useMemo(
    () => new Set(visibleConfig.flatMap((s) => (s.rows || []).flatMap((r) => (r.controls || []).map((c) => c.key)))),
    [visibleConfig]
  );

  const save = useCallback(async () => {
    const only = Object.fromEntries(Object.entries(draft || {}).filter(([key]) => allowed.has(key)));
    await onSettingsSave(only);
    setDraft(null);
    setK((x) => x + 1);
  }, [draft, allowed, onSettingsSave]);
  useSaveSlot(applName, !!draft, save);

  return (
    <div className="rounded-md border border-slate-200 overflow-hidden">
      <ERPSettings key={k} applName={applName} config={visibleConfig} initialValues={settingsDefaults} hideFooter onChange={setDraft} />
    </div>
  );
}

const Fallback = () => <div className="h-16 animate-pulse rounded bg-slate-100" />;

/* ── page ──────────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { targets } = useNavShortcuts();
  const [modules, setModules] = useState([]);
  const [index, setIndex] = useState({});          // applName -> { count, labels }
  const [q, setQ] = useState("");
  const [slots, setSlots] = useState({});          // id -> { dirty, save }
  const [saving, setSaving] = useState(false);

  const [active, setActive] = useState("communication");
  const [visited, setVisited] = useState(() => new Set(["communication"]));
  const [appOpen, setAppOpen] = useState(true);
  const [expanded, setExpanded] = useState(new Set());   // expanded module ids

  const go = (id) => { setActive(id); setVisited((p) => (p.has(id) ? p : new Set(p).add(id))); };
  const toggleMod = (id) => setExpanded((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });


  const bus = useMemo(() => ({
    set: (id, v) => setSlots((p) => (p[id]?.dirty === v.dirty && p[id]?.save === v.save ? p : { ...p, [id]: v })),
    remove: (id) => setSlots((p) => { const n = { ...p }; delete n[id]; return n; }),
  }), []);

  useEffect(() => {
    let alive = true;
    fetchSidebarMenu().then((data) => alive && setModules((Array.isArray(data) ? data : [])
      .filter((m) => m.show_stat === "Y").sort((a, b) => (a.mod_srl || 0) - (b.mod_srl || 0))
      .map((m) => ({ id: String(m.masmod_id), text: m.mod_name })))).catch(() => { });
    handleApi(() => api.get("/api/settings")).then((r) => alive && setIndex(Object.fromEntries((r?.data || []).map((x) => [x.applName, x]))));
    return () => { alive = false; };
  }, []);

  // screens per module that actually have settings
  const screensOf = useMemo(() => {
    const map = {};
    targets.forEach((t) => {
      (map[String(t.menu?.masmod_id ?? "")] ||= []).push({ id: String(t.masmnu_id), text: t.label, applName: t.appl_name });
    });
    Object.values(map).forEach((l) => l.sort((a, b) => a.text.localeCompare(b.text)));
    return map;
  }, [targets]);

  // search: row title or any setting label
  const needle = q.trim().toLowerCase();
  const hit = (...texts) => !needle || texts.some((t) => String(t || "").toLowerCase().includes(needle));
  const screenHit = (s) => hit(s.text, s.applName, ...(index[s.applName]?.labels || []));

  const dirtyIds = Object.entries(slots).filter(([, v]) => v.dirty).map(([id]) => id);
  const saveAll = async () => {
    setSaving(true);
    try {
      for (const id of dirtyIds) await slots[id].save();
      showToast({ icon: "success", title: `Saved ${dirtyIds.length} change set${dirtyIds.length > 1 ? "s" : ""}` });
    } catch (e) { alertError("Save Error", e?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  // id -> { title, meta, node }
  const paneOf = (id) => {
    const st = STATIC_SECTIONS.find((s) => s.id === id);
    if (st) return { title: st.label, meta: st.meta, node: <Suspense fallback={<Fallback />}>{st.component && <st.component />}</Suspense> };
    const [mid, sid] = id.split(":");
    const m = modules.find((x) => x.id === mid);
    if (!m) return null;
    if (sid === "rules") { const p = MODULE_PANELS[m.text]; return p && { title: p.label, meta: m.text, node: <p.component slotId={m.text} /> }; }
    const s = (screensOf[mid] || []).find((x) => x.id === sid);
    return s && { title: s.text, meta: m.text, node: <ApplRow applName={s.applName} /> };
  };

  const appDirty = modules.some((x) => dirtyIds.includes(x.text) || (screensOf[x.id] || []).some((s) => dirtyIds.includes(s.applName)));

  return (
    <SaveCtx.Provider value={bus}>
      <div className="flex h-full w-full flex-col gap-1 bg-[#eef1f8] p-3 text-[13px] text-slate-800 antialiased" style={{ fontFamily: ERP_FONT }}>
        {/* toolbar */}
        <div className="flex shrink-0 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <SlidersHorizontal className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span className="font-semibold text-slate-800">Settings</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a setting"
              className="h-8 w-[260px] rounded-md border border-slate-200 bg-white pl-8 pr-2 text-[13px] outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <button onClick={saveAll} disabled={!dirtyIds.length || saving}
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-[12.5px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            <Check className="h-3.5 w-3.5" aria-hidden="true" /> {saving ? "Saving…" : dirtyIds.length ? `Save (${dirtyIds.length})` : "Save"}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 gap-1">
          {/* ── sidebar ── */}
          <aside className="w-[270px] shrink-0 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-sm">
            {STATIC_SECTIONS.filter((s) => hit(s.label, s.meta)).map((s) => (
              <NavItem key={s.id} icon={s.icon} label={s.label} active={active === s.id}
                disabled={s.comingSoon} meta={s.comingSoon ? "Soon" : ""} onClick={() => go(s.id)} />
            ))}

            {/* <div className="my-2 border-t border-slate-100" /> */}

            <NavItem icon={Boxes} label="Application Settings" meta={`${modules.length}`} dirty={appDirty}
              trail={appOpen || needle ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />} onClick={() => setAppOpen((v) => !v)} />

            {(appOpen || needle) && modules.map((m) => {
              const panel = MODULE_PANELS[m.text];
              // const screens = (screensOf[m.id] || []).filter(screenHit);
              const screens = (screensOf[m.id] || []).filter((s) => s.applName && index[s.applName]).filter(screenHit);
              const rulesHit = panel && hit(m.text, panel.label, "record number", "auto-create", "prefix");
              if (needle && !hit(m.text) && !screens.length && !rulesHit) return null;
              const isOpen = expanded.has(m.id) || !!needle;
              const dirty = dirtyIds.includes(m.text) || (screensOf[m.id] || []).some((s) => dirtyIds.includes(s.applName));
              return (
                <div key={m.id}>
                  <NavItem depth={1} label={m.text} dirty={dirty} onClick={() => toggleMod(m.id)}
                    chevron={isOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />} />
                  {isOpen && (
                    <div className="ml-3 border-l border-slate-100">
                      {panel && (!needle || rulesHit) && (
                        <NavItem depth={1} icon={Hash} label={panel.label} active={active === `${m.id}:rules`}
                          dirty={dirtyIds.includes(m.text)} onClick={() => go(`${m.id}:rules`)} />
                      )}
                      {screens.map((s) => {
                        const has = !!(s.applName && index[s.applName]);
                        return (
                          <NavItem key={s.id} depth={1} icon={MonitorCog} label={s.text} disabled={!has}
                            meta={has ? index[s.applName].count : ""} active={active === `${m.id}:${s.id}`}
                            dirty={dirtyIds.includes(s.applName)} onClick={() => go(`${m.id}:${s.id}`)} />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>

          {/* ── content ── */}
          <main className="min-w-0 flex-1 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm">
            {[...visited].map((id) => {
              const p = paneOf(id);
              if (!p) return null;
              return (
                <section key={id} className={active === id ? "" : "hidden"}>
                  <header className="sticky top-0 z-10 flex items-baseline gap-2 border-b border-slate-200 bg-white px-4 py-3">
                    <h2 className="text-[15px] font-semibold text-slate-800">{p.title}</h2>
                    <span className="text-[12px] text-slate-400">{p.meta}</span>
                  </header>
                  <div className="p-3">{p.node}</div>
                </section>
              );
            })}
          </main>
        </div>
      </div>
    </SaveCtx.Provider>
  );
}
 
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSaveBus, useSaveSlot } from "./Settings/SaveBus"; // path apne folder ke hisaab se adjust kareinimport { createPortal } from "react-dom";
import { Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { fetchSidebarMenu } from "../../utils/api";
import { useNavShortcuts } from "../../utils/Shortcuts/NavShortcutContext";
import { eventToCombo, formatCombo } from "../../utils/Shortcuts/ShortcutRegistry";
import { createPortal } from "react-dom";

const Keys = ({ combo }) => (
  <span className="flex items-center gap-1">
    {formatCombo(combo).map((k, i) => (
      <kbd
        key={i}
        className="min-w-[24px] rounded-md border border-b-2 border-slate-200 bg-slate-50 px-1.5 py-0.5 text-center text-[11px] font-semibold text-slate-600"
      >
        {k}
      </kbd>
    ))}
  </span>
);

const Switch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
      checked ? "bg-indigo-500" : "bg-slate-200"
    }`}
  >
    <span
      className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-4" : ""
      }`}
    />
  </button>
);

// Searchable dropdown. The list is rendered in a portal (position: fixed), so no parent
// card can clip it, and it does not depend on the browser's native <select> popup.
// data-dropdown-open on the panel keeps the ERP Enter-key navigation from stealing keys.
export const Dropdown = ({ value, options, onChange, placeholder, disabled, emptyText }) => {
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(0);
  const [pos, setPos] = useState(null);

  const selected = options.find((o) => o.id === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.text.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const openPanel = () => {
    if (disabled || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const up = below < 300 && r.top > below;
    setPos({
      left: r.left,
      width: Math.max(r.width, 220),
      top: up ? undefined : r.bottom + 4,
      bottom: up ? window.innerHeight - r.top + 4 : undefined,
    });
    setQuery("");
    const idx = options.findIndex((o) => o.id === value);
    setHi(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const closePanel = (refocus) => {
    setOpen(false);
    if (refocus && btnRef.current) btnRef.current.focus();
  };

  const choose = (o) => {
    onChange(o.id);
    closePanel(true);
  };

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onScroll = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener("mousedown", onDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const el = panelRef.current.querySelector("[data-hi='true']");
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }, [hi, open, filtered]);

  const onInputKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault(); e.stopPropagation();
      setHi((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); e.stopPropagation();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault(); e.stopPropagation();
      if (filtered[hi]) choose(filtered[hi]);
    } else if (e.key === "Escape") {
      e.preventDefault(); e.stopPropagation();
      closePanel(true);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const onButtonKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) openPanel();
    }
  };
  

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? closePanel(false) : openPanel())}
        onKeyDown={onButtonKeyDown}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-[13px] outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        <span className={`truncate ${selected ? "text-slate-700" : "text-slate-300"}`}>
          {selected ? selected.text : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && pos && createPortal(
        <div
          ref={panelRef}
          data-dropdown-open="true"
          style={{ position: "fixed", left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, zIndex: 9999 }}
          className="rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHi(0); }}
              onKeyDown={onInputKeyDown}
              placeholder="Type to search…"
              className="h-8 w-full rounded-md border border-slate-200 px-2 text-[12px] text-slate-700 outline-none placeholder:text-slate-300 focus:border-indigo-400"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-[12px] text-slate-400">{emptyText}</li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={o.id}
                  role="option"
                  aria-selected={o.id === value}
                  data-hi={i === hi ? "true" : "false"}
                  onMouseDown={(e) => { e.preventDefault(); choose(o); }}
                  onMouseEnter={() => setHi(i)}
                  className={`cursor-pointer truncate px-3 py-1.5 text-[13px] ${
                    i === hi ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
                  } ${o.id === value ? "font-semibold" : ""}`}
                >
                  {o.text}
                </li>
              ))
            )}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
};

// Sidebar modules (same source and filter as the Sidebar), loaded once and cached.
let modulesPromise = null;
const loadModules = () => {
  if (!modulesPromise) {
    modulesPromise = fetchSidebarMenu()
      .then((data) =>
        (Array.isArray(data) ? data : [])
          .filter((m) => m.show_stat === "Y")
          .sort((a, b) => (a.mod_srl || 0) - (b.mod_srl || 0))
          .map((m) => ({ id: String(m.masmod_id), name: m.mod_name }))
      )
      .catch(() => { modulesPromise = null; return []; });
  }
  return modulesPromise;
};

// Create / edit form. `initial` is an existing entry when editing.
const Editor = ({ initial, onSave, onCancel }) => {
  const { targets, check } = useNavShortcuts();

  const initialTarget = initial
    ? targets.find((t) => String(t.masmnu_id) === String(initial.masmnu_id)) ||
      targets.find((t) => t.appl_name === initial.appl_name) ||
      null
    : null;

  const [modules, setModules] = useState([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [moduleId, setModuleId] = useState(
    initialTarget?.menu?.masmod_id != null ? String(initialTarget.menu.masmod_id) : ""
  );
  const [target, setTarget] = useState(
    initialTarget ? String(initialTarget.masmnu_id) : initial ? String(initial.masmnu_id) : ""
  );
  const [keys, setKeys] = useState(initial?.keys || "");
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState(null); // { level: "error" | "warn", text }
  const exceptId = initial?.id;
  const bus = useSaveBus();            // null ho to Editor Settings ke bahar chal raha hai

// validation + save. Error throw karta hai, taaki Settings ka saveAll alertError dikha de
const submit = () => {
  if (!moduleId) throw new Error("Choose the module first.");
  const t =
    targets.find((x) => String(x.masmnu_id) === target) ||
    (initial && String(initial.masmnu_id) === target ? initial : null);
  if (!t) throw new Error("Choose the screen to open.");
  if (!keys) throw new Error("Click Record, then press the key combination.");
  const res = check(keys, exceptId);
  if (res && res.level === "error") throw new Error(res.text);
  onSave({ keys, masmnu_id: t.masmnu_id, appl_name: t.appl_name, label: t.label });
};

// stable save function (har render pe naya function banega to bus loop karega)
const submitRef = useRef(submit);
submitRef.current = submit;
const slotSave = useCallback(() => submitRef.current(), []);

const dirty = initial
  ? keys !== initial.keys || target !== String(initial.masmnu_id)
  : !!(keys || target || moduleId);

useSaveSlot(`navsc:${initial?.id ?? "new"}`, dirty, slotSave);

// bus na ho (standalone use) to purana inline Save chalega
const handleSave = () => {
  try { submit(); } catch (e) { setNotice({ level: "error", text: e.message }); }
};

  useEffect(() => {
    let alive = true;
    loadModules().then((list) => {
      if (!alive) return;
      setModules(list);
      setModulesLoaded(true);
    });
    return () => { alive = false; };
  }, []);

  // Recording: window + capture + stopImmediatePropagation, so the global
  // shortcuts and the Settings letter navigation do not fire while recording.
  useEffect(() => {
    if (!recording) return undefined;
    const onKey = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const plainEsc = e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey;
      if (plainEsc) { setRecording(false); return; }
      const combo = eventToCombo(e);
      if (!combo) return; // only a modifier so far: wait for the main key
      const res = check(combo, exceptId);
      if (res && res.level === "error") { setNotice(res); return; } // keep recording
      setKeys(combo);
      setNotice(res || null);
      setRecording(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [recording, check, exceptId]);

  // Module list. If it could not be loaded, fall back to the module ids found on the menus.
  const moduleOptions = useMemo(() => {
    const list = modules.map((m) => ({ id: m.id, text: m.name }));
    const ids = new Set(list.map((m) => m.id));
    if (modulesLoaded && modules.length === 0) {
      targets.forEach((t) => {
        const id = String(t.menu?.masmod_id);
        if (t.menu?.masmod_id != null && !ids.has(id)) {
          ids.add(id);
          list.push({ id, text: `Module ${id}` });
        }
      });
    }
    if (moduleId && modulesLoaded && !ids.has(moduleId)) {
      list.push({ id: moduleId, text: "Other module" });
    }
    return list;
  }, [modules, modulesLoaded, targets, moduleId]);

  // Screen list: only the chosen module's menus
  const screenOptions = useMemo(() => {
    if (!moduleId) return [];
    const inModule = targets.filter((t) => String(t.menu?.masmod_id) === moduleId);
    const count = {};
    inModule.forEach((t) => { count[t.label] = (count[t.label] || 0) + 1; });
    const list = inModule
      .map((t) => ({
        id: String(t.masmnu_id),
        text: count[t.label] > 1 ? `${t.label} (${t.appl_name})` : t.label,
      }))
      .sort((a, b) => a.text.localeCompare(b.text));
    if (target && !list.some((o) => o.id === target) && initial && String(initial.masmnu_id) === target) {
      list.unshift({ id: target, text: `${initial.label} (unavailable)` });
    }
    return list;
  }, [targets, moduleId, target, initial]);

  const handleModuleChange = (value) => {
    setModuleId(value);
    setTarget("");
    setNotice(null);
  };

 
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-[12px] font-semibold text-slate-600">Module</label>
          <Dropdown
            value={moduleId}
            options={moduleOptions}
            onChange={handleModuleChange}
            placeholder={modulesLoaded ? "Select a module…" : "Loading modules…"}
            emptyText="No modules found"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-slate-600">Screen to open</label>
          <Dropdown
            value={target}
            options={screenOptions}
            onChange={(id) => { setTarget(id); setNotice(null); }}
            disabled={!moduleId}
            placeholder={moduleId ? "Select a screen…" : "Choose a module first"}
            emptyText="No screens in this module"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-semibold text-slate-600">Keys</label>
          <div className="flex h-9 items-center gap-3">
            {recording ? (
              <span className="animate-pulse text-[11px] font-medium text-indigo-600">
                Press the keys · Esc to cancel
              </span>
            ) : keys ? (
              <Keys combo={keys} />
            ) : (
              <span className="text-[12px] text-slate-400">Not set</span>
            )}
            <button
              type="button"
              onClick={() => { setNotice(null); setRecording((r) => !r); }}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-white hover:text-slate-800"
            >
              {recording ? "Cancel" : keys ? "Record again" : "Record"}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Use Ctrl (⌘ on Mac) or Alt with a key, or a function key such as F2.
          </p>
        </div>
      </div>

      {targets.length === 0 && (
        <p className="mt-3 text-[11px] font-medium text-amber-600">
          The menu list has not loaded yet, so no screens are available. Reload the page and try again.
        </p>
      )}

      {notice && (
        <p className={`mt-3 text-[11px] font-medium ${notice.level === "error" ? "text-rose-600" : "text-amber-600"}`}>
          {notice.text}
        </p>
      )}

       <div className="mt-4 flex items-center gap-2">
  {bus ? (
    dirty && (
      <span className="text-[11px] font-medium text-amber-600">
        Unsaved  
      </span>
    )
  ) : (
    <button
      type="button"
      onClick={handleSave}
      className="rounded-lg bg-indigo-500 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-600"
    >
      {initial ? "Save changes" : "Save"}
    </button>
  )}
  <button
    type="button"
    onClick={onCancel}
    className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-slate-500 hover:bg-slate-100"
  >
    Cancel
  </button>
</div>
    </div>
  );
};

const EntryRow = ({ e }) => {
  const { toggle, remove, update, resolveTarget, targets, status } = useNavShortcuts();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notice, setNotice] = useState(null);

  const target = resolveTarget(e);
  const unavailable = targets.length > 0 && !target;
  const st = status[e.id];

  if (editing) {
    return (
      <div className="px-2 py-2">
        <Editor
          initial={e}
          onCancel={() => setEditing(false)}
          onSave={(patch) => { update(e.id, patch); setEditing(false); }}
        />
      </div>
    );
  }

  const handleToggle = () => {
    const res = toggle(e.id);
    setNotice(res ? res.text : null);
  };

  return (
    <div className="rounded-xl px-4 py-3 hover:bg-slate-50/70">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-48">
          <p className={`text-[13px] font-semibold ${e.enabled ? "text-slate-800" : "text-slate-400"}`}>
            {target ? target.display : e.label}
          </p>
          <p className="truncate text-[11px] text-slate-400">Opens this screen</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={e.enabled ? "" : "opacity-40"}><Keys combo={e.keys} /></span>

          <button
            type="button"
            onClick={() => { setNotice(null); setEditing(true); }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>

          {confirmDelete ? (
            <span className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-600">Delete?</span>
              <button
                type="button"
                onClick={() => remove(e.id)}
                className="rounded-md bg-rose-500 px-2 py-1 font-semibold text-white hover:bg-rose-600"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-md px-2 py-1 font-medium text-slate-500 hover:bg-slate-100"
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label={`Delete shortcut for ${e.label}`}
              title="Delete"
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <Switch
            checked={e.enabled}
            onChange={handleToggle}
            label={`${e.enabled ? "Turn off" : "Turn on"} shortcut for ${e.label}`}
          />
        </div>
      </div>

      {notice && <p className="mt-2 text-[11px] font-medium text-rose-600">{notice}</p>}
      {!notice && st && <p className="mt-2 text-[11px] font-medium text-amber-600">{st.text}</p>}
      {!notice && !st && unavailable && (
        <p className="mt-2 text-[11px] font-medium text-rose-600">
          This screen is no longer available to you, so the shortcut does nothing.
        </p>
      )}
    </div>
  );
};

const SYNC_TEXT = {
  local: "Saved on this device",
  saving: "Saving…",
  saved: "Saved to your profile",
  error: "Working on this device. Server sync failed.",
};

const NavigationShortcuts = () => {
  const { entries, loading, syncState, add } = useNavShortcuts();
  const [adding, setAdding] = useState(false);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" style={{ width: `${100 - i * 8}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-indigo-600"
          >
            <Plus className="h-3.5 w-3.5" /> Add shortcut
          </button>
        )}
        {SYNC_TEXT[syncState] && (
          <span
            className={`ml-auto text-[11px] ${syncState === "error" ? "text-amber-600" : "text-slate-400"}`}
            aria-live="polite"
          >
            {SYNC_TEXT[syncState]}
          </span>
        )}
      </div>

      <p className="mb-4 text-[11px] text-slate-400">
        Press your keys to open a screen. If it is already open, you switch to its tab. Shortcuts do not run while
        the cursor is in a field. Your shortcuts follow you to every device.
      </p>

      {adding && (
        <div className="mb-4">
          <Editor
            onCancel={() => setAdding(false)}
            onSave={(data) => { add(data); setAdding(false); }}
          />
        </div>
      )}

      {entries.length === 0 && !adding && (
        <p className="py-8 text-center text-[13px] text-slate-500">
          No navigation shortcuts yet. Click Add shortcut to create one.
        </p>
      )}

      <div className="divide-y divide-slate-100">
        {entries.map((e) => <EntryRow key={e.id} e={e} />)}
      </div>
    </div>
  );
};

export default NavigationShortcuts;
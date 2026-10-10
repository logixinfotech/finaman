import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, XCircle, Pencil, RotateCcw } from "lucide-react";
import { useShortcuts } from "../../utils/Shortcuts/ShortcutsContext";
import { FIXED_SHORTCUTS, eventToCombo, formatCombo, validateCombo } from "../../utils/Shortcuts/ShortcutRegistry";
 
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

const Row = ({ s, recording, onRecord, onStop }) => {
  const { setKeys, toggle, resetOne, findConflict } = useShortcuts();
  const [notice, setNotice] = useState(null);

  // Recording: capture phase pe sun-ne se Settings ke "letter type karo" navigation
  // aur global shortcuts, dono is dauraan trigger nahi hote.
  useEffect(() => {
    if (!recording) return undefined;
    const onKey = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const plainEsc = e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey;
      if (plainEsc) { onStop(); return; }
      const combo = eventToCombo(e);
      if (!combo) return; // sirf modifier dabaya, aage ki key ka wait karo
      const err = validateCombo(combo);
      if (err) { setNotice({ kind: "error", text: err }); return; }
      if (combo === s.keys) { onStop(); return; }
      const conflict = findConflict(combo, s.id);
      if (conflict) { setNotice({ kind: "conflict", combo, conflict }); onStop(); return; }
      setKeys(s.id, combo);
      setNotice(null);
      onStop();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [recording, s.id, s.keys, findConflict, setKeys, onStop]);

  const startRecording = () => { setNotice(null); onRecord(s.id); };

  const handleToggle = () => {
    const res = toggle(s.id);
    if (res?.conflict) {
      setNotice({
        kind: "error",
        text: `Can't turn this on: ${formatCombo(s.keys).join(" + ")} is now used by "${res.conflict.label}". Change one of them first.`,
      });
    } else {
      setNotice(null);
    }
  };

  return (
    <div className="rounded-xl px-4 py-3 hover:bg-slate-50/70">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-48">
          <p className={`text-[13px] font-semibold ${s.enabled ? "text-slate-800" : "text-slate-400"}`}>{s.label}</p>
          {s.description && <p className="truncate text-[11px] text-slate-400">{s.description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {recording ? (
            <span className="text-[11px] font-medium text-indigo-600 animate-pulse">Press the new keys · Esc to cancel</span>
          ) : (
            <span className={s.enabled ? "" : "opacity-40"}><Keys combo={s.keys} /></span>
          )}

       {/* btns are to modify shortcut key all bakend and shortcut are dynamic */}

          {/* <button
            type="button"
            onClick={recording ? onStop : startRecording}
            disabled={!s.enabled && !recording}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {recording ? "Cancel" : <><Pencil className="h-3 w-3" /> Change</>}
          </button>

          <button
            type="button"
            onClick={() => { setNotice(null); resetOne(s.id); }}
            disabled={!s.customized}
            aria-label={`Reset ${s.label} to default`}
            title="Reset to default"
            className={`rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 ${s.customized ? "" : "invisible"}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <Switch checked={s.enabled} onChange={handleToggle} label={`${s.enabled ? "Turn off" : "Turn on"} ${s.label}`} /> */}
        </div>
      </div>

      {notice?.kind === "error" && (
        <p className="mt-2 text-[11px] font-medium text-rose-600">{notice.text}</p>
      )}
      {notice?.kind === "conflict" && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
          <span>
            <b>{formatCombo(notice.combo).join(" + ")}</b> is already used by "{notice.conflict.label}".
          </span>
          <button
            type="button"
            onClick={() => { setKeys(s.id, notice.combo, notice.conflict.id); setNotice(null); }}
            className="rounded-md bg-indigo-50 px-2 py-1 font-semibold text-indigo-600 hover:bg-indigo-100"
          >
            Swap keys
          </button>
          <button type="button" onClick={() => setNotice(null)} className="rounded-md px-2 py-1 font-medium text-slate-500 hover:bg-slate-100">
            Keep as is
          </button>
        </div>
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

const KeyboardShortcuts = () => {
  const { shortcuts, loading, syncState, customizedCount, resetAll } = useShortcuts();
  const [query, setQuery] = useState("");
  const [recordingId, setRecordingId] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const stop = useCallback(() => setRecordingId(null), []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? shortcuts.filter((s) =>
          [s.label, s.description, s.group, formatCombo(s.keys).join("+")]
            .filter(Boolean).join(" ").toLowerCase().includes(q))
      : shortcuts;
    const map = new Map();
    list.forEach((s) => {
      if (!map.has(s.group)) map.set(s.group, []);
      map.get(s.group).push(s);
    });
    return Array.from(map, ([group, items]) => ({ group, items }));
  }, [shortcuts, query]);

  const fixedList = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FIXED_SHORTCUTS;
    return FIXED_SHORTCUTS.filter((s) =>
      [s.label, s.description, formatCombo(s.keys).join("+")]
        .filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [query]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" style={{ width: `${100 - i * 8}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by action or keys…"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-[13px] text-slate-700 outline-none placeholder:text-slate-300 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {SYNC_TEXT[syncState] && (
            <span className={`text-[11px] ${syncState === "error" ? "text-amber-600" : "text-slate-400"}`} aria-live="polite">
              {SYNC_TEXT[syncState]}
            </span>
          )}
          {customizedCount > 0 && !confirmReset && (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            >
              Reset all ({customizedCount})
            </button>
          )}
          {confirmReset && (
            <span className="flex items-center gap-2 text-[12px]">
              <span className="text-slate-600">Reset every shortcut to its default?</span>
              <button
                type="button"
                onClick={() => { resetAll(); setConfirmReset(false); }}
                className="rounded-lg bg-rose-500 px-3 py-1.5 font-semibold text-white hover:bg-rose-600"
              >
                Reset all
              </button>
              <button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg px-2 py-1.5 font-medium text-slate-500 hover:bg-slate-100">
                Cancel
              </button>
            </span>
          )}
        </div>
      </div>

      <p className="mb-4 text-[11px] text-slate-400">
        Shortcuts need Ctrl (⌘ on Mac) or Alt, or a function key, so they never clash with typing. A shortcut only works on screens that support that action. Your changes follow you to every device.
      </p>

      {groups.length === 0 && fixedList.length === 0 && (
        <p className="py-8 text-center text-[13px] text-slate-500">No shortcuts match "{query}".</p>
      )}

      {groups.map(({ group, items }) => (
        <section key={group} className="mb-5">
          <h3 className="px-4 pb-1 text-[12px] font-semibold text-slate-500">{group}</h3>
          <div className="divide-y divide-slate-100">
            {items.map((s) => (
              <Row key={s.id} s={s} recording={recordingId === s.id} onRecord={setRecordingId} onStop={stop} />
            ))}
          </div>
        </section>
      ))}

      {fixedList.length > 0 && (
        <section className="mb-5">
          <h3 className="px-4 pb-1 text-[12px] font-semibold text-slate-500">
            Form navigation <span className="font-normal text-slate-400"> </span>
          </h3>
          <div className="divide-y divide-slate-100">
            {fixedList.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="text-[13px] font-semibold text-slate-800">{s.label}</p>
                  {s.description && <p className="truncate text-[11px] text-slate-400">{s.description}</p>}
                </div>
                <Keys combo={s.keys} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default KeyboardShortcuts;
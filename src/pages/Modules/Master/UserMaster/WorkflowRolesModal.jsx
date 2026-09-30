 
import { useEffect, useState, useMemo, useCallback, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import * as FaIcons from "react-icons/fa";
import { showToast, alertError, alertWarning } from "../../../../components/Reusable/alert";
import {
  getWorkflowRoles,
  getWorkflowRoleOptions,
  saveWorkflowRoles,
  resetWorkflowRoles,
} from "../../QMS/Utils/QmsAPI"; 
const initials = (role) =>
  String(role || "")
    .split(/[\s/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";
 
const sig = (arr) => [...(arr || [])].map((s) => String(s).trim()).sort().join("|");
const sameRoles = (a, b) => sig(a) === sig(b); 
function RolePicker({ options, selected, onToggle, onClose, anchorRef, anchorRect }) {
  const [q, setQ] = useState(""); 
  const [pos, setPos] = useState(() => toPos(anchorRect));
  const panelRef = useRef(null);

  
  function toPos(r) {
    if (!r) return null;
    const width = 240; // w-60
    const gutter = 8;

    let left = r.left;
    if (left + width > window.innerWidth - gutter) {
      left = window.innerWidth - width - gutter;
    }
    left = Math.max(gutter, left);

    const top = r.bottom + 4;
    const maxHeight = Math.max(140, window.innerHeight - top - gutter);

    return { left, top, width, maxHeight };
  } 
  useLayoutEffect(() => {
    const recompute = () => {
      const el = anchorRef?.current;
      if (!el) return;
      setPos(toPos(el.getBoundingClientRect()));
    };
    window.addEventListener("scroll", recompute, true);
    window.addEventListener("resize", recompute);
    return () => {
      window.removeEventListener("scroll", recompute, true);
      window.removeEventListener("resize", recompute);
    };
  }, [anchorRef]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => o.role.toLowerCase().includes(needle));
  }, [options, q]);

  if (!pos) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70]" onClick={onClose} />
      <div
        ref={panelRef}
        className="fixed z-[80] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col"
        style={{
          left: pos.left,
          top: pos.top,
          width: pos.width,
          maxHeight: pos.maxHeight,
        }}
      >
        <div className="p-2 border-b border-slate-100 shrink-0">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search role…"
            className="w-full h-7 px-2 text-[12px] border border-slate-200 rounded outline-none focus:border-blue-400"
          />
        </div>
        <div className="overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-[11.5px] text-slate-400 text-center">
              No role found
            </div>
          )}
          {filtered.map((o) => {
            const on = selected.some((s) => s.toLowerCase() === o.role.toLowerCase());
            return (
              <button
                key={o.role}
                type="button"
                onClick={() => onToggle(o.role)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 text-left"
              >
                <span
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                    on ? "bg-blue-600 border-blue-600" : "border-slate-300"
                  }`}
                >
                  {on && <FaIcons.FaCheck size={7} className="text-white" />}
                </span>
                <span className="text-[12px] text-slate-700 flex-1 truncate">{o.role}</span>
                <span
                  className={`text-[10px] shrink-0 ${
                    o.userCount > 0 ? "text-slate-400" : "text-red-500 font-semibold"
                  }`}
                  title={`${o.userCount} user(s) in this group`}
                >
                  {o.userCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── role chips ──────────────────────────────────────────────────────── */

function RoleChips({ roles, options, disabled, onChange, pickerKey, openPicker, setOpenPicker }) {
  const addBtnRef = useRef(null);

  const countOf = useCallback(
    (r) => options.find((o) => o.role.toLowerCase() === String(r).toLowerCase())?.userCount ?? 0,
    [options]
  );

  const isOpen = openPicker?.key === pickerKey;
  const orphan = roles.filter((r) => countOf(r) === 0);

  const toggle = (role) => {
    const has = roles.some((r) => r.toLowerCase() === role.toLowerCase());
    onChange(has ? roles.filter((r) => r.toLowerCase() !== role.toLowerCase()) : [...roles, role]);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 items-center">
        {roles.map((r) => {
          const c = countOf(r);
          return (
            <span
              key={r}
              className={`inline-flex items-center gap-1.5 pl-0.5 pr-1 py-0.5 rounded-full border text-[11.5px] ${
                c === 0 ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
              } ${disabled ? "opacity-60" : ""}`}
            >
              <span
                className={`w-[18px] h-[18px] rounded-full text-white text-[8.5px] font-semibold flex items-center justify-center shrink-0 ${
                  c === 0 ? "bg-red-500" : "bg-blue-600"
                }`}
              >
                {initials(r)}
              </span>
              <span className="text-slate-700">{r}</span>
              <span
                className={`text-[10px] ${c === 0 ? "text-red-600 font-semibold" : "text-slate-400"}`}
                title={`${c} user(s) in this group`}
              >
                {c}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(roles.filter((x) => x !== r))}
                  className="text-slate-400 hover:text-red-500 pl-0.5"
                  aria-label={`Remove ${r}`}
                >
                  <FaIcons.FaTimes size={9} />
                </button>
              )}
            </span>
          );
        })}

        {!disabled && (
          <button
            ref={addBtnRef}
            type="button"
            onClick={(e) => {
              if (isOpen) {
                setOpenPicker(null);
                return;
              } 
              const rect = e.currentTarget.getBoundingClientRect();
              setOpenPicker({ key: pickerKey, rect });
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-slate-300 text-[11.5px] text-slate-400 hover:border-blue-400 hover:text-blue-600"
            aria-label="Add role"
          >
            <FaIcons.FaPlus size={9} />
          </button>
        )}

        {roles.length === 0 && disabled && (
          <span className="text-[11.5px] text-slate-300">—</span>
        )}
      </div>

      {orphan.length > 0 && (
        <div className="flex items-start gap-1.5 mt-1.5 text-[10.5px] text-red-600">
          <FaIcons.FaExclamationTriangle size={9} className="mt-[2px] shrink-0" />
          <span>
            No users in {orphan.join(", ")} — records will get stuck at this stage
          </span>
        </div>
      )}

      {isOpen && (
        <RolePicker
          options={options}
          selected={roles}
          onToggle={toggle}
          onClose={() => setOpenPicker(null)}
          anchorRef={addBtnRef}
          anchorRect={openPicker.rect}
        />
      )}
    </div>
  );
}
 
export default function WorkflowRolesModal({ moduleKey, moduleLabel, onClose, onSaved }) {
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [stages, setStages]           = useState([]);
  const [options, setOptions]         = useState([]);
  const [draft, setDraft]             = useState({});   // sectionKey -> roles[]
  const [defaults, setDefaults]       = useState({});   // sectionKey -> roles[] (system default)
  const [mode, setMode]               = useState("standard");
  const [splitStages, setSplitStages] = useState(() => new Set());
  const [openPicker, setOpenPicker]   = useState(null); // { key, rect } | null
  // Parent may pass a new inline onClose on every render — keep it out of deps
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wf, opt] = await Promise.all([
        getWorkflowRoles(moduleKey),
        getWorkflowRoleOptions(),
      ]);

      const st = wf?.stages || [];
      setStages(st);
      setOptions(opt?.data || []);

      const d = {};
      const def = {};
      st.forEach((s) =>
        s.sections.forEach((sec) => {
          d[sec.sectionKey] = [...(sec.roles || [])];
          def[sec.sectionKey] = [...(sec.defaultRoles || sec.roles || [])];
        })
      );
      setDraft(d);
      setDefaults(def);
      setMode(wf?.isCustomized ? "custom" : "standard");
    } catch (e) {
      alertError("Load failed", e?.message || "Could not load workflow roles.");
      onClose?.();
    } finally {
      setLoading(false);
    }
  }, [moduleKey]);

  useEffect(() => { load(); }, [load]);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") { setOpenPicker(null); onClose?.(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const readOnly = mode === "standard";

  // Standard mode shows system defaults; custom mode shows the editable draft
  const rolesOf = useCallback(
    (sectionKey) => (readOnly ? defaults[sectionKey] : draft[sectionKey]) || [],
    [readOnly, defaults, draft]
  );

  const setSectionRoles = useCallback((sectionKey, roles) => {
    setDraft((p) => ({ ...p, [sectionKey]: roles }));
  }, []);

  const setStageRoles = useCallback((sections, roles) => {
    setDraft((p) => {
      const next = { ...p };
      sections.forEach((sec) => { next[sec.sectionKey] = [...roles]; });
      return next;
    });
  }, []);

  const changedSections = useMemo(() => {
    if (readOnly) return [];
    return Object.keys(draft).filter((k) => !sameRoles(draft[k], defaults[k]));
  }, [readOnly, draft, defaults]);

  const wasCustomized = useMemo(
    () => stages.some((s) => s.sections.some((sec) => sec.source === "custom")),
    [stages]
  );

  const isDirty = changedSections.length > 0 || (mode === "standard" && wasCustomized);

  const handleSave = async () => {
    // The first stage must have at least one role, otherwise nobody can create a record
    if (!readOnly) {
      const s0 = stages.find((s) => s.stage === 0);
      const s0Empty = s0 && !s0.sections.some((sec) => (draft[sec.sectionKey] || []).length > 0);
      if (s0Empty) {
        alertWarning(
          "First stage has no role",
          "Assign at least one role to the first stage, otherwise no one will be able to create a record."
        );
        return;
      }
    }

    setSaving(true);
    try {
      if (readOnly) {
        await resetWorkflowRoles(moduleKey);
        showToast({ icon: "success", title: "Standard workflow restored" });
      } else {
        const payload = Object.entries(draft).map(([sectionKey, roles]) => ({ sectionKey, roles }));
        const res = await saveWorkflowRoles(moduleKey, payload);
        if (res && res.success === false) throw new Error(res.message);
        showToast({ icon: "success", title: "Workflow roles saved" });
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      alertError("Save failed", e?.message || "Could not save workflow roles.");
    } finally {
      setSaving(false);
    }
  };

  const MODE_OPTIONS = [
    {
      v: "standard",
      t: "Standard workflow",
      d: "System default. Used by every company unless changed.",
    },
    {
      v: "custom",
      t: "Customise for this company",
      d: "Whatever you set below applies only to this company.",
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-6 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">

        {/* header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100">
          <span className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <FaIcons.FaProjectDiagram size={16} className="text-blue-600" />
          </span>
          <div className="min-w-0">
            <div className="text-[16px] font-semibold text-slate-800">
              {moduleLabel || moduleKey} workflow
            </div>
            <div className="text-[11.5px] text-slate-500 mt-0.5">
              Decide who works at each stage
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-slate-700 shrink-0"
            aria-label="Close"
          >
            <FaIcons.FaTimes size={16} />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-[13px]">
            <FaIcons.FaSpinner className="animate-spin inline mr-2" />
            Loading workflow…
          </div>
        ) : (
          <>
            {/* mode choice */}
            <div className="px-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MODE_OPTIONS.map((o) => {
                const on = mode === o.v;
                return (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => { setOpenPicker(null); setMode(o.v); }}
                    className={`text-left rounded-lg p-3 border transition-colors ${
                      on
                        ? "border-blue-500 bg-blue-50/70 ring-1 ring-blue-500"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 border-[1.5px] ${
                          on ? "border-[4px] border-blue-600 bg-white" : "border-slate-300"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className={`text-[12.5px] font-semibold ${on ? "text-blue-700" : "text-slate-700"}`}>
                          {o.t}
                        </div>
                        <div className={`text-[11px] mt-0.5 leading-snug ${on ? "text-blue-600" : "text-slate-500"}`}>
                          {o.d}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-5 pt-3 pb-2 flex items-center gap-1.5">
              <FaIcons.FaInfoCircle size={11} className="text-slate-400 shrink-0" />
                           <span className="text-[11px] text-slate-500">
                {readOnly
                  ? <>Read-only. Choose <b className="font-semibold">Customise for this company</b> to make changes.</>
                  : <>These roles apply to the whole <b className="font-semibold">user group</b>, not to one user.</>}
              </span>
            </div>

            {/* stage table */}
            <div className="px-5">
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="grid grid-cols-[26px_minmax(0,150px)_minmax(0,1fr)] gap-2.5 px-3 py-2 bg-slate-50 border-b border-slate-200">
                  <span />
                  <span className="text-[10px] tracking-wider text-slate-400">STAGE</span>
                  <span className="text-[10px] tracking-wider text-slate-400">WHO WORKS HERE</span>
                </div>

                {stages.map((st, stIdx) => {
                  const secs = st.sections || [];

                  // Terminal stages (Closed / Obsolete) have no work to assign
                  if (st.isTerminal || secs.length === 0) {
                    return (
                      <div
                        key={`${st.stage}-${stIdx}`}
                        className="grid grid-cols-[26px_minmax(0,150px)_minmax(0,1fr)] gap-2.5 px-3 py-2.5 border-b border-slate-100 last:border-0 items-center opacity-50"
                      >
                        <span className="w-[22px] h-[22px] rounded-full border border-dashed border-slate-300 text-slate-400 flex items-center justify-center">
                          <FaIcons.FaLock size={9} />
                        </span>
                        <div className="text-[12.5px] font-medium text-slate-600">{st.label}</div>
                        <div className="text-[11px] text-slate-400">Final stage — no role needed</div>
                      </div>
                    );
                  }

                  // If every section in this stage has the same roles, show one picker
                  const uniform =
                    secs.length > 1 &&
                    secs.every((s) => sameRoles(rolesOf(s.sectionKey), rolesOf(secs[0].sectionKey)));
                  // Use the row index (not just st.stage) so two stages that
                  // happen to share the same `stage` number can never
                  // collide on the same split/picker state.
                  const splitId = `${st.stage}-${stIdx}`;
                  const split = splitStages.has(splitId);
                  const showUniform = uniform && !split;

                  const stageChanged = secs.some(
                    (s) => !readOnly && !sameRoles(draft[s.sectionKey], defaults[s.sectionKey])
                  );

                  return (
                    <div
                      key={splitId}
                      className={`grid grid-cols-[26px_minmax(0,150px)_minmax(0,1fr)] gap-2.5 px-3 py-2.5 border-b border-slate-100 last:border-0 items-start ${
                        stageChanged ? "bg-emerald-50/60" : ""
                      }`}
                    >
                      <span
                        className={`w-[22px] h-[22px] rounded-full text-[10px] flex items-center justify-center shrink-0 mt-0.5 ${
                          stageChanged
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-50 border border-slate-300 text-slate-600"
                        }`}
                      >
                        {st.stage}
                      </span>

                      <div className="min-w-0 mt-0.5">
                        <div className={`text-[12.5px] font-medium ${stageChanged ? "text-emerald-700" : "text-slate-700"}`}>
                          {st.label}
                        </div>

                        {stageChanged ? (
                          <div className="text-[10px] text-emerald-600">Changed</div>
                        ) : showUniform ? (
                          <div className="text-[10px] text-slate-400">{secs.length} sections</div>
                        ) : secs.length > 1 ? (
                          <div className="text-[10px] text-amber-600">Different roles</div>
                        ) : null}

                        {!readOnly && uniform && !split && (
                          <button
                            type="button"
                            onClick={() => setSplitStages((p) => new Set(p).add(splitId))}
                            className="text-[10px] text-blue-600 hover:underline mt-0.5"
                          >
                            Set per section
                          </button>
                        )}
                      </div>

                      <div className="min-w-0">
                        {showUniform ? (
                          <RoleChips
                            roles={rolesOf(secs[0].sectionKey)}
                            options={options}
                            disabled={readOnly}
                            onChange={(r) => setStageRoles(secs, r)}
                            pickerKey={`stagepicker-${splitId}`}
                            openPicker={openPicker}
                            setOpenPicker={setOpenPicker}
                          />
                        ) : (
                          <div className="space-y-2.5">
                            {secs.map((sec, secIdx) => (
                              <div key={`${sec.sectionKey}-${secIdx}`}>
                                {secs.length > 1 && (
                                  <div className="text-[10.5px] text-slate-400 mb-1 truncate">
                                    {sec.sectionKey}
                                  </div>
                                )}
                                <RoleChips
                                  roles={rolesOf(sec.sectionKey)}
                                  options={options}
                                  disabled={readOnly}
                                  onChange={(r) => setSectionRoles(sec.sectionKey, r)}
                                  pickerKey={`sectionpicker-${splitId}-${sec.sectionKey}-${secIdx}`}
                                  openPicker={openPicker}
                                  setOpenPicker={setOpenPicker}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center gap-2.5 px-5 py-3.5 mt-4 border-t border-slate-100 bg-slate-50/60">
              <span className="text-[11.5px] text-slate-500">
                {readOnly
                  ? wasCustomized
                    ? "Saving will restore the standard workflow"
                    : "Standard workflow is in use"
                  : changedSections.length
                    ? `${changedSections.length} section${changedSections.length > 1 ? "s" : ""} changed`
                    : "No changes"}
              </span>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 h-8 text-[12.5px] font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className="px-5 h-8 text-[12.5px] font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
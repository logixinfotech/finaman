import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { alertError, showToast } from "../../../../components/Reusable/alert";
import {
  getTypeVersions, getTypeVersion, createLogbookType, saveTypeDraft, submitTypeDraft, approveTypeDraft,
  returnTypeDraft, discardTypeDraft, setTypeRetired, getRoleOptions,
} from "../Utils/LogbookAPI";
import { Btn, Kbd, erp, fmtDateTime } from "./LogbookUi";
import { NEW_KEY, CAT_ICON, TPL_STATUS, blankDefinition, toDefinition, draftSig, sig, analyse, diffDefinitions, themeOf } from "./typeDesigner/model";
import useTemplateDraft from "./typeDesigner/useTemplateDraft";
import DesignTab from "./typeDesigner/DesignTab";
import SettingsTab from "./typeDesigner/SettingsTab";
import ComplianceTab from "./typeDesigner/ComplianceTab";
import HistoryTab, { DiffList } from "./typeDesigner/HistoryTab";
import PreviewForm from "./typeDesigner/PreviewForm";
import SignDialog from "./typeDesigner/SignDialog";
import PrintCenter from "./typeDesigner/PrintCenter";
import { exportExcel, exportJson } from "./typeDesigner/exportTemplate";
import { inputS } from "./typeDesigner/atoms";

/* ═══════════════════════════════════════════════════════════════════════
   Logbook template designer
   • Opens straight in edit mode (a change becomes the next version's draft)
   • Step tracker:  ① Edit & save  →  ② QA approval  →  ③ Live
   • Print centre (blank paper format / specification) · Excel / JSON / PDF export
   ═══════════════════════════════════════════════════════════════════════ */

const call = async (p) => { const r = await p; if (r && r.success === false) throw new Error(r.message || "Request failed"); return r; };
const Banner = ({ tone = "blue", icon: I = FaIcons.FaInfoCircle, children, action }) => {
  const c = { blue: "bg-[#eef4ff] border-[#c7d7fb] text-[#1e3a8a]", amber: "bg-amber-50 border-amber-200 text-amber-900", red: "bg-red-50 border-red-200 text-red-800", gray: "bg-white border-[#dde1ea] text-[#475569]", green: "bg-emerald-50 border-emerald-200 text-emerald-900" }[tone];
  return <div className={`flex flex-wrap items-center gap-2.5 px-4 py-2.5 border rounded-[10px] text-[12.5px] ${c}`}><I size={13} className="shrink-0" /><span className="flex-1 min-w-[200px]">{children}</span>{action}</div>;
};

/** ① Edit → ② Approval → ③ Live */
function Stepper({ step, th }) {
  const S = [["Edit & save", FaIcons.FaPencilAlt], ["QA approval", FaIcons.FaUserShield], ["Live in registers", FaIcons.FaCheckCircle]];
  return (
    <div className="flex items-center gap-1.5">
      {S.map(([l, I], i) => {
        const done = i < step; const on = i === step;
        return (
          <div key={l} className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1.5 h-[30px] pl-1 pr-3 rounded-full text-[11.5px] font-bold transition-all ${on ? "text-white shadow-md" : done ? "bg-emerald-50 text-emerald-700" : "bg-[#f1f5f9] text-[#94a3b8]"}`}
              style={on ? { background: `linear-gradient(120deg, ${th.from}, ${th.to})` } : undefined}>
              <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center ${on ? "bg-white/25" : done ? "bg-emerald-500 text-white" : "bg-white"}`}>{done ? <FaIcons.FaCheck size={9} /> : <I size={9} />}</span>
              <span className="hidden md:inline">{l}</span>
            </div>
            {i < S.length - 1 && <span className={`w-5 h-[2px] rounded ${i < step ? "bg-emerald-400" : "bg-[#e2e8f0]"}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function LogbookTemplateDesigner({ typeKey, listMe, types, company, onBack, onChanged }) {
  const isNew = typeKey === NEW_KEY;
  const [meta, setMeta] = useState(null);          // { versions, type, standard, me }
  const [viewVer, setViewVer] = useState(null);
  const [effDef, setEffDef] = useState(null);
  const [localDraft, setLocalDraft] = useState(isNew);
  const [loaded, setLoaded] = useState({ sig: "", reason: "" });
  const [reason, setReason] = useState("");
  const [roleOpts, setRoleOpts] = useState([]);
  const [tab, setTab] = useState("design");
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null);      // submit | approve | return | discard | retire
  const [printOpen, setPrintOpen] = useState(null); // null | "format" | "spec"
  const [menu, setMenu] = useState(false);
  const fileRef = useRef(null);

  const versions = meta?.versions || [];
  const me = meta?.me || listMe || { canDesign: false, canApprove: false };
  const effRow = versions.find((v) => v.Status === "Effective");
  const openRow = versions.find((v) => v.Status === "Draft" || v.Status === "InReview");
  const viewRow = versions.find((v) => v.VersionNo === viewVer) || null;
  const isStandard = !!meta?.standard;
  const retired = !!meta?.type?.isRetired;
  const lockedKeys = useMemo(() => new Set((effDef?.columns || []).map((c) => c.key)), [effDef]);
  const ed = useTemplateDraft(lockedKeys);

  const mode = isNew ? "new" : localDraft ? "local" : viewRow?.Status || "loading";
  const editing = (mode === "new" || mode === "local" || mode === "Draft") && me.canDesign;
  const isAuthor = !!openRow && [openRow.CreatedBy, openRow.UpdatedBy, openRow.SubmittedBy].some((x) => x && me.name && x.toLowerCase() === me.name.toLowerCase());
  const canApproveThis = mode === "InReview" && me.canApprove && (!isAuthor || me.allowSelfApproval);
  const nextVer = (versions[0]?.VersionNo || 0) + 1;

  const beginLocal = useCallback((def) => {
    ed.load(def); setLocalDraft(true); setReason("");
    setLoaded({ sig: draftSig(ed.ref.current), reason: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── loading: open change → show it · otherwise open the effective version straight in edit mode ── */
  const refresh = useCallback(async (preferVer) => {
    if (isNew) return;
    try {
      const r = await call(getTypeVersions(typeKey));
      const open = r.versions.find((v) => v.Status === "Draft" || v.Status === "InReview");
      const eff = r.versions.find((v) => v.Status === "Effective");
      const def = eff ? (await call(getTypeVersion(typeKey, eff.VersionNo))).definition : null;
      setMeta(r); setEffDef(def);
      if (preferVer != null) { setLocalDraft(false); setViewVer(preferVer); return; }
      if (open) { setLocalDraft(false); setViewVer(open.VersionNo); return; }
      if (eff && def && r.me?.canDesign && !r.type?.isRetired) { setViewVer(eff.VersionNo); beginLocal(def); return; }
      setLocalDraft(false); setViewVer(eff?.VersionNo ?? r.versions[0]?.VersionNo ?? null);
    } catch (e) { alertError("Load failed", e.message); }
  }, [typeKey, isNew, beginLocal]);

  useEffect(() => {
    getRoleOptions().then((r) => setRoleOpts(r?.data || [])).catch(() => { });
    if (isNew) { ed.load(blankDefinition()); setLoaded({ sig: draftSig(ed.ref.current), reason: "" }); setReason(""); return; }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeKey]);

  useEffect(() => {   // read-only / draft view: load that version's definition
    if (isNew || localDraft || viewVer == null) return;
    let live = true;
    getTypeVersion(typeKey, viewVer).then((r) => {
      if (!live || !r?.definition) return;
      ed.load(r.definition);
      const row = (meta?.versions || []).find((v) => v.VersionNo === viewVer);
      setReason(row?.ChangeReason || "");
      setLoaded({ sig: draftSig(ed.ref.current), reason: row?.ChangeReason || "" });
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewVer, localDraft, meta]);

  const dirty = editing && !!ed.draft && (draftSig(ed.draft) !== loaded.sig || reason !== loaded.reason);
  const fieldsChanged = editing && !!ed.draft && draftSig(ed.draft) !== loaded.sig;
  const analysis = useMemo(() => (ed.draft ? analyse(ed.draft, { roleOpts }) : null), [ed.draft, roleOpts]);
  const errorIds = useMemo(() => new Set((analysis?.errors || []).map((e) => e.id).filter(Boolean)), [analysis]);
  const diffVsEff = useMemo(() => (ed.draft ? diffDefinitions(effDef, toDefinition(ed.draft)) : []), [ed.draft, effDef]);

  /* ── guards ── */
  const leave = (fn) => { if (dirty && !window.confirm("You have unsaved changes. Leave and discard them?")) return; fn(); };
  const blockIfErrors = () => {
    if (!analysis.errors.length) return false;
    setTab("check");
    alertError("Please fix these first", analysis.errors.slice(0, 4).map((e) => e.t).join("\n"));
    return true;
  };

  /* ── actions ── */
  const saveDraft = async ({ quiet } = {}) => {
    if (!editing || busy) return false;
    if (blockIfErrors()) return false;
    if (mode === "local" && !fieldsChanged) { alertError("Nothing changed", "Change a field or setting first — then save."); return false; }
    setBusy(true);
    try {
      const definition = toDefinition(ed.ref.current);
      if (isNew) {
        const r = await call(createLogbookType({ definition, changeReason: reason || "New template" }));
        showToast({ icon: "success", title: `Saved — “${definition.name}” draft created` });
        onChanged?.(r.typeKey);
        return true;
      }
      const r = await call(saveTypeDraft(typeKey, { definition, changeReason: reason, rowVer: mode === "Draft" ? viewRow?.RowVer : undefined }));
      if (!quiet) showToast({ icon: "success", title: `Saved as draft v${r.versionNo}` });
      setLocalDraft(false);
      await refresh(r.versionNo);
      onChanged?.();
      return true;
    } catch (e) { alertError("Save failed", e.message); return false; }
    finally { setBusy(false); }
  };
  const openSubmit = async () => {
    if (blockIfErrors()) return;
    if (reason.trim().length < 5) { alertError("Reason for change required", "Write why this change is needed (min. 5 characters) in the yellow box — e.g. CC-2026-031."); return; }
    if (effDef && !diffVsEff.length) { alertError("Nothing to submit", "This draft is identical to the live version."); return; }
    if (dirty || mode === "local") { const ok = await saveDraft({ quiet: true }); if (!ok) return; }
    setDialog("submit");
  };
  const run = async (fn, okMsg) => {
    setBusy(true);
    try { const r = await call(fn()); if (okMsg) showToast({ icon: "success", title: typeof okMsg === "function" ? okMsg(r) : okMsg }); setDialog(null); return r; }
    catch (e) { alertError("Action failed", e.message); return null; }
    finally { setBusy(false); }
  };
  const afterAction = async (goVer) => { await refresh(goVer); onChanged?.(); };
  const doSubmit = ({ typedName }) => run(() => submitTypeDraft(typeKey, { typedName, rowVer: viewRow?.RowVer }), `v${viewVer} sent for approval`).then((r) => r && afterAction(viewVer));
  const doApprove = ({ typedName, comment, checked }) => run(() => approveTypeDraft(typeKey, { typedName, comment, applyToActive: checked }),
    (r) => `v${r.versionNo} is now live${r.registersUpdated ? ` · ${r.registersUpdated} register(s) moved` : ""}`).then((r) => r && afterAction());
  const doReturn = ({ comment }) => run(() => returnTypeDraft(typeKey, { comment }), "Returned to the author").then((r) => r && afterAction(viewVer));
  const doDiscard = async ({ comment }) => {
    const r = await run(() => discardTypeDraft(typeKey, { reason: comment }), "Draft discarded");
    if (!r) return;
    if (!effRow) { onChanged?.(); onBack(); return; }
    afterAction();
  };
  const doRetire = ({ typedName, comment }) => run(() => setTypeRetired(typeKey, { retire: !retired, reason: comment, typedName }),
    (r) => (retired ? "Template reactivated" : `Template retired${r.activeRegisters ? ` · ${r.activeRegisters} active register(s) keep running` : ""}`)).then((r) => r && afterAction(retired ? undefined : effRow?.VersionNo));
  const resetChanges = () => { if (!dirty || !window.confirm("Undo all unsaved changes?")) return; beginLocal(effDef); };

  /* ── import / copy ── */
  const importJson = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(String(r.result));
        if (!Array.isArray(j.columns) || !j.columns.length) throw new Error("No fields found in this file.");
        if (!window.confirm("Replace the current fields with the imported ones? (Undo with Ctrl+Z)")) return;
        ed.replaceAll(j, true);
        showToast({ icon: "success", title: `${j.columns.length} fields imported` });
      } catch (e) { alertError("Import failed", e.message); }
    };
    r.readAsText(file); if (fileRef.current) fileRef.current.value = "";
  };
  const copyFrom = (k) => {
    const src = types.find((t) => t.key === k); if (!src) return;
    if (!window.confirm(`Replace current fields with the fields of “${src.name}”?`)) return;
    ed.replaceAll(src, true);
    if (isNew && src.refType) ed.setD({ refType: src.refType });
  };
  const loadStandard = () => {
    if (!meta?.standard || !window.confirm("Replace with the system standard definition? (Undo with Ctrl+Z)")) return;
    ed.replaceAll(meta.standard, false);
  };

  /* ── keyboard ── */
  const act = useRef({}); act.current = { saveDraft, ed, editing, tab, dialog, dirty, printOpen };
  useEffect(() => {
    const h = (e) => {
      const a = act.current; if (a.dialog || a.printOpen) return;
      const mod = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
      if (mod && k === "p") { e.preventDefault(); setPrintOpen("format"); return; }
      if (!a.editing) return;
      const inField = /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || "");
      if (mod && k === "s") { e.preventDefault(); if (a.dirty) a.saveDraft(); }
      else if (mod && k === "z" && !inField) { e.preventDefault(); e.shiftKey ? a.ed.redo() : a.ed.undo(); }
      else if (mod && k === "y" && !inField) { e.preventDefault(); a.ed.redo(); }
      else if (e.key === "Delete" && !inField && a.tab === "design" && a.ed.selId) a.ed.removeCol(a.ed.selId);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => {
    const h = (e) => { if (act.current.dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  /* ── render ── */
  const d = ed.draft;
  if (!d || (!isNew && !meta)) return <div className={`h-full w-full flex items-center justify-center bg-[#f1f4fb] text-[13px] text-[#5b6b85]`}><FaIcons.FaSpinner className="animate-spin mr-2" /> Loading template…</div>;

  const th = themeOf(d.category);
  const CI = CAT_ICON[d.category] || FaIcons.FaClipboardList;
  const verLabel = mode === "new" ? "v1" : mode === "local" ? `v${nextVer}` : `v${viewVer}`;
  const statusText = mode === "new" ? "New — not saved" : mode === "local" ? (dirty ? "Unsaved changes" : `Live v${effRow?.VersionNo}`) : TPL_STATUS[viewRow?.Status]?.l || "";
  const step = mode === "InReview" ? 1 : (mode === "Effective" || (mode === "local" && !dirty)) ? 2 : 0;
  const activeRegs = versions.reduce((a, v) => a + (v.activeRegisters || 0), 0);
  const nErr = analysis.errors.length; const nWarn = analysis.warns.length;
  const printVer = {
    label: mode === "local" && !dirty ? `v${effRow?.VersionNo}` : verLabel,
    status: mode === "local" && !dirty ? "Effective" : mode === "local" || mode === "new" ? "Draft" : viewRow?.Status,
    effectiveFrom: (mode === "local" && !dirty ? effRow : viewRow)?.EffectiveFrom,
    preparedBy: (mode === "local" && !dirty ? effRow : viewRow)?.UpdatedBy || (mode === "local" && !dirty ? effRow : viewRow)?.CreatedBy,
    reviewedBy: (mode === "local" && !dirty ? effRow : viewRow)?.SubmittedBy,
    approvedBy: (mode === "local" && !dirty ? effRow : viewRow)?.ApprovedBy,
    approvedAt: (mode === "local" && !dirty ? effRow : viewRow)?.ApprovedAt,
  };
  const TABS = [
    { k: "design", l: "Form design", i: FaIcons.FaPencilRuler || FaIcons.FaPen, c: "#4338ca" },
    { k: "settings", l: "Settings & workflow", i: FaIcons.FaSlidersH, c: "#0e7490" },
    { k: "preview", l: "Try the form", i: FaIcons.FaPlayCircle, c: "#059669" },
    { k: "check", l: "GMP check", i: FaIcons.FaShieldAlt, c: "#d97706", badge: nErr || nWarn, bad: nErr > 0 },
    ...(!isNew ? [{ k: "history", l: "History", i: FaIcons.FaHistory, c: "#7c3aed", badge: versions.filter((v) => v.Status !== "Discarded").length, neutral: true }] : []),
  ];

  return (
    <div className={`h-full w-full overflow-y-auto bg-[#f1f4fb] ${erp.font}`}>
      {/* ── colourful header ── */}
      <div className="relative overflow-hidden text-white" style={{ background: `linear-gradient(120deg, ${th.from}, ${th.to})` }}>
        <div className="absolute -right-10 -top-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute right-56 -bottom-20 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center gap-3 px-5 pt-4 pb-3">
          <button type="button" onClick={() => leave(onBack)} title="Back to templates" className="h-[34px] w-[34px] rounded-[9px] bg-white/15 hover:bg-white/25 flex items-center justify-center"><FaIcons.FaArrowLeft size={12} /></button>
          <span className="w-[46px] h-[46px] rounded-[13px] bg-white/20 flex items-center justify-center shrink-0 shadow-inner"><CI size={20} /></span>
          <div className="min-w-0">
            <div className="text-[19px] font-extrabold leading-tight truncate">{d.name || "New logbook template"}</div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-white font-extrabold" style={{ color: th.text }}>{verLabel}</span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${dirty ? "bg-amber-300 text-amber-950" : "bg-white/20"}`}>{statusText}</span>
              {retired && <span className="px-2 py-0.5 rounded-full bg-red-500 font-bold">Retired</span>}
              <span className="px-2 py-0.5 rounded-full bg-white/15 capitalize">{d.category} · {d.refType}</span>
              {d.docNo && <span className="px-2 py-0.5 rounded-full bg-white/15">Format {d.docNo}</span>}
              <span className="px-2 py-0.5 rounded-full bg-white/15">{d.columns.length} fields</span>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {editing && <>
              <button type="button" onClick={ed.undo} disabled={!ed.canUndo} title="Undo (Ctrl+Z)" className="h-[34px] w-[34px] rounded-[9px] bg-white/15 hover:bg-white/25 disabled:opacity-35 flex items-center justify-center"><FaIcons.FaUndo size={11} /></button>
              <button type="button" onClick={ed.redo} disabled={!ed.canRedo} title="Redo (Ctrl+Y)" className="h-[34px] w-[34px] rounded-[9px] bg-white/15 hover:bg-white/25 disabled:opacity-35 flex items-center justify-center"><FaIcons.FaRedo size={11} /></button>
            </>}
            <button type="button" onClick={() => setPrintOpen("format")} className="h-[34px] px-3 rounded-[9px] bg-white/15 hover:bg-white/25 text-[12.5px] font-bold flex items-center gap-2"><FaIcons.FaPrint size={12} /> Print</button>
            <div className="relative">
              <button type="button" onClick={() => setMenu((m) => !m)} className="h-[34px] px-3 rounded-[9px] bg-white/15 hover:bg-white/25 text-[12.5px] font-bold flex items-center gap-2"><FaIcons.FaDownload size={11} /> Export <FaIcons.FaChevronDown size={8} /></button>
              {menu && (
                <div className="absolute right-0 mt-1 w-[220px] rounded-[10px] bg-white text-[#0f172a] shadow-2xl border border-[#e3e9f4] overflow-hidden z-30" onMouseLeave={() => setMenu(false)}>
                  {[[FaIcons.FaFileExcel, "#15803d", "Excel — field list (.csv)", () => exportExcel(toDefinition(d), printVer.label)],
                    [FaIcons.FaFilePdf, "#dc2626", "PDF — logbook format", () => setPrintOpen("format")],
                    [FaIcons.FaFilePdf, "#dc2626", "PDF — specification", () => setPrintOpen("spec")],
                    [FaIcons.FaFileCode, "#b45309", "JSON — backup", () => exportJson(toDefinition(d), printVer.label)],
                    ...(editing ? [[FaIcons.FaFileImport, "#4338ca", "Import fields from JSON…", () => fileRef.current?.click()]] : []),
                  ].map(([I, c, l, fn]) => (
                    <button key={l} type="button" className="w-full px-3 py-2 text-left text-[12.5px] hover:bg-[#f4f7fc] flex items-center gap-2.5" onClick={() => { setMenu(false); fn(); }}><I style={{ color: c }} /> {l}</button>
                  ))}
                </div>
              )}
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importJson(e.target.files?.[0])} />
            </div>
          </div>
        </div>

        {/* step tracker + main actions */}
        <div className="relative mx-3 mb-0 rounded-t-[12px] bg-white text-[#0f172a] px-4 py-2.5 flex flex-wrap items-center gap-3 shadow-sm">
          <Stepper step={step} th={th} />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {mode === "Effective" && !openRow && me.canDesign && !retired && <Btn kind="primary" onClick={() => beginLocal(effDef)}><FaIcons.FaPencilAlt size={10} /> Edit template</Btn>}
            {mode === "Effective" && me.canApprove && <Btn kind={retired ? "ghost" : "danger"} onClick={() => setDialog("retire")}>{retired ? <><FaIcons.FaRedo size={10} /> Reactivate</> : <><FaIcons.FaBan size={10} /> Retire</>}</Btn>}
            {mode === "Superseded" && <Btn onClick={() => refresh()}>Back to current version</Btn>}
            {mode === "local" && me.canApprove && !dirty && <Btn kind={retired ? "ghost" : "danger"} onClick={() => setDialog("retire")}><FaIcons.FaBan size={10} /> Retire</Btn>}
            {editing && isStandard && <Btn onClick={loadStandard} title="Start from the system standard definition"><FaIcons.FaUndoAlt size={10} /> Load standard</Btn>}
            {mode === "local" && dirty && <Btn onClick={resetChanges}>Reset changes</Btn>}
            {mode === "new" && <Btn onClick={() => leave(onBack)}>Cancel</Btn>}
            {mode === "Draft" && editing && <Btn kind="danger" onClick={() => setDialog("discard")} disabled={busy}><FaIcons.FaTrash size={10} /> Discard draft</Btn>}
            {editing && <Btn onClick={() => saveDraft()} disabled={!dirty || busy}><FaIcons.FaSave size={11} /> {busy ? "Saving…" : "Save draft"} <Kbd>Ctrl+S</Kbd></Btn>}
            {editing && mode !== "new" && (mode === "Draft" || dirty) && (
              <button type="button" onClick={openSubmit} disabled={busy} className="h-[32px] px-4 rounded-[7px] text-white text-[12.5px] font-bold flex items-center gap-2 shadow-md hover:brightness-110 disabled:opacity-50" style={{ background: `linear-gradient(120deg, ${th.from}, ${th.to})` }}>
                <FaIcons.FaPaperPlane size={11} /> Send for approval
              </button>
            )}
            {canApproveThis && <>
              <Btn onClick={() => setDialog("return")} disabled={busy}><FaIcons.FaReply size={10} /> Return</Btn>
              <button type="button" onClick={() => setDialog("approve")} disabled={busy} className="h-[32px] px-4 rounded-[7px] bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[12.5px] font-bold flex items-center gap-2 shadow-md hover:brightness-110"><FaIcons.FaCheckDouble size={11} /> Approve &amp; make live</button>
            </>}
          </div>
        </div>
      </div>

      <div className="mx-3 rounded-b-[12px] bg-white border-t border-[#eef1f8] shadow-sm overflow-x-auto">
        <div className="flex items-center gap-1 px-3 py-2">
          {TABS.map((t) => {
            const on = tab === t.k;
            return (
              <button key={t.k} type="button" onClick={() => setTab(t.k)} className={`h-[34px] px-3.5 rounded-[9px] text-[12.5px] font-bold flex items-center gap-2 whitespace-nowrap transition-all ${on ? "text-white shadow-md" : "text-[#475569] hover:bg-[#f4f7fc]"}`} style={on ? { background: t.c } : undefined}>
                <t.i size={12} style={on ? undefined : { color: t.c }} /> {t.l}
                {t.badge > 0 && <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center ${on ? "bg-white/25 text-white" : t.neutral ? "bg-[#e2e8f0] text-[#475569]" : t.bad ? "bg-[#dc2626] text-white" : "bg-amber-500 text-white"}`}>{t.badge}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* reason for change */}
        {editing && (mode !== "local" || dirty) && (
          <div className="flex flex-wrap items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
            <FaIcons.FaEdit className="text-amber-600" size={13} />
            <label className="text-[11.5px] font-extrabold uppercase tracking-[0.3px] text-amber-900 whitespace-nowrap">Reason for change <span className="text-[#dc2626]">*</span></label>
            <input className={`${inputS} flex-1 min-w-[240px] !bg-white`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500}
              placeholder={isNew ? "e.g. New format as per SOP/QA/021 — CC-2026-045" : "e.g. Added batch number column — CC-2026-031"} />
          </div>
        )}

        {/* context banners */}
        {mode === "local" && !dirty && !retired && <Banner tone="green" icon={FaIcons.FaHandPointer}>
          <b>Edit mode.</b> Drag fields from the <b>Field library</b> or click one to add it. Click any field to change it on the right. When done: <b>Save draft</b> → <b>Send for approval</b>. Running registers keep <b>v{effRow?.VersionNo}</b> until QA approves <b>v{nextVer}</b>.</Banner>}
        {mode === "local" && dirty && <Banner tone="amber" icon={FaIcons.FaCodeBranch}>You are preparing <b>v{nextVer}</b>. Nothing changes for running registers until it is approved.</Banner>}
        {mode === "new" && <Banner tone="green" icon={FaIcons.FaMagic}>Give the template a name in <b>Settings &amp; workflow</b>, build the form here (or <b>copy fields</b> from an existing logbook), then <b>Save draft</b>.</Banner>}
        {retired && <Banner tone="red" icon={FaIcons.FaBan}>Retired — no new registers can be issued. Running registers continue until closed.</Banner>}
        {mode === "Draft" && viewRow?.ReviewComment && <Banner tone="amber" icon={FaIcons.FaReply}>Returned by <b>{viewRow.ReviewedBy}</b> ({fmtDateTime(viewRow.ReviewedAt)}): “{viewRow.ReviewComment}”</Banner>}
        {mode === "Draft" && !viewRow?.ReviewComment && <Banner icon={FaIcons.FaSave}>Draft <b>v{viewVer}</b> saved {fmtDateTime(viewRow?.UpdatedAt || viewRow?.CreatedAt)}. Keep editing, or <b>Send for approval</b> when ready.</Banner>}
        {mode === "InReview" && !canApproveThis && <Banner icon={FaIcons.FaHourglassHalf}>Sent for approval by <b>{viewRow?.SubmittedBy}</b>. Waiting for {(me.approverRoles || []).join(" / ") || "an approver"}{isAuthor ? " — a different person must approve your change." : "."}</Banner>}
        {mode === "InReview" && canApproveThis && <Banner tone="blue" icon={FaIcons.FaUserShield} action={<Btn kind="primary" className="!h-[28px]" onClick={() => setDialog("approve")}>Review &amp; approve</Btn>}>
          <b>{viewRow?.SubmittedBy}</b> sent <b>v{viewVer}</b> for your approval. Reason: “{viewRow?.ChangeReason}”. {diffVsEff.length} change(s).</Banner>}
        {mode === "Effective" && openRow && <Banner tone="amber" icon={FaIcons.FaCodeBranch} action={<Btn className="!h-[28px]" onClick={() => refresh(openRow.VersionNo)}>Open v{openRow.VersionNo}</Btn>}>
          <b>v{openRow.VersionNo}</b> is {TPL_STATUS[openRow.Status].l.toLowerCase()} by {openRow.UpdatedBy || openRow.CreatedBy}.</Banner>}
        {mode === "Superseded" && <Banner tone="gray" icon={FaIcons.FaArchive}>Old version — read only.</Banner>}
        {!me.canDesign && !isNew && <Banner tone="gray" icon={FaIcons.FaLock}>Read only — editing templates needs the role {(me.designerRoles || []).join(" / ") || "template designer"}.</Banner>}

        {tab === "design" && (
          <DesignTab ed={ed} editing={editing} lockedKeys={lockedKeys} errorIds={errorIds}
            toolbar={editing && isNew ? (
              <select className={`${inputS} !w-[180px] !h-[28px]`} value="" onChange={(e) => e.target.value && copyFrom(e.target.value)}>
                <option value="">Copy fields from…</option>
                {types.filter((t) => t.effective !== false).map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
              </select>) : null} />
        )}
        {tab === "settings" && <SettingsTab ed={ed} editing={editing} isStandard={isStandard} refLocked={!!effRow} roleOpts={roleOpts} />}
        {tab === "preview" && (
          <div className={`${erp.card} overflow-hidden`}>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-50 to-white border-b border-[#e3e9f4] text-[12.5px] font-bold text-emerald-900"><FaIcons.FaPlayCircle className="text-emerald-600" /> Try the entry form exactly as the operator will see it <span className="ml-auto text-[11px] font-normal text-[#5b6b85]">Nothing here is saved</span></div>
            <PreviewForm key={sig(d.columns.map((c) => c.key))} columns={d.columns} entrySign={d.entrySign} />
          </div>
        )}
        {tab === "check" && <ComplianceTab analysis={analysis} onPick={(id) => { ed.setSelId(id); setTab("design"); }} />}
        {tab === "history" && <HistoryTab typeKey={typeKey} versions={versions} viewVer={localDraft ? null : viewVer} onView={(v) => leave(() => refresh(v).then(() => setTab("design")))} />}

        {editing && <div className="text-[11px] text-[#94a3b8] px-1 pb-2">Ctrl+S save · Ctrl+Z undo · Ctrl+Y redo · Del remove field · Ctrl+P print</div>}
      </div>

      {/* ── dialogs ── */}
      {printOpen && <PrintCenter def={toDefinition(d)} ver={printVer} versions={versions} company={company} userName={me.name} initial={printOpen} onClose={() => setPrintOpen(null)} />}
      {dialog === "submit" && (
        <SignDialog title={`Send v${viewVer} for approval`} sign meaning={`I submit version ${viewVer} of “${d.name}” for approval and confirm it is complete.`} confirmLabel="Sign & send" busy={busy} onCancel={() => setDialog(null)} onConfirm={doSubmit}>
          <div><div className="text-[10.5px] font-bold uppercase tracking-[0.3px] text-[#5b6b85] mb-1">Reason for change</div><div className="text-[12.5px] text-[#1e293b] rounded-[5px] bg-[#f4f7fc] px-2.5 py-1.5">{reason}</div></div>
          <div><div className="text-[10.5px] font-bold uppercase tracking-[0.3px] text-[#5b6b85] mb-1">{effDef ? `Changes against live v${effRow?.VersionNo}` : "New template"} ({diffVsEff.length})</div>
            <div className="max-h-48 overflow-y-auto rounded-[5px] border border-[#e3e9f4] divide-y divide-[#eef1f8]"><DiffList diff={diffVsEff} /></div></div>
          {nWarn > 0 && <div className="text-[12px] text-amber-700"><FaIcons.FaExclamationTriangle className="inline -mt-0.5 mr-1" />{nWarn} GMP warning(s) — the approver will see them.</div>}
        </SignDialog>
      )}
      {dialog === "approve" && (
        <SignDialog title={`Approve v${viewVer} — ${d.name}`} sign meaning={`I have reviewed version ${viewVer} and approve it as the effective logbook format.`} confirmLabel="Sign & approve" busy={busy}
          comment={{ label: "Approval comment", placeholder: "Optional" }}
          checkbox={effDef && activeRegs ? { label: `Also move the ${activeRegs} running register(s) to v${viewVer}`, hint: "Off (recommended): running registers finish on their current format; new registers use the new version." } : null}
          onCancel={() => setDialog(null)} onConfirm={doApprove}>
          <div className="text-[12.5px] text-[#1e293b]"><b>Reason for change:</b> {viewRow?.ChangeReason}<br /><span className="text-[#5b6b85]">Prepared by {viewRow?.UpdatedBy || viewRow?.CreatedBy} · sent by {viewRow?.SubmittedBy}</span></div>
          <div className="max-h-48 overflow-y-auto rounded-[5px] border border-[#e3e9f4] divide-y divide-[#eef1f8]"><DiffList diff={diffVsEff} /></div>
          {(nErr > 0 || nWarn > 0) && <div className="text-[12px] text-amber-700"><FaIcons.FaExclamationTriangle className="inline -mt-0.5 mr-1" />GMP check: {nErr} blocking, {nWarn} warning(s).</div>}
        </SignDialog>
      )}
      {dialog === "return" && <SignDialog title={`Return v${viewVer} for correction`} comment={{ label: "What needs to be corrected", required: true, placeholder: "e.g. Add unit °C and limits 2–8 to Temperature" }} confirmLabel="Return to author" busy={busy} onCancel={() => setDialog(null)} onConfirm={doReturn} />}
      {dialog === "discard" && <SignDialog title={`Discard draft v${viewVer}`} danger confirmLabel="Discard draft" busy={busy}
        comment={{ label: "Reason (optional)", placeholder: "e.g. Change no longer required" }} onCancel={() => setDialog(null)} onConfirm={doDiscard}>
        <div className="text-[12.5px] text-[#1e293b]">The draft stays in the history as “Discarded” and can no longer be edited.</div>
      </SignDialog>}
      {dialog === "retire" && <SignDialog title={retired ? "Reactivate template" : "Retire template"} sign danger={!retired} meaning={retired ? `I reactivate “${d.name}” so new registers can be issued.` : `I retire “${d.name}” — no new registers may be issued against it.`}
        comment={{ label: "Reason", required: true, placeholder: retired ? "e.g. Format required again" : "e.g. Replaced by online monitoring (CC-2026-050)" }}
        confirmLabel={retired ? "Sign & reactivate" : "Sign & retire"} busy={busy} onCancel={() => setDialog(null)} onConfirm={doRetire}>
        {!retired && activeRegs > 0 && <div className="text-[12.5px] text-amber-700"><FaIcons.FaInfoCircle className="inline -mt-0.5 mr-1" />{activeRegs} running register(s) keep working until closed.</div>}
      </SignDialog>}
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";
import ERPSettings, { CheckboxCtrl } from "../../Reusable/ERPSettings";
import { useApplSettings } from "../../../Hooks/useApplSettings";
import { getQmsSettingsOverview, saveApplSettings } from "../../../pages/Modules/QMS/Utils/QmsAPI";
import { useSaveSlot } from "./SaveBus";   // SettingsPage se nahi — circular import hat gaya

/* Font: SettingsPage ke root par ERP_FONT lagta hai, yahan sab inherit karta hai.
   Sizes: text 13px · controls 12.5px · hints/headers 12px */
const inp = "h-[30px] rounded-md border bg-white px-2 text-[12.5px] text-slate-800 outline-none transition-colors focus:ring-2";
const inpOk = "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100";
const inpBad = "border-red-300 focus:border-red-400 focus:ring-red-100";

/* settingsConfig ke row label se control key nikalo (key naam guess nahi karna) */
const findKey = (config, label) => {
  for (const sec of config || [])
    for (const row of sec.rows || [])
      if (String(row.label || "").toLowerCase().includes(label)) return row.controls?.[0]?.key;
  return undefined;
};

const SEP = { slash: "/", dash: "-", hyphen: "-", underscore: "_", dot: ".", none: "" };

/* live record-number preview — backend ka wait nahi, form ki current values se */
function buildRecordNo(fmt, keys, prefix, next) {
  const rawSep = String(fmt[keys.sep] ?? "/");
  const sep = Object.prototype.hasOwnProperty.call(SEP, rawSep.toLowerCase()) ? SEP[rawSep.toLowerCase()] : rawSep;
  const yp = String(fmt[keys.year] ?? "YYYY").toUpperCase();
  const y = String(new Date().getFullYear());
  const year = yp.includes("YYYY") ? y : yp.includes("YY") ? y.slice(-2) : "";
  const digits = Math.max(1, parseInt(fmt[keys.digits], 10) || 4);
  const num = String(Math.max(0, parseInt(next, 10) || 0)).padStart(digits, "0");
  return [prefix || "", year, num].filter(Boolean).join(sep);
}

export default function QmsModulePanel({ slotId = "QMS" }) {
  const { settingsConfig, settingsDefaults, onSettingsSave } = useApplSettings("QMS");
  const [fmtDraft, setFmtDraft] = useState(null);
  const [fmtKey, setFmtKey] = useState(0);

  const [mods, setMods] = useState([]);
  const [dirty, setDirty] = useState({});
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    const r = await getQmsSettingsOverview();
    setMods(r?.modules || []);
    setDirty({});
  }, []);
  useEffect(() => { load(); }, [load]);

  const edit = (applName, key, value) => {
    setMods((p) => p.map((m) => (m.applName === applName ? { ...m, values: { ...m.values, [key]: value } } : m)));
    setDirty((p) => ({ ...p, [applName]: { ...(p[applName] || {}), [key]: value } }));
  };

  // one save for both: global format + per-module rows
  const save = useCallback(async () => {
    if (fmtDraft) { await onSettingsSave(fmtDraft); setFmtDraft(null); setFmtKey((k) => k + 1); }
    for (const [applName, values] of Object.entries(dirty)) await saveApplSettings(applName, values);
    await load();
  }, [fmtDraft, dirty, onSettingsSave, load]);

  const changes = Object.keys(dirty).length + (fmtDraft ? 1 : 0);
  useSaveSlot(slotId, changes > 0, save);

  const discard = async () => { setFmtDraft(null); setFmtKey((k) => k + 1); await load(); };

  // format controls ke keys — config ke label se
  const keys = useMemo(() => ({
    mode: findKey(settingsConfig, "numbering mode"),
    sep: findKey(settingsConfig, "separator"),
    year: findKey(settingsConfig, "year part"),
    digits: findKey(settingsConfig, "sequence digits"),
  }), [settingsConfig]);

  // current format = saved defaults + jo abhi edit ho raha hai (live)
  const fmt = useMemo(() => ({ ...(settingsDefaults || {}), ...(fmtDraft || {}) }), [settingsDefaults, fmtDraft]);
  const isManual = String(fmt[keys.mode] || "Auto") === "Manual";

  // duplicate prefix check
  const dupPrefix = useMemo(() => {
    const c = {};
    mods.forEach((m) => { const p = String(m.values.recordPrefix || "").trim().toUpperCase(); if (p) c[p] = (c[p] || 0) + 1; });
    return new Set(Object.keys(c).filter((p) => c[p] > 1));
  }, [mods]);

  const visible = useMemo(() => {
    const s = filter.trim().toLowerCase();
    return s ? mods.filter((m) => m.label.toLowerCase().includes(s) || m.applName.toLowerCase().includes(s)) : mods;
  }, [mods, filter]);

  const headPreview = mods[0] ? buildRecordNo(fmt, keys, mods[0].values.recordPrefix, mods[0].values.nextNumber) : "";

  return (
    <div className="flex flex-col gap-3 text-[13px]">
      {/* unsaved bar */}
      {changes > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12.5px] text-amber-800">
          <span className="font-semibold">{changes} unsaved change{changes > 1 ? "s" : ""}</span>
          <span className="text-amber-700/80">— use Save at the top right</span>
          <button type="button" onClick={discard}
            className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 text-[12px] font-medium text-amber-800 hover:bg-amber-100">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Discard
          </button>
        </div>
      )}

      {/* global format */}
      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <span className="font-semibold text-slate-700">Record number format</span>
          <span className="text-[12px] text-slate-500">one format for all {mods.length || ""} QMS screens</span>
          <div className="ml-auto flex items-center gap-2">
            {/* {isManual && <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[11.5px] font-medium text-slate-600">Manual — user types the number</span>} */}
            {headPreview && (
              <span className="rounded bg-indigo-50 px-2.5 py-1 font-mono text-[12.5px] font-semibold text-indigo-700" title="Live preview">{headPreview}</span>
            )}
          </div>
        </div>
        <ERPSettings key={fmtKey} applName="QMS" config={settingsConfig} initialValues={settingsDefaults} hideFooter onChange={setFmtDraft} />
      </div>

      {/* per-module rules */}
      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <span className="font-semibold text-slate-700">Module rules</span>
          <span className="text-[12px] text-slate-500">prefix, next number and auto-create per module</span>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter modules" className={`${inp} ${inpOk} ml-auto w-[170px]`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[12px] font-semibold text-slate-500">
                <th className="w-[210px] border-b border-slate-200 px-3 py-2 text-left">Module</th>
                <th className="w-[110px] border-b border-slate-200 px-3 py-2 text-left">Prefix</th>
                <th className="w-[110px] border-b border-slate-200 px-3 py-2 text-right">Next no.</th>
                <th className="w-[180px] border-b border-slate-200 px-3 py-2 text-left">Next record</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left">Auto-create</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">{mods.length ? "No module matches the filter." : "Loading modules…"}</td></tr>
              )}
              {visible.map((m, i) => {
                const prefix = String(m.values.recordPrefix ?? "");
                const isDup = dupPrefix.has(prefix.trim().toUpperCase());
                const noPrefix = !prefix.trim();
                const badNext = !(parseInt(m.values.nextNumber, 10) >= 1);
                return (
                  <tr key={m.applName} className={`border-b border-slate-100 ${dirty[m.applName] ? "bg-amber-50/60" : i % 2 ? "bg-slate-50/40" : "bg-white"}`}>
                    <td className="px-3 py-2 align-middle">
                      <span className="font-semibold text-slate-800">{m.label}</span>
                      <span className="ml-2 font-mono text-[12px] text-slate-400">{m.applName}</span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <input className={`${inp} ${isDup || noPrefix ? inpBad : inpOk} w-[80px] uppercase`} value={prefix}
                        title={isDup ? "This prefix is already used by another module" : noPrefix ? "Prefix required" : ""}
                        onChange={(e) => edit(m.applName, "recordPrefix", e.target.value.toUpperCase().replace(/\s/g, ""))} />
                      {isDup && <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-red-500" aria-label="Duplicate prefix" />}
                    </td>
                    <td className="px-3 py-2 text-right align-middle">
                      <input type="number" min={1} className={`${inp} ${badNext ? inpBad : inpOk} w-[80px] text-right`} value={m.values.nextNumber ?? ""}
                        onChange={(e) => edit(m.applName, "nextNumber", e.target.value)} />
                    </td>
                    <td className="px-3 py-2 align-middle font-mono text-[12.5px] font-medium text-slate-700">
                      {buildRecordNo(fmt, keys, prefix, m.values.nextNumber)}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {m.autoCreate.length === 0 ? <span className="text-slate-300">—</span> : (
                        <div className="flex flex-col gap-1.5">
                          {m.autoCreate.map((a) => (
                            <div key={a.key} className="flex items-center gap-2.5">
                              <CheckboxCtrl value={!!m.values[a.key]} onChange={(v) => edit(m.applName, a.key, v)} />
                              <span className="cursor-pointer select-none text-[13px] text-slate-700"
                                onClick={() => edit(m.applName, a.key, !m.values[a.key])}>{a.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
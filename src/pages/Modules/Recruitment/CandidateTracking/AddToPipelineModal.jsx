import React, { useEffect, useMemo, useRef, useState } from "react";
import ERPFormModal from "../../../../components/Reusable/form/ERPModal";
import SectionCard, { FormField, formInputClass } from "../../../../components/Reusable/form/SectionCard";
import { AddButton, DiscardButton } from "../../../../components/Reusable/button/ActionButon";
import { showToast, alertError } from "../../../../components/Reusable/alert";
import { addToPipeline, getAvailablePipelineCandidates, getActiveVacanciesWithJD } from "../../../../utils/recruitmentApi";
import { UserPlus, Search, Check, Phone, Mail, Briefcase, X, ArrowRight, Loader2, Users } from "lucide-react";
import { initials } from "./pipelineConstants";

// Picks a registered candidate (not yet in the pipeline) and the vacancy to track them against.
export default function AddToPipelineModal({ isOpen, onClose, onAdded }) {
  const [candidates, setCandidates] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [vacancyId, setVacancyId] = useState("");
  const [cursor, setCursor] = useState(0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setCandidateId(""); setVacancyId(""); setFilter(""); setErrors({}); setCursor(0);
    setLoading(true);
    Promise.all([getAvailablePipelineCandidates(), getActiveVacanciesWithJD()]).then(([c, v]) => {
      setCandidates(c?.data || []);
      setVacancies(v?.data || []);
      setLoading(false);
    });
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) =>
      [c.full_name, c.candidate_code, c.mobile, c.email].some((x) => String(x || "").toLowerCase().includes(q))
    );
  }, [candidates, filter]);

  useEffect(() => { setCursor(0); }, [filter]);

  const selected = candidates.find((c) => c.candidate_id === candidateId);
  const selectedVacancy = vacancies.find((v) => String(v.vacancy_id) === String(vacancyId));

  const pickCandidate = (id) => {
    setCandidateId(id);
    const c = candidates.find((x) => x.candidate_id === id);
    if (c?.vacancy_id && vacancies.some((v) => String(v.vacancy_id) === String(c.vacancy_id))) setVacancyId(c.vacancy_id);
    setErrors({});
  };

  // ↑ / ↓ move through the list, Enter picks
  const onSearchKey = (e) => {
    if (!filtered.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(Math.max(cursor + (e.key === "ArrowDown" ? 1 : -1), 0), filtered.length - 1);
      setCursor(next);
      listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickCandidate(filtered[cursor]?.candidate_id);
    }
  };

  const handleSave = async () => {
    const e = {};
    if (!candidateId) e.candidate = "Select a candidate";
    if (!vacancyId) e.vacancy = "Select a vacancy";
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const res = await addToPipeline({ candidate_id: candidateId, vacancy_id: vacancyId });
    setSaving(false);
    if (res?.success) {
      showToast({ icon: "success", title: res.message || "Candidate added to pipeline" });
      onAdded?.(res.data);
    } else {
      alertError("Could not add", res?.message || "Failed to add candidate to pipeline");
    }
  };

  const vacancyLabel = (v) => v ? `${v.job_title || v.designation_name || "Open Position"}${v.vacancy_no ? ` (${v.vacancy_no})` : ""}` : "";

  return (
    <ERPFormModal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="rounded-xl overflow-hidden shadow-2xl" style={{ background: "var(--bg-main)" }}>
        <div className="p-3 space-y-3">
          <SectionCard title="ADD TO PIPELINE" icon={<UserPlus className="w-3 h-3" />} theme="indigo" bodyClassName="space-y-3">

            {/* ── Step 1 · Candidate ─────────────────────────────── */}
            <FormField
              label="Candidate"
              required
              error={errors.candidate}
              hint={loading ? "" : `${filtered.length} of ${candidates.length} available`}
            >
              {selected ? (
                <div
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
                  style={{ background: "var(--accent-soft)", border: "1px solid var(--icon-color)" }}
                >
                  <Avatar name={selected.full_name} solid />
                  <CandidateText c={selected} />
                  <button
                    type="button"
                    onClick={() => { setCandidateId(""); setVacancyId(""); }}
                    className="ml-auto shrink-0 h-[24px] px-2 rounded-md text-[11px] font-semibold flex items-center gap-1 hover:opacity-80"
                    style={{ color: "var(--icon-color)", background: "var(--bg-header)", border: "1px solid var(--border-main)" }}
                  >
                    <X size={12} /> Change
                  </button>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${errors.candidate ? "#f43f5e" : "var(--border-main)"}`, background: "var(--bg-header)" }}>
                  <div className="relative" style={{ borderBottom: "1px solid var(--border-main)" }}>
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      onKeyDown={onSearchKey}
                      placeholder="Search by name, code, mobile or email…"
                      className="w-full h-[34px] pl-8 pr-8 text-[12px] outline-none bg-transparent"
                      style={{ color: "var(--text-main)" }}
                      autoFocus
                      aria-label="Search candidates"
                    />
                    {filter && (
                      <button type="button" onClick={() => setFilter("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <ul ref={listRef} role="listbox" aria-label="Registered candidates" className="max-h-[216px] overflow-y-auto">
                    {loading ? (
                      <li className="flex items-center justify-center gap-2 py-8 text-[12px]" style={{ color: "var(--text-muted)" }}>
                        <Loader2 size={14} className="animate-spin" /> Loading candidates…
                      </li>
                    ) : filtered.length === 0 ? (
                      <li className="flex flex-col items-center justify-center gap-1 py-7 text-center">
                        <Users size={20} style={{ color: "var(--text-muted)" }} />
                        <span className="text-[12px] font-semibold" style={{ color: "var(--text-main)" }}>
                          {candidates.length ? "No candidate matches your search" : "No registered candidates available"}
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {candidates.length ? "Try another name, code or number." : "Everyone registered is already in the pipeline."}
                        </span>
                      </li>
                    ) : (
                      filtered.map((c, i) => (
                        <li
                          key={c.candidate_id}
                          role="option"
                          aria-selected={i === cursor}
                          onClick={() => pickCandidate(c.candidate_id)}
                          onMouseEnter={() => setCursor(i)}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 cursor-pointer transition-colors"
                          style={{
                            background: i === cursor ? "var(--accent-soft)" : undefined,
                            borderTop: i ? "1px solid var(--border-main)" : undefined,
                          }}
                        >
                          <Avatar name={c.full_name} />
                          <CandidateText c={c} />
                          {i === cursor && <ArrowRight size={13} className="ml-auto shrink-0" style={{ color: "var(--icon-color)" }} />}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </FormField>

            {/* ── Step 2 · Vacancy ───────────────────────────────── */}
            <FormField
              label="Vacancy"
              required
              error={errors.vacancy}
              hint={selected?.vacancy_no ? `registered for ${selected.vacancy_no}` : ""}
            >
              <div className="relative">
                <Briefcase size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                <select
                  value={vacancyId}
                  onChange={(e) => { setVacancyId(e.target.value); setErrors({}); }}
                  className={`${formInputClass(false, errors.vacancy)} !pl-8`}
                  aria-label="Vacancy"
                >
                  <option value="" disabled>-- Select Vacancy --</option>
                  {vacancies.map((v) => (
                    <option key={v.vacancy_id} value={v.vacancy_id}>{vacancyLabel(v)}</option>
                  ))}
                </select>
              </div>
            </FormField>

            {/* ── What happens next ──────────────────────────────── */}
            <div className="rounded-lg px-2.5 py-2 flex items-center gap-2 flex-wrap text-[11px]" style={{ background: "var(--accent-soft)", color: "var(--text-muted)" }}>
              <span className="font-semibold" style={{ color: "var(--text-main)" }}>On save</span>
              <Pill>{selected ? selected.full_name : "Candidate"}</Pill>
              <ArrowRight size={12} />
              <Pill>{selectedVacancy ? vacancyLabel(selectedVacancy) : "Vacancy"}</Pill>
              <ArrowRight size={12} />
              <span className="inline-flex items-center gap-1">
                <span className="w-[16px] h-[16px] rounded-full border-2 flex items-center justify-center text-[9px] font-bold" style={{ borderColor: "var(--icon-color)", color: "var(--icon-color)", background: "var(--bg-header)" }}>1</span>
                <strong style={{ color: "var(--text-main)" }}>Raw Data - Sourced</strong>
              </span>
              <span className="w-full">You are set as the recruiter for this record.</span>
            </div>
          </SectionCard>

          <div className="flex items-center justify-center gap-1">
            <AddButton isAdding onClick={handleSave} disabled={saving} loading={saving} />
            <DiscardButton onClick={onClose} />
          </div>
        </div>
      </div>
    </ERPFormModal>
  );
}

const Avatar = ({ name, solid = false }) => (
  <span
    className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
    style={solid ? { background: "var(--icon-color)", color: "#fff" } : { background: "var(--accent-soft)", color: "var(--icon-color)" }}
  >
    {solid ? <Check size={14} strokeWidth={3} /> : initials(name)}
  </span>
);

const CandidateText = ({ c }) => (
  <span className="min-w-0 flex-1">
    <span className="flex items-center gap-1.5 min-w-0">
      <span className="text-[12px] font-semibold truncate" style={{ color: "var(--text-main)" }}>{c.full_name || "—"}</span>
      <span className="text-[10px] font-semibold px-1.5 rounded shrink-0" style={{ background: "var(--bg-main)", color: "var(--text-muted)", border: "1px solid var(--border-main)" }}>
        {c.candidate_code}
      </span>
    </span>
    <span className="flex items-center gap-2.5 text-[10.5px] min-w-0" style={{ color: "var(--text-muted)" }}>
      {c.mobile && <span className="inline-flex items-center gap-1 shrink-0"><Phone size={10} />{c.mobile}</span>}
      {c.email && <span className="inline-flex items-center gap-1 truncate"><Mail size={10} className="shrink-0" /><span className="truncate">{c.email}</span></span>}
      {c.job_title && <span className="inline-flex items-center gap-1 truncate"><Briefcase size={10} className="shrink-0" /><span className="truncate">{c.job_title}</span></span>}
    </span>
  </span>
);

const Pill = ({ children }) => (
  <span className="max-w-[180px] truncate px-1.5 py-[1px] rounded font-medium" style={{ background: "var(--bg-header)", color: "var(--text-main)", border: "1px solid var(--border-main)" }}>
    {children}
  </span>
);

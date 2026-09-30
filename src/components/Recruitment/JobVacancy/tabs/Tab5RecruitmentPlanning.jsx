import React, { useState } from "react";
import ERPAutocomplete from "../../../Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../Reusable/input/Date";
import { FaCalendarAlt, FaBullhorn, FaUserCheck, FaPlus, FaTimes } from "react-icons/fa";

const SectionHeader = ({ title, icon, barBg, iconBg, text, border }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md border-b font-medium text-xs ${barBg} ${border} ${text}`}>
    <span className={`p-1 rounded ${iconBg}`}>{icon}</span>
    <span>{title}</span>
  </div>
);

const DEFAULT_SOURCES = ["Naukri.com", "LinkedIn", "Company Careers Website", "Employee Referral", "Consultant / Agency", "Walk-in Drive", "Campus Placement"];

const INTERVIEW_PROCESS_TEMPLATES = [
  { value: 1, label: "Technical Role (Screening → Tech Test → Tech Interview → HR → Management)" },
  { value: 2, label: "Sales & Marketing (Screening → Practical Assessment → Customer Calling → HR → Management)" },
  { value: 3, label: "Operations & Support (Screening → Aptitude Test → Panel Interview → HR Final)" },
  { value: 4, label: "Leadership & Executive (Executive Screening → Strategic Round → Management Interview)" },
];

const Tab5RecruitmentPlanning = ({
  formData,
  onChange,
  errors,
  isViewMode,
  employeeOptions = [],
}) => {
  const [customSrc, setCustomSrc] = useState("");

  const sources = formData.sources || [];

  const handleToggleSource = (srcName) => {
    if (isViewMode) return;
    const exists = sources.some((s) => (typeof s === "string" ? s : s.source_name) === srcName);
    if (exists) {
      onChange("sources", sources.filter((s) => (typeof s === "string" ? s : s.source_name) !== srcName));
    } else {
      onChange("sources", [...sources, { source_name: srcName }]);
    }
  };

  const handleAddCustomSource = () => {
    if (!customSrc.trim() || isViewMode) return;
    handleToggleSource(customSrc.trim());
    setCustomSrc("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-stretch">
      {/* ── Section 1: Ownership & Key Timeline (full width — 5 fields) ── */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <SectionHeader
          title="Ownership & Target Timeline"
          icon={<FaCalendarAlt />}
          barBg="bg-[#eff6ff]"
          iconBg="bg-[#2563eb]/15 text-[#2563eb]"
          text="text-[#0f2137]"
          border="border-[#bfdbfe]"
        />
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Recruitment Owner */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Recruitment Owner (HR / Recruiter) <span className="text-red-500">*</span>
            </label>
            <ERPAutocomplete
              options={employeeOptions.map((e) => e.label)}
              value={employeeOptions.find((e) => String(e.value) === String(formData.recruitment_owner_id))?.label || ""}
              onChange={(label) => {
                const found = employeeOptions.find((e) => e.label === label);
                onChange("recruitment_owner_id", found ? found.value : null);
              }}
              disabled={isViewMode}
              placeholder="Select recruiter..."
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${errors.recruitment_owner_id ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.recruitment_owner_id && <span className="text-[11px] text-red-500">{errors.recruitment_owner_id}</span>}
          </div>

          {/* Expected Candidate Pipeline */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Expected Pipeline Count
            </label>
            <input
              type="number"
              min="0"
              value={formData.expected_candidates || ""}
              disabled={isViewMode}
              onChange={(e) => onChange("expected_candidates", e.target.value)}
              placeholder="e.g. 15"
              className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500"
            />
          </div>

          {/* Recruitment Start Date */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Recruitment Start Date <span className="text-red-500">*</span>
            </label>
            <ERPDateInput
              value={formData.recruitment_start_date || ""}
              onChange={(val) => onChange("recruitment_start_date", val)}
              disabled={isViewMode}
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${errors.recruitment_start_date ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.recruitment_start_date && <span className="text-[11px] text-red-500">{errors.recruitment_start_date}</span>}
          </div>

          {/* Target Joining Date */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Target Joining Date <span className="text-red-500">*</span>
            </label>
            <ERPDateInput
              value={formData.target_joining_date || ""}
              onChange={(val) => onChange("target_joining_date", val)}
              disabled={isViewMode}
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${errors.target_joining_date ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.target_joining_date && <span className="text-[11px] text-red-500">{errors.target_joining_date}</span>}
          </div>

          {/* Application Closing Date */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Application Closing Date
            </label>
            <ERPDateInput
              value={formData.application_close_date || ""}
              onChange={(val) => onChange("application_close_date", val)}
              disabled={isViewMode}
              className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none"
            />
            {errors.application_close_date && <span className="text-[11px] text-red-500">{errors.application_close_date}</span>}
          </div>
        </div>
      </div>

      {/* ── Section 2: Sourcing Channels (left half) ── */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <SectionHeader
          title="Recruitment Sourcing Channels"
          icon={<FaBullhorn />}
          barBg="bg-[#e6f7f4]"
          iconBg="bg-[#0d9488]/15 text-[#0d9488]"
          text="text-[#0f2137]"
          border="border-[#b2e3da]"
        />
        <div className="p-3 sm:p-4 space-y-3">
          <p className="text-[11px] text-slate-500">
            Click to select active sourcing channels for this vacancy:
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {DEFAULT_SOURCES.map((src) => {
              const isSel = sources.some((s) => (typeof s === "string" ? s : s.source_name) === src);
              return (
                <button
                  key={src}
                  type="button"
                  disabled={isViewMode}
                  onClick={() => handleToggleSource(src)}
                  className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs rounded-full border transition-all ${isSel
                    ? "bg-teal-600 text-white border-teal-600 font-medium shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                >
                  {isSel ? "✓ " : "+ "}
                  {src}
                </button>
              );
            })}
          </div>

          {!isViewMode && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
              <input
                type="text"
                value={customSrc}
                onChange={(e) => setCustomSrc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustomSource())}
                placeholder="Add other sourcing portal / agency..."
                className="flex-1 h-[30px] px-2 text-xs border border-slate-300 rounded-md outline-none focus:border-teal-500"
              />
              <button
                type="button"
                onClick={handleAddCustomSource}
                className="h-[30px] px-3 text-xs bg-teal-700 text-white rounded-md hover:bg-teal-800 font-medium transition-colors whitespace-nowrap"
              >
                Add Source
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Evaluation Rounds & Workflow (right half) ── */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <SectionHeader
          title="Evaluation Rounds & Workflow Process"
          icon={<FaUserCheck />}
          barBg="bg-[#f3e8ff]"
          iconBg="bg-[#7c3aed]/15 text-[#7c3aed]"
          text="text-[#0f2137]"
          border="border-[#d4b8f5]"
        />
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Standard Interview Process Template
            </label>
            <ERPAutocomplete
              options={INTERVIEW_PROCESS_TEMPLATES.map((i) => i.label)}
              value={INTERVIEW_PROCESS_TEMPLATES.find((i) => String(i.value) === String(formData.interview_process_id))?.label || ""}
              onChange={(label) => {
                const found = INTERVIEW_PROCESS_TEMPLATES.find((i) => i.label === label);
                onChange("interview_process_id", found ? found.value : null);
              }}
              disabled={isViewMode}
              placeholder="Select template..."
              className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 pt-1">
            <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.screening_required !== false}
                disabled={isViewMode}
                onChange={(e) => onChange("screening_required", e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">Initial Screening</span>
            </label>

            <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!formData.round_practical_test}
                disabled={isViewMode}
                onChange={(e) => onChange("round_practical_test", e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">Practical / Tech Test</span>
            </label>

            <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!formData.round_calling}
                disabled={isViewMode}
                onChange={(e) => onChange("round_calling", e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">Customer Calling</span>
            </label>

            <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.round_hr !== false}
                disabled={isViewMode}
                onChange={(e) => onChange("round_hr", e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">HR Interview</span>
            </label>

            <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.round_management !== false}
                disabled={isViewMode}
                onChange={(e) => onChange("round_management", e.target.checked)}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">Management Round</span>
            </label>
          </div>

          {/* Recruitment Remarks */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Recruitment Planning Remarks / Special Instructions
            </label>
            <textarea
              rows={2}
              value={formData.recruitment_remarks || ""}
              disabled={isViewMode}
              onChange={(e) => onChange("recruitment_remarks", e.target.value)}
              placeholder="Add any specific sourcing or evaluation instructions..."
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tab5RecruitmentPlanning;
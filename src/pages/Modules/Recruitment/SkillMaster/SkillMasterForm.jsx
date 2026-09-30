import React, { forwardRef } from "react";
import { FaBrain, FaTag, FaChartLine, FaInfoCircle } from "react-icons/fa";

const SectionHeader = ({ title, icon, barBg, iconBg, text, border }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-t-md border-b font-semibold text-xs ${barBg} ${border} ${text}`}>
    <span className={`p-1.5 rounded ${iconBg}`}>{icon}</span>
    <span>{title}</span>
  </div>
);

export const SKILL_CATEGORIES = [
  "Technical / Hard Skill",
  "Behavioral / Soft Skill",
  "Tool / Software Proficiency",
];

export const PROFICIENCY_SCALES = [
  "Beginner / Intermediate / Expert",
  "Basic / Good / Excellent",
  "Rating Scale (1 to 5)",
];

const SkillMasterForm = forwardRef(
  ({ formData = {}, setFormData, errors = {}, setErrors, mode = "view" }, ref) => {
    const isViewMode = mode === "view";

    const handleChange = (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (errors[field]) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    };

    return (
      <div ref={ref} className="h-full flex flex-col bg-slate-50 border border-slate-200 rounded-md overflow-hidden shadow-sm">
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* ── Main Skill Information Card ── */}
            <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
              <SectionHeader
                title="Skill Master Specification"
                icon={<FaBrain />}
                barBg="bg-[#e8f0fe]"
                iconBg="bg-[#1a56db]/15 text-[#1a56db]"
                text="text-[#0f2137]"
                border="border-[#c2d1f7]"
              />

              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {/* 1. Skill ID (Auto-generated & Read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Skill ID <span className="text-[11px] text-slate-400 font-normal">(Auto-generated)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.skill_code || ""}
                    disabled
                    readOnly
                    placeholder="Auto-assigned (e.g. SKL-001)"
                    className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-md bg-[#eef1f6] text-slate-600 font-mono font-medium cursor-not-allowed outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Unique reference code assigned by system</p>
                </div>

                {/* 2. Status * */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status || "Active"}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className={`w-full h-[32px] px-2.5 text-xs border rounded-md outline-none bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500 ${
                      formData.status === "Active"
                        ? "border-emerald-300 text-emerald-800 font-medium"
                        : "border-slate-300 text-slate-600 font-medium"
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {formData.status === "Active"
                      ? "Available for JD and Job Vacancy skill mapping"
                      : "Hidden from new JD & Vacancy skill selections"}
                  </p>
                </div>

                {/* 3. Skill Name * */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Skill Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.skill_name || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("skill_name", e.target.value)}
                    placeholder="e.g. React.js, Node.js, Financial Modeling, Public Speaking"
                    className={`w-full h-[32px] px-2.5 text-xs border rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500 ${
                      errors.skill_name ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                    }`}
                  />
                  {errors.skill_name && (
                    <span className="text-[11px] text-red-500 block mt-1">{errors.skill_name}</span>
                  )}
                </div>

                {/* 4. Skill Category * */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Skill Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.skill_category || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("skill_category", e.target.value)}
                    className={`w-full h-[32px] px-2.5 text-xs border rounded-md outline-none bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500 ${
                      errors.skill_category ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                    }`}
                  >
                    <option value="">-- Select Category --</option>
                    {SKILL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.skill_category && (
                    <span className="text-[11px] text-red-500 block mt-1">{errors.skill_category}</span>
                  )}
                </div>

                {/* 5. Proficiency Scale Type * */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proficiency Scale Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.proficiency_scale_type || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("proficiency_scale_type", e.target.value)}
                    className={`w-full h-[32px] px-2.5 text-xs border rounded-md outline-none bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500 ${
                      errors.proficiency_scale_type ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                    }`}
                  >
                    <option value="">-- Select Scale Type --</option>
                    {PROFICIENCY_SCALES.map((scale) => (
                      <option key={scale} value={scale}>
                        {scale}
                      </option>
                    ))}
                  </select>
                  {errors.proficiency_scale_type && (
                    <span className="text-[11px] text-red-500 block mt-1">
                      {errors.proficiency_scale_type}
                    </span>
                  )}
                </div>

                {/* 6. Skill Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Skill Description <span className="text-[11px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.skill_description || ""}
                    disabled={isViewMode}
                    onChange={(e) => handleChange("skill_description", e.target.value)}
                    placeholder="Provide detailed description, key competencies, evaluation criteria, or certifications associated with this skill..."
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* ── Summary & Metadata Note Card ── */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
              <FaInfoCircle className="text-blue-500 shrink-0 mt-0.5" size={15} />
              <div className="space-y-1">
                <span className="font-semibold text-slate-700">Recruitment Skill Integration Policy:</span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Active skills configured in this master become immediately available in the{" "}
                  <strong>Job Description (JD) Master</strong> and <strong>Job Vacancy Entry</strong> modules for
                  required and preferred qualification evaluation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default SkillMasterForm;

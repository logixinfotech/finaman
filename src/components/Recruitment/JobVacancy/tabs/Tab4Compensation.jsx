import React from "react";
import ERPAutocomplete from "../../../Reusable/input/ERPAutocomplete";
import { FaMoneyBillWave, FaShieldAlt, FaHome } from "react-icons/fa";

const SectionHeader = ({ title, icon, barBg, iconBg, text, border }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md border-b font-medium text-xs ${barBg} ${border} ${text}`}>
    <span className={`p-1 rounded ${iconBg}`}>{icon}</span>
    <span>{title}</span>
  </div>
);

const SALARY_TYPES = ["Annual (CTC)", "Monthly (Gross)", "Fixed + Variable"];
const INCENTIVE_STRUCTURES = [
  { value: 1, label: "Sales Commission (Target Based)" },
  { value: 2, label: "Quarterly Performance Bonus" },
  { value: 3, label: "Annual Retention Incentive" },
  { value: 4, label: "Project Milestone Incentive" },
];

const Tab4Compensation = ({
  formData,
  onChange,
  errors,
  isViewMode,
}) => {
  const incApp = !!formData.incentive_applicable;
  const bondApp = !!formData.bond_applicable;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
      {/* ── Section 1: Salary Package ── */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <SectionHeader
          title="Salary & Compensation Package"
          icon={<FaMoneyBillWave />}
          barBg="bg-[#ecfdf5]"
          iconBg="bg-[#10b981]/15 text-[#059669]"
          text="text-[#0f2137]"
          border="border-[#a7f3d0]"
        />
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Salary Type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Salary Type <span className="text-red-500">*</span>
            </label>
            <ERPAutocomplete
              options={SALARY_TYPES}
              value={formData.salary_type || "Annual (CTC)"}
              onChange={(val) => onChange("salary_type", val)}
              disabled={isViewMode}
              className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none"
            />
          </div>

          {/* Min CTC */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Minimum CTC (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="10000"
              value={formData.min_ctc || 0}
              disabled={isViewMode}
              onChange={(e) => onChange("min_ctc", e.target.value)}
              placeholder="e.g. 500000"
              className={`w-full h-[32px] px-2.5 text-xs font-semibold text-emerald-800 border rounded-md outline-none focus:border-blue-500 ${errors.min_ctc ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.min_ctc && <span className="text-[11px] text-red-500">{errors.min_ctc}</span>}
          </div>

          {/* Max CTC */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Maximum CTC (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="10000"
              value={formData.max_ctc || 0}
              disabled={isViewMode}
              onChange={(e) => onChange("max_ctc", e.target.value)}
              placeholder="e.g. 800000"
              className={`w-full h-[32px] px-2.5 text-xs font-semibold text-emerald-800 border rounded-md outline-none focus:border-blue-500 ${errors.max_ctc ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.max_ctc && <span className="text-[11px] text-red-500">{errors.max_ctc}</span>}
          </div>

          {/* Expected Gross */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Expected Gross / In-Hand (₹)
            </label>
            <input
              type="number"
              min="0"
              step="5000"
              value={formData.expected_gross || ""}
              disabled={isViewMode}
              onChange={(e) => onChange("expected_gross", e.target.value)}
              placeholder="e.g. 45000 / month"
              className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Variable Pay & Incentives ── */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <SectionHeader
          title="Variable Pay & Incentive Terms"
          icon={<FaMoneyBillWave />}
          barBg="bg-[#fefce8]"
          iconBg="bg-[#eab308]/20 text-[#d97706]"
          text="text-[#0f2137]"
          border="border-[#fef08a]"
        />
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Incentive Applicable?
            </label>
            <select
              value={formData.incentive_applicable ? "Yes" : "No"}
              disabled={isViewMode}
              onChange={(e) => {
                const yes = e.target.value === "Yes";
                onChange("incentive_applicable", yes);
                if (!yes) onChange("incentive_structure_id", null);
              }}
              className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none bg-white focus:border-blue-500"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-medium mb-1 ${incApp ? "text-slate-800 font-semibold" : "text-slate-400"}`}>
              Incentive Structure {incApp && <span className="text-red-500">*</span>}
            </label>
            <ERPAutocomplete
              options={INCENTIVE_STRUCTURES.map((i) => i.label)}
              value={INCENTIVE_STRUCTURES.find((i) => String(i.value) === String(formData.incentive_structure_id))?.label || ""}
              onChange={(label) => {
                const found = INCENTIVE_STRUCTURES.find((i) => i.label === label);
                onChange("incentive_structure_id", found ? found.value : null);
              }}
              disabled={!incApp || isViewMode}
              placeholder={incApp ? "Select incentive scheme..." : "N/A"}
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${!incApp
                ? "bg-[#eef1f6] text-slate-400 border-slate-200 cursor-not-allowed"
                : errors.incentive_structure_id
                  ? "border-red-500 ring-1 ring-red-200"
                  : "border-slate-300 bg-white"
                }`}
            />
            {errors.incentive_structure_id && <span className="text-[11px] text-red-500">{errors.incentive_structure_id}</span>}
          </div>
        </div>
      </div>

      {/* ── Section 3: Tenure, Probation & Service Bond ── */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <SectionHeader
          title="Tenure, Probation & Service Bond"
          icon={<FaShieldAlt />}
          barBg="bg-[#faf5ff]"
          iconBg="bg-[#a855f7]/15 text-[#9333ea]"
          text="text-[#0f2137]"
          border="border-[#e9d5ff]"
        />
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Probation Period */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Probation Period (Months)
            </label>
            <input
              type="number"
              min="0"
              value={formData.probation_period_months ?? 6}
              disabled={isViewMode}
              onChange={(e) => onChange("probation_period_months", e.target.value)}
              className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500"
            />
          </div>

          {/* Notice Period */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notice Period (Days)
            </label>
            <input
              type="number"
              min="0"
              value={formData.notice_period_days ?? 30}
              disabled={isViewMode}
              onChange={(e) => onChange("notice_period_days", e.target.value)}
              className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500"
            />
          </div>

          {/* Bond Applicable */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Service Bond Applicable?
            </label>
            <select
              value={formData.bond_applicable ? "Yes" : "No"}
              disabled={isViewMode}
              onChange={(e) => {
                const yes = e.target.value === "Yes";
                onChange("bond_applicable", yes);
                if (!yes) {
                  onChange("bond_duration_months", null);
                  onChange("bond_amount", null);
                  onChange("bond_terms", "");
                }
              }}
              className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none bg-white focus:border-blue-500"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          {/* Bond Duration */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${bondApp ? "text-slate-800 font-semibold" : "text-slate-400"}`}>
              Bond Duration (Months) {bondApp && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              min="1"
              value={formData.bond_duration_months || ""}
              disabled={!bondApp || isViewMode}
              onChange={(e) => onChange("bond_duration_months", e.target.value)}
              placeholder={bondApp ? "e.g. 12 or 24" : "N/A"}
              className={`w-full h-[32px] px-2.5 text-xs border rounded-md outline-none ${!bondApp
                ? "bg-[#eef1f6] text-slate-400 border-slate-200 cursor-not-allowed"
                : errors.bond_duration_months
                  ? "border-red-500 ring-1 ring-red-200"
                  : "border-slate-300 bg-white focus:border-blue-500"
                }`}
            />
            {errors.bond_duration_months && <span className="text-[11px] text-red-500">{errors.bond_duration_months}</span>}
          </div>

          {/* Bond Amount & Terms */}
          {bondApp && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-800 font-semibold mb-1">
                  Bond Penalty Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bond_amount || ""}
                  disabled={isViewMode}
                  onChange={(e) => onChange("bond_amount", e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Bond Conditions / Terms
                </label>
                <input
                  type="text"
                  value={formData.bond_terms || ""}
                  disabled={isViewMode}
                  onChange={(e) => onChange("bond_terms", e.target.value)}
                  placeholder="e.g. Applicable only for specialized company-sponsored technical training"
                  className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Section 4: Benefits & Allowances ── */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <SectionHeader
          title="Additional Benefits & Allowances"
          icon={<FaHome />}
          barBg="bg-[#f0fdf4]"
          iconBg="bg-[#22c55e]/20 text-[#16a34a]"
          text="text-[#0f2137]"
          border="border-[#bbf7d0]"
        />
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Accommodation Provided?
            </label>
            <select
              value={formData.accommodation_provided ? "Yes" : "No"}
              disabled={isViewMode}
              onChange={(e) => onChange("accommodation_provided", e.target.value === "Yes")}
              className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none bg-white focus:border-blue-500"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Travel Allowance / Fuel Reimbursement?
            </label>
            <select
              value={formData.travel_allowance ? "Yes" : "No"}
              disabled={isViewMode}
              onChange={(e) => onChange("travel_allowance", e.target.value === "Yes")}
              className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none bg-white focus:border-blue-500"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Other Benefits / Perks
            </label>
            <input
              type="text"
              value={formData.other_benefits || ""}
              disabled={isViewMode}
              onChange={(e) => onChange("other_benefits", e.target.value)}
              placeholder="e.g. Health Insurance, PF, Sodexo"
              className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tab4Compensation;
import React from "react";
import ERPAutocomplete from "../../../Reusable/input/ERPAutocomplete";
import ERPDateInput from "../../../Reusable/input/Date";
import { FaIdCard, FaUserTie } from "react-icons/fa";

const SectionHeader = ({ title, icon, barBg, iconBg, text, border }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md border-b font-medium text-xs ${barBg} ${border} ${text}`}>
    <span className={`p-1 rounded ${iconBg}`}>{icon}</span>
    <span>{title}</span>
  </div>
);

const VACANCY_TYPES = ["New Position", "Replacement", "Additional Manpower", "Temporary"];
const PRIORITY_OPTIONS = ["Low", "Normal", "High", "Urgent"];
const STATUS_OPTIONS = ["Draft", "Pending Approval", "Approved", "Open", "On Hold", "Closed", "Cancelled"];

const Tab1VacancyIdentification = ({
  formData,
  onChange,
  errors,
  isViewMode,
  employeeOptions = [],
}) => {
  const isReplacement = formData.vacancy_type === "Replacement";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
      {/* ── Section 1: Basic Information ── */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden h-full flex flex-col">
        <SectionHeader
          title="Basic Information"
          icon={<FaIdCard />}
          barBg="bg-[#e8f0fe]"
          iconBg="bg-[#1a56db]/15 text-[#1a56db]"
          text="text-[#0f2137]"
          border="border-[#c2d1f7]"
        />
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Vacancy No */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Vacancy No <span className="text-slate-400 font-normal">(Auto)</span>
            </label>
            <input
              type="text"
              value={formData.vacancy_no || ""}
              disabled
              placeholder="Auto-generated"
              className="w-full h-[32px] px-2 text-xs bg-[#eef1f6] text-slate-600 border border-slate-300 rounded-md font-semibold cursor-not-allowed outline-none"
            />
          </div>

          {/* Vacancy Date */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Vacancy Date <span className="text-red-500">*</span>
            </label>
            <ERPDateInput
              value={formData.vacancy_date || ""}
              onChange={(val) => onChange("vacancy_date", val)}
              disabled={isViewMode}
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none transition-colors ${errors.vacancy_date ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.vacancy_date && <span className="text-[11px] text-red-500">{errors.vacancy_date}</span>}
          </div>

          {/* Vacancy Type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Vacancy Type <span className="text-red-500">*</span>
            </label>
            <ERPAutocomplete
              options={VACANCY_TYPES}
              value={formData.vacancy_type || "New Position"}
              onChange={(val) => {
                onChange("vacancy_type", val);
                if (val !== "Replacement") onChange("replacement_emp_id", null);
              }}
              disabled={isViewMode}
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${errors.vacancy_type ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.vacancy_type && <span className="text-[11px] text-red-500">{errors.vacancy_type}</span>}
          </div>

          {/* Vacancy Status */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Vacancy Status
              <span className="text-slate-400 font-normal ml-1">(System)</span>
            </label>

            <ERPAutocomplete
              options={STATUS_OPTIONS}
              value={formData.vacancy_status || "Draft"}
              onChange={() => {
                // Status is system controlled
              }}
              disabled={true}
              placeholder="Select status..."
              className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none bg-[#eef1f6] text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Priority <span className="text-red-500">*</span>
            </label>
            <ERPAutocomplete
              options={PRIORITY_OPTIONS}
              value={formData.priority || "Normal"}
              onChange={(val) => onChange("priority", val)}
              disabled={isViewMode}
              className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Requisition & Replacement Details ── */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden h-full flex flex-col">
        <SectionHeader
          title="Requisition & Replacement Details"
          icon={<FaUserTie />}
          barBg="bg-[#e6f7f4]"
          iconBg="bg-[#0d9488]/15 text-[#0d9488]"
          text="text-[#0f2137]"
          border="border-[#b2e3da]"
        />
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Requested By */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Requested By (Employee) <span className="text-red-500">*</span>
            </label>
            <ERPAutocomplete
              options={employeeOptions.map((e) => e.label)}
              value={employeeOptions.find((e) => String(e.value) === String(formData.requested_by))?.label || ""}
              onChange={(label) => {
                const found = employeeOptions.find((e) => e.label === label);
                onChange("requested_by", found ? found.value : null);
              }}
              disabled={isViewMode}
              placeholder="Select employee..."
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${errors.requested_by ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.requested_by && <span className="text-[11px] text-red-500">{errors.requested_by}</span>}
          </div>

          {/* Request Date */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Request Date <span className="text-red-500">*</span>
            </label>
            <ERPDateInput
              value={formData.request_date || ""}
              onChange={(val) => onChange("request_date", val)}
              disabled={isViewMode}
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${errors.request_date ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.request_date && <span className="text-[11px] text-red-500">{errors.request_date}</span>}
          </div>

          {/* Replacement Employee (Conditional) */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className={`block text-xs font-medium mb-1 ${isReplacement ? "text-slate-800 font-semibold" : "text-slate-400"}`}>
              Replacement For Employee {isReplacement && <span className="text-red-500">*</span>}
            </label>
            <ERPAutocomplete
              options={employeeOptions.map((e) => e.label)}
              value={employeeOptions.find((e) => String(e.value) === String(formData.replacement_emp_id))?.label || ""}
              onChange={(label) => {
                const found = employeeOptions.find((e) => e.label === label);
                onChange("replacement_emp_id", found ? found.value : null);
              }}
              disabled={!isReplacement || isViewMode}
              placeholder={isReplacement ? "Select departing employee..." : "Only for Replacement type"}
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${!isReplacement
                ? "bg-[#eef1f6] text-slate-400 border-slate-200 cursor-not-allowed"
                : errors.replacement_emp_id
                  ? "border-red-500 ring-1 ring-red-200"
                  : "border-slate-300 bg-white"
                }`}
            />
            {errors.replacement_emp_id && <span className="text-[11px] text-red-500">{errors.replacement_emp_id}</span>}
          </div>

          {/* Justification / Remarks */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Requisition Justification / Purpose
            </label>
            <textarea
              rows={2}
              value={formData.justification || ""}
              disabled={isViewMode}
              onChange={(e) => onChange("justification", e.target.value)}
              placeholder="Enter details on why this position is requested..."
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tab1VacancyIdentification;

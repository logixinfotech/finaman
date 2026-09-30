import React, { useEffect, useState } from "react";
import ERPAutocomplete from "../../../Reusable/input/ERPAutocomplete";
import { FaBuilding, FaUsers } from "react-icons/fa";
import { fetchUserGroupsByType } from "../../../../utils/api";

const SectionHeader = ({ title, icon, barBg, iconBg, text, border }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md border-b font-medium text-xs ${barBg} ${border} ${text}`}>
    <span className={`p-1 rounded ${iconBg}`}>{icon}</span>
    <span>{title}</span>
  </div>
);

const EMPLOYMENT_TYPES = ["Permanent", "Probationary", "Contract", "Intern", "Trainee"];
const WORK_MODES = ["Office", "Hybrid", "Remote", "Client Site"];

const Tab2OrganisationPosition = ({
  formData,
  onChange,
  errors,
  isViewMode,
  departmentOptions = [],
  locationOptions = [],
  employeeOptions = [],
}) => {
  //for designations 
  const [designationOptions, setDesignationOptions] = useState([]);

  useEffect(() => {
    const loadDesignations = async () => {
      try {
        const res = await fetchUserGroupsByType("DESG");

        const designations = res?.data || [];

        setDesignationOptions(
          designations.map((item) => ({
            value: item.group_id,
            label: item.group_name,
          }))
        );
      } catch (error) {
        console.error("Failed to load designations:", error);
        setDesignationOptions([]);
      }
    };

    loadDesignations();
  }, []);
  //for branch location 
  locationOptions = [
    { value: 1, label: "Noida Office" },
    { value: 2, label: "Bangalore Office" },
    { value: 3, label: "Delhi Office" },
    { value: 4, label: "Hyderabad Office" },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
      {/* ── Section 1: Department & Position Hierarchy ── */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col">
        <SectionHeader
          title="Department & Position Hierarchy"
          icon={<FaBuilding />}
          barBg="bg-[#eff6ff]"
          iconBg="bg-[#2563eb]/15 text-[#2563eb]"
          text="text-[#0f2137]"
          border="border-[#bfdbfe]"
        />
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Department */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <ERPAutocomplete
              options={departmentOptions.map((d) => d.label)}
              value={departmentOptions.find((d) => String(d.value) === String(formData.department_id))?.label || formData.department_name || ""}
              onChange={(label) => {
                const found = departmentOptions.find((d) => d.label === label);
                onChange("department_id", found ? found.value : null);
                onChange("department_name", label || "");
              }}
              disabled={isViewMode}
              placeholder="Select department..."
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${errors.department_id ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.department_id && <span className="text-[11px] text-red-500">{errors.department_id}</span>}
          </div>

          {/* Designation */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Designation <span className="text-red-500">*</span>
            </label>
            <ERPAutocomplete
              options={designationOptions.map((d) => d.label)}
              value={designationOptions.find((d) => String(d.value) === String(formData.designation_id))?.label || formData.designation_name || ""}
              onChange={(label) => {
                const found = designationOptions.find((d) => d.label === label);
                onChange("designation_id", found ? found.value : null);
                onChange("designation_name", label || "");
                if (!formData.job_role) onChange("job_role", label);
              }}
              disabled={isViewMode}
              placeholder="Select designation..."
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${errors.designation_id ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.designation_id && <span className="text-[11px] text-red-500">{errors.designation_id}</span>}
          </div>

          {/* Job Role / Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Job Role / Specific Title
            </label>
            <input
              type="text"
              value={formData.job_role || ""}
              disabled={isViewMode}
              onChange={(e) => onChange("job_role", e.target.value)}
              placeholder="e.g. Senior Backend Architect"
              className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:bg-[#eef1f6] disabled:text-slate-500"
            />
          </div>

          {/* Reporting Manager */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reporting Manager <span className="text-red-500">*</span>
            </label>
            <ERPAutocomplete
              options={employeeOptions.map((e) => e.label)}
              value={employeeOptions.find((e) => String(e.value) === String(formData.reporting_manager_id))?.label || formData.reporting_manager_name || ""}
              onChange={(label) => {
                const found = employeeOptions.find((e) => e.label === label);
                onChange("reporting_manager_id", found ? found.value : null);
                onChange("reporting_manager_name", label || "");
              }}
              disabled={isViewMode}
              placeholder="Select manager..."
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${errors.reporting_manager_id ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.reporting_manager_id && <span className="text-[11px] text-red-500">{errors.reporting_manager_id}</span>}
          </div>

          {/* Work Location */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Work Location <span className="text-red-500">*</span>
            </label>

            <ERPAutocomplete
              options={locationOptions.map((l) => l.label)}
              value={
                locationOptions.find(
                  (l) => String(l.value) === String(formData.location_id)
                )?.label || formData.location_name || ""
              }
              onChange={(label) => {
                const found = locationOptions.find(
                  (l) => l.label === label
                );

                onChange(
                  "location_id",
                  found ? found.value : null
                );
                onChange(
                  "location_name",
                  label || ""
                );
              }}
              disabled={isViewMode}
              placeholder="Select location..."
              className={`w-full h-[32px] px-2 text-xs border rounded-md outline-none ${errors.location_id
                ? "border-red-500 ring-1 ring-red-200"
                : "border-slate-300"
                }`}
            />

            {errors.location_id && (
              <span className="text-[11px] text-red-500">
                {errors.location_id}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Employment Terms & Headcount ── */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col">
        <SectionHeader
          title="Employment Terms & Headcount"
          icon={<FaUsers />}
          barBg="bg-[#f3e8ff]"
          iconBg="bg-[#7c3aed]/15 text-[#7c3aed]"
          text="text-[#0f2137]"
          border="border-[#d4b8f5]"
        />
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Employment Type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Employment Type <span className="text-red-500">*</span>
            </label>
            <ERPAutocomplete
              options={EMPLOYMENT_TYPES}
              value={formData.employment_type || "Permanent"}
              onChange={(val) => onChange("employment_type", val)}
              disabled={isViewMode}
              className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none"
            />
          </div>

          {/* Work Mode */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Work Mode <span className="text-red-500">*</span>
            </label>
            <ERPAutocomplete
              options={WORK_MODES}
              value={formData.work_mode || "Office"}
              onChange={(val) => onChange("work_mode", val)}
              disabled={isViewMode}
              className="w-full h-[32px] px-2 text-xs border border-slate-300 rounded-md outline-none"
            />
          </div>

          {/* Number of Positions */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Required Positions <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={formData.number_of_positions || 1}
              disabled={isViewMode}
              onChange={(e) => onChange("number_of_positions", e.target.value)}
              className={`w-full h-[32px] px-2.5 text-xs font-semibold text-blue-800 border rounded-md outline-none focus:border-blue-500 ${errors.number_of_positions ? "border-red-500 ring-1 ring-red-200" : "border-slate-300"
                }`}
            />
            {errors.number_of_positions && <span className="text-[11px] text-red-500">{errors.number_of_positions}</span>}
          </div>

          {/* Filled Positions (Read-only) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Filled Positions <span className="text-slate-400 font-normal">(System)</span>
            </label>
            <input
              type="number"
              value={formData.filled_positions || 0}
              disabled
              className="w-full h-[32px] px-2.5 text-xs font-semibold text-slate-600 bg-[#eef1f6] border border-slate-300 rounded-md cursor-not-allowed outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tab2OrganisationPosition;

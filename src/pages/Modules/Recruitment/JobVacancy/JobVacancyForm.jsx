import React, { useState, forwardRef } from "react";
import Tab1VacancyIdentification from "../../../../components/Recruitment/JobVacancy/tabs/Tab1VacancyIdentification";
import Tab2OrganisationPosition from "../../../../components/Recruitment/JobVacancy/tabs/Tab2OrganisationPosition";
import Tab3JobRequirement from "../../../../components/Recruitment/JobVacancy/tabs/Tab3JobRequirement";
import Tab4Compensation from "../../../../components/Recruitment/JobVacancy/tabs/Tab4Compensation";
import Tab5RecruitmentPlanning from "../../../../components/Recruitment/JobVacancy/tabs/Tab5RecruitmentPlanning";
import {
  FaIdCard,
  FaBuilding,
  FaGraduationCap,
  FaMoneyBillWave,
  FaCalendarAlt,
} from "react-icons/fa";

const TABS = [
  { id: "identification", label: "1. Identification", icon: <FaIdCard /> },
  { id: "organisation", label: "2. Org & Position", icon: <FaBuilding /> },
  { id: "requirements", label: "3. Job Requirements", icon: <FaGraduationCap /> },
  { id: "compensation", label: "4. Compensation", icon: <FaMoneyBillWave /> },
  { id: "planning", label: "5. Planning", icon: <FaCalendarAlt /> },
];

const JobVacancyForm = forwardRef(
  (
    {
      formData = {},
      setFormData,
      errors = {},
      setErrors,
      mode = "view",
      departmentOptions = [],
      designationOptions = [],
      locationOptions = [],
      employeeOptions = [],
      skillOptions = [],
      jdOptions = [],
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = useState("identification");

    const isViewMode = mode === "view";

    const handleChange = (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear field error on change
      if (errors[field]) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    };

    return (
      <div className="h-full flex flex-col bg-slate-50 border border-slate-200 rounded-md overflow-hidden shadow-sm">
        {/* ── Top Horizontal Tab Bar (Employee Master Pattern) ── */}
        <div className="shrink-0 bg-slate-100 border-b border-slate-200 px-2 sm:px-3 pt-2 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-t-md border-t border-l border-r transition-all select-none shrink-0 whitespace-nowrap ${isActive
                  ? "bg-white text-blue-700 border-slate-200 border-b-transparent shadow-sm"
                  : "bg-slate-100 text-slate-600 border-transparent hover:text-slate-800 hover:bg-slate-200/60"
                  }`}
              >
                <span className={`text-[12px] sm:text-[13px] ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content Container ── */}
        <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
          {activeTab === "identification" && (
            <Tab1VacancyIdentification
              formData={formData}
              onChange={handleChange}
              errors={errors}
              isViewMode={isViewMode}
              employeeOptions={employeeOptions}
            />
          )}

          {activeTab === "organisation" && (
            <Tab2OrganisationPosition
              formData={formData}
              onChange={handleChange}
              errors={errors}
              isViewMode={isViewMode}
              departmentOptions={departmentOptions}
              designationOptions={designationOptions}
              locationOptions={locationOptions}
              employeeOptions={employeeOptions}
            />
          )}

          {activeTab === "requirements" && (
            <Tab3JobRequirement
              formData={formData}
              setFormData={setFormData}
              onChange={handleChange}
              errors={errors}
              isViewMode={isViewMode}
              skillOptions={skillOptions}
              jdOptions={jdOptions}
            />
          )}

          {activeTab === "compensation" && (
            <Tab4Compensation
              formData={formData}
              onChange={handleChange}
              errors={errors}
              isViewMode={isViewMode}
            />
          )}

          {activeTab === "planning" && (
            <Tab5RecruitmentPlanning
              formData={formData}
              onChange={handleChange}
              errors={errors}
              isViewMode={isViewMode}
              employeeOptions={employeeOptions}
            />
          )}
        </div>
      </div>
    );
  }
);

export default JobVacancyForm;

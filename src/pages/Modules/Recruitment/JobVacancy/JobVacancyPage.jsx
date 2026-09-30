import React, { useState, useEffect, useCallback, useMemo } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import { showToast, confirmDelete, alertError } from "../../../../components/Reusable/alert";
import { getActledList, fetchUserGroupsByType } from "../../../../utils/api";
import {
  getJobVacancies,
  getJobVacancyById,
  createJobVacancy,
  updateJobVacancy,
  deleteJobVacancy,
  getNextVacancyNumber,
  getActiveSkills,
  getActiveJDs,
} from "../../../../utils/recruitmentApi";
import { validateJobVacancyForm } from "../../../../components/Recruitment/JobVacancy/validation/jobVacancyValidation";
import JobVacancyForm from "./JobVacancyForm";
import JobVacancySearch from "./JobVacancySearch";
import { FaUserTie } from "react-icons/fa";

const initialVacancyState = {
  vacancy_id: null,
  vacancy_no: "",
  vacancy_date: new Date().toISOString().split("T")[0],
  vacancy_type: "New Position",
  vacancy_status: "Draft",
  priority: "Normal",
  requested_by: null,
  request_date: new Date().toISOString().split("T")[0],
  replacement_emp_id: null,
  justification: "",

  department_id: null,
  designation_id: null,
  job_role: "",
  reporting_manager_id: null,
  location_id: null,
  employment_type_id: null,
  employment_type: "Permanent",
  work_mode_id: null,
  work_mode: "Office",
  number_of_positions: 1,
  filled_positions: 0,

  jd_id: null,
  jd_version: null,
  job_summary: "",
  job_responsibilities: "",
  qualifications: [],
  skills: [],
  industries: [],
  languages: [],
  min_experience_years: 0,
  max_experience_years: 0,
  travel_required: false,
  travel_frequency: "",
  driving_licence_req: false,
  vehicle_required: false,
  client_visit_required: false,

  salary_type: "Annual (CTC)",
  min_ctc: 0,
  max_ctc: 0,
  expected_gross: null,
  incentive_applicable: false,
  incentive_structure_id: null,
  probation_period_months: 6,
  notice_period_days: 30,
  bond_applicable: false,
  bond_duration_months: null,
  bond_amount: null,
  bond_terms: "",
  accommodation_provided: false,
  travel_allowance: false,
  other_benefits: "",

  recruitment_owner_id: null,
  recruitment_start_date: new Date().toISOString().split("T")[0],
  target_joining_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  application_close_date: null,
  expected_candidates: null,
  sources: [],
  screening_required: true,
  interview_process_id: null,
  round_practical_test: false,
  round_calling: false,
  round_hr: true,
  round_management: true,
  recruitment_remarks: "",
};

const JobVacancyPage = ({ tab }) => {
  const [activeHeaderTab, setActiveHeaderTab] = useState("entry");
  const [vacancies, setVacancies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Master options
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [skillsMaster, setSkillsMaster] = useState([]);
  const [jdOptions, setJdOptions] = useState([]);

  // ── Load Masters ────────────────────────────────────────────────────────────
  const loadMasters = useCallback(async () => {
    try {
      const [empRes, deptRes, desigRes, locRes, skillsRes, jdsRes] = await Promise.all([
        getActledList(),
        fetchUserGroupsByType("DEP"),
        fetchUserGroupsByType("DESG"),
        fetchUserGroupsByType("LOC"),
        getActiveSkills().catch(() => ({ data: [] })),
        getActiveJDs().catch(() => ({ data: [] })),
      ]);

      const empOpts = (empRes || []).map((e) => ({
        value: e.Actled_id,
        label: `${e.full_name || e.Led_name} (${e.Actled_id})`.trim(),
        name: (e.full_name || e.Led_name || "").trim(),
      }));

      const deptOpts = (deptRes?.data || []).map((d) => ({
        value: d.group_id,
        label: d.group_name,
      }));

      const desigOpts = (desigRes?.data || []).map((d) => ({
        value: d.group_id,
        label: d.group_name,
      }));

      const locOpts = (locRes?.data || []).map((l) => ({
        value: l.group_id,
        label: l.group_name,
      }));

      setEmployees(empOpts);
      setDepartments(deptOpts);
      setDesignations(desigOpts);
      setLocations(locOpts);
      setSkillsMaster(skillsRes?.data || []);
      setJdOptions(jdsRes?.data || []);
    } catch (err) {
      console.error("Error loading recruitment masters:", err);
    }
  }, []);

  // ── Load Vacancies List ─────────────────────────────────────────────────────
  const loadVacancies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getJobVacancies();
      setVacancies(res?.data || []);
    } catch (err) {
      console.error("Error loading vacancies:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMasters();
    loadVacancies();
  }, [loadMasters, loadVacancies]);

  // ── ERP Mode Hook ───────────────────────────────────────────────────────────
  const {
    mode,
    setMode,
    formData,
    setFormData,
    saving,
    handleAdd: hookHandleAdd,
    handleModify,
    rights,
  } = useERPMode(initialVacancyState, async () => { }, loadVacancies, tab?.appl_name || "JobVacancyEntry");

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  // When clicking Add mode: auto-fetch next vacancy number
  const handleNewEntry = useCallback(async () => {
    hookHandleAdd();
    setActiveHeaderTab("entry");
    setErrors({});
    try {
      const res = await getNextVacancyNumber();
      if (res?.data?.vacancy_no) {
        setFormData((prev) => ({
          ...initialVacancyState,
          vacancy_no: res.data.vacancy_no,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }, [hookHandleAdd, setFormData]);

  // ── Select a vacancy from search list or navigation ─────────────────────────
  const selectVacancyByIndex = useCallback(
    async (idx) => {
      if (idx < 0 || idx >= vacancies.length) return;
      const v = vacancies[idx];
      setCurrentIndex(idx);
      try {
        setLoading(true);
        const full = await getJobVacancyById(v.vacancy_id);
        if (full?.data) {
          setFormData(full.data);
          setMode("view");
          setErrors({});
          setActiveHeaderTab("entry");
        }
      } catch (err) {
        alertError("Error", "Could not load vacancy details");
      } finally {
        setLoading(false);
      }
    },
    [vacancies, setFormData, setMode]
  );

  // ── Cancel / Discard Handler ───────────────────────────────────────────────
  const handleCancel = useCallback(async () => {
    setErrors({});
    if (isAddMode || isEditMode) {
      if (vacancies.length > 0) {
        const targetIdx = currentIndex >= 0 && currentIndex < vacancies.length ? currentIndex : 0;
        await selectVacancyByIndex(targetIdx);
      } else {
        setFormData(initialVacancyState);
        setMode("view");
      }
    } else {
      setActiveHeaderTab("search");
    }
  }, [isAddMode, isEditMode, vacancies, currentIndex, selectVacancyByIndex, setFormData, setMode]);

  // ── Esc Key Handler ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea") {
          document.activeElement.blur();
          return;
        }
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCancel]);

  // Set initial record on load
  useEffect(() => {
    if (vacancies.length > 0 && !formData.vacancy_id && mode === "view") {
      selectVacancyByIndex(0);
    }
  }, [vacancies, formData.vacancy_id, mode, selectVacancyByIndex]);

  // ── Save / Update Handler ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    const { isValid, errors: validationErrors } = validateJobVacancyForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      showToast({ icon: "warning", title: "Please fill all required fields correctly" });
      return;
    }

    try {
      if (isAddMode) {
        const res = await createJobVacancy(formData);
        showToast({ icon: "success", title: "Job Vacancy created successfully" });
        await loadVacancies();
        if (res?.data?.vacancy_id) {
          const created = await getJobVacancyById(res.data.vacancy_id);
          if (created?.data) setFormData(created.data);
        }
        setMode("view");
      } else if (isEditMode) {
        await updateJobVacancy(formData.vacancy_id, formData);
        showToast({ icon: "success", title: "Job Vacancy updated successfully" });
        await loadVacancies();
        const updated = await getJobVacancyById(formData.vacancy_id);
        if (updated?.data) setFormData(updated.data);
        setMode("view");
      }
    } catch (err) {
      alertError("Save Error", err.message || "Could not save vacancy record");
    }
  };

  // ── Delete Handler ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!formData.vacancy_id) return;
    const confirmed = await confirmDelete({
      title: `Delete Vacancy ${formData.vacancy_no}?`,
      text: "This record will be marked as deleted.",
    });

    if (!confirmed) return;

    try {
      await deleteJobVacancy(formData.vacancy_id);
      showToast({ icon: "success", title: "Vacancy deleted successfully" });
      await loadVacancies();
      setFormData(initialVacancyState);
      setMode("view");
    } catch (err) {
      alertError("Delete Error", err.message || "Failed to delete vacancy");
    }
  };

  const handleTabChange = useCallback((targetTab) => {
    setActiveHeaderTab(targetTab);
  }, []);

  const handleRowSelect = useCallback((row) => {
    const idx = vacancies.findIndex((x) => x.vacancy_id === row.vacancy_id);
    if (idx !== -1) {
      selectVacancyByIndex(idx);
    }
  }, [vacancies, selectVacancyByIndex]);

  return (
    <div className="h-full w-full">
      {activeHeaderTab === "entry" ? (
        <div className="h-full flex flex-col overflow-hidden bg-slate-100">
          {/* ── Standard ERP Header ── */}
          <ERPHeader
            title="JOB VACANCY ENTRY"
            TitleIcon={FaUserTie}
            isAddMode={isAddMode}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
            activeTab="entry"
            onTabChange={handleTabChange}
            currentIndex={currentIndex + 1}
            totalRecords={vacancies.length}
            onPrevRecord={currentIndex > 0 ? () => selectVacancyByIndex(currentIndex - 1) : null}
            onNextRecord={currentIndex < vacancies.length - 1 ? () => selectVacancyByIndex(currentIndex + 1) : null}
            rightContent={`${currentIndex + 1}/${vacancies.length || 1}`}
          />

          {/* ── Main Workspace Body ── */}
          <div className="flex-1 p-1.5 sm:p-3 overflow-hidden">
            <JobVacancyForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              mode={mode}
              departmentOptions={departments}
              designationOptions={designations}
              locationOptions={locations}
              employeeOptions={employees}
              skillOptions={skillsMaster}
              jdOptions={jdOptions}
            />
          </div>

          {/* ── Standard ERP Footer Toolbar ── */}
          <ERPFooter
            isAddMode={isAddMode}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
            saving={saving}
            handleSubmit={handleSubmit}
            onModify={handleModify}
            onDelete={formData.vacancy_id ? handleDelete : null}
            onCancel={handleCancel}
            onEditCancel={handleCancel}
            onNewEntry={handleNewEntry}
            rights={rights}
            formData={{ ...formData, Id: formData.vacancy_id }}
            onSaveDraft={handleSubmit}
          />
        </div>
      ) : (
        <div className="bg-slate-50 h-full">
          <JobVacancySearch
            vacancies={vacancies}
            loading={loading}
            onSelectVacancy={handleRowSelect}
            onNewEntry={rights?.add !== 0 ? handleNewEntry : null}
            onTabChange={handleTabChange}
            onRefresh={loadVacancies}
          />
        </div>
      )}
    </div>
  );
};

export default JobVacancyPage;

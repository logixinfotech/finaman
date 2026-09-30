// ─────────────────────────────────────────────────────────────────────────────
// FILE: jobVacancyValidation.js
// Centralized validation for Job Vacancy Entry (all 5 tabs)
// ─────────────────────────────────────────────────────────────────────────────

export const validateJobVacancyForm = (data) => {
  const errors = {};

  // ── Tab 1: Vacancy Identification ──────────────────────────────────────────
  if (!data.vacancy_date) errors.vacancy_date = "Vacancy Date is required";
  if (!data.vacancy_type) errors.vacancy_type = "Vacancy Type is required";
  if (!data.priority) errors.priority = "Priority is required";
  if (!data.requested_by) errors.requested_by = "Requested By employee is required";
  if (!data.request_date) errors.request_date = "Request Date is required";

  // Conditional: Replacement Employee
  if (data.vacancy_type === "Replacement" && !data.replacement_emp_id) {
    errors.replacement_emp_id = "Replacement Employee is mandatory when Type is Replacement";
  }

  // ── Tab 2: Organisation & Position ─────────────────────────────────────────
  if (!data.department_id) errors.department_id = "Department is required";
  if (!data.designation_id) errors.designation_id = "Designation is required";
  if (!data.reporting_manager_id) errors.reporting_manager_id = "Reporting Manager is required";
  if (!data.location_id) errors.location_id = "Work Location is required";

  const numPos = parseInt(data.number_of_positions);
  if (isNaN(numPos) || numPos <= 0) {
    errors.number_of_positions = "Number of positions must be at least 1";
  }

  // ── Tab 3: Job Requirement ─────────────────────────────────────────────────
  if (!data.job_summary || String(data.job_summary).trim() === "") {
    errors.job_summary = "Job Summary is required";
  }
  if (!data.job_responsibilities || String(data.job_responsibilities).trim() === "") {
    errors.job_responsibilities = "Job Responsibilities are required";
  }

  const minExp = parseFloat(data.min_experience_years) || 0;
  const maxExp = parseFloat(data.max_experience_years) || 0;
  if (minExp < 0) errors.min_experience_years = "Min experience cannot be negative";
  if (maxExp < minExp) errors.max_experience_years = "Max experience must be ≥ Min experience";

  if (!data.qualifications || data.qualifications.length === 0) {
    errors.qualifications = "At least one required qualification is needed";
  }
  const reqSkills = (data.skills || []).filter((s) => !s.is_preferred || s.is_preferred === 0 || s.is_preferred === "0");
  if (reqSkills.length === 0) {
    errors.skills = "At least one required skill is needed";
  }

  // Conditional: Travel Frequency
  if (data.travel_required && (!data.travel_frequency || String(data.travel_frequency).trim() === "")) {
    errors.travel_frequency = "Travel Frequency is required when Travel is applicable";
  }

  // ── Tab 4: Compensation & Conditions ───────────────────────────────────────
  if (!data.salary_type) errors.salary_type = "Salary Type is required";
  const minCtc = parseFloat(data.min_ctc) || 0;
  const maxCtc = parseFloat(data.max_ctc) || 0;
  if (minCtc < 0) errors.min_ctc = "Min CTC cannot be negative";
  if (maxCtc < minCtc) errors.max_ctc = "Max CTC must be ≥ Min CTC";

  // Conditional: Incentive Structure
  if (data.incentive_applicable && !data.incentive_structure_id) {
    errors.incentive_structure_id = "Incentive Structure is required when Incentive is applicable";
  }

  // Conditional: Bond
  if (data.bond_applicable) {
    const bondDur = parseInt(data.bond_duration_months);
    if (isNaN(bondDur) || bondDur <= 0) {
      errors.bond_duration_months = "Bond duration must be greater than 0 months";
    }
  }

  // ── Tab 5: Recruitment Planning ────────────────────────────────────────────
  if (!data.recruitment_owner_id) errors.recruitment_owner_id = "Recruitment Owner is required";
  if (!data.recruitment_start_date) errors.recruitment_start_date = "Recruitment Start Date is required";
  if (!data.target_joining_date) errors.target_joining_date = "Target Joining Date is required";

  if (data.recruitment_start_date && data.target_joining_date) {
    const start = new Date(data.recruitment_start_date);
    const target = new Date(data.target_joining_date);
    if (target < start) {
      errors.target_joining_date = "Target Joining Date cannot be before Recruitment Start Date";
    }
  }

  if (data.recruitment_start_date && data.application_close_date) {
    const start = new Date(data.recruitment_start_date);
    const close = new Date(data.application_close_date);
    if (close < start) {
      errors.application_close_date = "Application Closing Date cannot be before Recruitment Start Date";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

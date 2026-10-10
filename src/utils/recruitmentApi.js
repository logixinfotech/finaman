import { api } from "./api";
import { handleApi } from "./apiHandler";

export const getNextVacancyNumber = () =>
  handleApi(() => api.get("/api/recruitment/vacancies/next-number"));

export const getJobVacancies = (params) =>
  handleApi(() => api.get("/api/recruitment/vacancies", { params }));

export const getJobVacancyById = (id) =>
  handleApi(() => api.get(`/api/recruitment/vacancies/${id}`));

export const createJobVacancy = (data) =>
  handleApi(() => api.post("/api/recruitment/vacancies", data));

export const updateJobVacancy = (id, data) =>
  handleApi(() => api.put(`/api/recruitment/vacancies/${id}`, data));

export const deleteJobVacancy = (id) =>
  handleApi(() => api.delete(`/api/recruitment/vacancies/${id}`));

export const updateVacancyStatus = (id, to_status, remarks) =>
  handleApi(() => api.post(`/api/recruitment/vacancies/${id}/status`, { to_status, remarks }));

// ── Skill Master API ──────────────────────────────────────────────────────────
export const getNextSkillCode = () =>
  handleApi(() => api.get("/api/recruitment/skills/next-code"));

export const getSkills = (params) =>
  handleApi(() => api.get("/api/recruitment/skills", { params }));

export const getActiveSkills = () =>
  handleApi(() => api.get("/api/recruitment/skills", { params: { active_only: "true" } }));

export const getSkillById = (id) =>
  handleApi(() => api.get(`/api/recruitment/skills/${id}`));

export const createSkill = (data) =>
  handleApi(() => api.post("/api/recruitment/skills", data));

export const updateSkill = (id, data) =>
  handleApi(() => api.put(`/api/recruitment/skills/${id}`, data));

export const deleteSkill = (id) =>
  handleApi(() => api.delete(`/api/recruitment/skills/${id}`));
// ── JD Master API ─────────────────────────────────────────────────────────────
export const getNextJDCode = () =>
  handleApi(() => api.get("/api/recruitment/jds/next-code"));

export const getJDs = (params) =>
  handleApi(() => api.get("/api/recruitment/jds", { params }));

export const getActiveJDs = () =>
  handleApi(() => api.get("/api/recruitment/jds/active"));

export const getJDById = (id) =>
  handleApi(() => api.get(`/api/recruitment/jds/${id}`));

export const createJD = (data) =>
  handleApi(() => api.post("/api/recruitment/jds", data));

export const updateJD = (id, data) =>
  handleApi(() => api.put(`/api/recruitment/jds/${id}`, data));

export const deleteJD = (id) =>
  handleApi(() => api.delete(`/api/recruitment/jds/${id}`));

// ── Recruitment Prefix Setting API ────────────────────────────────────────────
export const fetchRecruitmentPrefixes = () =>
  handleApi(() => api.get("/api/recruitment/prefixes"));

export const getRecruitmentPrefixById = (id) =>
  handleApi(() => api.get(`/api/recruitment/prefixes/${id}`));

export const createRecruitmentPrefix = (data) =>
  handleApi(() => api.post("/api/recruitment/prefixes", data));

export const updateRecruitmentPrefix = (id, data) =>
  handleApi(() => api.put(`/api/recruitment/prefixes/${id}`, data));

export const deleteRecruitmentPrefix = (id) =>
  handleApi(() => api.delete(`/api/recruitment/prefixes/${id}`));

// ── Candidate Master & Sourcing API ──────────────────────────────────────────
export const getActiveVacanciesWithJD = (params) =>
  handleApi(() => api.get("/api/recruitment/active-vacancies", { params }));

export const getCandidateVacancyDetails = (params) =>
  handleApi(() => api.get("/api/recruitment/vacancy-details", { params }));

export const checkCandidateDuplicate = (payload) =>
  handleApi(() => api.post("/api/recruitment/check-duplicate", payload));

export const getCandidates = (params) =>
  handleApi(() => api.get("/api/recruitment/candidates", { params }));

export const getCandidateById = (id) =>
  handleApi(() => api.get(`/api/recruitment/candidates/${id}`));

export const createCandidate = (data) => {
  if (data instanceof FormData) {
    return handleApi(() =>
      api.post("/api/recruitment/candidates", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  }
  return handleApi(() => api.post("/api/recruitment/candidates", data));
};

export const updateCandidate = (id, data) => {
  if (data instanceof FormData) {
    return handleApi(() =>
      api.put(`/api/recruitment/candidates/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  }
  return handleApi(() => api.put(`/api/recruitment/candidates/${id}`, data));
};

export const deleteCandidate = (id) =>
  handleApi(() => api.delete(`/api/recruitment/candidates/${id}`));

export const updateCandidateStatus = (id, to_status, remarks) =>
  handleApi(() =>
    api.post(`/api/recruitment/candidates/${id}/status`, { to_status, remarks })
  );

// ── Candidate Pipeline (Candidate Tracking) ───────────────────────────────────
const PIPELINE = "/api/recruitment/pipeline";
export const getPipelineStatuses = () => handleApi(() => api.get(`${PIPELINE}/statuses`));
export const getPipelineReasons = () => handleApi(() => api.get(`${PIPELINE}/reasons`));
export const getPipelineSummary = () => handleApi(() => api.get(`${PIPELINE}/summary`));
export const getPipelineRecruiters = () => handleApi(() => api.get(`${PIPELINE}/recruiters`));
export const getAvailablePipelineCandidates = () => handleApi(() => api.get(`${PIPELINE}/available-candidates`));
export const getPipelineList = (params) => handleApi(() => api.get(`${PIPELINE}/list`, { params }));
export const addToPipeline = (data) => handleApi(() => api.post(PIPELINE, data));
export const getPipelineDetail = (id) => handleApi(() => api.get(`${PIPELINE}/${id}`));
export const updatePipelineStatus = (id, data) => handleApi(() => api.post(`${PIPELINE}/${id}/status`, data));

// ── Vacancy Tracking (read-only view) ────────────────────────────────────────
export const getVacancyTracking = (params) => handleApi(() => api.get(`${PIPELINE}/vacancy-tracking`, { params }));
export const getVacancyTrackingDetail = (id) => handleApi(() => api.get(`${PIPELINE}/vacancy-tracking/${id}`));

export const importCandidatesExcel = (formData) =>
  handleApi(() =>
    api.post("/api/recruitment/candidates/import-excel", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );

// ── Assessment Master API ─────────────────────────────────────────────────────
const ASM = "/api/recruitment/assessment-master";
export const getAssessments = (params) => handleApi(() => api.get(ASM, { params }));
export const getActiveAssessments = () => handleApi(() => api.get(`${ASM}/active`));
export const getAssessmentById = (id) => handleApi(() => api.get(`${ASM}/${id}`));
export const getNextAssessmentCode = () => handleApi(() => api.get(`${ASM}/next-code`));
export const createAssessment = (data) => {
  if (data instanceof FormData) {
    return handleApi(() => api.post(ASM, data, { headers: { "Content-Type": "multipart/form-data" } }));
  }
  return handleApi(() => api.post(ASM, data));
};
export const updateAssessment = (id, data) => {
  if (data instanceof FormData) {
    return handleApi(() => api.put(`${ASM}/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }));
  }
  return handleApi(() => api.put(`${ASM}/${id}`, data));
};
export const deleteAssessment = (id) => handleApi(() => api.delete(`${ASM}/${id}`));

// ── Candidate Assessment & HR Grading API ─────────────────────────────────────
const CAND_ASM = "/api/recruitment/candidate-assessment";
export const issueCandidateAssessment = (data) => handleApi(() => api.post(`${CAND_ASM}/issue`, data));
export const getCandidateAssessmentsByPipeline = (pipeline_id) =>
  handleApi(() => api.get(`${CAND_ASM}/by-pipeline/${pipeline_id}`));
export const getCandidateAssessmentDetail = (candidate_assessment_id) =>
  handleApi(() => api.get(`${CAND_ASM}/detail/${candidate_assessment_id}`));
export const submitHRGrades = (data) => handleApi(() => api.post(`${CAND_ASM}/grade`, data));

// ── Interview Scheduling API ───────────────────────────────────────────────
const SCHED = "/api/recruitment/interview-scheduling";
export const getInterviewScheduleBoard = (params) => handleApi(() => api.get(`${SCHED}/board`, { params }));
export const getActivePanelists = () => handleApi(() => api.get(`${SCHED}/panelists`));
export const checkScheduleConflict = (data) => handleApi(() => api.post(`${SCHED}/check-conflict`, data));
export const suggestScheduleSlot = (data) => handleApi(() => api.post(`${SCHED}/suggest-slot`, data));
export const saveInterviewSchedule = (data) => handleApi(() => api.post(`${SCHED}/save`, data));
export const dispatchBulkInvites = (data) => handleApi(() => api.post(`${SCHED}/dispatch-bulk`, data));




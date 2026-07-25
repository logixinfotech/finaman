
 import Swal from "sweetalert2";
import axios from "axios"; 
import { handleApi } from "../../../../utils/apiHandler";
import{ api} from "../../../../utils/api";

export const getAuditTrail = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.moduleKey) params.append('moduleKey', filters.moduleKey);
  if (filters.recordNo) params.append('recordNo', filters.recordNo);
  if (filters.fromDate) params.append('fromDate', filters.fromDate);
  if (filters.toDate) params.append('toDate', filters.toDate);
  return handleApi(() => api.get(`/api/qms/audit-trail?${params.toString()}`));
};

export const getNextRecordNo = (entity) =>
  handleApi(() => api.get(`/api/qms/next-record-no/${entity}`)).then((res) => res?.recordNo || "");

const DATE_KEYS = [
  "OccurrenceDate", "DetectionDate", "ReportedOn", "QaNotifiedDate",
  "InvestigationStartDate", "InvestigationCompletionDate",
  "TargetDate", "ReviewDate", "ClosedOn",
];
 
const normalizeDeviation = (row) => {
  const out = { ...row };
  DATE_KEYS.forEach((k) => {
    if (out[k]) out[k] = String(out[k]).slice(0, 10);  
  });
  return out;
};
 
export const getDeviations = async () => {
  const res = await handleApi(() => api.get("/api/qms/deviations"));
  const data = Array.isArray(res?.data) ? res.data : [];
  return { ...res, data: data.map(normalizeDeviation) };
};
 
export const createDeviation = (data) =>
  handleApi(() => api.post("/api/qms/deviations", data));
 
export const updateDeviation = (id, data) =>
  handleApi(() => api.put(`/api/qms/deviations/${id}`, data));
 
export const deleteDeviation = (id) =>
  handleApi(() => api.delete(`/api/qms/deviations/${id}`));

//========================================================recall==================================================

export const getRecalls = () => handleApi(() => api.get("/api/qms/recalls"));
export const createRecall = (data) => handleApi(() => api.post("/api/qms/recalls", data));
export const updateRecall = (id, data) => handleApi(() => api.put(`/api/qms/recalls/${id}`, data));
export const deleteRecall = (id) => handleApi(() => api.delete(`/api/qms/recalls/${id}`));

//============================================== incidents ============================================================

export const getIncidents = () => handleApi(() => api.get("/api/qms/incidents"));
export const getIncident = (id) => handleApi(() => api.get(`/api/qms/incidents/${id}`));
export const createIncident = (data) => handleApi(() => api.post("/api/qms/incidents", data));
export const updateIncident = (id, data) => handleApi(() => api.put(`/api/qms/incidents/${id}`, data));
export const deleteIncident = (id) => handleApi(() => api.delete(`/api/qms/incidents/${id}`));

//============================================== Master ============================================================

export const getMasters   = (type)            => handleApi(() => api.get(`/api/qms/masters/${type}`));
export const createMaster = (type, data)      => handleApi(() => api.post(`/api/qms/masters/${type}`, data));
export const updateMaster = (type, id, data)  => handleApi(() => api.put(`/api/qms/masters/${type}/${id}`, data));
export const deleteMaster = (type, id)        => handleApi(() => api.delete(`/api/qms/masters/${type}/${id}`));
 
// QMS FORMS ke dropdown ke liye — sirf ACTIVE, {value:id, label:name}
export const getMasterOptions = async (type) => {
  const res = await getMasters(type);
  const rows = Array.isArray(res?.data) ? res.data : [];
  return rows
    .filter((r) => r.is_active === 1 || r.is_active === true)
    .map((r) => ({ value: r.id, label: r.name }));
};
 
//============================================== Training ============================================================

export const getTrainings = () => handleApi(() => api.get("/api/qms/trainings"));
export const getTraining = (id) => handleApi(() => api.get(`/api/qms/trainings/${id}`));
export const createTraining = (data) => handleApi(() => api.post("/api/qms/trainings", data));
export const updateTraining = (id, data) => handleApi(() => api.put(`/api/qms/trainings/${id}`, data));
export const deleteTraining = (id) => handleApi(() => api.delete(`/api/qms/trainings/${id}`));

//============================================== DmsRecord ============================================================

export const getDmsRecords = () => handleApi(() => api.get("/api/qms/dms"));
export const getDmsRecord = (id) => handleApi(() => api.get(`/api/qms/dms/${id}`));
export const createDmsRecord = (data) => handleApi(() => api.post("/api/qms/dms", data));
export const updateDmsRecord = (id, data) => handleApi(() => api.put(`/api/qms/dms/${id}`, data));
export const deleteDmsRecord = (id) => handleApi(() => api.delete(`/api/qms/dms/${id}`));

//============================================== Calibrations ============================================================

export const getCalibrations = () => handleApi(() => api.get("/api/qms/calibrations"));
export const createCalibration = (data) => handleApi(() => api.post("/api/qms/calibrations", data));
export const updateCalibration = (id, data) => handleApi(() => api.put(`/api/qms/calibrations/${id}`, data));
export const deleteCalibration = (id) => handleApi(() => api.delete(`/api/qms/calibrations/${id}`));



// QmsAPI.js mein add karo (Recall wale functions ke paas hi)

export const getEnvironmentalMonitorings = (params) =>
  handleApi(() => api.get("/api/qms/environmental", { params }));

export const createEnvironmentalMonitoring = (data) =>
  handleApi(() => api.post("/api/qms/environmental", data));

export const updateEnvironmentalMonitoring = (id, data) =>
  handleApi(() => api.put(`/api/qms/environmental/${id}`, data));

export const deleteEnvironmentalMonitoring = (id) =>
  handleApi(() => api.delete(`/api/qms/environmental/${id}`));






//============================================== STP Register ============================================================
export const getSTPs = () => handleApi(() => api.get("/api/qms/stp"));
export const getSTP = (id) => handleApi(() => api.get(`/api/qms/stp/${id}`));
export const createSTP = (data) => handleApi(() => api.post("/api/qms/stp", data));
export const updateSTP = (id, data) => handleApi(() => api.put(`/api/qms/stp/${id}`, data));
export const deleteSTP = (id) => handleApi(() => api.delete(`/api/qms/stp/${id}`));

//============================================== Qualifications ============================================================

export const getQualifications = () => handleApi(() => api.get("/api/qms/qualifications"));
export const createQualification = (data) => handleApi(() => api.post("/api/qms/qualifications", data));
export const updateQualification = (id, data) => handleApi(() => api.put(`/api/qms/qualifications/${id}`, data));
export const deleteQualification = (id) => handleApi(() => api.delete(`/api/qms/qualifications/${id}`));

//============================================== Audit Management ============================================================

export const getAudits = () => handleApi(() => api.get("/api/qms/audits"));
export const getAudit = (id) => handleApi(() => api.get(`/api/qms/audits/${id}`));
export const createAudit = (data) => handleApi(() => api.post("/api/qms/audits", data));
export const updateAudit = (id, data) => handleApi(() => api.put(`/api/qms/audits/${id}`, data));
export const deleteAudit = (id) => handleApi(() => api.delete(`/api/qms/audits/${id}`));

//============================================== Preventive Maintenance ============================================================

export const getPmRecords = () => handleApi(() => api.get("/api/qms/preventive-maintenance"));
export const createPmRecord = (data) => handleApi(() => api.post("/api/qms/preventive-maintenance", data));
export const updatePmRecord = (id, data) => handleApi(() => api.put(`/api/qms/preventive-maintenance/${id}`, data));
export const deletePmRecord = (id) => handleApi(() => api.delete(`/api/qms/preventive-maintenance/${id}`));

//============================================== CAPA ============================================================

export const getCapas = () => handleApi(() => api.get("/api/qms/capas"));
export const createCapa = (data) => handleApi(() => api.post("/api/qms/capas", data));
export const updateCapa = (id, data) => handleApi(() => api.put(`/api/qms/capas/${id}`, data));
export const deleteCapa = (id) => handleApi(() => api.delete(`/api/qms/capas/${id}`));

//============================================== Change Controls ============================================================

export const getChangeControls = () => handleApi(() => api.get("/api/qms/change-controls"));
export const createChangeControl = (data) => handleApi(() => api.post("/api/qms/change-controls", data));
export const updateChangeControl = (id, data) => handleApi(() => api.put(`/api/qms/change-controls/${id}`, data));
export const deleteChangeControl = (id) => handleApi(() => api.delete(`/api/qms/change-controls/${id}`));


//========================================================workflow==================================================
export const getWorkflowConfig = () => handleApi(() => api.get("/api/qms/workflow-config"));
export const advanceState = (module, id, newStatus, typedName) =>
  handleApi(() => api.patch(`/api/qms/${module}/${id}/advance-state`, { newStatus, typedName }));
export const getEsignatures = (module, id) => handleApi(() => api.get(`/api/qms/${module}/${id}/esignatures`));
 export const createLinkedCapa = (module, id, problemStatement) =>
  handleApi(() => api.post(`/api/qms/${module}/${id}/create-linked-capa`, { problemStatement }));
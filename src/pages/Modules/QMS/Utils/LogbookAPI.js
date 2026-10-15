// e-Logbook API — same handleApi/api pattern as QmsAPI.js
import { handleApi } from "../../../../utils/apiHandler";
import { api } from "../../../../utils/api";

const BASE = "/api/qms/logbook";
const tk = (k) => encodeURIComponent(k);

// ── templates (types) — version controlled: Draft → In review → Effective ──
export const getLogbookTypes = () => handleApi(() => api.get(`${BASE}/types`));                       // { data, me }
export const getTypeVersions = (typeKey) => handleApi(() => api.get(`${BASE}/types/${tk(typeKey)}/versions`));
export const getTypeVersion = (typeKey, v) => handleApi(() => api.get(`${BASE}/types/${tk(typeKey)}/versions/${v}`));
export const createLogbookType = (body) => handleApi(() => api.post(`${BASE}/types`, body));          // { definition, changeReason }
export const saveTypeDraft = (typeKey, body) => handleApi(() => api.put(`${BASE}/types/${tk(typeKey)}/draft`, body));   // { definition, changeReason, rowVer }
export const submitTypeDraft = (typeKey, body) => handleApi(() => api.post(`${BASE}/types/${tk(typeKey)}/draft/submit`, body));   // { typedName, rowVer }
export const approveTypeDraft = (typeKey, body) => handleApi(() => api.post(`${BASE}/types/${tk(typeKey)}/draft/approve`, body)); // { typedName, comment, applyToActive }
export const returnTypeDraft = (typeKey, body) => handleApi(() => api.post(`${BASE}/types/${tk(typeKey)}/draft/return`, body));   // { comment }
export const discardTypeDraft = (typeKey, body) => handleApi(() => api.post(`${BASE}/types/${tk(typeKey)}/draft/discard`, body)); // { reason }
export const setTypeRetired = (typeKey, body) => handleApi(() => api.post(`${BASE}/types/${tk(typeKey)}/retire`, body));          // { retire, reason, typedName }

// ── registers ──
export const getRegisters = (status = "All") => handleApi(() => api.get(`${BASE}/registers?status=${status}`));
export const getRegister = (id) => handleApi(() => api.get(`${BASE}/registers/${id}`));
export const issueRegister = (body) => handleApi(() => api.post(`${BASE}/registers`, body));
export const closeRegister = (id) => handleApi(() => api.patch(`${BASE}/registers/${id}/close`));

// ── entries ──
export const addEntry = (registerId, data, typedName) =>
  handleApi(() => api.post(`${BASE}/registers/${registerId}/entries`, { data, typedName }));
export const verifyEntry = (entryId, typedName) =>
  handleApi(() => api.patch(`${BASE}/entries/${entryId}/verify`, { typedName }));
export const cancelEntry = (entryId, reason) =>
  handleApi(() => api.patch(`${BASE}/entries/${entryId}/cancel`, { reason }));

// ── dashboard ──
export const getLogbookSummary = () => handleApi(() => api.get(`${BASE}/summary`));

// ── reused from existing QMS endpoints ──
export const getRoleOptions = () => handleApi(() => api.get(`/api/qms/workflow-roles/options`));

// ── reused: record-history (audit trail + e-signatures) — same endpoint every QMS module uses ──
export const getLogbookHistory = (recordNo) =>
  handleApi(() => api.get(`/api/qms/record-history/logbook/${encodeURIComponent(recordNo)}`));

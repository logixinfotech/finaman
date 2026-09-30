// e-Logbook API — same handleApi/api pattern as QmsAPI.js
import { handleApi } from "../../../../utils/apiHandler";
import { api } from "../../../../utils/api";

const BASE = "/api/qms/logbook";

// ── types (config) ──
export const getLogbookTypes = () => handleApi(() => api.get(`${BASE}/types`));
export const saveLogbookType = (typeKey, body) => handleApi(() => api.put(`${BASE}/types/${typeKey}`, body));
export const resetLogbookType = (typeKey) => handleApi(() => api.delete(`${BASE}/types/${typeKey}`));

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
export const createLogbookType = (body) => handleApi(() => api.post(`${BASE}/types`, body));   // company-defined type
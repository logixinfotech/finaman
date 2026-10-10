import { api } from "./api";
import { handleApi } from "./apiHandler";
import { getActiveVacanciesWithJD } from "./recruitmentApi";

export { getActiveVacanciesWithJD };

const BASE = "/api/recruitment/communication";

// ── Outbound Calling Queue ──────────────────────────────────────────────────
export const getCallingQueue = (params = {}) =>
  handleApi(() => api.get(`${BASE}/calling-queue`, { params }));

// ── Universal Call Disposition (Multipart Form Data supported) ───────────────
export const saveCallDisposition = (data) => {
  if (data instanceof FormData) {
    return handleApi(() =>
      api.post(`${BASE}/disposition`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  }
  return handleApi(() => api.post(`${BASE}/disposition`, data));
};

// ── Inbound Call Search ──────────────────────────────────────────────────────
export const searchInboundCandidate = (term) =>
  handleApi(() => api.get(`${BASE}/inbound/search`, { params: { term } }));

// ── Scheduled Callbacks ──────────────────────────────────────────────────────
export const getScheduledCallbacks = (params = {}) =>
  handleApi(() => api.get(`${BASE}/callbacks`, { params }));

// ── Templates Master ─────────────────────────────────────────────────────────
export const getCommunicationTemplates = (params = {}) =>
  handleApi(() => api.get(`${BASE}/templates`, { params }));

export const saveCommunicationTemplate = (data) =>
  handleApi(() => api.post(`${BASE}/templates`, data));

export const deleteCommunicationTemplate = (templateId) =>
  handleApi(() => api.delete(`${BASE}/templates/${templateId}`));

// ── Send Message & Email ────────────────────────────────────────────────────
export const sendCandidateMessage = (data) =>
  handleApi(() => api.post(`${BASE}/messages/send`, data));

export const sendCandidateEmail = (data) =>
  handleApi(() => api.post(`${BASE}/email/send`, data));

export const sendBulkWhatsApp = (data) =>
  handleApi(() => api.post(`${BASE}/whatsapp/bulk-send`, data));

// ── Communication History ────────────────────────────────────────────────────
export const getCommunicationHistory = (params = {}) =>
  handleApi(() => api.get(`${BASE}/history`, { params }));

export const getCandidateCommunicationHistory = (candidateId) =>
  handleApi(() => api.get(`${BASE}/candidate/${candidateId}/history`));

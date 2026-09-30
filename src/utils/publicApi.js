import axios from "axios";
import config from "../config";  

const publicApi = axios.create({
  baseURL: config.apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
}); 

export const fetchPublicQuotation = (led_key) =>
  publicApi.get("/api/public/quotation", { params: { led_key } }).then(r => r.data);

export const updatePublicQuotation = (payload) =>
  publicApi.post("/api/public/quotation/update", payload).then(r => r.data);

// ── Public Candidate Recruitment API ─────────────────────────────────────────
export const fetchPublicActiveVacancies = (params) =>
  publicApi.get("/api/public/recruitment/active-vacancies", { params }).then(r => r.data);

export const fetchPublicVacancyDetails = (params) =>
  publicApi.get("/api/public/recruitment/vacancy-details", { params }).then(r => r.data);

export const checkPublicCandidateDuplicate = (payload) =>
  publicApi.post("/api/public/recruitment/check-duplicate", payload).then(r => r.data);

export const submitPublicCandidateApplication = (formData) =>
  publicApi.post("/api/public/recruitment/apply", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data);
  
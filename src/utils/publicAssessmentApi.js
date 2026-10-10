import axios from "axios";
import config from "../config";

// Public unauthenticated Axios instance. Must point at the API server: the
// page itself is served by the React dev server / static host, which has no
// /api routes (that was the 404 on the validate call).
const publicClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
});

// Open (assessment-level) link: candidate enters their details and gets a token
export const registerForAssessment = async (db, payload) => {
  const res = await publicClient.post(
    `/api/public/recruitment-assessment/register`,
    { ...payload, db },
    { params: { db } }
  );
  return res.data;
};

// Public info for an open assessment link (title, duration, etc.)
export const getOpenAssessmentInfo = async (db, assessmentId) => {
  const res = await publicClient.get(`/api/public/recruitment-assessment/open-info`, {
    params: { db, aid: assessmentId },
  });
  return res.data;
};

export const validateAssessmentToken = async (db, token) => {
  const res = await publicClient.get(`/api/public/recruitment-assessment/validate`, {
    params: { db, token },
  });
  return res.data;
};

export const startAssessment = async (db, token, honeypot = "") => {
  const res = await publicClient.post(
    `/api/public/recruitment-assessment/start`,
    { token, honeypot, db },
    { params: { db } }
  );
  return res.data;
};

export const saveCandidateAnswer = async (db, formDataOrJson) => {
  const isForm = formDataOrJson instanceof FormData;
  const res = await publicClient.post(
    `/api/public/recruitment-assessment/answer`,
    formDataOrJson,
    {
      params: { db },
      headers: isForm ? { "Content-Type": "multipart/form-data" } : {},
    }
  );
  return res.data;
};

export const submitCandidateAssessment = async (db, payload) => {
  const res = await publicClient.post(
    `/api/public/recruitment-assessment/submit`,
    { ...payload, db },
    { params: { db } }
  );
  return res.data;
};

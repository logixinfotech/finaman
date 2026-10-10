import { api } from "./api";
import { handleApi } from "./apiHandler";

const BASE = "/api/whatsapp";

// Send/Log a WhatsApp message globally
export const sendGlobalWhatsApp = (data) =>
  handleApi(() => api.post(`${BASE}/send`, data));

export const sendWhatsAppMessage = sendGlobalWhatsApp;

// Get WhatsApp audit logs
export const getGlobalWhatsAppLogs = (params = {}) =>
  handleApi(() => api.get(`${BASE}/logs`, { params }));

// Render template with variable substitution
export const renderWhatsAppTemplate = (template_text, variables = {}) =>
  handleApi(() => api.post(`${BASE}/render-template`, { template_text, variables }));

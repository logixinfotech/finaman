// hooks/usePrintTemplates.js
import { useState, useCallback } from 'react';
import { api } from '../utils/api';

export function usePrintTemplates(printBaseUrl) {
  const [templates, setTemplates] = useState([]);
  const [templatesError, setTemplatesError] = useState(null); 
  const fetchTemplates = useCallback(async () => {
    if (!printBaseUrl) return [];
    try {
      const res = await api.get(`${printBaseUrl}/templates`); 
      const raw = res.data;
      const list = Array.isArray(raw) ? raw
        : Array.isArray(raw?.templates) ? raw.templates
        : Array.isArray(raw?.data) ? raw.data
        : [];
      setTemplates(list);
      setTemplatesError(null);
      return list;
    } catch (err) {
      console.error(`Template list error:`, err.response?.data || err.message);
      setTemplates([]);
      setTemplatesError(err.response?.data?.message || 'Templates unavailable');
      return [];
    }
  }, [printBaseUrl]);

  return { templates, templatesError, fetchTemplates }; 
}
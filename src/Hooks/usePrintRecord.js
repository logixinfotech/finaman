// hooks/usePrintRecord.js
import { useState, useCallback, useRef } from 'react';
import { api } from '../utils/api';

export function usePrintRecord(printBaseUrl) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const lastArgsRef = useRef(null); // regenerate ke liye yaad rakhta hai last call kya thi

  const openPrint = useCallback(async (id, { templateId, sign } = {}) => {
    lastArgsRef.current = { id, templateId, sign };
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (templateId) params.set('templateId', templateId);
      if (sign) params.set('sign', '1');
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`${printBaseUrl}/${id}/print${qs}`, { responseType: 'blob' });

      const contentType = res.headers['content-type'] || '';
      if (!contentType.includes('application/pdf')) {
        const text = await res.data.text();
        let msg = 'Server did not return a PDF.';
        try { msg = JSON.parse(text)?.message || msg; } catch {}
        throw new Error(msg);
      }

      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPdfUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
      setGeneratedAt(Date.now());
    } catch (e) {
      let message = e.message || 'Could not generate PDF.';
      if (e?.response?.data instanceof Blob) {
        try { message = JSON.parse(await e.response.data.text())?.message || message; } catch {}
      } else if (e?.response?.data?.message) {
        message = e.response.data.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [printBaseUrl]);

  const regenerate = useCallback(() => {
    if (lastArgsRef.current) openPrint(lastArgsRef.current.id, lastArgsRef.current);
  }, [openPrint]);

  const closePrint = useCallback(() => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setError(null);
    setGeneratedAt(null);
  }, [pdfUrl]);

  return { pdfUrl, loading, error, generatedAt, openPrint, regenerate, closePrint };
}
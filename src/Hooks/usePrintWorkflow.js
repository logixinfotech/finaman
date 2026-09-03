// hooks/usePrintWorkflow.js
import { useState, useCallback, useRef, useMemo } from 'react';
import { api } from '../utils/api';
import { usePrintRecord } from './usePrintRecord';
import { usePrintTemplates } from './usePrintTemplates';

export function usePrintWorkflow({ printBaseUrl, applName, emailEndpoint, shareLinkEndpoint }) {
  const printRecord = usePrintRecord(printBaseUrl);
  const { templates, fetchTemplates } = usePrintTemplates(printBaseUrl);
  const safeTemplates = Array.isArray(templates) ? templates : []; // ✅ extra safety

  const [isOpen, setIsOpen] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [isSigned, setIsSigned] = useState(false);
  const [meta, setMeta] = useState({ fileName: null, contextLabel: null });

  const templatesFetchedRef = useRef(false);
  const ensureTemplates = useCallback(async () => {
    if (templatesFetchedRef.current) return safeTemplates;
    templatesFetchedRef.current = true;
    return fetchTemplates();
  }, [fetchTemplates, safeTemplates]);

  const shareLinkCacheRef = useRef(new Map());
  const invalidateShareCache = () => shareLinkCacheRef.current.clear();

  const openPrintFor = useCallback(async (id, opts = {}) => {
    setRecordId(id);
    setIsSigned(false);
    setMeta({ fileName: opts.fileName ?? null, contextLabel: opts.contextLabel ?? null });
    setIsOpen(true);
    invalidateShareCache();

    const list = await ensureTemplates();
    const safeList = Array.isArray(list) ? list : [];  
    const defaultTpl = safeList.find(t => t.isDefault) || safeList[0];
    setSelectedTemplateId(defaultTpl?.id ?? null);
    printRecord.openPrint(id, { templateId: defaultTpl?.id, sign: false });
  }, [ensureTemplates, printRecord]);

  const handleTemplateChange = useCallback((templateId) => {
    setSelectedTemplateId(templateId);
    invalidateShareCache();
    printRecord.openPrint(recordId, { templateId, sign: isSigned });
  }, [recordId, isSigned, printRecord]);

  const handleToggleSigned = useCallback((sign) => {
    setIsSigned(sign);
    invalidateShareCache();
    printRecord.openPrint(recordId, { templateId: selectedTemplateId, sign });
  }, [recordId, selectedTemplateId, printRecord]);

  const regenerate = useCallback(() => {
    invalidateShareCache();
    printRecord.regenerate();
  }, [printRecord]);

  const close = useCallback(() => {
    setIsOpen(false);
    printRecord.closePrint();
    invalidateShareCache();
  }, [printRecord]);

  const getShareLink = useCallback(async () => {
    const key = `${recordId}:${selectedTemplateId}`;
    const cached = shareLinkCacheRef.current.get(key);
    if (cached) return cached;
    const res = await api.get(`${shareLinkEndpoint}/${recordId}/share-link`, {
      params: { templateId: selectedTemplateId },
    });
    shareLinkCacheRef.current.set(key, res.data.shareUrl);
    return res.data.shareUrl;
  }, [recordId, selectedTemplateId, shareLinkEndpoint]);

  const sendEmail = useCallback(async ({ to, subject, message }) => {
    await api.post(`${emailEndpoint}/${recordId}/email`, {
      to, subject, message, templateId: selectedTemplateId,
    });
  }, [recordId, selectedTemplateId, emailEndpoint]);

  const printProps = useMemo(() => ({
    pdfUrl: printRecord.pdfUrl,
    loading: printRecord.loading,
    error: printRecord.error,
    generatedAt: printRecord.generatedAt,
    fileName: meta.fileName,
    contextLabel: meta.contextLabel,
    templates: safeTemplates, // ✅ hamesha array
    selectedTemplateId,
    onTemplateChange: handleTemplateChange,
    onRegenerate: regenerate,
    signedAvailable: !!emailEndpoint || safeTemplates.length > 0,
    isSigned,
    onToggleSigned: handleToggleSigned,
    onEmail: emailEndpoint ? sendEmail : null,
    onGetShareLink: shareLinkEndpoint ? getShareLink : null,
    onBack: close,
  }), [
    printRecord.pdfUrl, printRecord.loading, printRecord.error, printRecord.generatedAt,
    meta, safeTemplates, selectedTemplateId, handleTemplateChange, regenerate,
    isSigned, handleToggleSigned, emailEndpoint, sendEmail, shareLinkEndpoint, getShareLink, close,
  ]);

  return { isOpen, openPrintFor, close, printProps };
}
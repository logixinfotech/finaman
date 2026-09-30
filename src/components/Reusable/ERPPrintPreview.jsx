import { useState, useRef, useEffect, useMemo } from "react";
import {
  ArrowLeft, Download, Printer, ZoomIn, ZoomOut, Maximize2, Minimize2,
  FileText, LoaderCircle, AlertTriangle, RefreshCw, ShieldCheck,
  ChevronDown, ChevronLeft, ChevronRight, ExternalLink, MoreVertical,
  PanelTop, Building2, Share2, Mail, Link2, Check,
} from "lucide-react";
import { copyToClipboard } from "../../utils/helpers";
 
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

 .rpv-root { font-family:'Plus Jakarta Sans',sans-serif; width:100%; height:100%; min-height:100vh;
  background:#f4f6f9; display:flex; flex-direction:column; color:#0f172a;
  position:relative; z-index:0; isolation:isolate; min-width:0; max-width:100%; }

    /* ---------- single-row toolbar ---------- */
    .rpv-topbar { display:flex; align-items:center; gap:10px; padding:10px 16px;
      background:#ffffff; border-bottom:1px solid #e5e9f0; position:sticky; top:0; z-index:50;
      box-shadow:0 1px 2px rgba(15,23,42,.03); }
    .rpv-left { display:flex; align-items:center; gap:10px; min-width:0; flex:1 1 auto; }
    .rpv-icon-btn { display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:8px;
      border:1px solid transparent; background:transparent; color:#64748b; cursor:pointer; transition:all .15s; flex-shrink:0; }
    .rpv-icon-btn:hover { background:#f1f5f9; color:#334155; }
    .rpv-icon-btn:disabled { opacity:.35; cursor:not-allowed; }
    .rpv-icon-btn.active { background:#eef2ff; color:#4f46e5; }
    .rpv-icon-btn.spin-on-hover:hover svg { animation: rpv-spin .6s linear; }

    .rpv-doc-icon { width:34px; height:34px; border-radius:8px; background:#eef2ff; border:1px solid #e0e7ff;
      display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#4f46e5; }
    .rpv-title-block { min-width:0; }
    .rpv-title-row { display:flex; align-items:center; gap:8px; }
    .rpv-title { font-size:14px; font-weight:600; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:260px; }
    .rpv-status-chip { display:flex; align-items:center; gap:4px; font-size:10.5px; font-weight:600; padding:2px 7px;
      border-radius:999px; white-space:nowrap; text-transform:uppercase; letter-spacing:.02em; }
    .rpv-status-chip.signed { background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; }
    .rpv-status-chip.draft { background:#fffbeb; color:#b45309; border:1px solid #fde68a; }
    .rpv-subtitle { font-size:11.5px; color:#94a3b8; margin-top:1px; display:flex; align-items:center; gap:5px;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:360px; }
    .rpv-subtitle b { color:#64748b; font-weight:500; }

    /* Template dropdown — compact, inline in the same row */
    .rpv-tpl-select-wrap { position:relative; flex-shrink:0; }
    .rpv-tpl-select { appearance:none; background:#f8fafc; border:1px solid #e2e8f0;
      color:#334155; font-size:12.5px; font-weight:500; padding:7px 28px 7px 11px; border-radius:8px; cursor:pointer;
      max-width:160px; text-overflow:ellipsis; }
    .rpv-tpl-select:hover { border-color:#c7d2fe; }
    .rpv-tpl-chevron { position:absolute; right:8px; top:50%; transform:translateY(-50%); pointer-events:none; color:#94a3b8; }

    .rpv-zoom-cluster { display:flex; align-items:center; gap:1px; background:#f8fafc;
      border:1px solid #e2e8f0; border-radius:8px; padding:2px; flex-shrink:0; }
    .rpv-zoom-pct { font-size:11.5px; font-weight:600; color:#475569; width:44px; text-align:center; font-family:'JetBrains Mono',monospace; cursor:pointer; }
    .rpv-fit-btn { font-size:11px; font-weight:600; color:#475569; padding:0 8px; height:28px; border-radius:6px; cursor:pointer; }
    .rpv-fit-btn.active { background:#4f46e5; color:#fff; }

    .rpv-right { display:flex; align-items:center; gap:6px; flex-shrink:0; }
    .rpv-divider { width:1px; height:20px; background:#e5e9f0; margin:0 2px; }
    .rpv-btn-ghost { display:flex; align-items:center; gap:6px; padding:7px 12px; border-radius:8px;
      border:1px solid #e2e8f0; background:#fff; color:#334155; font-size:12.5px;
      font-weight:500; cursor:pointer; transition:all .15s; white-space:nowrap; }
    .rpv-btn-ghost:hover { background:#f8fafc; border-color:#cbd5e1; }
    .rpv-btn-ghost.active { background:#eef2ff; border-color:#c7d2fe; color:#4f46e5; }
    .rpv-btn-primary { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; border:none;
      background:#4f46e5; color:#fff; font-size:12.5px; font-weight:600; cursor:pointer; transition:all .15s; white-space:nowrap; }
    .rpv-btn-primary:hover { background:#4338ca; }
    .rpv-btn-primary:disabled, .rpv-btn-ghost:disabled { opacity:.4; cursor:not-allowed; }

    /* Overflow menu (desktop "more" + full mobile menu) */
    .rpv-menu-wrap { position:relative; }
    .rpv-menu { position:absolute; right:0; top:calc(100% + 6px); background:#fff; border:1px solid #e5e9f0;
      border-radius:10px; box-shadow:0 12px 32px rgba(15,23,42,.12); padding:6px; min-width:190px; z-index:60; }
    .rpv-menu-item { display:flex; align-items:center; gap:9px; padding:9px 10px; border-radius:7px; font-size:13px;
      color:#334155; cursor:pointer; white-space:nowrap; }
    .rpv-menu-item:hover { background:#f1f5f9; }
    .rpv-menu-item:disabled { opacity:.4; cursor:not-allowed; }
    .rpv-menu-sep { height:1px; background:#eef1f5; margin:5px 2px; }
    .rpv-mobile-only, .rpv-mobile-only-sep { display:none; }

    /* Email modal */
    .rpv-modal-backdrop { position:fixed; inset:0; background:rgba(15,23,42,.45); display:flex; align-items:center;
      justify-content:center; z-index:100; }
    .rpv-modal { background:#fff; border-radius:12px; padding:20px; width:380px; max-width:90vw;
      box-shadow:0 20px 60px rgba(15,23,42,.25); }
    .rpv-modal h3 { font-size:14.5px; font-weight:600; margin:0 0 14px; color:#0f172a; }
    .rpv-modal-input, .rpv-modal-textarea { width:100%; padding:8px 11px; border:1px solid #e2e8f0; border-radius:7px;
      font-size:13px; margin-bottom:10px; font-family:inherit; color:#0f172a; }
    .rpv-modal-input:focus, .rpv-modal-textarea:focus { outline:none; border-color:#a5b4fc; }
    .rpv-modal-textarea { resize:vertical; }
    .rpv-modal-msg { font-size:12px; margin-bottom:8px; }
    .rpv-modal-msg.error { color:#dc2626; }
    .rpv-modal-msg.success { color:#059669; display:flex; align-items:center; gap:5px; }
    .rpv-modal-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:2px; }

    /* ---------- document canvas ---------- */
    .rpv-stage { flex:1; display:flex; align-items:flex-start; justify-content:center; padding:28px 16px 24px; overflow:auto;
      background-image:radial-gradient(circle at 1px 1px, rgba(15,23,42,0.045) 1px, transparent 0); background-size:20px 20px; }
    .rpv-page-shell { background:#fff; border-radius:4px; box-shadow:0 1px 3px rgba(15,23,42,.06),0 12px 32px rgba(15,23,42,.10);
      border:1px solid #e5e9f0; transition:width .2s ease; overflow:hidden; flex-shrink:0; }
    .rpv-page-shell iframe { width:100%; height:100%; border:none; display:block; }

    .rpv-skel-doc { width:620px; max-width:90vw; aspect-ratio:1/1.4142; background:#fff; border:1px solid #e5e9f0;
      border-radius:4px; box-shadow:0 12px 32px rgba(15,23,42,.08); padding:40px; position:relative; overflow:hidden; }
    .rpv-skel-line { height:11px; background:#eef1f5; border-radius:4px; margin-bottom:14px; }
    .rpv-skel-shimmer { position:absolute; inset:0; background:linear-gradient(100deg, transparent 30%, rgba(15,23,42,.035) 50%, transparent 70%);
      background-size:200% 100%; animation:rpv-shimmer 1.6s infinite; }
    @keyframes rpv-shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
    .rpv-loading-caption { display:flex; align-items:center; gap:9px; justify-content:center; margin-top:16px; color:#94a3b8; font-size:13px; }
    .rpv-spin { animation:rpv-spin .9s linear infinite; color:#4f46e5; }
    @keyframes rpv-spin { to{ transform:rotate(360deg);} }

    .rpv-error-card { width:400px; max-width:90vw; background:#fff; border:1px solid #fecaca; border-radius:12px;
      padding:26px 22px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:8px;
      box-shadow:0 12px 32px rgba(15,23,42,.08); }
    .rpv-error-icon { width:42px; height:42px; border-radius:50%; background:#fef2f2; display:flex;
      align-items:center; justify-content:center; color:#dc2626; margin-bottom:2px; }
    .rpv-error-title { font-size:14px; font-weight:600; color:#991b1b; }
    .rpv-error-msg { font-size:12.5px; color:#64748b; line-height:1.6; }
    .rpv-error-actions { display:flex; gap:8px; margin-top:6px; }

    /* ---------- status footer (replaces the old floating pill) ---------- */
    .rpv-footer { display:flex; align-items:center; justify-content:center; gap:16px; padding:8px 16px;
      background:#fff; border-top:1px solid #e5e9f0; font-size:11.5px; color:#94a3b8; flex-wrap:wrap; }
    .rpv-page-nav { display:flex; align-items:center; gap:4px; font-family:'JetBrains Mono',monospace; color:#475569; }
    .rpv-page-nav-input { width:32px; text-align:center; border:1px solid #e2e8f0; border-radius:5px; font-size:11.5px;
      font-family:'JetBrains Mono',monospace; color:#334155; padding:2px 0; }
    .rpv-footer-sep { width:1px; height:14px; background:#e5e9f0; }
    .rpv-kbd { display:none; align-items:center; gap:12px; }
    .rpv-kbd kbd { background:#f1f5f9; border:1px solid #e2e8f0; padding:1px 5px; border-radius:4px; font-family:'JetBrains Mono',monospace; color:#64748b; }

    @media (min-width:900px) { .rpv-kbd { display:flex; } }

    /* ---------- responsive ---------- */
    @media (max-width:768px) {
      .rpv-title { max-width:120px; }
      .rpv-subtitle { max-width:150px; }
      .rpv-tpl-select-wrap, .rpv-zoom-cluster, .rpv-divider,
      .rpv-desktop-only { display:none !important; }
      .rpv-btn-ghost span, .rpv-btn-primary span { display:none; }
      .rpv-btn-ghost, .rpv-btn-primary { padding:8px; }
      .rpv-topbar { padding:8px 10px; }
      .rpv-mobile-only { display:flex !important; }
      .rpv-mobile-only-sep { display:block !important; }
    }
  `}</style>
);

const A4_RATIO = 1 / 1.4142;

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(ts).toLocaleTimeString();
}

const ERPPrintPreview = ({
  title = "Document",
  pdfUrl = null,
  loading = false,
  error = null,
  onBack,
  fileName,
  generatedAt = null,
  onRegenerate = null, 
  templates = [],                 // [{ id, name, isDefault }]
  selectedTemplateId = null,
  onTemplateChange = null, 
  signedAvailable = false,
  isSigned = false,
  onToggleSigned = null, 
  contextLabel = null,            // e.g. company name
 
  pageCount = null,
 
  onEmail = null,          // async ({ to, subject, message }) => void
  onGetShareLink = null,   // async () => string (share URL)
}) => {
  const [zoom, setZoom] = useState(100);
  const [fitWidth, setFitWidth] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ago, setAgo] = useState('');
  const [page, setPage] = useState(1);
  const [shareOpen, setShareOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const rootRef = useRef(null);
  const frameRef = useRef(null);
  const stageRef = useRef(null);
  const menuRef = useRef(null);
  const shareRef = useRef(null);

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const zoomIn = () => { setFitWidth(false); setZoom(z => Math.min(200, z + 10)); };
  const zoomOut = () => { setFitWidth(false); setZoom(z => Math.max(50, z - 10)); };
  const resetZoom = () => { setFitWidth(false); setZoom(100); };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { rootRef.current?.requestFullscreen?.(); setFullscreen(true); }
    else { document.exitFullscreen?.(); setFullscreen(false); }
  };
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Close overflow menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  // Close share dropdown on outside click
  useEffect(() => {
    if (!shareOpen) return;
    const onClick = (e) => { if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [shareOpen]);

  useEffect(() => {
    if (!generatedAt) return;
    setAgo(timeAgo(generatedAt));
    const t = setInterval(() => setAgo(timeAgo(generatedAt)), 5000);
    return () => clearInterval(t);
  }, [generatedAt]);

  useEffect(() => { setPage(1); }, [pdfUrl]);

  useEffect(() => {
    const onKeyDown = (e) => { 
      if (!e.key) return; 
      const tag = e.target?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable;
      if (emailModalOpen || isTyping) return;

      if (e.key === 'Escape' && onBack) { onBack(); return; }
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'p') { e.preventDefault(); handlePrint(); return; }
      if (ctrl && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoomIn(); return; }
      if (ctrl && e.key === '-') { e.preventDefault(); zoomOut(); return; }
      if (ctrl && e.key === '0') { e.preventDefault(); resetZoom(); return; }
      if (e.key.toLowerCase() === 'r' && onRegenerate) { onRegenerate(); return; }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onBack, onRegenerate, pdfUrl, emailModalOpen]);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${fileName || title}${isSigned ? '_signed' : ''}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const handlePrint = () => frameRef.current?.contentWindow?.print();
  const handleOpenNewTab = () => { if (pdfUrl) window.open(pdfUrl, '_blank'); };

  const handleNativeShare = async () => {
    if (!pdfUrl) return;
    try {
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const file = new File([blob], `${fileName || title}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else {
        await navigator.share({ title, url: pdfUrl });
      }
    } catch { /* user cancelled — ignore */ }
    setShareOpen(false);
    setMenuOpen(false);
  };

  const handleWhatsApp = async () => {
    if (!onGetShareLink) return;
    try {
      const url = await onGetShareLink();
      window.open(`https://wa.me/?text=${encodeURIComponent(`${title}: ${url}`)}`, '_blank');
    } catch { /* silently fail, ya toast dikhao */ }
    setShareOpen(false);
    setMenuOpen(false);
  };

  const handleCopyLink = async () => {
    if (!onGetShareLink) return;
    try {
      const url = await onGetShareLink();
      await copyToClipboard(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleSendEmail = async () => {
    if (!onEmail || !emailTo) return;
    setEmailSending(true);
    setEmailError('');
    try {
      await onEmail({ to: emailTo, subject: title, message: emailMsg });
      setEmailSent(true);
      setTimeout(() => {
        setEmailModalOpen(false);
        setEmailSent(false);
        setEmailTo('');
        setEmailMsg('');
      }, 1200);
    } catch (e) {
      setEmailError(e?.response?.data?.message || 'Could not send email.');
    } finally {
      setEmailSending(false);
    }
  };

  const baseWidth = 680;
  const stageWidth = fitWidth ? (stageRef.current?.clientWidth ? Math.min(stageRef.current.clientWidth - 64, 900) : baseWidth) : null;
  const pageWidth = fitWidth ? (stageWidth || baseWidth) : baseWidth * (zoom / 100);
  const pageHeight = pageWidth / A4_RATIO;
  const srcWithParams = pdfUrl ? `${pdfUrl}#toolbar=0&navpanes=0&statusbar=0&view=FitH&page=${page}` : null;

  const selectedTemplateName = useMemo(
    () => templates.find(t => t.id === selectedTemplateId)?.name || (templates[0]?.name ?? null),
    [templates, selectedTemplateId]
  );

  const goPrevPage = () => setPage(p => Math.max(1, p - 1));
  const goNextPage = () => setPage(p => (pageCount ? Math.min(pageCount, p + 1) : p + 1));

  return (
    <div className="rpv-root" ref={rootRef}>
      <Styles />

      <div className="rpv-topbar">
        <div className="rpv-left">
          {onBack && (
            <button className="rpv-icon-btn" onClick={onBack} title="Back (Esc)">
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="rpv-doc-icon"><FileText size={16} /></div>
          <div className="rpv-title-block">
            <div className="rpv-title-row">
              <span className="rpv-title">{title}</span>
              {pdfUrl && !loading && signedAvailable && (
                <span className={`rpv-status-chip ${isSigned ? 'signed' : 'draft'}`}>
                  <ShieldCheck size={10} /> {isSigned ? 'Signed' : 'Draft'}
                </span>
              )}
            </div>
            <div className="rpv-subtitle">
              {loading ? 'Generating…' : pdfUrl ? (
                <>
                  {contextLabel && <><Building2 size={11} /><b>{contextLabel}</b></>}
                  {contextLabel && selectedTemplateName && <span>·</span>}
                  {selectedTemplateName && <span>{selectedTemplateName}</span>}
                  {generatedAt && <><span>·</span><span>{ago}</span></>}
                </>
              ) : 'Preview'}
            </div>
          </div>
        </div>

        {templates.length > 1 && onTemplateChange && (
          <div className="rpv-tpl-select-wrap">
            <select
              className="rpv-tpl-select"
              value={selectedTemplateId ?? ''}
              onChange={(e) => onTemplateChange(Number(e.target.value))}
              disabled={loading}
              title="Choose which saved template to print with"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (Default)' : ''}</option>
              ))}
            </select>
            <ChevronDown size={13} className="rpv-tpl-chevron" />
          </div>
        )}

        <div className="rpv-zoom-cluster">
          <button className="rpv-icon-btn" style={{ width: 28, height: 28 }} onClick={zoomOut} disabled={!pdfUrl || (!fitWidth && zoom <= 50)} title="Zoom out (Ctrl -)"><ZoomOut size={13} /></button>
          <span className="rpv-zoom-pct" onClick={resetZoom} title="Click to reset to 100%">{fitWidth ? 'Fit' : `${zoom}%`}</span>
          <button className="rpv-icon-btn" style={{ width: 28, height: 28 }} onClick={zoomIn} disabled={!pdfUrl || (!fitWidth && zoom >= 200)} title="Zoom in (Ctrl +)"><ZoomIn size={13} /></button>
          <div className="rpv-divider" style={{ margin: '0 1px' }} />
          <button className={`rpv-fit-btn${fitWidth ? ' active' : ''}`} onClick={() => setFitWidth(f => !f)} disabled={!pdfUrl} title="Fit page to window width">
            Fit
          </button>
        </div>

        <div className="rpv-right">
          {signedAvailable && onToggleSigned && (
            <button
              className={`rpv-btn-ghost rpv-desktop-only${isSigned ? ' active' : ''}`}
              onClick={() => onToggleSigned(!isSigned)}
              disabled={loading}
              title={isSigned ? 'Currently generating a digitally signed copy' : 'Generate a digitally signed copy (DSC)'}
            >
              <ShieldCheck size={14} /> <span>{isSigned ? 'Signed' : 'Sign'}</span>
            </button>
          )}
          {onRegenerate && (
            <button className="rpv-icon-btn spin-on-hover rpv-desktop-only" onClick={onRegenerate} disabled={loading} title="Regenerate (R)">
              <RefreshCw size={15} />
            </button>
          )}
          <div className="rpv-divider rpv-desktop-only" />

          {(onEmail || onGetShareLink) && (
            <div className="rpv-menu-wrap rpv-desktop-only" ref={shareRef}>
              <button className="rpv-btn-ghost" onClick={() => setShareOpen(v => !v)} disabled={!pdfUrl}>
                <Share2 size={14} /> <span>Share</span>
              </button>
              {shareOpen && (
                <div className="rpv-menu" style={{ minWidth: 190 }}>
                  {canNativeShare && (
                    <div className="rpv-menu-item" onClick={handleNativeShare}>
                      <Share2 size={14} /> Share via…
                    </div>
                  )}
                  {onEmail && (
                    <div className="rpv-menu-item" onClick={() => { setEmailModalOpen(true); setShareOpen(false); }}>
                      <Mail size={14} /> Email
                    </div>
                  )}
                  {onGetShareLink && (
                    <div className="rpv-menu-item" onClick={handleWhatsApp}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg> WhatsApp
                    </div>
                  )}
                  {onGetShareLink && (
                    <div className="rpv-menu-item" onClick={handleCopyLink}>
                      {linkCopied ? <Check size={14} color="#059669" /> : <Link2 size={14} />}
                      {linkCopied ? 'Copied!' : 'Copy link'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <button className="rpv-btn-ghost" onClick={handleDownload} disabled={!pdfUrl}>
            <Download size={14} /> <span>Download</span>
          </button>
          <button className="rpv-btn-primary" onClick={handlePrint} disabled={!pdfUrl}>
            <Printer size={14} /> <span>Print</span>
          </button>

          {/* Overflow menu — holds secondary actions on desktop AND the collapsed set on mobile */}
          <div className="rpv-menu-wrap" ref={menuRef}>
            <button className="rpv-icon-btn" onClick={() => setMenuOpen(o => !o)} title="More options">
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="rpv-menu">
                {signedAvailable && onToggleSigned && (
                  <div className="rpv-menu-item" onClick={() => { onToggleSigned(!isSigned); setMenuOpen(false); }}>
                    <ShieldCheck size={14} /> {isSigned ? 'Signed copy on' : 'Sign this copy'}
                  </div>
                )}
                {onRegenerate && (
                  <div className="rpv-menu-item" onClick={() => { onRegenerate(); setMenuOpen(false); }}>
                    <RefreshCw size={14} /> Regenerate
                  </div>
                )}
                {(onEmail || onGetShareLink) && <div className="rpv-menu-sep rpv-mobile-only-sep" />}
                {onEmail && (
                  <div className="rpv-menu-item rpv-mobile-only" onClick={() => { setEmailModalOpen(true); setMenuOpen(false); }}>
                    <Mail size={14} /> Email
                  </div>
                )}
                {onGetShareLink && (
                  <div className="rpv-menu-item rpv-mobile-only" onClick={handleWhatsApp}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg> WhatsApp
                  </div>
                )}
                {onGetShareLink && (
                  <div className="rpv-menu-item rpv-mobile-only" onClick={handleCopyLink}>
                    {linkCopied ? <Check size={14} color="#059669" /> : <Link2 size={14} />}
                    {linkCopied ? 'Copied!' : 'Copy link'}
                  </div>
                )}
                <div className="rpv-menu-item" onClick={() => { handleOpenNewTab(); setMenuOpen(false); }}>
                  <ExternalLink size={14} /> Open in new tab
                </div>
                <div className="rpv-menu-item" onClick={() => { toggleFullscreen(); setMenuOpen(false); }}>
                  {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />} {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                </div>
                <div className="rpv-menu-sep" />
                <div className="rpv-menu-item" onClick={() => { window.open(`${pdfUrl}#toolbar=1`, '_blank'); setMenuOpen(false); }}>
                  <PanelTop size={14} /> Open with PDF toolbar
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rpv-stage" ref={stageRef}>
        {loading && (
          <div>
            <div className="rpv-skel-doc">
              <div className="rpv-skel-shimmer" />
              <div className="rpv-skel-line" style={{ width: '55%', height: 18, marginBottom: 22 }} />
              <div className="rpv-skel-line" style={{ width: '80%' }} />
              <div className="rpv-skel-line" style={{ width: '65%' }} />
              <div className="rpv-skel-line" style={{ width: '90%' }} />
              <div className="rpv-skel-line" style={{ width: '40%', marginTop: 28 }} />
              <div className="rpv-skel-line" style={{ width: '70%' }} />
              <div className="rpv-skel-line" style={{ width: '55%' }} />
            </div>
            <div className="rpv-loading-caption">
              <LoaderCircle size={15} className="rpv-spin" />
              <span>Generating your document…</span>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="rpv-error-card">
            <div className="rpv-error-icon"><AlertTriangle size={20} /></div>
            <div className="rpv-error-title">Couldn't generate this document</div>
            <div className="rpv-error-msg">{error}</div>
            <div className="rpv-error-actions">
              {onRegenerate && (
                <button className="rpv-btn-primary" onClick={onRegenerate}><RefreshCw size={13} /> <span>Retry</span></button>
              )}
              <button className="rpv-btn-ghost" onClick={onBack}><ArrowLeft size={13} /> <span>Go back</span></button>
            </div>
          </div>
        )}

        {pdfUrl && !loading && !error && (
          <div className="rpv-page-shell" style={{ width: pageWidth, height: pageHeight }}>
            <iframe ref={frameRef} src={srcWithParams} title={title} />
          </div>
        )}
      </div>

      {pdfUrl && !loading && !error && (
        <div className="rpv-footer">
          <div className="rpv-page-nav">
            <button className="rpv-icon-btn" style={{ width: 24, height: 24 }} onClick={goPrevPage} disabled={page <= 1} title="Previous page">
              <ChevronLeft size={13} />
            </button>
            <input
              className="rpv-page-nav-input"
              value={page}
              onChange={(e) => {
                const v = Number(e.target.value.replace(/\D/g, '')) || 1;
                setPage(pageCount ? Math.min(pageCount, Math.max(1, v)) : Math.max(1, v));
              }}
            />
            <span>/ {pageCount ?? '—'}</span>
            <button className="rpv-icon-btn" style={{ width: 24, height: 24 }} onClick={goNextPage} disabled={pageCount ? page >= pageCount : false} title="Next page">
              <ChevronRight size={13} />
            </button>
          </div>
          <div className="rpv-footer-sep" />
          <div className="rpv-kbd">
            <span><kbd>Esc</kbd> Back</span>
            <span><kbd>Ctrl</kbd>+<kbd>P</kbd> Print</span>
            <span><kbd>R</kbd> Regenerate</span>
            <span><kbd>Ctrl</kbd>+<kbd>+/-</kbd> Zoom</span>
          </div>
        </div>
      )}

      {emailModalOpen && (
        <div className="rpv-modal-backdrop" onClick={() => !emailSending && setEmailModalOpen(false)}>
          <div className="rpv-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Email document</h3>
            <input
              type="email"
              className="rpv-modal-input"
              placeholder="recipient@company.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
            />
            <textarea
              className="rpv-modal-textarea"
              placeholder="Message (optional)"
              value={emailMsg}
              onChange={(e) => setEmailMsg(e.target.value)}
              rows={3}
            />
            {emailError && <div className="rpv-modal-msg error">{emailError}</div>}
            {emailSent && <div className="rpv-modal-msg success"><Check size={13} /> Email sent successfully</div>}
            <div className="rpv-modal-actions">
              <button className="rpv-btn-ghost" onClick={() => setEmailModalOpen(false)} disabled={emailSending}>Cancel</button>
              <button className="rpv-btn-primary" disabled={!emailTo || emailSending} onClick={handleSendEmail}>
                {emailSending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ERPPrintPreview;

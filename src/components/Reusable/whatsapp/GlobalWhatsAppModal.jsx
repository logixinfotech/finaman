import React, { useState, useEffect } from "react";
import { MessageSquare, Send, X, Copy, Check, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { sendGlobalWhatsApp } from "../../../utils/whatsappApi";
import { showToast } from "../alert";

/**
 * GlobalWhatsAppModal - Reusable modal for dispatching WhatsApp messages from any ERP module.
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {string} recipientName
 * @param {string} recipientPhone
 * @param {string} moduleName - e.g. 'Recruitment', 'HRMS', 'Sales', 'Accounts'
 * @param {string} defaultMessage
 * @param {Array} templates - Optional array of { template_id, template_name, body_text }
 * @param {Object} variables - Dictionary of values for placeholders like {{name}}, {{date}}
 * @param {string|number} referenceId
 * @param {string} referenceType
 * @param {function} onSent
 */
export default function GlobalWhatsAppModal({
  isOpen,
  onClose,
  recipientName = "",
  recipientPhone = "",
  moduleName = "General",
  defaultMessage = "",
  templates = [],
  variables = {},
  referenceId = null,
  referenceType = null,
  onSent,
}) {
  const [phone, setPhone] = useState(recipientPhone);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhone(recipientPhone || "");
      setMessage(defaultMessage || "");
      setSelectedTemplateId("");
      setCopied(false);
    }
  }, [isOpen, recipientPhone, defaultMessage]);

  if (!isOpen) return null;

  const handleTemplateChange = (tmplId) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.template_id === tmplId || t.template_code === tmplId);
    if (tmpl) {
      let resolved = tmpl.body_text || tmpl.body || "";
      Object.keys(variables).forEach((k) => {
        const val = variables[k] !== undefined && variables[k] !== null ? String(variables[k]) : "";
        const regDouble = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "gi");
        const regSingle = new RegExp(`\\{\\s*${k}\\s*\\}`, "gi");
        resolved = resolved.replace(regDouble, val).replace(regSingle, val);
      });
      setMessage(resolved);
    }
  };

  const handleSend = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast({ icon: "warning", title: "Please enter a valid phone number" });
      return;
    }
    if (!message.trim()) {
      showToast({ icon: "warning", title: "Message cannot be empty" });
      return;
    }

    try {
      setSending(true);
      const res = await sendGlobalWhatsApp({
        module_name: moduleName,
        recipient_name: recipientName,
        recipient_phone: cleanPhone,
        template_id: selectedTemplateId || null,
        custom_message: message,
        reference_id: referenceId,
        reference_type: referenceType,
      });

      if (res?.success) {
        showToast({ icon: "success", title: "WhatsApp logged successfully" });
        if (res.data?.whatsapp_url) {
          window.open(res.data.whatsapp_url, "_blank", "noopener,noreferrer");
        }
        onSent?.(res.data);
        onClose();
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to process WhatsApp" });
      }
    } catch (err) {
      showToast({ icon: "error", title: err.message || "Failed to dispatch message" });
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast({ icon: "success", title: "Message copied to clipboard" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center">
              <MessageSquare size={16} className="text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider">Send WhatsApp Message</h2>
              <p className="text-[10.5px] text-emerald-100/80">
                {moduleName} · {recipientName || "Recipient"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Recipient Number */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Recipient Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full h-8 px-3 text-xs bg-slate-50 border border-slate-300 rounded-md font-mono focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            />
          </div>

          {/* Template Selector */}
          {templates && templates.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Message Template</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
              >
                <option value="">Select a template or write custom message...</option>
                {templates.map((t) => (
                  <option key={t.template_id || t.template_code} value={t.template_id || t.template_code}>
                    {t.template_name || t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message Content & Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Message Content
              </label>
              <button
                type="button"
                onClick={copyToClipboard}
                className="text-[10.5px] text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy Text"}
              </button>
            </div>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none resize-none font-sans leading-relaxed"
            />
          </div>

          {/* WhatsApp Chat Preview Bubble */}
          <div className="bg-[#efeae2] p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
              Live WhatsApp Bubble Preview
            </span>
            <div className="bg-white rounded-lg p-2.5 shadow-xs border border-emerald-100 max-w-[90%] ml-auto text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {message || <span className="text-slate-400 italic">Preview appears here...</span>}
              <div className="text-[9px] text-slate-400 text-right mt-1">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ✓✓
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={handleSend}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
          >
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Open & Send on WhatsApp
            <ExternalLink size={11} className="opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
}

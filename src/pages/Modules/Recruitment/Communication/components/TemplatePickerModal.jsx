import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  FileText,
  Mail,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Tag,
  ArrowRight,
} from "lucide-react";

export default function TemplatePickerModal({
  isOpen,
  onClose,
  channel = "Email", // "Email" or "WhatsApp"
  templates = [],
  onSelectTemplate,
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [previewTemplateId, setPreviewTemplateId] = useState(null);

  const filteredTemplates = useMemo(() => {
    let list = Array.isArray(templates) ? templates : [];
    // Filter by channel if template has a channel field
    list = list.filter((t) => !t.channel || t.channel.toLowerCase() === channel.toLowerCase());

    if (selectedCategory !== "All") {
      list = list.filter((t) => (t.category || "General").toLowerCase() === selectedCategory.toLowerCase());
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.template_name || "").toLowerCase().includes(q) ||
          (t.subject || "").toLowerCase().includes(q) ||
          (t.body_text || t.template_body || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [templates, channel, selectedCategory, search]);

  const categories = useMemo(() => {
    const cats = new Set(["All"]);
    (templates || []).forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats);
  }, [templates]);

  const activePreview = useMemo(() => {
    if (previewTemplateId) {
      const found = filteredTemplates.find((t) => t.template_id === previewTemplateId);
      if (found) return found;
    }
    return filteredTemplates[0] || null;
  }, [previewTemplateId, filteredTemplates]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              channel === "Email" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {channel === "Email" ? <Mail size={18} /> : <MessageSquare size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Choose {channel} Template
              </h3>
              <p className="text-[11px] text-slate-500">
                Select a pre-approved template with dynamic placeholder tokens
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${channel.toLowerCase()} templates...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-slate-800 text-white shadow-2xs font-semibold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Two-pane layout (List on left, Live Preview on right) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left: Template Cards List */}
          <div className="md:col-span-5 border-r border-slate-200 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((t) => {
                const isSelected = activePreview?.template_id === t.template_id;
                return (
                  <div
                    key={t.template_id || t.template_code}
                    onClick={() => setPreviewTemplateId(t.template_id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-white border-blue-500 shadow-sm ring-1 ring-blue-500/20"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-xs text-slate-800 truncate">
                        {t.template_name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {t.category || "General"}
                      </span>
                    </div>
                    {t.subject && (
                      <p className="text-[11px] text-blue-700 font-medium truncate mb-1">
                        Sub: {t.subject}
                      </p>
                    )}
                    <p className="text-[10.5px] text-slate-500 line-clamp-2">
                      {t.body_text || t.template_body}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <FileText size={32} className="mx-auto mb-2 opacity-40" />
                <p>No templates found.</p>
              </div>
            )}
          </div>

          {/* Right: Selected Template Preview & Confirmation */}
          <div className="md:col-span-7 flex flex-col h-full overflow-hidden bg-white p-4">
            {activePreview ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">
                      {activePreview.template_name}
                    </h4>
                    <span className="text-[10.5px] text-slate-400">
                      Code: {activePreview.template_code || "N/A"} · Category: {activePreview.category || "General"}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Ready to Use
                  </span>
                </div>

                {activePreview.subject && (
                  <div className="mb-3 p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                    <span className="font-bold text-slate-600">Subject: </span>
                    <span className="text-slate-800 font-medium">{activePreview.subject}</span>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto bg-slate-50/60 p-3.5 rounded-lg border border-slate-200 font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {activePreview.body_text || activePreview.template_body}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-[10.5px] text-slate-400 flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-500" />
                    <span>Dynamic tokens like <code className="text-blue-600 bg-blue-50 px-1 rounded">&#123;&#123;candidate_name&#125;&#125;</code> will auto-populate.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTemplate(activePreview);
                      onClose();
                    }}
                    className={`h-8 px-4 text-xs font-bold text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      channel === "Email" ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    <span>Use This Template</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                Select a template from the left list to preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

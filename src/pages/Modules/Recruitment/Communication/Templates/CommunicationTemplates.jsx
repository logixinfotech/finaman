import React, { useState, useEffect, useCallback, useMemo } from "react";
import ERPHeader from "../../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../../components/Reusable/form/FooterForm";
import SectionCard, { FormField, formInputClass } from "../../../../../components/Reusable/form/SectionCard";
import Table from "../../../../../components/Reusable/table/Table";
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode";
import { showToast, confirmDelete, alertError } from "../../../../../components/Reusable/alert";
import {
  getCommunicationTemplates,
  saveCommunicationTemplate,
  deleteCommunicationTemplate,
} from "../../../../../utils/communicationApi";
import { FileText, MessageSquare, Mail, Smartphone, Edit2, Code2, Sparkles } from "lucide-react";

const initialTemplateState = {
  template_id: null,
  template_code: "",
  template_name: "",
  channel: "WhatsApp",
  category: "General",
  subject: "",
  template_body: "",
  is_active: 1,
};

const CHANNELS = ["WhatsApp", "Email", "SMS"];
const CATEGORIES = ["Sourcing", "Assessment", "Interview", "Offer", "Rejection", "General"];

const PLACEHOLDERS = [
  { tag: "{{candidate_name}}", desc: "Candidate Full Name" },
  { tag: "{{job_title}}", desc: "Vacancy Designation" },
  { tag: "{{company_name}}", desc: "Company Name" },
  { tag: "{{assessment_url}}", desc: "Online Assessment URL" },
  { tag: "{{interview_datetime}}", desc: "Interview Date & Time" },
  { tag: "{{recruiter_name}}", desc: "Assigned Recruiter" },
];

const normalizeTemplate = (t) => {
  if (!t) return initialTemplateState;
  const body = t.template_body || t.body_text || "";
  return {
    ...t,
    template_body: body,
    body_text: body,
  };
};

// `embedded`: rendered inside CommunicationPage, which owns the ERPHeader. The Entry/Search tab then
// comes from `headerTab` and the mode chip / record navigation are published through `onHeaderMeta`.
export default function CommunicationTemplates({ tab, embedded = false, headerTab, onHeaderTabChange, onHeaderMeta }) {
  const [localHeaderTab, setLocalHeaderTab] = useState("entry");
  const activeHeaderTab = embedded ? headerTab || "entry" : localHeaderTab;
  const setActiveHeaderTab = useCallback(
    (v) => (embedded ? onHeaderTabChange?.(v) : setLocalHeaderTab(v)),
    [embedded, onHeaderTabChange]
  );
  const [templates, setTemplates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Load Templates ──────────────────────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCommunicationTemplates();
      const list = (res?.data || []).map(normalizeTemplate);
      setTemplates(list);
      return list;
    } catch (err) {
      showToast({ icon: "error", title: "Failed to load templates" });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ── useERPMode Hook ─────────────────────────────────────────────────────────
  const {
    mode,
    setMode,
    formData,
    setFormData,
    saving,
    handleAdd: hookHandleAdd,
    handleModify: hookHandleModify,
    rights,
  } = useERPMode(
    initialTemplateState,
    async () => {},
    loadTemplates,
    tab?.appl_name || "CommunicationTemplates"
  );

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  const effectiveRights = useMemo(() => {
    if (rights && (rights.add || rights.mod || rights.del)) return rights;
    return { add: 1, mod: 1, del: 1, print: 1 };
  }, [rights]);

  // Initial Load
  useEffect(() => {
    (async () => {
      const list = await loadTemplates();
      if (list.length > 0) {
        setFormData(normalizeTemplate(list[0]));
        setCurrentIndex(0);
      }
    })();
  }, [loadTemplates, setFormData]);

  // ── Select Template by Index ────────────────────────────────────────────────
  const selectTemplateByIndex = useCallback(
    (idx) => {
      if (idx < 0 || idx >= templates.length) return;
      const t = normalizeTemplate(templates[idx]);
      setCurrentIndex(idx);
      setFormData(t);
      setMode("view");
      setErrors({});
      setActiveHeaderTab("entry");
    },
    [templates, setFormData, setMode, setActiveHeaderTab]
  );

  // ── Select Template directly from Search Table ───────────────────────────────
  const handleSelectTemplate = useCallback(
    (item) => {
      const normalized = normalizeTemplate(item);
      const idx = templates.findIndex((t) => t.template_id === normalized.template_id);
      if (idx !== -1) {
        selectTemplateByIndex(idx);
      } else {
        setFormData(normalized);
        setMode("view");
        setErrors({});
        setActiveHeaderTab("entry");
      }
    },
    [templates, selectTemplateByIndex, setFormData, setMode, setActiveHeaderTab]
  );

  // ── Add New Entry ───────────────────────────────────────────────────────────
  const handleNewEntry = useCallback(() => {
    setErrors({});
    setActiveHeaderTab("entry");
    setMode("add");
    setFormData({
      ...initialTemplateState,
      template_code: `TMP_${Date.now().toString().slice(-4)}`,
    });
  }, [setFormData, setMode, setActiveHeaderTab]);

  // ── Modify Handler ──────────────────────────────────────────────────────────
  const handleModify = useCallback(() => {
    setErrors({});
    setMode("edit");
  }, [setMode]);

  // ── Save Handler ────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const errs = {};
    if (!formData.template_name?.trim()) errs.template_name = "Template Name is required";
    const body = (formData.template_body || formData.body_text || "").trim();
    if (!body) errs.template_body = "Message Body is required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast({ icon: "warning", title: "Please fill required fields" });
      return;
    }

    try {
      const payload = {
        ...formData,
        body_text: body,
        template_body: body,
      };
      const res = await saveCommunicationTemplate(payload);
      if (res?.success) {
        showToast({ icon: "success", title: "Template saved successfully" });
        const list = await loadTemplates();
        const saved = list.find((t) => t.template_id === res.template_id || t.template_code === formData.template_code) || list[0];
        if (saved) {
          setFormData(normalizeTemplate(saved));
          setCurrentIndex(list.indexOf(saved));
        }
        setMode("view");
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to save template" });
      }
    } catch (err) {
      showToast({ icon: "error", title: "Error saving template" });
    }
  }, [formData, loadTemplates, setFormData, setMode]);

  // ── Delete Handler ──────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!formData.template_id) return;
    const ok = await confirmDelete("Delete Template", "Are you sure you want to delete this template?");
    if (!ok) return;
    try {
      const res = await deleteCommunicationTemplate(formData.template_id);
      if (res?.success) {
        showToast({ icon: "success", title: "Template deleted successfully" });
        const list = await loadTemplates();
        if (list.length > 0) {
          const nextIdx = Math.min(currentIndex, list.length - 1);
          setFormData(normalizeTemplate(list[nextIdx]));
          setCurrentIndex(nextIdx);
        } else {
          setFormData(initialTemplateState);
          setMode("add");
        }
        setMode("view");
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to delete template" });
      }
    } catch (err) {
      showToast({ icon: "error", title: "Error deleting template" });
    }
  }, [formData.template_id, currentIndex, loadTemplates, setFormData, setMode]);

  // ── Cancel / Discard Handler ────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    setErrors({});
    setMode("view");
    if (templates.length > 0) {
      setFormData(normalizeTemplate(templates[currentIndex] || templates[0]));
    } else {
      setFormData(initialTemplateState);
    }
  }, [templates, currentIndex, setFormData, setMode]);

  const handleInsertTag = (tag) => {
    if (isViewMode) return;
    setFormData((prev) => {
      const current = prev.template_body || prev.body_text || "";
      const updated = current + tag;
      return {
        ...prev,
        template_body: updated,
        body_text: updated,
      };
    });
  };

  // ── Search Columns for Reusable Table (Standard Single-Line Format) ────────
  const searchColumns = useMemo(
    () => [
      {
        key: "template_code",
        label: "Template Code",
        width: 140,
        render: (row) => (
          <span className="font-mono font-semibold text-blue-700 hover:underline cursor-pointer">
            {row.template_code || "—"}
          </span>
        ),
      },
      {
        key: "template_name",
        label: "Template Name",
        width: 250,
        render: (row) => (
          <span className="font-medium text-slate-800 truncate block" title={row.template_name || ""}>
            {row.template_name || "—"}
          </span>
        ),
      },
      {
        key: "channel",
        label: "Channel",
        width: 120,
        render: (row) => {
          const ch = row.channel || "WhatsApp";
          let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
          let Icon = MessageSquare;
          if (ch === "Email") {
            badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
            Icon = Mail;
          } else if (ch === "SMS") {
            badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
            Icon = Smartphone;
          }

          return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeColor}`}>
              <Icon size={11} />
              <span>{ch}</span>
            </span>
          );
        },
      },
      {
        key: "category",
        label: "Category",
        width: 130,
        render: (row) => (
          <span className="text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded inline-block">
            {row.category || "General"}
          </span>
        ),
      },
      {
        key: "subject",
        label: "Email Subject",
        width: 200,
        render: (row) => (
          <span className="text-[11px] text-slate-600 truncate block" title={row.subject || ""}>
            {row.subject || <span className="text-slate-400 italic">—</span>}
          </span>
        ),
      },
      {
        key: "body_text",
        label: "Message Body Snippet",
        width: 340,
        render: (row) => {
          const clean = (row.body_text || row.template_body || "").replace(/\r?\n|\r/g, " ").trim();
          return (
            <span className="text-[11px] text-slate-600 truncate block font-sans" title={clean}>
              {clean || <span className="text-slate-400 italic">No content</span>}
            </span>
          );
        },
      },
      {
        key: "is_active",
        label: "Status",
        width: 100,
        render: (row) => {
          const active = row.is_active !== 0 && row.is_active !== false;
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold border ${
              active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
              {active ? "Active" : "Inactive"}
            </span>
          );
        },
      },
    ],
    []
  );

  const searchActions = useCallback(
    (row) => (
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSelectTemplate(row);
          }}
          className="h-[22px] px-2 text-[10.5px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center gap-1 transition-colors"
          title="Open in Entry Form"
        >
          <Edit2 size={11} />
          <span>Edit</span>
        </button>
      </div>
    ),
    [handleSelectTemplate]
  );

  // Embedded: let the page-level header show this master's mode chip and record navigation
  useEffect(() => {
    if (!embedded || !onHeaderMeta) return;
    onHeaderMeta({
      isAddMode,
      isEditMode,
      isViewMode,
      currentIndex: currentIndex + 1,
      totalRecords: templates.length,
      onPrevRecord: () => selectTemplateByIndex(currentIndex - 1),
      onNextRecord: () => selectTemplateByIndex(currentIndex + 1),
    });
  }, [embedded, onHeaderMeta, isAddMode, isEditMode, isViewMode, currentIndex, templates.length, selectTemplateByIndex]);

  return (
    <div className={embedded ? "flex flex-col w-full h-full min-h-0" : "bg-slate-50 min-h-screen flex flex-col"}>
      {!embedded && (
        <ERPHeader
          title="COMMUNICATION TEMPLATES MASTER"
          TitleIcon={FileText}
          activeTab={activeHeaderTab}
          onTabChange={setActiveHeaderTab}
          isAddMode={isAddMode}
          isEditMode={isEditMode}
          isViewMode={isViewMode}
          currentIndex={currentIndex + 1}
          totalRecords={templates.length}
          onPrevRecord={() => selectTemplateByIndex(currentIndex - 1)}
          onNextRecord={() => selectTemplateByIndex(currentIndex + 1)}
        />
      )}

      {/* Main Body */}
      <div className={`flex-1 w-full space-y-3 ${embedded ? "min-h-0 overflow-y-auto" : "p-3.5 max-w-7xl mx-auto"}`}>
        {activeHeaderTab === "entry" ? (
          <div className="space-y-3">
            {/* Section 1: Template Metadata */}
            <SectionCard
              title="TEMPLATE CONFIGURATION"
              icon={<FileText className="w-3.5 h-3.5 text-blue-600" />}
              theme="blue"
              bodyClassName="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3"
            >
              <FormField label="Template Code" required>
                <input
                  type="text"
                  disabled
                  value={formData.template_code || ""}
                  className={`${formInputClass(true, false)} font-mono !text-xs`}
                />
              </FormField>

              <FormField label="Channel" required>
                <select
                  disabled={isViewMode}
                  value={formData.channel || "WhatsApp"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, channel: e.target.value }))}
                  className={`${formInputClass(isViewMode, false)} !text-xs`}
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Category">
                <select
                  disabled={isViewMode}
                  value={formData.category || "General"}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className={`${formInputClass(isViewMode, false)} !text-xs`}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Template Name" required error={errors.template_name}>
                  <input
                    type="text"
                    disabled={isViewMode}
                    value={formData.template_name || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, template_name: e.target.value }))}
                    placeholder="e.g. Assessment Link Dispatch (WhatsApp)"
                    className={`${formInputClass(isViewMode, !!errors.template_name)} !text-xs`}
                  />
                </FormField>
              </div>

              {formData.channel === "Email" && (
                <div>
                  <FormField label="Email Subject">
                    <input
                      type="text"
                      disabled={isViewMode}
                      value={formData.subject || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g. Next Steps in your Application"
                      className={`${formInputClass(isViewMode, false)} !text-xs`}
                    />
                  </FormField>
                </div>
              )}
            </SectionCard>

            {/* Section 2: Message Content & Placeholders */}
            <SectionCard
              title="MESSAGE BODY & DYNAMIC SYSTEM PLACEHOLDERS"
              icon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
              theme="indigo"
              bodyClassName="p-3 space-y-3"
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Click to Insert Dynamic Placeholders:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PLACEHOLDERS.map((p) => (
                    <button
                      key={p.tag}
                      type="button"
                      disabled={isViewMode}
                      onClick={() => handleInsertTag(p.tag)}
                      className="px-2 py-1 text-[11px] font-mono bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 border border-indigo-200 rounded transition-colors"
                      title={p.desc}
                    >
                      {p.tag}
                    </button>
                  ))}
                </div>
              </div>

              <FormField label="Template Content / Message Body" required error={errors.template_body}>
                <textarea
                  rows={7}
                  disabled={isViewMode}
                  value={formData.template_body || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, template_body: e.target.value }))}
                  placeholder="Dear {{candidate_name}}, thank you for your application for {{job_title}}..."
                  className={`${formInputClass(isViewMode, !!errors.template_body)} !h-auto py-2 !text-xs`}
                />
              </FormField>
            </SectionCard>
          </div>
        ) : (
          /* Search View using Reusable Table */
          <Table
            title="COMMUNICATION TEMPLATES"
            TitleIcon={FileText}
            columns={searchColumns}
            data={Array.isArray(templates) ? templates : []}
            rowKey="template_id"
            loading={loading}
            actions={searchActions}
            onRowClick={handleSelectTemplate}
            onRefresh={loadTemplates}
            onAdd={handleNewEntry}
            activeTab="search"
            isHidden={embedded}
            onTabChange={(tabKey) => {
              if (tabKey === "entry") handleNewEntry();
            }}
          />
        )}
      </div>

      {/* Reusable ERP Footer */}
      {activeHeaderTab === "entry" && (
        <ERPFooter
          isAddMode={isAddMode}
          isEditMode={isEditMode}
          isViewMode={isViewMode}
          saving={saving}
          handleSubmit={handleSave}
          onModify={handleModify}
          onDelete={formData?.template_id ? handleDelete : null}
          onCancel={handleCancel}
          onEditCancel={handleCancel}
          onNewEntry={handleNewEntry}
          rights={effectiveRights}
          formData={{ ...formData, Id: formData.template_id }}
        />
      )}
    </div>
  );
}

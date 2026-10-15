import React, { useEffect, useState, useCallback } from "react";
import Table from "../../../../components/Reusable/table/Table";
import CandidateRegistrationForm from "./CandidateRegistrationForm";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import {
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  importCandidatesExcel,
  getActiveVacanciesWithJD,
} from "../../../../utils/recruitmentApi";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import config from "../../../../config";
import * as XLSX from "xlsx";
import {
  UserCheck,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

const PIPELINE_STATUS_COLORS = {
  "Raw Data": "bg-slate-100 text-slate-700 border-slate-300",
  "Applied": "bg-blue-100 text-blue-700 border-blue-300",
  "Screening": "bg-amber-100 text-amber-700 border-amber-300",
  "Shortlisted": "bg-indigo-100 text-indigo-700 border-indigo-300",
  "Interview Scheduled": "bg-purple-100 text-purple-700 border-purple-300",
  "Selected": "bg-teal-100 text-teal-700 border-teal-300",
  "Offered": "bg-emerald-100 text-emerald-700 border-emerald-300",
  "Hired": "bg-green-100 text-green-800 border-green-400 font-bold",
  "Rejected": "bg-rose-100 text-rose-700 border-rose-300",
  "On Hold": "bg-orange-100 text-orange-700 border-orange-300",
};

const initialState = {
  candidate_code: "",
  full_name: "",
  mobile: "",
  email: "",
  vacancy_id: "",
  vacancy_no: "",
  job_title: "",
  entry_channel: "InternalHR",
  source_channel: "Direct",
  referral_employee_id: "",
  referral_employee_name: "",
  pipeline_status: "Raw Data",
  candidate_status: "Active",
  current_location: "",
  total_experience_years: "",
  current_ctc: "",
  expected_ctc: "",
  notice_period_days: "",
  resume_file_name: "",
  resume_file_path: "",
  hr_remarks: "",
  status_history: [],
};

export default function CandidateRegistration({ tab }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [vacanciesList, setVacanciesList] = useState([]);

  // Excel Bulk Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const {
    mode,
    setMode,
    formData,
    setFormData,
    showForm,
    setShowForm,
    saving,
    handleEditCancel,
    handleView,
    handleAdd,
    handleModify,
    performSave,
    rights,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      const { _formDataInstance, ...record } = data;
      const payload = _formDataInstance || record;
      const res = isEdit
        ? await updateCandidate(record.candidate_id, payload)
        : await createCandidate(payload);
      // API only returns id/code — merge so the view shows the full saved record
      return res?.success ? { ...res, data: { ...record, ...(res.data || {}) } } : res;
    },
    () => loadList(),
    tab?.appl_name || "CandidateRegistration"
  );

  // Load Vacancies for dropdown mapping
  const loadVacancies = useCallback(async () => {
    try {
      const res = await getActiveVacanciesWithJD();
      if (res?.data) {
        setVacanciesList(res.data);
      }
    } catch (err) {
      console.error("Error loading vacancies:", err);
    }
  }, []);

  // Load Candidate List
  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCandidates();
      setList(res?.data || []);
    } catch (err) {
      console.error("Failed to load candidates:", err);
      showToast({ icon: "error", title: "Failed to load candidates." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVacancies();
  }, [loadVacancies]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Record Navigation
  const navigateRecord = useCallback(
    (direction) => {
      if (!list.length) return;
      let newIdx = currentIndex;
      if (direction === "first") newIdx = 0;
      else if (direction === "prev") newIdx = Math.max(0, currentIndex - 1);
      else if (direction === "next") newIdx = Math.min(list.length - 1, currentIndex + 1);
      else if (direction === "last") newIdx = list.length - 1;

      setCurrentIndex(newIdx);
      handleView(list[newIdx]);
    },
    [list, currentIndex, handleView]
  );

  // Keyboard shortcuts
  useEffect(() => {
    setERPHandlers({
      onAdd: () => handleAdd(initialState),
      onModify: () => {
        if (showForm && mode === "view") handleModify();
        else if (!showForm && list[currentIndex]) {
          handleView(list[currentIndex]);
          handleModify();
        }
      },
      onSave: () => {
        if (showForm && (mode === "add" || mode === "edit") && formData?.vacancy_id) performSave();
      },
      onCancel: () => {
        if (showForm) handleCancelForm();
      },
      onDelete: () => {
        if (showForm && mode === "view" && formData?.candidate_id) {
          handleDelete(formData);
        }
      },
      onPrev: () => navigateRecord("prev"),
      onNext: () => navigateRecord("next"),
      onFirst: () => navigateRecord("first"),
      onLast: () => navigateRecord("last"),
    });

    return () => setERPHandlers({});
  }, [
    showForm,
    mode,
    formData,
    list,
    currentIndex,
    handleAdd,
    handleModify,
    performSave,
    handleEditCancel,
    setShowForm,
    navigateRecord,
  ]);

  const handleRowClick = (row) => {
    const idx = list.findIndex((c) => c.candidate_id === row.candidate_id);
    setCurrentIndex(idx >= 0 ? idx : 0);
    handleView(row);
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete candidate "${row.candidate_code}"?`,
      text: `Are you sure you want to remove candidate record ${row.full_name || row.candidate_code}?`,
    });
    if (!confirmed) return;

    try {
      await deleteCandidate(row.candidate_id);
      showToast({ icon: "success", title: "Candidate deleted successfully." });
      setShowForm(false);
      loadList();
    } catch (err) {
      showToast({ icon: "error", title: err.message || "Failed to delete candidate." });
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.candidate_id : item
    );
    if (ids.length === 0) return;
    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} candidate(s)?`,
      text: `Are you sure you want to delete ${ids.length} candidate record(s)?`,
    });
    if (!confirmed) return;
    try {
      const results = await Promise.all(ids.map((id) => deleteCandidate(id)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted successfully.` });
      } else {
        showToast({
          icon: "warning",
          title: `${ids.length - failed} deleted, ${failed} failed`,
        });
      }
      loadList();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete candidates");
    }
  };

  const handleSaveForm = async (dataToSave, resumeFile) => {
    const saveData = { ...dataToSave };
    if (resumeFile) {
      const payload = new FormData();
      payload.append("resume", resumeFile);
      Object.keys(saveData).forEach((key) => {
        if (saveData[key] !== null && saveData[key] !== undefined && key !== "status_history" && key !== "_formDataInstance") {
          payload.append(key, saveData[key]);
        }
      });
      saveData._formDataInstance = payload;
    }
    // performSave(idField, overrideData) — data must go in the second argument
    const result = await performSave(null, saveData);
    if (result?.success) loadList();
  };

  // Parse and preview chosen Excel file
  const handleFileChange = (file) => {
    if (!file) {
      setImportFile(null);
      setPreviewRows([]);
      setImportResult(null);
      return;
    }
    setImportFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const sheetName = wb.SheetNames[0];
        if (!sheetName) {
          setPreviewRows([]);
          return;
        }
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

        const mapped = data
          .map((row, idx) => {
            let mobile = (row["Mobile Number"] || row["Mobile"] || row["Phone"] || row["Contact"] || "").toString().trim();
            if (mobile.endsWith(".0")) mobile = mobile.replace(/\.0$/, "");
            const name = (row["Full Name"] || row["Name"] || row["Candidate Name"] || "").toString().trim();
            const email = (row["Email"] || row["Email Address"] || "").toString().trim();
            const vac = (row["Vacancy ID"] || row["Vacancy_Id"] || row["Vacancy Id"] || row["Vacancy No"] || row["Vacancy"] || row["Job Code"] || "").toString().trim();
            const source = (row["Source Channel"] || row["Source"] || "Excel Import").toString().trim();
            const location = (row["Current Location"] || row["Location"] || row["City"] || "").toString().trim();
            const exp = row["Experience (Years)"] || row["Experience"] || "";
            const cCtc = row["Current CTC"] || "";
            const eCtc = row["Expected CTC"] || "";
            const np = row["Notice Period (Days)"] || row["Notice Period"] || "";
            const remarks = (row["HR Remarks"] || row["Remarks"] || "").toString().trim();

            const isValid = Boolean(name || mobile || email);
            return {
              _idx: idx + 1,
              name,
              mobile,
              email,
              vacancy: vac,
              source,
              location,
              exp,
              cCtc,
              eCtc,
              np,
              remarks,
              isValid,
            };
          })
          .filter((r) => r.isValid);

        setPreviewRows(mapped);
      } catch (err) {
        console.error("Error reading Excel preview:", err);
        setPreviewRows([]);
        showToast({ icon: "error", title: "Could not parse Excel preview" });
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle Excel Bulk Import
  const handleImportSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!importFile) {
      alertError("Please select an Excel file (.xlsx / .xls)");
      return;
    }

    setImporting(true);
    setImportResult(null);
    try {
      const data = new FormData();
      data.append("file", importFile);
      const res = await importCandidatesExcel(data);
      setImportResult({
        success: true,
        message: res.message || `Successfully imported ${res.imported_count || 0} candidates!`,
        count: res.imported_count,
        errors: res.errors,
      });
      showToast({ icon: "success", title: res.message || "Import completed!" });
      await loadList();
    } catch (err) {
      setImportResult({
        success: false,
        message: err.message || "Failed to import Excel sheet",
      });
      alertError(err.message || "Failed to import Excel sheet");
    } finally {
      setImporting(false);
    }
  };

  // Download Excel Import Template (Direct client-side generation + server fallback)
  const handleDownloadTemplate = () => {
    try {
      const sampleVacancyNo = vacanciesList[0]?.vacancy_no || "VAC-2026-0001";
      const sampleData = [
        {
          "Full Name": "Rahul Sharma",
          "Mobile Number": "9876543210",
          "Email": "rahul.sharma@example.com",
          "Vacancy ID": sampleVacancyNo,
          "Source Channel": "LinkedIn",
          "Current Location": "New Delhi",
          "Experience (Years)": 3.5,
          "Current CTC": 450000,
          "Expected CTC": 600000,
          "Notice Period (Days)": 30,
          "HR Remarks": "Sourced via LinkedIn Recruiter. Strong profile.",
        },
        {
          "Full Name": "Pooja Verma",
          "Mobile Number": "9812345678",
          "Email": "pooja.v@example.com",
          "Vacancy ID": "",
          "Source Channel": "Naukri",
          "Current Location": "Gurugram",
          "Experience (Years)": 2.0,
          "Current CTC": 350000,
          "Expected CTC": 480000,
          "Notice Period (Days)": 15,
          "HR Remarks": "Immediate joiner from portal dump.",
        },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sampleData);
      ws["!cols"] = [
        { wch: 18 }, // Full Name
        { wch: 15 }, // Mobile Number
        { wch: 25 }, // Email
        { wch: 18 }, // Vacancy ID
        { wch: 15 }, // Source Channel
        { wch: 16 }, // Current Location
        { wch: 18 }, // Experience (Years)
        { wch: 14 }, // Current CTC
        { wch: 14 }, // Expected CTC
        { wch: 20 }, // Notice Period (Days)
        { wch: 35 }, // HR Remarks
      ];
      XLSX.utils.book_append_sheet(wb, ws, "Candidates");
      XLSX.writeFile(wb, "Candidate_Import_Template.xlsx");
      showToast({ icon: "success", title: "Template downloaded successfully!" });
    } catch (err) {
      console.error("Error generating template:", err);
      window.open(`${config.apiUrl || ""}/api/recruitment/candidates-template/download`, "_blank");
    }
  };

  // Table Columns — cells inherit line-height = row height, so badges need leading-4 to stay compact
  const columns = [
    {
      key: "candidate_code",
      label: "Candidate Code",
      width: 130,
      render: (row) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            const idx = list.findIndex((c) => c.candidate_id === row.candidate_id);
            if (idx !== -1) setCurrentIndex(idx);
            handleView(row);
          }}
          className="font-semibold text-blue-700 hover:underline cursor-pointer"
          title="Click to view candidate"
        >
          {row.candidate_code || "—"}
        </span>
      ),
    },
    {
      key: "full_name",
      label: "Full Name",
      width: 170,
      render: (row) => (
        <span className="font-medium text-slate-800 truncate" title={row.full_name || ""}>
          {row.full_name || "—"}
        </span>
      ),
    },
    {
      key: "mobile",
      label: "Mobile Number",
      width: 130,
      render: (row) => row.mobile || "—",
    },
    {
      key: "email",
      label: "Email Address",
      width: 190,
      render: (row) => (
        <span className="truncate" title={row.email || ""}>
          {row.email || "—"}
        </span>
      ),
    },
    {
      key: "current_location",
      label: "Location",
      width: 120,
      render: (row) => row.current_location || "—",
    },
    {
      key: "job_title",
      label: "Applying For / Vacancy",
      width: 200,
      render: (row) => (
        <span className="truncate" title={row.vacancy_no ? `${row.job_title} (${row.vacancy_no})` : ""}>
          {row.job_title || row.designation_name || "General Application"}
        </span>
      ),
    },
    {
      key: "pipeline_status",
      label: "Pipeline Stage",
      width: 140,
      render: (row) => {
        const s = row.pipeline_status || "Raw Data";
        return (
          <span className={`px-2 py-0.5 leading-4 rounded text-[11px] font-medium border ${PIPELINE_STATUS_COLORS[s] || PIPELINE_STATUS_COLORS["Raw Data"]}`}>
            {s}
          </span>
        );
      },
    },
    {
      key: "source_channel",
      label: "Source",
      width: 120,
      render: (row) => row.source_channel || "Direct",
    },
    {
      key: "total_experience_years",
      label: "Experience",
      width: 100,
      render: (row) =>
        row.total_experience_years != null ? `${row.total_experience_years} Yrs` : "—",
    },
    {
      key: "resume_file_path",
      label: "Resume / CV",
      width: 105,
      render: (row) => {
        if (!row.resume_file_path) return <span className="text-slate-400">—</span>;
        return (
          <a
            href={`${config.apiUrl}${row.resume_file_path}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-0.5 leading-4 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            title={row.resume_file_name || "View Resume"}
          >
            <FileText className="w-3 h-3" />
            View
          </a>
        );
      },
    },
    {
      key: "created_at",
      label: "Created Date",
      width: 120,
      render: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          : "—",
    },
  ];

  const handleCancelForm = () => {
    if (mode === "edit") {
      setMode("view");
      if (list[currentIndex]) {
        setFormData(list[currentIndex]);
      }
    } else {
      setShowForm(false);
    }
  };

  if (showForm) {
    return (
      <CandidateRegistrationForm
        mode={mode}
        initialData={formData}
        setFormData={setFormData}
        onSave={handleSaveForm}
        onCancel={handleCancelForm}
        onEditCancel={handleCancelForm}
        onDelete={handleDelete}
        saving={saving}
        onModify={handleModify}
        onNewEntry={() => handleAdd(initialState)}
        currentRecord={list.length > 0 ? currentIndex + 1 : 1}
        totalRecords={list.length || 1}
        rights={rights}
        activeTab="entry"
        onTabChange={(tabKey) => {
          if (tabKey === "search") setShowForm(false);
        }}
        onPrevRecord={() => navigateRecord("prev")}
        onNextRecord={() => navigateRecord("next")}
        vacanciesList={vacanciesList}
      />
    );
  }

  return (
    <div className="bg-slate-50 h-full w-full min-w-0">
      <Table
        title="CANDIDATE REGISTRATION"
        TitleIcon={UserCheck}
        data={list}
        columns={columns}
        rowKey="candidate_id"
        loading={loading}
        onRowDoubleClick={handleRowClick}
        onDeleteMultiple={handleDeleteMultiple}
        onAdd={() => handleAdd(initialState)}
        rights={rights}
        activeTab="search"
        onTabChange={(tabKey) => {
          if (tabKey === "entry") handleAdd(initialState);
        }}
        onRefresh={loadList}
        onImport={() => {
          setImportResult(null);
          setImportFile(null);
          setShowImportModal(true);
        }}
      />

      {/* Excel Bulk Import Modal with Interactive Preview Screen */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] transition-all duration-200 ${previewRows.length > 0 ? "max-w-5xl" : "max-w-lg"
            }`}>
            {/* Modal Header */}
            <div className="bg-[#0f2137] text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Bulk Excel Sourcing Import</h3>
                  <p className="text-[11px] text-slate-300">
                    {previewRows.length > 0
                      ? `Previewing ${previewRows.length} candidate record(s) before importing`
                      : "Upload candidate spreadsheet into 'Raw Data' pipeline"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setPreviewRows([]);
                  setImportResult(null);
                }}
                className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Guidelines banner (when no file selected) */}
              {previewRows.length === 0 && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-blue-900 space-y-1.5">
                    <p className="font-bold text-blue-950 flex items-center gap-1.5">
                      <span>Import Guidelines</span>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-800 leading-relaxed">
                      <li>
                        Imported candidates are automatically tagged with <strong className="font-semibold text-blue-950">'Raw Data'</strong> pipeline status and enrolled into Stage 1 sourcing.
                      </li>
                      <li>
                        Supported Columns: <strong>Full Name, Mobile Number, Email, Vacancy ID, Source Channel, Current Location, Experience (Years), Current CTC, Expected CTC, Notice Period (Days), HR Remarks</strong>.
                      </li>
                      <li>
                        <em>Note: Resumes / CV files are not included in Excel import and can be attached individually after sourcing.</em>
                      </li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">Download Template</span>
                      <span className="text-[11px] text-slate-500">Pre-formatted Excel sheet with 'Vacancy ID' header</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Sample</span>
                    </button>
                  </div>
                </>
              )}

              {/* Upload Dropzone (when no file selected) */}
              {previewRows.length === 0 && (
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 bg-slate-50 rounded-xl p-6 text-center cursor-pointer transition-all group">
                  <input
                    type="file"
                    id="excel-file-input"
                    accept=".xlsx, .xls"
                    onChange={(e) => handleFileChange(e.target.files[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="excel-file-input" className="cursor-pointer block space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-slate-800 text-xs">
                      Click to choose Excel file or drag & drop here
                    </div>
                    <div className="text-[11px] text-slate-400">Supports .xlsx and .xls formats</div>
                  </label>
                </div>
              )}

              {/* ── PREVIEW SCREEN (When Excel rows are parsed) ──────────────── */}
              {previewRows.length > 0 && (
                <div className="space-y-3">
                  {/* File Info & Change File Ribbon */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                        XLS
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-xs block truncate max-w-xs sm:max-w-md" title={importFile?.name}>
                          {importFile?.name || "Uploaded Spreadsheet"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {importFile?.size ? `${(importFile.size / 1024).toFixed(1)} KB · ` : ""}
                          <strong className="text-emerald-700 font-semibold">{previewRows.length} candidates detected</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                        title="Download standard template"
                      >
                        <Download className="w-3 h-3" />
                        <span>Template</span>
                      </button>
                      <label
                        htmlFor="excel-file-reinput"
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                      >
                        <span>Change File</span>
                        <input
                          type="file"
                          id="excel-file-reinput"
                          accept=".xlsx, .xls"
                          onChange={(e) => handleFileChange(e.target.files[0] || null)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* High-density preview table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                    <div className="max-h-72 overflow-x-auto overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 text-[10.5px] uppercase font-bold tracking-wider z-10">
                          <tr>
                            <th className="px-2.5 py-2 w-10 text-center border-r border-slate-200">#</th>
                            <th className="px-3 py-2 border-r border-slate-200 min-w-[140px]">Full Name</th>
                            <th className="px-2.5 py-2 border-r border-slate-200 min-w-[110px]">Mobile</th>
                            <th className="px-2.5 py-2 border-r border-slate-200 min-w-[150px]">Email</th>
                            <th className="px-2.5 py-2 border-r border-slate-200 min-w-[120px]">Vacancy ID</th>
                            <th className="px-2.5 py-2 border-r border-slate-200 min-w-[90px]">Source</th>
                            <th className="px-2.5 py-2 border-r border-slate-200 min-w-[90px]">Location</th>
                            <th className="px-2 py-2 border-r border-slate-200 text-center min-w-[70px]">Exp (Yrs)</th>
                            <th className="px-2 py-2 border-r border-slate-200 text-right min-w-[85px]">Current CTC</th>
                            <th className="px-2 py-2 border-r border-slate-200 text-right min-w-[85px]">Expected CTC</th>
                            <th className="px-2 py-2 border-r border-slate-200 text-center min-w-[75px]">Notice</th>
                            <th className="px-3 py-2 min-w-[140px]">HR Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px] text-slate-800">
                          {previewRows.map((r, i) => (
                            <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                              <td className="px-2.5 py-1.5 text-center font-mono text-slate-400 border-r border-slate-100 font-semibold">
                                {r._idx}
                              </td>
                              <td className="px-3 py-1.5 font-bold text-slate-900 border-r border-slate-100 truncate" title={r.name}>
                                {r.name || <span className="text-rose-400 italic">Missing Name</span>}
                              </td>
                              <td className="px-2.5 py-1.5 font-mono border-r border-slate-100">
                                {r.mobile || <span className="text-slate-400">—</span>}
                              </td>
                              <td className="px-2.5 py-1.5 border-r border-slate-100 truncate" title={r.email}>
                                {r.email || <span className="text-slate-400">—</span>}
                              </td>
                              <td className="px-2.5 py-1.5 border-r border-slate-100">
                                {r.vacancy ? (
                                  <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                                    {r.vacancy}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">General</span>
                                )}
                              </td>
                              <td className="px-2.5 py-1.5 border-r border-slate-100 text-slate-600">
                                {r.source || "Excel"}
                              </td>
                              <td className="px-2.5 py-1.5 border-r border-slate-100 text-slate-600 truncate" title={r.location}>
                                {r.location || "—"}
                              </td>
                              <td className="px-2 py-1.5 border-r border-slate-100 text-center font-semibold">
                                {r.exp != null && r.exp !== "" ? `${r.exp}` : "—"}
                              </td>
                              <td className="px-2 py-1.5 border-r border-slate-100 text-right font-mono text-slate-700">
                                {r.cCtc ? Number(r.cCtc).toLocaleString("en-IN") : "—"}
                              </td>
                              <td className="px-2 py-2 border-r border-slate-100 text-right font-mono text-slate-700">
                                {r.eCtc ? Number(r.eCtc).toLocaleString("en-IN") : "—"}
                              </td>
                              <td className="px-2 py-1.5 border-r border-slate-100 text-center text-slate-600">
                                {r.np ? `${r.np}d` : "—"}
                              </td>
                              <td className="px-3 py-1.5 text-slate-500 truncate" title={r.remarks}>
                                {r.remarks || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      All <strong>{previewRows.length}</strong> candidates will be registered and enrolled into the <strong>'Raw Data - Sourced'</strong> recruitment calling queue.
                    </span>
                  </p>
                </div>
              )}

              {/* Import Result Box */}
              {importResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${importResult.success
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-rose-50 text-rose-900 border-rose-200"
                    }`}
                >
                  {importResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold block text-sm">{importResult.message}</span>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2 text-[11px] space-y-1 max-h-28 overflow-y-auto bg-white/70 p-2 rounded-lg border border-rose-200">
                        <span className="font-bold text-rose-800 block">Row-level notices:</span>
                        {importResult.errors.map((err, idx) => (
                          <p key={idx} className="text-rose-700">• {err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Toolbar */}
            <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setPreviewRows([]);
                  setImportResult(null);
                }}
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {importResult?.success ? "Done" : "Cancel"}
              </button>

              <div className="flex items-center gap-2">
                {previewRows.length > 0 && !importResult?.success && (
                  <button
                    type="button"
                    onClick={() => {
                      setImportFile(null);
                      setPreviewRows([]);
                      setImportResult(null);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
                  >
                    Clear Preview
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={!importFile || importing || importResult?.success}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {importing
                      ? "Importing..."
                      : previewRows.length > 0
                        ? `Import ${previewRows.length} Candidates`
                        : "Upload & Import"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

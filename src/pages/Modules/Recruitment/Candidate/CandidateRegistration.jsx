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

  const handleRowClick = (row, idx) => {
    setCurrentIndex(idx);
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

  // Handle Excel Bulk Import
  const handleImportSubmit = async (e) => {
    e.preventDefault();
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

  // Table Columns — cells inherit line-height = row height, so badges need leading-4 to stay compact
  const columns = [
    {
      key: "candidate_code",
      label: "Candidate Code",
      width: 130,
      render: (row) => (
        <span className="font-semibold text-blue-700 hover:underline cursor-pointer">
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
        onRowClick={handleRowClick}
        onRowDoubleClick={handleRowClick}
        onAdd={() => handleAdd(initialState)}
        onDelete={handleDelete}
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

      {/* Excel Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="bg-[#0f2137] text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm tracking-wide">Bulk Excel Sourcing Import</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white rounded-md p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 space-y-1">
                <p className="font-semibold text-blue-900">Import Guidelines:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-700">
                  <li>Imported candidates are automatically tagged as <strong className="font-semibold text-blue-900">'Raw Data'</strong> pipeline status.</li>
                  <li>Columns: Full Name, Mobile Number, Email, Vacancy No, Source Channel, Location, Experience, CTC, Notice Period, Remarks.</li>
                </ul>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="font-semibold text-slate-800 block">Download Template</span>
                  <span className="text-[11px] text-slate-500">Use this pre-formatted sample Excel file</span>
                </div>
                <a
                  href={`${config.apiUrl}/api/recruitment/candidates-template/download`}
                  download="Candidate_Import_Template.xlsx"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-md text-xs font-semibold shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>

              <form onSubmit={handleImportSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 rounded-lg p-6 text-center cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => setImportFile(e.target.files[0] || null)}
                    className="w-full text-xs"
                  />
                </div>

                {importResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${importResult.success
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                  >
                    {importResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className="font-semibold">{importResult.message}</span>
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-1 text-[10px] space-y-0.5 max-h-20 overflow-y-auto">
                          {importResult.errors.map((err, idx) => (
                            <p key={idx}>• {err}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={!importFile || importing}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{importing ? "Importing..." : "Upload & Import"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

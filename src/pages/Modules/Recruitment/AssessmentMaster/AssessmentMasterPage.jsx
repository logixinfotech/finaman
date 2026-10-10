import React, { useState, useEffect, useCallback, useMemo } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import { showToast, confirmDelete, alertError } from "../../../../components/Reusable/alert";
import {
  getAssessments,
  getAssessmentById,
  getNextAssessmentCode,
  createAssessment,
  updateAssessment,
  deleteAssessment,
} from "../../../../utils/recruitmentApi";
import AssessmentMasterForm from "./AssessmentMasterForm";
import AssessmentMasterSearch from "./AssessmentMasterSearch";
import { Award } from "lucide-react";

const initialAssessmentState = {
  assessment_id: null,
  assessment_code: "",
  assessment_name: "",
  description: "",
  total_questions: 0,
  total_marks: 0,
  passing_marks: 0,
  estimated_duration_minutes: 30,
  instructions: "Please read all questions carefully. You cannot change answers after final submission.",
  shuffle_questions: false,
  allow_backtracking: true,
  status: "Active",
  questions: [],
};

const AssessmentMasterPage = ({ tab }) => {
  const [activeHeaderTab, setActiveHeaderTab] = useState("entry");
  const [assessments, setAssessments] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [questionFiles, setQuestionFiles] = useState({});

  // ── Load Assessments ────────────────────────────────────────────────────────
  const loadAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAssessments();
      const list = res?.data || [];
      setAssessments(list);
      return list;
    } catch (err) {
      console.error("Failed to load assessments:", err);
      showToast({ icon: "error", title: "Failed to load assessments" });
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
    initialAssessmentState,
    async () => {},
    loadAssessments,
    tab?.appl_name || "AssessmentMaster"
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
      const list = await loadAssessments();
      if (list.length > 0) {
        const full = await getAssessmentById(list[0].assessment_id);
        if (full?.data) setFormData(full.data);
        setCurrentIndex(0);
      }
    })();
  }, [loadAssessments, setFormData]);

  // Select Assessment by index
  const selectAssessmentByIndex = useCallback(
    async (idx) => {
      if (idx < 0 || idx >= assessments.length) return;
      const a = assessments[idx];
      setCurrentIndex(idx);
      try {
        setLoading(true);
        const res = await getAssessmentById(a.assessment_id);
        if (res?.data) {
          setFormData(res.data);
          setQuestionFiles({});
          setMode("view");
          setErrors({});
          setActiveHeaderTab("entry");
        }
      } catch (err) {
        alertError("Error", "Could not load assessment details");
      } finally {
        setLoading(false);
      }
    },
    [assessments, setFormData, setMode]
  );

  // ── Header Actions ──────────────────────────────────────────────────────────
  const handleAddNew = async () => {
    try {
      setLoading(true);
      const codeRes = await getNextAssessmentCode();
      const nextCode = codeRes?.data?.assessment_code || "ASM0001";
      setMode("add");
      setFormData({
        ...initialAssessmentState,
        assessment_code: nextCode,
      });
      setQuestionFiles({});
      setErrors({});
      setActiveHeaderTab("entry");
    } catch (err) {
      alertError("Error", "Could not generate assessment code");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!formData?.assessment_id) return;
    // The hook's own rights check ignores this page's fallback rights and blocks
    // Modify, so check effectiveRights here and switch mode directly.
    if (effectiveRights.mod !== 1) {
      alertError("Access Denied", "You do not have MODIFY rights.");
      return;
    }
    setMode("edit");
    setErrors({});
    setActiveHeaderTab("entry");
  };

  const handleSave = async () => {
    const errs = {};
    if (!formData.assessment_name?.trim()) errs.assessment_name = "Assessment title is required";
    if (!formData.questions || formData.questions.length === 0) {
      errs.questions = "Please add at least 1 question to the assessment";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast({ icon: "warning", title: "Please fill all required fields and add questions" });
      return;
    }

    try {
      setLoading(true);

      const hasFiles = Object.keys(questionFiles).length > 0;
      let payload = formData;

      if (hasFiles) {
        const fd = new FormData();
        Object.keys(formData).forEach((k) => {
          if (k === "questions") {
            fd.append("questions", JSON.stringify(formData.questions));
          } else if (formData[k] !== null && formData[k] !== undefined) {
            fd.append(k, formData[k]);
          }
        });
        Object.entries(questionFiles).forEach(([qIdx, file]) => {
          if (file) {
            fd.append(`question_attachment_${qIdx}`, file);
          }
        });
        payload = fd;
      }

      if (isAddMode) {
        const res = await createAssessment(payload);
        showToast({ icon: "success", title: "Assessment created successfully" });
        const list = await loadAssessments();
        if (res?.data?.assessment_id) {
          const created = await getAssessmentById(res.data.assessment_id);
          if (created?.data) setFormData(created.data);
          const newIdx = list.findIndex((a) => a.assessment_id === res.data.assessment_id);
          if (newIdx !== -1) setCurrentIndex(newIdx);
        }
      } else if (isEditMode) {
        await updateAssessment(formData.assessment_id, payload);
        showToast({ icon: "success", title: "Assessment updated successfully" });
        await loadAssessments();
        const updated = await getAssessmentById(formData.assessment_id);
        if (updated?.data) setFormData(updated.data);
      }
      setQuestionFiles({});
      setMode("view");
    } catch (err) {
      alertError("Save Error", err.message || "Failed to save assessment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (aToDelete) => {
    const target = aToDelete || formData;
    if (!target?.assessment_id) return;
    const ok = await confirmDelete(`Delete assessment "${target.assessment_name}"?`);
    if (!ok) return;

    try {
      setLoading(true);
      await deleteAssessment(target.assessment_id);
      showToast({ icon: "success", title: "Assessment deleted" });
      const list = await loadAssessments();
      if (list.length > 0) {
        selectAssessmentByIndex(0);
      } else {
        setFormData(initialAssessmentState);
      }
    } catch (err) {
      alertError("Delete Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setMode("view");
    setErrors({});
    setQuestionFiles({});
    if (assessments.length > 0 && currentIndex >= 0) {
      selectAssessmentByIndex(currentIndex);
    }
  };

  const handleDeleteMultiple = async (selectedRows) => {
    const ids = (selectedRows || []).map((row) =>
      typeof row === "object" ? row.assessment_id : row
    );
    if (ids.length === 0) return;

    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} selected assessment(s)?`,
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      await Promise.all(ids.map((id) => deleteAssessment(id)));
      showToast({ icon: "success", title: `${ids.length} assessment(s) deleted` });
      await loadAssessments();
    } catch (err) {
      alertError("Delete Error", "Failed to delete selected assessments");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssessment = (a) => {
    const idx = assessments.findIndex((item) => item.assessment_id === a.assessment_id);
    if (idx !== -1) {
      selectAssessmentByIndex(idx);
    }
  };

  return (
    <div className="h-full w-full">
      {activeHeaderTab === "entry" ? (
        <div className="h-full flex flex-col overflow-hidden bg-slate-100">
          {/* ── Standard ERP Header ── */}
          <ERPHeader
            title="Assessment Master"
            TitleIcon={Award}
            isAddMode={isAddMode}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
            activeTab="entry"
            onTabChange={(tabId) => setActiveHeaderTab(tabId)}
            currentIndex={currentIndex + 1}
            totalRecords={assessments.length}
            onPrevRecord={currentIndex > 0 ? () => selectAssessmentByIndex(currentIndex - 1) : null}
            onNextRecord={currentIndex < assessments.length - 1 ? () => selectAssessmentByIndex(currentIndex + 1) : null}
            rightContent={`${currentIndex + 1}/${assessments.length || 1}`}
          />

          {/* ── Main Workspace Body ── */}
          <div className="flex-1 p-2 sm:p-3 overflow-y-auto">
            <AssessmentMasterForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              isViewMode={isViewMode}
              questionFiles={questionFiles}
              setQuestionFiles={setQuestionFiles}
            />
          </div>

          {/* ── Standard ERP Footer Toolbar ── */}
          <ERPFooter
            isAddMode={isAddMode}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
            saving={loading || saving}
            handleSubmit={handleSave}
            onModify={handleEdit}
            onDelete={formData.assessment_id ? () => handleDelete(formData) : null}
            onCancel={handleCancel}
            onEditCancel={handleCancel}
            onNewEntry={handleAddNew}
            rights={effectiveRights}
            formData={{ ...formData, Id: formData.assessment_id }}
          />
        </div>
      ) : (
        <div className="bg-slate-50 h-full">
          <AssessmentMasterSearch
            assessments={assessments}
            loading={loading}
            onSelectAssessment={handleSelectAssessment}
            onNewEntry={effectiveRights?.add !== 0 ? handleAddNew : null}
            onTabChange={(tabId) => setActiveHeaderTab(tabId)}
            onRefresh={loadAssessments}
            onDeleteMultiple={handleDeleteMultiple}
          />
        </div>
      )}
    </div>
  );
};

export default AssessmentMasterPage;

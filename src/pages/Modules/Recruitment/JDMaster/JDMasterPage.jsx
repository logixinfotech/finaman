import React, { useState, useEffect, useCallback, useMemo } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import { showToast, confirmDelete, alertError } from "../../../../components/Reusable/alert";
import { fetchUserGroupsByType } from "../../../../utils/api";
import {
  getJDs,
  getJDById,
  createJD,
  updateJD,
  deleteJD,
  getNextJDCode,
} from "../../../../utils/recruitmentApi";
import JDMasterForm from "./JDMasterForm";
import JDMasterSearch from "./JDMasterSearch";
import { FaBriefcase } from "react-icons/fa";

const initialJDState = {
  jd_id: null,
  jd_code: "",
  job_title: "",
  department_id: null,
  department_name: "",
  designation_id: null,
  designation_name: "",
  job_overview: "",
  key_responsibilities: [],
  min_experience: 0,
  max_experience: 0,
  qualifications: [],
  status: "Active",
  skills: [],
};

const JDMasterPage = ({ tab }) => {
  const [activeHeaderTab, setActiveHeaderTab] = useState("entry");
  const [jds, setJds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // ── Load Masters ────────────────────────────────────────────────────────────
  const loadMasters = useCallback(async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        fetchUserGroupsByType("DEP"),
        fetchUserGroupsByType("DESG"),
      ]);

      const deptOpts = (deptRes?.data || []).map((d) => ({
        value: d.group_id,
        label: d.group_name,
      }));

      const desigOpts = (desigRes?.data || []).map((d) => ({
        value: d.group_id,
        label: d.group_name,
      }));

      setDepartments(deptOpts);
      setDesignations(desigOpts);
    } catch (err) {
      console.error("Failed to load department/designation masters:", err);
    }
  }, []);

  // ── Load JDs List ───────────────────────────────────────────────────────────
  const loadJDs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getJDs();
      const list = res?.data || [];
      setJds(list);
      return list;
    } catch (err) {
      console.error("Failed to load JDs:", err);
      showToast({ icon: "error", title: "Failed to load Job Descriptions" });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Mode Hook ───────────────────────────────────────────────────────────────
  const {
    mode,
    setMode,
    formData,
    setFormData,
    saving,
    handleAdd: hookHandleAdd,
    handleModify: hookHandleModify,
    rights,
  } = useERPMode(initialJDState, async () => {}, loadJDs, tab?.appl_name || "JobDescriptionMaster");

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
      loadMasters();
      const list = await loadJDs();
      if (list.length > 0) {
        try {
          const detailRes = await getJDById(list[0].jd_id);
          if (detailRes?.data) {
            setFormData(detailRes.data);
          } else {
            setFormData(list[0]);
          }
        } catch {
          setFormData(list[0]);
        }
        setCurrentIndex(0);
      }
    })();
  }, [loadMasters, loadJDs, setFormData]);

  // ── Select JD by Index ──────────────────────────────────────────────────────
  const selectJDByIndex = useCallback(
    async (idx) => {
      if (idx < 0 || idx >= jds.length) return;
      const jd = jds[idx];
      setCurrentIndex(idx);
      try {
        setLoading(true);
        const res = await getJDById(jd.jd_id);
        if (res?.data) {
          setFormData(res.data);
          setMode("view");
          setErrors({});
          setActiveHeaderTab("entry");
        }
      } catch (err) {
        alertError("Error", "Could not load JD details");
      } finally {
        setLoading(false);
      }
    },
    [jds, setFormData, setMode]
  );

  // ── Select JD directly from Search ──────────────────────────────────────────
  const handleSelectJD = useCallback(
    (jd) => {
      const idx = jds.findIndex((item) => item.jd_id === jd.jd_id);
      if (idx !== -1) {
        selectJDByIndex(idx);
      } else {
        setFormData(jd);
        setMode("view");
        setErrors({});
        setActiveHeaderTab("entry");
      }
    },
    [jds, selectJDByIndex, setFormData, setMode]
  );

  // ── Tab Change Handler ──────────────────────────────────────────────────────
  const handleTabChange = useCallback(
    (tabId) => {
      setActiveHeaderTab(tabId);
      if (tabId === "entry") {
        setMode("view");
      }
    },
    [setMode]
  );

  // ── Add Handler ─────────────────────────────────────────────────────────────
  const handleAdd = useCallback(async () => {
    setErrors({});
    try {
      setLoading(true);
      const res = await getNextJDCode();
      const code = res?.data?.next_code || "JD-001";
      setFormData({
        ...initialJDState,
        jd_code: code,
        status: "Active",
      });
      setMode("add");
      setActiveHeaderTab("entry");
    } catch (err) {
      console.error("Failed to generate JD code:", err);
      setFormData({
        ...initialJDState,
        jd_code: "JD-001",
        status: "Active",
      });
      setMode("add");
      setActiveHeaderTab("entry");
    } finally {
      setLoading(false);
    }
  }, [setFormData, setMode]);

  // ── Modify Handler ──────────────────────────────────────────────────────────
  const handleModify = useCallback(() => {
    if (!formData.jd_id) {
      showToast({ icon: "warning", title: "Please select a Job Description to modify" });
      return;
    }
    setErrors({});
    setMode("edit");
    setActiveHeaderTab("entry");
  }, [formData.jd_id, setMode]);

  // ── Delete Handler ──────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!formData.jd_id) {
      showToast({ icon: "warning", title: "Please select a Job Description to delete" });
      return;
    }
    const confirmed = await confirmDelete(
      `Are you sure you want to delete Job Description "${formData.job_title || formData.jd_code}"?`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteJD(formData.jd_id);
      showToast({ icon: "success", title: "Job Description deleted successfully" });
      const updatedList = await loadJDs();
      if (updatedList.length > 0) {
        const nextIdx = Math.min(currentIndex, updatedList.length - 1);
        selectJDByIndex(nextIdx);
      } else {
        setFormData(initialJDState);
        setMode("view");
      }
    } catch (err) {
      alertError("Delete Failed", err?.response?.data?.message || err.message || "Could not delete JD");
    } finally {
      setLoading(false);
    }
  }, [formData, currentIndex, loadJDs, selectJDByIndex, setFormData, setMode]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errs = {};
    if (!formData.job_title?.trim()) {
      errs.job_title = "Job Title / Role Name is mandatory";
    }
    if (
      formData.min_experience !== undefined &&
      formData.max_experience !== undefined &&
      Number(formData.min_experience) > Number(formData.max_experience)
    ) {
      errs.max_experience = "Max Experience cannot be less than Min Experience";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save Handler ────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      showToast({ icon: "warning", title: "Please fix the validation errors" });
      return;
    }

    try {
      setLoading(true);
      let res;
      if (isAddMode) {
        res = await createJD(formData);
        showToast({ icon: "success", title: "Job Description created successfully" });
      } else {
        res = await updateJD(formData.jd_id, formData);
        showToast({ icon: "success", title: "Job Description updated successfully" });
      }

      const updatedList = await loadJDs();
      const savedId = res?.data?.jd_id || formData.jd_id;
      const newIdx = updatedList.findIndex((item) => item.jd_id === savedId);
      if (newIdx !== -1) {
        selectJDByIndex(newIdx);
      } else if (updatedList.length > 0) {
        selectJDByIndex(0);
      } else {
        setMode("view");
      }
    } catch (err) {
      alertError("Save Failed", err?.response?.data?.message || err.message || "Could not save Job Description");
    } finally {
      setLoading(false);
    }
  }, [formData, isAddMode, loadJDs, selectJDByIndex, setMode]);

  // ── Cancel / Discard Handler ────────────────────────────────────────────────
  const handleCancel = useCallback(async () => {
    setErrors({});
    if (isAddMode || isEditMode) {
      if (jds.length > 0) {
        const targetIdx = currentIndex >= 0 && currentIndex < jds.length ? currentIndex : 0;
        await selectJDByIndex(targetIdx);
      } else {
        setFormData(initialJDState);
        setMode("view");
      }
    } else {
      setActiveHeaderTab("search");
    }
  }, [isAddMode, isEditMode, jds, currentIndex, selectJDByIndex, setFormData, setMode]);

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT");

      if (e.key === "Escape") {
        if (isInputFocused) {
          activeEl.blur();
          return;
        }
        e.preventDefault();
        handleCancel();
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "a":
            e.preventDefault();
            if (isViewMode && effectiveRights.add) handleAdd();
            break;
          case "m":
            e.preventDefault();
            if (isViewMode && effectiveRights.mod && formData.jd_id) handleModify();
            break;
          case "d":
            e.preventDefault();
            if (isViewMode && effectiveRights.del && formData.jd_id) handleDelete();
            break;
          case "s":
            e.preventDefault();
            if (!isViewMode) handleSave();
            break;
          case "c":
          case "e":
            e.preventDefault();
            handleCancel();
            break;
          default:
            break;
        }
        return;
      }

      if (!isInputFocused && isViewMode) {
        if (e.key === "PageDown" || e.key === "ArrowDown") {
          e.preventDefault();
          if (currentIndex < jds.length - 1) selectJDByIndex(currentIndex + 1);
        } else if (e.key === "PageUp" || e.key === "ArrowUp") {
          e.preventDefault();
          if (currentIndex > 0) selectJDByIndex(currentIndex - 1);
        } else if (e.key === "Home") {
          e.preventDefault();
          if (jds.length > 0) selectJDByIndex(0);
        } else if (e.key === "End") {
          e.preventDefault();
          if (jds.length > 0) selectJDByIndex(jds.length - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isViewMode,
    formData.jd_id,
    effectiveRights,
    handleAdd,
    handleModify,
    handleDelete,
    handleSave,
    handleCancel,
    currentIndex,
    jds,
    selectJDByIndex,
  ]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 overflow-hidden font-sans select-none">
      {activeHeaderTab === "entry" ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* ── Top ERP Header with Navigation & Tabs ── */}
          <ERPHeader
            title="Job Description (JD) Master"
            icon={<FaBriefcase className="text-blue-600" />}
            isAddMode={isAddMode}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
            activeTab="entry"
            onTabChange={handleTabChange}
            currentIndex={currentIndex + 1}
            totalRecords={jds.length}
            onPrevRecord={currentIndex > 0 ? () => selectJDByIndex(currentIndex - 1) : null}
            onNextRecord={currentIndex < jds.length - 1 ? () => selectJDByIndex(currentIndex + 1) : null}
            rightContent={`${currentIndex + 1}/${jds.length || 1}`}
          />

          {/* ── Main Workspace Body (Side-by-Side 2 Column Form) ── */}
          <div className="flex-1 p-2 overflow-hidden">
            <JDMasterForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              mode={mode}
              departments={departments}
              designations={designations}
            />
          </div>

          {/* ── Standard ERP Bottom Action Bar ── */}
          <ERPFooter
            isAddMode={isAddMode}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
            saving={saving || loading}
            handleSubmit={handleSave}
            onModify={handleModify}
            onDelete={formData.jd_id ? handleDelete : null}
            onCancel={handleCancel}
            onEditCancel={handleCancel}
            onNewEntry={effectiveRights?.add !== 0 ? handleAdd : null}
            rights={effectiveRights}
            formData={{ ...formData, Id: formData.jd_id }}
          />
        </div>
      ) : (
        <div className="bg-slate-50 h-full">
          <JDMasterSearch
            jds={jds}
            loading={loading}
            onSelectJD={handleSelectJD}
            onNewEntry={effectiveRights?.add !== 0 ? handleAdd : null}
            onTabChange={handleTabChange}
            onRefresh={loadJDs}
          />
        </div>
      )}
    </div>
  );
};

export default JDMasterPage;

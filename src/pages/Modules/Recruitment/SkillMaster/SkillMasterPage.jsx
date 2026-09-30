import React, { useState, useEffect, useCallback, useMemo } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import { showToast, confirmDelete, alertError } from "../../../../components/Reusable/alert";
import {
  getSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  getNextSkillCode,
} from "../../../../utils/recruitmentApi";
import SkillMasterForm from "./SkillMasterForm";
import SkillMasterSearch from "./SkillMasterSearch";
import { FaBrain } from "react-icons/fa";

const initialSkillState = {
  skill_id: null,
  skill_code: "",
  skill_name: "",
  skill_category: "Technical / Hard Skill",
  proficiency_scale_type: "Beginner / Intermediate / Expert",
  skill_description: "",
  status: "Active",
};

const SkillMasterPage = ({ tab }) => {
  const [activeHeaderTab, setActiveHeaderTab] = useState("entry");
  const [skills, setSkills] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Load Skills ─────────────────────────────────────────────────────────────
  const loadSkills = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSkills();
      const list = res?.data || [];
      setSkills(list);
      return list;
    } catch (err) {
      console.error("Failed to load skills:", err);
      showToast({ icon: "error", title: "Failed to load skills" });
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
  } = useERPMode(initialSkillState, async () => { }, loadSkills, tab?.appl_name || "SkillMaster");

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
      const list = await loadSkills();
      if (list.length > 0) {
        setFormData(list[0]);
        setCurrentIndex(0);
      }
    })();
  }, [loadSkills, setFormData]);

  // ── Select Skill by Index ───────────────────────────────────────────────────
  const selectSkillByIndex = useCallback(
    async (idx) => {
      if (idx < 0 || idx >= skills.length) return;
      const s = skills[idx];
      setCurrentIndex(idx);
      try {
        setLoading(true);
        const res = await getSkillById(s.skill_id);
        if (res?.data) {
          setFormData(res.data);
          setMode("view");
          setErrors({});
          setActiveHeaderTab("entry");
        }
      } catch (err) {
        alertError("Error", "Could not load skill details");
      } finally {
        setLoading(false);
      }
    },
    [skills, setFormData, setMode]
  );

  // ── Select Skill directly from Search ───────────────────────────────────────
  const handleSelectSkill = useCallback(
    (skill) => {
      const idx = skills.findIndex((s) => s.skill_id === skill.skill_id);
      if (idx !== -1) {
        selectSkillByIndex(idx);
      } else {
        setFormData(skill);
        setMode("view");
        setErrors({});
        setActiveHeaderTab("entry");
      }
    },
    [skills, selectSkillByIndex, setFormData, setMode]
  );

  // ── Add New Entry ───────────────────────────────────────────────────────────
  const handleNewEntry = useCallback(async () => {
    setErrors({});
    setActiveHeaderTab("entry");
    setMode("add");
    try {
      const res = await getNextSkillCode();
      const code = res?.data?.skill_code || "SKL-001";
      setFormData({
        ...initialSkillState,
        skill_code: code,
      });
    } catch (e) {
      console.error(e);
      setFormData({
        ...initialSkillState,
        skill_code: "SKL-001",
      });
    }
  }, [setFormData, setMode]);

  // ── Modify Handler ──────────────────────────────────────────────────────────
  const handleModify = useCallback(() => {
    setErrors({});
    setMode("edit");
  }, [setMode]);

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

  // ── Cancel / Discard Handler ───────────────────────────────────────────────
  const handleCancel = useCallback(async () => {
    setErrors({});
    if (isAddMode || isEditMode) {
      if (skills.length > 0) {
        const targetIdx = currentIndex >= 0 && currentIndex < skills.length ? currentIndex : 0;
        await selectSkillByIndex(targetIdx);
      } else {
        setFormData(initialSkillState);
        setMode("view");
      }
    } else {
      setActiveHeaderTab("search");
    }
  }, [isAddMode, isEditMode, skills, currentIndex, selectSkillByIndex, setFormData, setMode]);

  // ── Keyboard Shortcuts (Esc key) ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea") {
          document.activeElement.blur();
          return;
        }
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCancel]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateForm = (data) => {
    const errs = {};
    if (!data.skill_name || !String(data.skill_name).trim()) {
      errs.skill_name = "Skill Name is mandatory";
    }
    if (!data.skill_category || !String(data.skill_category).trim()) {
      errs.skill_category = "Skill Category is mandatory";
    }
    if (!data.proficiency_scale_type || !String(data.proficiency_scale_type).trim()) {
      errs.proficiency_scale_type = "Proficiency Scale Type is mandatory";
    }
    if (!data.status || !String(data.status).trim()) {
      errs.status = "Status is mandatory";
    }

    // Duplicate skill name check in existing list (case-insensitive)
    const normalizedName = String(data.skill_name || "").trim().toLowerCase();
    const isDup = skills.some(
      (s) =>
        s.skill_name?.trim().toLowerCase() === normalizedName &&
        s.skill_id !== data.skill_id
    );
    if (isDup) {
      errs.skill_name = `Skill "${data.skill_name.trim()}" already exists. Name must be unique.`;
    }

    return { isValid: Object.keys(errs).length === 0, errors: errs };
  };

  // ── Save Handler ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const { isValid, errors: errs } = validateForm(formData);
    if (!isValid) {
      setErrors(errs);
      showToast({ icon: "error", title: "Please fill all required fields correctly" });
      return;
    }

    try {
      if (isAddMode) {
        const res = await createSkill(formData);
        if (res?.success) {
          showToast({ icon: "success", title: "Skill created successfully" });
          const updatedList = await loadSkills();
          const newIdx = updatedList.findIndex((s) => s.skill_code === res.data?.skill_code);
          if (newIdx !== -1) {
            setCurrentIndex(newIdx);
            setFormData(updatedList[newIdx]);
          }
          setMode("view");
          setErrors({});
        } else {
          alertError("Save Failed", res?.message || "Could not create skill");
        }
      } else if (isEditMode) {
        const res = await updateSkill(formData.skill_id, formData);
        if (res?.success) {
          showToast({ icon: "success", title: "Skill updated successfully" });
          const updatedList = await loadSkills();
          const targetIdx = updatedList.findIndex((s) => s.skill_id === formData.skill_id);
          if (targetIdx !== -1) {
            setCurrentIndex(targetIdx);
            setFormData(updatedList[targetIdx]);
          }
          setMode("view");
          setErrors({});
        } else {
          alertError("Save Failed", res?.message || "Could not update skill");
        }
      }
    } catch (err) {
      console.error(err);
      alertError("Save Error", err?.response?.data?.message || err.message || "Failed to save skill");
    }
  };

  // ── Delete Handler ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!formData.skill_id) return;
    const confirmed = await confirmDelete({
      title: `Delete Skill "${formData.skill_name}"?`,
      text: "This skill will be deactivated and marked as deleted.",
    });

    if (confirmed) {
      try {
        const res = await deleteSkill(formData.skill_id);
        if (res?.success) {
          showToast({ icon: "success", title: "Skill deleted successfully" });
          const updatedList = await loadSkills();
          if (updatedList.length > 0) {
            setFormData(updatedList[0]);
            setCurrentIndex(0);
          } else {
            setFormData(initialSkillState);
          }
          setMode("view");
        } else {
          alertError("Delete Failed", res?.message || "Could not delete skill");
        }
      } catch (err) {
        alertError("Delete Error", err?.message || "Failed to delete skill");
      }
    }
  };

  // ── Multi-delete handler for Search Table ──────────────────────────────────
  const handleDeleteMultiple = async (selectedRows) => {
    const ids = (selectedRows || []).map((row) =>
      typeof row === "object" ? row.skill_id : row
    );
    if (ids.length === 0) return;

    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} selected skill(s)?`,
    });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteSkill(id)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} skill(s) deleted` });
      } else {
        showToast({
          icon: "warning",
          title: `${ids.length - failed} deleted, ${failed} failed`,
        });
      }
      await loadSkills();
    } catch (err) {
      alertError("Delete Error", "Failed to delete selected skills");
    }
  };

  return (
    <div className="h-full w-full">
      {activeHeaderTab === "entry" ? (
        <div className="h-full flex flex-col overflow-hidden bg-slate-100">
          {/* ── Standard ERP Header ── */}
          <ERPHeader
            title="Skill Master"
            TitleIcon={FaBrain}
            isAddMode={isAddMode}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
            activeTab="entry"
            onTabChange={handleTabChange}
            currentIndex={currentIndex + 1}
            totalRecords={skills.length}
            onPrevRecord={currentIndex > 0 ? () => selectSkillByIndex(currentIndex - 1) : null}
            onNextRecord={currentIndex < skills.length - 1 ? () => selectSkillByIndex(currentIndex + 1) : null}
            rightContent={`${currentIndex + 1}/${skills.length || 1}`}
          />

          {/* ── Main Workspace Body ── */}
          <div className="flex-1 p-2 overflow-hidden">
            <SkillMasterForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              mode={mode}
            />
          </div>

          {/* ── Standard ERP Footer Toolbar ── */}
          <ERPFooter
            isAddMode={isAddMode}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
            saving={saving}
            handleSubmit={handleSave}
            onModify={handleModify}
            onDelete={formData.skill_id ? handleDelete : null}
            onCancel={handleCancel}
            onEditCancel={handleCancel}
            onNewEntry={handleNewEntry}
            rights={effectiveRights}
            formData={{ ...formData, Id: formData.skill_id }}
          />
        </div>
      ) : (
        <div className="bg-slate-50 h-full">
          <SkillMasterSearch
            skills={skills}
            loading={loading}
            onSelectSkill={handleSelectSkill}
            onNewEntry={effectiveRights?.add !== 0 ? handleNewEntry : null}
            onTabChange={handleTabChange}
            onRefresh={loadSkills}
            onDeleteMultiple={handleDeleteMultiple}
          />
        </div>
      )}
    </div>
  );
};

export default SkillMasterPage;

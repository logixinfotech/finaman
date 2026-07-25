import { useEffect, useState, useCallback } from "react";
import MenuGroupMasterForm from "./MenuGroupMasterForm";
import Table from "../../../../components/Reusable/table/Table";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import { showToast, confirmDelete, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import {
  fetchMasgrpList, createMasgrp, updateMasgrp, deleteMasgrp, fetchSidebarMenu
} from "../../../../utils/api";

const initialState = {
  grp_id: null,
  masmod_id: "",
  pad_type: "1",
  grp_name: "",
  srl_no: "",
  icon_name: "",
  grp_hide: "N",
};

const PAD_LABEL = { 1: "Entries", 2: "Reports", 3: "Utility" };

const columns = [
  { key: "grp_id", label: "ID" },
  { key: "mod_name", label: "Module" },
  { key: "pad_type", label: "Section", render: (row) => PAD_LABEL[row.pad_type] || row.pad_type },
  { key: "grp_name", label: "Group Name" },
  { key: "srl_no", label: "Serial No" },
  { key: "icon_name", label: "Icon" },
  {
    key: "grp_hide",
    label: "Hidden",
    render: (row) => (
      <span className={`status-badge ${row.grp_hide === "Y" ? "inactive" : "active"}`}>
        {row.grp_hide === "Y" ? "Yes" : "No"}
      </span>
    ),
  },
];

const MenuGroupMasterPage = ({ tab }) => {
  const [modules, setModules] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMasgrpList();
      const finalData = Array.isArray(data) ? data : data?.data || [];
      setList(finalData);
      return finalData;
    } catch (err) {
      alertError("Fetch Error", "Failed to load menu groups");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadModules = useCallback(async () => {
    try {
      const data = await fetchSidebarMenu();
      setModules(data || []);
    } catch (err) {
      console.error("❌ loadModules error:", err);
    }
  }, []);

  const {
    mode, formData, setFormData, showForm, setShowForm, saving,
    handleView, handleAdd, handleModify, performSave, handleEditCancel,
    isEditMode, rights
  } = useERPMode(
    initialState,
    async (data) => data.grp_id ? await updateMasgrp(data.grp_id, data) : await createMasgrp(data),
    () => {},
    tab?.appl_name
  );

  useEffect(() => {
    loadList();
    loadModules();
  }, [loadList, loadModules]);

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleRowSelect = (row) => {
    const index = list.findIndex((i) => i.grp_id === row.grp_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async () => {
    const saved = await performSave("grp_id");

    if (saved?.success) {
      showToast({ icon: "success", title: isEditMode ? "Updated successfully" : "Added successfully" });

      const freshList = await loadList();
      const savedId = saved?.grp_id ?? formData?.grp_id;

      let newIndex = freshList.findIndex((i) => i.grp_id === savedId);
      if (newIndex === -1) newIndex = freshList.findIndex((i) => i.grp_name === formData?.grp_name);
      if (newIndex === -1) newIndex = 0;

      setCurrentIndex(newIndex);
      if (freshList[newIndex]) setFormData({ ...freshList[newIndex] });
    } else if (saved?.message) {
      alertError("Save failed", saved.message);
    }
  };

  const handleDelete = async (row) => {
    const id = row?.grp_id || formData?.grp_id;
    const confirmed = await confirmDelete({
      title: `Delete "${row?.grp_name || formData?.grp_name}"?`,
      text: "This action cannot be undone",
    });
    if (!confirmed) return;

    try {
      const res = await deleteMasgrp(id);
      if (res?.success) {
        showToast({ icon: "success", title: "Deleted successfully" });
        setShowForm(false);
        loadList();
      } else {
        // backend "menus attached hain" wala message bhejta hai
        alertError("Delete failed", res?.message || "Something went wrong");
      }
    } catch (err) {
      alertError("Delete failed", err?.response?.data?.message || "Something went wrong");
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((i) => (typeof i === "object" ? i.grp_id : i));
    if (ids.length === 0) return;

    const confirmed = await confirmDelete({ title: `Delete ${ids.length} group(s)?` });
    if (!confirmed) return;

    try {
      const results = await Promise.allSettled(ids.map((id) => deleteMasgrp(id)));
      const failed = results.filter((r) => r.status === "rejected" || !r.value?.success).length;

      if (failed === 0) showToast({ icon: "success", title: `${ids.length} deleted` });
      else showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed (menus attached)` });

      loadList();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete some groups");
    }
  };

  const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex((p) => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
      onFirstRecord: () => setCurrentIndex(0),
      onLastRecord: () => setCurrentIndex(list.length - 1),
      onNew: handleAdd,
      onSave: handleSave,
      onModify: handleModify,
      onEsc: () => setShowForm(false),
    });
  }, [list, formData, handleAdd]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <MenuGroupMasterForm
          modules={modules}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onDelete={() => handleDelete(formData)}
          mode={mode}
          saving={saving}
          onModify={handleModify}
          onEditCancel={handleEditCancel}
          rights={rights}
          currentRecord={currentIndex + 1}
          totalRecords={list.length}
          activeTab="entry"
          onTabChange={handleTabChange}
          onNewEntry={handleAdd}
          onPrevRecord={() => setCurrentIndex((p) => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex((p) => Math.min(p + 1, list.length - 1))}
        />
      ) : (
        <Table
          activeTab="search"
          onTabChange={handleTabChange}
          title="Menu Group Master"
          data={list}
          columns={columns}
          rowKey="grp_id"
          onDeleteMultiple={handleDeleteMultiple}
          loading={loading}
          onRefresh={loadList}
          onRowDoubleClick={handleRowSelect}
          onAdd={rights.add === 1 ? handleAdd : null}
        />
      )}
    </div>
  );
};

export default MenuGroupMasterPage;
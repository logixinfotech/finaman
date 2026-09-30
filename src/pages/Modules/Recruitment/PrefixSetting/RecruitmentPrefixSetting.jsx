import { useEffect, useState, useCallback } from "react";
import Table from "../../../../components/Reusable/table/Table";
import RecruitmentPrefixSettingForm from "./RecruitmentPrefixSettingForm";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import {
  fetchRecruitmentPrefixes,
  createRecruitmentPrefix,
  updateRecruitmentPrefix,
  deleteRecruitmentPrefix,
} from "../../../../utils/recruitmentApi";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { Settings } from "lucide-react";

const initialState = {
  submenu_key: "",
  submenu_name: "",
  prefix: "",
  status: "Active",
};

const columns = [
  {
    key: "submenu_name",
    label: "Submenu",
    width: 220,
    render: (row) => (
      <span className="font-medium text-slate-800">{row.submenu_name || "—"}</span>
    ),
  },
  {
    key: "submenu_key",
    label: "Submenu Key",
    width: 180,
    render: (row) => (
      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
        {row.submenu_key || "—"}
      </span>
    ),
  },
  {
    key: "prefix",
    label: "Prefix",
    width: 130,
    render: (row) => (
      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
        {row.prefix || "—"}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    width: 120,
    render: (row) => {
      const active = row.status === "Active";
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
            active
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-300"
          }`}
        >
          {row.status || "Active"}
        </span>
      );
    },
  },
];

const RecruitmentPrefixSetting = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    mode,
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
      return isEdit
        ? await updateRecruitmentPrefix(data.prefix_id, data)
        : await createRecruitmentPrefix(data);
    },
    () => loadList(),
    tab?.appl_name || "RecruitmentPrefixSetting"
  );

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchRecruitmentPrefixes();
      const finalData = Array.isArray(res) ? res : res?.data || [];
      setList(finalData);
      if (finalData.length > 0) {
        setFormData(finalData[0]);
        setCurrentIndex(0);
      }
      return finalData;
    } catch (err) {
      console.error(err);
      alertError("Fetch Error", "Failed to load recruitment prefix settings");
      return [];
    } finally {
      setLoading(false);
    }
  }, [setFormData]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0 && list[currentIndex]) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleTabChange = (t) => {
    if (t === "search") setShowForm(false);
    if (t === "entry") setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex((i) => i.prefix_id === row.prefix_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData) => {
    const response = await performSave("prefix_id", updatedData);
    if (response?.success) {
      const freshList = await loadList();
      const savedId = updatedData.prefix_id ?? response?.data?.prefix_id;
      const newIndex = freshList.findIndex((i) => i.prefix_id === savedId);

      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
        handleView(freshList[newIndex]);
      } else if (freshList.length > 0) {
        const lastIndex = freshList.length - 1;
        setCurrentIndex(lastIndex);
        handleView(freshList[lastIndex]);
      }
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete prefix for "${row.submenu_name}"?`,
    });
    if (confirmed) {
      const res = await deleteRecruitmentPrefix(row.prefix_id);
      if (res?.success) {
        showToast({ icon: "success", title: "Prefix setting deleted" });
        await loadList();
        setShowForm(false);
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to delete" });
      }
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.prefix_id : item
    );
    if (!ids.length) return;
    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} prefix setting(s)?`,
    });
    if (confirmed) {
      let count = 0;
      for (const id of ids) {
        const res = await deleteRecruitmentPrefix(id);
        if (res?.success) count++;
      }
      showToast({ icon: "success", title: `${count} record(s) deleted` });
      loadList();
    }
  };

  const handlePrevRecord = () => {
    if (currentIndex > 0) {
      const newIdx = currentIndex - 1;
      setCurrentIndex(newIdx);
      handleView(list[newIdx]);
    }
  };

  const handleNextRecord = () => {
    if (currentIndex < list.length - 1) {
      const newIdx = currentIndex + 1;
      setCurrentIndex(newIdx);
      handleView(list[newIdx]);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    setERPHandlers({
      onNew: () => {
        if (rights?.can_add) {
          handleAdd();
          setShowForm(true);
        }
      },
      onEdit: () => {
        if (rights?.can_edit && list[currentIndex]) {
          handleModify(list[currentIndex]);
          setShowForm(true);
        }
      },
      onDelete: () => {
        if (rights?.can_delete && list[currentIndex]) {
          handleDelete(list[currentIndex]);
        }
      },
      onCancel: () => {
        handleEditCancel();
      },
    });
    return () => setERPHandlers({});
  }, [rights, list, currentIndex, handleAdd, handleModify, handleEditCancel]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <RecruitmentPrefixSettingForm
          mode={mode}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onEditCancel={handleEditCancel}
          onDelete={handleDelete}
          saving={saving}
          onModify={() => handleModify(formData)}
          onNewEntry={handleAdd}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
          totalRecords={list.length}
          onPrevRecord={handlePrevRecord}
          onNextRecord={handleNextRecord}
          rights={rights}
          activeTab="entry"
          onTabChange={handleTabChange}
          existingList={list}
        />
      ) : (
        <Table
          activeTab="search"
          onTabChange={handleTabChange}
          title="Recruitment Prefix Setting"
          TitleIcon={Settings}
          data={list}
          columns={columns}
          rowKey="prefix_id"
          loading={loading}
          onAdd={() => {
            handleAdd();
            setShowForm(true);
          }}
          onRowDoubleClick={handleRowSelect}
          onRowClick={handleRowSelect}
          onRefresh={loadList}
          onDeleteMultiple={handleDeleteMultiple}
        />
      )}
    </div>
  );
};

export default RecruitmentPrefixSetting;

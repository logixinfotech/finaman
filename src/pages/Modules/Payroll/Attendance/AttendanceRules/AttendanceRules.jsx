import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode";
import Table from "../../../../../components/Reusable/table/Table";
import AttendanceRuleForm from "./AttendanceRuleForm";
import {
  fetchAttendanceRules,
  createAttendanceRule,
  updateAttendanceRule,
  deleteAttendanceRule,
} from "../../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../../components/Reusable/alert";

const initialState = {
  rule_id: null,
  rule_name: "",
  description: "",
  late_tiers: JSON.stringify([
    { code: "L1", name: "Late 1", mins: 15 },
    { code: "L2", name: "Late 2", mins: 15 },
  ]),
  is_active: 1,
};

const columns = [
  { key: "rule_name", label: "Rule Name" },
  {
    key: "late_tiers",
    label: "Late Tiers",
    render: (row) => {
      let tiers = [];
      try {
        tiers = typeof row.late_tiers === "string" ? JSON.parse(row.late_tiers) : row.late_tiers;
      } catch {
        tiers = [];
      }
      if (!Array.isArray(tiers) || tiers.length === 0) return "—";
      return (
        <div className="flex flex-wrap gap-1">
          {tiers.map((t, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
            >
              {t.code} (+{t.mins}m)
            </span>
          ))}
        </div>
      );
    },
  },
  { key: "description", label: "Description" },
  {
    key: "is_active",
    label: "Status",
    render: (row) => {
      const active = row.is_active === true || row.is_active === 1 || row.is_active === "1" || row.is_active === undefined;
      return (
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            active
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-600 border border-slate-300"
          }`}
        >
          {active ? "Active" : "Inactive"}
        </span>
      );
    },
  },
];

const AttendanceRules = ({ tab = {} }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAttendanceRules();
      const finalData = Array.isArray(res) ? res : res?.data || [];
      setList(finalData);
    } catch (err) {
      alertError("Fetch Error", "Failed to load attendance rules");
    } finally {
      setLoading(false);
    }
  }, []);

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
    async (data) =>
      data.rule_id
        ? await updateAttendanceRule(data.rule_id, data)
        : await createAttendanceRule(data),
    loadData,
    tab?.appl_name || "attendance_rules"
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (list.length > 0 && showForm && mode === "view") {
      handleView(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, handleView]);

  const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex((item) => item.rule_id === row.rule_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData) => {
    if (!updatedData.rule_name) {
      showToast({ icon: "error", title: "Rule Name is required" });
      return;
    }

    const response = await performSave("rule_id", updatedData);
    if (response?.success) {
      showToast({ icon: "success", title: "Attendance Rule Saved" });
      await loadData();
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete Attendance Rule "${row.rule_name}"?`,
    });
    if (!confirmed) return;
    await deleteAttendanceRule(row.rule_id);
    showToast({ icon: "success", title: "Deleted" });
    loadData();
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.rule_id : item
    );
    if (ids.length === 0) return;

    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} record(s)?`,
    });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteAttendanceRule(id)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else {
        showToast({
          icon: "warning",
          title: `${ids.length - failed} deleted, ${failed} failed`,
        });
      }
      loadData();
      setShowForm(false);
    } catch {
      alertError("Delete Error", "Failed to delete attendance rules");
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {showForm ? (
        <AttendanceRuleForm
          formData={formData}
          setFormData={setFormData}
          mode={mode}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onDelete={handleDelete}
          onEditCancel={handleEditCancel}
          saving={saving}
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={list.length ? currentIndex + 1 : 1}
          totalRecords={list.length || 1}
          rights={rights}
          activeTab="entry"
          onTabChange={handleTabChange}
          initialData={formData}
          onPrevRecord={() => {
            if (currentIndex > 0) {
              const nextIdx = currentIndex - 1;
              setCurrentIndex(nextIdx);
              handleView(list[nextIdx]);
            }
          }}
          onNextRecord={() => {
            if (currentIndex < list.length - 1) {
              const nextIdx = currentIndex + 1;
              setCurrentIndex(nextIdx);
              handleView(list[nextIdx]);
            }
          }}
        />
      ) : (
        <Table
          title="Attendance Rules"
          data={list}
          columns={columns}
          loading={loading}
          onRowSelect={handleRowSelect}
          onAddNew={handleAdd}
          onDeleteMultiple={handleDeleteMultiple}
          rowKey="rule_id"
          rights={rights}
          activeTab="search"
          onTabChange={handleTabChange}
        />
      )}
    </div>
  );
};

export default AttendanceRules;

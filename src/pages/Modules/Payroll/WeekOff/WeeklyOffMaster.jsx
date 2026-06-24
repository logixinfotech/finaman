import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import WeeklyOffMasterForm from "./WeeklyOffMasterForm";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { getWeekOff, createWeekOff, updateWeekOff, deleteWeekOff } from "../../../../utils/api";

const initialState = {
  id: null,
  employee_id: "",
  day_of_week: "",
  effective_from: "",
  effective_to: "",
};

const formatDate = (value) => {
  if (!value) return "";
  const clean = value.toString().replace("T", " ").split(".")[0];  
  return clean.split(" ")[0]; // "2026-05-22"
};


const columns = [
  { key: "employee_name", label: "Employee Name" },
  { key: "day_of_week", label: "WeekOff Day" },
  { key: "effective_from", label: "Effective From", render: (row) => formatDate(row.effective_from) },
  { key: "effective_to",   label: "Effective To",   render: (row) => formatDate(row.effective_to)   },
];

const WeeklyOffMaster = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getWeekOff();
      setList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);


  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights
  } = useERPMode(
    initialState,
    async (data) =>
      data.id
        ? await updateWeekOff(data.id, data)
        : await createWeekOff(data),
    loadData,
    tab.appl_name
  );


  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex(item => item.id === row.id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

const handleSave = async (updatedData  = formData) => {
  console.log("FINAL SAVE DATA:", updatedData);

  if (!updatedData.employee_id) {
    showToast({ icon: "error", title: "Please select an employee" });
    return;
  }

  const response = await performSave("id", updatedData);

  if (response?.success) {
    showToast({ icon: "success", title: "Saved Successfully" });

    await loadData(); // ✅ YE ADD KARO
  }
};

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete Weekly Off for "${row.employee_name}"?`
    });
    if (!confirmed) return;
    await deleteWeekOff(row.id);
    showToast({ icon: "success", title: "Deleted" });
    loadData();
  };
    const handleDeleteMultiple = async (selected) => {
      const ids = (selected || []).map((item) =>
        typeof item === "object" ? item.tds_id : item
      );
      if (ids.length === 0) return;
  
      const confirmed = await confirmDelete({ title: `Delete ${ids.length} Weeklyoff record(s)?` });
      if (!confirmed) return;
  
      try {
        const results = await Promise.all(ids.map((id) => deleteWeekOff(id)));
        const failed = results.filter((r) => !r?.success).length;
        if (failed === 0) {
          showToast({ icon: "success", title: `${ids.length} deleted` });
        } else {
          showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed` });
        }
        loadData();
        setShowForm(false);
      } catch (err) {
        alertError("Delete Error", "Failed to delete some TDS records");
      }
    };
  

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew: handleAdd,
      onSave: handleSave,
      onEsc: () => setShowForm(false),
      onBackspaceNavigation: true,
    });
  }, [list, handleAdd, handleSave, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <WeeklyOffMasterForm
          initialData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onDelete={handleDelete}
          mode={mode}
          saving={saving}
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
          totalRecords={list.length}
          rights={rights}
          onEditCancel={handleEditCancel}
          activeTab="entry"
          onTabChange={handleTabChange}
          onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
        />
      ) : (
        <div className="p-4 bg-slate-50 h-full">
          <Table
            title="Weekly Off Master List"
             activeTab={"search"}
                    onTabChange={handleTabChange}
            onDeleteMultiple={handleDeleteMultiple}
            data={list}
            columns={columns}
            rowKey="id"
            loading={loading}
            onAdd={rights.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default WeeklyOffMaster;
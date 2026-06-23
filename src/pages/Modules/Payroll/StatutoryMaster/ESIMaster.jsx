import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import ESIMasterForm from "./ESIMasterForm";
import { fetchESIList, createESI, updateESI, deleteESI } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const initialState = {
  statutory_type:  "ESI",
  name:            "",
  employee_rate:   0.75,
  employer_rate:   3.25,
  wage_ceiling:    21000,
  apply_ceiling:   "Yes",
  applicable_from: "",
  status:          "Active",
};

const columns = [
  { key: "name",            label: "Name"           },
  { key: "employee_rate",   label: "Employee Rate %" },
  { key: "employer_rate",   label: "Employer Rate %" },
  { key: "wage_ceiling",    label: "Wage Ceiling"    },
  { key: "applicable_from", label: "Applicable From" },
  { key: "status",          label: "Status"          },
];

const ESIMaster = ({ tab }) => {
  const [list, setList]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    mode, formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      return isEdit
        ? await updateESI(data.statutory_id, data)
        : await createESI(data);
    },
    () => loadList(),
    tab.appl_name
  );

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchESIList();
      const finalData = Array.isArray(data) ? data : data?.data || [];
      setList(finalData);
      if (finalData.length > 0) {
        setFormData(finalData[0]);
        setCurrentIndex(0);
      }
    } catch (err) {
      alertError("Fetch Error", "Failed to load ESI records");
    } finally {
      setLoading(false);
    }
  }, [setFormData]);

  useEffect(() => { loadList(); }, []);

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleTabChange = (t) => {
    if (t === "search") setShowForm(false);
    if (t === "entry")  setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex(i => i.statutory_id === row.statutory_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData) => {
    const response = await performSave("statutory_id", updatedData);
    if (response?.success) await loadList();
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete "${row.name}"?` });
    if (confirmed) {
      const res = await deleteESI(row.statutory_id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadList();
        setShowForm(false);
      }
    }
  };

  const handleDeleteMultiple = async (selected) => {
          const ids = (selected || []).map((item) =>
              typeof item === "object" ? item.statutory_id : item
          );
   
          if (ids.length === 0) return;
   
          const confirmed = await confirmDelete({
              title: `Delete ${ids.length} ESI${ids.length > 1 ? "s" : ""}?`,
              text: "This action cannot be undone",
          });
          if (!confirmed) return;
   
          try {
              const results = await Promise.all(ids.map((id) => deleteESI(id)));
              const failed = results.filter((r) => !r?.success).length;
   
              if (failed === 0) {
                  showToast({ icon: "success", title: `${ids.length} deleted successfully` });
              } else {
                  showToast({
                      icon: "warning",
                      title: `${ids.length - failed} deleted, ${failed} failed`,
                  });
              }
   
              loadList();
              setShowForm(false);
          } catch (err) {
              alertError("Delete Error", "Failed to delete some designations");
          }
      };
  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew:  handleAdd,
      onSave: handleSave,
      onEsc:  () => setShowForm(false),
    });
  }, [list, handleAdd, handleSave, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <ESIMasterForm
          initialData={formData}
          onSave={handleSave}
          onDelete={handleDelete}
          formData={formData}
          setFormData={setFormData}
          onCancel={() => setShowForm(false)}
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
        />
      ) : (
        <div className="p-4 bg-slate-50 h-full">
          <Table
          activeTab={"search"}
                    onTabChange={handleTabChange}
            title="ESI Master"
            onDeleteMultiple={handleDeleteMultiple}
            data={list}
            columns={columns}
            rowKey="statutory_id"
            loading={loading}
            onAdd={rights.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default ESIMaster;

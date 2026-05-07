import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import ShiftAllocationForm from "./ShiftAllocationForm"; 
import { fetchAllocations, deleteAllocation, createAllocation, updateAllocation } from "../../../../utils/api";  
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const initialState = {
  allocation_id: null,
  employee_id: "",
  shift_id: "",
  allocation_from: new Date().toISOString().split('T')[0],
  allocation_to: "",
  remarks: "",
  is_approved: 0,
};

const columns = [
  { key: "employee_name", label: "Employee Name" },
  { key: "shift_name", label: "Shift Name" },
  { key: "allocation_from", label: "From Date" },
  { key: "allocation_to", label: "To Date" },
  { key: "status_text", label: "Status" }, 
];

const ShiftAllocation = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      // Backend expects employee_id as INT and others as UUID
      return isEdit 
        ? await updateAllocation(data.allocation_id, data) 
        : await createAllocation(data);
    },
    () => loadAllocations(),
    tab.appl_name
  );

  const loadAllocations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllocations();
      const finalData = Array.isArray(data) ? data : data?.data || [];

      const displayData = finalData.map(item => ({
        ...item,
        status_text: item.is_approved ? "Approved" : "Pending"
      }));

      setList(displayData);
      if (displayData.length > 0) {
        setFormData(displayData[0]);
        setCurrentIndex(0);
      }
    } catch (err) {
      alertError("Fetch Error", "Failed to load shift allocations");
    } finally {
      setLoading(false);
    }
  }, [setFormData]);

  const handleSave = async (updatedData) => {
    // Perform save handles the mode (Add/Edit) automatically via useERPMode
    const response = await performSave("allocation_id", updatedData);
    if (response?.success) {
      showToast({ icon: "success", title: "Allocation Saved" });
      await loadAllocations();
    }
  };

  useEffect(() => { loadAllocations(); }, []); 
  
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex(item => item.allocation_id === row.allocation_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

 
  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete allocation for "${row.employee_name}"?` });
    if (confirmed) {
      const res = await deleteAllocation(row.allocation_id);
      if (res.success) {
        showToast({ icon: "success", title: "Allocation Removed" });
        loadAllocations();
        setShowForm(false);
      }
    }
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew: handleAdd,
      onSave: handleSave,
      onEsc: () => setShowForm(false),
    });
  }, [list, handleAdd, handleSave, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <ShiftAllocationForm
          initialData={formData} 
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
        />
      ) : (
        <div className="p-4 bg-slate-50 h-full">
          <Table
            title="Employee Shift Allocations"
            data={list}
            columns={columns}
            rowKey="allocation_id"
            loading={loading}
            onAdd={rights.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default ShiftAllocation;
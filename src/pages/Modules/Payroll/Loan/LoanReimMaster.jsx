import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import LoanReimMasterForm  from "./LoanReimMasterForm";

import {
  confirmDelete,
  showToast,
} from "../../../../components/Reusable/alert";

import { setERPHandlers } from "../../../../utils/erpShortcuts";

import {
  getLoanReimbursement,
  createLoanReimbursement,
  updateLoanReimbursement,
  deleteLoanReimbursement,
} from "../../../../utils/api";

const initialState = {
  id: null,

  employee_id: "",
  employee_name: "",

  master_type: "",

  request_name: "",

  amount: "",

  effective_from: "",
  effective_to: "",

  remarks: "",
};

const columns = [
  { key: "employee_name", label: "Employee Name" },

  { key: "master_type", label: "Master Type" },

  { key: "request_name", label: "Request Name" },

  { key: "amount", label: "Amount" },

  { key: "effective_from", label: "Effective From" },

  { key: "effective_to", label: "Effective To" },
];

const LoanReimMaster = ({ tab }) => {
      const [list, setList] = useState([]);

  const [loading, setLoading] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const res = await getLoanReimbursement();

      setList(res.data || []);
    } catch (err) {
      console.error(err);
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
      data.id
        ? await updateLoanReimbursement(data.id, data)
        : await createLoanReimbursement(data),

    loadData,

    tab.appl_name
  );

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (targetTab) => {
    if (targetTab === "search") {
      setShowForm(false);
    }

    if (targetTab === "entry") {
      setShowForm(true);
    }
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex((item) => item.id === row.id);

    if (index !== -1) {
      setCurrentIndex(index);
    }

    handleView(row);
  };

  const handleSave = async (updatedData = formData) => {
    if (!updatedData.employee_id) {
      showToast({
        icon: "error",
        title: "Please select employee",
      });

      return;
    }

    const response = await performSave(
      "id",
      updatedData
    );

    if (response?.success) {
      showToast({
        icon: "success",
        title: "Saved Successfully",
      });

      await loadData();
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete "${row.request_name}" ?`,
    });

    if (!confirmed) return;

    await deleteLoanReimbursement(row.id);

    showToast({
      icon: "success",
      title: "Deleted Successfully",
    });

    loadData();
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) =>
          Math.min(p + 1, list.length - 1)
        ),

      onPrevRecord: () =>
        setCurrentIndex((p) =>
          Math.max(p - 1, 0)
        ),

      onNew: handleAdd,

      onSave: handleSave,

      onEsc: () => setShowForm(false),

      onBackspaceNavigation: true,
    });
  }, [list, handleAdd, handleSave]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <LoanReimMasterForm
          initialData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onDelete={handleDelete}
          mode={mode}
          saving={saving}
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={
            list.length > 0
              ? currentIndex + 1
              : 0
          }
          totalRecords={list.length}
          rights={rights}
          onEditCancel={handleEditCancel}
          activeTab="entry"
          onTabChange={handleTabChange}
        />
      ) : (
        <div className="p-4 bg-slate-50 h-full">
          <Table
            title="Loan / Reimbursement Master"
            data={list}
            columns={columns}
            rowKey="id"
            loading={loading}
            onAdd={
              rights.add === 1
                ? handleAdd
                : null
            }
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default LoanReimMaster;
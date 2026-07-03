import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import ApprovalWorkflowForm from "./Approvalworkflowform";
import {
  alertError,
  confirmDelete,
  showToast,
} from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import {
  getApprovalWorkflow,
  createApprovalWorkflow,
  updateApprovalWorkflow,
  deleteApprovalWorkflow,
} from "../../../../utils/api";

// ── Initial state ────────────────────────────────────────────────────────────
const initialState = {
  workflow_id:    null,
  applicable_to:  "",
  applicable_id:  null,
  leave_type_id:  null,
  leave_name:     "",
  level_no:       "",
  approver_role:  "",
  approver_id:    null,
  approver_name:  "",
  is_active:      true,
};

// ── Table columns ────────────────────────────────────────────────────────────
const columns = [
  { key: "applicable_to",  label: "Applicable To"  },
  { key: "leave_name",     label: "Leave Type",
    render: row => row.leave_name || <span className="text-gray-600 ">All Leave Types</span>
  },
  { key: "level_no",       label: "Level",
    render: row => (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[12px] font-bold">
        {row.level_no}
      </span>
    )
  },
  { key: "approver_role",  label: "Approver Role"  },
  { key: "approver_name",  label: "Specific Approver",
    render: row => row.approver_name || <span className="text-gray-600 ">Role-based</span>
  },
  { key: "is_active",      label: "Status",
    render: row => (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
        row.is_active
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-600"
      }`}>
        {row.is_active ? "Active" : "Inactive"}
      </span>
    )
  },
];

// ── Main component ───────────────────────────────────────────────────────────
const ApprovalWorkflow = ({ tab }) => {
  const [list, setList]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ── Load data ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getApprovalWorkflow();
      setList(res?.data || []);
    } catch (err) {
      console.error("ApprovalWorkflow load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── ERP Mode hook ──────────────────────────────────────────────────────
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
      data.workflow_id
        ? await updateApprovalWorkflow(data.workflow_id, data)
        : await createApprovalWorkflow(data),
    loadData,
    tab?.appl_name
  );

  useEffect(() => {
    loadData();
  }, []);

  // ── Tab switch ─────────────────────────────────────────────────────────
  const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry")  setShowForm(true);
  };

  // ── Row select ─────────────────────────────────────────────────────────
const handleRowSelect = (row) => {
  const index = list.findIndex(item => item.workflow_id === row.workflow_id);
  if (index !== -1) setCurrentIndex(index);
  handleView(row);
  setShowForm(true);  // ✅ add karo
};


  // ── Save ───────────────────────────────────────────────────────────────
const handleSave = async (updatedData = formData) => {
  if (!updatedData.applicable_to) {
    showToast({ icon: "error", title: "Please select Applicable To" });
    return;
  }
  if (!updatedData.approver_role) {
    showToast({ icon: "error", title: "Please select Approver Role" });
    return;
  }
  if (!updatedData.level_no) {
    showToast({ icon: "error", title: "Please select Approval Level" });
    return;
  }

  const response = await performSave("workflow_id", updatedData);

  if (response?.success) {
    showToast({ icon: "success", title: "Workflow rule saved successfully" });
    
    const freshRes = await getApprovalWorkflow();
    const freshList = freshRes?.data || [];
    setList(freshList);  // ✅ list bhi update karo

    // ✅ workflow_id — edit mode mein updatedData se, add mein last record
    const savedId = updatedData.workflow_id;
    
    let freshRecord;
    if (savedId) {
      freshRecord = freshList.find(r => r.workflow_id === savedId);
    } else {
      // Add mode — last inserted record
      freshRecord = freshList[freshList.length - 1];
    }

    if (freshRecord) {
      handleView(freshRecord);
    }
  }
};

  // ── Delete ─────────────────────────────────────────────────────────────
const handleDelete = async (row) => {
  const confirmed = await confirmDelete({
    title: `Delete workflow rule for "${row.approver_role}" — Level ${row.level_no}?`,
  });
  if (!confirmed) return;

  try {
    const res = await deleteApprovalWorkflow(row.workflow_id);
    if (res?.success) {
      showToast({ icon: "success", title: "Deleted" });
      setShowForm(false);
      loadData();
    } else {
      // ✅ Backend ka message dikhao
      alertError("Cannot Delete", res?.message || "This workflow could not be deleted.");
    }
  } catch (err) {
    alertError("Cannot Delete", err?.response?.data?.message || "This workflow is in use and cannot be deleted.");
  }
};

 const handleDeleteMultiple = async (selected) => {
    // Normalize: Table may pass an array of row objects OR an array of keys
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.workflow_id : item
    );

    if (ids.length === 0) return;

    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} Approval(s)?`,
    });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteApprovalWorkflow(id)));
      const failed = results.filter((r) => !r?.success).length;

      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else { 
          
          
      }
      loadData();
      setShowForm(false);
    }  catch (err) {
        alertError("Cannot Delete", err?.response?.data?.message || "This workflow is in use and cannot be deleted.");
  
  // Check if backend sent the foreign key error message
  if (err?.message?.includes("REFERENCE") || err?.message?.includes("conflicted")) {
    alertError(
      "Cannot Delete", 
      "Some workflows cannot be deleted because they are currently being used in active transactions."
    );
  } else {
    alertError("Delete Error", "An unexpected error occurred during batch deletion.");
  }
}
  };

    useEffect(() => {
    if (list.length > 0 && showForm) {
      handleView(list[currentIndex]);
    }
  }, [currentIndex, list, showForm]);
  // ── ERP Shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew:        handleAdd,
      onSave:       handleSave,
      onEsc:        () => setShowForm(false),
      onBackspaceNavigation: true,
    });
  }, [list, handleAdd, handleSave, setShowForm]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="h-full w-full">
      {showForm ? (
        <ApprovalWorkflowForm
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
           activeTab="search"
          onTabChange={handleTabChange}
            title="Approval Workflow"
            data={list}
            onDeleteMultiple={handleDeleteMultiple}
            columns={columns}
            rowKey="workflow_id"
            loading={loading}
            onAdd={rights?.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflow;
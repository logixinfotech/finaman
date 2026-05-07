import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import LeaveRequestForm from "./LeaveRequestForm";
import { confirmDelete, showToast } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { getLeaveRequests, createLeaveRequest, updateLeaveRequest, deleteLeaveRequest,} from "../../../../utils/api";

// ── Initial state matches form fields ──────────────────────
const initialState = {
    request_id: null,
    employee_id: "",
    employee_name: "",
    leave_type_id: "",
    leave_name: "",
    from_date: "",
    to_date: "",
    total_days: "",
    reason: "",
    status: "PENDING",
    approved_by: null,
    approved_by_name: "",
    approved_at: "",
};

// ── Table columns ───────────────────────────────────────────
const columns = [
    { key: "employee_name", label: "Employee Name" },
    { key: "leave_name", label: "Leave Type" },
    {
  key: "from_date",
  label: "From Date",
  render: (row) =>
    row.from_date
      ? new Date(row.from_date).toLocaleDateString("en-CA")
      : "",
},

{
  key: "to_date",
  label: "To Date",
  render: (row) =>
    row.to_date
      ? new Date(row.to_date).toLocaleDateString("en-CA")
      : "",
},
    { key: "total_days", label: "Days" },
    {
        key: "status",
        label: "Status",
        render: (row) => {
            const color =
                row.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    row.status === "REJECTED" ? "bg-red-100 text-red-600" :
                        "bg-yellow-100 text-yellow-700";
            return (
                <span className={`px-2 py-1 text-xs rounded font-medium ${color}`}>
                    {row.status}
                </span>
            );
        },
    },
    { key: "approved_by_name", label: "Approved By" },
];

// ── Main Component ──────────────────────────────────────────
const LeaveRequestMaster = ({ tab }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // ── Load all requests ─────────────────────────────────────
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getLeaveRequests();
            setList(res.data || []);
        } catch (err) {
            console.error("LeaveRequest load error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── ERP Mode hook ─────────────────────────────────────────
    const {
        mode,
        formData, setFormData,
        showForm, setShowForm,
        saving, handleEditCancel,
        handleView, handleAdd, handleModify, performSave, rights,
    } = useERPMode(
        initialState,
        async (data) =>
            data.request_id
                ? await updateLeaveRequest(data.request_id, data)
                : await createLeaveRequest(data),
        loadData,
        tab?.appl_name
    );

    useEffect(() => { loadData(); }, []);

    const handleTabChange = (targetTab) => {
        if (targetTab === "search") setShowForm(false);
        if (targetTab === "entry") setShowForm(true);
    };

    const handleRowSelect = (row) => {
        const index = list.findIndex((item) => item.request_id === row.request_id);
        if (index !== -1) setCurrentIndex(index);
        handleView(row);
    };

    // ── Save (new request) ────────────────────────────────────
    const handleSave = async (updatedData = formData) => {
        if (!updatedData.employee_id) {
            showToast({ icon: "error", title: "Please select an employee" });
            return;
        }
        if (!updatedData.leave_type_id) {
            showToast({ icon: "error", title: "Please select leave type" });
            return;
        }
        if (!updatedData.from_date || !updatedData.to_date) {
            showToast({ icon: "error", title: "Please select from and to dates" });
            return;
        }

        const response = await performSave("request_id", updatedData);

        if (response?.success) {
            showToast({ icon: "success", title: "Leave Request Submitted!" });
            await loadData();
        }
    };

    const handleDelete = async (row) => {
        if (row.status !== "PENDING") {
            showToast({ icon: "error", title: "Only PENDING requests can be deleted" });
            return;
        }
        const confirmed = await confirmDelete({
            title: `Delete leave request for "${row.employee_name}"?`,
        });
        if (!confirmed) return;

        const res = await deleteLeaveRequest(row.request_id);
        if (res?.success) {
            showToast({ icon: "success", title: "Deleted" });
            loadData();
            setShowForm(false);
        }
    };

    // ── ERP keyboard shortcuts ────────────────────────────────
    useEffect(() => {
        setERPHandlers({
            onNextRecord: () => setCurrentIndex((p) => Math.min(p + 1, list.length - 1)),
            onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
            onNew: handleAdd,
            onSave: handleSave,
            onEsc: () => setShowForm(false),
        });
    }, [list, handleAdd, handleSave, setShowForm]);

    return (
        <div className="h-full w-full">
            {showForm ? (
                <LeaveRequestForm
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
                />
            ) : (
                <div className="p-4 bg-slate-50 h-full">
                    <Table
                        title="Leave Request"
                        data={list}
                        columns={columns}
                        rowKey="request_id"
                        loading={loading}
                        onAdd={rights?.add === 1 ? handleAdd : null}
                        onRowDoubleClick={handleRowSelect}
                    />
                </div>
            )}
        </div>
    );
};

export default LeaveRequestMaster;
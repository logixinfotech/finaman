 
import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import LeaveRequestForm from "./LeaveRequestForm";
import { alertError, confirmDelete, showToast } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { getLeaveRequests, createLeaveRequest, updateLeaveRequest, deleteLeaveRequest } from "../../../../utils/api";

const initialState = {
    request_id:       null,
    employee_id:      "",
    employee_name:    "",
    leave_type_id:    "",
    leave_name:       "",
    from_date:        "",
    to_date:          "",
    total_days:       "",
    reason:           "",
    status:           "PENDING",
    approved_by:      null,
    approved_by_name: "",
    approved_at:      "",
};

const columns = [
    { key: "employee_name", label: "Employee Name" },
    { key: "leave_name",    label: "Leave Type"    },
    { key: "from_date", label: "From Date",
      render: row => row.from_date ? new Date(row.from_date).toLocaleDateString("en-CA") : "" },
    { key: "to_date", label: "To Date",
      render: row => row.to_date ? new Date(row.to_date).toLocaleDateString("en-CA") : "" },
    { key: "total_days", label: "Days" },
    { key: "status", label: "Status",
      render: row => {
        const color = row.status === "APPROVED" ? "bg-green-100 text-green-700"
                    : row.status === "REJECTED" ? "bg-red-100 text-red-600"
                    : "bg-yellow-100 text-yellow-700";
        return <span className={`px-2 py-1 text-xs rounded font-medium ${color}`}>{row.status}</span>;
      }
    },
    { key: "approved_by_name", label: "Approved By" },
];

const LeaveRequestMaster = ({ tab }) => {
    const [list,         setList]         = useState([]);
    const [loading,      setLoading]      = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const {
        mode,
        formData, setFormData,
        showForm, setShowForm,
        saving, handleEditCancel,
        handleView, handleAdd, handleModify, performSave, rights,
    } = useERPMode(
        initialState,
        async (data) => data.request_id
            ? await updateLeaveRequest(data.request_id, data)
            : await createLeaveRequest(data),
        () => {}, // ✅ empty — handleSave khud reload + setFormData control karta hai
        tab?.appl_name
    );

    // ✅ returns fresh list — handleSave uses it
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getLeaveRequests();
            const finalData = res?.data || [];
            setList(finalData);
            return finalData; // ✅ handleSave needs this
        } catch (err) {
            console.error("LeaveRequest load error:", err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, []);

    // ✅ next/prev navigation sync — handleView hataya (race condition tha)
    useEffect(() => {
        if (showForm && mode === "view" && list.length > 0) {
            setFormData(list[currentIndex]);
        }
    }, [currentIndex, list, showForm, mode, setFormData]);

    const handleTabChange = (targetTab) => {
        if (targetTab === "search") setShowForm(false);
        if (targetTab === "entry")  setShowForm(true);
    };

    const handleRowSelect = (row) => {
        const index = list.findIndex(item => item.request_id === row.request_id);
        if (index !== -1) setCurrentIndex(index);
        handleView(row);
    };

    // ✅ clean handleSave — fresh list se sahi record dhundho, sirf setFormData karo
    const handleSave = async (updatedData = formData) => {
        if (!updatedData.employee_id) {
            showToast({ icon: "error", title: "Please select an employee" });
            return;
        }
        if (!updatedData.leave_type_id && (!updatedData.split_requests || updatedData.split_requests.length === 0)) {
            showToast({ icon: "error", title: "Please select leave type" });
            return;
        }
        if (!updatedData.from_date || !updatedData.to_date) {
            showToast({ icon: "error", title: "Please select from and to dates" });
            return;
        }

        const dataToSave = {
            ...updatedData,
            request_id: updatedData.request_id ?? formData.request_id,
        };

        const response = await performSave("request_id", dataToSave);

        if (response?.success) {
            const isSplit = Array.isArray(updatedData.split_requests) && updatedData.split_requests.length > 1;
            showToast({ 
                icon: "success", 
                title: isSplit ? `${updatedData.split_requests.length} Leave Requests Created (Paid & Unpaid)!` : "Leave Request Submitted!" 
            });

            const freshList = await loadData();

            // Edit: existing request_id
            // Add:  server ne uuidv4() generate karke payload mein return kiya — response.data.request_id
            const savedId = dataToSave.request_id || response?.data?.request_id;

            let newIndex = -1;
            if (savedId) {
                // UUID case mismatch fix: DB UPPERCASE return karta hai, server lowercase
                newIndex = freshList.findIndex(r =>
                    String(r.request_id).toLowerCase() === String(savedId).toLowerCase()
                );
            }

            // Fallback — latest record
            if (newIndex === -1 && freshList.length > 0) newIndex = 0;

            if (newIndex !== -1) {
                setCurrentIndex(newIndex);
                setFormData({ ...freshList[newIndex] });
            }
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

    // ✅ BUG FIX: item.employee_name tha — delete API ko naam bheja jaa raha tha ID ki jagah
    const handleDeleteMultiple = async (selected) => {
        const ids = (selected || []).map(item =>
            typeof item === "object" ? item.request_id : item
        );
        if (ids.length === 0) return;

        const confirmed = await confirmDelete({
            title: `Delete ${ids.length} leave(s)?`,
        });
        if (!confirmed) return;

        try {
            const results = await Promise.all(ids.map(id => deleteLeaveRequest(id)));
            const failed = results.filter(r => !r?.success).length;
            if (failed === 0) {
                showToast({ icon: "success", title: `${ids.length} deleted` });
            } else {
                showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed` });
            }
            loadData();
            setShowForm(false);
        } catch (err) {
            alertError("Delete Error", "Failed to delete some leave requests");
        }
    };

    useEffect(() => {
        setERPHandlers({
            onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
            onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
            onNew:  handleAdd,
            onSave: () => handleSave(formData),
            onEsc:  () => setShowForm(false),
        });
    }, [list, handleAdd, formData, setShowForm]);

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
                    onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
                    onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
                />
            ) : (
                <div className=" bg-slate-50 h-full">
                    <Table
                        onDeleteMultiple={handleDeleteMultiple}
                        activeTab="search"
                        onTabChange={handleTabChange}
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
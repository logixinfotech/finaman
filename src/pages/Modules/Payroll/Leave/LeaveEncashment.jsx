import { useEffect, useState, useCallback } from "react";
import { useERPMode }  from "../../../../components/Reusable/form/useFormMode";
import Table           from "../../../../components/Reusable/table/Table";
import LeaveEncashmentForm from "./LeaveEncashmentForm";
import { confirmDelete, showToast } from "../../../../components/Reusable/alert";
import { setERPHandlers }          from "../../../../utils/erpShortcuts";
import {
  getLeaveEncashments, createLeaveEncashment,
  updateLeaveEncashment, deleteLeaveEncashment,
} from "../../../../utils/api";

const initialState = {
  encashment_id:   null,
  employee_id:     null,
  employee_name:   "",
  leave_type_id:   "",
  leave_name:      "",
  financial_year:  String(new Date().getFullYear()),
  days_encashed:   "",
  rate_per_day:    "",
  total_amount:    "",
  encashment_date: "",
  status:          "Pending",
  remarks:         "",
  paid_in_payroll: false,
};

const columns = [
  { key: "employee_name",  label: "Employee"       },
  { key: "leave_name",     label: "Leave Type"     },
  { key: "financial_year", label: "Year"           },
  { key: "days_encashed",  label: "Days Encashed"  },
  { key: "rate_per_day",   label: "Rate/Day"       },
  { key: "total_amount",   label: "Total Amount",
    render: row => row.total_amount
      ? `₹ ${parseFloat(row.total_amount).toLocaleString("en-IN")}` : "—"
  },
  { key: "encashment_date", label: "Date",
    render: row => row.encashment_date
      ? new Date(row.encashment_date).toLocaleDateString() : "—"
  },
  { key: "status",          label: "Status",
    render: row => (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
        row.status === "Paid"     ? "bg-green-100 text-green-700"
        : row.status === "Approved" ? "bg-blue-100 text-blue-700"
        : "bg-yellow-100 text-yellow-700"
      }`}>{row.status}</span>
    )
  },
  { key: "paid_in_payroll", label: "In Payroll",
    render: row => row.paid_in_payroll
      ? <span className="text-green-600 font-medium">✓ Yes</span>
      : <span className="text-gray-400">No</span>
  },
];

const LeaveEncashment = ({ tab }) => {
  const [list, setList]                 = useState([]);
  const [loading, setLoading]           = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLeaveEncashments();
      setList(res?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const { mode, formData, setFormData, showForm, setShowForm, saving,
    handleEditCancel, handleView, handleAdd, handleModify, performSave, rights,
  } = useERPMode(
    initialState,
    async (data) => data.encashment_id
      ? await updateLeaveEncashment(data.encashment_id, data)
      : await createLeaveEncashment(data),
    loadData, tab?.appl_name
  );

  useEffect(() => { loadData(); }, []);

  const handleTabChange = t => {
    if (t === "search") setShowForm(false);
    if (t === "entry")  setShowForm(true);
  };

  const handleRowSelect = row => {
    const index = list.findIndex(i => i.encashment_id === row.encashment_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData = formData) => {
    if (!updatedData.employee_id)  { showToast({ icon: "error", title: "Please select Employee" });   return; }
    if (!updatedData.leave_type_id){ showToast({ icon: "error", title: "Please select Leave Type" }); return; }
    if (!updatedData.days_encashed){ showToast({ icon: "error", title: "Enter Days to Encash" });     return; }
    const response = await performSave("encashment_id", updatedData);
    if (response?.success) {
      showToast({ icon: "success", title: "Encashment saved & balance updated" });
      await loadData();
    }
  };

  const handleDelete = async row => {
    const confirmed = await confirmDelete({
      title: `Delete encashment for "${row.employee_name}"?`
    });
    if (!confirmed) return;
    await deleteLeaveEncashment(row.encashment_id);
    showToast({ icon: "success", title: "Deleted" });
    setShowForm(false);
    loadData();
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew: handleAdd, onSave: handleSave, onEsc: () => setShowForm(false),
    });
  }, [list, handleAdd, handleSave, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <LeaveEncashmentForm
          initialData={formData} setFormData={setFormData}
          onSave={handleSave} onCancel={() => setShowForm(false)}
          onDelete={handleDelete} mode={mode} saving={saving}
          onModify={handleModify} onNewEntry={handleAdd}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
          totalRecords={list.length} rights={rights}
          onEditCancel={handleEditCancel} activeTab="entry" onTabChange={handleTabChange}
        />
      ) : (
        <div className="p-4 bg-slate-50 h-full">
          <Table title="Leave Encashment Entry" data={list} columns={columns}
            rowKey="encashment_id" loading={loading}
            onAdd={rights?.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect} />
        </div>
      )}
    </div>
  );
};

export default LeaveEncashment;
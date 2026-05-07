import { useEffect, useState, useCallback } from "react";
import { useERPMode }  from "../../../../components/Reusable/form/useFormMode";
import Table           from "../../../../components/Reusable/table/Table";
import LeaveAccrualForm from "./LeaveAccrualForm";
import { confirmDelete, showToast } from "../../../../components/Reusable/alert";
import { setERPHandlers }          from "../../../../utils/erpShortcuts";
import {
  getLeaveAccruals, createLeaveAccrual,
  updateLeaveAccrual, deleteLeaveAccrual,
} from "../../../../utils/api";

const initialState = {
  accrual_id:     null,
  employee_id:    null,
  employee_name:  "",
  leave_type_id:  "",
  leave_name:     "",
  financial_year: String(new Date().getFullYear()),
  accrual_type:   "",
  accrual_days:   "",
  carry_forward:  "",
  total_accrued:  "",
  accrual_date:   "",
  remarks:        "",
};

const columns = [
  { key: "employee_name",  label: "Employee"       },
  { key: "leave_name",     label: "Leave Type"     },
  { key: "financial_year", label: "Year"           },
  { key: "accrual_type",   label: "Accrual Type",
    render: row => (
      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
        {row.accrual_type}
      </span>
    )
  },
  { key: "accrual_days",   label: "Accrual Days"   },
  { key: "carry_forward",  label: "Carry Forward"  },
  { key: "total_accrued",  label: "Total Accrued"  },
  { key: "accrual_date",   label: "Accrual Date",
    render: row => row.accrual_date
      ? new Date(row.accrual_date).toLocaleDateString() : "—"
  },
];

const LeaveAccrual = ({ tab }) => {
  const [list, setList]                 = useState([]);
  const [loading, setLoading]           = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLeaveAccruals();
      setList(res?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const { mode, formData, setFormData, showForm, setShowForm, saving,
    handleEditCancel, handleView, handleAdd, handleModify, performSave, rights,
  } = useERPMode(
    initialState,
    async (data) => data.accrual_id
      ? await updateLeaveAccrual(data.accrual_id, data)
      : await createLeaveAccrual(data),
    loadData, tab?.appl_name
  );

  useEffect(() => { loadData(); }, []);

  const handleTabChange = t => {
    if (t === "search") setShowForm(false);
    if (t === "entry")  setShowForm(true);
  };

  const handleRowSelect = row => {
    const index = list.findIndex(i => i.accrual_id === row.accrual_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData = formData) => {
    if (!updatedData.employee_id)  { showToast({ icon: "error", title: "Please select Employee" });    return; }
    if (!updatedData.leave_type_id){ showToast({ icon: "error", title: "Please select Leave Type" });  return; }
    if (!updatedData.accrual_days) { showToast({ icon: "error", title: "Enter Accrual Days" });        return; }
    const response = await performSave("accrual_id", updatedData);
    if (response?.success) {
      showToast({ icon: "success", title: "Accrual saved & leave balance updated" });
      await loadData();
    }
  };

  const handleDelete = async row => {
    const confirmed = await confirmDelete({
      title: `Delete accrual for "${row.employee_name}"?`
    });
    if (!confirmed) return;
    await deleteLeaveAccrual(row.accrual_id);
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
        <LeaveAccrualForm
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
          <Table title="Leave Accrual & Carry Forward" data={list} columns={columns}
            rowKey="accrual_id" loading={loading}
            onAdd={rights?.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect} />
        </div>
      )}
    </div>
  );
};

export default LeaveAccrual;
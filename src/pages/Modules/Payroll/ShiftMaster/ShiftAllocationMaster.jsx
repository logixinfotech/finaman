import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import ShiftAllocationForm from "./ShiftAllocationForm";
import {
  fetchAllocations, deleteAllocation, createAllocation,
  updateAllocation, getActledList,
} from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const initialState = {
  allocation_id: null, employee_id: "", employee_name: "",
  shift_id: "", shift_name: "", allocation_from: "", allocation_to: "", remarks: "",
};

const columns = [
 {
  key: "employee_name",
  label: "Employee Name",
  render: (row) => {
    const parts = [
      row.Led_name || row.employee_name || "",
      row.Middle_name || "",
      row.Led_alias || "",
    ].filter(Boolean);
    return parts.join(" ");
  }
},
  { key: "shift_name",      label: "Shift Name"    },
  { key: "allocation_from", label: "From Date", render: r => r.allocation_from?.split("T")[0] || "" },
  { key: "allocation_to",   label: "To Date",   render: r => r.allocation_to?.split("T")[0]   || "" },
];

// ── Inline confirm modal ───────────────────────────────────────────────────
const confirmUpdate = (names) =>
  new Promise(resolve => {
    const modal = document.createElement("div");
    modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:'Inter',system-ui,sans-serif";
    modal.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:28px 24px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.15)">
        <div style="width:52px;height:52px;border-radius:50%;background:#FEF3C7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px">⚠️</div>
        <h3 style="font-size:16px;font-weight:700;color:#1f2937;margin-bottom:10px">Update Shift Allocation?</h3>
        <p style="font-size:13px;color:#6b7280;line-height:1.6;margin-bottom:20px">
          <strong style="color:#374151">${names}</strong> already ${names.includes(",") ? "have" : "has"} a shift assigned in this date range. Do you want to update ${names.includes(",") ? "them" : "it"}?
        </p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button id="sa-cancel" style="height:36px;padding:0 20px;border-radius:8px;border:1px solid #d1d5db;background:#fff;color:#374151;font-size:13px;font-weight:500;cursor:pointer">Cancel</button>
          <button id="sa-confirm" style="height:36px;padding:0 20px;border-radius:8px;border:none;background:#185FA5;color:#fff;font-size:13px;font-weight:600;cursor:pointer">Yes, Update</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector("#sa-confirm").onclick = () => { document.body.removeChild(modal); resolve(true); };
    modal.querySelector("#sa-cancel").onclick  = () => { document.body.removeChild(modal); resolve(false); };
  });

// ── Main Component ─────────────────────────────────────────────────────────
const ShiftAllocation = ({ tab }) => {
  const [list,         setList]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [employees,    setEmployees]    = useState([]);

  const {
    mode, formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights
  } = useERPMode(
    initialState,
    async (data, isEdit) => isEdit
      ? await updateAllocation(data.allocation_id, data)
      : await createAllocation(data),
    () => {},
    tab.appl_name
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllocations();
      const raw = Array.isArray(res) ? res : res?.data || res?.data?.data || res?.result || [];
      const mapped = raw.map(item => ({ ...item, status_text: item.is_approved ? "Approved" : "Pending" }));
      setList(mapped);
      return mapped;
    } catch (err) {
      alertError("Fetch Error", "Failed to load shift allocations");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    (async () => {
      const data = await getActledList();
      setEmployees(Array.isArray(data) ? data : data?.data || []);
    })();
  }, []);

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) setFormData(list[currentIndex]);
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleSave = async (updatedData = formData) => {
    const employeeIds = updatedData.employee_ids || [updatedData.employee_id];
    if (!employeeIds.length || !employeeIds[0]) {
      showToast({ icon: "error", title: "Please select at least one employee" });
      return;
    }

    // ✅ Check overlap for all selected employees at once
    const overlapping = employeeIds.filter(empId => {
      return list.some(item => {
        if (Number(item.employee_id) !== Number(empId)) return false;
        if (item.allocation_id === updatedData.allocation_id) return false;
        const existFrom = item.allocation_from?.split("T")[0] || "0000-01-01";
        const existTo   = item.allocation_to?.split("T")[0]   || "9999-12-31";
        const newFrom   = updatedData.allocation_from || "0000-01-01";
        const newTo     = updatedData.allocation_to   || "9999-12-31";
        return newFrom <= existTo && newTo >= existFrom;
      });
    });

    if (overlapping.length > 0) {
      const names = overlapping
        .map(id => employees.find(e => Number(e.Actled_id) === Number(id))?.Led_name)
        .filter(Boolean).join(", ");
      const ok = await confirmUpdate(names);
      if (!ok) return;
    }

    try {
      let saved = 0;
      for (const empId of employeeIds) {
        const payload = { ...updatedData, employee_id: empId, employee_ids: undefined };
        const res = await performSave("allocation_id", payload);
        if (res?.success) saved++;
      }
      if (saved > 0) {
        showToast({ icon: "success", title: employeeIds.length > 1 ? `Shift assigned to ${saved} employees` : "Saved Successfully" });
        const fresh = await loadData();
        const idx = fresh.findIndex(i =>
          i.employee_id === updatedData.employee_id &&
          i.shift_id    === updatedData.shift_id    &&
          i.allocation_from === updatedData.allocation_from
        );
        if (idx !== -1) { setCurrentIndex(idx); setFormData({ ...fresh[idx] }); }
      }
    } catch (err) {
      showToast({ icon: "error", title: "Save failed" });
    }
  };

  const handleTabChange = (t) => {
    if (t === "search") setShowForm(false);
    if (t === "entry")  setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const idx = list.findIndex(i => i.allocation_id === row.allocation_id);
    if (idx !== -1) setCurrentIndex(idx);
    handleView(row);
  };

  const handleDelete = async (row) => {
    const ok = await confirmDelete({ title: `Delete allocation for "${row.employee_name}"?` });
    if (!ok) return;
    const res = await deleteAllocation(row.allocation_id);
    if (res?.success) { showToast({ icon: "success", title: "Deleted" }); loadData(); setShowForm(false); }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map(i => typeof i === "object" ? i.allocation_id : i);
    if (!ids.length) return;
    const ok = await confirmDelete({ title: `Delete ${ids.length} Shift Allocation(s)?` });
    if (!ok) return;
    try {
      const results = await Promise.all(ids.map(id => deleteAllocation(id)));
      const failed = results.filter(r => !r?.success).length;
      showToast({ icon: failed ? "warning" : "success", title: failed ? `${ids.length - failed} deleted, ${failed} failed` : `${ids.length} deleted` });
      loadData(); setShowForm(false);
    } catch { alertError("Delete Error", "Failed to delete some records"); }
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew: handleAdd,
      onSave: () => handleSave(formData),
      onEsc: () => setShowForm(false),
    });
  }, [list, handleAdd, formData, setShowForm]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <ShiftAllocationForm
          initialData={formData}
          localData={formData}
          setLocalData={setFormData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onDelete={handleDelete}
          mode={mode} saving={saving}
          onModify={handleModify} onNewEntry={handleAdd}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
          totalRecords={list.length} rights={rights}
          onEditCancel={handleEditCancel}
          activeTab="entry" onTabChange={handleTabChange}
          onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
        />
      ) : (
        <div className="bg-slate-50 h-full">
          <Table
            title="Employee Shift Allocations"
            activeTab="search" onTabChange={handleTabChange}
            data={list} columns={columns} rowKey="allocation_id"
            loading={loading}
            onDeleteMultiple={handleDeleteMultiple}
            onAdd={rights.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default ShiftAllocation;
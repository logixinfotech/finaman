import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import WeeklyOffMasterForm from "./WeeklyOffMasterForm";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { getWeekOff, createWeekOff, updateWeekOff, deleteWeekOff, getActledList } from "../../../../utils/api";

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
const [employees, setEmployees] = useState([]);
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

  useEffect(() => {
  (async () => {
    const data = await getActledList();
    setEmployees(Array.isArray(data) ? data : data?.data || []);
  })();
}, []);

  const handleRowSelect = (row) => {
    const index = list.findIndex(item => item.id === row.id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

const handleSave = async (updatedData = formData) => {
  const employeeIds = updatedData.employee_ids || [updatedData.employee_id];
  if (!employeeIds.length || !employeeIds[0]) {
    showToast({ icon: "error", title: "Please select at least one employee" });
    return;
  }

  // ✅ Pehle check karo — kaun kaun overlap kar raha hai
  const overlapping = employeeIds.filter(empId => {
    const existing = list.find(item =>
      Number(item.employee_id) === Number(empId) && item.id !== updatedData.id
    );
    if (!existing) return false;
    const existFrom = existing.effective_from?.split("T")[0] || "0000-01-01";
    const existTo   = existing.effective_to?.split("T")[0]   || "9999-12-31";
    const newFrom   = updatedData.effective_from || "0000-01-01";
    const newTo     = updatedData.effective_to   || "9999-12-31";
    return newFrom <= existTo && newTo >= existFrom;
  });

  // ✅ Agar koi overlap hai — ek hi popup sab ke liye
  if (overlapping.length > 0) {
    const names = overlapping
      .map(id => employees.find(e => Number(e.Actled_id) === Number(id))?.Led_name)
      .filter(Boolean).join(", ");

    const confirmed = await new Promise(resolve => {
      const modal = document.createElement("div");
      modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:'Inter',system-ui,sans-serif`;
      modal.innerHTML = `
        <div style="background:#fff;border-radius:14px;padding:28px 24px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.15)">
          <div style="width:52px;height:52px;border-radius:50%;background:#FEF3C7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px">⚠️</div>
          <h3 style="font-size:16px;font-weight:700;color:#1f2937;margin-bottom:10px">Update Weekly Off?</h3>
          <p style="font-size:13px;color:#6b7280;line-height:1.6;margin-bottom:20px">
            <strong style="color:#374151">${names}</strong> already ${overlapping.length > 1 ? "have" : "has"} a weekly off assigned in this date range. Do you want to update ${overlapping.length > 1 ? "them" : "it"}?
          </p>
          <div style="display:flex;gap:10px;justify-content:center">
            <button id="wo-cancel" style="height:36px;padding:0 20px;border-radius:8px;border:1px solid #d1d5db;background:#fff;color:#374151;font-size:13px;font-weight:500;cursor:pointer">Cancel</button>
            <button id="wo-confirm" style="height:36px;padding:0 20px;border-radius:8px;border:none;background:#185FA5;color:#fff;font-size:13px;font-weight:600;cursor:pointer">Yes, Update</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.querySelector("#wo-confirm").onclick = () => { document.body.removeChild(modal); resolve(true); };
      modal.querySelector("#wo-cancel").onclick  = () => { document.body.removeChild(modal); resolve(false); };
    });

    if (!confirmed) return;
  }

  // ✅ Save all
  try {
    let saved = 0;
    for (const empId of employeeIds) {
      const payload = { ...updatedData, employee_id: empId, employee_ids: undefined };
      const res = await performSave("id", payload);
      if (res?.success) saved++;
    }
    if (saved > 0) {
      showToast({ icon: "success", title: employeeIds.length > 1 ? `Week off saved for ${saved} employees` : "Saved Successfully" });
      await loadData();
    }
  } catch (err) {
    showToast({ icon: "error", title: "Save failed" });
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
    if (list.length > 0 && showForm) {
      handleView(list[currentIndex]);
    }
  }, [currentIndex, list, showForm]);
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
        <div className=" bg-slate-50 h-full">
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
import { useEffect, useState, useCallback } from "react";
import Table from "../Reusable/table/Table";
import HolidayMasterForm from "./HolidayMasterForm";
import { fetchHolidays, createHoliday, updateHoliday, deleteHoliday } from "../../utils/api";
import { confirmDelete, showToast, alertError } from "../Reusable/alert";
import { setERPHandlers } from "../../utils/erpShortcuts";
import { useERPMode } from "../Reusable/form/useFormMode";
import ERPPrintPreview from "../Reusable/ERPPrintPreview";

const initialState = {
  id: null,
  date: "",
  weekly_off: "",
  purpose: "",
  remarks: "",
};

const columns = [
  { key: "date", label: "Date" },
  { key: "purpose", label: "Purpose" },
  { key: "remarks", label: "Remarks" },
];
const holidayPrintSections = [
  {
    type: "fields",
    title: "Holiday Details",
    fields: [
      { label: "Date", key: "date" },
      { label: "Purpose", key: "purpose" },
      { label: "Remarks", key: "remarks" },
      { label: "Weekly Off", key: "weekly_off" },
      { label: "Off Code", key: "offcode" }
    ]
  }
];
const HolidayMaster = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);  
const [showPreview, setShowPreview] = useState(false);
  const [printData, setPrintData] = useState(null); 
  const onSuccess = () => {
    loadData();
    setShowForm(false);
  };

  const {
    mode,
    formData,
    setFormData,
    showForm,
    setShowForm,
    saving,
    handleView,
    handleAdd,
    canPrint,
    handleModify,
    performSave,
    rights = {},
    handleEditCancel,
  } = useERPMode(
    initialState,
    async (data, isEdit) => { 
      return isEdit ? await updateHoliday(data.id, data) : await createHoliday(data);
    },
    onSuccess, 
    tab?.appl_name
  );
 
  const loadData = useCallback(async (search = "") => {
    try { 
      const response = await fetchHolidays(); 
        
      if (Array.isArray(response)) {
        setList(response);
        setTotalRecords(response.length);  
      } else {
        setList([]);
      }
    } catch (err) {
      alertError("Error", "Failed to load holiday data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Row Selection Sync
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode]);

  const handleRowSelect = (row) => {
    const index = list.findIndex((i) => i.id === row.id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  // ✅ Save Logic with explicit Validation
  const handleSave = async () => {
    if (!formData.date || !formData.purpose) {
      alertError("Validation", "Date and Purpose are required");
      return;
    }

    const res = await performSave("id"); // "id" matches H_id in your backend mapping
    if (res?.success) {
      showToast({ icon: "success", title: "Holiday Saved Successfully" });
      // onSuccess handle refresh via useERPMode
    }
  };
const handlePrint = (row) => {
    setPrintData(row || formData);
    setShowPreview(true);
  };
  const handleDelete = async (row) => {
    const confirm = await confirmDelete({
      title: `Delete holiday on ${row.date}?`,
    });

    if (confirm) {
      const res = await deleteHoliday(row.id);
      if (res?.success) {
        showToast({ icon: "success", title: "Deleted Successfully" });
        loadData();
        setShowForm(false);
      }
    }
  };

useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex((p) => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
      onNew: () => (rights?.add === 1) && handleAdd(),
      onSave: handleSave,
      onPrint: handlePrint, // Shortcut for printing
      onEsc: () => {
        if (showPreview) setShowPreview(false);
        else setShowForm(false);
      },
    });
  }, [list, rights, handleAdd, handleSave, showPreview]);
return (
    <div>
      {showPreview ? (
        /* 🖨️ Print Preview Render */
        <ERPPrintPreview
          title="Holiday Details"
          data={printData}
          sections={holidayPrintSections}
          logo="/finaman-logo.png" // Aapka logo path
          onBack={() => setShowPreview(false)}
        />
      ) : showForm ? (
        <HolidayMasterForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onEditCancel={handleEditCancel}
          onCancel={() => setShowForm(false)}
          onDelete={handleDelete}
          onPrint={handlePrint} // Form ko pass karein
          mode={mode}
          saving={saving}
          canPrint={canPrint} // Permission pass karein
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={currentIndex + 1}
          totalRecords={list.length}
          rights={rights}
        />
      ) : (
        <Table
          title="Holiday Master"
          data={list}
          columns={columns}
          rowKey="id"
          loading={loading}
          onAdd={rights?.add === 1 ? handleAdd : null}
          onRowDoubleClick={handleRowSelect}
          onSearch={(val) => loadData(val)} 
        />
      )}
    </div>
  );
};

export default HolidayMaster;
import { useEffect, useState, useCallback, useRef } from "react";
import Table from "../Reusable/table/Table";
import HolidayMasterForm from "./HolidayMasterForm";
import { useERPMode } from "../Reusable/form/useFormMode";
import { fetchHolidays, createHoliday, updateHoliday, deleteHoliday } from "../../utils/api";
import { confirmDelete, showToast, alertError } from "../Reusable/alert";
import { setERPHandlers } from "../../utils/erpShortcuts";
import ERPPrintPreview from "../Reusable/ERPPrintPreview";

const initialState = {
  id: null,
  date: "",
  holiday_type_code: "Festival",
  is_restricted: 0,
  purpose: "",
  remarks: "",
};

const columns = [
  { key: "date", label: "Date" },
  { 
    key: "holiday_type_code", 
    label: "Holiday Type",
    render: (row) => {
      const type = row.holiday_type_code || (row.is_restricted ? "Restricted" : "Festival");
      const badgeStyles = {
        National: "bg-emerald-50 text-emerald-700 border-emerald-200",
        Festival: "bg-blue-50 text-blue-700 border-blue-200",
        Restricted: "bg-amber-50 text-amber-700 border-amber-200",
      };
      return (
        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeStyles[type] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
          {type}
        </span>
      );
    }
  },
  { key: "purpose", label: "Purpose" },
  { key: "remarks", label: "Remarks" },
];

const holidayPrintSections = [
  {
    type: "fields",
    title: "Holiday Details",
    fields: [
      { label: "Date",         key: "date"              },
      { label: "Holiday Type", key: "holiday_type_code" },
      { label: "Purpose",      key: "purpose"           },
      { label: "Remarks",      key: "remarks"           },
    ],
  },
];

const HolidayMaster = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [pageSize,     setPageSize]     = useState(20);  

  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights,
    canPrint,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      return isEdit
        ? await updateHoliday(data.id, data)
        : await createHoliday(data);
    },
    () => loadList(),
    tab.appl_name
  );
  const loadList = useCallback(async (search = "", size) => {
    try {
      setLoading(true);
      const currentSize = size ?? pageSize;
      const data = await fetchHolidays(search, currentSize);
      const finalData = Array.isArray(data) ? data : data?.data || [];
      setList(finalData);
      return finalData;
    } catch (err) {
      alertError("Fetch Error", "Failed to load holidays");
      return [];
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    loadList("", newSize);
  };
 

  useEffect(() => { loadList(); }, []);// eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleRowSelect = (row) => {
    const index = list.findIndex(i => i.id === row.id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData) => {
    const dataToSave = { ...updatedData, id: updatedData.id ?? formData.id };
    const response = await performSave("id", dataToSave);

    if (response?.success) {
      const freshList = await loadList();
      let newIndex = freshList.findIndex(i => i.id === dataToSave.id);
      if (newIndex === -1) {
        newIndex = freshList.findIndex(
          i => i.date === dataToSave.date && i.purpose === dataToSave.purpose
        );
      }
      if (newIndex === -1 && freshList.length > 0) {
        newIndex = 0; 
      }

      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
        setFormData({ ...freshList[newIndex] }); 
      }
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete holiday on "${row.date}"?` });
    if (confirmed) {
      const res = await deleteHoliday(row.id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadList();
        setShowForm(false);
      }
    }
  };
  const handleTabChange = (targetTab) => {
        if (targetTab === "search") setShowForm(false);
        if (targetTab === "entry") setShowForm(true);
    };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.id : item
    );
    if (ids.length === 0) return;

    const confirmed = await confirmDelete({ title: `Delete ${ids.length} holiday(s)?` });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteHoliday(id)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else {
        showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed` });
      }
      loadList();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete some holidays");
    }
  };

  const handlePrint = (row) => {
    setPrintData(row || formData);
    setShowPreview(true);
  };

  const saveBtnRef = useRef(null);

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew: handleAdd,
      onSave: () => handleSave(formData),
      onPrint: handlePrint,
      onEsc: () => {
        if (showPreview) setShowPreview(false);
        else setShowForm(false);
      },
    });
  }, [list, handleAdd, formData, showPreview, setShowForm]);// eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full w-full">
      {showPreview ? (
        <ERPPrintPreview
          title="Holiday Details"
          data={printData}
          sections={holidayPrintSections}
          logo="/finaman-logo.png"
          onBack={() => setShowPreview(false)}
        />
      ) : showForm ? (
        <HolidayMasterForm
          formData={formData}
          activeTab={showForm ? "entry" : "search"}
          onTabChange={handleTabChange}
          setFormData={setFormData}
          onSave={handleSave}
          saveBtnRef={saveBtnRef}
          onDelete={handleDelete}
          onPrint={handlePrint}
          onCancel={() => setShowForm(false)}
          mode={mode}
          saving={saving}
          canPrint={canPrint}
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
          totalRecords={list.length}
          rights={rights}
          onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
          onEditCancel={handleEditCancel}
        />
      ) : (
        <div className="bg-slate-50 h-full">
          <Table
            activeTab="search" 
            onTabChange={handleTabChange}
            title="Holiday Master"
            data={list}
            columns={columns}
            rowKey="id"
            loading={loading}
            onAdd={rights?.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
            onDeleteMultiple={handleDeleteMultiple}
            pageSize={pageSize}
            onPageChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
};

export default HolidayMaster;
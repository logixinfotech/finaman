import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import TDSMasterForm from "./TDSMasterForm";
import { fetchTDSList, createTDS, updateTDS, deleteTDS } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const initialState = {
  name:               "",
  financial_year:     "2025-26",
  tax_regime:         "New",
  basic_exemption:    300000,
  standard_deduction: 75000,
  calc_method:        "Projected Annual",
  status:             "Active",
  slabs:              [],
};

const columns = [
  { key: "name",               label: "Name"            },
  { key: "financial_year",     label: "Financial Year"  },
  { key: "tax_regime",         label: "Regime"          },
  { key: "basic_exemption",    label: "Basic Exemption" },
  { key: "standard_deduction", label: "Std. Deduction"  },
  { key: "status",             label: "Status"          },
];

const TDSMaster = ({ tab }) => {
  const [list,         setList]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    mode, formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      return isEdit
        ? await updateTDS(data.tds_id, data)
        : await createTDS(data);
    },
    () => {}, // ✅ empty — handleSave controls reload
    tab.appl_name
  );

  // ✅ returns finalData — handleSave uses it
  // ✅ setFormData(finalData[0]) hataya — yeh har reload pe index 0 reset karta tha
  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTDSList();
      const finalData = Array.isArray(data) ? data : data?.data || [];
      setList(finalData);
      return finalData; // ✅ handleSave needs this
    } catch (err) {
      alertError("Fetch Error", "Failed to load TDS records");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, []);

  // next/prev navigation sync
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleTabChange = (t) => {
    if (t === "search") setShowForm(false);
    if (t === "entry")  setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex(i => i.tds_id === row.tds_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  // ✅ same clean pattern — fresh list se sahi record dhundho aur setFormData karo
  const handleSave = async (updatedData) => {
    const dataToSave = { ...updatedData, tds_id: updatedData.tds_id ?? formData.tds_id };

    const response = await performSave("tds_id", dataToSave);

    if (response?.success) {
      const freshList = await loadList();

      // pehle tds_id se dhundho
      let newIndex = freshList.findIndex(i => i.tds_id === dataToSave.tds_id);

      // naya record — name + financial_year se dhundho
      if (newIndex === -1) {
        newIndex = freshList.findIndex(
          i => i.name === dataToSave.name && i.financial_year === dataToSave.financial_year
        );
      }

      // fallback — pehla record
      if (newIndex === -1 && freshList.length > 0) newIndex = 0;

      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
        setFormData({ ...freshList[newIndex] }); // ✅ server ka bilkul fresh data
      }
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete "${row.name}"?` });
    if (confirmed) {
      const res = await deleteTDS(row.tds_id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadList();
        setShowForm(false);
      }
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.tds_id : item
    );
    if (ids.length === 0) return;

    const confirmed = await confirmDelete({ title: `Delete ${ids.length} TDS record(s)?` });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteTDS(id)));
      const failed = results.filter((r) => !r?.success).length;
      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else {
        showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed` });
      }
      loadList();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete some TDS records");
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
        <TDSMasterForm
          initialData={formData}
          onSave={handleSave}
          formData={formData}
          setFormData={setFormData}
          onDelete={handleDelete}
          onCancel={() => setShowForm(false)}
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
           activeTab={"search"}
                    onTabChange={handleTabChange}
            title="TDS Master"
            onDeleteMultiple={handleDeleteMultiple}
            data={list}
            columns={columns}
            rowKey="tds_id"
            loading={loading}
            onAdd={rights.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default TDSMaster;
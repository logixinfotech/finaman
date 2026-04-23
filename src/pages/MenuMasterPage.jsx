import { useEffect, useState, useCallback } from "react";
import MenuMasterForm from "./Modules/MainMenu/MenuMasterPage/MenuMasterForm";
import MenuMasterFilterForm from "./Modules/MainMenu/MenuMasterPage/MenuMasterFilterForm";
import Table from "../components/Reusable/table/Table";
import "./Modules/MainMenu/MenuMasterPage/MenuMaster.css";
import {
  showToast,
  alertError,
  confirmDelete,
} from "../components/Reusable/alert";
import { setERPHandlers } from "../utils/erpShortcuts";   
import {
  fetchMenuMasterList,
  createMasmnu,
  updateMasmnu,
  deleteMasmnu,
  fetchSidebarMenu
} from "../utils/api";
import { useERPMode } from "../components/Reusable/form/useFormMode"; 

const initialState = {
  masmnu_id: null,
  masmod_id: "",
  pad_type: "1",
  pad_name: "",
  item_type: "",
  srl_no: "",
  bar_srl: "",
  bar_name: "",
  appl_type: "F",
  appl_name: "",
  appl_para: "",
  menu_hide: "",
};

const columns = [
  { key: "masmnu_id", label: "ID" },
  { key: "mod_name", label: "Module" }, 
  { key: "pad_name", label: "Section" }, 
  { key: "bar_name", label: "Menu Name" }, 
  { key: "item_type", label: "Item Type" },
  { key: "srl_no", label: "Serial No" },
  {
    key: "menu_hide",
    label: "Hidden",
    render: (row) => (
      <span className={`status-badge ${row.menu_hide === "Y" ? "inactive" : "active"}`}>
        {row.menu_hide === "Y" ? "Yes" : "No"}
      </span>
    ),
  },
];

const MenuMasterPage = ({ tab }) => {
  const [modules, setModules] = useState([]);
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true); 
const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving,
    handleView, handleAdd, handleModify, performSave, handleEditCancel,
    isEditMode,
    rights // 1. Destructure rights here
  } = useERPMode(
    initialState,
    async (data) =>
      data.masmnu_id
        ? await updateMasmnu(data.masmnu_id, data)
        : await createMasmnu(data),
    () => loadMenuList(filters),
    tab.appl_name // 2. Pass the application name for rights fetching
  );
 
  const loadMenuList = useCallback(async (filterParams = {}) => {
    try {
      setLoading(true);
      const data = await fetchMenuMasterList(filterParams);
      setList(data || []);
    } catch (err) {
      console.error("❌ loadMenuList error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadModules = useCallback(async () => {
    try {
      const data = await fetchSidebarMenu();
      setModules(data || []);
    } catch (err) {
      console.error("❌ loadModules error:", err);
    }
  }, []);

  useEffect(() => {
    loadMenuList();
    loadModules();
  }, [loadMenuList, loadModules]); 
  const handleSave = async () => {
    const response = await performSave("masmnu_id");
    if (response?.success) {
      showToast({
        icon: "success",
        title: isEditMode ? "Updated successfully" : "Added successfully",
      });
      loadMenuList(filters);
    } else if (response?.message) {
      alertError("Save failed", response.message);
    }
  };

  const handleDelete = async (row) => {
    const id = row?.masmnu_id || formData?.masmnu_id;
    const confirmed = await confirmDelete({
      title: `Delete "${row?.bar_name || formData?.bar_name}"?`,
      text: "This action cannot be undone",
    });

    if (!confirmed) return;

    try {
      const res = await deleteMasmnu(id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted successfully" });
        setShowForm(false);
        loadMenuList(filters);
      }
    } catch (err) {
      alertError("Delete failed", "Something went wrong");
    }
  }; 
  useEffect(() => {
    setERPHandlers({
      onNew: handleAdd,
      onSave: handleSave,
      onModify: handleModify,
      onEsc: () => setShowForm(false),
    });
  }, [handleAdd, handleSave, handleModify]);

  const applyFilter = () => loadMenuList(filters);
  const clearFilter = () => {
    setFilters({});
    loadMenuList();
  };

  return (
    <div>
      {showForm ? (
        <MenuMasterForm
          modules={modules}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onDelete={() => handleDelete(formData)}
          mode={mode}
          saving={saving}
          onModify={handleModify}
          onEditCancel={handleEditCancel}  
          rights={rights}
        />
      ) : (
        <Table
          title="Menu List"
          data={list}
          columns={columns}
          rowKey="masmnu_id"
          loading={loading}
          onRefresh={() => loadMenuList(filters)}
          showForm={showFilter}
          onToggleFilter={() => setShowFilter((p) => !p)}
          onRowDoubleClick={(row) => handleView(row)}
          formComponent={
            <MenuMasterFilterForm
              modules={modules}
              filters={filters}
              setFilters={setFilters}
              onApply={applyFilter}
              onClear={clearFilter}
            />
          }
         onAdd={rights.add === 1 ? handleAdd : null}
      
        />
      )}
    </div>
  );
};

export default MenuMasterPage;
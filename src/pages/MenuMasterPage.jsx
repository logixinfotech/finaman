import { useEffect, useState,useCallback} from "react";
import MenuMasterForm from "../components/MenuMasterPage/MenuMasterForm";
import MenuMasterFilterForm from "../components/MenuMasterPage/MenuMasterFilterForm";
import Table from "../components/Reusable/Table";
import "../components/MenuMasterPage/MenuMaster.css";
import {
  showToast,
  alertError,
  confirmDelete,
} from "../components/Reusable/alert";
import { initERPShortcuts } from "../utils/erpShortcuts";

import { Pencil, Trash2 } from "lucide-react";
import IconButton from "../components/Reusable/IconButton";
import {
  fetchMenuMasterList,
  createMasmnu,
  updateMasmnu,
  deleteMasmnu,
  fetchSidebarMenu
} from "../utils/api";
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
  { key: "pad_name", label: "Menu Name" },
  { key: "item_type", label: "Item Type" },
  { key: "srl_no", label: "Serial No" },
  { key: "bar_name", label: "Bar Name" },
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

const MenuMasterPage = () => {

  const [modules, setModules] = useState([]);
  const [list, setList] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [formData, setFormData] = useState(initialState);
  const [showForm, setShowForm] = useState(false);

  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = sessionStorage.getItem("token"); 
  const loadMenuList = useCallback(async (filterParams = {}) => {
    try {
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
    if (!token) return;

    loadMenuList();
    loadModules();

  }, [token, loadMenuList, loadModules]); 
  const handleAdd = useCallback(() => {
    setSelectedRow(null);
    setFormData({
      ...initialState,
      pad_type: "1",
      appl_type: "F",
    });
    setShowForm(true);
  }, []);


  // 🔹 Edit
  const handleEdit = (row) => {
    setSelectedRow(row);
    setFormData(row);
    setShowForm(true);
  };

 
  const handleDelete = async (row) => {

    const confirmed = await confirmDelete({
      title: `Delete "${row.pad_name}"?`,
      text: "This action cannot be undone",
    });

    if (!confirmed) return;

    try {

      await deleteMasmnu(row.masmnu_id);
      await loadMenuList(filters);

      showToast({
        icon: "success",
        title: "Deleted successfully",
      });

    } catch (err) {

      alertError("Delete failed", "Something went wrong");

    }

  };
 
  const handleSave = async () => {

    if (saving) return;

    try {

      setSaving(true);

      let res;

      if (formData.masmnu_id) {
        res = await updateMasmnu(formData.masmnu_id, formData);
      } else {
        res = await createMasmnu(formData);
      }

      if (!res?.success) {

        alertError("Save failed", res?.message || "Something went wrong");
        return;

      }

      await loadMenuList(filters);
      setShowForm(false);

      showToast({
        icon: "success",
        title: formData.masmnu_id
          ? "Updated successfully"
          : "Added successfully",
      });

    } catch (err) {

      alertError("Error", "Something went wrong");

    } finally {

      setSaving(false);

    }

  }; 
  const handleCancel = () => {
    setFormData(initialState);
    setSelectedRow(null);
    setShowForm(false);
  };


  // 🔹 Filter Apply
  const applyFilter = async () => {
    await loadMenuList(filters);
  };


  // 🔹 Clear Filter
  const clearFilter = async () => {
    setFilters({});
    await loadMenuList();
  };


  // 🔹 ERP Shortcuts
  useEffect(() => {

    const cleanup = initERPShortcuts({
      onNew: handleAdd,
      onSave: handleSave,
      onEsc: () => setShowForm(false),
    });

    return cleanup;

  }, [handleAdd, handleSave]); 
  return (
    <div>

      {showForm ? (

        <MenuMasterForm
          modules={modules}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />

      ) : (

        <Table
          title="Menu List"
          data={list}
          columns={columns}
          rowKey="masmnu_id"
          selectedRow={selectedRow}
          onRefresh={() => loadMenuList(filters)}

          showForm={showFilter}
          onToggleFilter={() => setShowFilter(p => !p)}

          formComponent={
            <MenuMasterFilterForm
              modules={modules}
              filters={filters}
              setFilters={setFilters}
              onApply={applyFilter}
              onClear={clearFilter}
            />
          }

          onAdd={handleAdd}

          actions={(row) => (
            <div className="flex gap-2 justify-end">

              <IconButton
                variant="edit"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(row);
                }}
              >
                <Pencil size={14} />
              </IconButton>

              <IconButton
                variant="delete"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row);
                }}
              >
                <Trash2 size={14} />
              </IconButton>

            </div>
          )}

        />

      )}

    </div>
  );
};

export default MenuMasterPage;

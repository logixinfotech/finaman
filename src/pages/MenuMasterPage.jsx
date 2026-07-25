import { useEffect, useState, useCallback } from "react";
import MenuMasterForm from "./Modules/MainMenu/MenuMasterPage/MenuMasterForm";
import MenuMasterFilterForm from "./Modules/MainMenu/MenuMasterPage/MenuMasterFilterForm";
import Table from "../components/Reusable/table/Table"; 
import { useERPMode } from "../components/Reusable/form/useFormMode";
import { showToast, confirmDelete, alertError } from "../components/Reusable/alert"; 
 
import { setERPHandlers } from "../utils/erpShortcuts";   
import {
  fetchMenuMasterList,
  createMasmnu,
  updateMasmnu,
  deleteMasmnu,
  fetchSidebarMenu, fetchMasgrpList
} from "../utils/api";  
import GenericFilter from "../components/Reusable/Filter/UnivarsalFilter";

const initialState = {
  masmnu_id: null,
  masmod_id: "",
  pad_type: "1",
  pad_name: "",
   grp_id: null,
  item_type: "",
  srl_no: "",
  bar_srl: "",
  bar_name: "",
  appl_type: "F",
  appl_name: "",
  appl_para: "",
  icon_name: "",
  menu_hide: "",
};

const columns = [
  { key: "masmnu_id", label: "ID" },
  { key: "mod_name", label: "Module" }, 
  { key: "pad_name", label: "Section" }, 
  { key: "grp_name", label: "Group" },
  { key: "bar_name", label: "Menu Name" }, 
  { key: "icon_name", label: "Icon" }, 
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
  const [groups, setGroups] = useState([]);
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadMenuList = useCallback(async (filterParams = {}) => {
    try {
      setLoading(true);
      const data = await fetchMenuMasterList(filterParams);
      const finalData = Array.isArray(data) ? data : data?.data || [];
       setList(finalData);
            return finalData; // ✅ handleSave needs this
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

  const loadGroups = useCallback(async () => {
    try {
      const data = await fetchMasgrpList();
      setGroups(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("❌ loadGroups error:", err);
    }
  }, []);

 

  const {
    mode, formData, setFormData, showForm, setShowForm, saving,
    handleView, handleAdd, handleModify, performSave, handleEditCancel,onNewEntry,
    isEditMode, rights
  } = useERPMode(
    initialState,
    async (data) => data.masmnu_id ? await updateMasmnu(data.masmnu_id, data) : await createMasmnu(data),
    () => loadMenuList(filters),
    tab.appl_name
  );
useEffect(() => {
    loadMenuList();
    loadModules();
    loadGroups();           // 👈
  }, [loadMenuList, loadModules, loadGroups]);
  
  // Sync Form Data when navigating records via Footer/Header
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleRowSelect = (row) => {
    const index = list.findIndex(item => item.masmnu_id === row.masmnu_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  // const handleSave = async () => {
  //   const response = await performSave("masmnu_id");
  //   if (response?.success) {
  //     showToast({
  //       icon: "success",
  //       title: isEditMode ? "Updated successfully" : "Added successfully",
  //     });
  //     loadMenuList(filters);
  //   } else if (response?.message) {
  //     alertError("Save failed", response.message);
  //   }
  // };
 const handleSave = async () => {
    const savedData = await performSave("masmnu_id");

    if (savedData?.success) {
      showToast({
        icon: "success",
        title: isEditMode ? "Updated successfully" : "Added successfully",
      });

      // ✅ Fresh list lo
      const freshList = await loadMenuList(filters);

      // ✅ Saved record ki ID — pehle savedData se lo, fallback formData se
      const savedId = savedData?.masmnu_id ?? savedData?.data?.masmnu_id ?? formData?.masmnu_id;

      // ✅ ID se index dhundho
      let newIndex = freshList.findIndex((item) => item.masmnu_id === savedId);

      // ✅ Nahi mila to bar_name se dhundho
      if (newIndex === -1) {
        newIndex = freshList.findIndex((item) => item.bar_name === formData?.bar_name);
      }

      // ✅ Abhi bhi nahi mila to pehla record
      if (newIndex === -1) newIndex = 0;

      // ✅ Index aur form data dono update karo
      setCurrentIndex(newIndex);
      setFormData({ ...freshList[newIndex] });

    } else if (savedData?.message) {
      alertError("Save failed", savedData.message);
    }
  };

  // const handleSave = async (updatedData) => {
      
  //       // group_id null ho sakta hai — formData se lo
  //       const dataToSave = { ...updatedData, masmnu_id: updatedData.masmnu_id ?? formData.masmnu_id };

  //       const response = await performSave("masmnu_id", dataToSave);
  //       if (response?.success) {
  //           const freshList = await loadMenuList(); // ✅ fresh list lo

  //           // Pehle group_id se dhundho
  //           let newIndex = freshList.findIndex(i => i.masmnu_id === dataToSave.masmnu_id);

  //           // Nahi mila (naya record) — name se dhundho
  //           if (newIndex === -1) {
  //               newIndex = freshList.findIndex(i => i.masmnu_id=== dataToSave.masmnu_id);
  //           }

  //           // Abhi bhi nahi mila — pehla record
  //           if (newIndex === -1 && freshList.length > 0) {
  //               newIndex = 0;
  //           }

  //           if (newIndex !== -1) {
  //               setCurrentIndex(newIndex);
  //               setFormData({ ...freshList[newIndex] }); // ✅ server ka bilkul fresh data
  //           }
  //       }
  //   };
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
  const handleDeleteMultiple = async (selected) => {
      // Normalize: Table may pass an array of row objects OR an array of keys
      const ids = (selected || []).map((item) =>
        typeof item === "object" ? item.masmnu_id : item
      );
  
      if (ids.length === 0) return;
  
      const confirmed = await confirmDelete({
        title: `Delete ${ids.length} menu?`,
      });
      if (!confirmed) return;
  
      try {
        const results = await Promise.all(ids.map((id) => deleteMasmnu(id)));
        const failed = results.filter((r) => !r?.success).length;
  
        if (failed === 0) {
          showToast({ icon: "success", title: `${ids.length} deleted` });
        } else {
          showToast({
            icon: "warning",
            title: `${ids.length - failed} deleted, ${failed} failed`,
          });
        }
        loadMenuList();
        setShowForm(false);
      } catch (err) {
        alertError("Delete Error", "Failed to delete some income heads");
      }
    };

  const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
  };

  // Global ERP Navigation Handlers
  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(prev => Math.min(prev + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(prev => Math.max(prev - 1, 0)),
      onFirstRecord: () => setCurrentIndex(0),
      onLastRecord: () => setCurrentIndex(list.length - 1),
      onNew: handleAdd,
      onSave: handleSave,
      onModify: handleModify,
      onEsc: () => setShowForm(false),
    });
  }, [list, formData, handleAdd]);

  const applyFilter = () => loadMenuList(filters);
  const clearFilter = () => { setFilters({}); loadMenuList(); };

  return (
    <div className="h-full w-full">
      {showForm ? (
        <MenuMasterForm
          modules={modules} 
          groups={groups}                  
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
          currentRecord={currentIndex + 1}
          totalRecords={list.length}
          activeTab="entry"
          onTabChange={handleTabChange}
          onNewEntry={handleAdd}
           onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
        />
      ) : (
        <Table
        activeTab="search" 
             onTabChange={handleTabChange}
          title="Menu Master"
          data={list}
          columns={columns}
          rowKey="masmnu_id"
          onDeleteMultiple={handleDeleteMultiple}
          loading={loading}
          onRefresh={() => loadMenuList(filters)}
          showForm={showFilter}
          onToggleFilter={() => setShowFilter((p) => !p)}
          onRowDoubleClick={handleRowSelect}
          formComponent={
            // <MenuMasterFilterForm
            //   modules={modules}
            //   filters={filters}
            //   setFilters={setFilters}
            //   onApply={applyFilter}
            //   onClear={clearFilter}
            // />
            <GenericFilter
  filters={filters}
  setFilters={setFilters}
  onApply={applyFilter}
  onClear={clearFilter}
  visibleFields={["module", "menu", "application", "itemType"]}
  options={{ modules }}
/>
          }
          onAdd={rights.add === 1 ? handleAdd : null}
        />
      )}
    </div>
  );
};
export default MenuMasterPage;

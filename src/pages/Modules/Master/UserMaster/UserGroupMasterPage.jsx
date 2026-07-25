 // export default UserGroupMasterPage;
import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import UserGroupForm from "../UserMaster/UserGroupform";
import { fetchUserGroups, deleteUserGroup, createUserGroup, updateUserGroup } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const initialState = {
  group_id: null,  // ✅ null rakho "" nahi — findIndex mein match hoga
  group_name: "",
  remarks: "",
};

const columns = [
  { key: "Sr",   label: "Sr"         },
  { key: "group_name", label: "Group Name" },
  { key: "remarks",    label: "Remarks"    },
];

const UserGroupMasterPage = ({ tab }) => {
  const [list,         setList]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving,
    handleEditCancel,
    handleView,
    handleAdd,
    handleModify,
    performSave,
    rights,
    activeTab, setActiveTab,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      if (isEdit) return await updateUserGroup(data.group_id, data);
      return await createUserGroup(data);
    },
    () => {},
    tab.appl_name
  );
  // लिस्ट में फ्रंटएंड पर ही Sr नंबर जोड़ना
const listWithSr = list.map((item, index) => ({
  ...item,
  Sr: index + 1
}));

  const handleTabChange = useCallback((targetTab) => {
    setActiveTab(targetTab);
    if (targetTab === "search") setShowForm(false);
    else if (targetTab === "entry" && list.length > 0) setShowForm(true);
  }, [setActiveTab, setShowForm, list.length]);

  // ✅ returns fresh array — handleSave uses it
  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUserGroups("DEP");
      const arr = Array.isArray(data) ? data : (data?.data ?? []);
      setList(arr);
      return arr;
    } catch (err) {
      alertError("Fetch Error", "Failed to load groups");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // next/prev navigation
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleRowSelect = useCallback((row) => {
    const index = list.findIndex(item => item.group_id === row.group_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true);
  }, [list, handleView, setShowForm]);

  // ✅ clean handleSave — sirf ek baar setFormData, no race condition
  const handleSave = async (updatedData) => {
    // group_id null ho sakta hai edit mein — formData se lo
    const dataToSave = { ...updatedData, group_id: updatedData.group_id ?? formData.group_id };

    const response = await performSave("group_id", dataToSave);

    if (response?.success) {
      const freshList = await loadGroups(); // server se fresh list

      // pehle group_id se dhundho
      let newIndex = freshList.findIndex(i => i.group_id === dataToSave.group_id);

      // naya record — name se dhundho
      if (newIndex === -1) {
        newIndex = freshList.findIndex(i => i.group_name === dataToSave.group_name);
      }

      // abhi bhi nahi mila — pehla record
      if (newIndex === -1 && freshList.length > 0) newIndex = 0;

      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
        // ✅ sirf ek baar — server ka bilkul fresh data
        setFormData({ ...freshList[newIndex] });
      }
    }
  };

  const handleDelete = useCallback(async (row) => {
    const confirmed = await confirmDelete({ title: `Delete Group "${row.group_name}"?` });
    if (!confirmed) return;

    const res = await deleteUserGroup(row.group_id);
    if (res?.success) {
      showToast({ icon: "success", title: "Deleted" });
      const freshList = await loadGroups();
      setShowForm(false);
      if (freshList.length > 0) {
        const nextIndex = Math.min(currentIndex, freshList.length - 1);
        setCurrentIndex(nextIndex);
      }
    }
  }, [currentIndex, loadGroups, setShowForm]);

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => {
        const next = Math.min(currentIndex + 1, list.length - 1);
        setCurrentIndex(next);
        if (list[next]) handleView(list[next]);
      },
      onPrevRecord: () => {
        const prev = Math.max(currentIndex - 1, 0);
        setCurrentIndex(prev);
        if (list[prev]) handleView(list[prev]);
      },
      onNew:  handleAdd,
      onSave: () => handleSave(formData),
      onEsc:  () => setShowForm(false),
    });
  }, [list, currentIndex, handleAdd, formData, handleView, setShowForm]);

  return (
    <div className="h-full">
      {showForm ? (
        <UserGroupForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onDelete={handleDelete}
          mode={mode}
          saving={saving}
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={currentIndex + 1}
          totalRecords={list.length}
          rights={rights}
          onEditCancel={handleEditCancel}
          activeTab={activeTab}
          showSettingsTab={true}
          onTabChange={handleTabChange}
          onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}

        />
      ) : (
        <Table
          title="User Group Master"
          data={listWithSr}
          activeTab="search" 
             onTabChange={handleTabChange}
          columns={columns}
          rowKey="group_id"
          loading={loading}
          onAdd={rights?.add === 1 ? handleAdd : null}
          onRowDoubleClick={handleRowSelect}
          onDeleteMultiple={async (selected) => {
            const ids = (selected || []).map(item =>
              typeof item === "object" ? item.group_id : item
            );
            if (ids.length === 0) return;
            const confirmed = await confirmDelete({
              title: `Delete ${ids.length} record${ids.length > 1 ? "s" : ""}?`,
            });
            if (!confirmed) return;
            const results = await Promise.all(ids.map(id => deleteUserGroup(id)));
            const failed = results.filter(r => !r?.success).length;
            if (failed > 0) {
              alertError("Delete Error", `${failed} record(s) could not be deleted.`);
            } else {
              showToast({ icon: "success", title: "Deleted successfully" });
            }
            await loadGroups();
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
};

export default UserGroupMasterPage;
import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import UserGroupForm from "../UserMaster/UserGroupform";
import { fetchUserGroups, deleteUserGroup, createUserGroup, updateUserGroup } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const initialState = {
  group_id: null,
  group_name: "",
  remarks: "",
};
const columns = [
  { key: "group_id", label: "ID" },
  { key: "group_name", label: "Group Name" },
  { key: "remarks", label: "Remarks" },
];
const UserGroupMasterPage = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving, handleEditCancel,
    handleView, handleAdd, handleModify, performSave, rights,
    isEditMode
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      if (isEdit) {
        return await updateUserGroup(data.group_id, data);
      } else {
        return await createUserGroup(data);
      }
    },
    () => loadGroups(), tab.appl_name
  );
  const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
  };
  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUserGroups("DEP");
      setList(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      alertError("Fetch Error", "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode]);

  const handleRowSelect = (row) => {
    const index = list.findIndex(item => item.group_id === row.group_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true); // Ensure form opens on dblClick
  };

  const handleSave = async () => {
    if (!formData.group_name) {
      alertError("Validation", "Group Name is required");
      return;
    }
    const response = await performSave("group_id");
    if (response?.success) {
      showToast({ icon: "success", title: "Saved Successfully" });
      loadGroups();
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete Group "${row.group_name}"?` });
    if (confirmed) {
      const res = await deleteUserGroup(row.group_id);
      if (res.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadGroups();
        setShowForm(false);
      }
    }
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew: handleAdd,
      onSave: handleSave,
      onEsc: () => setShowForm(false),
    });
  }, [list]);


  return (
    <div>
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
          activeTab="entry"
          onTabChange={handleTabChange}

        />
      ) : (
        <Table
          title="User Group Master"
          data={list}
          columns={columns}
          rowKey="group_id"
          loading={loading}
          onAdd={rights.add === 1 ? handleAdd : null}

          onRowDoubleClick={handleRowSelect}
        />
      )}
    </div>
  );
};

export default UserGroupMasterPage;
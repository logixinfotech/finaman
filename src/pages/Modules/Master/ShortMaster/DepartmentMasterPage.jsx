import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import UserGroupForm from "../UserMaster/UserGroupform";
import { fetchUserGroupsByType, deleteUserGroup, createUserGroup, updateUserGroup } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const GROUP_TYPE = "DEP"; // 🔥 IMPORTANT

const initialState = {
    group_id: null,
    group_name: "",
    remarks: "",
};

const columns = [
{key:"Sr", label:"Sr"},
    { key: "group_name", label: "Department Name" },
    { key: "remarks", label: "Remarks" },
];

const DepartmentMasterPage = ({ tab }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    const {
        mode,
        formData, setFormData,
        showForm, setShowForm,
        saving, 
        handleView, handleAdd, handleModify, performSave, rights,
        handleEditCancel
    } = useERPMode(
        initialState,
        async (data, isEdit) => {
            const payload = { ...data, group_type: GROUP_TYPE }; // 🔥 AUTO TYPE = DEP

            if (isEdit) {
                return await updateUserGroup(data.group_id, payload);
            } else {
                return await createUserGroup(payload);
            }
        },
        () => loadGroups(),
        tab?.appl_name
    );

    // 🔄 Load Data
    const loadGroups = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchUserGroupsByType("DEP"); // 🔥 DEP

            setList(data?.data || []);
        } catch (err) {
            alertError("Fetch Error", "Failed to load department");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGroups();
    }, [loadGroups]);
   
    // 🔁 Sync selected row
    useEffect(() => {
        if (showForm && mode === "view" && list.length > 0) {
            setFormData(list[currentIndex]);
        }
    }, [currentIndex, list, showForm, mode]);
     const listWithSr = list.map((item, index) => ({
  ...item,
  Sr: index + 1
}));
    const handleRowSelect = (row) => {
        const index = list.findIndex(item => item.group_id === row.group_id);
        if (index !== -1) setCurrentIndex(index);
        handleView(row);
        setShowForm(true);
    };

    // 💾 Save
    const handleSave = async () => {
        if (!formData.group_name) {
            alertError("Validation", "Department Name is required");
            return;
        }

        const response = await performSave("group_id");
        if (response?.success) {
            showToast({ icon: "success", title: "Saved Successfully" });
            loadGroups();
        }
    };

    // ❌ Delete
    const handleDelete = async (row) => {
        const confirmed = await confirmDelete({
            title: `Delete "${row.group_name}"?`
        });

        if (confirmed) {
            const res = await deleteUserGroup(row.group_id);
            if (res.success) {
                showToast({ icon: "success", title: "Deleted" });
                loadGroups();
                setShowForm(false);
            }
        }
    };

    // ⌨️ Shortcuts
    useEffect(() => {
        setERPHandlers({
            onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
            onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
            onNew: handleAdd,
            onSave: handleSave,
            oonEsc: () => {
                setShowForm(false);
                if (mode === "add") {
                    setFormData(initialState);
                }
            },
        });
    }, [list]);

    const handleTabChange = (targetTab) => {
        if (targetTab === "search") setShowForm(false);
        if (targetTab === "entry") setShowForm(true);
    };
    return (
        <div className="h-full">
            {showForm ? (
                <UserGroupForm
                    title="Department Master"
                    nameLabel="Department Name"
                    formData={formData}
                    setFormData={setFormData}
                    onSave={handleSave}
                    onCancel={() => {
                        setShowForm(false);
                        setFormData(initialState);
                    }}
                    onDelete={handleDelete}
                    mode={mode}
                    saving={saving}
                    onModify={handleModify}
                    onNewEntry={handleAdd}
                    currentRecord={currentIndex + 1}
                    totalRecords={list.length}
                    rights={rights}
                    onEditCancel={handleEditCancel}
                    activeTab={showForm ? "entry" : "search"}
                    onTabChange={handleTabChange}
                />
            ) : (
                <Table
                activeTab="search" 
             onTabChange={handleTabChange}
                    title="Department Master"
                    data={listWithSr}
                    columns={columns}
                    rowKey="group_id"
                    loading={loading}
                    onAdd={rights?.add === 1 ? handleAdd : null}
                    onRowDoubleClick={handleRowSelect}
                />
            )}
        </div>
    );
};

export default DepartmentMasterPage;
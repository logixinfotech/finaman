import { useEffect, useState, useCallback } from "react";
import Table from "../../../../components/Reusable/table/Table";
import AddUserMaster from "../UserMaster/AddUserMaster";
import { fetchUsers, deleteUser, createUser, updateUser } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import ERPPrintPreview from "../../../../components/Reusable/ERPPrintPreview";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
const userPrintSections = [
    {
        type: "fields",
        title: "User Information",
        fields: [
            { label: "User ID", key: "user_id" },
            { label: "User Name", key: "user_name" },
            { label: "User Type", key: "user_type" },
        ]
    }
];
const initialState = {
    user_id: "",
    password: "",
    user_name: "",
    user_type: "",
    user_group: "",
    setting_pass: "",
    signature: ""
};
// Add 'editable' and 'onCellSave' to your columns
const columns = [
    { 
        key: "user_name", 
        label: "User Name", 
        editable: true,
        onCellSave: async (row, key, newValue) => {
            try {
                // Call your existing updateUser API
                const response = await updateUser(row.user_id, { ...row, [key]: newValue });
                if (response.success) {
                    showToast({ icon: "success", title: "Updated successfully" });
                    return true; // Signal to table that save was successful
                }
            } catch (error) {
                alertError("Update Failed", error.message);
                return false;
            }
        }
    },
    { key: "user_id", label: "User ID" }, // ID usually stays non-editable
    { 
        key: "user_type", 
        label: "User Type",
        editable: true,
        onCellSave: async (row, key, newValue) => {
             await updateUser(row.user_id, { ...row, [key]: newValue });
             showToast({ icon: "success", title: "Type Updated" });
        }
    },
    { key: "user_group", label: "Group", editable: true },
    {
        key: "block",
        label: "Status",
        render: (row) => (
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${row.block === 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
                }`}>
                {row.block === 0 ? "Active" : "Blocked"}
            </span>
        )
    }
];
const UserMasterPage = ({ tab, onOpenPage }) => {
    const [list, setList] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [printData, setPrintData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchUsers();
            setList(Array.isArray(data) ? data : data?.data || []);;
        } finally {
            setLoading(false);
        }
    }, []);
    const {
       mode, formData, setFormData, showForm, setShowForm,
    saving, canPrint, handleView, handleAdd,
    handleModify, performSave, rights, isEditMode, handleEditCancel
    } = useERPMode(
        initialState,
        async (data, isEdit) => {
            return isEdit ? await updateUser(data.user_id, data) : await createUser(data);
        },
        loadUsers,
        tab.appl_name 
    );



    useEffect(() => { loadUsers(); }, [loadUsers]);

    useEffect(() => {
        if (showForm && mode === "view" && list.length > 0) {
            setFormData(list[currentIndex]);
        }
    }, [currentIndex, list, showForm, mode]);

    const handleRowSelect = (row) => {
        const index = list.findIndex(item => item.user_id === row.user_id);

        if (index !== -1) {
            setCurrentIndex(index);

            setFormData({
                ...list[index],
                user_type: list[index].user_type || "",
                user_group: list[index].user_group || ""
            });
        }

        handleView(row);
    }; const handleSave = async () => {
        if (!formData.user_id || !formData.password) {
            alertError("Validation Error", "Please fill all required fields");
            return;
        }
        const response = await performSave("user_id");

        if (response?.success) {
            showToast({
                icon: "success",
                title: isEditMode ? "Updated successfully" : "Added successfully",
            });

            loadUsers();
        } else {
            alertError("Error", response?.message);
        }
    };
// loadUsers ke baad ye add karo:
const handleTabChange = (targetTab) => {
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
};
    const handleDelete = async (row) => {
        const confirmed = await confirmDelete({
            title: `Delete "${row.user_name}"?`,
            text: "This action cannot be undone",
        });
        if (!confirmed) return;

        const res = await deleteUser(row.user_id);

        if (res.success) {
            showToast({ icon: "success", title: "Deleted successfully" });
            loadUsers();
            setShowForm(false);
        }
    };

    const handlePrint = (row) => {
        setPrintData(row || formData);
        setShowPreview(true);
    };
    useEffect(() => {
        setERPHandlers({
            onNextRecord: () =>
                setCurrentIndex(prev => Math.min(prev + 1, list.length - 1)),
            onPrevRecord: () =>
                setCurrentIndex(prev => Math.max(prev - 1, 0)),
            onFirstRecord: () => setCurrentIndex(0),
            onLastRecord: () => setCurrentIndex(list.length - 1),
            onNew: handleAdd,
            onSave: handleSave,
            onEsc: () => setShowForm(false),
        });
    }, [list]);

    return (
        <div>
            {showPreview ? (
                <ERPPrintPreview
                    title="User Details"
                    data={printData}
                    sections={userPrintSections}
                    onBack={() => setShowPreview(false)}
                />
            ) : showForm ? (
              <AddUserMaster
    formData={formData}
    setFormData={setFormData}
    onSave={handleSave}
    onCancel={() => setShowForm(false)}
    onDelete={handleDelete}
    onPrint={handlePrint}
    mode={mode}
    saving={saving}
    canPrint={canPrint}
    onNewEntry={handleAdd}
    onModify={handleModify}
    onEditCancel={handleEditCancel}
    rights={rights}
    currentRecord={currentIndex + 1}
    totalRecords={list.length}
    onOpenPage={onOpenPage}
    activeTab="entry"
    onTabChange={handleTabChange}
/>
            ) : (
                <Table
    title="User Master"
    data={list}
    columns={columns}
    rowKey="user_id"
    loading={loading}
    onRefresh={() => loadUsers()}
    onAdd={rights.add === 1 ? handleAdd : null}
    onRowDoubleClick={handleRowSelect}
                    onDeleteMultiple={async (ids) => {
                        const confirmed = await confirmDelete({
                            title: `Delete ${ids.length} users?`,
                            text: "This action cannot be undone",
                        });

                        if (!confirmed) return;
                        await Promise.all(ids.map(id => deleteUser(id)));
                         showToast({ icon: "success", title: "Deleted successfully" });
                        loadUsers();
                    }}
                />
            )}
        </div>
    );
};

export default UserMasterPage;
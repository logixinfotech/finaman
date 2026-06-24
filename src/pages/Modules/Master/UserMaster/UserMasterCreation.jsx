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
const columns = [
    {
        key: "user_name",
        label: "User Name",
        editable: true,
        onCellSave: async (row, key, newValue) => {
            try {
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
            const finalData = Array.isArray(data) ? data : data?.data || [];
            setList(finalData);
        } catch (err) {
            console.error("Load users failed", err);
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
    }, [currentIndex, list, showForm, mode, setFormData]);

    const handleRowSelect = (row) => {
        const index = list.findIndex(item => item.user_id === row.user_id);
        if (index !== -1) setCurrentIndex(index);
        handleView(row);
    };
    const handleSave = async () => {
        if (!formData.user_id || !formData.password || !formData.user_type) {
            alertError("Validation Error", "Please fill all required fields marked with *");
            return;
        }
        console.log("MODE:", mode, "| isEditMode:", isEditMode, "| user_id:", formData.user_id);

        const response = await performSave("user_id", formData);

        if (response?.success) {

            // 🔥 Reload latest data
            const data = await fetchUsers();
            const finalData = Array.isArray(data) ? data : data?.data || [];

            setList(finalData);

            // 🔥 Find same saved record again
            const savedIndex = finalData.findIndex(
                item => item.user_id === formData.user_id
            );

            if (savedIndex !== -1) {
                setCurrentIndex(savedIndex);
                setFormData(finalData[savedIndex]);
            }

            showToast({
                icon: "success",
                title: isEditMode
                    ? "User updated successfully"
                    : "User added successfully",
            });
} else if (response?.message?.toLowerCase().includes("already exists")) {
    // 👇 ADD THIS
    alertError("Duplicate User ID", `User ID "${formData.user_id}" already exists. Please choose a different ID.`);
    // Focus back on user_id field
    setTimeout(() => {
        const el = document.querySelector('[name="user_id"]');
        if (el) { el.focus(); el.select(); }
    }, 100);
}
    };

    const handleTabChange = (targetTab) => {
        if (targetTab === "search") setShowForm(false);
        if (targetTab === "entry") setShowForm(true);
    };

    const handleDelete = async (row) => {
        const confirmed = await confirmDelete({
            title: `Delete "${row.user_name}"?`,
            text: "This action will permanently remove the user login.",
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

    // Global ERP Handlers
    useEffect(() => {
        setERPHandlers({
            onNextRecord: () => setCurrentIndex(prev => Math.min(prev + 1, list.length - 1)),
            onPrevRecord: () => setCurrentIndex(prev => Math.max(prev - 1, 0)),
            onFirstRecord: () => setCurrentIndex(0),
            onLastRecord: () => setCurrentIndex(list.length - 1),
            onNew: handleAdd,
            onSave: handleSave,
            onEsc: () => setShowForm(false),
        });
    }, [list, formData, handleAdd]);

    return (
        <div className="h-full w-full">
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
                    onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
                />
            ) : (
                <Table
                    title="User Master"
                    activeTab="search"
                    onTabChange={handleTabChange}
                    data={list}
                    columns={columns}
                    rowKey="user_id"
                    loading={loading}
                    onRefresh={loadUsers}
                    onAdd={rights.add === 1 ? handleAdd : null}
                    onRowDoubleClick={handleRowSelect}
                    onDeleteMultiple={async (ids) => {
                        const confirmed = await confirmDelete({ title: `Delete ${ids.length} users?` });
                        if (!confirmed) return;
                        await Promise.all(ids.map(id => deleteUser(id)));
                        showToast({ icon: "success", title: "Bulk delete successful" });
                        loadUsers();
                    }}
                />
            )}
        </div>
    );
};

export default UserMasterPage;
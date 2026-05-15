import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import UserGroupForm from "../UserMaster/UserGroupform";
import { fetchUserGroupsByType, deleteUserGroup, createUserGroup, updateUserGroup } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const GROUP_TYPE = "RME";

const initialState = {
    group_id: null,
    group_name: "",
    remarks: "",
};

const columns = [
    { key: "group_id", label: "ID" },
    { key: "group_name", label: "Reporting Name" },
    { key: "remarks", label: "Remarks" },
];

const ReportMasterPage = ({ tab }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    const {
        mode,
        formData, setFormData,
        showForm, setShowForm,
        saving, handleEditCancel,
        handleView, handleAdd, handleModify, performSave, rights
    } = useERPMode(
        initialState,
        async (data, isEdit) => {
            const payload = { ...data, group_type: GROUP_TYPE };

            if (isEdit) return await updateUserGroup(data.group_id, payload);
            else return await createUserGroup(payload);
        },
        () => loadGroups(), tab.appl_name
    );

    const loadGroups = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchUserGroupsByType(GROUP_TYPE);
            setList(data?.data || []);
        } catch (err) {
            alertError("Fetch Error", "Failed to load reporting");
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
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formData.group_name) {
            alertError("Validation", "Reporting Name is required");
            return;
        }

        const response = await performSave("group_id");
        if (response?.success) {
            showToast({ icon: "success", title: "Saved Successfully" });
            loadGroups();
        }
    };

    const handleDelete = async (row) => {
        const confirmed = await confirmDelete({ title: `Delete "${row.group_name}"?` });
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
            onEsc: () => {
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
        <div>
            {showForm ? (
                <UserGroupForm
                    title="Reporting Master"
                    nameLabel="Reporting Name"
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
                    title="Reporting Master"
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

export default ReportMasterPage;
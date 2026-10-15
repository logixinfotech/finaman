 
import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import UserGroupForm from "../UserMaster/UserGroupform";
import useEmbeddedMaster from "../../../../components/Reusable/QuickAdd/useEmbeddedMaster";

import {
    fetchUserGroupsByType, deleteUserGroup, createUserGroup, updateUserGroup,
} from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const GROUP_TYPE = "DESG";
const DEPT_GROUP_TYPE = "DEP";  

const initialState = {
    group_id: null,
    group_name: "",
   category: "",  
    remarks: "",
};

const columns = [
    { key: "Sr", label: "Sr" },
 { key: "category", label: "Department" },
    { key: "group_name", label: "Designation Name" },
   
    { key: "remarks", label: "Remarks" },
];

const DesignationMasterPage = ({ tab, embedded = false, initialName = "", onSaved, onClose }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    // 🆕 Department options — DEPT master se live fetch, hardcode nahi
    const [deptOptions, setDeptOptions] = useState([]);
    useEffect(() => {
        (async () => {
            try {
                const res = await fetchUserGroupsByType(DEPT_GROUP_TYPE);
                const rows = res?.data || [];
                setDeptOptions(rows.map((r) => r.group_name).filter(Boolean));
            } catch (err) {
                console.error("Department options fetch error:", err);
            }
        })();
    }, []);

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
            if (isEdit) {
                return await updateUserGroup(data.group_id, payload);
            } else {
                return await createUserGroup(payload);
            }
        },
        () => loadGroups(), tab.appl_name
    );

    const loadGroups = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchUserGroupsByType(GROUP_TYPE);
            const freshList = data?.data || [];
            setList(freshList);
            return freshList;
        } catch (err) {
            alertError("Fetch Error", "Failed to load designation");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);
const emb = useEmbeddedMaster({
    embedded, initialName, onSaved, onClose,
    handleAdd, setFormData, nameKey: "group_name",
});
    useEffect(() => { loadGroups(); }, [loadGroups]);

    useEffect(() => {
        if (showForm && mode === "view" && list.length > 0) {
            setFormData(list[currentIndex]);
        }
    }, [currentIndex, list, showForm, mode, setFormData]);

    const handleRowSelect = (row) => {
        const index = list.findIndex(item => item.group_id === row.group_id);
        if (index !== -1) setCurrentIndex(index);
        handleView(row);
        setShowForm(true);
    };
    const handleSave = async () => {
    if (!formData.group_name?.trim()) {
        alertError("Validation", "Designation Name is required");
        return;
    }

    // Duplicate check (sirf naye record par)
    if (mode === "add") {
        const dup = list.find(
            (g) => g.group_name?.trim().toLowerCase() === formData.group_name.trim().toLowerCase()
        );
        if (dup) {
            if (emb.afterSave(dup.group_name)) return;   // embedded: wahi existing select
            alertError("Duplicate", `"${dup.group_name}" already exists.`);
            return;
        }
    }

    const savedData = await performSave("group_id");

    if (savedData?.success) {
        showToast({ icon: "success", title: "Saved Successfully" });

        if (emb.afterSave(formData.group_name.trim())) return;   // embedded: yahin khatam

        const freshList = await loadGroups();
        const savedId = savedData?.group_id ?? savedData?.data?.group_id ?? formData?.group_id;
        let newIndex = freshList.findIndex((item) => item.group_id === savedId);
        if (newIndex === -1) {
            newIndex = freshList.findIndex((item) => item.group_name === formData?.group_name);
        }
        if (newIndex === -1) newIndex = 0;

        setCurrentIndex(newIndex);
        setFormData({ ...freshList[newIndex] });

    } else if (savedData?.message) {
        alertError("Save failed", savedData.message);
    }
};

    // const handleSave = async () => {
    //     if (!formData.group_name) {
    //         alertError("Validation", "Designation Name is required");
    //         return;
    //     }

    //     const savedData = await performSave("group_id");

    //     if (savedData?.success) {
    //         showToast({ icon: "success", title: "Saved Successfully" });

    //         const freshList = await loadGroups();
    //         const savedId = savedData?.group_id ?? savedData?.data?.group_id ?? formData?.group_id;
    //         let newIndex = freshList.findIndex((item) => item.group_id === savedId);
    //         if (newIndex === -1) {
    //             newIndex = freshList.findIndex((item) => item.group_name === formData?.group_name);
    //         }
    //         if (newIndex === -1) newIndex = 0;

    //         setCurrentIndex(newIndex);
    //         setFormData({ ...freshList[newIndex] });

    //     } else if (savedData?.message) {
    //         alertError("Save failed", savedData.message);
    //     }
    // };

    const listWithSr = list.map((item, index) => ({ ...item, Sr: index + 1 }));

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

    const handleDeleteMultiple = async (selected) => {
        const ids = (selected || []).map((item) => typeof item === "object" ? item.group_id : item);
        if (ids.length === 0) return;

        const confirmed = await confirmDelete({
            title: `Delete ${ids.length} designation${ids.length > 1 ? "s" : ""}?`,
            text: "This action cannot be undone",
        });
        if (!confirmed) return;

        try {
            const results = await Promise.all(ids.map((id) => deleteUserGroup(id)));
            const failed = results.filter((r) => !r?.success).length;

            if (failed === 0) {
                showToast({ icon: "success", title: `${ids.length} deleted successfully` });
            } else {
                showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed` });
            }

            loadGroups();
            setShowForm(false);
        } catch (err) {
            alertError("Delete Error", "Failed to delete some designations");
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
                if (mode === "add") setFormData(initialState);
            },
        });
    }, [list, handleAdd, handleSave]);

 const handleTabChange = (targetTab) => {
    if (emb.isEmbedded) return;
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry") setShowForm(true);
};

    return (
        <div className="h-full">
            {showForm ? (
                <UserGroupForm
                    title="Designation Master"
                    nameLabel="Designation Name"
                    formData={formData}
                    setFormData={setFormData}
                    onSave={handleSave}
                   onCancel={() => {
    if (emb.isEmbedded) { emb.handleClose(); return; }
    setShowForm(false); setFormData(initialState);
}}
compact={emb.isEmbedded}
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
                    onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
                    onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
                    showDepartment
                    departmentOptions={deptOptions}
                />
            ) : (
                <Table
                    onDeleteMultiple={handleDeleteMultiple}
                    title="Designation Master"
                    activeTab="search"
                    onTabChange={handleTabChange}
                    data={listWithSr}
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

export default DesignationMasterPage;
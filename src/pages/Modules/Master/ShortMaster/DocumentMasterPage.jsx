
import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import UserGroupForm from "../UserMaster/UserGroupform";
import { fetchUserGroupsByType, deleteUserGroup, createUserGroup, updateUserGroup } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const GROUP_TYPE = "DOC";

const initialState = {
    group_id: null,
    group_name: "",
    remarks: "",
    category: "",
    group_type: "DOC",
};

const columns = [
    { key: "Sr",   label: "Sr"            },
    { key: "group_name", label: "Document Name" },
    { key: "category",   label: "Category"      },
    { key: "remarks",    label: "Remarks"       },
];

const DocumentMasterPage = ({ tab }) => {
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
            const payload = { ...data, group_type: GROUP_TYPE, category: data.category || null };
            if (isEdit) return await updateUserGroup(data.group_id, payload);
            else return await createUserGroup(payload);
        },
        () => loadGroups(),
        tab.appl_name
    );

    // ✅ loadGroups — returns finalData so handleSave can use it
    const loadGroups = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchUserGroupsByType(GROUP_TYPE);
            const finalData = Array.isArray(data) ? data : data?.data || [];
            setList(finalData);
            return finalData; // ✅ handleSave needs this
        } catch (err) {
            alertError("Fetch Error", "Failed to load documents");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

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

    // ✅ handleSave — IncomeHead jaisa exact pattern
    const handleSave = async (updatedData) => {
        if (!formData.group_name) {
            alertError("Validation", "Document Name is required");
            return;
        }

        // group_id null ho sakta hai — formData se lo
        const dataToSave = { ...updatedData, group_id: updatedData.group_id ?? formData.group_id };

        const response = await performSave("group_id", dataToSave);
        if (response?.success) {
            const freshList = await loadGroups(); // ✅ fresh list lo

            // Pehle group_id se dhundho
            let newIndex = freshList.findIndex(i => i.group_id === dataToSave.group_id);

            // Nahi mila (naya record) — name se dhundho
            if (newIndex === -1) {
                newIndex = freshList.findIndex(i => i.group_name === dataToSave.group_name);
            }

            // Abhi bhi nahi mila — pehla record
            if (newIndex === -1 && freshList.length > 0) {
                newIndex = 0;
            }

            if (newIndex !== -1) {
                setCurrentIndex(newIndex);
                setFormData({ ...freshList[newIndex] }); // ✅ server ka bilkul fresh data
            }
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

    const handleDeleteMultiple = async (selected) => {
        const ids = (selected || []).map((item) =>
            typeof item === "object" ? item.group_id : item
        );
        if (ids.length === 0) return;

        const confirmed = await confirmDelete({ title: `Delete ${ids.length} Document(s)?` });
        if (!confirmed) return;

        try {
            const results = await Promise.all(ids.map((id) => deleteUserGroup(id)));
            const failed = results.filter((r) => !r?.success).length;
            if (failed === 0) {
                showToast({ icon: "success", title: `${ids.length} deleted` });
            } else {
                showToast({ icon: "warning", title: `${ids.length - failed} deleted, ${failed} failed` });
            }
            loadGroups();
            setShowForm(false);
        } catch (err) {
            alertError("Delete Error", "Failed to delete some documents");
        }
    };

    useEffect(() => {
        setERPHandlers({
            onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
            onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
            onNew: handleAdd,
            onSave: () => handleSave(formData),
            onEsc: () => {
                if (mode === "add") setFormData(initialState);
                setShowForm(false);
            },
        });
    }, [list, handleAdd, formData]);

    const handleTabChange = (targetTab) => {
        if (targetTab === "search") setShowForm(false);
        if (targetTab === "entry") setShowForm(true);
    };const listWithSr = list.map((item, index) => ({
  ...item,
  Sr: index + 1
}));

    return (
        <div className="h-full w-full">
            {showForm ? (
                <UserGroupForm
                
                    title="Document Master"
                    nameLabel="Document Name"
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
                    showCategory={true}
                    onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
                    onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
                />
            ) : (
                <Table
                    title="Document Master"
                    data={listWithSr}
                    columns={columns}
                    activeTab={"search"}
                    onTabChange={handleTabChange}
                    rowKey="group_id"
                    loading={loading}
                    onAdd={rights.add === 1 ? handleAdd : null}
                    onRowDoubleClick={handleRowSelect}
                    onDeleteMultiple={handleDeleteMultiple}
                />
            )}
        </div>
    );
};

export default DocumentMasterPage;
// export default DepartmentMasterPage;
import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import UserGroupForm from "../UserMaster/UserGroupform";
import { fetchUserGroupsByType, deleteUserGroup, createUserGroup, updateUserGroup } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const GROUP_TYPE = "DEP";

const initialState = {
    group_id: null,
    group_name: "",
    remarks: "",
};

const columns = [
    { key: "Sr",         label: "Sr"               },
    { key: "group_name", label: "Department Name"  },
    { key: "remarks",    label: "Remarks"          },
];

const DepartmentMasterPage = ({ tab }) => {
    const [list,         setList]         = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    const {
        mode,
        formData, setFormData,
        showForm, setShowForm,
        saving,
        handleView, handleAdd, handleModify, performSave, rights,
        handleEditCancel,
    } = useERPMode(
        initialState,
        async (data, isEdit) => {
            const payload = { ...data, group_type: GROUP_TYPE };
            return isEdit
                ? await updateUserGroup(data.group_id, payload)
                : await createUserGroup(payload);
        },
        () => {}, // ✅ BUG FIX: empty — handleSave khud reload + setFormData control karta hai
        tab?.appl_name
    );

    // ✅ BUG FIX: ab return karta hai — handleSave ko fresh list chahiye
    const loadGroups = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchUserGroupsByType("DEP");
            const finalData = Array.isArray(data) ? data : data?.data || [];
            setList(finalData);
            return finalData; // ✅ handleSave needs this
        } catch (err) {
            alertError("Fetch Error", "Failed to load department");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    useEffect(() => {
        if (showForm && mode === "view" && list.length > 0) {
            setFormData(list[currentIndex]);
        }
    }, [currentIndex, list, showForm, mode, setFormData]);

    const listWithSr = list.map((item, index) => ({
        ...item,
        Sr: index + 1,
    }));

    const handleRowSelect = (row) => {
        const index = list.findIndex(item => item.group_id === row.group_id);
        if (index !== -1) setCurrentIndex(index);
        handleView(row);
        setShowForm(true);
    };

    // ✅ BUG FIX: performSave ko formData pass nahi ho raha tha
    // ✅ BUG FIX: save ke baad fresh record dhundh ke setFormData karna missing tha
    const handleSave = async () => {
        if (!formData.group_name) {
            alertError("Validation", "Department Name is required");
            return;
        }

        const dataToSave = { ...formData, group_id: formData.group_id ?? null };
        const response = await performSave("group_id", dataToSave);

        if (response?.success) {
            showToast({ icon: "success", title: "Saved Successfully" });

            const freshList = await loadGroups();

            let newIndex = freshList.findIndex(i => i.group_id === dataToSave.group_id);
            if (newIndex === -1) {
                newIndex = freshList.findIndex(i => i.group_name === dataToSave.group_name);
            }
            if (newIndex === -1 && freshList.length > 0) newIndex = 0;

            if (newIndex !== -1) {
                setCurrentIndex(newIndex);
                setFormData({ ...freshList[newIndex] }); // ✅ server ka fresh data
            }
        }
    };

    const handleDelete = async (row) => {
        const confirmed = await confirmDelete({
            title: `Delete "${row.group_name}"?`,
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
    const handleDeleteMultiple = async (selected) => {
      // Normalize: Table may pass an array of row objects OR an array of keys
      const ids = (selected || []).map((item) =>
        typeof item === "object" ? item.group_name : item
      );
  
      if (ids.length === 0) return;
  
      const confirmed = await confirmDelete({
        title: `Delete ${ids.length} Department(s)?`,
      });
      if (!confirmed) return;
  
      try {
        const results = await Promise.all(ids.map((id) => deleteUserGroup(id)));
        const failed = results.filter((r) => !r?.success).length;
  
        if (failed === 0) {
          showToast({ icon: "success", title: `${ids.length} deleted` });
        } else {
          showToast({
            icon: "warning",
            title: `${ids.length - failed} deleted, ${failed} failed`,
          });
        }
        loadGroups();
        setShowForm(false);
      } catch (err) {
        alertError("Delete Error", "Failed to delete some Departments");
      }
    };


    useEffect(() => {
        setERPHandlers({
            onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
            onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
            onNew:  handleAdd,
            onSave: handleSave,
            // ✅ BUG FIX: "oonEsc" tha typo — "onEsc" hona chahiye, isliye ESC kaam nahi karta tha
            onEsc: () => {
                setShowForm(false);
                if (mode === "add") {
                    setFormData(initialState);
                }
            },
        });
    }, [list, handleAdd, formData, mode]);

    const handleTabChange = (targetTab) => {
        if (targetTab === "search") setShowForm(false);
        if (targetTab === "entry")  setShowForm(true);
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
                    onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
                    onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
                />
            ) : (
                <Table
                    activeTab="search"
                    onTabChange={handleTabChange}
                    title="Department Master"
                    onDeleteMultiple={handleDeleteMultiple}
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
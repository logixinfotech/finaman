// import { useEffect, useState, useCallback } from "react";
// import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
// import Table from "../../../../components/Reusable/table/Table";
// import UserGroupForm from "../UserMaster/UserGroupform";
// import { fetchUserGroupsByType, deleteUserGroup, createUserGroup, updateUserGroup } from "../../../../utils/api";
// import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
// import { setERPHandlers } from "../../../../utils/erpShortcuts";

// const GROUP_TYPE = "DESG";

// const initialState = {
//     group_id: null,
//     group_name: "",
//     remarks: "",
// };

// const columns = [
//     { key: "group_id", label: "ID" },
//     { key: "group_name", label: "Designation Name" },
//     { key: "remarks", label: "Remarks" },
// ];

// const DesignationMasterPage = ({ tab }) => {
//     const [list, setList] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [currentIndex, setCurrentIndex] = useState(0);

//     const {
//         mode,
//         formData, setFormData,
//         showForm, setShowForm,
//         saving, handleEditCancel,
//         handleView, handleAdd, handleModify, performSave, rights
//     } = useERPMode(
//         initialState,
//         async (data, isEdit) => {
//             const payload = { ...data, group_type: GROUP_TYPE }; // 🔥 AUTO TYPE

//             if (isEdit) {
//                 return await updateUserGroup(data.group_id, payload);
//             } else {
//                 return await createUserGroup(payload);
//             }
//         },
//         () => loadGroups(), tab.appl_name
//     );

//     const loadGroups = useCallback(async () => {
//         try {
//             setLoading(true);
//             const data = await fetchUserGroupsByType("DESG");
//             console.log("FULL API RESPONSE:", data); // 🔥 add this

//             setList(data?.data || []);
//         } catch (err) {
//             alertError("Fetch Error", "Failed to load designation");
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => { loadGroups(); }, [loadGroups]);

//     useEffect(() => {
//         if (showForm && mode === "view" && list.length > 0) {
//             setFormData(list[currentIndex]);
//         }
//     }, [currentIndex, list, showForm, mode]);

//     const handleRowSelect = (row) => {
//         const index = list.findIndex(item => item.group_id === row.group_id);
//         if (index !== -1) setCurrentIndex(index);
//         handleView(row);
//         setShowForm(true);
//     };

//     const handleSave = async () => {
//         if (!formData.group_name) {
//             alertError("Validation", "Designation Name is required");
//             return;
//         }

//         const response = await performSave("group_id");
//         if (response?.success) {
//             showToast({ icon: "success", title: "Saved Successfully" });
//             loadGroups();
//         }
//     };
   
//     const handleDelete = async (row) => {
//         const confirmed = await confirmDelete({ title: `Delete "${row.group_name}"?` });
//         if (confirmed) {
//             const res = await deleteUserGroup(row.group_id);
//             if (res.success) {
//                 showToast({ icon: "success", title: "Deleted" });
//                 loadGroups();
//                 setShowForm(false);
//             }
//         }
//     };

//     useEffect(() => {
//         setERPHandlers({
//             onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
//             onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
//             onNew: handleAdd,
//             onSave: handleSave,
//             onEsc: () => {
//                 setShowForm(false);
//                 if (mode === "add") {
//                     setFormData(initialState);
//                 }
//             },
//         });
//     }, [list]);

//     const handleTabChange = (targetTab) => {
//         if (targetTab === "search") setShowForm(false);
//         if (targetTab === "entry") setShowForm(true);
//     };

//     return (
//         <div>
//             {showForm ? (
//                 <UserGroupForm
//                     title="Designation Master"
//                     nameLabel="Designation Name"
//                     formData={formData}
//                     setFormData={setFormData}
//                     onSave={handleSave}
//                     onCancel={() => {
//                         setShowForm(false);
//                         setFormData(initialState);
//                     }}
//                     onDelete={handleDelete}
//                     mode={mode}
//                     saving={saving}
//                     onModify={handleModify}
//                     onNewEntry={handleAdd}
//                     currentRecord={currentIndex + 1}
//                     totalRecords={list.length}
//                     rights={rights}
//                     onEditCancel={handleEditCancel}
//                     activeTab={showForm ? "entry" : "search"}
//                     onTabChange={handleTabChange}
//                 />
//             ) : (
//                 <Table
//                     title="Designation Master"
//                     data={list}
//                     columns={columns}
//                     rowKey="group_id"
//                     loading={loading}
//                     onAdd={rights.add === 1 ? handleAdd : null}
//                     onRowDoubleClick={handleRowSelect}
//                 />
//             )}
//         </div>
//     );
// };

// export default DesignationMasterPage;
import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import UserGroupForm from "../UserMaster/UserGroupform";
import { fetchUserGroupsByType, deleteUserGroup, createUserGroup, updateUserGroup } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const GROUP_TYPE = "DESG";

const initialState = {
    group_id: null,
    group_name: "",
    remarks: "",
};

const columns = [
    { key: "Sr", label: "Sr" },
    { key: "group_name", label: "Designation Name" },
    { key: "remarks", label: "Remarks" },
];

const DesignationMasterPage = ({ tab }) => {
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
            if (isEdit) {
                return await updateUserGroup(data.group_id, payload);
            } else {
                return await createUserGroup(payload);
            }
        },
        () => loadGroups(), tab.appl_name
    );

    // ✅ FIX 1: return freshList so handleSave can use it
    const loadGroups = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchUserGroupsByType("DESG");
            const freshList = data?.data || [];
            setList(freshList);
            return freshList; // ✅ zaroor return karo
        } catch (err) {
            alertError("Fetch Error", "Failed to load designation");
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadGroups(); }, [loadGroups]);

    // ✅ FIX 2: setFormData dependency add karo
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
    

    // ✅ FIX 3: Save ke baad fresh data se saved record dhundho aur setFormData karo
    const handleSave = async () => {
        if (!formData.group_name) {
            alertError("Validation", "Designation Name is required");
            return;
        }

        const savedData = await performSave("group_id");

        if (savedData?.success) {
            showToast({ icon: "success", title: "Saved Successfully" });

            // Fresh list lo
            const freshList = await loadGroups();

            // Saved ID — response se lo, fallback formData se
            const savedId = savedData?.group_id ?? savedData?.data?.group_id ?? formData?.group_id;

            // ID se index dhundho
            let newIndex = freshList.findIndex((item) => item.group_id === savedId);

            // Nahi mila to name se dhundho (naya record case)
            if (newIndex === -1) {
                newIndex = freshList.findIndex((item) => item.group_name === formData?.group_name);
            }

            // Abhi bhi nahi mila to pehla record
            if (newIndex === -1) newIndex = 0;

            // ✅ Index aur form dono update karo
            setCurrentIndex(newIndex);
            setFormData({ ...freshList[newIndex] });

        } else if (savedData?.message) {
            alertError("Save failed", savedData.message);
        }
    };
const listWithSr = list.map((item, index) => ({
  ...item,
  Sr: index + 1
}));
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
                showToast({
                    icon: "warning",
                    title: `${ids.length - failed} deleted, ${failed} failed`,
                });
            }
 
            loadGroups();
            setShowForm(false);
        } catch (err) {
            alertError("Delete Error", "Failed to delete some designations");
        }
    };
    // ✅ FIX 4: handleSave aur handleAdd dependency mein add karo
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
    }, [list, handleAdd, handleSave]); // ✅ dependencies fix

    const handleTabChange = (targetTab) => {
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
import { useEffect, useState, useCallback } from "react";
import { fetchUsers } from "../../../../utils/api";
import Table from "../../../../components/Reusable/table/Table";
import UserAuthForm from "../UserMaster/UserAuthForm";
 import { useERPMode } from "../../../../components/Reusable/form/useFormMode"; 
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

  const columns = [
    { key: "user_id",   label: "User ID",           className: "font-bold text-blue-600" },
    { key: "user_name", label: "User Name" },
    { key: "role",      label: "Role / Designation" },
    {
      key: "block",
      label: "Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px]   ${
          row.block === 0
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}>
          {row.block === 0 ? "ACTIVE" : "BLOCKED"}
        </span>
      ),
    },
  ];
const UserAuthenticationPage = ({ tab }) => {
  const [list, setList]               = useState([]);
  const [loading, setLoading]         = useState(true);
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
    {},                         // initialState — auth form has no editable top-level fields
    async (data, isEdit) => {   // save callback — not used in auth master but required by hook
      return { success: true };
    },
    () => loadUsers(),          // refresh after save
    tab?.appl_name
  );

  /* ── Tab helpers (mirrors UserGroupMasterPage) ── */
  const handleTabChange = (targetTab) => {
    setActiveTab(targetTab);
    if (targetTab === "search") setShowForm(false);
    if (targetTab === "entry")  setShowForm(true);
  };

  /* ── Data loading ── */
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchUsers();
      const actual = Array.isArray(response) ? response : (response?.data || []);
      setList(actual);
    } catch (err) {
      alertError("Fetch Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]); 
  useEffect(() => {
    if (showForm && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm]);
 
  const handleRowSelect = (row) => {
    const index = list.findIndex(item => item.userma_id === row.userma_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
    setShowForm(true);
  }; 
  useEffect(() => {
    setERPHandlers({
      onNextRecord:  () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord:  () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onFirstRecord: () => setCurrentIndex(0),
      onLastRecord:  () => setCurrentIndex(list.length - 1),
      onEsc:         () => setShowForm(false),
    });
  }, [list]);
 


  return (
    <div className="w-full h-full">
      {showForm ? (
        <UserAuthForm 
          selectedUser={list[currentIndex]} 
          mode={mode}
          saving={saving}
          rights={rights}
 
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
          totalRecords={list.length} 
 
          onFirstRecord={()  => setCurrentIndex(0)}
          onLastRecord={()  => setCurrentIndex(list.length - 1)} 
          onModify={handleModify}
          onEditCancel={handleEditCancel}
          onCancel={() => { setShowForm(false); loadUsers(); }} 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
        />
      ) : (
        <Table
          title="User Authentication Master"
          activeTab="search" 
             onTabChange={handleTabChange}
          data={list}
          columns={columns}
          rowKey="userma_id"
          loading={loading}
          onRefresh={loadUsers}
          onRowDoubleClick={handleRowSelect} 
        />
      )}
    </div>
  );
};

export default UserAuthenticationPage;

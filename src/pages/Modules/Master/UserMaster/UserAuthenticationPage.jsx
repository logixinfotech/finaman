import { useEffect, useState, useCallback } from "react";
import { fetchUsers } from "../../../../utils/api";
import Table from "../../../../components/Reusable/table/Table";
import UserAuthForm from "../UserMaster/UserAuthForm";

const UserAuthenticationPage = () => {
  const [list, setList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const loadUsers = useCallback(async (filterParams = {}) => {
    try {
      setLoading(true);
      const response = await fetchUsers(filterParams);
      const actualData = Array.isArray(response) ? response : (response?.data || []);
      setList(actualData);
    } catch (err) {
      console.error("Failed to load users:", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  const handleRowSelect = (row) => {
    const index = list.findIndex((item) => item.userma_id === row.userma_id);
    if (index !== -1) {
      setCurrentIndex(index);
      setShowForm(true);
    }
  };

  const handleNextRecord = () => setCurrentIndex((prev) => (prev < list.length - 1 ? prev + 1 : prev));
  const handlePrevRecord = () => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  const handleFirstRecord = () => setCurrentIndex(0);
  const handleLastRecord = () => setCurrentIndex(list.length - 1);

  const handleCancel = () => {
    setShowForm(false);
    loadUsers(filters);
  };

  const columns = [
    { key: "user_id", label: "User ID", className: "font-bold text-blue-600" },
    { key: "user_name", label: "User Name" },
    { key: "role", label: "Role/Designation" },
    {
      key: "block",
      label: "Status",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.block === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
          {row.block === 0 ? "ACTIVE" : "BLOCKED"}
        </span>
      )
    }
  ];

  const totalRecords = list.length;
  const currentRecord = totalRecords > 0 ? currentIndex + 1 : 0;

  return (
    <div className="w-full">
      {showForm ? (
        <UserAuthForm
          selectedUser={list[currentIndex]}  
          onCancel={handleCancel}
          currentRecord={currentRecord}
          totalRecords={totalRecords}
          onNextRecord={handleNextRecord}
          onPrevRecord={handlePrevRecord}
          onFirstRecord={handleFirstRecord}
          onLastRecord={handleLastRecord}
        />
      ) : (
        <Table
          title="User Authentication Master"
          data={list}
          columns={columns}
          rowKey="userma_id"
          loading={loading}
          onRefresh={() => loadUsers(filters)}
          onRowDoubleClick={(row) => handleRowSelect(row)}
          showForm={showFilter}
          onToggleFilter={() => setShowFilter(p => !p)}

        />
      )}
    </div>
  );
};

export default UserAuthenticationPage;
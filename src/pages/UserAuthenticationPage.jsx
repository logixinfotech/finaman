import { useEffect, useState } from "react";
import { fetchUsers } from "../utils/api";
import Table from "../components/Reusable/Table";
import UserAuthForm from "../components/UserMaster/UserAuthForm";
import IconButton from "../components/Reusable/IconButton";
import { Pencil } from "lucide-react"; 

const UserAuthenticationPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
  loadUsers();
}, []);

const loadUsers = async () => {
  try {
    const data = await fetchUsers();
    setUsers(data);
  } catch (err) {
    console.error(err);
  }
};

  const handleEdit = (row) => {
    setSelectedUser(row);
    setShowForm(true);
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setShowForm(false);
  };

const columns = [
  { key: "user_id", label: "User ID" },
  { key: "user_name", label: "User Name" },
  { key: "userma_id", label: "User Master ID" },
  { key: "role", label: "Role" },
  { 
    key: "block", 
    label: "Status",
    render: (row) => row.block === 1 ? "Blocked" : "Active"
  }
];
  return (
    <div className=" ">

      {showForm ? (
        <UserAuthForm
          selectedUser={selectedUser}
          onCancel={handleCancel}
        />
      ) : (
        <Table
          title="User Authentication Master"
          data={users}
          columns={columns}
           rowKey="userma_id"
          headerAction={null}
           onRefresh={() => loadUsers()}
          actions={(row) => (
            <IconButton
              title="Manage Permissions"
              variant="edit"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
            >
              <Pencil size={16} />
            </IconButton>
          )}
        />
      )}

    </div>
  );
};

export default UserAuthenticationPage;

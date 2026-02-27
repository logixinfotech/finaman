import { useEffect, useState } from "react";
import Table from "../components/Reusable/Table";
import UserGroupForm from "../components/UserMaster/UserGroupform";
import { Pencil, Trash2, Plus } from "lucide-react";

const initialState = {
  group_id: null,
  group_name: "",
  remarks: "",
};

const UserGroupMasterPage = () => {
  const [list, setList] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadGroupList = async () => {
    const dummy = [
      { group_id: 1, group_name: "PURCHASE", remarks: "" },
      { group_id: 2, group_name: "STORE", remarks: "" },
      { group_id: 3, group_name: "ACCOUNT", remarks: "" },
    ];
    setList(dummy);
  };

  useEffect(() => {
    loadGroupList();
  }, []);

  const handleAdd = () => {
    setFormData(initialState);
    setSelectedRow(null);
    setShowForm(true);
  };

  const handleEdit = (row) => {
    setFormData(row);
    setSelectedRow(row);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (formData.group_id) {
      console.log("Updating:", formData);
    } else {
      console.log("Creating:", formData);
    }

    await loadGroupList();
    handleCancel();
  };

  const handleDelete = async (row) => {
    console.log("Deleting:", row);
    await loadGroupList();
  };

  const handleCancel = () => {
    setFormData(initialState);
    setSelectedRow(null);
    setShowForm(false);
  };

  const columns = [
    { key: "group_id", label: "ID" },
    { key: "group_name", label: "Group Name" },
    { key: "remarks", label: "Remarks" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      <Table
        title="User Group Master"
        data={list}
        columns={columns}
        rowKey="group_id"
        selectedRow={selectedRow}
        showForm={showForm}
        formComponent={
          <UserGroupForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        }
        headerAction={
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 h-8 px-3 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <Plus size={14} />
            Add Group
          </button>
        }
        actions={(row) => (
          <div className="flex gap-2 justify-end">
            <button
              className="h-7 w-7 flex items-center justify-center border rounded-md hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
            >
              <Pencil size={14} />
            </button>

            <button
              className="h-7 w-7 flex items-center justify-center border rounded-md hover:bg-red-50 text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />
    </div>
  );
};

export default UserGroupMasterPage;

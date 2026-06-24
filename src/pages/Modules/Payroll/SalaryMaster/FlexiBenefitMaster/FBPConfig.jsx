// FBPConfig.jsx

import { useEffect, useState } from "react";
import Table from "../../../../../components/Reusable/table/Table";
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode";
import FBPConfigForm from "./FBPConfigForm";
import { setERPHandlers } from "../../../../../utils/erpShortcuts";

const initialState = {
  fbp_id: null,
  name: "",
  code: "",
  category: "",
  max_limit: "",
  taxable: "Yes",
  frequency: "Monthly",
  applicable_from: "",
  status: "Active",
};

const columns = [
  { key: "name", label: "Benefit Name" },
  { key: "code", label: "Code" },
  { key: "category", label: "Category" },
  { key: "max_limit", label: "Max Limit (₹)" },
  { key: "taxable", label: "Taxable" },
  { key: "frequency", label: "Frequency" },
  { key: "status", label: "Status" },
];

const dummyData = [
  {
    fbp_id: 1,
    name: "House Rent Allowance",
    code: "HRA",
    category: "Housing",
    max_limit: "50000",
    taxable: "No",
    frequency: "Monthly",
    applicable_from: "2026-04-01",
    status: "Active",
  },
];

const FBPConfig = ({ tab }) => {
  const [list, setList] = useState(dummyData);
  const [currentIndex, setCurrentIndex] = useState(0);

  const {
    mode,
    formData,
    setFormData,
    showForm,
    setShowForm,
    saving,
    handleEditCancel,
    handleView,
    handleAdd,
    handleModify,
    rights,
  } = useERPMode(
    initialState,
    async () => ({ success: true }),
    () => {},
    tab.appl_name
  );

  useEffect(() => {
    if (list.length > 0) {
      setFormData(list[0]);
    }
  }, []);

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode]);

  const handleTabChange = (t) => {
    if (t === "search") setShowForm(false);
    if (t === "entry") setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex(
      (i) => i.fbp_id === row.fbp_id
    );

    if (index !== -1) setCurrentIndex(index);

    handleView(row);
  };

  const handleSave = async (updatedData) => {
    if (mode === "add") {
      const newData = {
        ...updatedData,
        fbp_id: Date.now(),
      };

      setList((prev) => [...prev, newData]);
      setCurrentIndex(list.length);
      setFormData(newData);
    }

    if (mode === "edit") {
      const updatedList = list.map((item) =>
        item.fbp_id === updatedData.fbp_id
          ? updatedData
          : item
      );

      setList(updatedList);
      setFormData(updatedData);
    }
  };

  const handleDelete = (row) => {
    const updatedList = list.filter(
      (item) => item.fbp_id !== row.fbp_id
    );

    setList(updatedList);

    if (updatedList.length > 0) {
      setFormData(updatedList[0]);
      setCurrentIndex(0);
    } else {
      setFormData(initialState);
    }

    setShowForm(false);
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) =>
          Math.min(p + 1, list.length - 1)
        ),

      onPrevRecord: () =>
        setCurrentIndex((p) => Math.max(p - 1, 0)),

      onNew: handleAdd,
      onSave: handleSave,
      onEsc: handleEditCancel,
    });
  }, [list]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <FBPConfigForm
          initialData={formData}
          onSave={handleSave}
          onDelete={handleDelete}
          mode={mode}
          saving={saving}
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={
            list.length > 0 ? currentIndex + 1 : 0
          }
          totalRecords={list.length}
          rights={rights}
          onEditCancel={handleEditCancel}
          activeTab="entry"
          onTabChange={handleTabChange}
          formData={formData}
          setFormData={setFormData}
          onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
        />
      ) : (
        <div className=" bg-slate-50 h-full">
          <Table
            title="FBP Config Master"
            data={list}
            columns={columns}
            rowKey="fbp_id"
            loading={false}
            onAdd={
              rights?.add === 1
                ? handleAdd
                : handleAdd
            }
            onRowDoubleClick={handleRowSelect}
          />
        </div>
      )}
    </div>
  );
};

export default FBPConfig;
import { useEffect, useState } from "react";
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode";
import Table from "../../../../../components/Reusable/table/Table";
import InvestmentDeclarationForm from "./InvestmentDeclarationForm";

import {
  confirmDelete,
  showToast,
} from "../../../../../components/Reusable/alert";

import { setERPHandlers } from "../../../../../utils/erpShortcuts";

const initialState = {
  investment_declaration_id: "",

  employee_id: "",
  employee_name: "",

  financial_year: "",
  declaration_type: "",

  investment_name: "",

  declared_amount: "",

  proof_submitted: "No",

  status: "Active",
};

const columns = [
  {
    key: "employee_name",
    label: "Employee",
  },

  {
    key: "financial_year",
    label: "Financial Year",
  },

  {
    key: "declaration_type",
    label: "Declaration Type",
  },

  {
    key: "investment_name",
    label: "Investment Name",
  },

  {
    key: "declared_amount",
    label: "Declared Amount",
  },

  {
    key: "proof_submitted",
    label: "Proof Submitted",
  },

  {
    key: "status",
    label: "Status",
  },
];

const dummyData = [
  {
    investment_declaration_id: 1,

    employee_id: 1,
    employee_name: "Rahul Sharma",

    financial_year: "2025-26",

    declaration_type: "80C",

    investment_name: "PPF",

    declared_amount: 150000,

    proof_submitted: "Yes",

    status: "Active",
  },

  {
    investment_declaration_id: 2,

    employee_id: 2,
    employee_name: "Amit Verma",

    financial_year: "2025-26",

    declaration_type: "HRA",

    investment_name: "House Rent",

    declared_amount: 240000,

    proof_submitted: "No",

    status: "Active",
  },
];

const InvestmentDeclarationMaster = ({
  tab,
}) => {
  const [list, setList] = useState(dummyData);

  const [loading, setLoading] =
    useState(false);

  const [currentIndex, setCurrentIndex] =
    useState(0);

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

    async () => ({
      success: true,
    }),

    () => {},

    tab?.appl_name || ""
  );

  useEffect(() => {
    if (list.length > 0) {
      setFormData(list[0]);
    }
  }, []);

  useEffect(() => {
    if (
      showForm &&
      mode === "view" &&
      list.length > 0
    ) {
      setFormData(list[currentIndex]);
    }
  }, [
    currentIndex,
    list,
    showForm,
    mode,
    setFormData,
  ]);

  const handleTabChange = (t) => {
    if (t === "search")
      setShowForm(false);

    if (t === "entry")
      setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex(
      (i) =>
        i.investment_declaration_id ===
        row.investment_declaration_id
    );

    if (index !== -1)
      setCurrentIndex(index);

    handleView(row);
  };

  const handleSave = async (
    updatedData
  ) => {
    if (
      mode === "add"
    ) {
      const newRow = {
        ...updatedData,

        investment_declaration_id:
          Date.now(),
      };

      setList((prev) => [
        ...prev,
        newRow,
      ]);

      showToast({
        icon: "success",
        title: "Saved Successfully",
      });

      setCurrentIndex(list.length);

      setFormData(newRow);
      handleView(newRow);   // for add
handleView(updatedData); // for edit
      

      return;
    }

    if (
      mode === "edit"
    ) {
      const updatedList = list.map(
        (item) =>
          item.investment_declaration_id ===
          updatedData.investment_declaration_id
            ? updatedData
            : item
      );

      setList(updatedList);

      setFormData(updatedData);

      showToast({
        icon: "success",
        title: "Updated Successfully",
      });
    }
  };

  const handleDelete = async (
    row
  ) => {
    const confirmed =
      await confirmDelete({
        title: `Delete "${row.investment_name}" ?`,
      });

    if (confirmed) {
      const updatedList =
        list.filter(
          (item) =>
            item.investment_declaration_id !==
            row.investment_declaration_id
        );

      setList(updatedList);

      showToast({
        icon: "success",
        title: "Deleted",
      });

      setShowForm(false);
    }
  };

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) =>
          Math.min(
            p + 1,
            list.length - 1
          )
        ),

      onPrevRecord: () =>
        setCurrentIndex((p) =>
          Math.max(p - 1, 0)
        ),

      onNew: handleAdd,

      onSave: handleSave,

      onEsc: () =>
        setShowForm(false),
    });
  }, [
    list,
    handleAdd,
    setShowForm,
  ]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <InvestmentDeclarationForm
          initialData={formData}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() =>
            setShowForm(false)
          }
          mode={mode}

          saving={saving}
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={
            list.length > 0
              ? currentIndex + 1
              : 0
          }
          totalRecords={list.length}
          rights={rights}
          onEditCancel={
            handleEditCancel
          }
          activeTab="entry"
          onTabChange={
            handleTabChange
          }
        />
      ) : (
        <div className=" bg-slate-50 h-full">
          <Table
            title="Investment Declaration Master"
            data={list}
            columns={columns}
            rowKey="investment_declaration_id"
            loading={loading}
            onAdd={
              rights?.add === 1
                ? handleAdd
                : null
            }
            onRowDoubleClick={
              handleRowSelect
            }
          />
        </div>
      )}
    </div>
  );
};

export default InvestmentDeclarationMaster;
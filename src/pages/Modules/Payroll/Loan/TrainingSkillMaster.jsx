// TrainingSkillMaster.jsx

import {
  useEffect,
  useState,
  useCallback,
} from "react";

import { useERPMode } from "../../../../components/Reusable/form/useFormMode";

import Table from "../../../../components/Reusable/table/Table";

import TrainingSkillMasterForm from "./TrainingSkillMasterForm";

import {
  confirmDelete,
  showToast,
} from "../../../../components/Reusable/alert";

import { setERPHandlers } from "../../../../utils/erpShortcuts";

import {
  getTrainingSkillMaster,
  createTrainingSkillMaster,
  updateTrainingSkillMaster,
  deleteTrainingSkillMaster,
} from "../../../../utils/api";

const initialState = {
  id: null,

  employee_id: "",

  master_type: "",

  training_skill_name: "",

  institute_name: "",

  completion_date: "",

  expiry_date: "",

  score: "",

  remarks: "",
};

const columns = [
  {
    key: "employee_name",
    label: "Employee",
  },
  {
    key: "master_type",
    label: "Type",
  },
  {
    key: "training_skill_name",
    label: "Training / Skill",
  },
  {
    key: "institute_name",
    label: "Institute",
  },
  {
    key: "score",
    label: "Score",
  },
];

const TrainingSkillMaster = ({
  tab,
}) => {
  const [list, setList] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const loadData = useCallback(
    async () => {
      try {
        setLoading(true);

        const res =
          await getTrainingSkillMaster();

        setList(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

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

    performSave,

    rights,
  } = useERPMode(
    initialState,

    async (data) =>
      data.id
        ? await updateTrainingSkillMaster(
            data.id,
            data
          )
        : await createTrainingSkillMaster(
            data
          ),

    loadData,

    tab.appl_name
  );

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (
    targetTab
  ) => {
    if (targetTab === "search")
      setShowForm(false);

    if (targetTab === "entry")
      setShowForm(true);
  };

  const handleRowSelect = (
    row
  ) => {
    const index = list.findIndex(
      (item) => item.id === row.id
    );

    if (index !== -1)
      setCurrentIndex(index);

    handleView(row);
  };

  const handleSave = async (
    updatedData = formData
  ) => {
    if (!updatedData.employee_id) {
      showToast({
        icon: "error",
        title:
          "Please select employee",
      });

      return;
    }

    const response =
      await performSave(
        "id",
        updatedData
      );

    if (response?.success) {
      showToast({
        icon: "success",
        title:
          "Saved Successfully",
      });

      await loadData();
    }
  };

  const handleDelete = async (
    row
  ) => {
    const confirmed =
      await confirmDelete({
        title: `Delete "${row.training_skill_name}" ?`,
      });

    if (!confirmed) return;

    await deleteTrainingSkillMaster(
      row.id
    );

    showToast({
      icon: "success",
      title: "Deleted",
    });

    loadData();
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

      onBackspaceNavigation: true,
    });
  }, [
    list,
    handleAdd,
    handleSave,
    setShowForm,
  ]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <TrainingSkillMasterForm
          initialData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() =>
            setShowForm(false)
          }
          onDelete={handleDelete}
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
          onPrevRecord={() => setCurrentIndex(p => Math.max(p - 1, 0))}
          onNextRecord={() => setCurrentIndex(p => Math.min(p + 1, list.length - 1))}
        />
      ) : (
        <div className="p-4 bg-slate-50 h-full">
          <Table
            title="Training / Skill Master List"
            data={list}
            columns={columns}
            rowKey="id"
            loading={loading}
            onAdd={
              rights.add === 1
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

export default TrainingSkillMaster;
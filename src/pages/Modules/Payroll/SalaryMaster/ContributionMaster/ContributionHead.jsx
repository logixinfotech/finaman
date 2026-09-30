import { useEffect, useState, useCallback, useRef } from "react";
import Table from "../../../../../components/Reusable/table/Table"; 
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode"; 
import ContributionHeadForm from "./ContributionHeadForm";
import {
  fetchContributionHeads,
  createContributionHead,
  updateContributionHead,
  deleteContributionHead
} from "../../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../../utils/erpShortcuts";

const initialState = {
  name: "",
  code: "",
  type: "",
  pre_tax: "Yes",
  max_amount: "",
  status: "Active",
};

const columns = [
  { key: "name",       label: "Name"       },
  { key: "code",       label: "Code"       },
  { key: "type",       label: "Type"       },
  { key: "pre_tax",    label: "Pre-Tax"    },
  { key: "max_amount", label: "Max Amount" },
  { key: "status",     label: "Status"     },
];

const ContributionHead = ({ tab }) => {
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
      return isEdit
        ? await updateContributionHead(data.contribution_head_id, data)
        : await createContributionHead(data);
    },
    () => loadList(),
    tab?.appl_name
  );

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchContributionHeads();
      const finalData = Array.isArray(data) ? data : data?.data || [];
      setList(finalData);
      if (finalData.length > 0) {
        setFormData(finalData[0]);
        setCurrentIndex(0);
      }
      return finalData;
    } catch (err) {
      console.error("Contribution Head Fetch Error:", err);
      alertError("Fetch Error", "Failed to load contribution heads");
      return [];
    } finally {
      setLoading(false);
    }
  }, [setFormData]);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleTabChange = (t) => {
    if (t === "search") setShowForm(false);
    if (t === "entry")  setShowForm(true);
  };

  const handleRowSelect = (row) => {
    const index = list.findIndex(i => i.contribution_head_id === row.contribution_head_id);
    if (index !== -1) setCurrentIndex(index);
    handleView(row);
  };

  const handleSave = async (updatedData) => {
    const response = await performSave("contribution_head_id", updatedData);
    if (response?.success) {
      const freshList = await loadList();

      const savedId = updatedData.contribution_head_id ?? response?.data?.contribution_head_id;
      const newIndex = freshList.findIndex(i => i.contribution_head_id === savedId);

      if (newIndex !== -1) {
        setCurrentIndex(newIndex);
        handleView(freshList[newIndex]);
      } else if (freshList.length > 0) {
        const lastIndex = freshList.length - 1;
        setCurrentIndex(lastIndex);
        handleView(freshList[lastIndex]);
      }
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({ title: `Delete "${row.name}"?` });
    if (confirmed) {
      const res = await deleteContributionHead(row.contribution_head_id);
      if (res?.success) {
        showToast({ icon: "success", title: "Deleted" });
        loadList();
        setShowForm(false);
      }
    }
  };

  const handleDeleteMultiple = async (selected) => {
    const ids = (selected || []).map((item) =>
      typeof item === "object" ? item.contribution_head_id : item
    );

    if (ids.length === 0) return;

    const confirmed = await confirmDelete({
      title: `Delete ${ids.length} head(s)?`,
    });
    if (!confirmed) return;

    try {
      const results = await Promise.all(ids.map((id) => deleteContributionHead(id)));
      const failed = results.filter((r) => !r?.success).length;

      if (failed === 0) {
        showToast({ icon: "success", title: `${ids.length} deleted` });
      } else {
        showToast({
          icon: "warning",
          title: `${ids.length - failed} deleted, ${failed} failed`,
        });
      }
      loadList();
      setShowForm(false);
    } catch (err) {
      alertError("Delete Error", "Failed to delete some heads");
    }
  };

  const saveBtnRef = useRef(null);

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
      onNew:  handleAdd,
      onSave: handleSave,
      onEsc:  handleEditCancel,
    });
  }, [list, handleAdd, handleSave, handleEditCancel]);

  return (
    <div className="h-full w-full">
      {showForm ? (
        <ContributionHeadForm
          initialData={formData}
          saveBtnRef={saveBtnRef}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={handleEditCancel}
          mode={mode}
          saving={saving}
          onModify={handleModify}
          onNewEntry={handleAdd}
          currentRecord={list.length > 0 ? currentIndex + 1 : 0}
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
        <div className="bg-slate-50 h-full">
          <Table
            activeTab="search"
            onTabChange={handleTabChange}
            title="Contribution Head Master"
            data={list}
            columns={columns}
            rowKey="contribution_head_id"
            loading={loading}
            onAdd={rights.add === 1 ? handleAdd : null}
            onRowDoubleClick={handleRowSelect}
            onDeleteMultiple={handleDeleteMultiple}
          />
        </div>
      )}
    </div>
  );
};

export default ContributionHead;
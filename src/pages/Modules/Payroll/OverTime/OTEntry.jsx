import { useEffect, useState, useCallback } from "react";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";
import Table from "../../../../components/Reusable/table/Table";
import OTEntryForm from "./OTEntryForm";
import { fetchOTRules, deleteOTRule, createOTRule, updateOTRule } from "../../../../utils/api";
import { confirmDelete, showToast, alertError } from "../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../utils/erpShortcuts";

const initialState = {
    rule_id: null,
    min_hours_required: "",
    max_hours_allowed: "",
    ot_multiplier: "",
    applicable_day_type: ""
};

const columns = [
    { key: "applicable_day_type", label: "Day Type" },
    { key: "min_hours_required", label: "Min Hours" },
    { key: "max_hours_allowed", label: "Max Hours" },
    { key: "ot_multiplier", label: "Multiplier" },
];

const OTEntry = ({ tab }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const onSuccess = () => {
        loadOTRules();
     };
    const {
        mode,
        formData, setFormData,
        showForm, setShowForm,
        saving, handleEditCancel,
        handleView, handleAdd, handleModify, performSave, rights
    } = useERPMode(
        initialState,
        async (data, isEdit) => {
            return isEdit ? await updateOTRule(data.rule_id, data) : await createOTRule(data);
        },
        onSuccess,
        tab.appl_name
    );

    const loadOTRules = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchOTRules();
            const finalData = Array.isArray(data) ? data : data?.data || [];
            setList(finalData);
            if (finalData.length > 0) {
                setFormData(finalData[0]);
                setCurrentIndex(0);
            }
        } catch (err) {
            alertError("Fetch Error", "Failed to load OT rules");
        } finally {
            setLoading(false);
        }
    }, [setFormData]);

    useEffect(() => { loadOTRules(); }, [loadOTRules]);

    useEffect(() => {
        if (showForm && mode === "view" && list.length > 0) {
            setFormData(list[currentIndex]);
        }
    }, [currentIndex, list, showForm, mode, setFormData]);

    const handleTabChange = (targetTab) => {
        if (targetTab === "search") setShowForm(false);
        if (targetTab === "entry") setShowForm(true);
    };

    const handleRowSelect = (row) => {
        const index = list.findIndex(item => item.rule_id === row.rule_id);
        if (index !== -1) setCurrentIndex(index);
        handleView(row);
    };

    const handleSave = async () => {
  const res = await performSave("rule_id"); // 🔥 IMPORTANT

  if (res?.success) {
    showToast({ icon: "success", title: "Saved Successfully" });
  }
};

    const handleDelete = async (row) => {
        const confirmed = await confirmDelete({ title: `Delete OT Rule?` });
        if (confirmed) {
            const res = await deleteOTRule(row.rule_id);
            if (res.success) {
                showToast({ icon: "success", title: "Deleted Successfully" });
                loadOTRules();
                setShowForm(false);
            }
        }
    };

    useEffect(() => {
        setERPHandlers({
            onNextRecord: () => setCurrentIndex(p => Math.min(p + 1, list.length - 1)),
            onPrevRecord: () => setCurrentIndex(p => Math.max(p - 1, 0)),
            onNew: handleAdd,
            onSave: handleSave,
            onEsc: () => setShowForm(false),
        });
    }, [list, handleAdd, handleSave, setShowForm]);

    return (
        <div className="h-full w-full">
            {showForm ? (
                <OTEntryForm
                    formData={formData}
                    setFormData={setFormData}                     
                    onSave={handleSave}
                    onCancel={() => setShowForm(false)}
                    onDelete={handleDelete}
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
                />
            ) : (
                <div className="p-4 bg-slate-50 h-full">
                    <Table
                        title="OT Rule List"
                        data={list}
                        columns={columns}
                        rowKey="rule_id"
                        loading={loading}
                        onAdd={rights.add === 1 ? handleAdd : null}
                        onRowDoubleClick={handleRowSelect}
                    />
                </div>
            )}
        </div>
    );
};

export default OTEntry;
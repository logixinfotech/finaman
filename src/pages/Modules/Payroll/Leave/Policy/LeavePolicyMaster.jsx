import React, { useEffect, useState, useCallback } from "react";
import Table from "../../../../../components/Reusable/table/Table";
import LeavePolicyMasterForm from "./LeavePolicyMasterForm";
import { useERPMode } from "../../../../../components/Reusable/form/useFormMode";
import {
  getLeavePolicies,
  createLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
} from "../../../../../utils/api";
import { confirmDelete, showToast } from "../../../../../components/Reusable/alert";
import { setERPHandlers } from "../../../../../utils/erpShortcuts";
import { BookOpen } from "lucide-react";

const initialState = {
  policy_code: "",
  policy_name: "",
  leave_type_id: "",
  leave_year_type: "Financial",
  effective_from: new Date().toISOString().split("T")[0],
  effective_to: "",
  is_active: true,
  annual_quota: 12.0,
  accrual_method: "Monthly",
  credit_timing: "Start",
  days_per_period: 1.0,
  rounding: "None",
  max_balance_cap: "",
  accrue_in_notice: true,
  accrue_in_lop: false,
  lop_threshold_days: 15,
  tenure_slabs: [],
  eligibility_start: "DOJ",
  waiting_period_days: 0,
  joining_month_credit: "CutoffRule",
  cutoff_day: 15,
  first_year_quota: "Prorata",
  back_credit_after_probation: false,
  carry_forward_allowed: true,
  carry_forward_basis: "All",
  max_cf_days: 0,
  overall_accumulation_limit: 30,
  cf_expiry_value: 0,
  cf_expiry_unit: "Never",
  excess_above_cap_action: "Lapse",
  refused_leave_carries: true,
  encashable: false,
  encash_timing: "YearEnd",
  max_encash_days_per_year: 0,
  min_balance_to_retain: 0,
  encashment_basis: "Basic",
  encashment_divisor: 30,
  exit_month_credit: "Prorata",
  recover_excess_availed: true,
  settle_balance_action: "Encash",
  sandwich_rule: false,
  min_notice_days: 0,
  max_consecutive_days: 0,
  doc_required_after_days: 3,
  allow_negative_balance: false,
  clubbing_allowed: true,
  applicability: { department: "All" },
};

const columns = [
  {
    key: "policy_code",
    label: "Policy Code",
    width: 140,
    render: (row) => (
      <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
        {row.policy_code || "—"}
      </span>
    ),
  },
  {
    key: "policy_name",
    label: "Policy Name",
    width: 220,
    render: (row) => (
      <span className="font-medium text-slate-800">{row.policy_name || "—"}</span>
    ),
  },
  {
    key: "leave_name",
    label: "Leave Type",
    width: 180,
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        {row.leave_name ? `${row.leave_name} (${row.leave_code || "LT"})` : "—"}
      </span>
    ),
  },
  {
    key: "annual_quota",
    label: "Quota / Yr",
    width: 100,
    align: "right",
    render: (row) => (
      <span className="font-semibold text-slate-700">
        {row.annual_quota !== undefined ? `${row.annual_quota} d` : "12 d"}
      </span>
    ),
  },
  {
    key: "accrual_method",
    label: "Accrual Method",
    width: 130,
    render: (row) => (
      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
        {row.accrual_method || "Monthly"}
      </span>
    ),
  },
  {
    key: "carry_forward_allowed",
    label: "Carry Fwd",
    width: 100,
    render: (row) => (
      <span
        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
          row.carry_forward_allowed !== false
            ? "bg-purple-50 text-purple-700 border border-purple-200"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {row.carry_forward_allowed !== false ? "Allowed" : "No"}
      </span>
    ),
  },
  {
    key: "is_active",
    label: "Status",
    width: 100,
    render: (row) => {
      const active = row.is_active !== false;
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
            active
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-500 border-slate-300"
          }`}
        >
          {active ? "Active" : "Inactive"}
        </span>
      );
    },
  },
];

const LeavePolicyMaster = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
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
    performSave,
    rights,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      return isEdit
        ? await updateLeavePolicy(data.policy_id, data)
        : await createLeavePolicy(data);
    },
    () => loadList(),
    tab?.appl_name || "LeavePolicyMaster"
  );

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLeavePolicies();
      setList(res?.data || []);
    } catch (err) {
      showToast({ icon: "error", title: "Failed to load leave policies." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Record Navigation
  const navigateRecord = useCallback(
    (direction) => {
      if (!list.length) return;
      let newIdx = currentIndex;
      if (direction === "first") newIdx = 0;
      else if (direction === "prev") newIdx = Math.max(0, currentIndex - 1);
      else if (direction === "next") newIdx = Math.min(list.length - 1, currentIndex + 1);
      else if (direction === "last") newIdx = list.length - 1;

      setCurrentIndex(newIdx);
      handleView(list[newIdx]);
    },
    [list, currentIndex, handleView]
  );

  // Keyboard shortcuts
  useEffect(() => {
    setERPHandlers({
      onAdd: () => handleAdd(initialState),
      onModify: () => {
        if (showForm && mode === "view") handleModify();
        else if (!showForm && list[currentIndex]) {
          handleView(list[currentIndex]);
          handleModify();
        }
      },
      onSave: () => {
        if (showForm && (mode === "add" || mode === "edit")) performSave();
      },
      onCancel: () => {
        if (showForm) {
          if (mode === "add" || mode === "edit") handleEditCancel();
          else setShowForm(false);
        }
      },
      onDelete: () => {
        if (showForm && mode === "view" && formData?.policy_id) {
          handleDelete(formData);
        }
      },
      onPrev: () => navigateRecord("prev"),
      onNext: () => navigateRecord("next"),
      onFirst: () => navigateRecord("first"),
      onLast: () => navigateRecord("last"),
    });

    return () => setERPHandlers({});
  }, [
    showForm,
    mode,
    formData,
    list,
    currentIndex,
    handleAdd,
    handleModify,
    performSave,
    handleEditCancel,
    setShowForm,
    navigateRecord,
  ]);

  const handleRowClick = (row, idx) => {
    setCurrentIndex(idx);
    handleView(row);
  };

  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete policy "${row.policy_code}"?`,
      text: "This will remove the policy rule configuration.",
    });
    if (!confirmed) return;

    try {
      await deleteLeavePolicy(row.policy_id);
      showToast({ icon: "success", title: "Policy deleted successfully." });
      setShowForm(false);
      loadList();
    } catch (err) {
      showToast({ icon: "error", title: "Failed to delete policy." });
    }
  };

  if (showForm) {
    return (
      <LeavePolicyMasterForm
        mode={mode}
        initialData={formData}
        setFormData={setFormData}
        onSave={performSave}
        onCancel={() => setShowForm(false)}
        onEditCancel={handleEditCancel}
        onDelete={handleDelete}
        saving={saving}
        onModify={handleModify}
        onNewEntry={() => handleAdd(initialState)}
        currentRecord={list.length > 0 ? currentIndex + 1 : 1}
        totalRecords={list.length || 1}
        rights={rights}
        activeTab="entry"
        onTabChange={(tabKey) => {
          if (tabKey === "search") setShowForm(false);
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <Table
        title="LEAVE POLICY MASTER"
        data={list}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        onAdd={() => handleAdd(initialState)}
        onDelete={handleDelete}
        rights={rights}
        activeTab="search"
        onTabChange={(tabKey) => {
          if (tabKey === "entry") handleAdd(initialState);
        }}
      />
    </div>
  );
};

export default LeavePolicyMaster;

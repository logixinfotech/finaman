import React from "react";
import {
  FaIdCard,
  FaCalendarPlus,
  FaBalanceScale,
  FaLayerGroup,
  FaUserPlus,
  FaCalendarCheck,
  FaForward,
  FaHourglassHalf,
  FaMoneyBillWave,
  FaCalculator,
  FaSignOutAlt,
  FaClipboardCheck,
} from "react-icons/fa";

/*
 * Field config consumed by LeavePolicyMasterForm → FieldRenderer.
 *   key          formData key written on change
 *   type         FieldRenderer type ("text" | "date" | "select" | "native-select")
 *   bool         stored as true/false, shown as Yes/No; `default` gives the value when unset
 *   int          parse the selected value as integer
 *   default      value shown when formData[key] is undefined
 *   options      array, or (ctx) => array
 *   get / set    custom (data, ctx) => display value  /  (value, data, ctx) => stored value (undefined = ignore)
 *   enabledWhen  (data) => boolean — field is disabled + label muted when false
 *   className    grid span classes
 */

const num = (step, extra = {}) => ({ type: "number", step, ...extra });
const YES_NO = ["Yes", "No"];
const NO_YES = ["No", "Yes"];
const ALL_DEPARTMENTS = "All Departments";
const leaveTypeLabel = (lt) => `${lt.leave_name} (${lt.leave_code || "LT"})`;

const cfAllowed = (d) => d.carry_forward_allowed !== false;
const encashable = (d) => !!d.encashable;

// ── Header section (always visible above the tabs) ──────────────────────────
export const IDENTIFICATION_SECTION = {
  title: "Policy Identification & Metadata",
  icon: <FaIdCard />,
  theme: "blue",
  bodyClassName: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  fields: [
    { key: "policy_code", label: "Policy Code", required: true, inputProps: { placeholder: "e.g. POL-PL-01" }, set: (v) => v.toUpperCase() },
    { key: "policy_name", label: "Policy Name", required: true, className: "lg:col-span-2", inputProps: { placeholder: "e.g. Standard Paid Leave Policy" } },
    {
      key: "leave_type_id",
      label: "Leave Type",
      required: true,
      type: "select",
      inputProps: { placeholder: "Select leave type..." },
      options: (ctx) => ctx.leaveTypes.map(leaveTypeLabel),
      get: (d, ctx) => {
        const lt = ctx.leaveTypes.find((x) => x.leave_type_id === d.leave_type_id);
        return lt ? leaveTypeLabel(lt) : "";
      },
      set: (v, d, ctx) => ctx.leaveTypes.find((x) => leaveTypeLabel(x) === v)?.leave_type_id,
    },
    {
      key: "is_active",
      label: "Status",
      type: "native-select",
      options: ["Active", "Inactive"],
      get: (d) => (d.is_active !== false ? "Active" : "Inactive"),
      set: (v) => v === "Active",
    },
    {
      key: "leave_year_type",
      label: "Leave Year Type",
      type: "native-select",
      default: "Financial",
      options: [
        { value: "Financial", label: "Financial (Apr - Mar)" },
        { value: "Calendar", label: "Calendar (Jan - Dec)" },
        { value: "JoiningDate", label: "From Joining Date" },
      ],
    },
    { key: "effective_from", label: "Effective From", required: true, type: "date" },
    { key: "effective_to", label: "Effective To", hint: "(Optional)", type: "date" },
    {
      key: "applicability",
      label: "Department Applicability",
      type: "select",
      className: "lg:col-span-2",
      inputProps: { placeholder: "Select department..." },
      options: (ctx) => [ALL_DEPARTMENTS, ...ctx.departments.map((x) => x.group_name)],
      get: (d) => {
        const dept = d.applicability?.department || "All";
        return dept === "All" ? ALL_DEPARTMENTS : dept;
      },
      set: (v, d, ctx) => {
        if (v === ALL_DEPARTMENTS) return { ...(d.applicability || {}), department: "All" };
        if (ctx.departments.some((x) => x.group_name === v)) return { ...(d.applicability || {}), department: v };
        return undefined;
      },
    },
  ],
};

// ── Rule tabs ────────────────────────────────────────────────────────────────
export const RULE_TABS = [
  {
    id: "credit",
    label: "1. Credit Rule",
    icon: <FaCalendarPlus />,
    sections: [
      {
        title: "Accrual & Credit",
        icon: <FaCalendarPlus />,
        theme: "blue",
        fields: [
          { key: "annual_quota", label: "Annual Quota (Days)", default: 12, inputProps: num("0.5", { min: "0" }) },
          {
            key: "accrual_method",
            label: "Accrual Method",
            type: "native-select",
            default: "Monthly",
            options: ["Monthly", "Quarterly", "Half-Yearly", "Annual", "Daily", "FrontLoaded", "JoiningDate", "Anniversary"],
          },
          { key: "days_per_period", label: "Days Per Period", hint: "(Auto)", default: 1.0, inputProps: num("0.01") },
          {
            key: "credit_timing",
            label: "Credit Timing",
            type: "native-select",
            options: [
              { value: "Start", label: "Start of Period" },
              { value: "End", label: "End of Period" },
            ],
            get: (d) => (d.credit_timing === "End" ? "End" : "Start"),
          },
        ],
      },
      {
        title: "Balance, Rounding & Accrual Conditions",
        icon: <FaBalanceScale />,
        theme: "teal",
        fields: [
          { key: "rounding", label: "Rounding Rule", type: "native-select", default: "None", options: ["None", "0.5", "Nearest", "Up", "Down"] },
          { key: "max_balance_cap", label: "Max Balance Cap", inputProps: num("0.5", { placeholder: "e.g. 30 (blank = no limit)" }) },
          { key: "accrue_in_notice", label: "Accrue during Notice", type: "native-select", bool: true, default: true, options: YES_NO },
          { key: "accrue_in_lop", label: "Accrue during LOP", type: "native-select", bool: true, default: false, options: NO_YES },
          { key: "lop_threshold_days", label: "LOP Threshold Days", hint: "(in period)", default: 15, inputProps: num("1", { placeholder: "Cutoff days" }) },
        ],
      },
      { custom: "tenure_slabs", title: "Tenure-Based Quota Slabs", icon: <FaLayerGroup />, theme: "purple", className: "lg:col-span-2" },
    ],
  },
  {
    id: "joining",
    label: "2. New Joining",
    icon: <FaUserPlus />,
    sections: [
      {
        title: "Leave Eligibility",
        icon: <FaUserPlus />,
        theme: "teal",
        fields: [
          {
            key: "eligibility_start",
            label: "Eligibility Start",
            type: "native-select",
            default: "DOJ",
            options: [
              { value: "DOJ", label: "From Date of Joining (DOJ)" },
              { value: "AfterProbation", label: "After Probation Period" },
              { value: "AfterNDays", label: "After N Waiting Days" },
            ],
          },
          { key: "waiting_period_days", label: "Waiting Period (Days)", default: 0, inputProps: num("1", { min: "0" }) },
          {
            key: "back_credit_after_probation",
            label: "Back-Credit after Probation",
            type: "native-select",
            bool: true,
            default: false,
            className: "sm:col-span-2",
            options: [
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes (credit accumulated months once eligible)" },
            ],
          },
        ],
      },
      {
        title: "Joining Month & First Year Credit",
        icon: <FaCalendarCheck />,
        theme: "blue",
        fields: [
          {
            key: "joining_month_credit",
            label: "Joining Month Credit Rule",
            type: "native-select",
            default: "CutoffRule",
            options: [
              { value: "CutoffRule", label: "Full if joined on/before cutoff day" },
              { value: "Prorata", label: "Prorata" },
              { value: "Full", label: "Full" },
              { value: "None", label: "None" },
            ],
          },
          { key: "cutoff_day", label: "Cutoff Day", hint: "(e.g. 15th)", default: 15, inputProps: num("1", { min: "1", max: "31" }) },
          {
            key: "first_year_quota",
            label: "First Year Quota",
            type: "native-select",
            default: "Prorata",
            className: "sm:col-span-2",
            options: [
              { value: "Prorata", label: "Pro-rata to year end" },
              { value: "Full", label: "Full annual quota" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "carry_forward",
    label: "3. Carry Forward",
    icon: <FaForward />,
    sections: [
      {
        title: "Carry Forward Limits",
        icon: <FaForward />,
        theme: "purple",
        fields: [
          {
            key: "carry_forward_allowed",
            label: "Carry Forward Allowed",
            type: "native-select",
            bool: true,
            default: true,
            options: [
              { value: "Yes", label: "Yes" },
              { value: "No", label: "No (Lapse unused at year end)" },
            ],
          },
          {
            key: "carry_forward_basis",
            label: "Carry Forward Basis",
            type: "native-select",
            default: "All",
            enabledWhen: cfAllowed,
            options: [
              { value: "All", label: "All Unused Days" },
              { value: "Fixed", label: "Fixed Max Days" },
              { value: "Percentage", label: "% of Unused Days" },
            ],
          },
          { key: "max_cf_days", label: "Max Carry Forward (Days)", hint: "(0 = uncapped)", default: 0, enabledWhen: cfAllowed, inputProps: num("0.5", { placeholder: "e.g. 15" }) },
          { key: "overall_accumulation_limit", label: "Overall Accumulation Limit", default: 30, inputProps: num("0.5", { placeholder: "Total balance ceiling (e.g. 30/45/60)" }) },
        ],
      },
      {
        title: "Expiry & Excess Handling",
        icon: <FaHourglassHalf />,
        theme: "amber",
        fields: [
          { key: "cf_expiry_unit", label: "Carried Days Expiry", type: "native-select", default: "Never", enabledWhen: cfAllowed, options: ["Never", "Months", "Years", "FixedDate"] },
          {
            key: "cf_expiry_value",
            label: "Expiry After",
            hint: "(units)",
            default: 0,
            enabledWhen: (d) => cfAllowed(d) && (d.cf_expiry_unit || "Never") !== "Never",
            inputProps: num("1", { min: "0" }),
          },
          { key: "excess_above_cap_action", label: "Excess Above Cap Action", type: "native-select", default: "Lapse", className: "sm:col-span-2", options: ["Lapse", "Encash", "Choice"] },
        ],
      },
    ],
  },
  {
    id: "encashment",
    label: "4. Encashment",
    icon: <FaMoneyBillWave />,
    sections: [
      {
        title: "Encashment Eligibility & Limits",
        icon: <FaMoneyBillWave />,
        theme: "emerald",
        fields: [
          { key: "encashable", label: "Encashable", type: "native-select", bool: true, default: false, options: NO_YES },
          {
            key: "encash_timing",
            label: "Encashment Timing",
            type: "native-select",
            default: "YearEnd",
            enabledWhen: encashable,
            options: [
              { value: "YearEnd", label: "Year End" },
              { value: "Exit", label: "On Exit" },
              { value: "OnRequest", label: "On Request (In Service)" },
            ],
          },
          { key: "max_encash_days_per_year", label: "Max Encashable Days / Year", default: 0, enabledWhen: encashable, inputProps: num("0.5") },
          { key: "min_balance_to_retain", label: "Min Balance to Retain", default: 0, enabledWhen: encashable, inputProps: num("0.5", { placeholder: "e.g. 15 days must stay in balance" }) },
        ],
      },
      {
        title: "Encashment Calculation",
        icon: <FaCalculator />,
        theme: "green",
        fields: [
          { key: "encashment_basis", label: "Encashment Basis", type: "native-select", default: "Basic", enabledWhen: encashable, options: ["Basic", "BasicDA", "Gross"] },
          {
            key: "encashment_divisor",
            label: "Divisor",
            type: "native-select",
            int: true,
            default: 30,
            enabledWhen: encashable,
            options: [
              { value: "30", label: "30 Days (Standard)" },
              { value: "26", label: "26 Days (Working days)" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "exit",
    label: "5. Exit Rule",
    icon: <FaSignOutAlt />,
    sections: [
      {
        title: "Exit & Full-and-Final Settlement",
        icon: <FaSignOutAlt />,
        theme: "amber",
        className: "lg:col-span-2",
        bodyClassName: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        fields: [
          { key: "exit_month_credit", label: "Credit for Exit Month", type: "native-select", default: "Prorata", options: ["Prorata", "Full", "None"] },
          {
            key: "recover_excess_availed",
            label: "Recover Excess Availed",
            type: "native-select",
            bool: true,
            default: true,
            options: [
              { value: "Yes", label: "Yes (for front-loaded policies)" },
              { value: "No", label: "No" },
            ],
          },
          {
            key: "settle_balance_action",
            label: "Settle Balance Action",
            type: "native-select",
            default: "Encash",
            options: [
              { value: "Encash", label: "Encash in Full & Final" },
              { value: "Lapse", label: "Lapse on Exit" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "usage",
    label: "6. Usage Rule",
    icon: <FaClipboardCheck />,
    sections: [
      {
        title: "Leave Application Rules",
        icon: <FaClipboardCheck />,
        theme: "blue",
        fields: [
          {
            key: "sandwich_rule",
            label: "Sandwich Rule",
            type: "native-select",
            bool: true,
            default: false,
            className: "sm:col-span-2",
            options: [
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes (count intervening holidays/weekoffs as leave)" },
            ],
          },
          { key: "min_notice_days", label: "Min Notice (Days)", hint: "(0 = none)", default: 0, inputProps: num("1", { min: "0" }) },
          { key: "max_consecutive_days", label: "Max Consecutive Days", hint: "(0 = unlimited)", default: 0, inputProps: num("1", { min: "0" }) },
          { key: "doc_required_after_days", label: "Doc Required After (Days)", default: 3, inputProps: num("1", { min: "0", placeholder: "e.g. 3 days" }) },
        ],
      },
      {
        title: "Balance & Clubbing",
        icon: <FaBalanceScale />,
        theme: "teal",
        fields: [
          { key: "allow_negative_balance", label: "Allow Negative Balance", type: "native-select", bool: true, default: false, options: NO_YES },
          { key: "clubbing_allowed", label: "Clubbing with Other Types", type: "native-select", bool: true, default: true, options: YES_NO },
        ],
      },
    ],
  },
];

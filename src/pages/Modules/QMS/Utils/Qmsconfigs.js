// ============================================== Deviation CONFIG ==============================================

export const deviationTabs = [
  "open", "qa_accepted", "investigation", "impact", "capa", "closure", "audit",
];

export const deviationTabStage = {
  open: 0, qa_accepted: 1, investigation: 2, impact: 3,
  capa: 4, closure: 5, audit: 99,        // 99 = kabhi "completed" nahi
};

export const deviationTabLabels = {
  open: "1. Open",
  qa_accepted: "2. QA Accepted",
  investigation: "3. Investigation & RCA",
  impact: "4. Impact Assessment",
  capa: "5. CAPA",
  closure: "6. Closure",
  audit: "7. Audit Trail",
};

export const deviationAutoFieldMap = {
  autoCreateCapa: ["CapaRequired", "CapaRef"],
  autoCreateRisk: ["RiskAssessmentRequired", "RiskAssessmentRef"],
};
export const deviationWidthConfig = {
  "Product": "col-span-2",
  "Deviation Scope": "col-span-2",
  "Description of Deviation": "col-span-3",
  "Immediate Action Taken": "col-span-3",
  "CAPA Implementation Verification": "col-span-2",
  "Root Cause Method": "col-span-2",
  "Investig. Completion Date": "col-span-2",
  "Immediate Action — Document Ref.": "col-span-2",
  "Attachment Ref.": "col-span-2",
  "Summary": "col-span-full",
  "Probable / Root Cause": "col-span-full",
  "Impact Assessment (Quality / Validation / Regulatory)": "col-span-full",
  "Other Batches / Products Impacted": "col-span-full",
  "Corrective Action": "col-span-full",
  "Preventive Action": "col-span-full",
  "Target Date Extension Reason": "col-span-full",
  "QA Comments": "col-span-full",
  "Deviation / Incident is related to": "col-span-full",
  "Specify Other": "col-span-full",
  "Outcome of Personal Interview": "col-span-full",
  "Points Discussed / Counselling Details": "col-span-full",
  "Conclusion": "col-span-full",
  "Investigation Plan / Root Cause / Recommendations": "col-span-full",
  "Support Required / Agency Details": "col-span-full",
  "Batches in Same Campaign": "col-span-full",
  "Previous Deviation — Brief Description": "col-span-full",
  "Planned Deviation — Comments": "col-span-full",
  "Additional Remarks / Interim Closure Comments": "col-span-full",
};

export const getDeviationFieldGroups = (groupOptions = {}) => {
  const P = (groupOptions.personnel || []).map((g) => g.label);
  const D = (groupOptions.department || []).map((g) => g.label);
  const PR = (groupOptions.product || []).map((g) => g.label);
  const EQ = (groupOptions.equipment || []).map((g) => g.label);
  const IN = (groupOptions.instrument || []).map((g) => g.label);
  const AR = (groupOptions.area || []).map((g) => g.label);
  const A = groupOptions.auto || {};   // { autoCreateCapa: true/false, ... }

  const PS = ["Dispensing", "Raw Material Receipt", "Granulation", "Drying", "Blending",
    "Compression", "Coating", "Inspection", "Packing", "Storage", "QC Testing"];
  const DG = ["Operator", "Supervisor", "Executive", "Officer", "Manager", "Head"];

  const RELATED_TO = ["Housekeeping", "Documentation", "Item codes", "Process Failure", "Utility Failure",
    "In-process checks", "Quality observation", "Equipment/Instrument failure", "Material/Raw material issue",
    "SOPs", "Storage", "Packing", "Specification", "Training", "Maintenance", "Cross contamination",
    "Human error", "Yield out of limit", "Personal practices", "Other"];


  return {
    // ═════════════ S1 — OPEN (stage 0) ═════════════
    open: [
      [
        ["1. Deviation Details", [
          { key: "RecordNo", label: "Deviation No.", type: "text", disabled: (d) => !groupOptions.recordNoEditable || !!d.Id },
          { key: "DeviationType", label: "Deviation Type", type: "select", options: ["Planned", "Unplanned"] },
          { key: "OccurrenceDate", label: "Date of Occurrence", type: "date" },
          { key: "DetectionDate", label: "Date of Detection", type: "date" },
          { key: "Department", label: "Department", type: "select", options: D },
          { key: "Designation", label: "Designation", type: "select", options: DG },
          {
            key: "DeviationScope", label: "Deviation Scope", type: "select",
            options: ["Product / Batch", "Equipment", "Instrument", "Facility / Area", "Process", "Document / System", "Utility", "Item / Material"]
          },

          {
            key: "Product", label: "Product", type: "select", options: PR,
            showIf: (d) => d.DeviationScope === "Product / Batch"
          },
          {
            key: "Stage", label: "Process Stage", type: "select", options: PS,
            showIf: (d) => d.DeviationScope === "Product / Batch" || d.DeviationScope === "Process"
          },
          {
            key: "BatchNo", label: "Batch No.", type: "text",
            showIf: (d) => d.DeviationScope === "Product / Batch"
          },
          {
            key: "BatchQty", label: "Batch Size", type: "text",
            showIf: (d) => d.DeviationScope === "Product / Batch"
          },
          {
            key: "ArNo", label: "A.R. No.", type: "text",
            showIf: (d) => ["Product / Batch", "Item / Material"].includes(d.DeviationScope)
          },
          {
            key: "CodeNo", label: "Code No.", type: "text",
            showIf: (d) => ["Product / Batch", "Item / Material"].includes(d.DeviationScope)
          },

          {
            key: "Equipment", label: "Equipment", type: "select", options: EQ,
            showIf: (d) => d.DeviationScope === "Equipment"
          },
          {
            key: "Instrument", label: "Instrument", type: "select", options: IN,
            showIf: (d) => d.DeviationScope === "Instrument"
          },
          {
            key: "Area", label: "Area / Room", type: "select", options: AR,
            showIf: (d) => ["Facility / Area", "Utility"].includes(d.DeviationScope)
          },
          {
            key: "DocumentNo", label: "Document No.", type: "text",
            showIf: (d) => d.DeviationScope === "Document / System"
          },

          // 🆕 supplier — sirf item/material case
          {
            key: "SupplierName", label: "Supplier Name", type: "text",
            showIf: (d) => d.DeviationScope === "Item / Material"
          },
          {
            key: "SupplierReceiptDate", label: "Date of Receipt", type: "date",
            showIf: (d) => d.DeviationScope === "Item / Material"
          },
          {
            key: "SupplierQty", label: "Quantity Received", type: "text",
            showIf: (d) => d.DeviationScope === "Item / Material"
          },

          { key: "ReportedBy", label: "Reported By", type: "select", options: P },
          { key: "ReportedOn", label: "Reported On", type: "date" },
          { type: "row-break" },
          {
            key: "PlannedComments", label: "Planned Deviation — Comments", type: "textarea",
            showIf: (d) => d.DeviationType === "Planned"
          },
          { key: "Description", label: "Description of Deviation", type: "textarea" },
          { key: "ImmediateAction", label: "Immediate Action Taken", type: "textarea" },
          { key: "ImmediateActionDocRef", label: "Immediate Action — Document Ref.", type: "text" },
        ]],
      ],
      [
        ["2. Classification & Personnel Interview", [          // 🆕 poora naya
          { key: "RelatedTo", label: "Deviation / Incident is related to", type: "multiselect", options: RELATED_TO },
          {
            key: "RelatedToOther", label: "Specify Other", type: "text",
            showIf: (d) => String(d.RelatedTo || "").includes("Other")
          },
          { type: "row-break" },
          { key: "PersonInvolved", label: "Person Present / Involved", type: "select", options: P },
          { key: "Counselor", label: "Counsellor", type: "select", options: P },
          { type: "row-break" },
          { key: "InterviewOutcome", label: "Outcome of Personal Interview", type: "textarea" },
          { key: "PointsDiscussed", label: "Points Discussed / Counselling Details", type: "textarea" },
          { key: "InterviewConclusion", label: "Conclusion", type: "textarea" },
        ]],
      ],
      [
        ["3. Source & Linkage", [
          { key: "IncidentRef", label: "Linked Incident Ref. (auto)", type: "text", disabled: true, showIf: (d) => !!d.IncidentRef },
          { key: "IncidentRef", label: "Link an Incident", type: "select", options: (groupOptions.refOpts?.incident || []).map((x) => x.value), showIf: (d) => !d.IncidentRef },
          { key: "RepeatDeviation", label: "Similar Deviation in Last 1 Year?", type: "select", options: ["Yes", "No"] },
          { key: "ComplaintRef", label: "Linked Complaint Ref. (auto)", type: "text", disabled: true, showIf: (d) => !!d.ComplaintRef },
          { key: "AttachmentRef", label: "Attachment Ref.", type: "text" },
          { type: "row-break" },
          {
            key: "RepeatDeviationDetail", label: "Previous Deviation — Brief Description", type: "textarea",
            showIf: (d) => d.RepeatDeviation === "Yes"
          },
        ]],
      ],
    ],

    // ═════════════ S2 — QA ACCEPTED (stage 1) ═════════════
    qa_accepted: [
      [
        ["4. QA Assessment", [
          { key: "Classification", label: "Classification", type: "select", options: ["Minor", "Major", "Critical"] },
          { key: "RiskAssessmentRequired", label: "Risk Assessment Req.?", type: "select", options: ["Yes", "No"], showIf: (d) => A.autoCreateRisk && d.Classification === "Critical" },
          { key: "RiskAssessmentRef", label: "Linked Risk Assessment Ref. (auto)", type: "text", disabled: true, showIf: (d) => A.autoCreateRisk && d.RiskAssessmentRequired === "Yes" },
          { key: "Priority", label: "Priority", type: "select", options: ["Low", "Medium", "High", "Critical"] },
          { key: "InvestigationRequired", label: "Investigation Req.", type: "select", options: ["Yes", "No"] },
          { key: "QaNotifiedDate", label: "QA Notified On", type: "date" },
          { key: "AcceptedBy", label: "Accepted By (QA)", type: "select", options: P },
          { key: "AcceptedOn", label: "Accepted On", type: "date" },
        ]],
      ],
    ],

    // ═════════════ S3 — INVESTIGATION (stage 2) ═════════════
    investigation: [
      [
        ["5. Investigation Plan", [                            // 🆕
          { key: "InvestigationPlan", label: "Investigation Plan / Root Cause / Recommendations", type: "textarea" },
          {
            key: "PlanSigns", type: "signblock", label: "Plan Approved By",
            signs: [
              { key: "PlanSignDept", label: "Originating Department", options: P },
              { key: "PlanSignQa", label: "Quality Assurance", options: P },
            ]
          },
        ]],
      ],
      [
        ["6. Investigation Details", [
          { key: "InvestigationStartDate", label: "Start Date", type: "date" },
          { key: "InvestigationCompletionDate", label: "Completion Date", type: "date" },
          { key: "InvestigatedBy", label: "Investigated By", type: "select", options: P },
          { type: "row-break" },
          { key: "InvestigationSummary", label: "Summary", type: "textarea" },
        ]],
        ["7. Root Cause Analysis", [
          { key: "RcaMethod", label: "Root Cause Method", type: "select", options: ["5-Why", "Fishbone", "FMEA", "Other"] },
          { type: "row-break" },
          { key: "ProbableCause", label: "Probable / Root Cause", type: "textarea" },
        ]],
      ],
      [
        ["8. Department Involvement", [
          {
            key: "deptreview", type: "childgrid", label: "Department Review", fixedRows: true,
            rowLockField: "RoleTitle",                    // 🆕
            rowLockColumns: ["Comments", "SignBy"],          // 🆕 "Required" isme nahi — wo QA Investigator ka hi rehta hai
            defaultRows: [
              { Department: "Engineering" }, { Department: "Stores" }, { Department: "Production" },
              { Department: "Quality Control" }, { Department: "Administration/HR" },
              { Department: "Purchase" }, { Department: "Any other dept." },
            ],
            columns: [
              { key: "Department", label: "Department", type: "text", disabled: true, width: "15%" },
              { key: "Required", label: "Required", type: "select", options: ["Required", "Not Required"], width: "12%" },
              { key: "Comments", label: "Comments", type: "textarea" },
              { key: "SignBy", label: "Sign", type: "text", autoSign: true, dateKey: "SignOn", width: "14%" },  // 🆕 dropdown hataya
              { key: "SignOn", label: "Date", type: "date", disabled: true, width: "12%" },                      // 🆕 sirf auto-fill
            ]
          },
        ]],
      ],
      [
        ["9. Extended Investigation", [                        // 🆕
          { key: "CauseIdentified", label: "Cause Identified?", type: "select", options: ["Yes", "No"] },
          {
            key: "InvestigationExtended", label: "Investigation Extended?", type: "select", options: ["Yes", "No"],
            showIf: (d) => d.CauseIdentified === "No"
          },
          {
            key: "InvestExtensionPeriod", label: "Extension Period", type: "text",
            showIf: (d) => d.InvestigationExtended === "Yes"
          },
          {
            key: "ExternalHelpRequired", label: "Other Function / Agency Help Needed?", type: "select", options: ["Yes", "No"],
            showIf: (d) => d.CauseIdentified === "No"
          },
          { type: "row-break" },
          {
            key: "ExternalHelpDetail", label: "Support Required / Agency Details", type: "textarea",
            showIf: (d) => d.ExternalHelpRequired === "Yes"
          },
          {
            key: "ExtInvestSigns", type: "signblock", label: "Extended Investigation Closed By",
            showIf: (d) => d.InvestigationExtended === "Yes",
            signs: [{ key: "ExtInvestClosed", label: "Head — Quality Assurance", options: P }]
          },
        ]],
      ],
    ],

    // ═════════════ S4 — IMPACT (stage 3) ═════════════
    impact: [
      [
        ["10. Impact Assessment", [
          {
            key: "ImpactDecision", label: "Impact Decision", type: "select",       // 🆕
            options: ["Has impact on product quality",
              "No impact on product quality",
              "To be evaluated on other batches of same campaign"]
          },
          {
            key: "CampaignBatches", label: "Batches in Same Campaign", type: "text",  // 🆕
            showIf: (d) => String(d.ImpactDecision || "").startsWith("To be evaluated")
          },
          { key: "RiskLevel", label: "Risk Level", type: "select", options: ["Low", "Medium", "High"] },
          { key: "AffectedLots", label: "Affected Lots / Batches", type: "text" },
          { key: "BatchDisposition", label: "Batch Disposition", type: "select", options: ["Release", "Reject", "Rework", "Reprocess", "Under Review"] },
          { type: "row-break" },
          { key: "ImpactAssessment", label: "Impact Assessment (Quality / Validation / Regulatory)", type: "textarea" },
          { key: "OtherBatchesImpacted", label: "Other Batches / Products Impacted", type: "textarea" },
        ]],
      ],
    ],

    // ═════════════ S5 — CAPA (stage 4) ═════════════
    capa: [
      [
        ["11. CAPA (Corrective & Preventive Action)", [
          { key: "CapaRequired", label: "CAPA Required", type: "select", options: ["Yes", "No"], showIf: () => A.autoCreateCapa },
          { key: "CapaRef", label: "Linked CAPA Ref.", type: "text", disabled: true, showIf: () => A.autoCreateCapa },
          { key: "TargetDate", label: "Target Completion Date", type: "date" },
          { type: "row-break" },
          { key: "CorrectiveAction", label: "Corrective Action", type: "textarea" },
          { key: "PreventiveAction", label: "Preventive Action", type: "textarea" },
          {
            key: "CapaSigns", type: "signblock", label: "Proposed & Approved By",    // 🆕
            signs: [
              { key: "CapaProposed", label: "Department Head / Designee", options: P },
              { key: "CapaApprovedQa", label: "Quality Assurance", options: P },
            ]
          },
        ]],
      ],
      [
        ["12. Target Date Extension", [                        // 🆕 childgrid
          {
            key: "extensions", type: "childgrid", label: "Extension Required",
            columns: [
              { key: "Justification", label: "Justification", type: "textarea" },
              { key: "Period", label: "Extension Period", type: "text", width: "14%" },
              { key: "RevisedDate", label: "Revised Target", type: "date", width: "14%" },
              { key: "DeptSignBy", label: "Dept Head", type: "select", options: P, width: "15%" },
              { key: "QaSignBy", label: "QA Head", type: "select", options: P, width: "15%" },
            ]
          },
        ]],
      ],
    ],

    // ═════════════ S6 — CLOSURE (stage 5) ═════════════
    closure: [
      [
        ["13. Authorization & Closure", [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          {
            key: "AuthorizationStatus", label: "Deviation Auth / Rej", type: "select",   // 🆕
            options: ["Authorized", "Rejected"]
          },
          { key: "ReviewedBy", label: "Reviewed By (QA)", type: "select", options: P },
          { key: "ReviewDate", label: "Review Date", type: "date" },
          { key: "ClosureStatus", label: "Closure Status", type: "select", options: ["Open", "Closed"] },
          { key: "ClosedOn", label: "Closed On", type: "date" },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          {
            key: "CapaVerificationStatus", label: "CAPA Implementation Verification", type: "select",  // 🆕
            options: ["Satisfactory", "Not Satisfactory"], showIf: (d) => d.CapaRequired === "No"
          },
          { type: "row-break" },
          { key: "InterimClosureRemarks", label: "Additional Remarks / Interim Closure Comments", type: "textarea" },  // 🆕
          { key: "QaRemarks", label: "QA Comments", type: "textarea" },
          {
            key: "AuthSigns", type: "signblock", label: "Signatures",              // 🆕
            signs: [
              { key: "Authorized", label: "QA Head — Authorization", options: P },
              { key: "CapaVerified", label: "QA — CAPA Verification", options: P },
            ]
          },
        ]],
      ],
    ],
  };
};
export const deviationSectionConfigs = {
  "1. Deviation Details": "grid-cols-1 sm:grid-cols-4 xl:grid-cols-6",
  "2. Classification & Personnel Interview": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "3. Source & Linkage": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "4. QA Assessment": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "5. Investigation Plan": "grid-cols-1",
  "6. Investigation Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 ",
  "7. Root Cause Analysis": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "8. Department Involvement": "grid-cols-1",
  "9. Extended Investigation": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "10. Impact Assessment": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "11. CAPA (Corrective & Preventive Action)": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "12. Target Date Extension": "grid-cols-1",
  "13. Authorization & Closure": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
};
export const deviationRequiredByStage = {
  "Open": ["OccurrenceDate", "DetectionDate", "DeviationScope", "Department", "Description", "RepeatDeviation", "RelatedTo"],
  "QA Accepted": ["Classification", "Priority", "InvestigationRequired"],
  "Under Investigation": ["InvestigationStartDate", "InvestigationSummary", "RcaMethod", "ProbableCause"],
  "Impact Assessed": ["RiskLevel", "ImpactAssessment", "BatchDisposition"],
  "CAPA Assigned": ["CapaRequired", "TargetDate", "CorrectiveAction", "PreventiveAction"],
  "QA Review": ["ReviewedBy", "ReviewDate", "ClosureStatus"],
  "Closed": [],
};
export const getDeviationRequired = (status) =>
  deviationRequiredByStage[status] || deviationRequiredByStage["Open"];

export const deviationTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "OccurrenceDate", label: "Occurrence Date", render: (r) => (r.OccurrenceDate || "").slice(0, 10) },
  { key: "DeviationScope", label: "Scope" },                                    // 🆕
  {
    key: "Subject", label: "Subject",                                            // 🆕
    render: (r) => r.Product || r.Equipment || r.Instrument || r.Area || "—"
  },
  { key: "Classification", label: "Classification" },
  { key: "Department", label: "Department" },
  { key: "Status", label: "Status" },
];

// ============================================== Incident ==============================================

export const incidentTabs = ["reported", "review", "investigation", "closure", "audit"];

export const incidentTabStage = {
  reported: 0, review: 1, investigation: 2, closure: 3, audit: 99,
};

export const incidentTabLabels = {
  reported: "1. Reported",
  review: "2. QA Review",
  investigation: "3. Investigation",
  closure: "4. Closure",
  audit: "5. Audit Trail",
};

export const incidentWidthConfig = {
  "Incident Description": "col-span-full",
  "Immediate Action / Containment": "col-span-full",
  "Impact Assessment": "col-span-full",
  "Root Cause": "col-span-full",
  "Investigation Summary": "col-span-full",
  "Closure Remarks": "col-span-full",
  "Attachment Ref.": "col-span-2",
  "Incident is related to": "col-span-full",
  "Specify Other": "col-span-full",
  "Outcome of Personal Interview": "col-span-full",
  "Points Discussed / Counselling Details": "col-span-full",
  "Conclusion": "col-span-full",
  "Previous Incident — Brief Description": "col-span-full",
  "Investigation Plan / Root Cause / Recommendations": "col-span-full",
  "Support Required / Agency Details": "col-span-full",
  "Batches in Same Campaign": "col-span-full",
  "Corrective Action": "col-span-full",
  "Preventive Action": "col-span-full",
  "Additional Remarks / Interim Closure Comments": "col-span-full",
};

export const getIncidentFieldGroups = (options = {}) => {
  const P = (options.personnel || []).map((g) => g.label);
  const D = (options.department || []).map((g) => g.label);
  const PR = (options.product || []).map((g) => g.label);
  const EQ = (options.equipment || []).map((g) => g.label);
  const AR = (options.area || []).map((g) => g.label);

  const DG = ["Operator", "Supervisor", "Executive", "Officer", "Manager", "Head"];

  const RELATED_TO = ["Housekeeping", "Documentation", "Item codes", "Process Failure", "Utility Failure",
    "In-process checks", "Quality observation", "Equipment/Instrument failure", "Material/Raw material issue",
    "SOPs", "Storage", "Packing", "Specification", "Training", "Maintenance", "Cross contamination",
    "Human error", "Yield out of limit", "Personal practices", "Other"];

  const DEPT_ROWS = [
    { Department: "Engineering", RoleTitle: "Engineering Head" },
    { Department: "Stores", RoleTitle: "Warehouse Head" },
    { Department: "Production", RoleTitle: "Production Head" },
    { Department: "Quality Control", RoleTitle: "QC Head" },
    { Department: "Administration/HR", RoleTitle: "Administration Head" },
    { Department: "Purchase", RoleTitle: "Purchase Head" },
    { Department: "Any other dept.", exemptFromLock: true },
  ];

  return {
    // ═════════════ S1 — REPORTED (stage 0) — Operator ═════════════
    reported: [
      [
        ["1. Incident Details", [
          { key: "RecordNo", label: "Incident No.", type: "text", disabled: true },
          { key: "IncidentDate", label: "Date of Incident", type: "date" },
          { key: "IncidentTime", label: "Time of Incident", type: "text" },
          { key: "Shift", label: "Shift", type: "select", options: ["A", "B", "C", "General"] },
          { key: "Department", label: "Department", type: "select", options: D },
          { key: "Area", label: "Area / Location", type: "select", options: AR },
          {
            key: "Category", label: "Category", type: "select",
            options: ["Equipment Failure", "Human Error", "Documentation", "Contamination", "Power Failure", "Other"]
          },
          {
            key: "OtherCategoryDetail", label: "Specify Other Category", type: "text",
            showIf: (d) => d.Category === "Other"
          },
          { key: "Severity", label: "Severity", type: "select", options: ["Minor", "Major", "Critical"] },

          {
            key: "ItemType", label: "Incident Relates To", type: "select",
            options: ["Product / Batch", "Equipment", "Instrument", "Facility / Area", "Document / System", "Item / Material", "Other"]
          },
          {
            key: "Product", label: "Product Affected", type: "select", options: PR,
            showIf: (d) => d.ItemType === "Product / Batch"
          },
          {
            key: "ProductBatch", label: "Batch No. Affected", type: "text",
            showIf: (d) => d.ItemType === "Product / Batch"
          },
          {
            key: "ArNo", label: "A.R. No.", type: "text",
            showIf: (d) => ["Product / Batch", "Item / Material"].includes(d.ItemType)
          },
          {
            key: "CodeNo", label: "Code No.", type: "text",
            showIf: (d) => ["Product / Batch", "Item / Material"].includes(d.ItemType)
          },
          {
            key: "EquipmentInvolved", label: "Equipment / Instrument Involved", type: "select", options: EQ,
            showIf: (d) => ["Equipment", "Instrument"].includes(d.ItemType)
          },
          {
            key: "DocumentNo", label: "Document No.", type: "text",
            showIf: (d) => d.ItemType === "Document / System"
          },
          {
            key: "SupplierName", label: "Supplier Name", type: "text",
            showIf: (d) => d.ItemType === "Item / Material"
          },
          {
            key: "SupplierReceiptDate", label: "Date of Receipt", type: "date",
            showIf: (d) => d.ItemType === "Item / Material"
          },
          {
            key: "SupplierQty", label: "Quantity Received", type: "text",
            showIf: (d) => d.ItemType === "Item / Material"
          },

          { type: "row-break" },
          { key: "Description", label: "Incident Description", type: "textarea" },
        ]],
      ],
      [
        ["2. Reporting & Immediate Action", [
          { key: "ReportedBy", label: "Reported By", type: "select", options: P },
          { key: "Designation", label: "Designation", type: "select", options: DG },
          { key: "ReportedOn", label: "Reported On", type: "date" },
          { key: "WitnessedBy", label: "Witnessed By", type: "select", options: P },
          { key: "AttachmentRef", label: "Attachment Ref.", type: "text" },
          { type: "row-break" },
          { key: "ImmediateAction", label: "Immediate Action / Containment", type: "textarea" },
          { key: "ImmediateActionDocRef", label: "Immediate Action — Document Ref.", type: "text" },
        ]],
      ],
      [
        ["3. Classification & Personnel Interview", [
          { key: "RelatedTo", label: "Incident is related to", type: "multiselect", options: RELATED_TO },
          {
            key: "RelatedToOther", label: "Specify Other", type: "text",
            showIf: (d) => String(d.RelatedTo || "").includes("Other")
          },
          { type: "row-break" },
          { key: "PersonInvolved", label: "Person Present / Involved", type: "select", options: P },
          { key: "Counselor", label: "Counsellor", type: "select", options: P },
          { key: "RepeatIncident", label: "Similar Incident in Last 1 Year?", type: "select", options: ["Yes", "No"] },
          { type: "row-break" },
          { key: "InterviewOutcome", label: "Outcome of Personal Interview", type: "textarea" },
          { key: "PointsDiscussed", label: "Points Discussed / Counselling Details", type: "textarea" },
          { key: "InterviewConclusion", label: "Conclusion", type: "textarea" },
          {
            key: "RepeatIncidentDetail", label: "Previous Incident — Brief Description", type: "textarea",
            showIf: (d) => d.RepeatIncident === "Yes"
          },
        ]],
      ],
    ],

    // ═════════════ S2 — UNDER REVIEW (stage 1) — QA Head ═════════════
    review: [
      [
        ["4. QA Review", [
          { key: "ReviewedBy", label: "Reviewed By (QA)", type: "select", options: P },
          { key: "ReviewDate", label: "Review Date", type: "date" },
          { key: "DeviationRaised", label: "Deviation Raised?", type: "select", options: ["Yes", "No"] },
          { key: "DeviationRef", label: "Linked Deviation Ref. (auto)", type: "text", disabled: true },
          { key: "EscalatedTo", label: "Escalated To", type: "select", options: P },
        ]],
      ],
      [
        ["5. Impact Assessment", [
          {
            key: "ImpactDecision", label: "Impact Decision", type: "select",
            options: ["Has impact on product quality",
              "No impact on product quality",
              "To be evaluated on other batches of same campaign"]
          },
          {
            key: "CampaignBatches", label: "Batches in Same Campaign", type: "text",
            showIf: (d) => String(d.ImpactDecision || "").startsWith("To be evaluated")
          },
          { type: "row-break" },
          { key: "ImpactAssessment", label: "Impact Assessment", type: "textarea" },
        ]],
      ],
    ],

    // ═════════════ S3 — UNDER INVESTIGATION (stage 2) — QA Investigator ═════════════
    investigation: [
      [
        ["6. Investigation Plan", [
          { key: "InvestigationPlan", label: "Investigation Plan / Root Cause / Recommendations", type: "textarea" },
          {
            key: "PlanSigns", type: "signblock", label: "Plan Approved By",
            signs: [
              { key: "PlanSignDept", label: "Originating Department", options: P },
              { key: "PlanSignQa", label: "Quality Assurance", options: P },
            ]
          },
        ]],
      ],
      [
        ["7. Investigation Findings", [
          { key: "InvestigationStartDate", label: "Investig. Start Date", type: "date" },
          { key: "InvestigationCompletionDate", label: "Investig. Completion Date", type: "date" },
          { key: "InvestigatedBy", label: "Investigated By", type: "select", options: P },
          {
            key: "RcaMethod", label: "Root Cause Method", type: "select",
            options: ["5-Why", "Fishbone", "FMEA", "Other"]
          },
          { type: "row-break" },
          { key: "InvestigationSummary", label: "Investigation Summary", type: "textarea" },
          { key: "RootCause", label: "Root Cause", type: "textarea" },
        ]],
      ],
      [
        ["8. Department Involvement", [
          {
            key: "deptreview", type: "childgrid", label: "Department Review", fixedRows: true,
            rowLockField: "RoleTitle",                    // 🆕
            rowLockColumns: ["Comments", "SignBy"],          // 🆕
            defaultRows: DEPT_ROWS,
            footer: "Tick Required / Not Required for each department, then record their comment and sign.",
            columns: [
              { key: "Department", label: "Department", type: "text", disabled: true, width: "15%" },
              { key: "Required", label: "Required", type: "select", options: ["Required", "Not Required"], width: "12%" },
              { key: "Comments", label: "Comments", type: "textarea" },
              { key: "SignBy", label: "Sign", type: "text", autoSign: true, dateKey: "SignOn", width: "14%" },  // 🆕
              { key: "SignOn", label: "Date", type: "date", disabled: true, width: "12%" },                      // 🆕
            ]
          },
        ]],
      ],
      [
        ["9. Extended Investigation", [
          { key: "CauseIdentified", label: "Cause Identified?", type: "select", options: ["Yes", "No"] },
          {
            key: "InvestigationExtended", label: "Investigation Extended?", type: "select", options: ["Yes", "No"],
            showIf: (d) => d.CauseIdentified === "No"
          },
          {
            key: "InvestExtensionPeriod", label: "Extension Period", type: "text",
            showIf: (d) => d.InvestigationExtended === "Yes"
          },
          {
            key: "ExternalHelpRequired", label: "Other Function / Agency Help Needed?", type: "select", options: ["Yes", "No"],
            showIf: (d) => d.CauseIdentified === "No"
          },
          { type: "row-break" },
          {
            key: "ExternalHelpDetail", label: "Support Required / Agency Details", type: "textarea",
            showIf: (d) => d.ExternalHelpRequired === "Yes"
          },
          {
            key: "ExtInvestSigns", type: "signblock", label: "Extended Investigation Closed By",
            showIf: (d) => d.InvestigationExtended === "Yes",
            signs: [{ key: "ExtInvestClosed", label: "Head — Quality Assurance", options: P }]
          },
        ]],
      ],
    ],

    // ═════════════ S4 — PENDING CLOSURE (stage 3) — QA Head ═════════════
    closure: [
      [
        ["10. CAPA (Corrective & Preventive Action)", [
          { key: "CapaRef", label: "Linked CAPA Ref.", type: "text", disabled: true },
          { key: "TargetDate", label: "Target Closure Date", type: "date" },
          { type: "row-break" },
          { key: "CorrectiveAction", label: "Corrective Action", type: "textarea" },
          { key: "PreventiveAction", label: "Preventive Action", type: "textarea" },
          {
            key: "CapaSigns", type: "signblock", label: "Proposed & Approved By",
            signs: [
              { key: "CapaProposed", label: "Department Head / Designee", options: P },
              { key: "CapaApprovedQa", label: "Quality Assurance", options: P },
            ]
          },
        ]],
      ],
      [
        ["11. Target Date Extension", [
          {
            key: "extensions", type: "childgrid", label: "Extension Required",
            columns: [
              { key: "Justification", label: "Justification", type: "textarea" },
              { key: "Period", label: "Extension Period", type: "text", width: "14%" },
              { key: "RevisedDate", label: "Revised Target", type: "date", width: "14%" },
              { key: "DeptSignBy", label: "Dept Head", type: "select", options: P, width: "15%" },
              { key: "QaSignBy", label: "QA Head", type: "select", options: P, width: "15%" },
            ]
          },
        ]],
      ],
      [
        ["12. Authorization & Closure", [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          {
            key: "AuthorizationStatus", label: "Incident Authorized / Rejected", type: "select",
            options: ["Authorized", "Rejected"]
          },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { key: "ClosedOn", label: "Closed On", type: "date" },
          {
            key: "CapaVerificationStatus", label: "CAPA Implementation Verification", type: "select",
            options: ["Satisfactory", "Not Satisfactory"], showIf: (d) => d.CapaRequired === "No"
          },
          { type: "row-break" },
          { key: "InterimClosureRemarks", label: "Additional Remarks / Interim Closure Comments", type: "textarea" },
          { key: "ClosureRemarks", label: "Closure Remarks", type: "textarea" },
          {
            key: "AuthSigns", type: "signblock", label: "Signatures",
            signs: [
              { key: "Authorized", label: "QA Head — Authorization", options: P },
              { key: "CapaVerified", label: "QA — CAPA Verification", options: P },
            ]
          },
        ]],
      ],
    ],
  };
};

export const incidentSectionConfigs = {
  "1. Incident Details": "grid-cols-1 sm:grid-cols-4 xl:grid-cols-7",
  "2. Reporting & Immediate Action": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "3. Classification & Personnel Interview": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "4. QA Review": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "5. Impact Assessment": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "6. Investigation Plan": "grid-cols-1",
  "7. Investigation Findings": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "8. Department Involvement": "grid-cols-1",
  "9. Extended Investigation": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "10. CAPA (Corrective & Preventive Action)": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "11. Target Date Extension": "grid-cols-1",
  "12. Authorization & Closure": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
};

export const incidentRequiredByStage = {
  "Reported": ["IncidentDate", "Department", "Area", "Category", "Severity", "Description", "ReportedBy", "ImmediateAction", "RelatedTo"],
  "Under Review": ["ImpactAssessment", "DeviationRaised", "ReviewedBy", "ReviewDate"],
  "Under Investigation": ["InvestigationPlan", "RootCause", "InvestigationSummary", "InvestigatedBy", "RcaMethod"],
  "Pending Closure": ["CapaRequired", "TargetDate", "ClosedBy"],
  "Closed": [],
};

export const getIncidentRequired = (status) =>
  incidentRequiredByStage[status] || incidentRequiredByStage["Reported"];

export const incidentTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Incident No." },
  { key: "IncidentDate", label: "Date", render: (r) => (r.IncidentDate || "").slice(0, 10) },
  { key: "Area", label: "Area / Location" },
  { key: "Category", label: "Category" },
  { key: "Severity", label: "Severity" },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// ══════════════════════════════════════════════════════ CAPA ═══════════════

export const capaTabs = ["details", "rca", "plan", "progress", "verification", "effectiveness", "audit"];

export const capaTabStage = {
  details: 0, rca: 1, plan: 2, progress: 3, verification: 4, effectiveness: 5, audit: 99,
};

export const capaTabLabels = {
  details: "1. CAPA Details",
  rca: "2. Root Cause",
  plan: "3. Action Plan",
  progress: "4. Progress",
  verification: "5. Verification",
  effectiveness: "6. Effectiveness",
  audit: "7. Audit Trail",
};

export const capaWidthConfig = {
  "Problem Statement / Description of Non-conformity": "col-span-full",
  "Investigation": "col-span-full",
  "Root Cause": "col-span-full",
  "Correction (Immediate Fix)": "col-span-full",
  "Effectiveness Verification Required": "col-span-1",
  "Corrective Action": "col-span-full",
  "Preventive Action": "col-span-full",
  "Progress Remarks": "col-span-full",
  "Implementation Evidence / Verification": "col-span-full",
  "Evaluation & Review of Implemented Preventive Action": "col-span-full",
  "Effectiveness Check Criteria": "col-span-full",
  "Reason if Effectiveness Verification Not Required": "col-span-full",
  "Comment by Initiator Department Head": "col-span-full",
  "Comment by QA Head": "col-span-full",
  "Comments if CAPA is Not Effective": "col-span-full",
  "Closure Remarks": "col-span-full",
};

export const getCapaFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const D = (o.department || []).map((g) => g.label);

  return {
    // ═══════ S1 — OPEN (stage 0) — QA Head ═══════
    details: [
      [[
        "1. CAPA Details",
        [
          { key: "RecordNo", label: "CAPA No.", type: "text", disabled: true },
          { key: "InitiationDate", label: "Initiation Date", type: "date" },
          { key: "InitiatedBy", label: "Initiated By", type: "select", options: P },
          {
            key: "SourceType", label: "Source", type: "select",
            options: ["Deviation", "Incident", "Complaint", "Audit Finding", "Change Control", "OOS/OOT", "Management Review", "CAPA"]
          },
          {
            key: "SourceRef", label: "Source Reference No.", type: "select",
            options: (d) => {
              const map = {
                Deviation: "deviation", Incident: "incident", "Audit Finding": "audit",
                "Change Control": "changecontrol", CAPA: "capa"
              };
              const k = map[d.SourceType];
              return k ? (o.refOpts?.[k] || []).map((x) => x.value) : [];
            }
          },
          {
            key: "CapaType", label: "CAPA Type", type: "select",
            options: ["Corrective", "Preventive", "Corrective & Preventive"]
          },
          { key: "Department", label: "Department", type: "select", options: D },
          { key: "Priority", label: "Priority", type: "select", options: ["Low", "Medium", "High", "Critical"] },
          { key: "Owner", label: "CAPA Owner (QA)", type: "select", options: P },
          { key: "AttachmentRef", label: "Attachment Ref.", type: "text" },
          { type: "row-break" },
          { key: "ProblemStatement", label: "Problem Statement / Description of Non-conformity", type: "textarea" },
          {
            key: "ProposedSigns", type: "signblock", label: "Recorded By / Proposed By",
            signs: [{ key: "Proposed", label: "Recorded / Proposed By", options: P }]
          },
        ],
      ]],
    ],

    // ═══════ S2 — RCA PENDING (stage 1) — Dept Head ═══════
    rca: [
      [[
        "2. Investigation",
        [
          { key: "Investigation", label: "Investigation", type: "textarea" },
        ],
      ]],
      [[
        "3. Root Cause Analysis",
        [
          { key: "RcaMethod", label: "RCA Method", type: "select", options: ["5-Why", "Fishbone", "FMEA", "Other"] },
          { key: "RcaCompletedBy", label: "RCA Completed By", type: "select", options: P },
          { key: "RcaDate", label: "RCA Date", type: "date" },
          { type: "row-break" },
          { key: "RootCause", label: "Root Cause", type: "textarea" },
        ],
      ]],
    ],

    // ═══════ S3 — PLAN PENDING (stage 2) ═══════
    plan: [
      [[
        "4. Proposed Corrective Action",
        [
          { key: "ResponsiblePerson", label: "Responsible Person", type: "select", options: P },
          { key: "CorrectiveTargetDate", label: "Target Completion Date (Corrective)", type: "date" },
          { key: "ChangeControlRequired", label: "Change Control Required?", type: "select", options: ["Yes", "No"] },
          { type: "row-break" },
          { key: "Correction", label: "Correction (Immediate Fix)", type: "textarea" },
          { key: "CorrectiveAction", label: "Corrective Action", type: "textarea" },
          {
            key: "CaSigns", type: "signblock", label: "Corrective Action — Signatures",
            signs: [
              { key: "CaInitiated", label: "Initiated by Concerned Dept.", options: P },
              { key: "CaVerifiedQa", label: "Verified By QA", options: P },
              { key: "CaDeptHead", label: "Head of Concerned Dept.", options: P },
            ]
          },
        ],
      ]],
      [[
        "5. Proposed Preventive Action",
        [
          { key: "PreventiveTargetDate", label: "Target Completion Date (Preventive)", type: "date" },
          { key: "TargetDate", label: "Overall Target Date", type: "date" },
          { type: "row-break" },
          { key: "PreventiveAction", label: "Preventive Action", type: "textarea" },
          {
            key: "PaSigns", type: "signblock", label: "Preventive Action — Signatures",
            signs: [
              { key: "PaInitiated", label: "Initiated by Concerned Dept.", options: P },
              { key: "PaVerifiedQa", label: "Verified By QA", options: P },
              { key: "PaDeptHead", label: "Head of Concerned Dept.", options: P },
            ]
          },
        ],
      ]],
      [[
        "6. Approval for CAPA",
        [
          {
            key: "ApprovalStatus", label: "CAPA Approved / Rejected", type: "select",
            options: ["Approved", "Rejected"]
          },
          { key: "ApprovedBy", label: "Approved By (QA Head / Designee)", type: "select", options: P },
          { key: "ApprovalDate", label: "Approval Date", type: "date" },
          {
            key: "RejectionReason", label: "Rejection Reason (if any)", type: "text",
            showIf: (d) => d.ApprovalStatus === "Rejected"
          },
        ],
      ]],
    ],

    // ═══════ S4 — ACTION IN PROGRESS (stage 3) ═══════
    progress: [
      [[
        "7. Implementation Progress",
        [
          { key: "ProgressRemarks", label: "Progress Remarks", type: "textarea" },
        ],
      ]],
      [[
        "8. Extension for CAPA",
        [
          {
            key: "extensions", type: "childgrid", label: "Extension Required",
            columns: [
              { key: "Justification", label: "Justification & Pending Activities", type: "textarea" },
              { key: "InitialFrom", label: "Initial From", type: "date", width: "10%" },
              { key: "InitialTo", label: "Initial To", type: "date", width: "10%" },
              { key: "ExtTo", label: "Extended To", type: "date", width: "10%" },
              { key: "Period", label: "Period", type: "text", width: "9%" },
              { key: "InitiatorHodBy", label: "Initiator HOD", type: "select", options: P, width: "13%" },
              {
                key: "ApprovalStatus", label: "Status", type: "select",
                options: ["Approved", "Rejected"], width: "10%"
              },
              { key: "QaHeadBy", label: "QA Head", type: "select", options: P, width: "13%" },
            ]
          },
        ],
      ]],
    ],

    // ═══════ S5 — VERIFICATION PENDING (stage 4) ═══════
    verification: [
      [[
        "9. Implementation & Verification",
        [
          { key: "ImplementationDate", label: "Actual Implementation Date", type: "date" },
          { key: "VerifiedBy", label: "Verified By (QA)", type: "select", options: P },
          { key: "VerificationDate", label: "Verification Date", type: "date" },
          { type: "row-break" },
          { key: "ImplementationEvidence", label: "Implementation Evidence / Verification", type: "textarea" },
        ],
      ]],
      [[
        "10. Evaluation & Review of Implemented Action",
        [
          { key: "EffectivenessRequired", label: "Effectiveness Required?", type: "select", options: ["Yes", "No"] },
          { type: "row-break" },
          { key: "EvaluationReview", label: "Evaluation & Review of Implemented Preventive Action", type: "textarea" },
          {
            key: "EvalSigns", type: "signblock", label: "Reviewed By",
            signs: [
              { key: "EvalDeptHead", label: "Head of Concerned Dept.", options: P },
              { key: "EvalQaHead", label: "Head QA", options: P },
            ]
          },
        ],
      ]],
      [[
        "11. Linked Records",
        [
          { key: "ChangeControlRef", label: "Change Control Ref.", type: "text", disabled: true },
          { key: "DmsRef", label: "Linked Document Ref.", type: "text", disabled: true },
          { key: "TrainingRef", label: "Linked Training Ref.", type: "text", disabled: true },
        ],
      ]],
    ],

    // ═══════ S6 — EFFECTIVENESS CHECK (stage 5) ═══════
    effectiveness: [
      [[
        "12. Effectiveness Review",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "EffectivenessDueDate", label: "Effectiveness Review Due", type: "date" },
          {
            key: "EffectivenessResult", label: "Effectiveness Result", type: "select",
            options: ["Pending", "Effective", "Not Effective"]
          },
          { key: "EffectivenessReviewedBy", label: "Reviewed By", type: "select", options: P },
          {
            key: "RiskAssessmentRequired", label: "Risk Assessment Required?", type: "select",
            options: ["Yes", "No"], showIf: (d) => d.EffectivenessResult === "Not Effective"
          },
          {
            key: "RiskAssessmentRef", label: "Linked Risk Assessment Ref. (auto)", type: "text",
            disabled: true, showIf: (d) => d.RiskAssessmentRequired === "Yes"
          },
          { type: "row-break" },
          { key: "EffectivenessCriteria", label: "Effectiveness Check Criteria", type: "textarea" },
        ],
      ]],
      [[
        "13. Effectiveness Verification",
        [
          {
            key: "EffVerificationRequired", label: "Effectiveness Verification Required", type: "select",
            options: ["Yes", "No"]
          },
          { type: "row-break" },
          {
            key: "EffReasonIfNotRequired", label: "Reason if Effectiveness Verification Not Required",
            type: "textarea", showIf: (d) => d.EffVerificationRequired === "No"
          },
          {
            key: "EffReasonSigns", type: "signblock", label: "Reason Approved By",
            showIf: (d) => d.EffVerificationRequired === "No",
            signs: [{ key: "EffReasonSign", label: "QA Head / Designee", options: P }]
          },

          {
            key: "EffDeptHeadComment", label: "Comment by Initiator Department Head", type: "textarea",
            showIf: (d) => d.EffVerificationRequired === "Yes"
          },
          {
            key: "EffDeptHeadSigns", type: "signblock", label: "Dept Head Sign",
            showIf: (d) => d.EffVerificationRequired === "Yes",
            signs: [{ key: "EffDeptHead", label: "Dept Head / Designee", options: P }]
          },

          {
            key: "EffQaHeadComment", label: "Comment by QA Head", type: "textarea",
            showIf: (d) => d.EffVerificationRequired === "Yes"
          },
          {
            key: "EffQaHeadSigns", type: "signblock", label: "QA Head Sign",
            showIf: (d) => d.EffVerificationRequired === "Yes",
            signs: [{ key: "EffQaHead", label: "QA Head / Designee", options: P }]
          },
        ],
      ]],
      [[
        "14. If CAPA Not Effective",
        [
          {
            key: "InvestigationRefIfNotEffective", label: "Reference No. for Investigation", type: "text",
            showIf: (d) => d.EffectivenessResult === "Not Effective"
          },
          {
            key: "NewCapaNo", label: "New CAPA No. Against Not Effective CAPA", type: "text",
            disabled: true, showIf: (d) => d.EffectivenessResult === "Not Effective"
          },
          { type: "row-break" },
          {
            key: "CommentsIfNotEffective", label: "Comments if CAPA is Not Effective", type: "textarea",
            showIf: (d) => d.EffectivenessResult === "Not Effective"
          },
          {
            key: "NotEffectiveSigns", type: "signblock", label: "Signed By",
            showIf: (d) => d.EffectivenessResult === "Not Effective",
            signs: [{ key: "NotEffectiveSign", label: "QA Head / Designee", options: P }]
          },
        ],
      ]],
      [[
        "15. Closing of CAPA",
        [
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { key: "ClosingDate", label: "Closing Date", type: "date" },
          { type: "row-break" },
          { key: "ClosureRemarks", label: "Closure Remarks", type: "textarea" },
        ],
      ]],
    ],
  };
};


export const capaSectionConfigs = {
  "1. CAPA Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "2. Investigation": "grid-cols-1",
  "3. Root Cause Analysis": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "4. Proposed Corrective Action": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  "5. Proposed Preventive Action": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  "6. Approval for CAPA": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "7. Implementation Progress": "grid-cols-1",
  "8. Extension for CAPA": "grid-cols-1",
  "9. Implementation & Verification": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "10. Evaluation & Review of Implemented Action": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  "11. Linked Records": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3",
  "12. Effectiveness Review": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "13. Effectiveness Verification": "grid-cols-1 sm:grid-cols-2",
  "14. If CAPA Not Effective": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  "15. Closing of CAPA": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

export const capaRequiredByStage = {
  "Open": ["InitiationDate", "SourceType", "SourceRef", "CapaType", "Department", "Priority", "ProblemStatement"],
  "RCA Pending": ["Investigation", "RcaMethod", "RootCause", "RcaCompletedBy"],
  "Plan Pending": ["CorrectiveAction", "PreventiveAction", "ResponsiblePerson",
    "CorrectiveTargetDate", "PreventiveTargetDate", "ApprovalStatus", "ApprovedBy", "ApprovalDate"],
  "Action In Progress": ["ProgressRemarks"],
  "Verification Pending": ["ImplementationEvidence", "ImplementationDate", "VerifiedBy",
    "VerificationDate", "EffectivenessRequired"],
  "Effectiveness Check": ["EffectivenessCriteria", "EffectivenessDueDate", "EffectivenessResult",
    "EffectivenessReviewedBy", "EffVerificationRequired"],
  "Closed": [],
};

export const getCapaRequired = (s) => capaRequiredByStage[s] || capaRequiredByStage["Open"];

export const capaTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "CAPA No." },
  { key: "InitiationDate", label: "Initiated", render: (r) => (r.InitiationDate || "").slice(0, 10) },
  { key: "SourceType", label: "Source" },
  { key: "SourceRef", label: "Source Ref." },
  { key: "Department", label: "Department" },
  { key: "TargetDate", label: "Target Date", render: (r) => (r.TargetDate || "").slice(0, 10) },
  { key: "EffectivenessResult", label: "Effectiveness" },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];


// ════════════════════════════════════════════ CHANGE CONTROL ═══════════════

export const changeControlTabs = ["details", "impact", "approval", "implementation", "review", "closure", "audit"];

export const changeControlTabStage = {
  details: 0, impact: 1, approval: 2, implementation: 3, review: 4, closure: 5, audit: 99,
};

export const changeControlTabLabels = {
  details: "1. Change Details",
  impact: "2. Impact Assessment",
  approval: "3. Approval",
  implementation: "4. Implementation",
  review: "5. Post-Impl. Review",
  closure: "6. Closure",
  audit: "7. Audit Trail",
};

export const changeControlWidthConfig = {
  "Change Related To": "col-span-full",
  "Specify Other": "col-span-full",
  "Existing System / Current State": "col-span-full",
  "Proposed Change": "col-span-full",
  "Justification / Reason for Change": "col-span-full",
  "Attachments / Supporting Data": "col-span-full",
  "Planned Deviation Data": "col-span-full",
  "Qualification Impact": "col-span-1",
  "Linked Qualification Ref. (auto)": "col-span-1",
  "Impact Assessment (Quality / Validation / Regulatory / Stability)": "col-span-full",
  "Affected Documents / SOPs / Specs": "col-span-full",
  "CFT Members": "col-span-full",
  "Approval Remarks": "col-span-full",
  "Implementation Plan / Actions": "col-span-full",
  "Post-Implementation Effectiveness Review": "col-span-full",
  "Proposed Action": "col-span-full",
  "Justification for Discontinuation": "col-span-full",
  "Supporting Document": "col-span-full",
  "Closure Remarks": "col-span-full",
};
const CHANGE_RELATED_TO = ["BMR/BPR", "Standard Operating Procedure", "Testing Procedure",
  "Printed Packing Materials", "Equipment Design / Configuration", "Specifications",
  "Process", "Instrument", "Utility", "Facility", "Vendor", "Others"];

const IMPACT_ROWS = ["Product Identity", "Product Safety", "Product Strength",
  "Product Stability", "Product Efficacy"].map((x) => ({ CheckPoint: x }));

export const getChangeControlFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const D = (o.department || []).map((g) => g.label);
  const PR = (o.product || []).map((g) => g.label);

  return {
    // ═══════ S1 — DRAFT (stage 0) — Dept Head ═══════
    details: [
      [[
        "1. Change Details",
        [
          { key: "RecordNo", label: "Change Control No.", type: "text", disabled: true },
          {
            key: "ProposalRef", label: "Linked Proposal Ref. (auto)", type: "text", disabled: true,
            showIf: (d) => !!d.ProposalRef
          },
          { key: "InitiationDate", label: "Initiation Date", type: "date" },
          { key: "Department", label: "Initiating Department", type: "select", options: D },
          { key: "InitiatedBy", label: "Initiated By", type: "select", options: P },
          {
            key: "ChangeType", label: "Change Type", type: "select",
            options: ["Process / Method", "Equipment", "Facility / Utility", "Document / SOP",
              "Software / System", "Supplier / Vendor", "Other"]
          },
          { key: "Product", label: "Product (if applicable)", type: "select", options: PR },
          { key: "ChangeNature", label: "Change Nature", type: "select", options: ["Temporary", "Permanent"] },
          { key: "Classification", label: "Classification", type: "select", options: ["Minor", "Major", "Critical"] },
          { key: "CapaRef", label: "Linked CAPA Ref.", type: "text", disabled: true },
          { type: "row-break" },
          { key: "ChangeRelatedTo", label: "Change Related To", type: "multiselect", options: CHANGE_RELATED_TO },
          {
            key: "ChangeRelatedToOther", label: "Specify Other", type: "text",
            showIf: (d) => String(d.ChangeRelatedTo || "").includes("Others")
          },
        ],
      ]],
      [[
        "2. Change Description",
        [
          { key: "CurrentState", label: "Existing System / Current State", type: "textarea" },
          { key: "ProposedChange", label: "Proposed Change", type: "textarea" },
          { key: "Justification", label: "Justification / Reason for Change", type: "textarea" },
        ],
      ]],
      [[
        "3. Attachments & Supporting Data",
        [
          { key: "AttachmentDetails", label: "Attachments / Supporting Data", type: "textarea" },
          { key: "PlannedDeviationData", label: "Planned Deviation Data", type: "textarea" },
          {
            key: "AttachSigns", type: "signblock", label: "Signatures",
            signs: [
              { key: "AttachInitiated", label: "Initiated By", options: P },
              { key: "AttachCheckedQa", label: "Checked By QA", options: P },
            ]
          },
        ],
      ]],
    ],

    // ═══════ S2 — IMPACT ASSESSMENT (stage 1) — QA Head ═══════
    impact: [
      [[
        "4. Evaluation (Yes / No)",
        [
          {
            key: "evalmatrix", type: "childgrid", label: "Evaluation Check Points", fixedRows: true,
            defaultRows: IMPACT_ROWS,
            footer: "Mark the impact level for each product attribute.",
            columns: [
              { key: "CheckPoint", label: "Check Point", type: "text", disabled: true, width: "34%" },
              { key: "MajorImpact", label: "Major Impact", type: "select", options: ["Yes", "No"], width: "22%" },
              { key: "PotentialImpact", label: "Potential Impact", type: "select", options: ["Yes", "No"], width: "22%" },
              { key: "NoImpact", label: "No Impact", type: "select", options: ["Yes", "No"], width: "22%" },
            ]
          },
          {
            key: "EvalSigns", type: "signblock", label: "Evaluation Signatures",
            signs: [
              { key: "EvalDoneQa", label: "Done By QA", options: P },
              { key: "EvalCheckedQa", label: "Checked By QA", options: P },
            ]
          },
        ],
      ]],
      [[
        "5. Impact Assessment",
        [
          { key: "AssessedBy", label: "Assessed By", type: "select", options: P },
          { key: "AssessmentDate", label: "Assessment Date", type: "date" },
          { key: "TrainingImpact", label: "Training Impact", type: "select", options: ["Yes", "No"] },
          { key: "ValidationImpact", label: "Qualification Impact", type: "select", options: ["Yes", "No"] },
          {
            key: "QualificationRef", label: "Linked Qualification Ref. (auto)", type: "text", disabled: true,
            showIf: (d) => d.ValidationImpact === "Yes"
          },
          {
            key: "RegulatoryImpact", label: "Regulatory Filing Impact", type: "select",
            options: ["Notification Required", "Approval Required", "Not Applicable"]
          },

          { key: "DmsImpact", label: "DMS Document Impact?", type: "select", options: ["Yes", "No"] },
          {
            key: "DmsChangeNature", label: "New or Existing Document?", type: "select",
            options: ["New", "Revision of Existing"], showIf: (d) => d.DmsImpact === "Yes"
          },
          {
            key: "ExistingDmsRef", label: "Select Existing DMS Document", type: "select",
            options: (o.refOpts?.dms || []).map((x) => x.value),
            showIf: (d) => d.DmsImpact === "Yes" && d.DmsChangeNature === "Revision of Existing"
          },
          {
            key: "DmsRef", label: "Linked DMS Ref. (auto)", type: "text", disabled: true,
            showIf: (d) => d.DmsImpact === "Yes"
          },

          { key: "StpImpact", label: "STP Document Impact?", type: "select", options: ["Yes", "No"] },
          {
            key: "StpChangeNature", label: "New or Existing Document?", type: "select",
            options: ["New", "Revision of Existing"], showIf: (d) => d.StpImpact === "Yes"
          },
          {
            key: "ExistingStpRef", label: "Select Existing STP Document", type: "select",
            options: (o.refOpts?.stp || []).map((x) => x.value),
            showIf: (d) => d.StpImpact === "Yes" && d.StpChangeNature === "Revision of Existing"
          },
          {
            key: "StpRef", label: "Linked STP Ref. (auto)", type: "text", disabled: true,
            showIf: (d) => d.StpImpact === "Yes"
          },

          {
            key: "RiskAssessmentRequired", label: "Risk Assessment Required?", type: "select",
            options: ["Yes", "No"], showIf: (d) => ["Critical", "Major"].includes(d.Classification)
          },
          {
            key: "RiskAssessmentRef", label: "Linked Risk Assessment Ref. (auto)", type: "text", disabled: true,
            showIf: (d) => d.RiskAssessmentRequired === "Yes"
          },

          { type: "row-break" },
          { key: "ImpactAssessment", label: "Impact Assessment (Quality / Validation / Regulatory / Stability)", type: "textarea" },
          { key: "AffectedDocuments", label: "Affected Documents / SOPs / Specs", type: "textarea" },
        ],
      ]],
      [[
        "6. Impacted Department Review",
        [
          {
            key: "deptreview", type: "childgrid", label: "Review & Comment by Impacted Departments",
            footer: "Add a row for each department that reviewed this change.",
            columns: [
              { key: "Department", label: "Department", type: "select", options: D, width: "18%" },
              { key: "Comments", label: "Review & Comment", type: "textarea" },
              { key: "SignBy", label: "Head / Designee", type: "select", options: P, width: "16%" },
              { key: "SignOn", label: "Date", type: "date", width: "13%" },
            ]
          },
        ],
      ]],
    ],

    // ═══════ S3 — PENDING APPROVAL (stage 2) — QA Head ═══════
    approval: [
      [[
        "7. Proposed Change Approval",
        [
          {
            key: "ApprovalStatus", label: "Change Approved / Rejected", type: "select",
            options: ["Approved", "Rejected"]
          },
          { key: "ApprovedBy", label: "Approved By (QA Head / Designee)", type: "select", options: P },
          { key: "ApprovalDate", label: "Approval Date", type: "date" },
          {
            key: "RejectionReason", label: "Rejection Reason (if any)", type: "text",
            showIf: (d) => d.ApprovalStatus === "Rejected"
          },
          { type: "row-break" },
          { key: "ApprovalRemarks", label: "Approval Remarks", type: "textarea" },
          { key: "CftMembers", label: "CFT Members", type: "textarea" },
        ],
      ]],
    ],

    // ═══════ S4 — IMPLEMENTATION (stage 3) — Dept Head ═══════
    implementation: [
      [[
        "8. Action Plan To Be Taken",
        [
          {
            key: "actionplan", type: "childgrid", label: "Action Plan",
            footer: "One row per action. Add the impacted document reference where applicable.",
            columns: [
              { key: "Action", label: "Action Plan To Be Taken", type: "textarea" },
              { key: "DocRef", label: "Impacted Document Reference No.", type: "text", width: "26%" },
            ]
          },
          {
            key: "PlanSigns", type: "signblock", label: "Action Plan Signatures",
            signs: [
              { key: "PlanCheckedQa", label: "Checked By QA", options: P },
              { key: "PlanReviewedQa", label: "Reviewed By QA", options: P },
            ]
          },
        ],
      ]],
      [[
        "9. Implementation",
        [
          { key: "TargetDate", label: "Proposed Target Date", type: "date" },
          { key: "ImplementedBy", label: "Implemented By", type: "select", options: P },
          { type: "row-break" },
          { key: "ImplementationPlan", label: "Implementation Plan / Actions", type: "textarea" },
        ],
      ]],
      [[
        "10. Extension Required",
        [
          {
            key: "extensions", type: "childgrid", label: "Time Frame Extension",
            columns: [
              { key: "Justification", label: "Justification & Pending Activities", type: "textarea" },
              { key: "InitialFrom", label: "Initial From", type: "date", width: "10%" },
              { key: "InitialTo", label: "Initial To", type: "date", width: "10%" },
              { key: "ExtTo", label: "Extended To", type: "date", width: "10%" },
              { key: "Period", label: "Period", type: "text", width: "9%" },
              { key: "InitiatorHodBy", label: "Initiator HOD", type: "select", options: P, width: "13%" },
              { key: "ApprovalStatus", label: "Status", type: "select", options: ["Approved", "Rejected"], width: "10%" },
              { key: "QaHeadBy", label: "QA Head", type: "select", options: P, width: "13%" },
            ]
          },
        ],
      ]],
    ],

    // ═══════ S5 — EFFECTIVENESS REVIEW (stage 4) — QA Head ═══════
    review: [
      [[
        "11. Action Plan Implemented",
        [
          {
            key: "actionimpl", type: "childgrid", label: "Implemented Actions",
            footer: "Record the implementation date and QA verification for each action.",
            columns: [
              { key: "Action", label: "Action Plan Taken", type: "textarea" },
              { key: "DocRef", label: "Impacted Document Ref.", type: "text", width: "20%" },
              { key: "ImplementedOn", label: "Implemented Date", type: "date", width: "14%" },
              { key: "VerifiedQaBy", label: "Verified By QA", type: "select", options: P, width: "16%" },
            ]
          },
        ],
      ]],
      [[
        "12. Post-Implementation Review",
        [
          { key: "ActualImplementationDate", label: "Actual Implementation Date", type: "date" },
          { key: "DmsRef", label: "Linked Document Ref.", type: "text", disabled: true },
          { key: "TrainingRef", label: "Linked Training Ref.", type: "text", disabled: true },
          { type: "row-break" },
          { key: "EffectivenessCheck", label: "Post-Implementation Effectiveness Review", type: "textarea" },
        ],
      ]],
    ],

    // ═══════ S6 — PENDING CLOSURE (stage 5) — QA Head ═══════
    closure: [
      [[
        "13. Closure",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "NewChangeControlRaised", label: "New Change Control Raised (if any)", type: "text" },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { key: "ClosedOn", label: "Closing Date", type: "date" },
          { type: "row-break" },
          { key: "ClosureRemarks", label: "Closure Remarks", type: "textarea" },
        ],
      ]],
      [[
        "14. Discontinue Request",
        [
          {
            key: "DiscontinueRequested", label: "Discontinue This Change Control?", type: "select",
            options: ["Yes", "No"]
          },
          { type: "row-break" },
          {
            key: "DiscontinueProposedAction", label: "Proposed Action", type: "textarea",
            showIf: (d) => d.DiscontinueRequested === "Yes"
          },
          {
            key: "DiscontinueJustification", label: "Justification for Discontinuation", type: "textarea",
            showIf: (d) => d.DiscontinueRequested === "Yes"
          },
          {
            key: "DiscontinueSupportingDoc", label: "Supporting Document", type: "textarea",
            showIf: (d) => d.DiscontinueRequested === "Yes"
          },
          {
            key: "DiscSigns", type: "signblock", label: "Discontinue Approval",
            showIf: (d) => d.DiscontinueRequested === "Yes",
            signs: [
              { key: "DiscPrepared", label: "Prepared By", options: P },
              { key: "DiscDeptHead", label: "Reviewed by Dept Head", options: P },
              { key: "DiscQaHead", label: "Approved by QA Head", options: P },
            ]
          },
        ],
      ]],
    ],
  };
};

export const changeControlSectionConfigs = {
  "1. Change Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "2. Change Description": "grid-cols-1",
  "3. Attachments & Supporting Data": "grid-cols-1",
  "4. Evaluation (Yes / No)": "grid-cols-1",
  "5. Impact Assessment": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "6. Impacted Department Review": "grid-cols-1",
  "7. Proposed Change Approval": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "8. Action Plan To Be Taken": "grid-cols-1",
  "9. Implementation": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "10. Extension Required": "grid-cols-1",
  "11. Action Plan Implemented": "grid-cols-1",
  "12. Post-Implementation Review": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3",
  "13. Closure": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "14. Discontinue Request": "grid-cols-1 sm:grid-cols-2",
};

export const changeControlRequiredByStage = {
  "Draft": ["InitiationDate", "Department", "ChangeType", "ChangeNature", "Classification",
    "InitiatedBy", "ChangeRelatedTo", "CurrentState", "ProposedChange", "Justification"],
  "Impact Assessment": ["ImpactAssessment", "TrainingImpact", "ValidationImpact",
    "RegulatoryImpact", "AssessedBy", "AssessmentDate"],
  "Pending Approval": ["ApprovalStatus", "CftMembers", "ApprovedBy", "ApprovalDate"],
  "Implementation": ["ImplementationPlan", "TargetDate", "ImplementedBy"],
  "Effectiveness Review": ["ActualImplementationDate", "EffectivenessCheck"],
  "Pending Closure": ["ClosedBy", "ClosedOn", "ClosureRemarks"],
  "Closed": [],
};

export const getChangeControlRequired = (s) =>
  changeControlRequiredByStage[s] || changeControlRequiredByStage["Draft"];

export const changeControlTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "CC No." },
  { key: "InitiationDate", label: "Initiated", render: (r) => (r.InitiationDate || "").slice(0, 10) },
  { key: "ChangeType", label: "Change Type" },
  { key: "Product", label: "Product" },
  { key: "Classification", label: "Classification" },
  { key: "TargetDate", label: "Target Date", render: (r) => (r.TargetDate || "").slice(0, 10) },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

/* ============================================================================
   ADD THIS to Qmsconfigs.js — anywhere alongside the other module blocks.
   ============================================================================ */

// ══════════════════════════════ CHANGE PROPOSAL ═══════════════════════════

export const changeProposalTabs = ["details", "screening", "audit"];

export const changeProposalTabStage = {
  details: 0, screening: 1, audit: 99,
};

export const changeProposalTabLabels = {
  details: "1. Proposal Details",
  screening: "2. QA Screening",
  audit: "3. Audit Trail",
};

export const changeProposalWidthConfig = {
  "Existing System / Current State": "col-span-full",
  "Proposed Change": "col-span-full",
  "Justification / Reason for Change": "col-span-full",
  "Screening Remarks": "col-span-full",
};

export const getChangeProposalFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const D = (o.department || []).map((g) => g.label);

  return {
    // ═══════ S1 — DRAFT (stage 0) — Dept Head / Operator ═══════
    details: [
      [[
        "1. Proposal Details",
        [
          { key: "RecordNo", label: "Proposal No.", type: "text", disabled: true },
          { key: "InitiationDate", label: "Date", type: "date" },
          { key: "Department", label: "Department", type: "select", options: D },
          { key: "InitiatedBy", label: "Proposed By", type: "select", options: P },
          {
            key: "ChangeType", label: "Change Type", type: "select",
            options: ["Process / Method", "Equipment", "Facility / Utility", "Document / SOP",
              "Software / System", "Supplier / Vendor", "Other"]
          },
          { type: "row-break" },
          { key: "CurrentState", label: "Existing System / Current State", type: "textarea" },
          { key: "ProposedChange", label: "Proposed Change", type: "textarea" },
          { key: "Justification", label: "Justification / Reason for Change", type: "textarea" },
        ],
      ]],
    ],

    // ═══════ S2 — QA SCREENING (stage 1) — QA Head ═══════
    // "Update" (normal save+advance) => Accepted, auto-creates Change Control.
    // "Reject" (existing reject button/dialog) => Rejected, nothing created.
    screening: [
      [[
        "2. QA Screening",
        [
          {
            key: "ChangeControlRef", label: "Linked Change Control Ref. (auto)", type: "text", disabled: true,
            showIf: (d) => !!d.ChangeControlRef
          },
          { key: "ScreenedBy", label: "Screened By (QA)", type: "select", options: P },
          { key: "ScreenedOn", label: "Screened On", type: "date" },
          { type: "row-break" },
          { key: "ScreeningRemarks", label: "Screening Remarks", type: "textarea" },
        ],
      ]],
    ],
  };
};

export const changeProposalSectionConfigs = {
  "1. Proposal Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "2. QA Screening": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
};

export const changeProposalRequiredByStage = {
  "Draft": ["InitiationDate", "Department", "InitiatedBy", "ChangeType", "CurrentState", "ProposedChange", "Justification"],
  "QA Screening": ["ScreenedBy", "ScreenedOn", "ScreeningRemarks"],
  "Closed": [],
};

export const getChangeProposalRequired = (s) =>
  changeProposalRequiredByStage[s] || changeProposalRequiredByStage["Draft"];

export const changeProposalTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Proposal No." },
  { key: "InitiationDate", label: "Date", render: (r) => (r.InitiationDate || "").slice(0, 10) },
  { key: "Department", label: "Department" },
  { key: "ChangeType", label: "Change Type" },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "ChangeControlRef", label: "Change Control Ref.", render: (r) => r.ChangeControlRef || "—" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];


// ═════════════════════════════════════════════ PRODUCT RECALL ══════════════

export const recallTabs = ["details", "notification", "recovery", "effectiveness", "closure", "audit"];

export const recallTabStage = {
  details: 0, notification: 1, recovery: 2, effectiveness: 3, closure: 4, audit: 99,
};

export const recallTabLabels = {
  details: "1. Recall Details",
  notification: "2. Notification",
  recovery: "3. Recovery",
  effectiveness: "4. Effectiveness",
  closure: "5. Closure",
  audit: "6. Audit Trail",
};

export const recallWidthConfig = {
  "Reason for Recall": "col-span-full",
  "Distribution Details (Parties, Regions, Export)": "col-span-full",
  "Recall Effectiveness Check Summary": "col-span-full",
  "Recovered Stock Disposition / Destruction Details": "col-span-full",
};

export const getRecallFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const PR = (o.product || []).map((g) => g.label);

  return {
    // ───── S1 — INITIATED (stage 0) — QA Head ─────
    details: [
      [[
        "1. Recall Details",
        [
          { key: "RecordNo", label: "Recall No.", type: "text", disabled: true },
          { key: "InitiationDate", label: "Recall Initiation Date", type: "date" },
          { key: "Product", label: "Product", type: "select", options: PR },
          { key: "BatchNos", label: "Batch No.(s)", type: "text" },
          { key: "MfgDate", label: "Batch Mfg. Date", type: "date" },
          { key: "ExpDate", label: "Batch Expiry Date", type: "date" },
          { key: "Classification", label: "Recall Classification", type: "select", options: ["Class I", "Class II", "Class III"] },
          { key: "RecallType", label: "Recall Type", type: "select", options: ["Voluntary", "Mandatory / Regulatory Directed"] },
          { key: "RecallLevel", label: "Recall Level / Depth", type: "select", options: ["Consumer Level", "Retail Level", "Wholesale Level"] },
          { key: "InitiatedBy", label: "Initiated By", type: "select", options: P },
          { type: "row-break" },
          { key: "Reason", label: "Reason for Recall", type: "textarea" },
        ],
      ]],
      [[
        "2. Linked References",
        [
          { key: "DeviationRef", label: "Linked Deviation / OOS Ref.", type: "select", options: (o.refOpts?.deviation || []).map((x) => x.value) },
          { key: "IncidentRef", label: "Linked Incident Ref.", type: "select", options: (o.refOpts?.incident || []).map((x) => x.value) },
          { key: "AttachmentRef", label: "Attachment Ref.", type: "text" },
          { key: "ComplaintRef", label: "Linked Market Complaint Ref.", type: "select", options: (o.refOpts?.complaint || []).map((x) => x.value) },
        ],
      ]],
    ],

    // ───── S2 — AUTHORITY NOTIFIED (stage 1) — Regulatory Affairs ─────
    notification: [
      [[
        "3. Regulatory Notification",
        [
          { key: "CommunicationMode", label: "Communication Mode", type: "select", options: ["Email", "Letter", "Phone Call", "Public Notice"] },
          { key: "RegulatoryAuthority", label: "Regulatory Authority Notified", type: "text" },
          { key: "RegulatoryNotifiedDate", label: "Authority Notification Date", type: "date" },
          { key: "NotifiedBy", label: "Notified By", type: "select", options: P },
        ],
      ]],
    ],

    // ───── S3 — RECOVERY IN PROGRESS (stage 2) — Warehouse Head ─────
    recovery: [
      [[
        "4. Distribution & Recovery",
        [
          { key: "QtyManufactured", label: "Qty. Manufactured", type: "text" },
          {
            key: "QtyDistributed", label: "Qty. Distributed (Units)", type: "text",
            onChange: (v, cur) => {
              const d = parseFloat(v), r = parseFloat(cur.QtyRecovered);
              const pct = (!isNaN(d) && d > 0 && !isNaN(r)) ? ((r / d) * 100).toFixed(2) : "";
              return { ...cur, QtyDistributed: v, RecoveryPercent: pct };
            },
          },
          { key: "QtyInStock", label: "Qty. in Stock (Units)", type: "text" },
          {
            key: "QtyRecovered", label: "Qty. Recovered (Units)", type: "text",
            onChange: (v, cur) => {
              const d = parseFloat(cur.QtyDistributed), r = parseFloat(v);
              const pct = (!isNaN(d) && d > 0 && !isNaN(r)) ? ((r / d) * 100).toFixed(2) : "";
              return { ...cur, QtyRecovered: v, RecoveryPercent: pct };
            },
          },
          { key: "RecoveryPercent", label: "Recovery %", type: "text", disabled: true },
          { key: "TargetDate", label: "Target Completion Date", type: "date" },
          { type: "row-break" },
          { key: "DistributionDetails", label: "Distribution Details (Parties, Regions, Export)", type: "textarea" },
        ],
      ]],
    ],

    // ───── S4 — EFFECTIVENESS CHECK (stage 3) — QA Head ─────
    effectiveness: [
      [[
        "5. Effectiveness Check",
        [
          { key: "MockRecallResult", label: "Mock Recall Result", type: "text" },
          { key: "MockRecallDate", label: "Mock Recall Date", type: "date" },
          { key: "EffectivenessReviewedBy", label: "Reviewed By", type: "select", options: P },
          { type: "row-break" },
          { key: "EffectivenessSummary", label: "Recall Effectiveness Check Summary", type: "textarea" },
        ],
      ]],
    ],

    // ───── S5 — PENDING CLOSURE (stage 4) — QA Head ─────
    closure: [
      [[
        "6. Disposition & Closure",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "QtyDestroyed", label: "Qty. Destroyed (Units)", type: "text" },
          { key: "DestructionWitnessedBy", label: "Destruction Witnessed By", type: "select", options: P },
          { key: "CapaRef", label: "Linked CAPA Ref.", type: "select", options: (o.refOpts?.capa || []).map((x) => x.value) },
          { key: "ClosureDate", label: "Closure Date", type: "date" },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { type: "row-break" },
          { key: "DestructionDetails", label: "Recovered Stock Disposition / Destruction Details", type: "textarea" },
        ],
      ]],
    ],
  };
};

export const recallSectionConfigs = {
  "1. Recall Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "2. Linked References": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "3. Regulatory Notification": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "4. Distribution & Recovery": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "5. Effectiveness Check": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3",
  "6. Disposition & Closure": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
};

export const recallRequiredByStage = {
  "Initiated": ["InitiationDate", "Product", "BatchNos", "Classification", "RecallType", "RecallLevel", "Reason", "InitiatedBy"],
  "Authority Notified": ["CommunicationMode", "RegulatoryAuthority", "RegulatoryNotifiedDate", "NotifiedBy"],
  "Recovery In Progress": ["DistributionDetails", "QtyManufactured", "QtyDistributed", "QtyRecovered", "TargetDate"],
  "Effectiveness Check": ["EffectivenessSummary", "MockRecallResult", "MockRecallDate", "EffectivenessReviewedBy"],
  "Pending Closure": ["DestructionDetails", "QtyDestroyed", "ClosureDate", "ClosedBy"],
  "Closed": [],
};

export const getRecallRequired = (s) =>
  recallRequiredByStage[s] || recallRequiredByStage["Initiated"];

export const recallTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Recall No." },
  { key: "InitiationDate", label: "Initiated", render: (r) => (r.InitiationDate || "").slice(0, 10) },
  { key: "Product", label: "Product" },
  { key: "BatchNos", label: "Batch No.(s)" },
  { key: "Classification", label: "Class" },
  { key: "RecoveryPercent", label: "Recovery %" },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// ═══════════════════════════════════════════════════════ DMS ═══════════════

export const dmsTabs = ["details", "review", "approval", "training", "effective", "withdrawal", "audit"];

export const dmsTabStage = {
  details: 0, review: 1, approval: 2, training: 3, effective: 4, withdrawal: 5, audit: 99,
};

export const dmsTabLabels = {
  details: "1. Document Details",
  review: "2. Review",
  approval: "3. Approval",
  training: "4. Training",
  effective: "5. Effective",
  withdrawal: "6. Withdrawal",
  audit: "7. Audit Trail",
};

export const dmsWidthConfig = {
  "Reason for New Version / Revision": "col-span-full",
  "Controlled Copy Distribution (Departments / Copy Numbers)": "col-span-full",
  "Retrieved Copies Details": "col-span-full",
};

export const getDmsFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const D = (o.department || []).map((g) => g.label);

  return {
    // ───── S1 — DRAFT (stage 0) — Document Controller ─────
    details: [
      [[
        "1. Document Details",
        [
          { key: "RecordNo", label: "DMS Record No.", type: "text", disabled: true },
          { key: "DocNo", label: "Document No.", type: "text" },
          { key: "DocTitle", label: "Document Title", type: "text" },
          { key: "DocType", label: "Document Type", type: "select", options: ["SOP", "Policy", "Work Instruction", "Form", "Specification", "Manual", "Protocol"] },
          { key: "Department", label: "Owner Department", type: "select", options: D },
          { key: "Version", label: "Version No.", type: "text" },
          { key: "Supersedes", label: "Supersedes", type: "text" },
          { key: "ChangeRef", label: "Change Control Ref.", type: "text", disabled: true },
          { key: "CapaRef", label: "Linked CAPA Ref.", type: "text", disabled: true },
          { key: "PreparedBy", label: "Prepared By", type: "select", options: P },
          { key: "PreparedOn", label: "Prepared On", type: "date" },
          { key: "AttachmentRef", label: "Attachment Ref.", type: "text" },
        ],
      ]],
      [[
        "2. Revision Details",
        [
          { key: "ReasonForRevision", label: "Reason for New Version / Revision", type: "textarea" },
        ],
      ]],
    ],

    // ───── S2 — UNDER REVIEW (stage 1) — Dept Head ─────
    review: [
      [[
        "3. Review",
        [
          { key: "ReviewedBy", label: "Reviewed By", type: "select", options: P },
          { key: "ReviewedOn", label: "Reviewed On", type: "date" },
        ],
      ]],
    ],

    // ───── S3 — PENDING APPROVAL (stage 2) — QA Head ─────
    approval: [
      [[
        "4. Approval",
        [
          { key: "ApprovedBy", label: "Approved By", type: "select", options: P },
          { key: "ApprovedOn", label: "Approved On", type: "date" },
          { key: "IssueDate", label: "Date of Issue", type: "date" },
        ],
      ]],
    ],

    // ───── S4 — TRAINING PENDING (stage 3) — Training Coordinator ─────
    training: [
      [[
        "5. Training",
        [
          {
            key: "TrainingRequired",
            label: "Training Req. Before Effective?",
            type: "select",
            options: ["Yes", "No"],
            disabled: (d) => d.TrainingRequiredLocked === 1,
          },
          { key: "TrainingRef", label: "Linked Training Ref.", type: "text", options: (o.refOpts?.training || []).map((x) => x.value), showIf: (d) => d.TrainingRequired === "Yes", disabled: true, }, { key: "TrainingCompletedOn", label: "Training Completed On", type: "date", showIf: (d) => d.TrainingRequired === "Yes" },
        ],
      ]],
    ],

    // ───── S5 — PENDING EFFECTIVE (stage 4) — Document Controller ─────
    effective: [
      [[
        "6. Distribution & Effective",
        [
          { key: "EffectiveDate", label: "Effective Date", type: "date" },
          { key: "ReviewDate", label: "Next Periodic Review Due", type: "date" },
          { type: "row-break" },
          { key: "Distribution", label: "Controlled Copy Distribution (Departments / Copy Numbers)", type: "textarea" },
        ],
      ]],
    ],

    // ───── S6 — EFFECTIVE (stage 5) — Document Controller ─────
    withdrawal: [
      [[
        "7. Withdrawal",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "ObsoleteDate", label: "Obsolete Date", type: "date" },
          { key: "RetentionPeriod", label: "Retention Period", type: "text" },
          { key: "SupersededByRef", label: "Superseded By (New Doc Ref.)", type: "text" },
          { type: "row-break" },
          { key: "RetrievedCopies", label: "Retrieved Copies Details", type: "textarea" },
        ],
      ]],
    ],
  };
};

export const dmsSectionConfigs = {
  "1. Document Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "2. Revision Details": "grid-cols-1",
  "3. Review": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "4. Approval": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "5. Training": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "6. Distribution & Effective": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "7. Withdrawal": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
};

export const dmsRequiredByStage = {
  "Draft": ["DocTitle", "DocNo", "DocType", "Department", "Version", "PreparedBy", "PreparedOn", "ReasonForRevision"],
  "Under Review": ["ReviewedBy", "ReviewedOn"],
  "Pending Approval": ["ApprovedBy", "ApprovedOn", "IssueDate"],
  "Training Pending": ["TrainingRequired"],
  "Pending Effective": ["EffectiveDate", "ReviewDate", "Distribution"],

  "Obsolete": [],
};

export const getDmsRequired = (s) => dmsRequiredByStage[s] || dmsRequiredByStage["Draft"];

export const dmsTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "DocNo", label: "Document No." },
  { key: "DocTitle", label: "Document Title" },
  { key: "DocType", label: "Type" },
  { key: "Version", label: "Version" },
  { key: "Department", label: "Owner Dept." },
  { key: "EffectiveDate", label: "Effective Date", render: (r) => (r.EffectiveDate || "").slice(0, 10) },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// ═══════════════════════════════════════════════ STP REGISTER ══════════════

export const stpTabs = ["details", "review", "approval", "training", "effective", "withdrawal", "audit"];

export const stpTabStage = {
  details: 0, review: 1, approval: 2, training: 3, effective: 4, withdrawal: 5, audit: 99,
};

export const stpTabLabels = {
  details: "1. Document Details",
  review: "2. Review",
  approval: "3. Approval",
  training: "4. Training",
  effective: "5. Effective",
  withdrawal: "6. Withdrawal",
  audit: "7. Audit Trail",
};

export const stpWidthConfig = {
  "Reason for Revision": "col-span-full",
  "Scope / Remarks": "col-span-full",
  "Controlled Copy Distribution": "col-span-full",
};

export const getStpFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const D = (o.department || []).map((g) => g.label);

  return {
    // ───── S1 — DRAFT (stage 0) — Document Controller ─────
    details: [
      [[
        "1. Document Details",
        [
          { key: "RecordNo", label: "STP Record No.", type: "text", disabled: true },
          { key: "StpNo", label: "STP / Document No.", type: "text" },
          { key: "Title", label: "Document Title", type: "text" },
          { key: "Department", label: "Department", type: "select", options: D },
          { key: "Category", label: "Category", type: "select", options: ["SOP", "STP", "Policy", "Work Instruction", "Format", "Guideline"] },
          { key: "Version", label: "Version No.", type: "text" },
          { key: "Supersedes", label: "Supersedes", type: "text" },//superseded
          { key: "CapaRef", label: "Linked CAPA Ref.", type: "select", options: (o.refOpts?.capa || []).map((x) => x.value) },
          { key: "ChangeRef", label: "Change Control Ref.", type: "select", options: (o.refOpts?.changecontrol || []).map((x) => x.value) },
          { key: "PreparedBy", label: "Prepared By", type: "select", options: P },
          { key: "PreparedOn", label: "Prepared On", type: "date" },
          { key: "AttachmentRef", label: "Attachment Ref.", type: "text" },
        ],
      ]],
      [[
        "2. Revision Details",
        [
          { key: "ReasonForRevision", label: "Reason for Revision", type: "textarea" },
          { key: "Scope", label: "Scope / Remarks", type: "textarea" },
        ],
      ]],
    ],

    // ───── S2 — UNDER REVIEW (stage 1) — Dept Head ─────
    review: [
      [[
        "3. Review",
        [
          { key: "ReviewedBy", label: "Reviewed By", type: "select", options: P },
          { key: "ReviewedOn", label: "Reviewed On", type: "date" },
        ],
      ]],
    ],

    // ───── S3 — PENDING APPROVAL (stage 2) — QA Head ─────
    approval: [
      [[
        "4. Approval",
        [
          { key: "ApprovedBy", label: "Approved By", type: "select", options: P },
          { key: "ApprovedOn", label: "Approved On", type: "date" },
          { key: "IssueDate", label: "Date of Issue", type: "date" },
        ],
      ]],
    ],

    // ───── S4 — TRAINING PENDING (stage 3) — Training Coordinator ─────
    //     training: [
    //       [[
    //         "5. Training",
    //         [
    //           { key: "TrainingDone", label: "Training Completed Before Effective?", type: "select", options: ["Yes", "No", "N/A"], disabled: (d) => d.TrainingRequiredLocked === 1,
    //  },
    //           { key: "TrainingRef", label: "Linked Training Ref.", type: "text",disabled:true , showIf: (d) => d.TrainingDone === "Yes" },],
    //       ]],
    //     ],
    training: [
      [[
        "5. Training",
        [
          {
            key: "TrainingDone", label: "Training Completed Before Effective?", type: "select",
            options: ["Yes", "No", "N/A"]
          },

          {
            key: "TrainingAction", label: "Training Action", type: "select",
            options: ["Create New Training", "Link Existing Training"],
            disabled: (d) => !!(d.TrainingRef && d.ChangeRef),   // lock agar CC se propagate hui hai
            showIf: (d) => d.TrainingDone === "No"
          },

          {
            key: "ExistingTrainingRef", label: "Select Existing Training", type: "select",
            options: (o.refOpts?.training || []).map((x) => x.value),
            showIf: (d) => d.TrainingDone === "No" && d.TrainingAction === "Link Existing Training"
          },

          {
            key: "TrainingRef", label: "Linked Training Ref.", type: "text", disabled: true,
            showIf: (d) => !!d.TrainingRef
          },
        ],
      ]],
    ],

    // ───── S5 — PENDING EFFECTIVE (stage 4) — Document Controller ─────
    effective: [
      [[
        "6. Distribution & Effective",
        [
          { key: "EffectiveDate", label: "Effective Date", type: "date" },
          { key: "NextReviewDate", label: "Next Periodic Review Due", type: "date" },
          { type: "row-break" },
          { key: "Distribution", label: "Controlled Copy Distribution", type: "textarea" },
        ],
      ]],
    ],
    // ───── S6 — EFFECTIVE (stage 5) — Document Controller ─────
    withdrawal: [
      [[
        "7. Withdrawal",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "ObsoleteDate", label: "Obsolete Date", type: "date" },
          { key: "RetentionPeriod", label: "Retention Period", type: "text" },
          { key: "SupersededByRef", label: "Superseded By (New Version Ref.)", type: "text" },
        ],
      ]],
    ],
  };
};

export const stpSectionConfigs = {
  "1. Document Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "2. Revision Details": "grid-cols-1",
  "3. Review": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "4. Approval": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "5. Training": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "6. Distribution & Effective": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "7. Withdrawal": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
};

export const stpRequiredByStage = {
  "Draft": ["StpNo", "Title", "Department", "Category", "Version", "PreparedBy", "PreparedOn", "ReasonForRevision"],
  "Under Review": ["ReviewedBy", "ReviewedOn"],
  "Pending Approval": ["ApprovedBy", "ApprovedOn", "IssueDate"],
  "Training Pending": ["TrainingDone"],
  "Pending Effective": ["EffectiveDate", "NextReviewDate", "Distribution"],

  "Obsolete": [],
};

export const getStpRequired = (s) => stpRequiredByStage[s] || stpRequiredByStage["Draft"];

export const stpTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "StpNo", label: "STP / Doc No." },
  { key: "Title", label: "Document Title" },
  { key: "Version", label: "Version" },
  { key: "Category", label: "Category" },
  { key: "Department", label: "Department" },
  { key: "EffectiveDate", label: "Effective Date", render: (r) => (r.EffectiveDate || "").slice(0, 10) },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// ══════════════════════════════════════════════════ TRAINING ═══════════════

export const trainingTabs = ["details", "conduct", "evaluation", "closure", "audit"];

export const trainingTabStage = {
  details: 0, conduct: 1, evaluation: 2, closure: 3, audit: 99,
};

export const trainingTabLabels = {
  details: "1. Training Details",
  conduct: "2. Conduct",
  evaluation: "3. Evaluation",
  closure: "4. Closure",
  audit: "5. Audit Trail",
};

export const trainingWidthConfig = {
  "Trainees & Scores (One per line: Name — Dept — Score — Pass/Fail/Retrain)": "col-span-full",
  "Training Effectiveness Assessment": "col-span-full",
  "Remarks / Retraining Plan": "col-span-full",
};

export const getTrainingFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const D = (o.department || []).map((g) => g.label);

  return {
    // ───── S1 — SCHEDULED (stage 0) — Training Coordinator ─────
    details: [
      [[
        "1. Training Details",
        [
          { key: "RecordNo", label: "Training No.", type: "text", disabled: true },
          { key: "TrainingTitle", label: "Training Title / Topic", type: "text" },
          { key: "TrainingType", label: "Training Type", type: "select", options: ["Induction", "GMP", "SOP", "Safety", "Refresher", "On-the-Job", "External"] },
          { key: "TrainingMode", label: "Training Mode", type: "select", options: ["Classroom", "Online", "On-the-Job", "Hybrid"] },
          { key: "Department", label: "Target Department", type: "select", options: D },
          { key: "Trainer", label: "Trainer / Faculty", type: "select", options: P },
          { key: "ChangeRef", label: "Change Control Ref.", type: "text", disabled: true },   // 🆕
          { key: "Priority", label: "Priority", type: "select", options: ["Normal", "High"], }, // 🆕
          { key: "DueDate", label: "Due Date", type: "date", }, // 🆕
          { key: "ScheduledDate", label: "Scheduled Date", type: "date" },
          { key: "ScheduledBy", label: "Scheduled By", type: "select", options: P },
          { key: "DocRef", label: "Linked STP / SOP Ref.", type: "text", disabled: true },
          { key: "DmsRef", label: "Linked Document Ref.", type: "text", disabled: true },
          { key: "CapaRef", label: "Linked CAPA Ref.", type: "text", disabled: true },
          { key: "AttachmentRef", label: "Attachment Ref.", type: "text" },
        ],
      ]],
    ],

    // ───── S2 — CONDUCTED (stage 1) — Training Coordinator ─────
    conduct: [
      [[
        "2. Conduct & Attendance",
        [
          { key: "ConductedDate", label: "Conducted Date", type: "date" },
          { key: "Venue", label: "Venue / Location", type: "text" },
          { key: "DurationHours", label: "Duration (Hours)", type: "text" },
          { type: "row-break" },
          { key: "TraineesScores", label: "Trainees & Scores (One per line: Name — Dept — Score — Pass/Fail/Retrain)", type: "textarea" },
          { key: "TrainingContent", label: "Training Content / Scope", type: "textarea" },  // 🆕
        ],
      ]],
    ],

    // ───── S3 — EVALUATED (stage 2) — QA Head ─────
    evaluation: [
      [[
        "3. Evaluation",
        [
          { key: "EvaluationMethod", label: "Evaluation Method", type: "select", options: ["Written Test", "Oral Q&A", "Practical Demo", "Observation", "None"] },
          { key: "PassCriteria", label: "Pass Criteria", type: "text" },
          { key: "PassCount", label: "Pass Count", type: "text" },
          { key: "FailCount", label: "Fail Count", type: "text" },
          { key: "CertificateNo", label: "Certificate No.", type: "text" },
          { key: "EvaluatedBy", label: "Evaluated By", type: "select", options: P },
          { key: "RetrainingDueDate", label: "Retraining Due Date", type: "date", showIf: (d) => Number(d.FailCount) > 0 },
        ],
      ]],
    ],

    // ───── S4 — PENDING CLOSURE (stage 3) — QA Head ─────
    closure: [
      [[
        "4. Effectiveness & Closure",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { type: "row-break" },
          { key: "Effectiveness", label: "Training Effectiveness Assessment", type: "textarea" },
          { key: "Remarks", label: "Remarks / Retraining Plan", type: "textarea" },
        ],
      ]],
    ],
  };
};

export const trainingSectionConfigs = {
  "1. Training Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "2. Conduct & Attendance": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3",
  "3. Evaluation": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "4. Effectiveness & Closure": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

export const trainingRequiredByStage = {
  "Scheduled": ["TrainingTitle", "TrainingType", "TrainingMode", "Department", "Trainer", "ScheduledDate", "ScheduledBy"],
  "Conducted": ["ConductedDate", "Venue", "DurationHours", "TraineesScores"],
  "Evaluated": ["EvaluationMethod", "PassCriteria", "PassCount", "EvaluatedBy"],
  "Pending Closure": ["Effectiveness", "ClosedBy"],
  "Closed": [],
};

export const getTrainingRequired = (s) =>
  trainingRequiredByStage[s] || trainingRequiredByStage["Scheduled"];

export const trainingTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Training No." },
  { key: "ScheduledDate", label: "Scheduled", render: (r) => (r.ScheduledDate || "").slice(0, 10) },
  { key: "TrainingTitle", label: "Title / Topic" },
  { key: "TrainingType", label: "Type" },
  { key: "Department", label: "Dept." },
  { key: "Trainer", label: "Trainer" },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// ═════════════════════════════════════════════════════ AUDIT ═══════════════

export const auditTabs = ["details", "observations", "report", "response", "closure", "audit"];

export const auditTabStage = {
  details: 0, observations: 1, report: 2, response: 3, closure: 4, audit: 99,
};

export const auditTabLabels = {
  details: "1. Audit Details",
  observations: "2. Observations",
  report: "3. Report",
  response: "4. CAPA Response",
  closure: "5. Closure",
  audit: "6. Audit Trail",
};

export const auditWidthConfig = {
  "Audit Scope / Areas Covered": "col-span-full",
  "Key Findings / Observations": "col-span-full",
  "Closure Remarks": "col-span-full",
  "Auditing Agency / Auditee": "col-span-2",
};

export const getAuditFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const D = (o.department || []).map((g) => g.label);

  return {
    // ───── S1 — PLANNED (stage 0) — QA Head ─────
    details: [
      [[
        "1. Audit Details",
        [
          { key: "RecordNo", label: "Audit No.", type: "text", disabled: true },
          { key: "AuditType", label: "Audit Type", type: "select", options: ["Internal", "External", "Regulatory", "Customer", "Supplier / Vendor", "Self-Inspection"] },
          { key: "Agency", label: "Auditing Agency / Auditee", type: "text" },
          { key: "AreaDepartment", label: "Area / Department Audited", type: "select", options: D },
          { key: "StartDate", label: "Audit Start Date", type: "date" },
          { key: "EndDate", label: "Audit End Date", type: "date" },
          { key: "PlannedBy", label: "Planned By", type: "select", options: P },
          { key: "AuditPlanRef", label: "Audit Plan Ref.", type: "text" },
          { key: "AttachmentRef", label: "Attachment Ref.", type: "text" },
        ],
      ]],
      [[
        "2. Scope & Participants",
        [
          { key: "Auditors", label: "Auditor(s)", type: "text" },
          { key: "AuditeeReps", label: "Auditee Representatives", type: "select", options: P },
          { type: "row-break" },
          { key: "AuditScope", label: "Audit Scope / Areas Covered", type: "textarea" },
        ],
      ]],
    ],

    // ───── S2 — IN PROGRESS (stage 1) — Auditor ─────
    observations: [
      [[
        "3. Observations",
        [
          { key: "CriticalObs", label: "Critical Observations (count)", type: "text" },
          { key: "MajorObs", label: "Major Observations (count)", type: "text" },
          { key: "MinorObs", label: "Minor / Other Observations (count)", type: "text" },
          { type: "row-break" },
          { key: "KeyFindings", label: "Key Findings / Observations", type: "textarea" },
        ],
      ]],
    ],

    // ───── S3 — REPORT ISSUED (stage 2) — QA Head ─────
    report: [
      [[
        "4. Audit Report",
        [
          { key: "AuditReportNo", label: "Audit Report No.", type: "text" },
          { key: "ReportIssueDate", label: "Report Issue Date", type: "date" },
          { key: "ResponseDueDate", label: "Response / CAPA Due Date", type: "date" },
        ],
      ]],
    ],

    // ───── S4 — CAPA RESPONSE (stage 3) — Dept Head ─────
    response: [
      [[
        "5. CAPA Response",
        [
          { key: "ResponseSubmittedDate", label: "CAPA / Response Submitted On", type: "date" },
          { key: "CapaRef", label: "Linked CAPA Ref.(s)", type: "text", disabled: true },
          { key: "ResponseSubmittedBy", label: "Response Submitted By", type: "select", options: P },
        ],
      ]],
    ],

    // ───── S5 — PENDING CLOSURE (stage 4) — QA Head ─────
    closure: [
      [[
        "6. Compliance Closure",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "ComplianceStatus", label: "Final Compliance Status", type: "select", options: ["Compliant", "Non-Compliant", "Partially Compliant", "Pending"] },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { key: "ClosedOn", label: "Closed On", type: "date" },
          { type: "row-break" },
          { key: "ClosureRemarks", label: "Closure Remarks", type: "textarea" },
        ],
      ]],
    ],
  };
};

export const auditSectionConfigs = {
  "1. Audit Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "2. Scope & Participants": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-2",
  "3. Observations": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3",
  "4. Audit Report": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3",
  "5. CAPA Response": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3",
  "6. Compliance Closure": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
};

export const auditRequiredByStage = {
  "Planned": ["AuditType", "Agency", "AreaDepartment", "StartDate", "EndDate", "PlannedBy", "AuditScope", "Auditors", "AuditeeReps"],
  "In Progress": ["CriticalObs", "MajorObs", "MinorObs", "KeyFindings"],
  "Report Issued": ["AuditReportNo", "ReportIssueDate", "ResponseDueDate"],
  "CAPA Response": ["ResponseSubmittedDate", "CapaRef", "ResponseSubmittedBy"],
  "Pending Closure": ["ComplianceStatus", "ClosedBy", "ClosedOn"],
  "Closed": [],
};

export const getAuditRequired = (s) => auditRequiredByStage[s] || auditRequiredByStage["Planned"];

export const auditTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Audit No." },
  { key: "StartDate", label: "Start Date", render: (r) => (r.StartDate || "").slice(0, 10) },
  { key: "AuditType", label: "Audit Type" },
  { key: "Agency", label: "Agency / Auditee" },
  { key: "AreaDepartment", label: "Area / Dept." },
  { key: "ComplianceStatus", label: "Compliance" },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// ══════════════════════════════════════════════ CALIBRATION ════════════════

export const calibrationTabs = ["details", "execution", "review", "audit"];

export const calibrationTabStage = { details: 0, execution: 1, review: 2, audit: 99 };

export const calibrationTabLabels = {
  details: "1. Calibration Details",
  execution: "2. Execution",
  review: "3. Review & Result",
  audit: "4. Audit Trail",
};

export const calibrationWidthConfig = {
  "Impact Assessment (if As-Found Out of Limit)": "col-span-full",
  "Remarks": "col-span-full",
  "Accept. Criteria / Tolerance": "col-span-2",
  "External Agency (if any)": "col-span-2",
};

export const getCalibrationFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const IN = (o.instrument || []).map((g) => g.label);
  const AR = (o.area || []).map((g) => g.label);

  return {
    // ───── S1 — DUE (stage 0) — Engineering Head ─────
    details: [
      [[
        "1. Calibration Details",
        [
          { key: "RecordNo", label: "Calibration No.", type: "text", disabled: true },
          { key: "Instrument", label: "Instrument", type: "select", options: IN },
          { key: "InstrumentCode", label: "Instrument ID / Code", type: "text" },
          { key: "Location", label: "Location", type: "select", options: AR },
          { key: "CalibrationType", label: "Calibration Type", type: "select", options: ["Internal", "External (Agency)"] },
          { key: "Agency", label: "External Agency (if any)", type: "text", showIf: (d) => d.CalibrationType === "External (Agency)" },
          { key: "FrequencyMonths", label: "Calibration Freq. (Months)", type: "select", options: ["1", "3", "6", "12", "24"] },
          { key: "DueDate", label: "Due Date (Planned)", type: "date" },
          { type: "row-break" },
          { key: "AcceptanceCriteria", label: "Accept. Criteria / Tolerance", type: "text" },
        ],
      ]],
    ],

    // ───── S2 — PERFORMED (stage 1) — Engineering Head ─────
    execution: [
      [[
        "2. Execution & Observation",
        [
          { key: "CalibrationDate", label: "Calibration Performed On", type: "date" },
          { key: "CalibratedBy", label: "Calibrated By", type: "select", options: P },
          { key: "AsFound", label: "As-Found Condition", type: "select", options: ["Within Limit", "Out of Limit"] },
          { key: "AsLeft", label: "As-Left Condition", type: "select", options: ["Within Limit", "Out of Limit"] },
          { key: "CertificateNo", label: "Certificate No.", type: "text" },
          { key: "Traceability", label: "Standard Used / NABL Traceability", type: "text" },
          { key: "CertificateAttachment", label: "Certificate Attachment Ref.", type: "text" },
          { type: "row-break" },
          { key: "OutOfCalibrationImpact", label: "Impact Assessment (if As-Found Out of Limit)", type: "textarea", showIf: (d) => d.AsFound === "Out of Limit" },
        ],
      ]],
    ],

    // ───── S3 — UNDER REVIEW (stage 2) — QA Head ─────
    review: [
      [[
        "3. Review & Result",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "ReviewedBy", label: "Reviewed / Approved By", type: "select", options: P },
          { key: "VerifiedOn", label: "Verified On", type: "date" },
          { key: "Result", label: "Result", type: "select", options: ["Pending", "Pass", "Fail", "Conditional"] },
          {
            key: "LastCalibrated", label: "Last Calibrated On", type: "date",
            onChange: (v, cur) => {
              if (!v || !cur.FrequencyMonths) return { ...cur, LastCalibrated: v };
              const d = new Date(v);
              d.setMonth(d.getMonth() + parseInt(cur.FrequencyMonths, 10));
              return { ...cur, LastCalibrated: v, NextDue: d.toISOString().slice(0, 10) };
            },
          },
          { key: "NextDue", label: "Next Due Date", type: "date", disabled: true },
          { key: "DeviationRef", label: "Linked Deviation Ref. (auto)", type: "text", disabled: true, showIf: (d) => d.AsFound === "Out of Limit" },
          { key: "CapaRef", label: "Linked CAPA Ref.", type: "select", disabled: true, options: (o.refOpts?.capa || []).map((x) => x.value), showIf: (d) => d.AsFound === "Out of Limit" },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { type: "row-break" },
          { key: "Remarks", label: "Remarks", type: "textarea" },
        ],
      ]],
    ],
  };
};

export const calibrationSectionConfigs = {
  "1. Calibration Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "2. Execution & Observation": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "3. Review & Result": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
};

export const calibrationRequiredByStage = {
  "Due": ["Instrument", "InstrumentCode", "Location", "CalibrationType", "AcceptanceCriteria", "FrequencyMonths", "DueDate"],
  "Performed": ["CalibrationDate", "AsFound", "AsLeft", "CalibratedBy", "CertificateNo", "Traceability"],
  "Under Review": ["ReviewedBy", "VerifiedOn", "Result", "LastCalibrated", "NextDue", "ClosedBy"],
  "Closed": [],
};

export const getCalibrationRequired = (s) =>
  calibrationRequiredByStage[s] || calibrationRequiredByStage["Due"];

export const calibrationTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "Instrument", label: "Instrument" },
  { key: "InstrumentCode", label: "Code" },
  { key: "Location", label: "Location" },
  { key: "DueDate", label: "Due Date", render: (r) => (r.DueDate || "").slice(0, 10) },
  { key: "NextDue", label: "Next Due", render: (r) => (r.NextDue || "").slice(0, 10) },
  { key: "Result", label: "Result" },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// ═══════════════════════════════ ENVIRONMENTAL MONITORING ══════════════════


export const envTabs = ["monitoring", "review", "closure", "audit"];

export const envTabStage = { monitoring: 0, review: 1, closure: 2, audit: 99 };

export const envTabLabels = {
  monitoring: "1. Monitoring",
  review: "2. Review & Action",
  closure: "3. Closure",
  audit: "4. Audit Trail",
};

export const envWidthConfig = {
  "Action Taken (if limit exceeded)": "col-span-full",
  "Closure Remarks": "col-span-full",
  "Location / Sampling Point": "col-span-2",
  "Limit Status (auto)": "col-span-2",
};

// LimitStatus ka live preview — DB ki computed definition ka same logic
const calcLimitStatus = (result, alertLimit, actionLimit) => {
  const r = parseFloat(result);
  if (isNaN(r)) return "";
  const ac = parseFloat(actionLimit);
  const al = parseFloat(alertLimit);
  if (!isNaN(ac) && r >= ac) return "ACTION LIMIT EXCURSION";
  if (!isNaN(al) && r >= al) return "ALERT LIMIT";
  return "WITHIN LIMITS";
};

const isActionExcursion = (d) =>
  String(d.LimitStatus || "").toUpperCase().includes("ACTION");

export const getEnvFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const AR = (o.area || []).map((g) => g.label);

  return {
    // ───── S1 — RECORDED (stage 0) — QC Head ─────
    monitoring: [
      [[
        "1. Monitoring Details",
        [
          { key: "RecordNo", label: "EM No.", type: "text", disabled: true },
          { key: "MonitoringDate", label: "Monitoring Date", type: "date" },
          { key: "Shift", label: "Shift", type: "select", options: ["A", "B", "C", "General"] },
          { key: "Area", label: "Area", type: "select", options: AR },
          { key: "Location", label: "Location / Sampling Point", type: "text" },
          { key: "Grade", label: "Grade", type: "select", options: ["A", "B", "C", "D", "Unclassified"] },
          { key: "MonitoringType", label: "Monitoring Type", type: "select", options: ["Viable - Air", "Viable - Surface", "Viable - Personnel", "Non-Viable Particle Count", "Temperature", "Humidity", "Differential Pressure"] },
          { key: "SampleId", label: "Sample ID / Plate No.", type: "text" },
          { key: "Analyst", label: "Analyst", type: "select", options: P },
          { key: "IncubationStartDate", label: "Incubation Start", type: "date", showIf: (d) => String(d.MonitoringType || "").startsWith("Viable") },
          { key: "IncubationEndDate", label: "Incubation End", type: "date", showIf: (d) => String(d.MonitoringType || "").startsWith("Viable") },
        ],
      ]],
      [[
        "2. Result & Limits",
        [
          {
            key: "AlertLimit", label: "Alert Limit", type: "text",
            onChange: (v, cur) => ({
              ...cur, AlertLimit: v,
              LimitStatus: calcLimitStatus(cur.Result, v, cur.ActionLimit),
            }),
          },
          {
            key: "ActionLimit", label: "Action Limit", type: "text",
            onChange: (v, cur) => ({
              ...cur, ActionLimit: v,
              LimitStatus: calcLimitStatus(cur.Result, cur.AlertLimit, v),
            }),
          },
          {
            key: "Result", label: "Result", type: "text",
            onChange: (v, cur) => ({
              ...cur, Result: v,
              LimitStatus: calcLimitStatus(v, cur.AlertLimit, cur.ActionLimit),
            }),
          },
          { key: "Unit", label: "Unit", type: "text" },
          { key: "Method", label: "Method", type: "text" },
          { key: "LimitStatus", label: "Limit Status (auto)", type: "text", disabled: true },
        ],
      ]],
    ],

    // ───── S2 — UNDER REVIEW (stage 1) — QC Head ─────
    review: [
      [[
        "3. Review & Action",
        [
          { key: "ReviewedBy", label: "Reviewed By", type: "select", options: P },
          { key: "ReviewedOn", label: "Reviewed On", type: "date" },
          { key: "TrendRef", label: "Trend Report Ref.", type: "text" },
          { key: "DeviationRef", label: "Linked Deviation Ref.", type: "text", disabled: true, showIf: isActionExcursion },
          { type: "row-break" },
          { key: "ActionTaken", label: "Action Taken (if limit exceeded)", type: "textarea" },
        ],
      ]],
    ],

    // ───── S3 — PENDING CLOSURE (stage 2) — QA Head ─────
    closure: [
      [[
        "4. Closure",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "CapaRef", label: "Linked CAPA Ref.", disabled: true, showIf: isActionExcursion },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { key: "ClosedOn", label: "Closed On", type: "date" },
          { type: "row-break" },
          { key: "ClosureRemarks", label: "Closure Remarks", type: "textarea" },
        ],
      ]],
    ],
  };
};

export const envSectionConfigs = {
  "1. Monitoring Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "2. Result & Limits": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "3. Review & Action": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "4. Closure": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
};

export const envRequiredByStage = {
  "Recorded": ["MonitoringDate", "Area", "Location", "Grade", "MonitoringType", "SampleId", "Shift", "Analyst", "Result", "Unit", "AlertLimit", "ActionLimit", "Method"],
  "Under Review": ["ReviewedBy", "ReviewedOn", "ActionTaken"],
  "Pending Closure": ["ClosedBy", "ClosedOn"],
  "Closed": [],
};

export const getEnvRequired = (s) => envRequiredByStage[s] || envRequiredByStage["Recorded"];

export const envTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "EM No." },
  { key: "MonitoringDate", label: "Date", render: (r) => (r.MonitoringDate || "").slice(0, 10) },
  { key: "Area", label: "Area" },
  { key: "Grade", label: "Grade" },
  { key: "MonitoringType", label: "Type" },
  { key: "Result", label: "Result" },
  { key: "LimitStatus", label: "Limit Status" },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// ═════════════════════════════════════════════ QUALIFICATION ═══════════════

export const qualificationTabs = ["details", "protocol", "execution", "report", "closure", "audit"];

export const qualificationTabStage = {
  details: 0, protocol: 1, execution: 2, report: 3, closure: 4, audit: 99,
};

export const qualificationTabLabels = {
  details: "1. Qualification Details",
  protocol: "2. Protocol Approval",
  execution: "3. Execution",
  report: "4. Report & Result",
  closure: "5. Closure",
  audit: "6. Audit Trail",
};

export const qualificationWidthConfig = {
  "Acceptance Criteria": "col-span-full",
  "Tests / Checks Performed": "col-span-full",
  "Observations / Deviations During Execution": "col-span-full",
  "Remarks": "col-span-full",
  "Equipment / System": "col-span-2",
  "Next Requalification Due": "col-span-1"
};

export const getQualificationFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const EQ = (o.equipment || []).map((g) => g.label);

  return {
    // ───── S1 — PLANNED (stage 0) — Engineering Head ─────
    details: [
      [[
        "1. Qualification Details",
        [
          { key: "RecordNo", label: "Qualification No.", type: "text", disabled: true },
          { key: "Equipment", label: "Equipment / System", type: "select", options: EQ },
          { key: "Stage", label: "Qualification Stage", type: "select", options: ["DQ (Design)", "IQ (Installation)", "OQ (Operational)", "PQ (Performance)", "Re-Qualification"] },
          { key: "ProtocolNo", label: "Protocol No.", type: "text" },
          { key: "PlannedDate", label: "Planned Date", type: "date" },
          { key: "PlannedBy", label: "Planned By", type: "select", options: P },
          { key: "VendorName", label: "Vendor (if external)", type: "text" },
          { key: "AttachmentRef", label: "Attachment Ref.", type: "text" },
          { type: "row-break" },
          { key: "AcceptanceCriteria", label: "Acceptance Criteria", type: "textarea" },
        ],
      ]],
    ],

    // ───── S2 — PROTOCOL APPROVED (stage 1) — QA Head ─────
    protocol: [
      [[
        "2. Protocol Approval",
        [
          { key: "ProtocolApprovedBy", label: "Protocol Approved By (QA)", type: "select", options: P },
          { key: "ProtocolApprovalDate", label: "Protocol Approval Date", type: "date" },
        ],
      ]],
    ],

    // ───── S3 — EXECUTED (stage 2) — Engineering Head ─────
    execution: [
      [[
        "3. Execution",
        [
          { key: "ExecutedDate", label: "Executed Date", type: "date" },
          { key: "WitnessedBy", label: "Witnessed By (QA)", type: "select", options: P },
          { key: "DeviationRef", label: "Linked Deviation Ref.", type: "text", disabled: true, showIf: (d) => d.Result === "Fail" },
          { type: "row-break" },
          { key: "TestsPerformed", label: "Tests / Checks Performed", type: "textarea" },
          { key: "Observations", label: "Observations / Deviations During Execution", type: "textarea" },
        ],
      ]],
    ],

    // ───── S4 — REPORT APPROVED (stage 3) — QA Head ─────
    report: [
      [[
        "4. Report & Result",
        [
          { key: "ReportNo", label: "Report No.", type: "text" },
          { key: "ReportDate", label: "Report Date", type: "date" },
          { key: "Result", label: "Result", type: "select", options: ["Pending", "Pass", "Fail"] },
          { key: "PreparedBy", label: "Executed / Prepared By", type: "select", options: P },
          { key: "ApprovedBy", label: "Approved By (QA)", type: "select", options: P },
          { key: "ApprovalDate", label: "Approval Date", type: "date" },
          { key: "CapaRef", label: "Linked CAPA Ref.", type: "select", options: (o.refOpts?.capa || []).map(x => x.value), showIf: (d) => d.Result === "Fail" },
        ],
      ]],
    ],

    // ───── S5 — PENDING CLOSURE (stage 4) — QA Head ─────
    closure: [
      [[
        "5. Closure",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "NextRequalDue", label: "Next Requalification Due", type: "date" },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { type: "row-break" },
          { key: "Remarks", label: "Remarks", type: "textarea" },
        ],
      ]],
    ],
  };
};

export const qualificationSectionConfigs = {
  "1. Qualification Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "2. Protocol Approval": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "3. Execution": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3",
  "4. Report & Result": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "5. Closure": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
};

export const qualificationRequiredByStage = {
  "Planned": ["Equipment", "Stage", "ProtocolNo", "PlannedDate", "AcceptanceCriteria", "PlannedBy"],
  "Protocol Approved": ["ProtocolApprovedBy", "ProtocolApprovalDate"],
  "Executed": ["ExecutedDate", "TestsPerformed", "Observations", "WitnessedBy"],
  "Report Approved": ["ReportNo", "ReportDate", "Result", "PreparedBy", "ApprovedBy", "ApprovalDate"],
  "Pending Closure": ["NextRequalDue", "ClosedBy"],
  "Closed": [],
};

export const getQualificationRequired = (s) =>
  qualificationRequiredByStage[s] || qualificationRequiredByStage["Planned"];

export const qualificationTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "Equipment", label: "Equipment" },
  { key: "Stage", label: "Stage" },
  { key: "PlannedDate", label: "Planned Date", render: (r) => (r.PlannedDate || "").slice(0, 10) },
  { key: "Result", label: "Result" },
  { key: "NextRequalDue", label: "Next Requal.", render: (r) => (r.NextRequalDue || "").slice(0, 10) },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// ══════════════════════════════════ PREVENTIVE MAINTENANCE ═════════════════

export const pmTabs = ["details", "execution", "review", "audit"];

export const pmTabStage = { details: 0, execution: 1, review: 2, audit: 99 };

export const pmTabLabels = {
  details: "1. PM Details",
  execution: "2. Execution",
  review: "3. Review & Sign-off",
  audit: "4. Audit Trail",
};

export const pmWidthConfig = {
  "PM Checklist / Activities Performed": "col-span-full",
  "Breakdown Cause": "col-span-full",
  "Remarks": "col-span-full",
  "Spares / Parts Replaced": "col-span-2",
  "Requalification Triggered?": "col-span-1",
  "Linked Qualification Ref.": "col-span-1"
};

export const getPmFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const EQ = (o.equipment || []).map((g) => g.label);
  const AR = (o.area || []).map((g) => g.label);

  return {
    // ───── S1 — DUE (stage 0) — Engineering Head ─────
    details: [
      [[
        "1. PM Details",
        [
          { key: "RecordNo", label: "PM No.", type: "text", disabled: true },
          { key: "EquipmentName", label: "Equipment / System", type: "select", options: EQ },
          { key: "EquipmentId", label: "Equipment ID", type: "text" },
          { key: "Location", label: "Location", type: "select", options: AR },
          { key: "PmType", label: "PM Type", type: "select", options: ["Mechanical", "Electrical", "Utility", "Instrument", "Facility", "Equipment"] },
          { key: "MaintenanceType", label: "Maintenance Category", type: "select", options: ["Preventive", "Predictive", "Breakdown"] },
          { key: "FrequencyMonths", label: "PM Frequency (Months)", type: "select", options: ["1", "3", "6", "12"] },
          { key: "DueDate", label: "Due Date (Planned)", type: "date" },
          { key: "WorkOrderNo", label: "Work Order No.", type: "text" },
          { key: "AttachmentRef", label: "Attachment Ref.", type: "text" },
        ],
      ]],
    ],

    // ───── S2 — PERFORMED (stage 1) — Engineering Head ─────
    execution: [
      [[
        "2. Execution",
        [
          { key: "PmDate", label: "PM Performed On", type: "date" },
          { key: "PerformedBy", label: "Performed By", type: "select", options: P },
          { key: "Downtime", label: "Downtime (Hours)", type: "text" },
          { key: "SparesUsed", label: "Spares / Parts Replaced", type: "text" },
          { key: "BreakdownDate", label: "Breakdown Date", type: "date", showIf: (d) => d.MaintenanceType === "Breakdown" },
          { type: "row-break" },
          { key: "BreakdownCause", label: "Breakdown Cause", type: "textarea", showIf: (d) => d.MaintenanceType === "Breakdown" },
          { key: "Checklist", label: "PM Checklist / Activities Performed", type: "textarea" },
        ],
      ]],
    ],

    // ───── S3 — UNDER REVIEW (stage 2) — QA Head ─────
    review: [
      [[
        "3. Review & Sign-off",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "LastResult", label: "PM Outcome", type: "select", options: ["Satisfactory", "Observations Noted", "Unsatisfactory", "Partial"] },
          { key: "RequalificationTriggered", label: "Requalification Triggered?", type: "select", options: ["Yes", "No"] },
          { key: "QualificationRef", label: "Linked Qualification Ref.", type: "text", disabled: true, showIf: (d) => d.RequalificationTriggered === "Yes" },
          { key: "VerifiedBy", label: "Verified By", type: "select", options: P },
          { key: "VerifiedOn", label: "Verified On", type: "date" },
          {
            key: "LastPM", label: "Last PM Done On", type: "date",
            onChange: (v, cur) => {
              if (!v || !cur.FrequencyMonths) return { ...cur, LastPM: v };
              const d = new Date(v);
              d.setMonth(d.getMonth() + parseInt(cur.FrequencyMonths, 10));
              return { ...cur, LastPM: v, NextDue: d.toISOString().slice(0, 10) };
            },
          },
          { key: "DeviationRef", label: "Linked Deviation Ref.", type: "text", disabled: true, showIf: (d) => d.LastResult === "Unsatisfactory" },
          { key: "CapaRef", label: "Linked CAPA Ref.", type: "select", options: (o.refOpts?.capa || []).map(x => x.value), showIf: (d) => d.LastResult === "Unsatisfactory" },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { type: "row-break" },
          { key: "Remarks", label: "Remarks", type: "textarea" },
        ],
      ]],
    ],
  };
};

export const pmSectionConfigs = {
  "1. PM Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "2. Execution": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "3. Review & Sign-off": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
};

export const pmRequiredByStage = {
  "Due": ["EquipmentName", "EquipmentId", "Location", "PmType", "MaintenanceType", "FrequencyMonths", "DueDate", "WorkOrderNo"],
  "Performed": ["PmDate", "Checklist", "PerformedBy"],
  "Under Review": ["LastResult", "RequalificationTriggered", "VerifiedBy", "VerifiedOn", "LastPM", "NextDue", "ClosedBy"],
  "Closed": [],
};

export const getPmRequired = (s) => pmRequiredByStage[s] || pmRequiredByStage["Due"];

export const pmTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "PM No." },
  { key: "EquipmentName", label: "Equipment" },
  { key: "EquipmentId", label: "Equip. ID" },
  { key: "MaintenanceType", label: "Category" },
  { key: "DueDate", label: "Due Date", render: (r) => (r.DueDate || "").slice(0, 10) },
  { key: "NextDue", label: "Next Due", render: (r) => (r.NextDue || "").slice(0, 10) },
  { key: "LastResult", label: "Result" },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];


// ══════════════════════════════════════════ MARKET COMPLAINT ═══════════════

export const complaintTabs = ["received", "investigation", "rootcause", "response", "closure", "audit"];

export const complaintTabStage = {
  received: 0, investigation: 1, rootcause: 2, response: 3, closure: 4, audit: 99,
};

export const complaintTabLabels = {
  received: "1. Complaint Details",
  investigation: "2. Investigation",
  rootcause: "3. Root Cause",
  response: "4. Response",
  closure: "5. Closure",
  audit: "6. Audit Trail",
};

export const complaintWidthConfig = {
  "Complaint Description": "col-span-full",
  "Complaint Related To": "col-span-full",
  "Specify Other": "col-span-full",
  "Sample Description": "col-span-full",
  "Sample Follow-up Details": "col-span-full",
  // "Departments Involved": "col-span-full",
  // "Investigation Methodology": "col-span-full",
  "Complaint Sample Analysis Result": "col-span-full",
  "Control / Retention Sample Review": "col-span-full",
  "Investigation Summary (Batch Records, QC Data, Similar Batches)": "col-span-full",
  "Root Cause": "col-span-full",
  "Impact on Other Batches": "col-span-full",
  "Impact Assessment Justification": "col-span-full",
  "Review & Approval": "col-span-full",
  "Investigation Report Summary": "col-span-full",
  "CAPA Review by Plant Head": "col-span-full",
  "CAPA Implementation": "col-span-full",
  "Corrective Action / Reply Summary": "col-span-full",
  "Response / Query Received within 30 Days": "col-span-full",
  "Effectiveness Check": "col-span-full",
  "Closure Remarks": "col-span-full",
  "Complainant Name": "col-span-2",
};

const COMPLAINT_RELATED_TO = ["Ineffectiveness of product", "Less content", "Empty container",
  "Smell / Odour", "Bulging of container", "Fake / Spurious product", "Foreign matter",
  "Adverse reactions", "Chemically defective", "Discolouration", "Damaged capsule / tablet",
  "Shortage in carton", "Swollen tablet", "Broken tablet", "Product mix-up",
  "Different label", "Over printing", "Other"];

const DEPARTMENTS_INVOLVED = ["Quality Assurance", "Quality Control", "Manufacturing",
  "Packing", "Warehouse", "Engineering", "Purchase", "Other / External"];

const INVESTIGATION_METHODOLOGY = ["Review of Batch Manufacturing Records",
  "Review of Batch Packing Records", "Review of Incident / Deviation / OOS",
  "Control sample examination", "Complaint sample examination",
  "Review of pre- and post-batches", "Blend uniformity data review",
  "Finished goods data review", "Reanalysis of control sample",
  "Reanalysis of complaint sample", "Reanalysis of retained batch",
  "Stability data review", "Trend data review", "Equipment / area logbook review",
  "Training records review", "Investigation extended to other batches"];

const COMPLAINT_DEPT_ROWS = [
  { Department: "Quality Assurance", RoleTitle: "QA Head" },
  { Department: "Manufacturing", RoleTitle: "Production Head" },
  { Department: "Quality Control", RoleTitle: "QC Head" },
  { Department: "Warehouse", RoleTitle: "Warehouse Head" },
  { Department: "Other Department", exemptFromLock: true },
  { Department: "Party / Complainant", exemptFromLock: true },
];

export const getComplaintFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const PR = (o.product || []).map((g) => g.label);

  return {
    // ═══════ S1 — RECEIVED (stage 0) ═══════
    received: [
      [[
        "1. Complaint Details",
        [
          { key: "RecordNo", label: "Complaint No.", type: "text", disabled: true },
          { key: "ReceivedDate", label: "Date Received", type: "date" },
          {
            key: "ModeOfReceipt", label: "Mode of Receipt", type: "select",
            options: ["Email", "Letter", "Phone Call", "In Person", "Field Staff", "Portal"]
          },
          {
            key: "Source", label: "Complaint Source", type: "select",
            options: ["Distributor / Stockist", "Chemist / Retailer", "Hospital / Institution",
              "Patient / Consumer", "Doctor / HCP", "Regulatory Authority", "Field Staff", "Other"]
          },
          { key: "ComplainantName", label: "Complainant Name", type: "text" },
          { key: "ComplainantContact", label: "Complainant Contact", type: "text" },
          { key: "PartyName", label: "Party / Firm Name", type: "text" },
          { key: "ComplaintReportedBy", label: "Complaint Reported By", type: "text" },
          { key: "ComplaintForwardedBy", label: "Complaint Forwarded By", type: "text" },
          {
            key: "ComplaintType", label: "Complaint Type", type: "select",
            options: ["Quality Complaint", "Adverse Event"]
          },
          {
            key: "Category", label: "Complaint Category", type: "select",
            options: ["Product Quality", "Physical Defect", "Packing / Labelling",
              "Contamination", "Efficacy", "Shortage / Count", "Other"]
          },
          {
            key: "Severity", label: "Severity / Criticality", type: "select",
            options: ["Critical", "Major", "Minor", "Non Substantiated"]
          },
        ],
      ]],
      [[
        "2. Product & Batch Details",
        [
          { key: "Product", label: "Product", type: "select", options: PR },
          { key: "BatchNo", label: "Batch No.", type: "text" },
          { key: "BatchSize", label: "Batch Size", type: "text" },
          { key: "MfgDate", label: "Batch Mfg. Date", type: "date" },
          { key: "ExpDate", label: "Batch Expiry Date", type: "date" },
          { key: "QtyComplained", label: "Quantity Complained", type: "text" },
          { key: "PackStyle", label: "Pack Style", type: "text" },
          {
            key: "TypeOfPacking", label: "Type of Packing", type: "select",
            options: ["Blister", "Strip", "Bottle", "Vial", "Ampoule", "Carton", "Jar", "Other"]
          },
          { type: "row-break" },
          { key: "Description", label: "Complaint Description", type: "textarea" },
        ],
      ]],
      [[
        "3. Nature of Complaint",
        [
          {
            key: "ComplaintRelatedTo", label: "Complaint Related To", type: "multiselect",
            options: COMPLAINT_RELATED_TO
          },
          {
            key: "ComplaintRelatedToOther", label: "Specify Other", type: "text",
            showIf: (d) => String(d.ComplaintRelatedTo || "").includes("Other")
          },
        ],
      ]],
      [[
        "4. Sample & Acknowledgement",
        [
          {
            key: "SampleReceived", label: "Complaint Sample Received", type: "select",
            options: ["Yes", "No", "Awaited"]
          },
          {
            key: "SampleReceiptDate", label: "Sample Receipt Date", type: "date",
            showIf: (d) => d.SampleReceived === "Yes"
          },
          {
            key: "SampleCondition", label: "Sample Condition on Receipt", type: "text",
            showIf: (d) => d.SampleReceived === "Yes"
          },
          {
            key: "SampleGenuine", label: "Sample Found Genuine?", type: "select",
            options: ["Yes", "No", "Under Evaluation"], showIf: (d) => d.SampleReceived === "Yes"
          },
          {
            key: "SampleStorageCondition", label: "Sample Storage Condition", type: "text",
            showIf: (d) => d.SampleReceived === "Yes"
          },
          { key: "AcknowledgementDate", label: "Acknowledgement Sent On", type: "date" },
          { key: "AcknowledgedBy", label: "Acknowledged By", type: "select", options: P },
          { key: "TargetDate", label: "Target Closure Date", type: "date" },
          { type: "row-break" },
          {
            key: "SampleDescription", label: "Sample Description", type: "textarea",
            showIf: (d) => d.SampleReceived === "Yes"
          },
          {
            key: "SampleFollowUp", label: "Sample Follow-up Details", type: "textarea",
            showIf: (d) => d.SampleReceived !== "Yes"
          },
        ],
      ]],
      [[
        "5. History of Complaint",
        [
          {
            key: "history", type: "childgrid", label: "Complaint History (Last 1 Year)", fixedRows: true,
            defaultRows: [
              { Scenario: "Same product, same batch" },
              { Scenario: "Same product, different batch" },
              { Scenario: "Different product" },
            ],
            footer: "Record any similar complaint received in the previous one year.",
            columns: [
              { key: "Scenario", label: "Scenario", type: "text", disabled: true, width: "26%" },
              { key: "Received", label: "Received?", type: "select", options: ["Yes", "No"], width: "11%" },
              { key: "Year", label: "Year", type: "text", width: "10%" },
              { key: "Count", label: "Count", type: "text", width: "9%" },
              { key: "Details", label: "Details", type: "textarea" },
            ]
          },
          { key: "SimilarComplaints", label: "Similar Complaints Found", type: "textarea" },
        ],
      ]],
    ],

    // ═══════ S2 — UNDER INVESTIGATION (stage 1) ═══════
    investigation: [
      [[
        "6. Investigation Scope",
        [
          { key: "InvestigatedBy", label: "Investigated By", type: "select", options: P },
          { key: "InvestigationDate", label: "Investigation Start Date", type: "date" },
          // { type: "row-break" },
          {
            key: "DepartmentsInvolved", label: "Departments Involved", type: "multiselect",
            options: DEPARTMENTS_INVOLVED
          },
          {
            key: "InvestigationMethodology", label: "Investigation Methodology", type: "multiselect",
            options: INVESTIGATION_METHODOLOGY
          },
        ],
      ]],
      [[
        "7. Investigation Findings",
        [
          { key: "SampleAnalysis", label: "Complaint Sample Analysis Result", type: "textarea" },
          { key: "ControlSampleReview", label: "Control / Retention Sample Review", type: "textarea" },
          { key: "InvestigationSummary", label: "Investigation Summary (Batch Records, QC Data, Similar Batches)", type: "textarea" },
        ],
      ]],
      [[
        "8. Department Comments",
        [
          {
            key: "deptreview", type: "childgrid", label: "Comments by Department", fixedRows: true,
            rowLockField: "RoleTitle",                        // 🆕
            rowLockColumns: ["Comments", "SignBy"],            // 🆕
            defaultRows: COMPLAINT_DEPT_ROWS,
            footer: "Each department records its finding and signs.",
            columns: [
              { key: "Department", label: "Department", type: "text", disabled: true, width: "17%" },
              { key: "Comments", label: "Comments", type: "textarea" },
              { key: "SignBy", label: "Name / Signature", type: "text", autoSign: true, dateKey: "SignOn", width: "17%" },  // 🔧 select→text+autoSign
              { key: "SignOn", label: "Date", type: "date", disabled: true, width: "13%" },                                  // 🔧 disabled add kiya
            ]
          },
        ],
      ]],
    ],

    // ═══════ S3 — ROOT CAUSE (stage 2) ═══════
    rootcause: [
      [[
        "9. Root Cause & Impact",
        [
          {
            key: "ComplaintConfirmed", label: "Complaint Confirmed / Justified?", type: "select",
            options: ["Genuine", "Not Genuine", "Inconclusive"]
          },
          {
            key: "RootCauseCategory", label: "Root Cause Category", type: "select",
            options: ["Manufacturing", "Packing / Labelling", "Storage",
              "Transport / Distribution", "Customer Handling", "Not Attributable"]
          },
          { key: "ReviewedBy", label: "Reviewed By (QA Head)", type: "select", options: P },
          { key: "RecallRequired", label: "Recall Required?", type: "select", options: ["Yes", "No"] },
          {
            key: "AdverseEventReportable", label: "Adverse Event / Reportable to Authority?", type: "select",
            options: ["Yes", "No", "Not Applicable"]
          },
          { type: "row-break" },
          { key: "RootCause", label: "Root Cause", type: "textarea" },
          { key: "ImpactOnOtherBatches", label: "Impact on Other Batches", type: "textarea" },
          { key: "ImpactAssessmentJustification", label: "Impact Assessment Justification", type: "textarea" },
          {
            key: "ImpactSigns", type: "signblock", label: "Impact Assessment Approved By",
            signs: [{ key: "ImpactSignQa", label: "Head — Quality Assurance", options: P }]
          },
        ],
      ]],
      [[
        "10. Review & Approval",
        [
          { key: "ReviewApproval", label: "Review & Approval", type: "textarea" },
          {
            key: "ReviewSigns", type: "signblock", label: "Reviewed & Approved By",
            signs: [{ key: "ReviewSignQa", label: "Head — Quality Assurance", options: P }]
          },
        ],
      ]],
      [[
        "11. Recall Batches",
        [
          {
            key: "recallbatches", type: "childgrid", label: "Batches Under Recall",
            showIf: (d) => d.RecallRequired === "Yes",
            footer: "List every batch covered by the recall.",
            columns: [
              { key: "Product", label: "Product", type: "select", options: PR, width: "32%" },
              { key: "BatchNo", label: "Batch No.", type: "text", width: "22%" },
              { key: "MfgDate", label: "Mfg. Date", type: "date", width: "18%" },
              { key: "ExpDate", label: "Exp. Date", type: "date", width: "18%" },
            ]
          },
        ],
      ]],
      [[
        "12. Linked Records",
        [
          { key: "DeviationRef", label: "Linked Deviation Ref. (auto)", type: "text", disabled: true },
          { key: "CapaRef", label: "Linked CAPA Ref. (auto)", type: "text", disabled: true },
          {
            key: "RecallRef", label: "Linked Recall Ref. (auto)", type: "text", disabled: true,
            showIf: (d) => d.RecallRequired === "Yes"
          },
        ],
      ]],
    ],

    // ═══════ S4 — RESPONSE SENT (stage 3) ═══════
    response: [
      [[
        "13. Investigation Report & CAPA",
        [
          { key: "CapaTcd", label: "CAPA Target Completion Date", type: "date" },
          { type: "row-break" },
          { key: "InvestigationReportSummary", label: "Investigation Report Summary", type: "textarea" },
          { key: "CapaReviewByPlantHead", label: "CAPA Review by Plant Head", type: "textarea" },
          {
            key: "PlantHeadSigns", type: "signblock", label: "Reviewed By",
            signs: [{ key: "PlantHeadSign", label: "Plant Head", options: P }]
          },
          { key: "CapaImplementation", label: "CAPA Implementation", type: "textarea" },
          {
            key: "CapaImplSigns", type: "signblock", label: "Implementation Verified By",
            signs: [
              { key: "CapaImplProdHead", label: "Head — Production", options: P },
              { key: "CapaImplQaHead", label: "Head — Quality Assurance", options: P },
            ]
          },
        ],
      ]],
      [[
        "14. Extension for CAPA",
        [
          {
            key: "extensions", type: "childgrid", label: "Extension Required",
            columns: [
              { key: "Justification", label: "Justification", type: "textarea" },
              { key: "Period", label: "Extension Period", type: "text", width: "13%" },
              { key: "RevisedDate", label: "Revised Target", type: "date", width: "13%" },
              { key: "DeptSignBy", label: "Dept Head", type: "select", options: P, width: "15%" },
              { key: "QaSignBy", label: "QA Head", type: "select", options: P, width: "15%" },
            ]
          },
        ],
      ]],
      [[
        "15. Customer Response",
        [
          { key: "ResponseDate", label: "Response Sent On", type: "date" },
          {
            key: "ResponseMode", label: "Response Mode", type: "select",
            options: ["Email", "Letter", "Phone Call", "In Person"]
          },
          { key: "RespondedBy", label: "Responded By", type: "select", options: P },
          {
            key: "ReplacementIssued", label: "Replacement Issued?", type: "select",
            options: ["Yes", "No", "Not Applicable"]
          },
          {
            key: "CreditNoteNo", label: "Credit Note No.", type: "text",
            showIf: (d) => d.ReplacementIssued === "Yes"
          },
          { type: "row-break" },
          { key: "CorrectiveAction", label: "Corrective Action / Reply Summary", type: "textarea" },
        ],
      ]],
    ],

    // ═══════ S5 — PENDING CLOSURE (stage 4) ═══════
    closure: [
      [[
        "16. Effectiveness & Closure",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { type: "row-break" },
          { key: "Response30Days", label: "Response / Query Received within 30 Days", type: "textarea" },
          { key: "EffectivenessCheck", label: "Effectiveness Check", type: "textarea" },
          { key: "ClosureRemarks", label: "Closure Remarks", type: "textarea" },
        ],
      ]],
    ],
  };
};


export const complaintSectionConfigs = {
  "1. Complaint Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "2. Product & Batch Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "3. Nature of Complaint": "grid-cols-1",
  "4. Sample & Acknowledgement": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "5. History of Complaint": "grid-cols-1",
  "6. Investigation Scope": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "7. Investigation Findings": "grid-cols-1",
  "8. Department Comments": "grid-cols-1",
  "9. Root Cause & Impact": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "10. Review & Approval": "grid-cols-1",
  "11. Recall Batches": "grid-cols-1",
  "12. Linked Records": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "13. Investigation Report & CAPA": "grid-cols-1 sm:grid-cols-2",
  "14. Extension for CAPA": "grid-cols-1",
  "15. Customer Response": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "16. Effectiveness & Closure": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

export const complaintRequiredByStage = {
  "Received": ["ReceivedDate", "Source", "ModeOfReceipt", "ComplainantName", "Product", "BatchNo",
    "ComplaintType", "Category", "Severity", "ComplaintRelatedTo", "Description",
    "SampleReceived", "AcknowledgementDate", "AcknowledgedBy"],
  "Under Investigation": ["InvestigatedBy", "InvestigationDate", "DepartmentsInvolved",
    "InvestigationMethodology", "SampleAnalysis", "ControlSampleReview", "InvestigationSummary"],
  "Root Cause Identified": ["ComplaintConfirmed", "RootCauseCategory", "RootCause", "ReviewedBy",
    "ImpactAssessmentJustification"],
  "Response Sent": ["InvestigationReportSummary", "ResponseDate", "ResponseMode", "RespondedBy", "CorrectiveAction"],
  "Pending Closure": ["EffectivenessCheck", "ClosedBy"],
  "Closed": [],
};

export const getComplaintRequired = (s) =>
  complaintRequiredByStage[s] || complaintRequiredByStage["Received"];

export const complaintTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Complaint No." },
  { key: "ReceivedDate", label: "Received", render: (r) => (r.ReceivedDate || "").slice(0, 10) },
  { key: "Source", label: "Source" },
  { key: "Product", label: "Product" },
  { key: "BatchNo", label: "Batch No." },
  { key: "Category", label: "Category" },
  { key: "Severity", label: "Severity" },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// ══════════════════════════════════════════ RISK ASSESSMENT ════════════════
// Score = Severity × Probability  |  ≤6 LOW · ≤12 MEDIUM · >12 HIGH
// DB me computed column hai; yahan sirf live preview hai.

export const riskTabs = ["identify", "assess", "mitigation", "implementation", "residual", "closure", "audit"];

export const riskTabStage = {
  identify: 0, assess: 1, mitigation: 2, implementation: 3,
  residual: 4, closure: 5, audit: 99,
};

export const riskTabLabels = {
  identify: "1. Identification",
  assess: "2. Risk Assessment",
  mitigation: "3. Mitigation Plan",
  implementation: "4. Implementation",
  residual: "5. Residual Review",
  closure: "6. Acceptance",
  audit: "7. Audit Trail",
};

export const riskWidthConfig = {
  "Risk Title": "col-span-2",
  "Hazard / Failure Mode Description": "col-span-full",
  "Potential Effect / Consequence": "col-span-full",
  "Existing Controls": "col-span-full",
  "Mitigation / Risk Control Plan": "col-span-full",
  "Progress Remarks": "col-span-full",
  "Closure Remarks": "col-span-full",
};

// ── score helper — DB ki computed definition ka same logic ──
const calcLevel = (s, p) => {
  const a = parseInt(s, 10), b = parseInt(p, 10);
  if (isNaN(a) || isNaN(b)) return { score: "", level: "" };
  const score = a * b;
  return { score, level: score <= 6 ? "LOW" : score <= 12 ? "MEDIUM" : "HIGH" };
};

const SEVERITY_OPTS = ["1", "2", "3", "4", "5"];
const PROB_OPTS = ["1", "2", "3", "4", "5"];

export const getRiskFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const D = (o.department || []).map((g) => g.label);
  const AR = (o.area || []).map((g) => g.label);

  return {
    // ───── S1 — IDENTIFIED (stage 0) — Dept Head ─────
    identify: [
      [[
        "1. Risk Identification",
        [
          { key: "RecordNo", label: "Risk Assessment No.", type: "text", disabled: true },
          { key: "IdentifiedDate", label: "Identified On", type: "date" },
          { key: "Title", label: "Risk Title", type: "text" },
          { key: "ProcessArea", label: "Process / Area", type: "select", options: AR },
          { key: "Department", label: "Department", type: "select", options: D },
          { key: "RiskCategory", label: "Risk Category", type: "select", options: ["Product Quality", "Patient Safety", "Cross-Contamination", "Data Integrity", "Equipment / Facility", "Process", "Supply Chain", "Regulatory", "Other"] },
          { key: "IdentifiedBy", label: "Identified By", type: "select", options: P },
          { type: "row-break" },
          { key: "Hazard", label: "Hazard / Failure Mode Description", type: "textarea" },
        ],
      ]],
      [[
        "2. Trigger & Reference",
        [
          { key: "RmTool", label: "Risk Management Tool", type: "select", options: ["FMEA", "FMECA", "HACCP", "FTA (Fault Tree)", "HAZOP", "PHA", "Risk Ranking & Filtering"] },
          {
            key: "TriggerRef", label: "Trigger / Linked Ref.", type: "select",
            options: [...(o.refOpts?.changecontrol || []), ...(o.refOpts?.deviation || []), ...(o.refOpts?.complaint || [])].map((x) => x.value)
          },
          {
            key: "ChangeControlRef", label: "Change Control Ref.", type: "select",
            options: (o.refOpts?.changecontrol || []).map((x) => x.value)
          },
          { key: "PreviousCycleRef", label: "Previous Cycle Ref. (auto)", type: "text", disabled: true, showIf: (d) => !!d.PreviousCycleRef },
        ],
      ]],
    ],

    // ───── S2 — ASSESSED (stage 1) — QA Head ─────
    assess: [
      [[
        "3. Initial Risk Assessment",
        [
          {
            key: "Severity", label: "Severity (1-5)", type: "select", options: SEVERITY_OPTS,
            onChange: (v, cur) => {
              const { score, level } = calcLevel(v, cur.Probability);
              return { ...cur, Severity: v, RiskScore: score, RiskLevel: level };
            },
          },
          {
            key: "Probability", label: "Probability (1-5)", type: "select", options: PROB_OPTS,
            onChange: (v, cur) => {
              const { score, level } = calcLevel(cur.Severity, v);
              return { ...cur, Probability: v, RiskScore: score, RiskLevel: level };
            },
          },
          { key: "Detectability", label: "Detectability (1=Easy … 5=Hard)", type: "select", options: SEVERITY_OPTS },
          { key: "RiskScore", label: "Risk Score (S × P)", type: "text", disabled: true },
          { key: "RiskLevel", label: "Risk Level", type: "text", disabled: true },
          { key: "AssessedBy", label: "Assessed By (QA)", type: "select", options: P },
          { key: "AssessmentDate", label: "Assessment Date", type: "date" },
          { type: "row-break" },
          { key: "PotentialEffect", label: "Potential Effect / Consequence", type: "textarea" },
          { key: "ExistingControls", label: "Existing Controls", type: "textarea" },
        ],
      ]],
    ],

    // ───── S3 — MITIGATION PLANNED (stage 2) — Dept Head ─────
    mitigation: [
      [[
        "4. Mitigation Plan",
        [
          { key: "MitigationOwner", label: "Mitigation Owner", type: "select", options: P },
          { key: "TargetDate", label: "Target Completion Date", type: "date" },
          { key: "CapaRef", label: "Linked CAPA Ref. (auto)", type: "text", disabled: true },
          { type: "row-break" },
          { key: "Mitigation", label: "Mitigation / Risk Control Plan", type: "textarea" },
        ],
      ]],
    ],

    // ───── S4 — MITIGATION IN PROGRESS (stage 3) — Dept Head ─────
    implementation: [
      [[
        "5. Implementation",
        [
          { key: "CompletedDate", label: "Mitigation Completed On", type: "date" },
          { type: "row-break" },
          { key: "ProgressRemarks", label: "Progress Remarks", type: "textarea" },
        ],
      ]],
    ],

    // ───── S5 — RESIDUAL REVIEWED (stage 4) — QA Head ─────
    residual: [
      [[
        "6. Residual Risk Review",
        [
          {
            key: "ResidualSeverity", label: "Residual Severity (1-5)", type: "select", options: SEVERITY_OPTS,
            onChange: (v, cur) => {
              const { score, level } = calcLevel(v, cur.ResidualProbability);
              return { ...cur, ResidualSeverity: v, ResidualScore: score, ResidualLevel: level };
            },
          },
          {
            key: "ResidualProbability", label: "Residual Probability (1-5)", type: "select", options: PROB_OPTS,
            onChange: (v, cur) => {
              const { score, level } = calcLevel(cur.ResidualSeverity, v);
              return { ...cur, ResidualProbability: v, ResidualScore: score, ResidualLevel: level };
            },
          },
          { key: "ResidualScore", label: "Residual Score", type: "text", disabled: true },
          { key: "ResidualLevel", label: "Residual Level", type: "text", disabled: true },
          { key: "ResidualReviewedBy", label: "Reviewed By (QA)", type: "select", options: P },
          { key: "ResidualReviewDate", label: "Review Date", type: "date" },
        ],
      ]],
    ],

    // ───── S6 — PENDING ACCEPTANCE (stage 5) — QA Head ─────
    closure: [
      [[
        "7. Acceptance & Closure",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "RiskAcceptance", label: "Risk Acceptance Decision", type: "select", options: ["Accepted", "Accepted with Controls", "Not Accepted — Further Mitigation"] },
          { key: "Owner", label: "Risk Owner", type: "select", options: P },
          { key: "ApprovedBy", label: "Approved By (QA Head)", type: "select", options: P },
          { key: "AcceptanceDate", label: "Acceptance Date", type: "date" },
          { key: "ReviewDate", label: "Next Review Date", type: "date" },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          {
            key: "NextCycleRef", label: "Next Cycle Ref. (auto)", type: "text", disabled: true,
            showIf: (d) => d.RiskAcceptance === "Not Accepted — Further Mitigation"
          },
          { type: "row-break" },
          { key: "ClosureRemarks", label: "Closure Remarks", type: "textarea" },
        ],
      ]],
    ],
  };
};

export const riskSectionConfigs = {
  "1. Risk Identification": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "2. Trigger & Reference": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3",
  "3. Initial Risk Assessment": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "4. Mitigation Plan": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3",
  "5. Implementation": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "6. Residual Risk Review": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "7. Acceptance & Closure": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
};

export const riskRequiredByStage = {
  "Identified": ["IdentifiedDate", "Title", "ProcessArea", "Department", "RiskCategory", "IdentifiedBy", "Hazard", "RmTool"],
  "Assessed": ["Severity", "Probability", "PotentialEffect", "AssessedBy", "AssessmentDate"],
  "Mitigation Planned": ["Mitigation", "MitigationOwner", "TargetDate"],
  "Mitigation In Progress": ["ProgressRemarks", "CompletedDate"],
  "Residual Reviewed": ["ResidualSeverity", "ResidualProbability", "ResidualReviewedBy", "ResidualReviewDate"],
  "Pending Acceptance": ["RiskAcceptance", "Owner", "ReviewDate", "ClosedBy"],
  "Closed": [],
};

export const getRiskRequired = (s) => riskRequiredByStage[s] || riskRequiredByStage["Identified"];

export const riskTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "RA No." },
  { key: "Title", label: "Risk Title" },
  { key: "ProcessArea", label: "Process / Area" },
  { key: "RiskScore", label: "Score (S×P)" },
  { key: "RiskLevel", label: "Risk Level" },
  { key: "ResidualScore", label: "Residual" },
  { key: "Owner", label: "Risk Owner" },
  { key: "ReviewDate", label: "Next Review", render: (r) => (r.ReviewDate || "").slice(0, 10) },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// ══════════════════════════════ OOS — OUT OF SPECIFICATION ═════════════════

export const oosTabs = ["details", "phase1", "phase2", "decision", "closure", "audit"];

export const oosTabStage = {
  details: 0, phase1: 1, phase2: 2, decision: 3, closure: 4, audit: 99,
};

export const oosTabLabels = {
  details: "1. OOS Details",
  phase1: "2. Phase 1 — Lab",
  phase2: "3. Phase 2 — Manufacturing",
  decision: "4. Decision",
  closure: "5. Closure",
  audit: "6. Audit Trail",
};

export const oosWidthConfig = {
  "Specification Limit": "col-span-2",
  "Phase 1 Checklist (Calculation, Standard, Instrument, Method, Sample)": "col-span-full",
  "Laboratory Error Details": "col-span-full",
  "Phase 1B — Retest / Hypothesis Testing": "col-span-full",
  "Phase 2 Investigation Summary (BMR, Process, Equipment)": "col-span-full",
  "Root Cause": "col-span-full",
  "Other Batches Impacted": "col-span-full",
  "QA Comments": "col-span-full",
  "Closure Remarks": "col-span-full",
  "Phase 1 Summary Remarks": "col-span-full",
  "Analyst Interview Remarks": "col-span-full",
  "Re-injection Result": "col-span-full",
  "Re-sonication Result": "col-span-full",
  "Re-filtration Result": "col-span-full",
  "Attachment Details": "col-span-full",
  "Phase 2 — Manufacturing Investigation": "col-span-full",
};

const PLI_CHECKLIST = [
  "Is the calculation verified and found correct?",
  "Is the reference / working standard within validity?",
  "Is the reagent / solution within validity and correctly prepared?",
  "Is the instrument calibration current?",
  "Is the glassware / volumetric apparatus calibrated?",
  "Was the correct STP / method followed?",
  "Was the correct sample and A.R. number used?",
  "Was sample preparation as per method (weight, dilution, sonication)?",
  "Was sample storage and handling correct?",
  "Is the chromatogram / spectrum free from abnormality?",
  "Was system suitability met before the analysis?",
  "Was there any power failure or instrument interruption?",
  "Was the analytical balance verified before weighing?",
  "Was the column / detector / cell in acceptable condition?",
  "Was the mobile phase / media correctly prepared and degassed?",
  "Are the raw data and worksheets complete and legible?",
  "Was the analyst qualified and trained on this method?",
  "Was the environment (temperature / humidity) within limits?",
].map((q, i) => ({ SrNo: String(i + 1), CheckPoint: q }));

const PLI_HYPOTHESIS = [
  "Incorrect weighing of sample or standard",
  "Incorrect dilution or volumetric transfer",
  "Incomplete extraction or sonication",
  "Filter adsorption or incompatible filter",
  "Degraded or incorrectly stored standard",
  "Incorrect mobile phase composition or pH",
  "Column performance deterioration",
  "Detector or lamp performance",
  "Injection volume or autosampler error",
  "Integration or peak identification error",
  "Contaminated glassware or reagent",
  "Sample carryover from previous injection",
  "Temperature or media variation in dissolution",
  "Sampling not representative of the batch",
].map((h, i) => ({ SrNo: String(i + 1), ErrorPoint: h }));

const SAMPLING_CHECKLIST = [
  "Was the sample drawn as per the approved sampling plan?",
  "Was the sampling tool clean and dedicated?",
  "Was the sample container correctly labelled?",
  "Was the sample quantity as specified?",
  "Was the sample representative of the whole batch?",
  "Was the sample transported and stored correctly?",
  "Was the sampler trained and authorised?",
  "Was the sampling area environment acceptable?",
].map((q, i) => ({ SrNo: String(i + 1), CheckPoint: q }));

const RESULT_PASSES = ["Analyst 1", "Analyst 2", "Analyst 3"].map((a) => ({ Analyst: a }));

export const getOosFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const PR = (o.product || []).map((g) => g.label);
  const IN = (o.instrument || []).map((g) => g.label);

  return {
    // ───── S1 — REPORTED (stage 0) — QC Head ─────
    details: [
      [[
        "1. OOS Details",
        [
          { key: "RecordNo", label: "OOS No.", type: "text", disabled: true },
          { key: "ReportedDate", label: "Date Reported", type: "date" },
          { key: "Product", label: "Product", type: "select", options: PR },
          { key: "BatchNo", label: "Batch No.", type: "text" },
          { key: "MfgDate", label: "Batch Mfg. Date", type: "date" },
          { key: "BatchSize", label: "Batch Size", type: "text" },
          { key: "ArNo", label: "AR / Sample No.", type: "text" },
          { key: "Stage", label: "Testing Stage", type: "select", options: ["Raw Material", "In-Process", "Finished Product", "Stability", "Packing Material", "Water / Utility"] },
          { key: "TestParameter", label: "Test Parameter", type: "text" },
          { key: "ReportedBy", label: "Reported By", type: "select", options: P },
        ],
      ]],
      [[
        "2. Result & Specification",
        [
          {
            key: "StpRef", label: "STP / Method Ref.", type: "select",
            options: (o.refOpts?.stp || []).map((x) => x.value)
          },
          { key: "SpecificationLimit", label: "Specification Limit", type: "text" },
          { key: "ObtainedResult", label: "Obtained Result", type: "text" },
          { key: "Analyst", label: "Analyst", type: "select", options: P },
          { key: "Instrument", label: "Instrument Used", type: "select", options: IN },
          { key: "AnalysisDate", label: "Date of Analysis", type: "date" },
        ],
      ]],
    ],

    // ───── S2 — PHASE 1 (stage 1) — QC Head ─────
    phase1: [
      [[
        "3. PLI Issuance",
        [
          { key: "PliNo", label: "PLI No.", type: "text" },
          { key: "PliIssuedBy", label: "Issued By", type: "select", options: P },
          { key: "PliIssuedTo", label: "Issued To", type: "select", options: P },
          { key: "PliIssuedDate", label: "Issued Date", type: "date" },
          {
            key: "ObviousError", label: "Obvious Error Found?", type: "select",
            options: ["Yes - Lab Error", "No - Proceed to Phase IB"]
          },
          {
            key: "LabErrorDetails", label: "Lab Error Details", type: "text",
            showIf: (d) => String(d.ObviousError || "").startsWith("Yes")
          },
        ],
      ]],
      [[
        "4. Phase 1A — Laboratory Checklist",
        [
          {
            key: "plichecklist", type: "childgrid", label: "Preliminary Laboratory Investigation",
            fixedRows: true, defaultRows: PLI_CHECKLIST,
            footer: "Record the observation against each check point.",
            columns: [
              { key: "SrNo", label: "Sr", type: "text", disabled: true, width: "4%" },
              { key: "CheckPoint", label: "Check Point", type: "text", disabled: true, width: "40%" },
              {
                key: "Observation", label: "Observation", type: "select",
                options: ["Yes", "No", "Not Applicable"], width: "13%"
              },
              { key: "Remarks", label: "Remarks", type: "textarea" },
            ]
          },
        ],
      ]],
      [[
        "5. Analyst Discussion",
        [
          {
            key: "AnalystKnowsProcedure", label: "Does the analyst have knowledge of the procedure?",
            type: "select", options: ["Yes", "No"]
          },
          {
            key: "AnalystFollowedProcedure", label: "Was the analysis performed as per procedure?",
            type: "select", options: ["Yes", "No"]
          },
          { type: "row-break" },
          { key: "AnalystInterviewRemarks", label: "Analyst Interview Remarks", type: "textarea" },
        ],
      ]],
      [[
        "6. Sampling Checklist",
        [
          {
            key: "samplingcheck", type: "childgrid", label: "Sampling Verification",
            fixedRows: true, defaultRows: SAMPLING_CHECKLIST,
            columns: [
              { key: "SrNo", label: "Sr", type: "text", disabled: true, width: "4%" },
              { key: "CheckPoint", label: "Check Point", type: "text", disabled: true, width: "44%" },
              {
                key: "Observation", label: "Observation", type: "select",
                options: ["Yes", "No", "Not Applicable"], width: "13%"
              },
              { key: "Remarks", label: "Remarks", type: "textarea" },
            ]
          },
        ],
      ]],
      [[
        "7. Hypothesis Testing",
        [
          {
            key: "hypothesis", type: "childgrid", label: "Probable Error Points",
            fixedRows: true, defaultRows: PLI_HYPOTHESIS,
            footer: "Record the finding against each probable error point.",
            columns: [
              { key: "SrNo", label: "Sr", type: "text", disabled: true, width: "4%" },
              { key: "ErrorPoint", label: "Probable Error Point", type: "text", disabled: true, width: "40%" },
              { key: "Observation", label: "Observation", type: "textarea" },
            ]
          },
        ],
      ]],
      [[
        "8. Immediate Laboratory Actions",
        [
          {
            key: "ReInjection", label: "Re-injection", type: "select",
            options: ["Applicable", "Not Applicable"]
          },
          {
            key: "ReSonication", label: "Re-sonication", type: "select",
            options: ["Applicable", "Not Applicable"]
          },
          {
            key: "ReFiltration", label: "Re-filtration", type: "select",
            options: ["Applicable", "Not Applicable"]
          },
          { type: "row-break" },
          {
            key: "ReInjectionResult", label: "Re-injection Result", type: "textarea",
            showIf: (d) => d.ReInjection === "Applicable"
          },
          {
            key: "ReSonicationResult", label: "Re-sonication Result", type: "textarea",
            showIf: (d) => d.ReSonication === "Applicable"
          },
          {
            key: "ReFiltrationResult", label: "Re-filtration Result", type: "textarea",
            showIf: (d) => d.ReFiltration === "Applicable"
          },
        ],
      ]],
      [[
        "9. Phase 1A Conclusion",
        [
          { key: "Phase1By", label: "Investigated By (QC)", type: "select", options: P },
          { key: "Phase1Date", label: "Phase 1 Completion Date", type: "date" },
          {
            key: "Phase1Conclusion", label: "Phase 1 Conclusion", type: "select",
            options: ["Lab Error Confirmed", "No Lab Error — Escalate to Phase 2"]
          },
          {
            key: "Phase1Recommendation", label: "Recommendation", type: "select",
            options: ["Repeat Analysis", "Re-sampling", "Others"]
          },
          { type: "row-break" },
          { key: "Phase1Checklist", label: "Phase 1 Summary Remarks", type: "textarea" },
        ],
      ]],
      [[
        "10. Phase 1B — Full Scale Laboratory Investigation",
        [
          { key: "PliRefNo", label: "PLI Reference No.", type: "text" },
          { key: "PliCompletionDate", label: "PLI Completion Date", type: "date" },
          { key: "Analyst1", label: "Analyst 1", type: "select", options: P },
          { key: "Analyst2", label: "Analyst 2", type: "select", options: P },
          { key: "Analyst3", label: "Analyst 3", type: "select", options: P },
          { key: "SamplerName", label: "Sampler Name", type: "select", options: P },
          { type: "row-break" },
          {
            key: "phase2results", type: "childgrid", label: "Re-analysis Results",
            fixedRows: true, defaultRows: RESULT_PASSES,
            footer: "Record each analyst's three determinations. Overall mean and %RSD are entered below.",
            columns: [
              { key: "Analyst", label: "Analyst", type: "text", disabled: true, width: "20%" },
              { key: "Result1", label: "1st Analysis", type: "text", width: "18%" },
              { key: "Result2", label: "2nd Analysis", type: "text", width: "18%" },
              { key: "Result3", label: "3rd Analysis", type: "text", width: "18%" },
              { key: "RowMean", label: "Mean", type: "text", width: "18%" },
            ]
          },
          { key: "ResultMean", label: "Overall Mean", type: "text" },
          { key: "ResultRsd", label: "% RSD", type: "text" },
          {
            key: "WithinAcceptanceCriteria", label: "Within Acceptance", type: "select",
            options: ["Yes", "No"]
          },
          {
            key: "ExtendedInvestigationRecommended", label: "Prod. Investigation?",
            type: "select", options: ["Yes", "No"]
          },
          { type: "row-break" },
          { key: "Phase1Retest", label: "Retest / Re-analysis Summary", type: "textarea" },
          { key: "AttachmentDetails", label: "Attachment Details", type: "textarea" },
          {
            key: "LabInvestSigns", type: "signblock", label: "Full Scale Investigation Approved By",
            signs: [
              { key: "LabInvestHeadQc", label: "Head — Quality Control", options: P },
              { key: "LabInvestHeadQa", label: "Head — Quality Assurance", options: P },
            ]
          },
        ],
      ]],
    ],

    // ───── S3 — PHASE 2 (stage 2) — QA Investigator ─────
    phase2: [
      [[
        "11. Phase 2 — Extended / Manufacturing Investigation",
        [
          { key: "Phase2By", label: "Investigated By", type: "select", options: P },
          { key: "Phase2Date", label: "Investigation Date", type: "date" },
          { type: "row-break" },
          { key: "Phase2Investigation", label: "Phase 2 — Manufacturing Investigation", type: "textarea" },
          { key: "RootCause", label: "Root Cause", type: "textarea" },
          { key: "OtherBatchesImpacted", label: "Other Batches Impacted", type: "textarea" },
          {
            key: "Phase2Signs", type: "signblock", label: "Reviewed By",
            signs: [{ key: "Phase2HeadQa", label: "Head — Quality Assurance", options: P }]
          },
        ],
      ]],
    ],
    // ───── S4 — PENDING DECISION (stage 3) — QA Head ─────
    decision: [
      [[
        "12. Classification & Disposition",
        [
          {
            key: "FinalClassification", label: "Final Classification", type: "select",
            options: ["Invalidated — Lab Error", "Confirmed OOS", "Inconclusive"]
          },
          {
            key: "BatchDisposition", label: "Batch Disposition", type: "select",
            options: ["Released", "Rejected", "Reprocess", "Rework", "Hold - Pending", "Quarantine"]
          },
          { key: "ApprovedBy", label: "Approved By (QA Head)", type: "select", options: P },
          { key: "ApprovalDate", label: "Approval Date", type: "date" },
          { key: "CapaRef", label: "Linked CAPA Ref. (auto)", type: "text", disabled: true },
        ],
      ]],
    ],

    // ───── S5 — PENDING CLOSURE (stage 4) — QA Head ─────
    closure: [
      [[
        "13. Closure",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "TargetClosure", label: "Target Closure Date", type: "date" },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { type: "row-break" },
          { key: "QaComments", label: "QA Comments", type: "textarea" },
          { key: "ClosureRemarks", label: "Closure Remarks", type: "textarea" },
        ],
      ]],
    ],
  };
};

export const oosSectionConfigs = {
  "1. OOS Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "2. Result & Specification": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "3. PLI Issuance": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "4. Phase 1A — Laboratory Checklist": "grid-cols-1",
  "5. Analyst Discussion": "grid-cols-1 sm:grid-cols-2",
  "6. Sampling Checklist": "grid-cols-1",
  "7. Hypothesis Testing": "grid-cols-1",
  "8. Immediate Laboratory Actions": "grid-cols-1 sm:grid-cols-3",
  "9. Phase 1A Conclusion": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "10. Phase 1B — Full Scale Laboratory Investigation": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "11. Phase 2 — Extended / Manufacturing Investigation": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "12. Classification & Disposition": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "13. Closure": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3",
};

export const oosRequiredByStage = {
  "Reported": ["ReportedDate", "Product", "BatchNo", "ArNo", "Stage", "TestParameter", "ReportedBy", "StpRef", "SpecificationLimit", "ObtainedResult", "Analyst", "Instrument", "AnalysisDate"],
  "Phase 1 Investigation": ["ObviousError", "Phase1By", "Phase1Date", "Phase1Conclusion"],
  "Phase 2 Investigation": ["Phase2Investigation", "RootCause", "Phase2By", "Phase2Date"],
  "Pending Decision": ["FinalClassification", "BatchDisposition", "ApprovedBy", "ApprovalDate"],
  "Pending Closure": ["QaComments", "ClosedBy"],
  "Closed": [],
};

export const getOosRequired = (s) => oosRequiredByStage[s] || oosRequiredByStage["Reported"];

export const oosTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "OOS No." },
  { key: "ReportedDate", label: "Reported", render: (r) => (r.ReportedDate || "").slice(0, 10) },
  { key: "Product", label: "Product" },
  { key: "BatchNo", label: "Batch No." },
  { key: "TestParameter", label: "Test" },
  { key: "ObtainedResult", label: "Result" },
  { key: "FinalClassification", label: "Classification" },
  { key: "BatchDisposition", label: "Disposition" },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];

// ══════════════════════════════════ OOT — OUT OF TREND ═════════════════════

export const ootTabs = ["details", "evaluation", "impact", "closure", "audit"];

export const ootTabStage = {
  details: 0, evaluation: 1, impact: 2, closure: 3, audit: 99,
};

export const ootTabLabels = {
  details: "1. OOT Details",
  evaluation: "2. Trend Evaluation",
  impact: "3. Impact Assessment",
  closure: "4. Closure",
  audit: "5. Audit Trail",
};

export const ootWidthConfig = {
  "Trend Limit / Band": "col-span-2",
  "Historical Data (previous results)": "col-span-full",
  "Trend Evaluation": "col-span-full",
  "Probable Cause": "col-span-full",
  "Impact Assessment": "col-span-full",
  "Action Taken": "col-span-full",
  "Closure Remarks": "col-span-full",
};

export const getOotFieldGroups = (o = {}) => {
  const P = (o.personnel || []).map((g) => g.label);
  const PR = (o.product || []).map((g) => g.label);

  return {
    // ───── S1 — REPORTED (stage 0) — QC Head ─────
    details: [
      [[
        "1. OOT Details",
        [
          { key: "RecordNo", label: "OOT No.", type: "text", disabled: true },
          { key: "ReportedDate", label: "Date Reported", type: "date" },
          { key: "Product", label: "Product", type: "select", options: PR },
          { key: "BatchNo", label: "Batch No.", type: "text" },
          { key: "ArNo", label: "AR / Sample No.", type: "text" },
          { key: "TestParameter", label: "Test Parameter", type: "text" },
          {
            key: "DataSource", label: "Data Source", type: "select",
            options: ["Stability Study", "Routine Release Testing", "In-Process Testing", "Environmental Monitoring", "Water System", "Process Parameter"]
          },
          {
            key: "StabilityStation", label: "Stability Station", type: "select",
            options: ["0 M", "3 M", "6 M", "9 M", "12 M", "18 M", "24 M", "36 M"],
            showIf: (d) => d.DataSource === "Stability Study"
          },
          { key: "ReportedBy", label: "Reported By", type: "select", options: P },
        ],
      ]],
      [[
        "2. Observed Value & Trend Limit",
        [
          { key: "ObservedValue", label: "Observed Value", type: "text" },
          { key: "SpecificationLimit", label: "Specification Limit", type: "text" },
          { key: "TrendLimit", label: "Trend Limit / Band", type: "text" },
          {
            key: "StatisticalMethod", label: "Statistical Method", type: "select",
            options: ["Control Chart (±3 sigma)", "Control Chart (±2 sigma)", "Historical Mean ± SD", "Moving Range", "Regression / Slope", "Manual Comparison"]
          },
          { key: "Analyst", label: "Analyst", type: "select", options: P },
        ],
      ]],
    ],

    // ───── S2 — UNDER EVALUATION (stage 1) — QC Head ─────
    evaluation: [
      [[
        "3. Trend Evaluation",
        [
          { key: "EvaluationDate", label: "Evaluation Date", type: "date" },
          { type: "row-break" },
          { key: "HistoricalData", label: "Historical Data (previous results)", type: "textarea" },
          { key: "Evaluation", label: "Trend Evaluation", type: "textarea" },
          { key: "ProbableCause", label: "Probable Cause", type: "textarea" },
        ],
      ]],
    ],

    // ───── S3 — IMPACT ASSESSED (stage 2) — QA Head ─────
    impact: [
      [[
        "4. Impact Assessment",
        [
          {
            key: "Outcome", label: "Evaluation Outcome", type: "select",
            options: ["Isolated — No Action", "Monitor Closely", "Systemic — Investigation Required", "Escalate to OOS"]
          },
          { key: "ReviewedBy", label: "Reviewed By (QA Head)", type: "select", options: P },
          { key: "ReviewDate", label: "Review Date", type: "date" },
          {
            key: "DeviationRef", label: "Linked Deviation Ref. (auto)", type: "text", disabled: true,
            showIf: (d) => d.Outcome === "Systemic — Investigation Required"
          },
          {
            key: "CapaRef", label: "Linked CAPA Ref.", type: "select",
            options: (o.refOpts?.capa || []).map((x) => x.value)
          },
          { type: "row-break" },
          { key: "ImpactAssessment", label: "Impact Assessment", type: "textarea" },
        ],
      ]],
    ],

    // ───── S4 — PENDING CLOSURE (stage 3) — QA Head ─────
    closure: [
      [[
        "5. Action & Closure",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "TargetClosure", label: "Target Closure Date", type: "date" },
          { key: "ClosedBy", label: "Closed By", type: "select", options: P },
          { type: "row-break" },
          { key: "ActionTaken", label: "Action Taken", type: "textarea" },
          { key: "ClosureRemarks", label: "Closure Remarks", type: "textarea" },
        ],
      ]],
    ],
  };
};

export const ootSectionConfigs = {
  "1. OOT Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "2. Observed Value & Trend Limit": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "3. Trend Evaluation": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "4. Impact Assessment": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "5. Action & Closure": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-3",
};

export const ootRequiredByStage = {
  "Reported": ["ReportedDate", "Product", "BatchNo", "TestParameter", "DataSource", "ReportedBy", "ObservedValue", "TrendLimit", "StatisticalMethod", "Analyst"],
  "Under Evaluation": ["HistoricalData", "Evaluation", "ProbableCause", "EvaluationDate"],
  "Impact Assessed": ["ImpactAssessment", "Outcome", "ReviewedBy", "ReviewDate"],
  "Pending Closure": ["ActionTaken", "ClosedBy"],
  "Closed": [],
};

export const getOotRequired = (s) => ootRequiredByStage[s] || ootRequiredByStage["Reported"];

export const ootTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "OOT No." },
  { key: "ReportedDate", label: "Reported", render: (r) => (r.ReportedDate || "").slice(0, 10) },
  { key: "Product", label: "Product" },
  { key: "BatchNo", label: "Batch No." },
  { key: "TestParameter", label: "Test" },
  { key: "DataSource", label: "Source" },
  { key: "ObservedValue", label: "Value" },
  { key: "Outcome", label: "Outcome" },
  { key: "Status", label: "Stage", render: (r) => (r.Status === "Rejected" ? (r.RejectedFromStage || "—") : r.Status) },
  { key: "Rejected", label: "Rejected", render: (r) => r.Status === "Rejected" ? "Yes" : "No" },
  { key: "IsDraft", label: "Is Draft", render: (r) => r.IsDraft ? "Yes" : "No" },
];
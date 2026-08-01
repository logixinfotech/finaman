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

export const deviationWidthConfig = {
  "Product": "col-span-2",
  "Description of Deviation": "col-span-4",
  "Immediate Action Taken": "col-span-4",
  "Attachment Ref.": "col-span-2",
  "Investigation Summary": "col-span-full",
  "Probable / Root Cause": "col-span-full",
  "Impact Assessment (Quality / Validation / Regulatory)": "col-span-full",
  "Other Batches / Products Impacted": "col-span-full",
  "Corrective Action": "col-span-full",
  "Preventive Action": "col-span-full",
  "Target Date Extension Reason": "col-span-full",
  "QA Comments": "col-span-full",
};

export const getDeviationFieldGroups = (groupOptions = {}) => ({
  // ───────────────────────── S1 — OPEN (stage 0) ─────────────────────────
  open: [
    [
      [
        "1. Deviation Details",
        [
          { key: "RecordNo", label: "Deviation No.", type: "text", disabled: true },
          { key: "DeviationType", label: "Deviation Type", type: "select", options: ["Planned", "Unplanned"] },
          { key: "OccurrenceDate", label: "Date of Occurrence", type: "date" },
          { key: "DetectionDate", label: "Date of Detection", type: "date" },
          { key: "Stage", label: "Process Stage", type: "select", options: ["Dispensing", "Granulation", "Compression", "Coating", "Packing", "QC", "Warehouse", "Other"] },
          { key: "Department", label: "Department", type: "select", options: (groupOptions.department || []).map(g => g.label) },
          { key: "Product", label: "Product", type: "select", options: (groupOptions.product || []).map(g => g.label) },
          { key: "BatchNo", label: "Batch No.", type: "text" },
          { key: "BatchQty", label: "Batch Size / Qty Affected", type: "text" },
          { key: "ReportedBy", label: "Reported / Initiated By", type: "text" },
          { key: "ReportedOn", label: "Reported On", type: "date" },
          { key: "Designation", label: "Designation", type: "select", options: (groupOptions.designation || []).map(g => g.label) },
          { type: "row-break" },
          { key: "Description", label: "Description of Deviation", type: "textarea" },
          { key: "ImmediateAction", label: "Immediate Action Taken", type: "textarea" },
        ],
      ],
    ],
    [
      [
        "2. Source & Linkage",
        [
          { key: "IncidentRef", label: "Linked Incident Ref.", type: "text" },
          { key: "RepeatDeviation", label: "Repeat Deviation?", type: "select", options: ["Yes", "No"] },
          { key: "AttachmentRef", label: "Attachment Ref.", type: "text" },
        ],
      ],
    ],
  ],

  // ────────────────────── S2 — QA ACCEPTED (stage 1) ──────────────────────
  qa_accepted: [
    [
      [
        "3. QA Assessment",
        [
          { key: "Classification", label: "Classification", type: "select", options: ["Minor", "Major", "Critical"] },
          { key: "Priority", label: "Priority", type: "select", options: ["Low", "Medium", "High", "Critical"] },
          { key: "InvestigationRequired", label: "Detailed Investig. Required", type: "select", options: ["Yes", "No"] },
          { key: "QaNotifiedDate", label: "QA Notified On", type: "date" },
          { key: "AcceptedBy", label: "Accepted By (QA)", type: "select", options: (groupOptions.personnel || []).map(g => g.label) },
          { key: "AcceptedOn", label: "Accepted On", type: "date" },
        ],
      ],
    ],
  ],

  // ───────────── S3 — UNDER INVESTIGATION (stage 2) — QA Investigator ─────────────
  investigation: [
    [
      [
        "4. Investigation Details",
        [
          { key: "InvestigationStartDate", label: "Investig. Start Date", type: "date" },
          { key: "InvestigationCompletionDate", label: "Investig. Completion Date", type: "date" },
          { key: "InvestigatedBy", label: "Investigated By", type: "select", options: (groupOptions.personnel || []).map(g => g.label) },
          { type: "row-break" },
          { key: "InvestigationSummary", label: "Investigation Summary", type: "textarea" },
        ],
      ],
    ],
    [
      [
        "5. Root Cause Analysis",
        [
          { key: "RcaMethod", label: "Root Cause Method", type: "select", options: ["5-Why", "Fishbone", "FMEA", "Other"] },
          { type: "row-break" },
          { key: "ProbableCause", label: "Probable / Root Cause", type: "textarea" },
        ],
      ],
    ],
  ],

  // ───────────── S4 — IMPACT ASSESSED (stage 3) — QA Head ─────────────
  impact: [
    [
      [
        "6. Impact Assessment",
        [
          { key: "RiskLevel", label: "Risk Level", type: "select", options: ["Low", "Medium", "High"] },
          { key: "AffectedLots", label: "Affected Lots / Batches", type: "text" },
          { key: "BatchDisposition", label: "Batch Disposition", type: "select", options: ["Release", "Reject", "Rework", "Reprocess", "Under Review"] },
          { type: "row-break" },
          { key: "ImpactAssessment", label: "Impact Assessment (Quality / Validation / Regulatory)", type: "textarea" },
          { key: "OtherBatchesImpacted", label: "Other Batches / Products Impacted", type: "textarea" },
        ],
      ],
    ],
  ],

  // ───────────────────── S5 — CAPA ASSIGNED (stage 4) ─────────────────────
  capa: [
    [
      [
        "7. CAPA (Corrective & Preventive Action)",
        [
          { key: "CapaRequired", label: "CAPA Required", type: "select", options: ["Yes", "No"] },
          { key: "CapaRef", label: "Linked CAPA Ref.", type: "text", disabled: true },
          { key: "TargetDate", label: "Target Completion Date", type: "date" },
          { key: "RevisedTargetDate", label: "Revised Target Date", type: "date" },
          { type: "row-break" },
          { key: "ExtensionReason", label: "Target Date Extension Reason", type: "textarea", showIf: (d) => !!d.RevisedTargetDate },
          { key: "CorrectiveAction", label: "Corrective Action", type: "textarea" },
          { key: "PreventiveAction", label: "Preventive Action", type: "textarea" },
        ],
      ],
    ],
  ],

  // ─────────────────── S6 — QA REVIEW → CLOSED (stage 5) ───────────────────
  closure: [
    [
      [
        "8. QA Review & Closure",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "ReviewedBy", label: "Reviewed By (QA)", type: "select", options: (groupOptions.personnel || []).map(g => g.label) },
          { key: "ReviewDate", label: "Review Date", type: "date" },
          { key: "ClosureStatus", label: "Closure Status", type: "select", options: ["Open", "Closed"] },
          { key: "ClosedOn", label: "Closed On", type: "date" },
          { key: "ClosedBy", label: "Closed By", type: "select", options: (groupOptions.personnel || []).map(g => g.label) },
          { type: "row-break" },
          { key: "QaRemarks", label: "QA Comments", type: "textarea" },
        ],
      ],
    ],
  ],
});

export const deviationSectionConfigs = {
  "1. Deviation Details": "grid-cols-1 sm:grid-cols-4 xl:grid-cols-8",
  "2. Source & Linkage": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
  "3. QA Assessment": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "4. Investigation Details": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "5. Root Cause Analysis": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "6. Impact Assessment": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "7. CAPA (Corrective & Preventive Action)": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "8. QA Review & Closure": "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
};

// stage-wise required (Status string ke hisaab se)
export const deviationRequiredByStage = {
  "Open": ["OccurrenceDate", "DetectionDate", "Department", "Description", "RepeatDeviation"],
  "QA Accepted": ["Classification", "Priority", "InvestigationRequired"],
  "Under Investigation": ["InvestigationStartDate", "InvestigationSummary", "RcaMethod", "ProbableCause"],
  "Impact Assessed": ["RiskLevel", "ImpactAssessment", "BatchDisposition"],
  "CAPA Assigned": ["CapaRequired", "TargetDate", "CorrectiveAction", "PreventiveAction"],
  "QA Review": ["ReviewedBy", "ReviewDate", "ClosureStatus"],
  "Closed": [],
};

export const getDeviationRequired = (status) =>
  deviationRequiredByStage[status] || deviationRequiredByStage["Open"];
 

// ============================================== PRODUCT RECALL CONFIG ==============================================


export const recallTabs = ["entry"]; // sirf ek "virtual" tab — tab bar dikhega hi nahi

export const recallFieldGroups = (options = {}) => ({
  entry: {
    "Recall Details": [
      { key: "RecordNo", label: "Product Recall Number", type: "text", disabled: true },
      { key: "initiation_date", label: "Recall Initiation Date", type: "date" },
      { key: "product", label: "Product", type: "select", options: options.product.map(g => g.label) || [] },
      { key: "batch_nos", label: "Batch No.(s)", type: "text" },
      { key: "classification", label: "Recall Classification", type: "select", options: ["Class I", "Class II", "Class III"] },
      { key: "recall_type", label: "Recall Type", type: "select", options: ["Voluntary", "Mandatory / Regulatory Directed"] },
      { key: "recall_level", label: "Recall Level / Depth", type: "select", options: ["Consumer Level", "Retail Level", "Wholesale Level"] },
      { key: "mfg_date", label: "Batch Mfg. Date", type: "date" },
      { key: "exp_date", label: "Batch Expiry Date", type: "date" },
      { key: "reason", label: "Reason for Recall", type: "textarea" },
    ],
    "Regulatory Notification": [
      { key: "communication_mode", label: "Recall Communication Mode", type: "select", options: ["Email", "Letter", "Phone Call", "Public Notice"] },
      { key: "regulatory_authority", label: "Regulatory Authority Notified", type: "text" },
      { key: "regulatory_notified_date", label: "Authority Notification Date", type: "date" },
    ],

    "Linked References": [
      { key: "complaint_ref", label: "Linked Market Complaint Ref.", type: "text" },
      { key: "deviation_ref", label: "Linked Deviation / OOS Ref.", type: "text" },
    ],

    "Effectiveness & Closure": [
      { key: "effectiveness_summary", label: "Recall Effectiveness Check Summary", type: "textarea" },
      { key: "destruction_details", label: "Recovered Stock Disposition / Destruction Details", type: "textarea" },
      { key: "mock_recall_result", label: "Mock Recall Result", type: "text" },
      { key: "destruction_witnessed_by", label: "Destruction Witnessed", type: "text" },
      { key: "capa_ref", label: "Linked CAPA Ref.", type: "text" },
      { key: "target_date", label: "Target Completion Date", type: "date" },
    ],

    "Distribution & Quantity": [
      { key: "distribution_details", label: "Distribution Details (Parties, Regions, Export)", type: "textarea" },
      { key: "qty_manufactured", label: "Qty. Manufactured", type: "text" },
      { key: "qty_distributed", label: "Qty. Distributed (Units)", type: "text" },
      { key: "qty_in_stock", label: "Qty. in Stock (Units)", type: "text" },
      { key: "qty_recovered", label: "Qty. Recovered (Units)", type: "text" },
    ],
  },
});

export const recallRequiredFieldsList = [
  "initiation_date",
  "product",
  "batch_nos",
  "classification",
  "reason",
];

// ============================================== Incident ==============================================

export const incidentTabs = ["reported", "review", "investigation", "closure", "audit"];

export const incidentTabStage = {
  reported: 0, review: 1, investigation: 2, closure: 3, audit: 99,
};

export const incidentTabLabels = {
  reported:      "1. Reported",
  review:        "2. QA Review",
  investigation: "3. Investigation",
  closure:       "4. Closure",
  audit:         "5. Audit Trail",
};

export const incidentWidthConfig = {
  "Incident Description": "col-span-full",
  "Immediate Action / Containment": "col-span-full",
  "Impact Assessment": "col-span-full",
  "Root Cause": "col-span-full",
  "Investigation Summary": "col-span-full",
  "Closure Remarks": "col-span-full",
  "Attachment Ref.": "col-span-2",
};

export const getIncidentFieldGroups = (options = {}) => ({
  // ───────── S1 — REPORTED (stage 0) — Operator ─────────
  reported: [
    [
      [
        "1. Incident Details",
        [
          { key: "RecordNo", label: "Incident No.", type: "text", disabled: true },
          { key: "IncidentDate", label: "Date of Incident", type: "date" },
          { key: "IncidentTime", label: "Time of Incident", type: "text" },
          { key: "Shift", label: "Shift", type: "select", options: ["A", "B", "C", "General"] },
          { key: "Area", label: "Area / Location", type: "select", options: (options.area || []).map(g => g.label) },
          { key: "Category", label: "Category", type: "select", options: ["Equipment Failure", "Human Error", "Documentation", "Contamination", "Power Failure", "Other"] },
          { key: "OtherCategoryDetail", label: "Specify Other Category", type: "text", showIf: (d) => d.Category === "Other" },
          { key: "Severity", label: "Severity", type: "select", options: ["Minor", "Major", "Critical"] },
          { type: "row-break" },
          { key: "Description", label: "Incident Description", type: "textarea" },
        ],
      ],
    ],
    [
      [
        "2. Reporting Information",
        [
          { key: "ReportedBy", label: "Reported By", type: "select", options: (options.personnel || []).map(g => g.label) },
          { key: "WitnessedBy", label: "Witnessed By", type: "text" },
          { key: "EquipmentInvolved", label: "Equip. / Instru. Involved", type: "select", options: (options.equipment || []).map(g => g.label) },
          { key: "ProductBatch", label: "Prod. / Batch Affected", type: "text" },
          { key: "AttachmentRef", label: "Attachment Ref.", type: "text" },
          { type: "row-break" },
          { key: "ImmediateAction", label: "Immediate Action / Containment", type: "textarea" },
        ],
      ],
    ],
  ],

  // ───────── S2 — UNDER REVIEW (stage 1) — QA Head ─────────
  review: [
    [
      [
        "3. QA Review",
        [
          { key: "ReviewedBy", label: "Reviewed By (QA)", type: "select", options: (options.personnel || []).map(g => g.label) },
          { key: "ReviewDate", label: "Review Date", type: "date" },
          { key: "DeviationRaised", label: "Deviation Raised?", type: "select", options: ["Yes", "No"] },
          { key: "DeviationRef", label: "Linked Deviation Ref.", type: "text", disabled: true },
          { key: "EscalatedTo", label: "Escalated To", type: "select", options: (options.personnel || []).map(g => g.label) },
          { type: "row-break" },
          { key: "ImpactAssessment", label: "Impact Assessment", type: "textarea" },
        ],
      ],
    ],
  ],

  // ───────── S3 — UNDER INVESTIGATION (stage 2) — QA Investigator ─────────
  investigation: [
    [
      [
        "4. Investigation",
        [
          { key: "InvestigatedBy", label: "Investigated By", type: "select", options: (options.personnel || []).map(g => g.label) },
          { type: "row-break" },
          { key: "RootCause", label: "Root Cause", type: "textarea" },
          { key: "InvestigationSummary", label: "Investigation Summary", type: "textarea" },
        ],
      ],
    ],
  ],

  // ───────── S4 — CLOSED (stage 3) — QA Head ─────────
  closure: [
    [
      [
        "5. Closure & Linked References",
        [
          { key: "Status", label: "Current Stage", type: "text", disabled: true },
          { key: "CapaRef", label: "Linked CAPA Ref.", type: "text", disabled: true },
          { key: "TargetDate", label: "Target Closure Date", type: "date" },
          { key: "ClosedBy", label: "Closed By", type: "select", options: (options.personnel || []).map(g => g.label) },
          { type: "row-break" },
          { key: "ClosureRemarks", label: "Closure Remarks", type: "textarea" },
        ],
      ],
    ],
  ],
});

export const incidentSectionConfigs = {
  "1. Incident Details":              "grid-cols-1 sm:grid-cols-3 xl:grid-cols-6",
  "2. Reporting Information":         "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "3. QA Review":                     "grid-cols-1 sm:grid-cols-3 xl:grid-cols-5",
  "4. Investigation":                 "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "5. Closure & Linked References":   "grid-cols-1 sm:grid-cols-3 xl:grid-cols-4",
};

export const incidentRequiredByStage = {
  "Reported":            ["IncidentDate", "Area", "Category", "Severity", "Description", "ReportedBy", "ImmediateAction"],
  "Under Review":        ["ImpactAssessment", "DeviationRaised", "ReviewedBy", "ReviewDate"],
  "Under Investigation": ["RootCause", "InvestigationSummary", "InvestigatedBy"],
  "Closed":              [],
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
  { key: "Status", label: "Status" },
];
// ============================================== DMS ==============================================

export const dmsTabs = ["entry"];

export const getDmsFieldGroups = (options = {}) => ({
  entry: {
    "1. Document Details": [
      { key: "RecordNo", Label: "DMS Record No.", type: "text", disabled: true },
      { key: "DocTitle", label: "Document Title", type: "text" },
      { key: "DocNo", label: "Document No.", type: "text" },
      {
        key: "DocType",
        label: "Document Type",
        type: "select",
        options: ["SOP", "Policy", "Work Instruction", "Form", "Specification", "Manual", "Protocol"],
      },
      {
        key: "Department",
        label: "Owner Department",
        type: "select",
        // dynamic: comes from useGroupOptions -> fetchUserGroupsByType("DEP")
        options: options.department.map(g => g.label) || [],
      },
      { key: "Version", label: "Version No.", type: "text" },
      { key: "Supersedes", label: "Supersedes", type: "text" },
      { key: "ChangeRef", label: "Linked Change Ref.", type: "text" },
    ],

    "2. Revision Details": [
      {
        key: "ReasonForRevision",
        label: "Reason for New Version / Revision",
        type: "textarea",
        fullWidth: true,
      },
    ],

    "3. Review & Approval": [
      { key: "IssueDate", label: "Date of Issue", type: "date" },
      { key: "EffectiveDate", label: "Effective Date", type: "date" },
      { key: "ReviewDate", label: "Next Periodic Rev. Due", type: "date" },
      {
        key: "PreparedBy",
        label: "Prepared By",
        type: "select",
        // dynamic: employee/personnel master
        options: options.personnel.map(g => g.label) || [],
      },
      {
        key: "ReviewedBy",
        label: "Reviewed By",
        type: "select",
        options: options.personnel.map(g => g.label) || [],
      },
      {
        key: "ApprovedBy",
        label: "Approved By (QA Head)",
        type: "select",
        options: options.personnel.map(g => g.label) || [],
      },
      {
        key: "TrainingRequired",
        label: "Training Req. Bef. Eff.?",
        type: "select",
        options: ["Yes", "No"],
      },
      { key: "TrainingRef", label: "Linked Training Ref.", type: "text" },
    ],

    "4. Distribution": [
      {
        key: "Distribution",
        label: "Controlled Copy Distribution (Departments / Copy Numbers)",
        type: "textarea",
        fullWidth: true,
      },
    ],
  },
});

export const dmsSectionConfigs = {
  "1. Document Details": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "2. Revision Details": "grid-cols-1",
  "3. Review & Approval": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "4. Distribution": "grid-cols-1",
};

export const dmsWidthConfig = {
  // ReasonForRevision: "col-span-full",
  // Distribution: "col-span-full",
};

export const dmsRequiredFieldsList = [
  "DocTitle",
  "DocNo",
  "DocType",
  "Version",
];

export const dmsTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "DocNo", label: "Document No." },
  { key: "DocTitle", label: "Document Title" },
  { key: "DocType", label: "Type" },
  { key: "Version", label: "Version" },
  { key: "Department", label: "Owner Dept." },
  { key: "EffectiveDate", label: "Effective Date" },
  { key: "Status", label: "Status" },
];

// ============================================== Training ==============================================


export const trainingTabs = ["entry"]; // single virtual tab — tab bar hidden hoga

export const trainingFieldGroups = (options = {}) => ({
  entry: {
    "Training Details": [
      { key: "RecordNo", label: "Training Number", type: "text", disabled: true },
      { key: "training_title", label: "Training Title / Topic", type: "text" },
      {
        key: "training_type",
        label: "Training Type",
        type: "select",
        options: ["Induction", "GMP", "SOP", "Safety", "Refresher", "On-the-Job", "External"],
      },
      {
        key: "training_mode",
        label: "Training Mode",
        type: "select",
        options: ["Classroom", "Online", "On-the-Job", "Hybrid"],
      },
      { key: "DocRef", label: "Linked Doc. / SOP Ref.", type: "text" },
    ],

    "Schedule & Faculty": [
      {
        key: "target_department",
        label: "Target Department",
        type: "select",
        options: options.department.map(g => g.label) || [],
      },
      { key: "trainer", label: "Trainer / Faculty", type: "select", options: options.personnel.map(g => g.label) || [] },
      { key: "scheduled_date", label: "Scheduled Date", type: "date" },
      { key: "conducted_date", label: "Conducted Date", type: "date" },
    ],

    "Venue & Evaluation": [
      { key: "venue", label: "Venue / Location", type: "text" },
      { key: "duration_hours", label: "Duration (Hours)", type: "text" },
      {
        key: "evaluation_method",
        label: "Evaluation Method",
        type: "select",
        options: ["Written Test", "Oral Q&A", "Practical Demo", "Observation", "None"],
      },
      { key: "pass_criteria", label: "Pass Criteria", type: "text" },
    ],

    "Attendance & Results": [
      {
        key: "trainees_scores",
        label: "Trainees & Scores (One per line: Name — Dept — Score — Pass/Fail/Retrain)",
        type: "textarea",
        fullWidth: true,
      },
    ],

    "Effectiveness": [
      {
        key: "effectiveness_assessment",
        label: "Training Effectiveness Assessment",
        type: "textarea",
        fullWidth: true,
      },
    ],

    "Remarks": [
      {
        key: "remarks",
        label: "Remarks / Retraining Plan",
        type: "textarea",
        fullWidth: true,
      },
    ],
  },
});

// Grid layout overrides — full-width for the long-text sections
export const trainingGridConfigs = {
  "Trainees & Scores (One per line: Name — Dept — Score — Pass/Fail/Retrain)": "col-span-full",
  "Training Effectiveness Assessment": "col-span-full",
  "Remarks / Retraining Plan": "col-span-full",
};

export const trainingRequiredFieldsList = [
  "training_title",
  "training_type",
  "scheduled_date",
];

export const trainingTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "record_no", label: "Training No." },
  {
    key: "scheduled_date",
    label: "Scheduled Date",
    render: (r) => (r.scheduled_date || "").slice(0, 10),
  },
  { key: "DocRef", label: "Linked DocRef." },
  { key: "training_title", label: "Title / Topic" },
  { key: "training_type", label: "Type" },
  { key: "target_department", label: "Dept." },
  { key: "status", label: "Status" },
];

// ============================================== CALIBRATION CONFIG ==============================================

export const calibrationTabs = ["entry"]; // sirf ek "virtual" tab — tab bar dikhega hi nahi

export const calibrationWidthConfig = {
  "Impact Assessment (if As-Found Out of Limit)": "col-span-full",
  "Remarks": "col-span-full",
};

export const calibrationFieldGroups = (options = {}) => ({
  entry: {
    "Calibration Details": [
      { key: "RecordNo", label: "Record Number", type: "text", disabled: true },
      { key: "Instrument", label: "Instrument", type: "select", options: options.instrument?.map(g => g.label) || [] },
      { key: "InstrumentCode", label: "Instrument ID / Code", type: "text" },
      { key: "Location", label: "Location", type: "select", options: options.area?.map(g => g.label) || [] },
      { key: "CalibrationType", label: "Calibration Type", type: "select", options: ["Internal", "External"] },
      { key: "Agency", label: "External Agency (if any)", type: "text" },
      { key: "AcceptanceCriteria", label: "Accept. Criteria / Tolerance", type: "text" },
      {
        key: "LastCalibrated",
        label: "Last Calibrated On",
        type: "date",
        onChange: (value, current) => {
          if (!value || !current.FrequencyMonths) return { ...current, LastCalibrated: value };
          const d = new Date(value);
          d.setMonth(d.getMonth() + parseInt(current.FrequencyMonths, 10));
          const nextDue = d.toISOString().slice(0, 10);
          return { ...current, LastCalibrated: value, NextDue: nextDue };
        },
      },
      {
        key: "FrequencyMonths",
        label: "Calibration Freq. (Months)",
        type: "select",
        options: ["1", "3", "6", "12", "24"],
        onChange: (value, current) => {
          if (!value || !current.LastCalibrated) return { ...current, FrequencyMonths: value };
          const d = new Date(current.LastCalibrated);
          d.setMonth(d.getMonth() + parseInt(value, 10));
          const nextDue = d.toISOString().slice(0, 10);
          return { ...current, FrequencyMonths: value, NextDue: nextDue };
        },
      },
      { key: "NextDue", label: "Next Due Date", type: "date", disabled: true },
    ],

    "Observation": [
      { key: "AsFound", label: "As-Found Condition", type: "select", options: ["Within Limit", "Out of Limit"] },
      { key: "AsLeft", label: "As-Left Condition", type: "select", options: ["Within Limit", "Out of Limit"] },
      { key: "OutOfCalibrationImpact", label: "Impact Assessment (if As-Found Out of Limit)", type: "textarea" },
    ],

    "Review & Certification": [
      { key: "CalibratedBy", label: "Calibrated By", type: "select", options: options.personnel?.map(g => g.label) || [] },
      { key: "ReviewedBy", label: "Reviewed / Approved By", type: "select", options: options.personnel?.map(g => g.label) || [] },
      { key: "CertificateNo", label: "Certificate No.", type: "text" },
      { key: "Traceability", label: "Standard Used / NABL Traceability", type: "text" },
    ],

    "Result & Remarks": [
      { key: "Result", label: "Result", type: "select", options: ["Pass", "Fail", "Conditional"] },
      { key: "Remarks", label: "Remarks", type: "textarea" },
    ],
  },
});

export const calibrationRequiredFieldsList = ["Instrument", "FrequencyMonths", "LastCalibrated"];

export const calibrationTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "Instrument", label: "Instrument" },
  { key: "LastCalibrated", label: "Last Calibrated", render: (r) => (r.LastCalibrated || "").slice(0, 10) },
  { key: "NextDue", label: "Next Due", render: (r) => (r.NextDue || "").slice(0, 10) },
  { key: "Result", label: "Result" },
  { key: "Status", label: "Status" },
];
 
// ============================================== ENVIRONMENTAL MONITORING CONFIG (matches qms.EnvMonitoring table) ==============================================

export const environmentalMonitoringTabs = ["entry"]; // single virtual tab — tab bar hidden

export const environmentalMonitoringFieldGroups = (options = {}) => ({
  entry: {
    "Monitoring Details": [
      { key: "RecordNo", label: "Record Number", type: "text", disabled: true },
      { key: "MonitoringDate", label: "Monitoring Date", type: "date" },
      {
        key: "Area",
        label: "Area",
        type: "select",
        options: options.department?.map((g) => g.label) || [],
      },
      { key: "Location", label: "Location / Sampling Point", type: "text" },
      {
        key: "Grade",
        label: "Grade",
        type: "select",
        options: ["A", "B", "C", "D", "Unclassified"],
      },
      {
        key: "MonitoringType",
        label: "Monitoring Type",
        type: "select",
        options: [
          "Viable - Air",
          "Viable - Surface",
          "Viable - Personnel",
          "Non-Viable Particle Count",
          "Temperature",
          "Humidity",
          "Differential Pressure",
        ],
      },
    ],

    "Result & Limits": [
      { key: "Result", label: "Result", type: "text" },
      { key: "Unit", label: "Unit", type: "text" },
      { key: "AlertLimit", label: "Alert Limit", type: "text" },
      { key: "ActionLimit", label: "Action Limit", type: "text" },
      {
        key: "LimitStatus",
        label: "Limit Status",
        type: "select",
        options: ["Within Limit", "Alert Level Exceeded", "Action Level Exceeded"],
      },
      { key: "Method", label: "Method", type: "text" },
    ],

    "Review & CAPA": [
      {
        key: "Analyst",
        label: "Analyst",
        type: "select",
        options: options.personnel?.map((g) => g.label) || [],
      },
      {
        key: "ReviewedBy",
        label: "Reviewed By",
        type: "select",
        options: options.personnel?.map((g) => g.label) || [],
      },
      {
        key: "ActionTaken",
        label: "Action Taken (if limit exceeded)",
        type: "textarea",
        fullWidth: true,
      },
      { key: "CapaRef", label: "Linked CAPA Ref.", type: "text" },
    ],
  },
});

// Grid layout overrides — full-width for the long-text sections
export const environmentalMonitoringGridConfigs = {
  "Action Taken (if limit exceeded)": "col-span-full",
};

export const environmentalMonitoringRequiredFieldsList = ["MonitoringDate", "Area", "MonitoringType"];

export const environmentalMonitoringTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  {
    key: "MonitoringDate",
    label: "Monitoring Date",
    render: (r) => (r.MonitoringDate || "").slice(0, 10),
  },
  { key: "Area", label: "Area" },
  { key: "MonitoringType", label: "Monitoring Type" },
  { key: "Result", label: "Result" },
  { key: "LimitStatus", label: "Limit Status" },
  { key: "Status", label: "Status" },
];
// ============================================== STP REGISTER CONFIG ==============================================

export const stpTabs = ["entry"]; // single virtual tab — tab bar hidden

export const stpFieldGroups = (options = {}) => ({
  entry: {
    "Document Details": [
      { key: "RecordNo", label: "STP Number", type: "text", disabled: true },
      { key: "record_no", label: "STP / Document No.", type: "text" },
      { key: "title", label: "Document Title", type: "text" },
      {
        key: "department",
        label: "Department",
        type: "select",
        options: options.department?.map((g) => g.label) || [],
      },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: ["SOP", "STP", "Policy", "Work Instruction", "Format", "Guideline"],
      },
    ],

    "Version Control": [
      { key: "version", label: "Version No.", type: "text" },
      { key: "issue_date", label: "Date of Issue", type: "date" },
      { key: "EffectiveDate", label: "Effective Date", type: "date" },
      { key: "NextReviewDate", label: "Next Periodic Review Due", type: "date" },
      { key: "Supersedes", label: "Supersedes (Previous Version)", type: "text" },
      {
        key: "ReasonForRevision",
        label: "Reason for Revision",
        type: "textarea",
        fullWidth: true,
      },
    ],

    "Review & Approval": [
      { key: "ChangeRef", label: "Linked Change Control Ref.", type: "text" },
      {
        key: "PreparedBy",
        label: "Prepared By",
        type: "select",
        options: options.personnel?.map((g) => g.label) || [],
      },
      {
        key: "ReviewedBy",
        label: "Reviewed By",
        type: "select",
        options: options.personnel?.map((g) => g.label) || [],
      },
      {
        key: "ApprovedBy",
        label: "Approved By (QA Head)",
        type: "select",
        options: options.personnel?.map((g) => g.label) || [],
      },
    ],

    "Training & Distribution": [
      {
        key: "TrainingDone",
        label: "Training Completed Before Effective?",
        type: "select",
        options: ["Yes", "No", "N/A"],
      },
      {
        key: "Distribution",
        label: "Controlled Copy Distribution",
        type: "textarea",
        fullWidth: true,
      },
    ],

    "Scope / Remarks": [
      {
        key: "Scope",
        label: "Scope / Remarks",
        type: "textarea",
        fullWidth: true,
      },
    ],
  },
});

export const stpGridConfigs = {
  "Reason for Revision": "col-span-full",
  "Controlled Copy Distribution": "col-span-full",
  "Scope / Remarks": "col-span-full",
};

export const stpRequiredFieldsList = [
  "record_no",
  "title",
  "version",
];

export const stpTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "record_no", label: "STP / Doc No." },
  { key: "title", label: "Document Title" },
  { key: "version", label: "Version No." },
  {
    key: "EffectiveDate",
    label: "Effective Date",
    render: (r) => (r.effective_date || "").slice(0, 10),
  },
  { key: "department", label: "Department" },
  { key: "status", label: "Status" },
];

// ============================================== Qualification ==============================================

export const qualificationTabs = ["entry"];

export const qualificationWidthConfig = {
  "Acceptance Criteria": "col-span-full",
  "Tests / Checks Performed": "col-span-full",
  "Observations / Deviations During Execution": "col-span-full",
  "Remarks": "col-span-full",
  "Next Requalification Due": "col-span-1",
};

export const qualificationFieldGroups = (options = {}) => ({
  entry: {
    "Qualification Details": [
      { key: "RecordNo", label: "Record Number", type: "text", disabled: true },
      { key: "Equipment", label: "Equipment / System", type: "select", options: options.equipment?.map(g => g.label) || [] },
      { key: "Stage", label: "Qualification Stage", type: "select", options: ["DQ (Design)", "IQ (Installation)", "OQ (Operational)", "PQ (Performance)", "Re-Qualification"] },
      { key: "ProtocolNo", label: "Protocol No.", type: "text" },
      { key: "ReportNo", label: "Report No.", type: "text" },
      { key: "PlannedDate", label: "Planned Date", type: "date" },
      { key: "ExecutedDate", label: "Executed Date", type: "date" },
    ],

    "Criteria & Execution": [
      { key: "AcceptanceCriteria", label: "Acceptance Criteria", type: "textarea" },
      { key: "TestsPerformed", label: "Tests / Checks Performed", type: "textarea" },
      { key: "Observations", label: "Observations / Deviations During Execution", type: "textarea" },
    ],

    "Review & Closure": [
      { key: "DeviationRef", label: "Linked Deviation Ref. (if any)", type: "text" },
      { key: "Result", label: "Result", type: "select", options: ["Pending", "Pass", "Fail"] },
      { key: "PreparedBy", label: "Executed / Prepared By", type: "select", options: options.personnel?.map(g => g.label) || [] },
      { key: "ApprovedBy", label: "Approved By (QA)", type: "select", options: options.personnel?.map(g => g.label) || [] },
      { key: "NextRequalDue", label: "Next Requalification Due", type: "date" },
      { key: "Remarks", label: "Remarks", type: "textarea" },
    ],
  },
});

export const qualificationRequiredFieldsList = ["Equipment", "Stage", "ProtocolNo", "PlannedDate"];

export const qualificationTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "Equipment", label: "Equipment" },
  { key: "Stage", label: "Stage" },
  { key: "PlannedDate", label: "Planned Date", render: (r) => (r.PlannedDate || "").slice(0, 10) },
  { key: "Result", label: "Result" },
  { key: "Status", label: "Status" },
];


// ============================================== AUDIT MANAGEMENT CONFIG ==============================================

export const auditTabs = ["entry"]; // single virtual tab — tab bar hidden

export const auditFieldGroups = (options = {}) => ({
  entry: {
    "Audit Details": [
      { key: "record_no", label: "Audit Number", type: "text", disabled: true },
      {
        key: "audit_type",
        label: "Audit Type",
        type: "select",
        options: ["Internal", "External", "Regulatory", "Customer", "Supplier / Vendor", "Self-Inspection"],
      },
      { key: "auditing_agency", label: "Auditing Agency / Auditee", type: "text" },
      {
        key: "area_department_audited",
        label: "Area / Department Audited",
        type: "select",
        options: options.department?.map((g) => g.label) || [],
      },
      { key: "audit_start_date", label: "Audit Start Date", type: "date" },
    ],

    "Schedule & Scope": [
      { key: "audit_end_date", label: "Audit End Date", type: "date" },
      {
        key: "audit_scope",
        label: "Audit Scope / Areas Covered",
        type: "textarea",
        fullWidth: true,
      },
    ],

    "Participants": [
      {
        key: "auditors",
        label: "Auditor(s)",
        type: "select",
        options: options.personnel?.map((g) => g.label) || [],
      },
      {
        key: "auditee_representatives",
        label: "Auditee Representatives",
        type: "select",
        options: options.personnel?.map((g) => g.label) || [],
      },
      { key: "critical_observations", label: "Critical Observations", type: "text" },
      { key: "major_observations", label: "Major Observations", type: "text" },
    ],

    "Observations": [
      { key: "minor_observations", label: "Minor / Other Observations", type: "text" },
      {
        key: "key_findings",
        label: "Key Findings / Observations",
        type: "textarea",
        fullWidth: true,
      },
    ],

    "CAPA & Closure": [
      { key: "capa_submitted_on", label: "CAPA / Response Submitted On", type: "date" },
      { key: "capa_due_date", label: "Response / CAPA Due Date", type: "date" },
      { key: "linked_capa_ref", label: "Linked CAPA Ref.(s)", type: "text" },
      {
        key: "final_compliance_status",
        label: "Final Compliance Status",
        type: "select",
        options: ["Compliant", "Non-Compliant", "Partially Compliant", "Pending Review"],
      },
    ],
  },
});

// Grid layout overrides — full-width for the long-text sections
export const auditGridConfigs = {
  "Audit Scope / Areas Covered": "col-span-full",
  "Key Findings / Observations": "col-span-full",
};

export const auditRequiredFieldsList = [
  "audit_type",
  "audit_start_date",
];

export const auditTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "record_no", label: "Audit No." },
  {
    key: "audit_start_date",
    label: "Start Date",
    render: (r) => (r.audit_start_date || "").slice(0, 10),
  },
  { key: "audit_type", label: "Audit Type" },
  { key: "auditing_agency", label: "Agency / Auditee" },
  { key: "area_department_audited", label: "Area / Dept." },
  { key: "final_compliance_status", label: "Compliance Status" },
  { key: "status", label: "Status" },
];

// ============================================== PreventiveMaintenance ==============================================

export const pmTabs = ["entry"];

export const pmWidthConfig = {
  "PM Checklist / Activities Performed": "col-span-full",
  "Remarks": "col-span-full",
  "Next Due Date": "col-span-1",
  "Requalification Triggered?": "col-span-1",

};

export const pmFieldGroups = (options = {}) => ({
  entry: {
    "PM Details": [
      { key: "RecordNo", label: "Record Number", type: "text", disabled: true },
      { key: "EquipmentName", label: "Equipment / System", type: "select", options: options.equipment?.map(g => g.label) || [] },
      { key: "EquipmentId", label: "Equipment ID", type: "text" },
      { key: "Location", label: "Location", type: "select", options: options.area?.map(g => g.label) || [] },
      { key: "PmType", label: "PM Type", type: "select", options: ["Utility", "Instrument", "Facility", "Equipment"] },
      { key: "MaintenanceType", label: "Maintenance Category", type: "select", options: ["Preventive", "Predictive", "Breakdown"] },
      {
        key: "FrequencyMonths", label: "PM Frequency (Months)", type: "select", options: ["1", "3", "6", "12"],
        onChange: (value, current) => {
          if (!value || !current.LastPM) return { ...current, FrequencyMonths: value };
          const d = new Date(current.LastPM);
          d.setMonth(d.getMonth() + parseInt(value, 10));
          return { ...current, FrequencyMonths: value, NextDue: d.toISOString().slice(0, 10) };
        },
      },
      {
        key: "LastPM", label: "Last PM Done On", type: "date",
        onChange: (value, current) => {
          if (!value || !current.FrequencyMonths) return { ...current, LastPM: value };
          const d = new Date(value);
          d.setMonth(d.getMonth() + parseInt(current.FrequencyMonths, 10));
          return { ...current, LastPM: value, NextDue: d.toISOString().slice(0, 10) };
        },
      },
      { key: "NextDue", label: "Next Due Date", type: "date", disabled: true },
      { key: "Downtime", label: "Downtime (Hours)", type: "text" },
    ],

    "Checklist & Execution": [
      { key: "SparesUsed", label: "Spares / Parts Replaced", type: "text" },
      { key: "Checklist", label: "PM Checklist / Activities Performed", type: "textarea" },

    ],

    "Result & Sign-off": [
      { key: "LastResult", label: "Last PM Outcome", type: "select", options: ["Satisfactory", "Unsatisfactory", "Partial"] },
      { key: "RequalificationTriggered", label: "Requalification Triggered?", type: "select", options: ["Yes", "No"] },
      { key: "PerformedBy", label: "Performed By", type: "select", options: options.personnel?.map(g => g.label) || [] },
      { key: "VerifiedBy", label: "Verified By", type: "select", options: options.personnel?.map(g => g.label) || [] },
      { key: "Remarks", label: "Remarks", type: "textarea" },
    ],
  },
});

export const pmRequiredFieldsList = ["EquipmentName", "FrequencyMonths", "LastPM"];

export const pmTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "EquipmentName", label: "Equipment" },
  { key: "LastPM", label: "Last PM", render: (r) => (r.LastPM || "").slice(0, 10) },
  { key: "NextDue", label: "Next Due", render: (r) => (r.NextDue || "").slice(0, 10) },
  { key: "LastResult", label: "Result" },
  { key: "Status", label: "Status" },
];

// ============================================== CAPA ==============================================

export const capaTabs = ["entry"];

export const capaWidthConfig = {
  "Problem Statement": "col-span-full",
  "Root Cause": "col-span-full",
  "Correction (Immediate Fix)": "col-span-full",
  "Corrective Action": "col-span-full",
  "Preventive Action": "col-span-full",
  "Implementation Evidence / Verification": "col-span-full",
  "Effectiveness Check Criteria & Due": "col-span-full",
  "Target Completion Date": "col-span-1",
  "Effectiveness Review Due Date": "col-span-1",
};

export const capaFieldGroups = (options = {}) => ({
  entry: {
    "CAPA Details": [
      { key: "RecordNo", label: "Record Number", type: "text", disabled: true },
      { key: "InitiationDate", label: "Initiation Date", type: "date" },
      { key: "SourceType", label: "Source", type: "select", options: ["Deviation", "Complaint", "Audit Finding", "Incident", "Change Control", "OOS/OOT", "Management Review"] },
      { key: "SourceRef", label: "Source Reference No.", type: "text" },
      { key: "CapaType", label: "CAPA Type", type: "select", options: ["Corrective", "Preventive", "Corrective & Preventive"] },
      { key: "Department", label: "Department", type: "select", options: options.department?.map(g => g.label) || [] },
    ],

    "Root Cause Analysis": [
      { key: "RcaMethod", label: "Root Cause Analysis Method", type: "select", options: ["5-Why", "Fishbone", "FMEA", "Other"] },
      { key: "ProblemStatement", label: "Problem Statement", type: "textarea" },
      { key: "RootCause", label: "Root Cause", type: "textarea" },
    ],

    "Action Plan": [
      { key: "Correction", label: "Correction (Immediate Fix)", type: "textarea" },
      { key: "CorrectiveAction", label: "Corrective Action", type: "textarea" },
      { key: "PreventiveAction", label: "Preventive Action", type: "textarea" },
      { key: "ResponsiblePerson", label: "Responsible Person", type: "select", options: options.personnel?.map(g => g.label) || [] },
      { key: "TargetDate", label: "Target Completion Date", type: "date" },
    ],

    "Implementation & Effectiveness": [
      { key: "ImplementationEvidence", label: "Implementation Evidence / Verification", type: "textarea" },
      { key: "ImplementationDate", label: "Actual Implementation Date", type: "date" },
      { key: "EffectivenessCriteria", label: "Effectiveness Check Criteria & Due", type: "textarea" },
      { key: "EffectivenessDueDate", label: "Effective. Review Due Date", type: "date" },
      { key: "EffectivenessResult", label: "Effectiveness Result", type: "select", options: ["Pending", "Effective", "Not Effective"] },
    ],
  },
});

export const capaRequiredFieldsList = ["InitiationDate", "SourceType", "ProblemStatement"];

export const capaTableColumns = [
  // { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "SourceType", label: "Source" },
  { key: "SourceRef", label: "Source Ref." },
  { key: "Department", label: "Department" },
  { key: "TargetDate", label: "Target Date", render: (r) => (r.TargetDate || "").slice(0, 10) },
  { key: "EffectivenessResult", label: "Effectiveness" },
  { key: "Status", label: "Status" },
];

// ============================================== Change Controls ==============================================

export const changeControlTabs = ["entry"];

export const changeControlWidthConfig = {
  "Existing System / Current State": "col-span-full",
  "Proposed Change": "col-span-full",
  "Justification / Reason for Change": "col-span-full",
  "Impact Assessment (Quality, Validation, Regulatory, Stability, Docs, Training)": "col-span-full",
  "Linked Risk Assessment Ref.": "col-span-full",
  "Affected Documents / SOPs / Specs": "col-span-full",
  "Implementation Plan / Actions": "col-span-full",
  "Post-Implementation Effectiveness Review": "col-span-full",
  "Target Implementation Date": "col-span-1",
  "Actual Implementation Date": "col-span-1",
  "Product (if applicable)": "col-span-2",

};

export const changeControlFieldGroups = (options = {}) => ({
  entry: {
    "Change Details": [
      { key: "RecordNo", label: "Record Number", type: "text", disabled: true },
      { key: "InitiationDate", label: "Initiation Date", type: "date" },
      { key: "Department", label: "Initiating Department", type: "select", options: options.department?.map(g => g.label) || [] },
      { key: "ChangeType", label: "Change Type", type: "select", options: ["Process / Method", "Equipment", "Facility / Utility", "Document / SOP", "Software / System", "Supplier / Vendor", "Other"] },
      { key: "Product", label: "Product (if applicable)", type: "select", options: options.product?.map(g => g.label) || [] },
      { key: "ChangeNature", label: "Change Nature", type: "select", options: ["Temporary", "Permanent"] },
      { key: "Classification", label: "Change Classification", type: "select", options: ["Minor", "Major", "Critical"] },
    ],

    "Change Description": [
      { key: "CurrentState", label: "Existing System / Current State", type: "textarea" },
      { key: "ProposedChange", label: "Proposed Change", type: "textarea" },
      { key: "Justification", label: "Justification / Reason for Change", type: "textarea" },
    ],

    "Impact Assessment": [
      { key: "ImpactAssessment", label: "Impact Assessment (Quality, Validation, Regulatory, Stability, Docs, Training)", type: "textarea" },
      { key: "RiskAssessmentRef", label: "Linked Risk Assessment Ref.", type: "textarea" },
      { key: "AffectedDocuments", label: "Affected Documents / SOPs / Specs", type: "textarea" },
      { key: "TrainingImpact", label: "Training Impact / Required", type: "select", options: ["Yes", "No"] },
      { key: "ValidationImpact", label: "Validation / Qualification Impact", type: "select", options: ["Yes", "No"] },
      { key: "RegulatoryImpact", label: "Regulatory Filing Impact", type: "select", options: ["Notification Required", "Approval Required", "Not Applicable"] },
    ],

    "Implementation & Closure": [
      { key: "ImplementationPlan", label: "Implementation Plan / Actions", type: "textarea" },
      { key: "TargetDate", label: "Target Implementation Date", type: "date" },
      { key: "ActualImplementationDate", label: "Actual Implementation Date", type: "date" },
      { key: "EffectivenessCheck", label: "Post-Implementation Effectiveness Review", type: "textarea" },
    ],
  },
});

export const changeControlRequiredFieldsList = ["InitiationDate", "ChangeType", "Classification", "CurrentState", "ProposedChange"];

export const changeControlTableColumns = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Record No." },
  { key: "ChangeType", label: "Change Type" },
  { key: "Product", label: "Product" },
  { key: "Classification", label: "Classification" },
  { key: "TargetDate", label: "Target Date", render: (r) => (r.TargetDate || "").slice(0, 10) },
  { key: "Status", label: "Status" },
];
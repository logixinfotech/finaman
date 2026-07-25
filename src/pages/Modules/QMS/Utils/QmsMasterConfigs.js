const baseConfigs = {
  equipment: {
    masterType: "equipment",
    title: "Equipment Master",
    nameLabel: "Equipment Name",
    hasSettings: true,                 // 👈 sirf isme settings tab dikhega
    settingsApplName: "Equipment",      // 👈 appl_settings_meta.appl_name se match hona chahiye
    extraFields: [
      { key: "code", label: "Equipment Code", type: "code" },   // 👈 auto-generate, editable nahi
    ],
    columns: [
      { key: "Sr", label: "Sr" },
      { key: "group_name", label: "Equipment Name" },
      { key: "code", label: "Equipment Code" },
      { key: "status", label: "Status" },
    ],
    toForm: (r) => ({
      group_id: r.id,
      group_name: r.name,
      code: r.equipment_code || "",
      active: r.is_active === 1 || r.is_active === true,
    }),
    toDb: (f) => ({
      id: f.group_id ?? null,
      name: f.group_name,
      equipment_code: f.code || "",
      is_active: f.active ? 1 : 0,
    }),
  },

  instrument: {
    masterType: "instrument",
    title: "Instrument Master",
    nameLabel: "Instrument Name",
    hasSettings: true,
    settingsApplName: "Instrument",
    extraFields: [
      { key: "code", label: "Instrument Code", type: "code" },
    ],
    columns: [
      { key: "Sr", label: "Sr" },
      { key: "group_name", label: "Instrument Name" },
      { key: "code", label: "Instrument Code" },
      { key: "status", label: "Status" },
    ],
    toForm: (r) => ({
      group_id: r.id,
      group_name: r.name,
      code: r.instrument_code || "",
      active: r.is_active === 1 || r.is_active === true,
    }),
    toDb: (f) => ({
      id: f.group_id ?? null,
      name: f.group_name,
      instrument_code: f.code || "",
      is_active: f.active ? 1 : 0,
    }),
  },

  area: {
    masterType: "area",
    title: "Area / Location Master",
    nameLabel: "Area Name",
    hasSettings: false,
    extraFields: [
      { key: "gradeClass", label: "Grade Class", type: "dropdown", groupType: "GRADE" },   // 👈 USRGRP se
    ],
    columns: [
      { key: "Sr", label: "Sr" },
      { key: "group_name", label: "Area Name" },
      { key: "gradeClass", label: "Grade Class" },
      { key: "status", label: "Status" },
    ],
    toForm: (r) => ({
      group_id: r.id,
      group_name: r.name,
      gradeClass: r.grade_class || "",
      active: r.is_active === 1 || r.is_active === true,
    }),
    toDb: (f) => ({
      id: f.group_id ?? null,
      name: f.group_name,
      grade_class: f.gradeClass || "",
      is_active: f.active ? 1 : 0,
    }),
  },

  personnel: {
    masterType: "personnel",
    title: "Personnel Master",
    nameLabel: "Personnel Name",
    hasSettings: false,
    extraFields: [
      { key: "designation", label: "Designation", type: "dropdown", groupType: "DESG" },  // 👈 USRGRP se
      { key: "department", label: "Department", type: "dropdown", groupType: "DEP" },     // 👈 USRGRP se
    ],
    columns: [
      { key: "Sr", label: "Sr" },
      { key: "group_name", label: "Personnel Name" },
      { key: "designation", label: "Designation" },
      { key: "department", label: "Department" },
      { key: "status", label: "Status" },
    ],
    toForm: (r) => ({
      group_id: r.id,
      group_name: r.name,
      designation: r.designation || "",
      department: r.department || "",
      active: r.is_active === 1 || r.is_active === true,
    }),
    toDb: (f) => ({
      id: f.group_id ?? null,
      name: f.group_name,
      designation: f.designation || "",
      department: f.department || "",
      is_active: f.active ? 1 : 0,
    }),
  },

  supplier: {
    masterType: "supplier",
    title: "Supplier / Vendor Master",
    nameLabel: "Supplier Name",
    hasSettings: false,
    extraFields: [
      { key: "supplierType", label: "Supplier Type", type: "text" },
    ],
    columns: [
      { key: "Sr", label: "Sr" },
      { key: "group_name", label: "Supplier Name" },
      { key: "supplierType", label: "Supplier Type" },
      { key: "status", label: "Status" },
    ],
    toForm: (r) => ({
      group_id: r.id,
      group_name: r.name,
      supplierType: r.supplier_type || "",
      active: r.is_active === 1 || r.is_active === true,
    }),
    toDb: (f) => ({
      id: f.group_id ?? null,
      name: f.group_name,
      supplier_type: f.supplierType || "",
      is_active: f.active ? 1 : 0,
    }),
  },

  product: {
    masterType: "product",
    title: "Product Master",
    nameLabel: "Product Name",
    hasSettings: false,
    extraFields: [],
    columns: [
      { key: "Sr", label: "Sr" },
      { key: "group_name", label: "Product Name" },
      { key: "status", label: "Status" },
    ],
    toForm: (r) => ({
      group_id: r.id,
      group_name: r.name,
      active: r.is_active === 1 || r.is_active === true,
    }),
    toDb: (f) => ({
      id: f.group_id ?? null,
      name: f.group_name,
      is_active: f.active ? 1 : 0,
    }),
  },
};

export const qmsMasterConfigs = {
  ...baseConfigs,
  vendor: baseConfigs.supplier,
  products: baseConfigs.product,
};
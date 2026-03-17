import { useEffect, useState, useCallback } from "react";
import CompanyMasterForm from "./CompanyMasterEntry";
import CompanyMasterFilterForm from "./CompanyMasterList";
import Table from "../../components/Reusable/Table";
import ERPPrintPreview from "../../components/Reusable/ERPPrintPreview";
import { showToast, alertError, confirmDelete } from "../../components/Reusable/alert";
import { Pencil, Trash2, Printer } from "lucide-react";
import IconButton from "../../components/Reusable/IconButton";
import { getCompanyList, createCompany, updateCompany, deleteCompany } from "../../utils/api";
import { initERPShortcuts } from "../../utils/erpShortcuts";
import { useERPMode } from "../../components/Reusable/useFormMode"; // Import your new hook

const initialState = {
  company_id: null,
  company_name: "",
  trade_name: "",
  company_type: "",
  registration_number: "",
  phone_number: "",
  email_address: "",
  gstin_number: "",
  pan_number: "",
  primary_business_sector: "",
  company_status: "Active",
  city: "",
  state: "",
  country: "",
};
const companyPrintSections = [
  {
    type: "fields",
    title: "Basic Information",
    fields: [
      { label: "Company Name", key: "company_name" },
      { label: "Trade Name", key: "trade_name" },
      { label: "Company Type", key: "company_type" },
      { label: "Registration No", key: "registration_number" }
    ]

  },
  {
    type: "fields",
    title: "Contact Information",
    fields: [

      { label: "Phone", key: "phone_number" },

      { label: "Email", key: "email_address" },

      { label: "City", key: "city" },

      { label: "State", key: "state" },

      { label: "Country", key: "country" }

    ]

  },

  {

    type: "fields",

    title: "Legal Details",

    fields: [

      { label: "GSTIN", key: "gstin_number" },

      { label: "PAN", key: "pan_number" }

    ]

  }

];
const columns = [

  { key: "company_name", label: "Company Name" },

  { key: "trade_name", label: "Trade Name" },

  { key: "company_type", label: "Type" },

  { key: "registration_number", label: "Reg. No" },

  { key: "phone_number", label: "Phone" },

  { key: "email_address", label: "Email" },

  { key: "gstin_number", label: "GSTIN" },

  { key: "pan_number", label: "PAN" },

  { key: "primary_business_sector", label: "Business Sector" },

  {

    key: "company_status",

    label: "Status",

    render: (row) => (

      <span className={`status-badge ${row.company_status?.toLowerCase()}`}>

        {row.company_status}

      </span>

    )

  }

];

const CompanyMasterPage = () => {
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
 
  const {
    mode, setMode,
    formData, setFormData,
    showForm, setShowForm,
    saving, canPrint,
    handleView, handleAdd, handleModify, performSave,
    isAddMode, isViewMode, isEditMode
  } = useERPMode(
    initialState, 
    async (data) => data.company_id ? await updateCompany(data.company_id, data) : await createCompany(data),
    () => loadCompanyList(filters)
  );
 
  const loadCompanyList = useCallback(async (filterParams = {}) => {
    try {
      setLoading(true);
      const data = await getCompanyList(filterParams);
      setList(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCompanyList(); }, [loadCompanyList]);

  // 2. Wrap the Save Logic
  const handleSave = async () => {
    const response = await performSave("company_id");
    if (response?.success) {
      setPrintData(response.data);
      showToast({
        icon: "success",
        title: isEditMode ? "Updated successfully" : "Added successfully",
      });
    } else if (response?.message) {
      alertError("Error", response.message);
    }
  }; 
  const handleDelete = async (row) => {
    const id = row?.company_id || formData?.company_id;
    if (!id) return alertError("Error", "ID missing");

    const confirmed = await confirmDelete({
      title: `Delete "${row?.company_name || formData?.company_name}"?`,
      text: "This action cannot be undone",
    });
    if (!confirmed) return;

    const res = await deleteCompany(id);
    if (res.success) {
      showToast({ icon: "success", title: "Deleted successfully" });
      setShowForm(false);
      loadCompanyList(filters);
    }
  };
 
  const handlePrint = (row) => {
    setPrintData(row || formData);
    setShowPreview(true);
  };
 
  useEffect(() => {
    const cleanup = initERPShortcuts({
      onNew: handleAdd,
      onSave: handleSave,
      onEsc: () => setShowForm(false),
    });
    return cleanup;
  }, [handleAdd, handleSave]);

  const applyFilter = () => loadCompanyList(filters);
  const clearFilter = () => { setFilters({}); loadCompanyList(); };

  return (
    <div>
      {showPreview ? (
        <ERPPrintPreview
          title="Company Details"
          data={printData}
          sections={companyPrintSections}  
          logo="/finaman-logo.png"
          onBack={() => setShowPreview(false)}
        />
      ) : showForm ? (
        <CompanyMasterForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onDelete={handleDelete}
          onPrint={handlePrint}
          mode={mode}  
          saving={saving}
          canPrint={canPrint}
          onNewEntry={handleAdd}
          onModify={handleModify}
        />
      ) : (
        <Table
          title="Company List"
          data={list}
          columns={columns} 
          rowKey="company_id"
          onRefresh={() => loadCompanyList(filters)}
          showForm={showFilter}
          onToggleFilter={() => setShowFilter(p => !p)}
          onRowDoubleClick={(row) => handleView(row)} 
          formComponent={
            <CompanyMasterFilterForm
              filters={filters}
              setFilters={setFilters}
              onApply={applyFilter}
              onClear={clearFilter}
            />
          }
          onAdd={handleAdd}
          actions={(row) => (
            <div className="flex gap-2 justify-end">
              <IconButton variant="edit" onClick={(e) => { e.stopPropagation(); handleView(row); handleModify(); }}>
                <Pencil size={14} />
              </IconButton>
              <IconButton variant="delete" onClick={(e) => { e.stopPropagation(); handleDelete(row); }}>
                <Trash2 size={14} />
              </IconButton>
              <IconButton variant="print" onClick={(e) => { e.stopPropagation(); handlePrint(row); }}>
                <Printer size={14} />
              </IconButton>
            </div>
          )}
        />
      )}
    </div>
  );
};

export default CompanyMasterPage;
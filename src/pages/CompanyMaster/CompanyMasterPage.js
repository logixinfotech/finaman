import { useEffect, useState, useCallback } from "react";
import CompanyMasterForm from "./CompanyMasterEntry";
import CompanyMasterFilterForm from "./CompanyMasterList";
import Table from "../../components/Reusable/Table";
import ERPPrintPreview from "../../components/Reusable/ERPPrintPreview";
import {
  showToast,
  alertError,
  confirmDelete,
} from "../../components/Reusable/alert";
import { Pencil, Trash2 } from "lucide-react";
import IconButton from "../../components/Reusable/IconButton";
import { Printer } from "lucide-react";
import {
  getCompanyList,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../../utils/api";
import { initERPShortcuts } from "../../utils/erpShortcuts";
 
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
  const [formData, setFormData] = useState(initialState);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCompanyList = useCallback(async (filterParams = {}) => {
    try {
      const data = await getCompanyList(filterParams);
      setList(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanyList();
  }, [loadCompanyList]);

const handleAdd = useCallback(() => {
  setSelectedRow(null);
  setFormData(initialState);
  setShowForm(true);
}, []);


  const handleEdit = (row) => {
    setSelectedRow(row);

    const mappedRow = {
      ...row,
      phone: row.phone_number,
      email: row.email_address,
      gstin: row.gstin_number,
      pan_no: row.pan_number,
      account_no: row.bank_account_number,
      ifsc_code: row.bank_ifsc_code,
      address: row.business_address,
      cin_no: row.cin_number,
    };

    setFormData(mappedRow);
    setShowForm(true);
  };
  const handlePrint = (row) => {
    setPrintData(row);
    setShowPreview(true);
  };
  const handleDelete = async (row) => {
    const confirmed = await confirmDelete({
      title: `Delete "${row.company_name}"?`,
      text: "This action cannot be undone",
    });

    if (!confirmed) return;

    try {
      await deleteCompany(row.company_id);
      await loadCompanyList(filters);

      showToast({
        icon: "success",
        title: "Deleted successfully",
      });
    } catch (err) {
      alertError("Delete failed", "Something went wrong");
    }
  };
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {

    if (saving) return;

    try {

      setSaving(true);

      let response;

      if (formData.company_id) {
        response = await updateCompany(formData.company_id, formData);
      } else {
        response = await createCompany(formData);
      }

      if (!response.success) {

        if (response.field) {
          alertError("Validation", response.message);
        } else {
          alertError("Error", response.message);
        }

        return;
      }

      await loadCompanyList(filters);
      setPrintData({ ...formData });
      setShowPreview(true);
      setShowForm(false);

      showToast({
        icon: "success",
        title: formData.company_id
          ? "Updated successfully"
          : "Added successfully",
      });

    } catch (err) {

      alertError("Error", "Something went wrong");

    } finally {

      setSaving(false);

    }

  };

  const applyFilter = async () => {
    await loadCompanyList(filters);
  };

  const clearFilter = async () => {
    setFilters({});
    await loadCompanyList();
  }; 

useEffect(() => {
  const cleanup = initERPShortcuts({
    onNew: handleAdd,
    onSave: handleSave,
    onEsc: () => setShowForm(false),
  });

  return cleanup;
}, [handleAdd, handleSave]);
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
          saving={saving}
        />

      ) : (

        <Table
          title="Company List"
          data={list}
          columns={columns}
          rowKey="company_id"
          selectedRow={selectedRow}
          onRefresh={() => loadCompanyList(filters)}

          showForm={showFilter}
          onToggleFilter={() => setShowFilter(p => !p)}

          formComponent={
            <CompanyMasterFilterForm
              filters={filters}
              setFilters={setFilters}
              onApply={applyFilter}
              onClear={clearFilter}
            />
          }

          onAdd={handleAdd} actions={(row) => (
            <div className="flex gap-2 justify-end">

              <IconButton
                variant="edit"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(row);
                }}
              >
                <Pencil size={14} />
              </IconButton>

              <IconButton
                variant="delete"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row);
                }}
              >
                <Trash2 size={14} />
              </IconButton>
              <IconButton
                variant="print"
                title="Print"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrint(row);
                }}
              >
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
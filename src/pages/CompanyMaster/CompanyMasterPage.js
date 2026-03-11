import { useEffect, useState } from "react";
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

import {
  getCompanyList,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../../utils/api";

import useEnterAsTab from "../../components/Reusable/useEnterAsTab";
import { useNavigate } from "react-router-dom";

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
    title: "Basic Information",
    fields: [
      { label: "Company Name", key: "company_name" },
      { label: "Trade Name", key: "trade_name" },
      { label: "Company Type", key: "company_type" },
      { label: "Registration No", key: "registration_number" }
    ]
  },

  {
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
    title: "Legal Details",
    fields: [
      { label: "GSTIN", key: "gstin_number" },
      { label: "PAN", key: "pan_number" }
    ]
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

  useEffect(() => {
    loadCompanyList();
  }, []);

  const loadCompanyList = async (filterParams = {}) => {
    try {
      const data = await getCompanyList(filterParams);
      setList(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = () => {
    setSelectedRow(null);
    setFormData(initialState);
    setShowForm(true);
  };

  useEffect(() => {
    const handleShortcut = (e) => {

      if (e.key === "F2") {

        const tag = document.activeElement.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea") return;

        e.preventDefault();
        handleAdd();
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
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

  const handleSave = async () => {

    if (!formData.company_name) {
      alertError("Validation", "Company Name  ");
      return;
    }

    try {

      if (formData.company_id) {
        await updateCompany(formData.company_id, formData);
      } else {
        await createCompany(formData);
      }

      await loadCompanyList(filters);

      setPrintData(formData);
      setShowPreview(true);
      setShowForm(false);

      showToast({
        icon: "success",
        title: formData.company_id
          ? "Updated successfully"
          : "Added successfully",
      });

    } catch (err) {
      alertError("Error", "Something went wrong while saving");
    }
  };

  const applyFilter = async () => {
    await loadCompanyList(filters);
  };

  const clearFilter = async () => {
    setFilters({});
    await loadCompanyList();
  };
  const navigate = useNavigate();

  useEnterAsTab("form", {
    save: handleSave,              // Ctrl + S
    newEntry: handleAdd,           // F2
    closeTab: () => navigate(-1),  // Ctrl + W
    focusSearch: () =>
      document.getElementById("searchInput")?.focus(),  // Ctrl + F
    closeModal: () => setShowForm(false),  // ESC
  });

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

  return (
    <div className="company-master-page">

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

          headerAction={
            <button
              onClick={handleAdd}
              className="
      flex items-center gap-2
      px-4 py-2
      rounded-lg
      bg-gradient-to-r from-emerald-500 to-green-600
      hover:from-emerald-600 hover:to-green-700
      text-white text-sm font-semibold
      shadow-md hover:shadow-lg
      transition-all duration-200
      active:scale-95
    "
              title="Add Company"
            >
              <span className="text-lg leading-none">＋</span>
              Add (F2)
            </button>
          }

          actions={(row) => (
            <div className="flex items-center justify-end gap-2">

              {/* EDIT BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(row);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg
                 bg-blue-50 text-blue-600
                 hover:bg-blue-100 hover:shadow-md
                 transition-all duration-200"
                title="Edit"
              >
                <Pencil size={16} />
              </button>

              {/* DELETE BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg
                 bg-red-50 text-red-600
                 hover:bg-red-100 hover:shadow-md
                 transition-all duration-200"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>

            </div>
          )}
        />

      )}

    </div>
  );
};

export default CompanyMasterPage;
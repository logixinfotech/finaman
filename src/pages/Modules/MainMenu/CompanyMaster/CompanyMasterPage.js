import { useEffect, useState, useCallback } from "react";
import CompanyMasterForm from "./CompanyMasterEntry";
import CompanyMasterFilterForm from "./CompanyMasterList";
import Table from "../../../../components/Reusable/table/Table";
import ERPPrintPreview from "../../../../components/Reusable/ERPPrintPreview";
import { showToast, alertError, confirmDelete } from "../../../../components/Reusable/alert"; 
import { getCompanyList, createCompany, updateCompany, deleteCompany } from "../../../../utils/api";
import { setERPHandlers } from "../../../../utils/erpShortcuts";
import { useERPMode } from "../../../../components/Reusable/form/useFormMode";

const initialState = {
  company_id: null,
  company_name: "",
  trade_name: "",
  business_type: "", 
  business_address: "",
  postal_code: "",
  phone_number: "",
  email_address: "",
  website_url: "",
  country: "",
  state: "",
  city: "",
  gstin_number: "",
  pan_number: "",
  cin_number: "",
  tan_no: "",
  gst_type: "",
  iec_code: "",
  msme_no: "",
  drug_lic_no: "",
  drug_valid_from: "",
  drug_valid_to: "",
  fssai_no: "",
  fssai_from: "",
  fssai_to: "",
  mfg_lic_no: "",
  mfg_from: "",
  mfg_to: "",
  bank_name: "",
  bank_account_number: "",
  bank_ifsc_code: "",
  branch_name: "",
  account_type: "",
  bank_address: "",
  swift_code: "",
  upi_id: "",
  micr_code: "",
  contact_person: "",
  designation: "",
  alt_phone: "",
  alt_email: "",
  default_gst_rate: 0,
  default_tax_type: "Exclusive",
  tds_applicable: false,
  tcs_applicable: false,
  tax_method: "FIFO",
  default_language: "English",
  date_format: "DD/MM/YYYY",
  number_format: "Indian",
  fin_year_from: "",
  fin_year_to: "",
  fy_lock: false,
  auto_backup: false,
  company_status: "Active",
  logo: "",
};
const companyPrintSections = [
  {
    type: "fields",
    title: "Basic Information",
    fields: [
      { label: "Company Name", key: "company_name" },
      { label: "Trade Name", key: "trade_name" },
      { label: "Business Type", key: "business_type" },
      { label: "Registration No", key: "registration_number" },
      { label: "CIN No", key: "cin_number" }
    ]
  },
  {
    type: "fields",
    title: "Contact Information",
    fields: [
      { label: "Phone", key: "phone_number" },
      { label: "Email", key: "email_address" },
      { label: "Address", key: "business_address" },
      { label: "City", key: "city" },
      { label: "PIN Code", key: "postal_code" }
    ]
  },
  {
    type: "fields",
    title: "Tax & Bank Details",
    fields: [
      { label: "GSTIN", key: "gstin_number" },
      { label: "PAN", key: "pan_number" },
      { label: "Bank Name", key: "bank_name" },
      { label: "A/C Number", key: "bank_account_number" }
    ]
  }
];

const columns = [
  { key: "company_name", label: "Company Name" },
  { key: "trade_name", label: "Trade Name" },
  { key: "phone_number", label: "Phone" },
  { key: "email_address", label: "Email" },
  { key: "gstin_number", label: "GSTIN" },
  { key: "pan_number", label: "PAN" },
  { key: "business_type", label: "Type" },  
  {
    key: "company_status",
    label: "Status",
    render: (row) => (
      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${row.company_status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
        {row.company_status}
      </span>
    )
  }
];

const CompanyMasterPage = ({ tab }) => {
  const [list, setList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const {
    mode,
    formData, setFormData,
    showForm, setShowForm,
    saving, canPrint, rights,
    handleView, handleAdd, handleModify, performSave, handleEditCancel,
    isEditMode
  } = useERPMode(
 initialState,
    async (data) => data.company_id ? await updateCompany(data.company_id, data) : await createCompany(data),
    () => loadCompanyList(filters),
     tab?.appl_name
); 
const loadCompanyList = useCallback(async (currentFilters, currentPage, currentPageSize) => {
  try {
    setLoading(true);

    const response = await getCompanyList({
      page: currentPage,
      pageSize: currentPageSize,
      filters: currentFilters,
    });

    setList(response.data || []);
    setTotalRecords(response.total || 0);

  } catch (error) {
    console.error("Load Failed", error);
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  loadCompanyList(filters, page, pageSize);
}, [page, pageSize, filters]);
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode]);

  const handleRowSelect = (row) => {
    const index = list.findIndex(
      (item) => item.company_id === row.company_id
    );

    if (index !== -1) {
      setCurrentIndex(index);
      setFormData(list[index]);
    }

    handleView(row);
  };
  const handleNextRecord = () => {
    setCurrentIndex((prev) => (prev < list.length - 1 ? prev + 1 : prev));
  };
const handlePageChange = (newPage, newPageSize) => {
  if (newPage === page && newPageSize === pageSize) return;

  setPage(newPage);
  if (newPageSize !== pageSize) {
    setPageSize(newPageSize);
    setPage(1);
  }
};
  const handlePrevRecord = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleFirstRecord = () => {
    setCurrentIndex(0);
  };

  const handleLastRecord = () => {
    setCurrentIndex(list.length - 1);
  };
const handleSave = async () => {
  const response = await performSave("company_id");

  if (response?.success) {
    showToast({
      icon: "success",
      title: isEditMode ? "Updated successfully" : "Added successfully",
    }); 
    await loadCompanyList(filters, page, pageSize);
     
  } else if (response?.message) {
    alertError("Error", response.message);
  }
};
const handleSearch = (searchTerm) => {
  setFilters(prev => ({
    ...prev,
    company_name: searchTerm
  }));
  setPage(1);
};

const applyFilter = () => {
  setPage(1);
};

const clearFilter = () => {
  setFilters({});
  setPage(1);
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
      loadCompanyList(filters, page, pageSize);
    }
  };
  const handlePrint = (row) => {
    setPrintData(row || formData);
    setShowPreview(true);
  };
  useEffect(() => {
    setERPHandlers({
      onNextRecord: handleNextRecord,
      onPrevRecord: handlePrevRecord,
      onFirstRecord: handleFirstRecord,
      onLastRecord: handleLastRecord,
      onNew: handleAdd,
      onSave: handleSave,
      onEsc: () => setShowForm(false),
    });
  }, [currentIndex, list]);
 
  const currentRecord = totalRecords > 0 ? currentIndex + 1 : 0;

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
          currentRecord={currentRecord}
          totalRecords={totalRecords}
          onEditCancel={handleEditCancel}
            rights={rights}
        />
      ) : (
        <Table
          title="Company List"
          data={list}
          columns={columns}
          rowKey="company_id"
          loading={loading}
         onRefresh={() => loadCompanyList(filters, page, pageSize)}
onSearch={handleSearch}
          showForm={showFilter}
          onToggleFilter={() => setShowFilter(p => !p)}
serverPagination={true} // Toggle this based on your needs
      totalRecords={totalRecords}
      onPageChange={handlePageChange} 
      defaultPageSize={pageSize}
          formComponent={
            <CompanyMasterFilterForm
              filters={filters}
              setFilters={setFilters}
              onApply={applyFilter}
              onClear={clearFilter}
            />
          }

         onAdd={rights.add === 1 ? handleAdd : null}
          onRowDoubleClick={(row) => handleRowSelect(row)}
          onDeleteMultiple={async (ids) => {
            const confirmed = await confirmDelete({
              title: `Delete ${ids.length} records?`,
              text: "This action cannot be undone",
            });

            if (!confirmed) return;
            await Promise.all(ids.map(id => deleteCompany(id)));

            showToast({ icon: "success", title: "Deleted successfully" });

            loadCompanyList(filters);
          }}
  
        />
      )}

    </div>
  );
};

export default CompanyMasterPage;
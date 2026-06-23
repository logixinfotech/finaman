import { useEffect, useState, useCallback } from "react";
import CompanyMasterForm from "./CompanyMasterEntry";
import CompanyMasterFilterForm from "./CompanyMasterList";
import Table from "../../../../components/Reusable/table/Table";
import ERPPrintPreview from "../../../../components/Reusable/ERPPrintPreview";
import {
  showToast,
  alertError,
  confirmDelete,
} from "../../../../components/Reusable/alert";
import {
  getCompanyList,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../../../../utils/api";
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
      { label: "CIN No", key: "cin_number" },
    ],
  },
  {
    type: "fields",
    title: "Contact Information",
    fields: [
      { label: "Phone", key: "phone_number" },
      { label: "Email", key: "email_address" },
      { label: "Address", key: "business_address" },
      { label: "City", key: "city" },
      { label: "PIN Code", key: "postal_code" },
    ],
  },
  {
    type: "fields",
    title: "Tax & Bank Details",
    fields: [
      { label: "GSTIN", key: "gstin_number" },
      { label: "PAN", key: "pan_number" },
      { label: "Bank Name", key: "bank_name" },
      { label: "A/C Number", key: "bank_account_number" },
    ],
  },
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
      <span
        className={`px-2 py-1 text-xs rounded ${  row.company_status === "Active"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-600"
          }`}
      >
        {row.company_status}
      </span>
    ),
  },
];

const CompanyMasterPage = ({ tab }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const [formTab, setFormTab] = useState("basic");
  const [showPreview, setShowPreview] = useState(false);
  const [printData, setPrintData] = useState(null);
  const {
    mode,
    formData,
    setFormData,
    showForm,
    setShowForm,
    saving,
    rights,
    canPrint,
    handleView,
    handleAdd,
    handleModify,
    performSave,
    handleEditCancel,
    isEditMode,
    activeTab,
    setActiveTab,
  } = useERPMode(
    initialState,
    async (data, isEdit) => {
      const payload = {
        ...data,
        appl_name: tab?.appl_name,
      };
      if (isEdit) {
        return await updateCompany(data.company_id, payload);
      } else {
        return await createCompany(payload);
      }
    },
    () => loadCompanyList(filters, page, pageSize),
    tab?.appl_name,
  );

  const handleTabChange = useCallback(
    (targetTab) => {
      setActiveTab(targetTab); // ← always track
      if (targetTab === "search") setShowForm(false);
      if (targetTab === "entry") setShowForm(true);
    },
    [setShowForm, setActiveTab],
  );

  const loadCompanyList = useCallback(
    async (currentFilters = {}, currentPage = 1, currentPageSize = 100) => {
      try {
        setLoading(true);
        const response = await getCompanyList({
          page: currentPage,
          pageSize: currentPageSize,
          filters: currentFilters,
        });
        setList(
          Array.isArray(response.data)
            ? response.data
            : response?.data?.data || [],
        );
        setTotalRecords(response.total ?? response?.data?.total ?? 0);
      } catch (err) {
        alertError("Fetch Error", "Failed to load companies");
      } finally {
        setLoading(false);
      }
    },
    [],
  );
  useEffect(() => {
    loadCompanyList(filters, page, pageSize);
  }, [page, pageSize, filters, loadCompanyList]);
  useEffect(() => {
    if (showForm && mode === "view" && list.length > 0) {
      setFormData(list[currentIndex]);
    }
  }, [currentIndex, list, showForm, mode, setFormData]);

  const handleRowSelect = useCallback(
    (row) => {
      const index = list.findIndex(
        (item) => item.company_id === row.company_id,
      );
      if (index !== -1) setCurrentIndex(index);
      handleView(row);
      setShowForm(true);
    },
    [list, handleView, setShowForm],
  );
  const handleSave = useCallback(async () => {
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
  }, [performSave, isEditMode, loadCompanyList, filters, page, pageSize]);
  const handleDelete = useCallback(
    async (row) => {
      const id = row?.company_id ?? formData?.company_id;
      const name = row?.company_name ?? formData?.company_name;
      if (!id) return alertError("Error", "Company ID missing");

      const confirmed = await confirmDelete({
        title: `Delete "${name}"?`,
        text: "This action cannot be undone.",
      });
      if (!confirmed) return;

      const res = await deleteCompany(id);
      if (res?.success) {
        showToast({ icon: "success", title: "Deleted successfully" });
        setShowForm(false);
        await loadCompanyList(filters, page, pageSize);
      } else {
        alertError("Error", res?.message ?? "Delete failed");
      }
    },
    [formData, setShowForm, loadCompanyList, filters, page, pageSize],
  );

  // const handleDelete = async (row) => {
  //   const confirm = await confirmDelete({ title: `Delete "${row.employee_name}"?` });
  //   if (confirm) {
  //     const res = await deleteCompany(row.employee_id);
  //     if (res?.data?.success) {
  //       await loadCompanyList();
  //       showToast({ icon: "success", title: "Deleted" });
  //       // loadEmployees();
  //       setShowForm(false);
  //     }
  //   }
  // };

  const handlePrint = useCallback(
    (row) => {
      setPrintData(row ?? formData);
      setShowPreview(true);
    },
    [formData],
  );

  const handleSearch = useCallback((searchTerm) => {
    setFilters((prev) => ({ ...prev, company_name: searchTerm }));
    setPage(1);
  }, []);

  const applyFilter = useCallback(() => {
    setPage(1);
  }, []);

  const clearFilter = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage, newPageSize) => {
    setPageSize(newPageSize);
    setPage(newPage);
    // No need to manually call loadCompanyList here; the useEffect handles it
  }, []);

  useEffect(() => {
    setERPHandlers({
      onNextRecord: () =>
        setCurrentIndex((p) => Math.min(p + 1, list.length - 1)),
      onPrevRecord: () => setCurrentIndex((p) => Math.max(p - 1, 0)),
      onFirstRecord: () => setCurrentIndex(0),
      onLastRecord: () => setCurrentIndex(list.length - 1),
      onNew: handleAdd,
      onSave: handleSave,
      onEsc: () => setShowForm(false),
    });
  }, [list, handleAdd, handleSave, setShowForm]);
  const currentRecord = totalRecords > 0 ? currentIndex + 1 : 0;
  return (
    <div className="h-full">
      {showPreview ? (
        <ERPPrintPreview
          title="Company Details"
          data={printData}
          sections={companyPrintSections}
          logo="/finaman-logo.png"
          defaultTemplate="detail"
          watermark="DRAFT"
          onBack={() => setShowPreview(false)}
        />
      ) : showForm ? (
        <CompanyMasterForm
          formData={formData}
          setFormData={setFormData}
          mode={mode}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          onDelete={handleDelete}
          onPrint={handlePrint}
          onModify={handleModify}
          onNewEntry={handleAdd}
          onEditCancel={handleEditCancel}
          saving={saving}
          headerActiveTab={activeTab}
          showSettingsTab={true}
          rights={rights}
          canPrint={canPrint}
          currentRecord={currentRecord}
          totalRecords={totalRecords}
          activeTab={formTab}
          onFormTabChange={setFormTab}
          onHeaderTabChange={handleTabChange}
        />
      ) : (
        <Table
          title="Company Master"
          activeTab="search" 
             onTabChange={handleTabChange}
          data={list}
          columns={columns}
          rowKey="company_id"
          loading={loading}
          onAdd={rights?.add === 1 ? handleAdd : null}
          onRefresh={() => loadCompanyList(filters, page, pageSize)}
          onSearch={handleSearch}
          showForm={showFilter}
          onToggleFilter={() => setShowFilter((p) => !p)}
          formComponent={
            <CompanyMasterFilterForm
              filters={filters}
              setFilters={setFilters}
              onApply={applyFilter}
              onClear={clearFilter}
            />
          }
          serverPagination={true}
          totalRecords={totalRecords}
          onPageChange={handlePageChange}
          defaultPageSize={pageSize}
          onRowDoubleClick={handleRowSelect}
          onDeleteMultiple={async (ids) => {
            const confirmed = await confirmDelete({
              title: `Delete ${ids.length} record${ids.length > 1 ? "s" : ""}?`,
              text: "This action cannot be undone.",
            });
            if (!confirmed) return;

            try {
              setLoading(true); // Ensure loading state is triggered
              await Promise.all(ids.map((id) => deleteCompany(id)));
              showToast({ icon: "success", title: "Deleted successfully" });
            } catch (err) {
              alertError("Delete Error", "Some records could not be deleted");
            } finally {
              await loadCompanyList(filters, page, pageSize);
            }
          }}
        />
      )}
    </div>
  );
};

export default CompanyMasterPage;

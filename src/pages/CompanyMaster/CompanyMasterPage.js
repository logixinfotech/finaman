import { useEffect, useState } from "react";
import CompanyMasterForm from "./CompanyMasterEntry";
import CompanyMasterFilterForm from "./CompanyMasterList";
import Table from "../../components/Reusable/Table";
import {
  showToast,
  alertError,
  confirmDelete,
} from "../../components/Reusable/alert";

import { Pencil, Trash2 } from "lucide-react";
import IconButton from "../../components/Reusable/IconButton";

import {
  getCompanyList,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../../utils/api";

const initialState = {
  company_id: null,
  company_name: "",
  trade_name: "",
  company_type: "",
  city: "",
  state: "",
  country: "",
};

const CompanyMasterPage = () => {
  const [list, setList] = useState([]);
  const [formData, setFormData] = useState(initialState);
  const [selectedRow, setSelectedRow] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);

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

  const handleEdit = (row) => {
    setSelectedRow(row);
    setFormData(row);
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
    try {
      let res;

      if (formData.company_id) {
        res = await updateCompany(formData.company_id, formData);
      } else {
        res = await createCompany(formData);
      }

      await loadCompanyList(filters);
      setShowForm(false);
      setFormData(initialState);

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

  const columns = [
    { key: "company_id", label: "ID" },
    { key: "company_name", label: "Company Name" },
    { key: "trade_name", label: "Trade Name" },
    { key: "company_type", label: "Type" },
    { key: "city", label: "City" },
  ];

  return (
    <div className="company-master-page">

      {showForm ? (
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
            <button className="btn add" onClick={handleAdd}>
              Add Company
            </button>
          }

          actions={(row) => (
            <div className="flex gap-2 justify-end">
              <IconButton
                variant="edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(row);
                }}
              >
                <Pencil />
              </IconButton>

              <IconButton
                variant="delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row);
                }}
              >
                <Trash2 />
              </IconButton>
            </div>
          )}
        />
      )}
    </div>
  );
};

export default CompanyMasterPage;
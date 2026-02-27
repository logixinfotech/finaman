const CompanyMasterFilterForm = ({
  filters,
  setFilters,
  onApply,
  onClear,
}) => {
  return (
    <div className="premium-filter">

      <div className="form-field">
        <label>Company Name</label>
        <input
          className="form-input"
          value={filters.company_name || ""}
          onChange={(e) =>
            setFilters({ ...filters, company_name: e.target.value })
          }
        />
      </div>

      <div className="form-field">
        <label>Type</label>
        <input
          className="form-input"
          value={filters.company_type || ""}
          onChange={(e) =>
            setFilters({ ...filters, company_type: e.target.value })
          }
        />
      </div>

      <div className="filter-actions">
        <button className="btn primary" onClick={onApply}>
          Apply
        </button>
        <button className="btn ghost" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default CompanyMasterFilterForm;
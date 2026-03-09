const CompanyMasterFilterForm = ({
  filters,
  setFilters,
  onApply,
  onClear,
}) => {
  return (
    <div className="w-full bg-white border rounded-md px-3 py-2">
      <div className="flex flex-wrap items-center gap-3">

        {/* Company Name */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 whitespace-nowrap">
            Company
          </label>
          <input
            type="text"
            value={filters.company_name || ""}
            onChange={(e) =>
              setFilters({ ...filters, company_name: e.target.value })
            }
            placeholder="Name"
            className="h-8 w-44 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Type */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 whitespace-nowrap">
            Type
          </label>
          <input
            type="text"
            value={filters.company_type || ""}
            onChange={(e) =>
              setFilters({ ...filters, company_type: e.target.value })
            }
            placeholder="Type"
            className="h-8 w-32 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onApply}
            className="h-8 px-3 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply
          </button>

          <button
            onClick={onClear}
            className="h-8 px-3 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100"
          >
            Clear
          </button>
        </div>

      </div>
    </div>
  );
};

export default CompanyMasterFilterForm;
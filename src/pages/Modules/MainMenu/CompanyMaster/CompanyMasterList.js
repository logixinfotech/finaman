const CompanyMasterFilterForm = ({ filters, setFilters, onApply, onClear }) => {
  // Helper to handle input changes
  const handleChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-4"> 
        
        {/* Company Name Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
          <input
            type="text"
            value={filters.company_name || ""}
            onChange={(e) => handleChange('company_name', e.target.value)}
            placeholder="Search name..."
            className="h-8 w-48 px-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div> 

        {/* City Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">City</label>
          <input
            type="text"
            value={filters.city || ""}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Filter by city"
            className="h-8 w-36 px-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>

        {/* GSTIN Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GSTIN</label>
          <input
            type="text"
            value={filters.gstin_number || ""}
            onChange={(e) => handleChange('gstin_number', e.target.value)}
            placeholder="Gst Number"
            className="h-8 w-40 px-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-end gap-2 ml-auto h-full pt-4">
          <button
            onClick={onApply}
            className="h-8 px-4 text-xs font-bold bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={onClear}
            className="h-8 px-4 text-xs font-bold border border-slate-300 bg-white text-slate-600 rounded hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
        </div>

      </div>
    </div>
  );
};

export default CompanyMasterFilterForm;
export const UserAuthFilterForm = ({
  filters,
  setFilters,
  onApply,
  onClear,
  modules = [],
}) => {
  return (
    <div className="flex items-center gap-2 p-1.5 bg-gray-100 border-b border-gray-300">
      
      {/* 1. Slim Module Select */}
      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2 h-[28px]">
        <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">Module:</span>
        <select
          className="bg-transparent text-[11px] outline-none border-none min-w-[120px] cursor-pointer font-medium"
          value={filters.masmod_id || ""}
          onChange={(e) => setFilters({ ...filters, masmod_id: e.target.value })}
        >
          <option value="">All</option>
          {modules.map((m) => (
            <option key={m.masmod_id} value={m.masmod_id}>{m.mod_name}</option>
          ))}
        </select>
      </div>

      {/* 2. Compact Search Input */}
      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2 h-[28px] flex-1 max-w-[300px]">
        <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">Search:</span>
        <input
          type="text"
          placeholder="Menu/Pad Name..."
          className="bg-transparent text-[11px] outline-none border-none w-full"
          value={filters.search_term || ""}
          onChange={(e) => setFilters({ ...filters, search_term: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && onApply()}
        />
      </div> 
      <div className="flex items-center gap-1 ml-auto">
        <button 
          onClick={onApply}
          className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 h-[28px] rounded uppercase tracking-tighter transition-all"
        >
          Apply
        </button>
        <button 
          onClick={onClear}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-bold px-3 h-[28px] rounded uppercase tracking-tighter transition-all"
        >
          Reset
        </button>
      </div>

    </div>
  );
};
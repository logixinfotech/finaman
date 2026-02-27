import { Filter, X } from "lucide-react";

const MenuMasterFilterForm = ({
  filters,
  setFilters,
  onApply,
  onClear,
  modules = [],
}) => {
  return (
    <div className="menu-master-filter premium-filter">
 
      <div className="form-field">
        <label>Module</label>
        <select
          className="form-input filter-input"
          value={filters.mod_name || ""}
          onChange={(e) =>
            setFilters({ ...filters, mod_name: e.target.value })
          }
        >
          <option value="">All Modules</option>
          {modules.map((m) => (
            <option key={m.masmod_id} value={m.mod_name}>
              {m.mod_name}
            </option>
          ))}
        </select>
      </div>

      {/* Menu */}
      <div className="form-field">
        <label>Menu</label>
        <input
          className="form-input filter-input"
          placeholder="Menu name"
          value={filters.pad_name || ""}
          onChange={(e) =>
            setFilters({ ...filters, pad_name: e.target.value })
          }
        />
      </div>

      {/* Application */}
      <div className="form-field">
        <label>Application</label>
        <input
          className="form-input filter-input"
          placeholder="Application"
          value={filters.appl_name || ""}
          onChange={(e) =>
            setFilters({ ...filters, appl_name: e.target.value })
          }
        />
      </div>

      {/* Item Type */}
      <div className="form-field">
        <label>Item Type</label>
        <input
          className="form-input filter-input center"
          placeholder="F / R"
          value={filters.item_type || ""}
          onChange={(e) =>
            setFilters({ ...filters, item_type: e.target.value })
          }
        />
      </div>

      {/* Actions */}
      <div className="filter-actions">
        <button className="btn primary" onClick={onApply}>
          <Filter size={14} />
          Apply
        </button>
        <button className="btn ghost" onClick={onClear}>
          <X size={14} />
          Clear
        </button>
      </div>

    </div>
  );
};

export default MenuMasterFilterForm;

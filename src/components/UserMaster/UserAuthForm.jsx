import { useEffect, useState } from "react";
import useEnterAsTab from "../Reusable/useEnterAsTab";
import { AddButton, CancelButton } from "../Reusable/ActionButon";
import Table from "../Reusable/Table";
import {
  fetchMenuMasterList,
  fetchSidebarMenu,
  fetchUserPermissions,
  saveUserPermissions
} from "../../utils/api";
const UserAuthFilterForm = ({
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
          value={filters.masmod_id || ""}
          onChange={(e) =>
            setFilters({ ...filters, masmod_id: e.target.value })
          }
        >
          <option value="">All Modules</option>
          {modules.map((m) => (
            <option key={m.masmod_id} value={m.masmod_id}>
              {m.mod_name}
            </option>
          ))}
        </select>
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

const UserAuthForm = ({ selectedUser, onCancel }) => {
  const [allMenus, setAllMenus] = useState([]);
  const [modules, setModules] = useState([]);

  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({});

  const handleEnterAsTab = useEnterAsTab(".user-auth-form");

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMenus();
    }
  }, [selectedUser]);
  const loadModules = async () => {
    try {
      const data = await fetchSidebarMenu();
      setModules(data || []);
    } catch (err) {
      console.error("Module load error:", err);
    }
  };
  const loadMenus = async (filterParams = {}) => {
    try {
      const menuData = await fetchMenuMasterList(filterParams);

      const formatted = (menuData || []).map((row) => ({
        masmnu_id: row.masmnu_id,
        masmod_id: row.masmod_id,
        mod_name: row.mod_name,
        menu_name: row.pad_name,
        item_type: row.item_type,

        Add_right: false,
        Mod_right: false,
        Del_right: false,
        Prt_right: false,
        App_right: false,

        Add_days: 0,
        Mod_days: 0,
        Del_days: 0,
      }));

      // 🔥 LOAD EXISTING PERMISSIONS
      if (selectedUser?.userma_id) {
        const existing = await fetchUserPermissions(
          selectedUser.userma_id
        );

        const merged = formatted.map((menu) => {
          const found = existing.find(
            (e) => e.Masmnu_id === menu.masmnu_id
          );

          if (found) {
            return {
              ...menu,
              Add_right: found.Add_right,
              Mod_right: found.Mod_right,
              Del_right: found.Del_right,
              Prt_right: found.Prt_right,
              App_right: found.App_right,
              Mod_days: found.Mod_days,
              Del_days: found.Del_days,
            };
          }

          return menu;
        });

        setAllMenus(merged);
      } else {
        setAllMenus(formatted);
      }

    } catch (err) {
      console.error("Menu load error:", err);
    }
  };
  const applyFilter = async () => {
    await loadMenus(filters);
  };

  const clearFilter = async () => {
    setFilters({});
    await loadMenus();
  };
  const togglePermission = (masmnu_id, key) => {
    setAllMenus((prev) =>
      prev.map((row) =>
        row.masmnu_id === masmnu_id
          ? { ...row, [key]: !row[key] }
          : row
      )
    );
  };

  const handleNumberChange = (masmnu_id, key, value) => {
    setAllMenus((prev) =>
      prev.map((row) =>
        row.masmnu_id === masmnu_id
          ? { ...row, [key]: Number(value) }
          : row
      )
    );
  }; const columns = [
    { key: "mod_name", label: "Module" },
    { key: "menu_name", label: "Menu" },
    { key: "item_type", label: "Type" },

    {
      key: "Add_right",
      label: "Add",
      render: (row) => (
        <input
          type="checkbox"
          checked={row.Add_right}
          onChange={() =>
            togglePermission(row.masmnu_id, "Add_right")
          }
        />
      ),
    },

    {
      key: "Add_days",
      label: "Add Days",
      render: (row) => (
        <input
          type="number"
          value={row.Add_days}
          onChange={(e) =>
            handleNumberChange(
              row.masmnu_id,
              "Add_days",
              e.target.value
            )
          }
          className="w-16 border rounded text-center"
        />
      ),
    },

    {
      key: "Mod_right",
      label: "Modify",
      render: (row) => (
        <input
          type="checkbox"
          checked={row.Mod_right}
          onChange={() =>
            togglePermission(row.masmnu_id, "Mod_right")
          }
        />
      ),
    },

    {
      key: "Mod_days",
      label: "Mod Days",
      render: (row) => (
        <input
          type="number"
          value={row.Mod_days}
          onChange={(e) =>
            handleNumberChange(
              row.masmnu_id,
              "Mod_days",
              e.target.value
            )
          }
          className="w-16 border rounded text-center"
        />
      ),
    },

    {
      key: "Del_right",
      label: "Delete",
      render: (row) => (
        <input
          type="checkbox"
          checked={row.Del_right}
          onChange={() =>
            togglePermission(row.masmnu_id, "Del_right")
          }
        />
      ),
    },

    {
      key: "Del_days",
      label: "Del Days",
      render: (row) => (
        <input
          type="number"
          value={row.Del_days}
          onChange={(e) =>
            handleNumberChange(
              row.masmnu_id,
              "Del_days",
              e.target.value
            )
          }
          className="w-16 border rounded text-center"
        />
      ),
    },

    {
      key: "App_right",
      label: "Approve",
      render: (row) => (
        <input
          type="checkbox"
          checked={row.App_right}
          onChange={() =>
            togglePermission(row.masmnu_id, "App_right")
          }
        />
      ),
    },

    {
      key: "Prt_right",
      label: "Print",
      render: (row) => (
        <input
          type="checkbox"
          checked={row.Prt_right}
          onChange={() =>
            togglePermission(row.masmnu_id, "Prt_right")
          }
        />
      ),
    },
  ];
  const handleSave = async () => {
    try {
      const filteredPermissions = allMenus.filter(
        (p) =>
          p.Add_right ||
          p.Mod_right ||
          p.Del_right ||
          p.Prt_right ||
          p.App_right
      );

      const payload = {
        userma_id: selectedUser.userma_id,
        permissions: filteredPermissions,
      };

      await saveUserPermissions(payload);

      alert("Permissions Saved Successfully ✅");
      onCancel();

    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving permissions");
    }
  };

  return (
    <div className="">
      <div
        className="user-auth-form"
        onKeyDown={handleEnterAsTab}
      >
        <Table
          title={`User Authentication - ${selectedUser?.user_name}`}
          data={allMenus}
          columns={columns}
          rowKey="masmnu_id"
          defaultPageSize={50}
          showForm={showFilter}
          onToggleFilter={() => setShowFilter((p) => !p)}
          formComponent={
            <UserAuthFilterForm
              modules={modules}
              filters={filters}
              setFilters={setFilters}
              onApply={applyFilter}
              onClear={clearFilter}
            />
          }
        />

        <div className="form-actions mt-4">
          <AddButton onClick={handleSave} />
          <CancelButton onClick={onCancel} />
        </div>
      </div>
    </div>
  );
};

export default UserAuthForm;

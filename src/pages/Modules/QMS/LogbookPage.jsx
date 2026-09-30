import { useCallback, useEffect, useMemo, useState } from "react";
import Table from "../../../components/Reusable/table/Table";
import UnivarsalFilter from "../../../components/Reusable/Filter/UnivarsalFilter.jsx";
import { alertError } from "../../../components/Reusable/alert";
import * as FaIcons from "react-icons/fa";
import { getRegisters, getLogbookTypes } from "./Utils/LogbookAPI";
import { useGroupOptions } from "../../../Hooks/useUserGroupOption";
import { useAuth } from "../../../theme/AuthContext";   // same masters source as every QMS module
import RegisterView from "./Logbook/RegisterView";
import IssueRegisterModal from "./Logbook/IssueRegisterModal";
import LogbookTypesModal from "./Logbook/LogbookTypesModal";
import { Pill, fmtDate, fmtDateTime, statusTone } from "./Logbook/LogbookUi";

const STATUS = ["Active", "Closed", "All"];
const EMPTY_FILTERS = { Status: "Active", LogbookType: "All", Subject: "", Department: "" };

/** groupOptions items are { label, value? } — keep label for dropdowns, expose a numeric id when the master gives one */
const normaliseMasters = (g = {}) => {
  const out = {};
  ["product", "personnel", "equipment", "instrument", "area", "department"].forEach((k) => {
    out[k] = (g?.[k] || []).map((o) => {
      const raw = o?.value ?? o?.id ?? o?.Id;
      const id = Number.isInteger(Number(raw)) && String(raw).trim() !== "" ? Number(raw) : null;
      return { id, label: String(o?.label ?? o?.name ?? o ?? ""), code: o?.code || "" };
    }).filter((o) => o.label);
  });
  return out;
};

const COLUMNS = [
  { key: "Sr", label: "Sr" },
  { key: "RecordNo", label: "Register No." },
  { key: "TypeName", label: "Logbook type" },
  { key: "RefName", label: "Equipment / Area" },
  { key: "Department", label: "Department", render: (r) => r.Department || "—" },
  { key: "IssuedOn", label: "Issued on", render: (r) => fmtDate(r.IssuedOn) },
  { key: "IssuedBy", label: "Issued by" },
  { key: "EntryCount", label: "Entries", render: (r) => r.EntryCount ?? 0 },
  { key: "PendingCount", label: "Pending verify", render: (r) => (r.PendingCount > 0 ? <Pill tone="amber">{r.PendingCount}</Pill> : "0") },
  { key: "LastEntryAt", label: "Last entry", render: (r) => fmtDateTime(r.LastEntryAt) },
  { key: "Status", label: "Status", render: (r) => <Pill tone={statusTone(r.Status)}>{r.Status}</Pill> },
];

export default function LogbookPage({ tab }) {
  const [list, setList] = useState([]);
  const [allRegisters, setAllRegisters] = useState([]);   // for the type → register switcher inside a register
  const [types, setTypes] = useState([]);
  const { options: groupOptions } = useGroupOptions();
  const { user } = useAuth();
  const company = user?.com_name || user?.company_name || user?.companyName || "";
  const masters = useMemo(() => normaliseMasters(groupOptions), [groupOptions]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const [activeTab, setActiveTab] = useState("entry");
  const status = filters.Status || "All";
  const [openId, setOpenId] = useState(null);
  const [showIssue, setShowIssue] = useState(false);
  const [showTypes, setShowTypes] = useState(false);

  const ModuleIcon = useMemo(() => {
    const name = tab?.icon_name || tab?.module?.icon_name;
    return (name && FaIcons[name]) || FaIcons.FaBook;
  }, [tab?.icon_name, tab?.module?.icon_name]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRegisters(status);
      setList(Array.isArray(res?.data) ? res.data : []);
    } catch (e) { alertError("Load failed", e?.message || "Could not load registers."); }
    finally { setLoading(false); }
  }, [status]);

  const loadAll = useCallback(async () => {
    const res = await getRegisters("All");
    setAllRegisters(Array.isArray(res?.data) ? res.data : []);
  }, []);

  const loadTypes = useCallback(async () => {
    const res = await getLogbookTypes();
    setTypes(Array.isArray(res?.data) ? res.data : []);
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // Ctrl+N = issue register (list view only)
  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n" && !openId && !showIssue && !showTypes) { e.preventDefault(); setShowIssue(true); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [openId, showIssue, showTypes]);
  useEffect(() => { loadTypes(); loadAll(); }, [loadTypes, loadAll]);

  const rows = useMemo(() => {
    const has = (v, f) => String(v || "").toLowerCase().includes(f.toLowerCase());
    return list
      .filter((r) => (filters.LogbookType === "All" || r.TypeName === filters.LogbookType) &&
        (!filters.Subject || has(r.RefName, filters.Subject)) &&
        (!filters.Department || has(r.Department, filters.Department)))
      .map((r, i) => ({ ...r, Sr: i + 1 }));
  }, [list, filters]);

  // Table header tabs: "settings" (gear) opens Logbook Types — the module's configuration
  const onHeaderTab = useCallback((t) => { if (t === "settings") setShowTypes(true); else setActiveTab(t); }, []);
  const pendingTotal = useMemo(() => list.reduce((a, r) => a + (r.PendingCount || 0), 0), [list]);

  if (openId) {
    return (
      <div className="h-full w-full">
        <RegisterView registerId={openId} masters={masters} company={company} types={types} registers={allRegisters} onSwitch={setOpenId} onBack={() => setOpenId(null)} onChanged={() => { loadList(); loadAll(); }} />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="h-full w-full">
        <Table
          title={`e-Logbook${pendingTotal ? ` · ${pendingTotal} pending verification` : ""}`}
          TitleIcon={ModuleIcon}
          data={rows}
          columns={COLUMNS}
          rowKey="Id"
          loading={loading}
          activeTab={activeTab}
          showSettingsTab
          onTabChange={onHeaderTab}
          onRefresh={loadList}
          onAdd={() => setShowIssue(true)}
          onRowDoubleClick={(row) => setOpenId(row.Id)}
          onToggleFilter={() => setShowFilter((p) => !p)}
          showForm={showFilter}
          formComponent={
            <UnivarsalFilter
              filters={filters}
              setFilters={setFilters}
              visibleFields={["status", "logbookType", "subject", "department"]}
              options={{
                ...groupOptions,
                status: STATUS,
                logbookType: ["All", ...types.map((t) => t.name)],
              }}
              onApply={() => { }}
              onClear={() => setFilters(EMPTY_FILTERS)}
              setShowFilter={setShowFilter}
            />
          }
        />
      </div>

      {showIssue && (
        <IssueRegisterModal types={types} masters={masters} onClose={() => setShowIssue(false)}
          onIssued={(id) => { setShowIssue(false); loadList(); setOpenId(id); }} />
      )}
      {showTypes && (
        <LogbookTypesModal types={types} onClose={() => setShowTypes(false)}
          onSaved={() => { loadTypes(); loadList(); }} />
      )}
    </div>
  );
}
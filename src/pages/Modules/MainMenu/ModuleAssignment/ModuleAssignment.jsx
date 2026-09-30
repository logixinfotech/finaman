import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../../../../theme/AuthContext";
import { fetchCompanyList, fetchSidebarMenu } from "../.././../../utils/api";

const ICON_COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#10b981", "#14b8a6",
];
function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ICON_COLORS[Math.abs(hash % ICON_COLORS.length)];
}
function ModuleIcon({ name, ...props }) {
  const Cmp = Icons[name] || Icons.Circle;
  return <Cmp {...props} />;
}

export default function ModuleAssignmentView() {
  const { token } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companySearch, setCompanySearch] = useState("");
  const [selected, setSelected] = useState(null);

  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [error, setError] = useState(null);

  // STEP 1: companies list
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchCompanyList(token);
        setCompanies(list);
        if (list.length) loadModules(list[0]);
      } catch (err) {
        setError(err.message);
      } finally {
        setCompaniesLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // STEP 2: modules for a company — existing fetchSidebarMenu, just with com_id
  async function loadModules(company) {
    setSelected(company);
    setModulesLoading(true);
    setError(null);
    try {
      const data = await fetchSidebarMenu(token, company.com_id);
      setModules((data || []).sort((a, b) => a.mod_srl - b.mod_srl));
    } catch (err) {
      setError(err.message);
      setModules([]);
    } finally {
      setModulesLoading(false);
    }
  }

  const filteredCompanies = companies.filter((c) =>
    c.company.toLowerCase().includes(companySearch.toLowerCase())
  );
  const enabledCount = modules.filter((m) => m.show_stat === "Y").length;

  return (
    <div className="min-h-screen w-full flex justify-center p-6" style={{ background: "#eef1f5" }}>
      <div className="w-full max-w-[860px]">
        <h1 className="text-[17px] font-semibold text-slate-800 mb-4">Module licensing</h1>

        {error && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-md bg-red-50 text-red-600 text-[12.5px]">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-r border-slate-200 bg-[#fafbfc]">
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Find a company"
                  className="w-full h-[32px] pl-7 pr-2.5 rounded-md border border-slate-200 text-[12.5px] outline-none focus:border-blue-400"
                />
              </div>
            </div>

            {companiesLoading && (
              <div className="flex justify-center py-8"><Loader2 size={16} className="animate-spin text-slate-300" /></div>
            )}

            {!companiesLoading && filteredCompanies.map((c) => (
              <button
                key={c.com_id}
                onClick={() => loadModules(c)}
                className="w-full text-left px-3 py-2.5 border-l-2 transition-colors duration-150"
                style={{
                  borderColor: selected?.com_id === c.com_id ? "#1d4ed8" : "transparent",
                  background: selected?.com_id === c.com_id ? "#f3f6fd" : "transparent",
                }}
              >
                <div className="text-[13px] font-medium text-slate-700 truncate">{c.company}</div>
                <div className="text-[11px] text-slate-400">{c.com_code}</div>
              </button>
            ))}
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="text-[13.5px] font-semibold text-slate-800 truncate">{selected?.company || "—"}</span>
              <span className="text-[12px] text-slate-400">{enabledCount} of {modules.length} enabled</span>
            </div>

            {modulesLoading ? (
              <div className="flex justify-center py-16"><Loader2 size={18} className="animate-spin text-slate-300" /></div>
            ) : (
              <div className="px-2 py-2">
                {modules.map((m) => (
                  <div key={m.masmod_id} className="flex items-center gap-2.5 px-2 py-2 rounded-md">
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: `${colorFor(m.mod_name)}1a`, color: colorFor(m.mod_name) }}
                    >
                      <ModuleIcon name={m.icon_name} size={13} />
                    </span>
                    <span className="text-[13px] text-slate-700 flex-1 truncate">{m.mod_name}</span>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: m.show_stat === "Y" ? "#ecfdf5" : "#f1f5f9",
                        color: m.show_stat === "Y" ? "#059669" : "#94a3b8",
                      }}
                    >
                      {m.show_stat === "Y" ? "Enabled" : "Not enabled"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
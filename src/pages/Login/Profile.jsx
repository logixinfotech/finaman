import React, { useEffect, useState } from "react";
import { 
  Building2, Fingerprint, Shield,   UserCircle,
  Copy, Check, MapPin, Clock, KeyRound, Mail, Phone,
  ShieldCheck, Laptop, MoreVertical, 
  CheckCircle2, Activity, Wallet, Network, History, Lock,
  ArrowLeftRight, Search, X as CloseIcon, Loader2, AlertCircle
} from "lucide-react";
import { fetchUserProfile, fetchSwitchableCompanies, switchCompany } from "../../utils/api";
import { copyToClipboard } from "../../utils/helpers";
import { useAuth } from "../../theme/AuthContext";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { user: authUser, login } = useAuth();     
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [switching, setSwitching] = useState(null);
  const [companySearch, setCompanySearch] = useState("");
  const [switchError, setSwitchError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const dynamicData = await fetchUserProfile();
        
        setUser({
          email: "employee@enterprise.com",
          phone: "+91 98765 43210",
          status: "Active",
          department: "Supply Chain & Logistics",
          cost_center: "CC-IND-8821",
          manager: "Priya Desai (VP Operations)",
          location: "Noida, UP, India",
          two_factor_enabled: true,
          last_login: "Today, 08:42 AM",
          timezone: "IST (UTC+5:30)",
          pending_approvals: 14,
          days_active: 842,
          ...dynamicData,
          roles: dynamicData?.role ? [dynamicData.role, "System User"] : ["Inventory Manager", "Purchase Approver"]
        });
      } catch (error) {
        console.error("Profile load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // ── Company switcher handlers ─────────────────────────────────────────────
  const openSwitcher = async () => {
    setShowSwitcher(true);
    setSwitchError("");
    setCompanySearch("");
    setCompaniesLoading(true);
    try {
      const res = await fetchSwitchableCompanies();
      setCompanies(res.companies || []);
    } catch (err) {
      console.error("Failed to load companies:", err);
      setSwitchError("Could not load company list. Please try again.");
    } finally {
      setCompaniesLoading(false);
    }
  };

  const closeSwitcher = () => {
    if (switching) return; // don't allow closing mid-switch
    setShowSwitcher(false);
    setSwitchError("");
    setCompanySearch("");
  };

  const handleSwitch = async (company) => {
    if (switching) return;
      if (String(company.com_id) === String(authUser?.com_id)) return; 

    setSwitching(company.com_id);
    setSwitchError("");
    try {
      const res = await switchCompany(company.com_id);
      if (!res.success) throw new Error(res.message || "Failed to switch company.");

      login(res.token, res.user, res.permissions);  

      // Full reload guarantees every tenant-scoped screen/state resets cleanly
      window.location.reload();
    } catch (err) {
      console.error("Switch company error:", err);
      setSwitchError(err.response?.data?.message || err.message || "Failed to switch company.");
      setSwitching(null);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.company?.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.com_code?.toLowerCase().includes(companySearch.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-full min-h-[500px] w-full items-center justify-center bg-slate-50">
      <div className="text-center animate-pulse text-slate-500 font-medium">Loading Enterprise Profile...</div>
    </div>
  );

  if (!user) return <div className="p-8 text-center text-red-500">Failed to load user data.</div>;

  return ( 
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 pb-24 pt-4 sm:pt-6 lg:pt-8 custom-scrollbar">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"> 
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Profile</h1>
            <p className="text-sm text-slate-500 mt-1">Manage system access, hierarchy, and activity logs.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all">
              <KeyRound className="mr-2 h-4 w-4 text-slate-400" />
              Reset Password
            </button>
            <button className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all">
              Edit User
            </button>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-inset ring-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-all">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          
          {/* FIX 3: lg:self-start is MANDATORY for sticky to work inside a CSS Grid! */}
          {/* LEFT COLUMN: Sticky Identity Card */}
          <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 text-center bg-gradient-to-b from-slate-50 to-white">
                <div className="relative mx-auto h-28 w-28 rounded-full border-4 border-white bg-indigo-50 shadow-md flex items-center justify-center text-4xl font-bold text-indigo-700 mb-4">
                  {user.user_name?.charAt(0)?.toUpperCase() || <UserCircle className="h-12 w-12 text-slate-400" />}
                  <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white bg-emerald-500 shadow-sm"></div>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{user.user_name}</h2>
                <p className="text-sm font-medium text-indigo-600 mt-1">{user.department}</p>
                
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {user.roles.map(role => (
                    <span key={role} className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-slate-100 p-6 space-y-5">
                <CopyableRow icon={Fingerprint} label="System User ID" value={user.user_id} />
                <CopyableRow icon={Shield} label="Master ID" value={user.userma_id} />
                <ProfileRow icon={Mail} label="Email Address" value={user.email} />
                <ProfileRow icon={Phone} label="Contact Number" value={user.phone} />
                <ProfileRow icon={MapPin} label="Base Location" value={user.location} />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Scrollable Content Area */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard icon={Activity} label="Pending Tasks" value={user.pending_approvals} trend="Action required" urgent />
              <StatCard icon={CheckCircle2} label="Status" value={user.status} trend="Fully Operational" />
              <StatCard icon={Clock} label="System Tenure" value={`${user.days_active} Days`} trend="Since account creation" />
            </div>

            {/* Custom Tabs */}
            <div className="bg-white rounded-t-xl border-b border-slate-200 px-6 pt-2">
              <div className="flex space-x-6 overflow-x-auto hide-scrollbar">
                {['overview', 'access', 'activity'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold capitalize transition-all ${
                      activeTab === tab 
                        ? "border-indigo-600 text-indigo-600" 
                        : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    }`}
                  >
                    {tab === 'access' ? 'Roles & Access' : tab === 'activity' ? 'Activity Log' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Organization Setup */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Network className="h-4 w-4 text-slate-500 mr-2" />
                      <h3 className="text-sm font-semibold text-slate-900">Organization & Hierarchy</h3>
                    </div>
                    <button
                      onClick={openSwitcher}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600
                                 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg
                                 px-3 py-1.5 transition-colors"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                      Switch Company
                    </button>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <CopyableRow icon={Building2} label="Company Code" value={user.com_code} />
                      <ProfileRow icon={Building2} label="Legal Entity" value={user.com_name || user.company} />
                    </div>
                    <div className="space-y-6">
                      <ProfileRow icon={UserCircle} label="Reporting Manager" value={user.manager} />
                      <ProfileRow icon={Wallet} label="Cost Center" value={user.cost_center} />
                    </div>
                  </div>
                </div>

                {/* Security Setup */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 text-slate-500 mr-2" />
                      <h3 className="text-sm font-semibold text-slate-900">Security & Authentication</h3>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <ShieldCheck className="mr-1 h-3 w-3" /> Secure
                    </span>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex items-center space-x-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${user.two_factor_enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Two-Factor Authentication (2FA)</p>
                          <p className="text-xs text-slate-500">Google Authenticator is currently active</p>
                        </div>
                      </div>
                      <button className="mt-4 sm:mt-0 text-sm font-medium text-indigo-600 hover:text-indigo-700">Manage 2FA</button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-white">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                          <Laptop className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Active Session</p>
                          <p className="text-xs text-slate-500">IP: 103.45.98.11 • {user.timezone}</p>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:text-right">
                        <p className="text-sm text-slate-900">{user.last_login}</p>
                        <button className="text-xs font-medium text-red-600 hover:text-red-700 mt-1">Terminate Session</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ACCESS & ROLES */}
            {activeTab === "access" && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Module Permissions</h3>
                  <p className="text-xs text-slate-500 mt-1">Access levels defined by assigned roles.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[11px]">ERP Module</th>
                        <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[11px]">Access Level</th>
                        <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[11px]">Assigned Via</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {[
                        { mod: "Inventory Management", level: "Read / Write", via: "Inventory Manager" },
                        { mod: "Purchase Orders", level: "Approval Only", via: "Purchase Approver" },
                        { mod: "Vendor Master", level: "Read Only", via: "System User" },
                        { mod: "Financial Accounting", level: "No Access", via: "-" },
                        { mod: "HRMS", level: "Self Service", via: "System User" },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-medium text-slate-900">{row.mod}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${row.level === 'No Access' ? 'bg-slate-50 text-slate-500 ring-slate-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'}`}>
                              {row.level}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{row.via}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ACTIVITY LOG */}
            {activeTab === "activity" && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center">
                  <History className="h-4 w-4 mr-2 text-slate-500" />
                  Recent System Activity
                </h3>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {[
                    { title: "Approved Purchase Order #PO-9912", time: "Today, 10:45 AM", type: "action" },
                    { title: "Logged into System (IP: 103.45.98.11)", time: "Today, 08:42 AM", type: "login" },
                    { title: "Updated Inventory Count for Warehouse A", time: "Yesterday, 04:15 PM", type: "action" },
                    { title: "Logged into System (IP: 103.45.98.11)", time: "Yesterday, 09:00 AM", type: "login" },
                    { title: "Password changed successfully", time: "Jun 20, 2026, 02:30 PM", type: "security" },
                    { title: "Role 'Purchase Approver' assigned by Admin", time: "Jun 15, 2026, 11:00 AM", type: "security" },
                  ].map((log, i) => (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        {log.type === 'action' ? <CheckCircle2 className="h-4 w-4" /> : log.type === 'login' ? <Laptop className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-slate-50/50 shadow-sm">
                        <p className="text-sm font-semibold text-slate-900">{log.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Company Switcher Modal ─────────────────────────────────────────── */}
      {showSwitcher && (
        <CompanySwitcherModal
          currentComId={user.com_id}
          companies={filteredCompanies}
          loading={companiesLoading}
          switching={switching}
          search={companySearch}
          onSearchChange={setCompanySearch}
          error={switchError}
          onSelect={handleSwitch}
          onClose={closeSwitcher}
        />
      )}
    </div>
  );
}; 
 
const CompanySwitcherModal = ({
  currentComId, companies, loading, switching,
  search, onSearchChange, error, onSelect, onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">Switch Company</h3>
            <p className="text-xs text-slate-400 mt-0.5">Select a company to work in.</p>
          </div>
          <button
            onClick={onClose}
            disabled={!!switching}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400
                       hover:bg-slate-100 hover:text-slate-600 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search by company name or code…"
              disabled={!!switching}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white
                         text-[13.5px] text-slate-700 outline-none placeholder:text-slate-300
                         focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]
                         transition-all duration-200 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-3 flex items-center gap-2 bg-red-50 border border-red-100
                          rounded-lg px-3 py-2 text-red-700 text-[12.5px]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Company list */}
        <div className="px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading companies…
            </div>
          ) : companies.length === 0 ? (
            <p className="text-[13px] text-slate-400 text-center py-10">
              No companies match your search.
            </p>
          ) : (
            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-100">
              {companies.map((company) => {
                const isCurrent = String(company.com_id) === String(currentComId);
                const isSwitchingThis = switching === company.com_id;
                const isDisabled = !!switching;

                return (
                  <button
                    key={company.com_id}
                    type="button"
                    disabled={isDisabled || isCurrent}
                    onClick={() => onSelect(company)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left
                                transition-colors duration-150 disabled:cursor-not-allowed
                                ${isCurrent ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0
                                      ${isCurrent ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
                        {isSwitchingThis
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Building2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[13.5px] font-semibold truncate
                                       ${isCurrent ? "text-indigo-700" : "text-slate-800"}`}>
                          {company.company}
                        </p>
                        <p className={`text-[11px] truncate ${isCurrent ? "text-indigo-400" : "text-slate-400"}`}>
                          {company.com_code}
                        </p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10.5px] font-semibold text-indigo-600 bg-white
                                       px-2 py-0.5 rounded-full shrink-0">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, trend, urgent }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center space-x-3 text-slate-500 mb-3">
      <Icon className={`h-5 w-5 ${urgent ? 'text-amber-500' : 'text-slate-400'}`} />
      <h4 className="text-[11px] font-bold uppercase tracking-wider">{label}</h4>
    </div>
    <div className="flex items-baseline space-x-2">
      <span className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</span>
    </div>
    <p className={`text-xs mt-1 ${urgent ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>{trend}</p>
  </div>
);

const ProfileRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start space-x-3">
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200">
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-900 mt-0.5">{value || "—"}</span>
    </div>
  </div>
);

const CopyableRow = ({ icon: Icon, label, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    await copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start space-x-3 group">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <div className="flex items-center mt-0.5">
          <span className="text-sm font-semibold text-slate-900">{value || "—"}</span>
          {value && (
            <button 
              onClick={handleCopy}
              className="ml-2 flex h-7 w-7 items-center justify-center rounded-md bg-slate-50 text-slate-500 opacity-0 transition-all hover:bg-indigo-50 hover:text-indigo-600 group-hover:opacity-100 focus:opacity-100 outline-none"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
 
// // import { useEffect, useState } from "react";
// // import { fetchUserProfile } from "../../utils/api";

// // const ProfilePage = () => {
// //   const [user, setUser] = useState(null);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     const loadProfile = async () => {
// //       try {
// //         const data = await fetchUserProfile();
// //         setUser(data);
// //       } catch (error) {
// //         console.error("Profile load error:", error);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     loadProfile();
// //   }, []);

// //   if (loading) {
// //     return <div className="profile-loading">Loading profile...</div>;
// //   }

// //   if (!user) {
// //     return <div className="profile-loading">No user data found</div>;
// //   }

// //   return (
// //     <div className="profile-page">
// //       <div className="profile-card modern-card">

// //         {/* Header */}
// //         <div className="profile-header">
// //           <div className="profile-avatar">
// //             {user.user_name?.charAt(0)?.toUpperCase() ||
// //               user.user_id?.charAt(0)?.toUpperCase()}
// //           </div>

// //           <div className="profile-header-info">
// //             <h2>{user.user_name}</h2>
// //             <p className="profile-role">{user.role}</p>
// //             <span className="profile-company">{user.company}</span>
// //           </div>
// //         </div>

// //         <div className="profile-divider" />

// //         <div className="profile-section">
// //           <ProfileRow label="User ID" value={user.user_id} />
// //           <ProfileRow label="User Master ID" value={user.userma_id} />
// //           <ProfileRow label="Role" value={user.role} />
// //           <ProfileRow label="Company Code" value={user.com_code} />
// //         </div>

// //       </div>
// //     </div>
// //   );
// // };

// // const ProfileRow = ({ label, value }) => (
// //   <div className="profile-row">
// //     <div className="profile-label">{label}</div>
// //     <div className="profile-value">{value || "-"}</div>
// //   </div>
// // );

// // export default ProfilePage;
// import { useEffect, useState, useCallback } from "react";
// import { fetchUserProfile } from "../../utils/api";

// // --- sub-components (Ideally moved to separate files in a component library) ---

// /**
//  * Loading Skeleton for Enterprise UI consistency
//  */
// const ProfileSkeleton = () => (
//   <div className="profile-page skeleton-loading animate-pulse">
//     <div className="profile-card modern-card">
//       <div className="profile-header">
//         <div className="profile-avatar bg-gray-300 w-16 h-16 rounded-full" />
//         <div className="profile-header-info space-y-2">
//           <div className="h-6 bg-gray-300 rounded w-48" />
//           <div className="h-4 bg-gray-200 rounded w-32" />
//         </div>
//       </div>
//       <div className="profile-divider my-4 border-t border-gray-200" />
//       <div className="profile-section space-y-3">
//         {[1, 2, 3, 4].map((i) => (
//           <div key={i} className="flex justify-between"><div className="h-4 bg-gray-200 rounded w-1/4" /><div className="h-4 bg-gray-200 rounded w-1/2" /></div>
//         ))}
//       </div>
//     </div>
//   </div>
// );

// /**
//  * Reusable Error State with a Retry Action
//  */
// const ErrorState = ({ message, onRetry }) => (
//   <div className="profile-error-container p-6 text-center border border-red-200 rounded-lg bg-red-50">
//     <p className="text-red-700 font-medium">Failed to load ERP profile data.</p>
//     <p className="text-xs text-red-500 mt-1">{message || "Internal Server Error or Network Timeout"}</p>
//     {onRetry && (
//       <button 
//         onClick={onRetry} 
//         className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
//       >
//         Retry Connection
//       </button>
//     )}
//   </div>
// );

// /**
//  * Clean data presentation row
//  */
// const ProfileRow = ({ label, value, isSensitive = false }) => (
//   <div className="profile-row flex justify-between py-2 border-b border-gray-100 last:border-none">
//     <span className="profile-label text-sm text-gray-500 font-medium">{label}</span>
//     <span className={`profile-value text-sm font-semibold ${isSensitive ? "font-mono tracking-wider text-gray-700" : "text-gray-900"}`}>
//       {value ?? "—"}
//     </span>
//   </div>
// );

// // --- Main Component ---

// const ProfilePage = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Memoized load function to allow secure retries without recreating closures
//   const loadProfile = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await fetchUserProfile();
//       if (!data) throw new Error("Null data payload returned from gateway.");
//       setUser(data);
//     } catch (err) {
//       console.error("[ERP-AUTH-ERR] Profile fetch failed:", err);
//       setError(err.message || "An unexpected error occurred.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     let isMounted = true;
//     if (isMounted) {
//       loadProfile();
//     }
//     return () => { isMounted = false; }; // Prevent state updates on unmounted components
//   }, [loadProfile]);

//   // Phase 1: Global system loaders
//   if (loading) return <ProfileSkeleton />;

//   // Phase 2: Error boundary representation
//   if (error) return <ErrorState message={error} onRetry={loadProfile} />;
//   if (!user) return <ErrorState message="No account matching this session metadata exists." onRetry={loadProfile} />;

//   // Dynamic Avatar Initial Generation
//   const avatarInitial = (user.user_name || user.user_id || "?").charAt(0).toUpperCase();

//   return (
//     <div className="profile-page-wrapper p-4 max-w-4xl mx-auto">
//       <div className="profile-card modern-card shadow-lg rounded-xl p-6 bg-white border border-gray-100">

//         {/* Master Identity Header */}
//         <div className="profile-header flex items-center space-x-4">
//           <div className="profile-avatar flex items-center justify-center bg-blue-600 text-white font-bold text-xl rounded-full h-14 w-14 shadow-inner">
//             {avatarInitial}
//           </div>

//           <div className="profile-header-info">
//             <h2 className="text-xl font-bold text-gray-900">{user.user_name || "System User"}</h2>
//             <div className="flex items-center space-x-2 mt-1">
//               <span className="profile-role px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wider">
//                 {user.role}
//               </span>
//               <span className="text-gray-300">|</span>
//               <span className="profile-company text-sm text-gray-500 font-medium">{user.company || "Global Holding"}</span>
//             </div>
//           </div>
//         </div>

//         <div className="profile-divider my-6 border-b border-gray-200" />

//         {/* System Meta-Data Core Segmentation */}
//         <div className="profile-section space-y-1 bg-gray-50 p-4 rounded-lg">
//           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">System Access Metadata</h3>
//           <ProfileRow label="User ID Key" value={user.user_id} isSensitive />
//           <ProfileRow label="Master Ledger ID (userma_id)" value={user.userma_id} isSensitive />
//           <ProfileRow label="Functional Scope Role" value={user.role} />
//           <ProfileRow label="Organizational Company Code" value={user.com_code} isSensitive />
//         </div>

//       </div>
//     </div>
//   );
// };

// export default ProfilePage;
import React, { useEffect, useState } from "react";
import { 
  Building2, Fingerprint, Shield, Briefcase, UserCircle,
  Copy, Check, MapPin, Clock, KeyRound, Mail, Phone,
  ChevronRight, ShieldCheck, Laptop, MoreVertical, 
  CheckCircle2, Activity, Wallet, Network, History, Lock
} from "lucide-react";
import { fetchUserProfile } from "../../utils/api";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

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

  if (loading) return (
    <div className="flex h-full min-h-[500px] w-full items-center justify-center bg-slate-50">
      <div className="text-center animate-pulse text-slate-500 font-medium">Loading Enterprise Profile...</div>
    </div>
  );

  if (!user) return <div className="p-8 text-center text-red-500">Failed to load user data.</div>;

  return (
    /* FIX 1: h-full w-full overflow-y-auto ensure karta hai ki ye page parent ke andar freely scroll ho. FIX 2: pb-24 ensures no cut-off at bottom */
    <div className="h-full w-full overflow-y-auto bg-slate-50/50 pb-24 pt-4 sm:pt-6 lg:pt-8 custom-scrollbar">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
      

        {/* Top Header Actions */}
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
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center">
                    <Network className="h-4 w-4 text-slate-500 mr-2" />
                    <h3 className="text-sm font-semibold text-slate-900">Organization & Hierarchy</h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <CopyableRow icon={Building2} label="Company Code" value={user.com_code} />
                      <ProfileRow icon={Building2} label="Legal Entity" value={user.company} />
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
    </div>
  );
};

// ---------------- Helper Components ---------------- //

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

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
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
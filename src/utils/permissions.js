// lib/permissions.js
export const getRights = (appl_name) => {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const allPerms = JSON.parse(sessionStorage.getItem("permissions") || "{}");
  
  if (user?.role?.toLowerCase() === "admin") {
    return { add: 1, mod: 1, del: 1, print: 1, modDays: 999 };
  }

  const raw = allPerms[appl_name] || {};
  return {
    add: Number(raw.add || 0),
    mod: Number(raw.mod || 0),
    del: Number(raw.del || 0),
    print: Number(raw.print || 0),
    modDays: Number(raw.modDays || 0)
  };
};// export const hasPermission = (appl, action) => {
//   const user = JSON.parse(sessionStorage.getItem("user"));
//   const permissions = JSON.parse(sessionStorage.getItem("permissions"));

//   // ✅ Admin bypass
//   if (user?.role === "admin") return true;

//   // ✅ Normal user
//   return permissions?.[appl]?.[action] === 1;
// };



// // src/utils/permissions.jsT==========================================================================
// export const getRights = (appl_name) => {
//   const perms = JSON.parse(sessionStorage.getItem("permissions") || "{}");
//   return perms[appl_name] || null;
// };

// export const canUserDo = (appl_name, action, recordDate = null) => {
//   const rights = getRights(appl_name);
  
//   if (!rights) {
//     console.error(`Permission Denied: No entry found for module [${appl_name}]`);
//     return false;
//   }

//   const actionMap = {
//     add: rights.add,
//     modify: rights.mod,
//     delete: rights.del,
//     print: rights.print,
//     pdf: rights.export?.pdf,
//     excel: rights.export?.excel
//   };

//   if (Number(actionMap[action]) !== 1) {
//     console.warn(`Permission Denied: User does not have [${action}] rights for [${appl_name}]`);
//     return false;
//   }

//   // BACK-DATED CHECK
//   if (recordDate && (action === 'modify' || action === 'delete')) {
//     const daysLimit = action === 'modify' ? rights.modDays : rights.delDays;
    
//     if (daysLimit > 0) {
//       const created = new Date(recordDate);
//       const today = new Date();
//       const diffTime = Math.abs(today - created);
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
//       const isAllowed = diffDays <= daysLimit;
//       if (!isAllowed) {
//         console.warn(`Action Blocked: Record age (${diffDays} days) exceeds allowed limit (${daysLimit} days) for ${action}`);
//       }
//       return isAllowed;
//     }
//   }

//   console.log(`Permission Granted: [${action}] on [${appl_name}]`);
//   return true;
// };
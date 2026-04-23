import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHistory, FaCircle, FaInfoCircle } from 'react-icons/fa';

const RecentActivity = ({ activeTab }) => {
  // Enhanced Mock Data with Status
  const generalActivities = [
    { id: 1, user: "System", action: "Daily Backup Completed", time: "5 mins ago", code: "SYS", status: "success" },
    { id: 2, user: "Admin", action: "User Permissions Updated", time: "1 hr ago", code: "AD", status: "warning" },
    { id: 3, user: "System", action: "Server Reboot Scheduled", time: "4 hrs ago", code: "SYS", status: "info" },
  ];

  const pageSpecificActivity = activeTab ? [
    { id: 101, user: "You", action: `Viewed ${activeTab.label}`, time: "Just now", code: "ME", status: "info" },
    { id: 102, user: "Sakshi", action: `Modified ${activeTab.label} config`, time: "2 hrs ago", code: "SA", status: "success" },
    { id: 103, user: "System", action: `Auto-saved draft in ${activeTab.label}`, time: "3 hrs ago", code: "SYS", status: "info" },
  ] : [];

  const displayList = activeTab ? pageSpecificActivity : generalActivities;

  // Helper for status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-emerald-500';
      case 'warning': return 'text-amber-500';
      case 'error': return 'text-rose-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <motion.div 
      layout
      className="activity-block flex flex-col h-full border-l border-slate-200 bg-white"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Header Area */}
      <div className="activity-header flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <FaHistory className="text-indigo-500 text-xs" />
          <h3 className="activity-title text-xs font-bold uppercase tracking-wider text-slate-600">
            {activeTab ? `${activeTab.label} Activity` : "Global Audit Trail"}
          </h3>
        </div>
        <span className="flex items-center justify-center bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          {displayList.length}
        </span>
      </div>

      {/* Timeline List */}
      <div className="activity-list flex-1 overflow-y-auto p-4 custom-dashboard-scrollbar">
        <AnimatePresence mode='popLayout' initial={false}>
          {displayList.map((item, index) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex gap-4 pb-6 last:pb-0 group"
            >
              {/* Vertical Timeline Line */}
              {index !== displayList.length - 1 && (
                <div className="absolute left-[15px] top-[32px] bottom-0 w-[2px] bg-slate-100 group-hover:bg-indigo-100 transition-colors" />
              )}

              {/* Avatar / Status Icon Area */}
              <div className="relative z-10">
                <div className="activity-avatar w-8 h-8 rounded-lg bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shadow-md group-hover:bg-indigo-600 transition-colors">
                  {item.code}
                </div>
                {/* Small Status Indicator Dot */}
                <div className={`absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm`}>
                   <FaCircle className={`text-[8px] ${getStatusColor(item.status)}`} />
                </div>
              </div>

              {/* Text Info */}
              <div className="activity-info flex flex-col pt-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="activity-text text-[12.5px] leading-snug text-slate-700 group-hover:text-slate-900 transition-colors">
                    <span className="font-semibold text-slate-900">{item.user}</span> {item.action}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="activity-time text-[10px] font-medium text-slate-400">
                    {item.time}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-slate-200" />
                  <span className={`text-[9px] font-bold uppercase ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* View All Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/30 text-center">
        <button className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight transition-all">
          View Detailed Logs
        </button>
      </div>
    </motion.div>
  );
};

export default RecentActivity;
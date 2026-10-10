import React, { useEffect, useState } from "react";
import { X, Calendar, CheckCircle2, Clock, AlertCircle, Printer, ArrowDownCircle } from "lucide-react";
import { getLoanSchedule } from "../../../../../utils/api";
import { showToast } from "../../../../../components/Reusable/alert";

export default function LoanScheduleModal({ isOpen, onClose, loan }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && loan?.id) {
      loadSchedule();
    }
  }, [isOpen, loan?.id]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const res = await getLoanSchedule(loan.id);
      if (res?.success) {
        setSchedule(res.data || []);
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to load schedule" });
      }
    } catch (err) {
      showToast({ icon: "error", title: "Error loading schedule" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !loan) return null;

  const totalEmi = schedule.reduce((sum, s) => sum + (Number(s.emi_amount) || 0), 0);
  const totalRecovered = schedule.reduce((sum, s) => sum + (Number(s.recovered_amt) || 0), 0);
  const totalShortfall = schedule.reduce((sum, s) => sum + (Number(s.shortfall_amt) || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Deducted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={10} /> Deducted
          </span>
        );
      case "Shortfall":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle size={10} /> Shortfall
          </span>
        );
      case "Waived":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Waived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={10} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-2xs font-sans animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-blue-400">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
                <span>Repayment Schedule</span>
                <span className="px-2 py-0.2 rounded text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {loan.req_no || "N/A"}
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                {loan.employee_name} · {loan.master_type} · Principal: ₹{Number(loan.amount || 0).toLocaleString()} · {loan.interest_type || "None"} Interest
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick KPI summary */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 text-[10.5px] uppercase font-bold tracking-wider">Total Payable</span>
            <div className="font-bold text-slate-900 text-[13px]">₹{totalEmi.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-slate-500 text-[10.5px] uppercase font-bold tracking-wider">Recovered to Date</span>
            <div className="font-bold text-emerald-600 text-[13px]">₹{totalRecovered.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-slate-500 text-[10.5px] uppercase font-bold tracking-wider">Outstanding Balance</span>
            <div className="font-bold text-rose-600 text-[13px]">₹{(totalEmi - totalRecovered).toLocaleString()}</div>
          </div>
          <div>
            <span className="text-slate-500 text-[10.5px] uppercase font-bold tracking-wider">Installments</span>
            <div className="font-bold text-slate-800 text-[13px]">{schedule.length} Months</div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <Clock className="w-5 h-5 animate-spin text-blue-600" />
              <span>Loading installment schedule...</span>
            </div>
          ) : schedule.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              No installment schedule generated yet.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Due Month</th>
                    <th className="py-2.5 px-3 text-right">Principal</th>
                    <th className="py-2.5 px-3 text-right">Interest</th>
                    <th className="py-2.5 px-3 text-right">EMI Amount</th>
                    <th className="py-2.5 px-3 text-right">Recovered</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Deducted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11.5px] text-slate-700">
                  {schedule.map((item) => (
                    <tr
                      key={item.sched_id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.status === "Deducted" ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      <td className="py-2 px-3 text-center font-bold text-slate-500 font-mono">
                        {item.inst_no}
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {item.due_month ? new Date(item.due_month).toLocaleDateString([], { month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        ₹{Number(item.principal_amt || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
                        ₹{Number(item.interest_amt || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                        ₹{Number(item.emi_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-bold font-mono text-emerald-600">
                        {Number(item.recovered_amt) > 0 ? `₹${Number(item.recovered_amt).toLocaleString()}` : "—"}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-500 font-mono">
                        {item.deducted_at ? new Date(item.deducted_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100/70 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 italic">
            Automated deductions apply on active monthly payroll runs.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-2xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

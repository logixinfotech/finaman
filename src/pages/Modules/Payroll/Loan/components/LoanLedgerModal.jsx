import React, { useEffect, useState } from "react";
import { X, History, ArrowDownRight, ArrowUpRight, Clock, FileText } from "lucide-react";
import { getLoanLedger } from "../../../../../utils/api";
import { showToast } from "../../../../../components/Reusable/alert";

export default function LoanLedgerModal({ isOpen, onClose, loan }) {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && loan?.id) {
      loadLedger();
    }
  }, [isOpen, loan?.id]);

  const loadLedger = async () => {
    try {
      setLoading(true);
      const res = await getLoanLedger(loan.id);
      if (res?.success) {
        setLedger(res.data || []);
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to load ledger" });
      }
    } catch (err) {
      showToast({ icon: "error", title: "Error loading ledger" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !loan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-2xs font-sans animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
              <History size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
                <span>Transaction & Recovery Ledger</span>
                <span className="px-2 py-0.2 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {loan.req_no || "N/A"}
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                {loan.employee_name} · Current Outstanding: ₹{Number(loan.balance_amount || 0).toLocaleString()}
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

        {/* Ledger Table */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <Clock className="w-5 h-5 animate-spin text-emerald-600" />
              <span>Loading ledger history...</span>
            </div>
          ) : ledger.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              No financial transactions recorded yet.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Transaction Type</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Running Balance</th>
                    <th className="py-2.5 px-3">Remarks / Payroll Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11.5px] text-slate-700">
                  {ledger.map((item) => {
                    const isCredit = item.txn_type === "DISBURSEMENT";
                    return (
                      <tr key={item.txn_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {item.txn_date ? new Date(item.txn_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-medium flex items-center gap-1.5">
                          {isCredit ? (
                            <ArrowUpRight size={13} className="text-blue-600" />
                          ) : (
                            <ArrowDownRight size={13} className="text-emerald-600" />
                          )}
                          <span
                            className={`font-semibold ${
                              isCredit ? "text-blue-700" : "text-emerald-700"
                            }`}
                          >
                            {item.txn_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono">
                          <span className={isCredit ? "text-blue-700" : "text-emerald-700"}>
                            {isCredit ? "+" : "-"}₹{Number(item.amount || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                          ₹{Number(item.running_balance || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">
                          {item.remarks || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100/70 border-t border-slate-200 flex items-center justify-end">
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

import React, { useState, useEffect } from "react";
import { X, DollarSign, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { prepayLoan } from "../../../../../utils/api";
import { showToast } from "../../../../../components/Reusable/alert";

export default function LoanPrepayModal({ isOpen, onClose, loan, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && loan) {
      setAmount(loan.balance_amount ? String(loan.balance_amount) : "");
      setPaymentMode("Bank Transfer");
      setRemarks("Early prepayment");
    }
  }, [isOpen, loan]);

  if (!isOpen || !loan) return null;

  const currentBalance = Number(loan.balance_amount || 0);
  const payAmt = parseFloat(amount) || 0;
  const remainingBal = Math.max(0, Math.round((currentBalance - payAmt) * 100) / 100);
  const isFullSettlement = payAmt >= currentBalance && currentBalance > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (payAmt <= 0) {
      showToast({ icon: "error", title: "Please enter a valid amount greater than 0" });
      return;
    }
    if (payAmt > currentBalance) {
      showToast({ icon: "error", title: `Amount cannot exceed current balance of ₹${currentBalance.toLocaleString()}` });
      return;
    }

    try {
      setSubmitting(true);
      const res = await prepayLoan(loan.id, {
        amount: payAmt,
        payment_mode: paymentMode,
        remarks: remarks.trim() || "Early prepayment",
      });

      if (res?.success) {
        showToast({ icon: "success", title: res.message || "Payment processed successfully!" });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast({ icon: "error", title: res?.message || "Failed to process payment" });
      }
    } catch (err) {
      showToast({ icon: "error", title: err?.message || "Error processing payment" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-2xs font-sans animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-300">
              <DollarSign size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
                <span>Prepayment / Early Settlement</span>
                <span className="px-2 py-0.2 rounded text-[11px] font-mono bg-white/20 text-emerald-100">
                  {loan.req_no || "N/A"}
                </span>
              </h2>
              <p className="text-[11px] text-emerald-100/80">
                {loan.employee_name} · Current Balance: ₹{currentBalance.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-white/10 text-emerald-100 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          {/* Balance Preview Card */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10.5px] uppercase font-bold tracking-wider block">Current Balance</span>
              <span className="text-base font-bold text-slate-800">₹{currentBalance.toLocaleString()}</span>
            </div>
            <ArrowRight size={18} className="text-slate-400" />
            <div>
              <span className="text-slate-500 text-[10.5px] uppercase font-bold tracking-wider block">Paying Now</span>
              <span className="text-base font-bold text-emerald-600">₹{payAmt.toLocaleString()}</span>
            </div>
            <ArrowRight size={18} className="text-slate-400" />
            <div className="text-right">
              <span className="text-slate-500 text-[10.5px] uppercase font-bold tracking-wider block">Remaining</span>
              <span className={`text-base font-bold ${remainingBal === 0 ? "text-blue-600" : "text-amber-600"}`}>
                ₹{remainingBal.toLocaleString()}
              </span>
            </div>
          </div>

          {isFullSettlement && (
            <div className="p-2.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-2 text-[11.5px]">
              <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
              <span>This payment will <strong>fully settle and close</strong> this loan account. Any future pending schedule installments will be waived.</span>
            </div>
          )}

          {/* Amount Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">
                Payment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAmount(String(currentBalance))}
                className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Pay Full Balance
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              min="1"
              max={currentBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full h-9 px-3 text-sm font-semibold border rounded-md border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
              placeholder="Enter amount..."
            />
          </div>

          {/* Payment Mode */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-700">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full h-9 px-3 text-xs border rounded-md border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none bg-white"
            >
              <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Payroll Adjustment">Payroll Adjustment</option>
            </select>
          </div>

          {/* Remarks */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-slate-700">Remarks / Reference</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Cheque #492819 / Bank UTR..."
              className="w-full h-9 px-3 text-xs border rounded-md border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="mt-2 pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60"
            >
              {submitting ? "Processing..." : "Confirm Prepayment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

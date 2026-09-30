import React, { useState, useEffect } from "react";
import { FaMagic, FaTimes, FaSyncAlt } from "react-icons/fa";
import SectionCard, { FormField, formInputClass } from "../../../../../components/Reusable/form/SectionCard";
import FieldRenderer from "../../../../../components/Reusable/form/FieldRenderer";
import { previewLeavePolicySchedule } from "../../../../../utils/api";
import { showToast } from "../../../../../components/Reusable/alert";

const LeavePolicyPreviewModal = ({ policy, onClose }) => {
  const [doj, setDoj] = useState(new Date().toISOString().split("T")[0]);
  const [fyYear, setFyYear] = useState(String(new Date().getFullYear()));
  const [existingCF, setExistingCF] = useState("0.00");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    try {
      setLoading(true);
      const res = await previewLeavePolicySchedule({
        policy,
        doj,
        fyYear,
        existingCF: parseFloat(existingCF) || 0,
      });
      if (res?.success) setResult(res.data);
    } catch (err) {
      showToast({ icon: "error", title: "Preview calculation failed." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl shadow-xl rounded-[6px]">
        <SectionCard
          title="Leave Credit Schedule Simulation"
          icon={<FaMagic />}
          theme="purple"
          bodyClassName="flex flex-col gap-4"
          right={
            <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" title="Close">
              <FaTimes />
            </button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <FormField label="Sample DOJ">
              <FieldRenderer fieldObj={{ type: "date" }} value={doj} onChange={setDoj} inputClassName={formInputClass(false)} />
            </FormField>
            <FormField label="Financial Year">
              <FieldRenderer
                fieldObj={{ inputProps: { type: "number" } }}
                value={fyYear}
                onChange={setFyYear}
                inputClassName={formInputClass(false)}
              />
            </FormField>
            <FormField label="Existing Carry Forward">
              <FieldRenderer
                fieldObj={{ inputProps: { type: "number", step: "0.5" } }}
                value={existingCF}
                onChange={setExistingCF}
                inputClassName={formInputClass(false)}
              />
            </FormField>
            <button
              type="button"
              onClick={runSimulation}
              disabled={loading}
              className="h-[32px] flex items-center justify-center gap-1.5 px-3 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              <FaSyncAlt className={`text-[11px] ${loading ? "animate-spin" : ""}`} />
              {loading ? "Calculating..." : "Re-Calculate"}
            </button>
          </div>

          {result && (
            <div className="border border-slate-200 rounded-md overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {result.schedule.map((s) => (
                      <th key={s.num} className="px-2 py-1.5 font-medium border-r border-slate-200">
                        {s.name}
                      </th>
                    ))}
                    <th className="px-2 py-1.5 font-semibold bg-[#e8f0fe] text-[#1a56db]">Accrued</th>
                    <th className="px-2 py-1.5 font-semibold bg-[#faf5ff] text-[#9333ea]">Carry Fwd</th>
                    <th className="px-2 py-1.5 font-semibold bg-[#ecfdf5] text-[#059669]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-200">
                    {result.schedule.map((s) => (
                      <td
                        key={s.num}
                        className={`px-2 py-1.5 border-r border-slate-100 ${s.isEligible ? "font-medium text-slate-700" : "bg-[#eef1f6] text-slate-400"}`}
                      >
                        {s.isEligible ? s.days : "0.00"}
                      </td>
                    ))}
                    <td className="px-2 py-1.5 font-bold text-[#1a56db] bg-[#e8f0fe]/50">{result.totalAccrued}</td>
                    <td className="px-2 py-1.5 font-bold text-[#9333ea] bg-[#faf5ff]/60">{result.carryForward}</td>
                    <td className="px-2 py-1.5 font-bold text-[#059669] bg-[#ecfdf5]/60">{result.grandTotal}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-[30px] px-4 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default LeavePolicyPreviewModal;

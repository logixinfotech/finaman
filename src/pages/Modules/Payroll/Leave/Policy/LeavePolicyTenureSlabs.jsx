import React from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import SectionCard, { formInputClass } from "../../../../../components/Reusable/form/SectionCard";
import FieldRenderer from "../../../../../components/Reusable/form/FieldRenderer";

const SLAB_NUM = { inputProps: { type: "number", step: "0.5" } };

const LeavePolicyTenureSlabs = ({ section, formData, onChange, isViewMode }) => {
  const slabs = formData.tenure_slabs || [];

  const addSlab = () => {
    const lastTo = slabs.length > 0 ? slabs[slabs.length - 1].to_years || 0 : 0;
    onChange("tenure_slabs", [...slabs, { from_years: lastTo, to_years: lastTo + 3, quota: formData.annual_quota || 12 }]);
  };

  const updateSlab = (idx, key, val) =>
    onChange(
      "tenure_slabs",
      slabs.map((s, i) => (i === idx ? { ...s, [key]: val === "" ? null : parseFloat(val) || 0 } : s))
    );

  const removeSlab = (idx) => onChange("tenure_slabs", slabs.filter((_, i) => i !== idx));

  const cell = (slab, idx, key, placeholder) => (
    <FieldRenderer
      fieldObj={placeholder ? { inputProps: { ...SLAB_NUM.inputProps, placeholder } } : SLAB_NUM}
      value={slab[key] ?? ""}
      disabled={isViewMode}
      onChange={(v) => updateSlab(idx, key, v)}
      inputClassName={formInputClass(isViewMode)}
    />
  );

  return (
    <SectionCard
      title={section.title}
      icon={section.icon}
      theme={section.theme}
      className={section.className}
      bodyClassName="flex flex-col"
      right={
        !isViewMode && (
          <button
            type="button"
            onClick={addSlab}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-[#9333ea] bg-white border border-[#e9d5ff] rounded hover:bg-[#faf5ff]"
          >
            <FaPlus className="text-[9px]" /> Add Slab
          </button>
        )
      }
    >
      <p className="text-[11px] text-slate-500">
        Optional: give more annual quota to experienced employees (e.g. 0–3 yrs: 12d, 3+ yrs: 15d).
      </p>

      {slabs.length === 0 ? (
        <div className="text-xs text-slate-400 italic border border-dashed border-slate-300 rounded-md py-3 text-center">
          No custom tenure slabs configured (standard annual quota applies to all).
        </div>
      ) : (
        <div className="border border-slate-200 rounded-md overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium w-10">#</th>
                <th className="px-3 py-1.5 text-left font-medium">From (Years)</th>
                <th className="px-3 py-1.5 text-left font-medium">To (Years)</th>
                <th className="px-3 py-1.5 text-left font-medium">Annual Quota (Days)</th>
                {!isViewMode && <th className="px-3 py-1.5 w-12" />}
              </tr>
            </thead>
            <tbody>
              {slabs.map((slab, idx) => (
                <tr key={idx} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 text-slate-500">{idx + 1}</td>
                  <td className="px-3 py-1.5">{cell(slab, idx, "from_years")}</td>
                  <td className="px-3 py-1.5">{cell(slab, idx, "to_years", "Above")}</td>
                  <td className="px-3 py-1.5">{cell(slab, idx, "quota")}</td>
                  {!isViewMode && (
                    <td className="px-3 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeSlab(idx)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Remove slab"
                      >
                        <FaTrash className="text-[11px]" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
};

export default LeavePolicyTenureSlabs;

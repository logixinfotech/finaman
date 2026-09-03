import { memo } from "react";
import FieldRenderer from "../../../../components/Reusable/form/FieldRenderer";

const INPUT_CLASS =
  "w-full h-[28px] px-[5px] text-[12.5px] border-[1.5px] border-[#c8d2e4] rounded-[5px] bg-[#fafbfd] outline-none transition-all font-['Segoe_UI',system-ui,Arial,sans-serif] text-[#0f172a] focus:border-[#1a56db] focus:bg-[#ffffff] focus:ring-[3px] focus:ring-[#1a56db]/10 hover:border-[#a0b0c8]";

const INPUT_CLASS_DISABLED =
  "w-full h-[28px] px-[5px] text-[12.5px] border-[1.5px] border-[#e2e8f4] rounded-[5px] bg-[#f0f3f8] text-[#64748b] outline-none cursor-default font-['Segoe_UI',system-ui,Arial,sans-serif]";

const SignBlock = memo(function SignBlock({ fieldObj, formData, onChange, disabled }) {
  const signs = fieldObj.signs || [];
  const inputClass = disabled ? INPUT_CLASS_DISABLED : INPUT_CLASS;

  return (
    <div className="col-span-full w-full mt-[6px]">
      {fieldObj.label && (
        <div className="flex items-center gap-2 mb-[6px]">
          <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#64748b] whitespace-nowrap">
            {fieldObj.label}
          </span>
          <div className="flex-1 h-px bg-[#dde1ea]" />
        </div>
      )}

      <div className="flex flex-wrap gap-x-[16px] gap-y-[8px]">
        {signs.map((s) => (
          <div key={s.key} className="flex flex-col gap-[3px] w-[320px] shrink-0">
            <label className="text-[12px] font-semibold text-[#1e293b] tracking-[0.1px] mb-[2px]">
              {s.label}
            </label>
            <div className="grid grid-cols-[1fr_140px] gap-[6px]">
              <FieldRenderer
                fieldObj={{ type: s.options ? "select" : "text", options: s.options }}
                value={formData[`${s.key}By`] ?? ""}
                disabled={disabled}
                onChange={(v) => onChange(`${s.key}By`, v)}
                className={inputClass}
              />
              <FieldRenderer
                fieldObj={{ type: "date" }}
                value={formData[`${s.key}On`] ?? ""}
                disabled={disabled}
                onChange={(v) => onChange(`${s.key}On`, v)}
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default SignBlock;
import { memo, useEffect, useRef, useLayoutEffect } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import FieldRenderer from "../../../../components/Reusable/form/FieldRenderer";

/* grid ke andar chhota auto-grow textarea — 26px se shuru */
function GridTextarea({ value, onChange, disabled }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 26)}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value || ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-[5px] py-[3px] text-[12.5px] leading-[18px] border-[1.5px] rounded-[5px]
                  outline-none resize-none overflow-hidden transition-all ${
        disabled
          ? "bg-[#f0f3f8] text-[#64748b] border-[#e2e8f4] cursor-default"
          : "bg-[#fafbfd] text-[#0f172a] border-[#c8d2e4] hover:border-[#a0b0c8] focus:border-[#1a56db] focus:bg-white"
      }`}
      style={{ minHeight: 26 }}
    />
  );
}

const ChildGrid = memo(function ChildGrid({ fieldObj, rows = [], onChange, disabled }) {
  const cols = fieldObj.columns || [];
  const list = Array.isArray(rows) ? rows : [];
  const minRows = fieldObj.minRows || 0;
  const maxRows = fieldObj.maxRows || 99;
  const fixed = !!fieldObj.fixedRows;
  const seededRef = useRef(false);
  const defaultCount = fieldObj.defaultRows?.length || 0;

  useEffect(() => {
    if (seededRef.current) return;
    if (list.length === 0 && defaultCount > 0) {
      seededRef.current = true;
      onChange(fieldObj.defaultRows.map((r) => ({ ...r })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length, defaultCount]);

  const setRow = (i, key, val) =>
    onChange(list.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  const addRow = () => onChange([...list, Object.fromEntries(cols.map((c) => [c.key, ""]))]);
  const delRow = (i) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <div className="col-span-full w-full">
      <div className="flex items-center gap-2 mb-[6px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#64748b] whitespace-nowrap">
          {fieldObj.label}
        </span>
        <div className="flex-1 h-px bg-[#dde1ea]" />
        {!disabled && !fixed && list.length < maxRows && (
          <button type="button" onClick={addRow}
                  className="h-[22px] px-[9px] text-[10.5px] font-semibold rounded-[4px]
                             bg-[#1a56db] hover:bg-[#1746b3] text-white flex items-center gap-[5px] shrink-0">
            <FaPlus className="text-[8px]" /> Add Row
          </button>
        )}
      </div>

            <div className="border-[1.5px] border-[#c8d2e4] rounded-[5px] overflow-visible bg-white">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-[#eef1f8] border-b-[1.5px] border-[#c8d2e4]">
              <th className="w-[30px] px-[4px] py-[5px] text-[10.5px] font-bold text-[#64748b]">#</th>
              {cols.map((c) => (
                <th key={c.key} style={{ width: c.width }}
                    className="px-[6px] py-[5px] text-left text-[10.5px] font-bold uppercase
                               tracking-[0.4px] text-[#475569]">
                  {c.label}
                </th>
              ))}
              {!disabled && !fixed && <th className="w-[30px]" />}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={cols.length + 2}
                    className="px-2 py-[16px] text-center text-[11.5px] text-[#94a3b8]">
                  {fieldObj.emptyText || "No entries yet."}
                </td>
              </tr>
            )}
            {list.map((row, i) => (
              <tr key={i} className={`align-top border-b border-[#eef1f6] last:border-b-0 ${
                    i % 2 ? "bg-[#fcfdfe]" : "bg-white"}`}>
                <td className="px-[4px] py-[4px] text-center text-[11px] text-[#94a3b8] align-middle">
                  {i + 1}
                </td>
                {cols.map((c) => (
  <td
    key={c.key}
    id={`field-container-${fieldObj.key}-${i}-${c.key}`}
    className="px-[5px] py-[4px]"
  >
    {c.type === "textarea" ? (
      <GridTextarea
        value={row[c.key] ?? ""}
        disabled={disabled || c.disabled}
        onChange={(v) => setRow(i, c.key, v)}
      />
    ) : (
      <FieldRenderer
        fieldObj={c}
        value={row[c.key] ?? ""}
        disabled={disabled || c.disabled}
        onChange={(v) => setRow(i, c.key, v)}
        formData={row}
      />
    )}
  </td>
))}
                {!disabled && !fixed && (
                  <td className="px-[4px] py-[4px] text-center align-middle">
                    {list.length > minRows && (
                      <button type="button" onClick={() => delRow(i)} title="Remove row"
                              className="text-[#c25a5a] hover:text-[#a03d3d] text-[10.5px]">
                        <FaTrash />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fieldObj.footer && (
        <p className="text-[10px] text-[#94a3b8] mt-[4px] leading-[14px]">{fieldObj.footer}</p>
      )}
    </div>
  );
});

export default ChildGrid;
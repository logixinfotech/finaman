import { memo, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { FaPlus, FaTrash, FaSignature } from "react-icons/fa";
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
                  outline-none resize-none overflow-hidden transition-all ${disabled
          ? "bg-[#f0f3f8] text-[#64748b] border-[#e2e8f4] cursor-default"
          : "bg-[#fafbfd] text-[#0f172a] border-[#c8d2e4] hover:border-[#a0b0c8] focus:border-[#1a56db] focus:bg-white"
        }`}
      style={{ minHeight: 26 }}
    />
  );
}

// 🆕 auto-sign ke liye aaj ki date, input[type=date] ke format mein
const todayISO = () => new Date().toISOString().slice(0, 10);

const ChildGrid = memo(function ChildGrid({
  fieldObj, rows = [], onChange, disabled,
  currentUserRole = null,   // 🆕 useQmsModule → master page → FormBody se aayega
  currentUserName = null,
}) {
  const cols = fieldObj.columns || [];
  const list = Array.isArray(rows) ? rows : [];
  const minRows = fieldObj.minRows || 0;
  const maxRows = fieldObj.maxRows || 99;
  const fixed = !!fieldObj.fixedRows;
  const seededRef = useRef(false);
  const defaultCount = fieldObj.defaultRows?.length || 0;

  // 🆕 row-level lock — sirf jin grids mein config mein diya ho, unhi mein active hota hai
  const rowLockField = fieldObj.rowLockField || null;      // e.g. "RoleTitle"
  const rowLockColumns = fieldObj.rowLockColumns || [];     // e.g. ["Comments", "SignBy"]

  // 🆕 Department naam se defaultRows ka lookup — purane saved records mein
  // RoleTitle/exemptFromLock missing ho to yahan se fallback milega
  const defaultsByDept = useMemo(() => {
    const map = {};
    (fieldObj.defaultRows || []).forEach((r) => {
      if (r.Department) map[r.Department] = r;
    });
    return map;
  }, [fieldObj.defaultRows]);

  // 🆕 saved row + config ka default merge — sirf permission-check ke liye
  const getEffectiveRow = (row) => {
    const fallback = defaultsByDept[row.Department];
    if (!fallback) return row;
    return {
      ...row,
      RoleTitle: row.RoleTitle ?? fallback.RoleTitle,
      exemptFromLock: row.exemptFromLock ?? fallback.exemptFromLock,
    };
  };

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

  // 🆕 ye row current user ki "apni" row hai ya nahi
  const rowMatchesUser = (row) => {
    if (row.exemptFromLock) return true;
    if (!rowLockField || !currentUserRole) return false;
    const key = row[rowLockField] ?? row.Department;
    return String(key || "").trim().toLowerCase() === String(currentUserRole).trim().toLowerCase();
  };

  // 🆕 Sign button click — SignBy + uska paired date column ek saath bharta hai
  const handleSign = (i, col) => {
    if (!currentUserName) return;
    const dateKey = col.dateKey || null;
    onChange(list.map((r, idx) =>
      idx === i ? { ...r, [col.key]: currentUserName, ...(dateKey ? { [dateKey]: todayISO() } : {}) } : r
    ));
  };

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
            {list.map((row, i) => {
              const effRow = getEffectiveRow(row);           // 🆕
              const isOwnRow = rowMatchesUser(effRow);        // 🔧 row → effRow
              // // 🆕 ek baar sign ho gaya to poori row (rowLockColumns) permanently freeze
              // // 🔍 TEMPORARY DEBUG — hata dena baad mein
              // console.log(`[ChildGrid] row ${i}`, {
              //   Department: row.Department,
              //   savedRoleTitle: row.RoleTitle,
              //   effectiveRoleTitle: effRow.RoleTitle,
              //   currentUserRole,
              //   isOwnRow,
              // });
              const rowSigned = cols.some((c) => c.autoSign && row[c.key]);

              return (
                <tr key={i} className={`align-top border-b border-[#eef1f6] last:border-b-0 ${i % 2 ? "bg-[#fcfdfe]" : "bg-white"}`}>
                  <td className="px-[4px] py-[4px] text-center text-[11px] text-[#94a3b8] align-middle">
                    {i + 1}
                  </td>
                  {cols.map((c) => {
                    const isRowLocked = rowLockColumns.includes(c.key);
                    // rowLockColumns: sirf department-match aur sign-status decide karta hai — section-level `disabled` yahan lagu NAHI hota
                    // baaki columns (jaise "Required"): purana behavior — section-level `disabled` chalta hai
                    const lockedForMe = isRowLocked && (!isOwnRow || rowSigned);

                    // 🆕 auto-sign column ka special render — dropdown nahi, button ya locked naam
                    if (c.autoSign) {
                      const signedName = row[c.key];
                      const canSignThis = isOwnRow && !signedName;
                      return (
                        <td key={c.key} className="px-[5px] py-[4px] align-middle">
                          {signedName ? (
                            <span className="text-[12px] text-[#0f172a]">{signedName}</span>
                          ) : canSignThis ? (
                            <button type="button" onClick={() => handleSign(i, c)}
                              className="h-[24px] px-[8px] text-[10.5px] font-semibold rounded-[4px]
                                               bg-[#059669] hover:bg-[#047857] text-white flex items-center gap-[4px]">
                              <FaSignature className="text-[9px]" /> Sign
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#94a3b8]">—</span>
                          )}
                        </td>
                      );
                    }

                    return (
                      <td
                        key={c.key}
                        id={`field-container-${fieldObj.key}-${i}-${c.key}`}
                        className="px-[5px] py-[4px]"
                      >
                        {c.type === "textarea" ? (
                          <GridTextarea
                            value={row[c.key] ?? ""}
                            disabled={isRowLocked ? lockedForMe : (disabled || c.disabled)}
                            onChange={(v) => setRow(i, c.key, v)}
                          />
                        ) : (
                          <FieldRenderer
                            fieldObj={c}
                            value={row[c.key] ?? ""}
                            disabled={isRowLocked ? lockedForMe : (disabled || c.disabled)}
                            onChange={(v) => setRow(i, c.key, v)}
                            formData={row}
                          />
                        )}
                      </td>
                    );
                  })}
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
              );
            })}
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
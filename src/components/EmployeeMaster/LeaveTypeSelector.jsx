
import { useEffect, useState } from "react";
import { getLeaveTypes } from "../../utils/api";

const LeaveTypeSelector = ({ value, onChange, disabled }) => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [open, setOpen] = useState(false);

  const safeValue = Array.isArray(value)
    ? value
    : (value && typeof value === "string" && value.trim() !== "")
      ? value.split(",").filter(Boolean)
      : [];

  useEffect(() => {
    getLeaveTypes().then(res => {
      setLeaveTypes(res?.data || []);
    });
  }, []);

  
  const toggleSelect = (id) => {
  if (disabled) return;

  const already = safeValue.includes(id);

  const updated = already
    ? safeValue.filter(v => v !== id)
    : [...safeValue, id];

  const selectedNames = leaveTypes
    .filter(lt => updated.includes(lt.leave_type_id))
    .map(lt => lt.leave_name);

  onChange(updated, selectedNames);
};

  return (
    <div className="relative w-full">
      <div
        onClick={() => !disabled && setOpen(o => !o)}
        className={`
          w-full min-h-[36px] px-3 py-1.5 border rounded text-sm
          flex flex-wrap gap-1 items-center cursor-pointer
          ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:border-blue-400"}
          border-gray-300
        `}
      >
        {safeValue.length === 0 ? (                            
          <span className="text-gray-400">Select Leave Types...</span>
        ) : (
          leaveTypes
            .filter(lt => safeValue.includes(lt.leave_type_id))
            .map(lt => (
              <span
                key={lt.leave_type_id}
                className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              >
                {lt.leave_name}
                {!disabled && (
                  <button
                    onClick={e => { e.stopPropagation(); toggleSelect(lt.leave_type_id); }}
                    className="text-blue-400 hover:text-red-500 font-bold"
                  >×</button>
                )}
              </span>
            ))
        )}
      </div>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-52 overflow-y-auto">
          {leaveTypes.map(lt => (
            <label
              key={lt.leave_type_id}
              className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 cursor-pointer"
            >
              <input
                type="checkbox"
               checked={safeValue.includes(lt.leave_type_id)}
                onChange={() => toggleSelect(lt.leave_type_id)}
                className="accent-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{lt.leave_name}</p>
                <p className="text-xs text-gray-600">{lt.leave_code} · {lt.max_days} days</p>
              </div>
            </label>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default LeaveTypeSelector;
import { useState } from "react";
const STATUS_OPTIONS = [
  { value: "PRESENT",     label: "Present" },
  { value: "ABSENT",      label: "Absent" },
  { value: "HOLIDAYS",    label: "Holiday" },
  { value: "WEEK OFF",    label: "Week Off" },
  { value: "HOLIDAY OT",  label: "Holiday OT" },
  { value: "WEEK OFF OT", label: "Week Off OT" },
  { value: "CL",          label: "CL" },
  { value: "SL",          label: "SL" },
  { value: "PL",          label: "PL" },
  { value: "EL",          label: "EL" },
  { value: "ML",          label: "ML" },
];

const F = "'Inter','Segoe UI',system-ui,sans-serif";

const Label = ({ children }) => (
  <p style={{
    fontSize: 9, fontWeight: 700, letterSpacing: ".07em",
    textTransform: "uppercase", color: "#6b7280", marginBottom: 4,
    fontFamily: F,
  }}>
    {children}
  </p>
);

const inputStyle = {
  height: 30, width: "100%", padding: "0 8px", fontSize: 12,
  border: "1px solid #d1d5db", borderRadius: 6, outline: "none",
  background: "#fff", color: "#1f2937", fontFamily: F,
  boxSizing: "border-box",
};

const DailyAttendanceFilter = ({
  filters,      // initial values ke liye
  employees = [],
  departments = [],
  onApply,
  onReset,
}) => {
  // ✅ Local state — parent filters directly change mat karo
  const [local, setLocal] = useState({
    from_date:         filters.from_date         || "",
    to_date:           filters.to_date           || "",
    employee_id:       filters.employee_id       || "",
    department_id:     filters.department_id     || "",
    attendance_status: filters.attendance_status || "",
  });

  const handleApply = () => {
    onApply?.(local);  // ✅ Apply pe hi parent ko pass karo
  };

  const handleReset = () => {
    const empty = {
      from_date: "", to_date: "", employee_id: "",
      department_id: "", attendance_status: "",
    };
    setLocal(empty);
    onReset?.();
  };

  return (
    <div style={{ background:"#fff", borderBottom:"1px solid #e8eaf0", padding:"10px 16px", fontFamily:F, flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"flex-end", gap:12, flexWrap:"wrap" }}>

        <div style={{ minWidth:130 }}>
          <Label>From Date</Label>
          <input type="date" value={local.from_date}
            onChange={e => setLocal(p => ({ ...p, from_date: e.target.value }))}
            style={inputStyle} />
        </div>

        <div style={{ minWidth:130 }}>
          <Label>To Date</Label>
          <input type="date" value={local.to_date}
            onChange={e => setLocal(p => ({ ...p, to_date: e.target.value }))}
            style={inputStyle} />
        </div>

        <div style={{ minWidth:160 }}>
          <Label>Employee</Label>
          <select value={local.employee_id}
            onChange={e => setLocal(p => ({ ...p, employee_id: e.target.value }))}
            style={inputStyle}>
            <option value="">All Employees</option>
            {employees.map(e => (
              <option key={e.Actled_id} value={e.Actled_id}>
                {e.Led_name} {e.Led_code ? `(${e.Led_code})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth:150 }}>
          <Label>Department</Label>
          <select value={local.department_id}
            onChange={e => setLocal(p => ({ ...p, department_id: e.target.value }))}
            style={inputStyle}>
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.group_id} value={d.group_id}>{d.group_name}</option>
            ))}
          </select>
        </div>

        <div style={{ minWidth:130 }}>
          <Label>Status</Label>
          <select value={local.attendance_status}
            onChange={e => setLocal(p => ({ ...p, attendance_status: e.target.value }))}
            style={inputStyle}>
            <option value="">All</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
          <button onClick={handleReset} style={{ height:30, padding:"0 12px", borderRadius:6, border:"1px solid #d1d5db", background:"#fff", color:"#374151", fontSize:12, cursor:"pointer" }}>
            Reset
          </button>
          <button onClick={handleApply} style={{ height:30, padding:"0 16px", borderRadius:6, border:"none", background:"#185FA5", color:"#E6F1FB", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyAttendanceFilter;
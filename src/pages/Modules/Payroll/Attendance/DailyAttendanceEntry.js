import * as XLSX from "xlsx";
import React, { useState, useRef, useEffect } from "react";
import ERPHeader from "../../../../components/Reusable/form/HeaderForm";
import ERPFooter from "../../../../components/Reusable/form/FooterForm";
import { saveAttendanceLog, getActledList, updateAttendance, getAttendanceList } from "../../../../utils/api";
import ERPAutocomplete from "../../../../components/Reusable/input/ERPAutocomplete";

const AttendancePage = ({
  formData,
  setFormData,
  mode = "view",
  onModify,
  onDelete,
  onPrint,
  onNewEntry,
  onEditCancel,
  saving,
  canPrint,
  rights
}) => {
  // New state to manage the selected attendance type
  const [attendanceType, setAttendanceType] = useState("Manual"); // Default to Manual
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("April");
  const [selectedYear, setSelectedYear] = useState("2026");


  const [attendanceData, setAttendanceData] = useState({
    1: { in: "10:03", out: "18:34", status: "PRESENT" },
    5: { in: "--:--", out: "--:--", status: "WEEKLY OFF" },
  });

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = ["2024", "2025", "2026", "2027", "2028"];

  const monthIndex = months.indexOf(selectedMonth);
  const yearNum = parseInt(selectedYear);
  const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
  const firstDayOfMonth = new Date(yearNum, monthIndex, 1).getDay();
  const totalSlots = daysInMonth + firstDayOfMonth;
  const calendarGrid = Array.from({ length: Math.ceil(totalSlots / 7) * 7 });

  const statusOptions = [
    { label: "PRESENT", value: "PRESENT" },
    { label: "ABSENT", value: "ABSENT" },
    { label: "CASUAL LEAVE", value: "CASUAL LEAVE" },
    { label: "LEAVE", value: "LEAVE" },
    { label: "WEEKLY OFF", value: "WEEKLY OFF" },
    { label: "UNPAID", value: "UNPAID" },
    { label: "HOLIDAYS", value: "HOLIDAYS" },
  ];


  // Options for the attendance type dropdown
  const attendanceTypeOptions = [
    { label: "Manual Entry", value: "Manual" },
    { label: "Biometric Integration", value: "Biometric" },
    { label: "Excel Import", value: "Excel" },
  ];

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await getActledList();
        console.log("API Response:", res);

        // ✅ FIX
        setEmployees(Array.isArray(res) ? res : res?.data || []);

      } catch (err) {
        console.error("Employee fetch error", err);
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    if (mode === "edit" && formData.employee_id) {
      fetchAttendance();
    }
  }, [formData.employee_id, selectedMonth, selectedYear, mode]);

  const fetchAttendance = async () => {
    if (!formData.employee_id) return;

    try {
      const res = await getAttendanceList({
        employee_id: formData.employee_id,
        month: selectedMonth,
        year: selectedYear
      });

      if (res?.data) {
        const formatted = {};

        res.data.forEach(item => {
          const day = new Date(item.in_time).getDate();

          formatted[day] = {
            in: item.in_time,
            out: item.out_time,
            status: item.punch_type
          };
        });

        setAttendanceData(formatted);
      }

    } catch (err) {
      console.error(err);
    }
  };

  const employeeOptions = employees.map(emp => ({
    label: emp.Led_name,
    value: emp.Led_code,
    id: emp.Actled_id
  }));

  const handleDataChange = (day, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "PRESENT": return "bg-green-600 text-white border-green-700";
      case "ABSENT": return "bg-red-400 text-white border-red-700";
      case "WEEKLY OFF": return "bg-orange-400 text-white border-orange-600";
      case "LEAVE": return "bg-blue-400 text-white border-blue-700";
      case "CASUAL LEAVE": return "bg-purple-400 text-white border-purple-700";
      case "HOLIDAYS": return "bg-yellow-400 text-white border-yellow-600";
      case "UNPAID": return "bg-slate-400 text-white border-slate-700";
      default: return "bg-white text-slate-700 border-slate-300";
    }
  };

  const labelClass = "text-[10px] font-bold text-slate-400 mb-0.5 block uppercase tracking-wider";

  const handleSave = async () => {
    try {
      if (!formData.employee_id) {
        alert("Please select employee");
        return;
      }

      const monthNumber = months.indexOf(selectedMonth) + 1;

      const payload = {
        employee_id: formData.employee_id || "",
        punch_type: attendanceType || "Manual",
        in_time: formData.intime || "",
        out_time: formData.outtime || "",
      };
      console.log("UPDATE PAYLOAD:", payload);

      let res;

      if (formData.log_id) {
        // 🔥 UPDATE MODE
        res = await updateAttendance(formData.log_id, payload);
      } else {
        // NEW ENTRY
        res = await saveAttendanceLog({
          month: monthNumber,
          year: selectedYear,
          attendanceType,
          attendanceData,
          employee_id: formData.employee_id
        });
      }

      if (res?.success) {
        alert("Saved Successfully");
      }

    } catch (err) {
      console.error(err);
      alert("Error");
    }
  };

  const downloadSampleFile = () => {
    const sampleData = [
      {
        Date: "2026-04-01",
        In: "10:00",
        Out: "18:30",
        ID: "EMP001"
      },
      {
        Date: "2026-04-02",
        In: "10:15",
        Out: "18:40",
        ID: "EMP001"
      },
      {
        Date: "2026-04-03",
        In: "09:55",
        Out: "18:20",
        ID: "EMP001"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    XLSX.writeFile(workbook, "Sample_Attendance.xlsx");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const formatted = {};

      jsonData.forEach((row) => {
        let dateValue = row.Date;

        // ✅ Excel date fix
        if (typeof dateValue === "number") {
          const excelDate = XLSX.SSF.parse_date_code(dateValue);
          dateValue = `${excelDate.y}-${excelDate.m}-${excelDate.d}`;
        }

        const dateObj = new Date(dateValue);
        const day = dateObj.getDate();

        // ✅ TIME FIX (string clean)
        const formatTime = (val) => {
          if (!val) return "--:--";

          if (typeof val === "number") {
            const totalSeconds = Math.round(val * 24 * 60 * 60);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          }

          return val.toString().slice(0, 5);
        };

        formatted[day] = {
          in: formatTime(row.In),
          out: formatTime(row.Out),
          status: "PRESENT"
        };
      });

      setAttendanceData(formatted);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleEmployeeSelect = (selectedLabel) => {
    const selectedEmp = employees.find(
      e => e.Led_name === selectedLabel
    );

    if (selectedEmp) {
      setFormData(prev => ({
        ...prev,
        employee_name: selectedEmp.Led_name,   // led_name
        employee_code: selectedEmp.Led_code,   // led_code
        employee_id: selectedEmp.Actled_id,    // actled_id ✅
        designation: selectedEmp.Designation || ""
      }));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-lg border flex flex-col h-[calc(100vh-120px)] overflow-hidden font-sans">
      <ERPHeader title="DAILY ATTENDANCE MANAGEMENT" isViewMode={mode === "view"} />

      <div className="flex flex-1 bg-gray-50 min-h-0">
        <div className="flex w-full p-3 gap-3 overflow-hidden">

          {/* LEFT PROFILE SIDEBAR */}
          <div className="w-45 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden shrink-0">
            <div className="bg-slate-800 h-20 w-full relative mb-12">
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-lg border">
                  <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center border border-dashed border-slate-300">
                    <span className="text-[10px] font-black text-slate-400">PHOTO</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 text-center space-y-1">
              <h2 className="text-base font-black text-slate-800 uppercase leading-none">{formData.employee_name}</h2>
              <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest">{formData.designation}</p>
              <div className="flex justify-center gap-1 mt-2">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-bold border">ID: {formData.employee_code}</span>
                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[11px] font-bold border border-blue-100">{formData.department}</span>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto mt-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 text-center">
                  <span className="text-[8px] font-black text-emerald-600 block mb-0.5 tracking-tighter">PRESENT</span>
                  <span className="text-lg font-black text-emerald-700">06</span>
                </div>
                <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-center">
                  <span className="text-[8px] font-black text-red-600 block mb-0.5 tracking-tighter">ABSENT</span>
                  <span className="text-lg font-black text-red-700">00</span>
                </div>
              </div>

              {/* Conditional Biometric Details in Sidebar */}
              {attendanceType === "Biometric" && (
                <div className="space-y-3 pt-1 border-t border-dashed">
                  <div>
                    <label className={labelClass}>Biometric Path</label>
                    <div className="flex shadow-sm">
                      <input type="text" value={formData.path} className="w-full h-7 text-[9px] border border-gray-200 rounded-l-md px-2 bg-slate-50" readOnly />
                      <button className="px-2 bg-slate-100 border border-l-0 border-gray-200 rounded-r-md text-xs">...</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className={labelClass}>Grade</label>
                      <input type="text" value={formData.grade} className="w-full h-7 text-[10px] border border-gray-200 rounded-md px-2 bg-white" readOnly />
                    </div>
                    <div>
                      <label className={labelClass}>Bio ID</label>
                      <input type="text" value={formData.employees_code} className="w-full h-7 text-[10px] border border-gray-200 rounded-md px-2 bg-white" readOnly />
                    </div>
                  </div>
                </div>
              )}
              {attendanceType === "Excel" && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <span className="text-[10px] font-black text-blue-700 block mb-2 uppercase">Import Rules:</span>
                  <ul className="text-[9px] text-blue-600 space-y-1 font-bold">
                    <li>• File must be .xlsx or .csv</li>
                    <li>• Columns: Date, In, Out, ID</li>
                    <li>• Max file size: 5MB</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT CONTENT AREA */}
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            {/* COMPACT TOP BAR - Attendance Type moved here */}
            <div className="bg-white p-2 px-4 rounded-xl border shadow-sm flex items-center justify-between shrink-0">
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2 border-r pr-4">
                  <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">Attendance Mode:</span>
                  <select
                    value={attendanceType}
                    onChange={(e) => setAttendanceType(e.target.value)}
                    className="h-7 text-[11px] font-bold border rounded px-2 text-slate-600"
                  >
                    {attendanceTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 items-center">
                  <span className="text-[11px] font-bold text-slate-600 uppercase">Period:</span>
                  {/* Full 12 Months Selection */}
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="h-7 text-[11px] font-bold border rounded px-2 text-slate-600"
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {/* Years Selection */}
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="h-7 text-[11px] font-bold border rounded px-2 text-slate-600"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 border-r pr-4">
                  <span className="text-[11px] font-bold text-slate-600 uppercase">
                    Employee:
                  </span>

                  <ERPAutocomplete
                    options={employeeOptions.map(opt => opt.label)}   // 👈 IMPORTANT
                    value={employeeOptions.find(e => e.id === formData.employee_id)?.label || ""}
                    onChange={handleEmployeeSelect}
                    className="h-7 text-[11px] font-bold border rounded px-2 text-slate-600"

                  />
                </div>
              </div>


              {attendanceType === "Biometric" && (
                <div className="flex flex-col gap-2">

                  <div className="flex gap-2">
                    {/* Import Button */}
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="h-7 px-4 bg-slate-700 text-white rounded text-[10px] font-bold uppercase shadow-sm hover:bg-slate-800"
                    >
                      Import Logs
                    </button>

                    {/* Sample Download Button */}
                    <button
                      onClick={downloadSampleFile}
                      className="h-7 px-4 bg-green-600 text-white rounded text-[10px] font-bold uppercase shadow-sm hover:bg-green-700"
                    >
                      Sample File
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => {
                        setSelectedFile(e.target.files[0]);
                        handleFileUpload(e);
                      }}
                    />
                  </div>

                  {/* 👇 file preview */}
                  {selectedFile && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-emerald-700 truncate max-w-[200px]">
                        {selectedFile.name}
                      </span>
                      <span className="text-[9px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                        UPLOADED
                      </span>
                    </div>
                  )}

                </div>
              )}


            </div>


            {/* Main Content Area - Conditional UI based on attendanceType */}
            <div className="flex-1 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden min-h-0">
              {attendanceType === "Manual" && (
                <>
                  {/* CALENDAR VIEW */}
                  <div className="grid grid-cols-7 bg-slate-50 border-b shrink-0">
                    {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(day => (
                      <div key={day} className="py-2.5 text-center text-[11px] font-bold text-slate-500 tracking-tighter">{day}</div>
                    ))}
                  </div>

                  <div className="flex-1 grid grid-cols-7 divide-x divide-y border-l border-b overflow-y-auto">
                    {calendarGrid.map((_, index) => {
                      const dayNum = index - firstDayOfMonth + 1;
                      const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
                      const isSunday = index % 7 === 0;

                      const data = attendanceData?.[dayNum] ?? { in: "--:--", out: "--:--", status: "" };

                      return (
                        <div key={index} className={`relative p-1.5 flex flex-col justify-between min-h-[85px] transition-all 
            ${!isValidDay ? 'bg-slate-50/50' : isSunday ? 'bg-red-50/30' : 'hover:bg-slate-50 bg-white'}`}>

                          {isValidDay && (
                            <>
                              <div className="flex justify-between items-start">
                                <span className={`text-[11px] font-bold ${isSunday ? 'text-red-600' : 'text-slate-600'}`}>
                                  {dayNum < 10 ? `0${dayNum}` : dayNum}
                                </span>

                                {/* Dropdown status logic same rahegi */}
                                <select
                                  value={data.status}
                                  onChange={(e) => handleDataChange(dayNum, "status", e.target.value)}
                                  className={`text-[10px] font-bold border rounded px-1 h-4 w-15 outline-none cursor-pointer appearance-none text-center ${getStatusStyle(data.status)}`}
                                >
                                  <option value="">- SELECT -</option>
                                  {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value} className="bg-white text-slate-800">{opt.label}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="mt-1 space-y-0.5">
                                <div className="flex flex-row gap-1 items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] text-slate-500 font-bold uppercase">In Time</span>
                                    <input type="text" value={data.in} onChange={(e) => handleDataChange(dayNum, "in", e.target.value)} className="text-[10px] font-mono font-bold w-12 h-4 border rounded px-1" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[8px] text-slate-500 font-bold uppercase">Out Time</span>
                                    <input type="text" value={data.out} onChange={(e) => handleDataChange(dayNum, "out", e.target.value)} className="text-[10px] font-mono font-bold w-12 h-4 border rounded px-1" />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {attendanceType === "Biometric" && (
                <>
                  {/* BIOMETRIC VIEW - Example Table View */}
                  <div className="grid grid-cols-6 bg-slate-50 border-b shrink-0 text-left font-black text-slate-500 text-[10px] uppercase tracking-wider">
                    <div className="p-3 pl-4">Date</div>
                    <div className="p-3">In Time</div>
                    <div className="p-3">Out Time</div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y">
                    {Object.entries(attendanceData).map(([day, data]) => (
                      <div key={day} className="grid grid-cols-6 text-xs text-slate-700 items-center hover:bg-slate-50">
                        <div className="p-3 pl-4 font-bold">{day} April 2026</div>
                        <div className="p-3 font-mono font-semibold text-blue-700">{data.in}</div>
                        <div className="p-3 font-mono font-semibold text-blue-700">{data.out}</div>
                        <div className="p-3 font-mono text-[11px] text-slate-500">{formData.employees_code}</div>
                      </div>
                    ))}
                    {Object.keys(attendanceData).length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-sm italic">
                        No logs imported for this period yet. Click 'Import Logs'.
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 3. EXCEL IMPORT MODE (List nahi dikhegi, sirf Import UI) */}
              {attendanceType === "Excel" && (
                <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/30">
                  <div className="max-w-md w-full bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 uppercase mb-1">Import Excel Attendance</h3>
                    <p className="text-[11px] text-slate-500 mb-6">Select your attendance sheet to process data</p>

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => {
                        setSelectedFile(e.target.files[0]);
                        handleFileUpload(e);
                      }}
                    />

                    {!selectedFile ? (
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-[11px] font-bold uppercase hover:bg-blue-700 shadow-md transition-all active:scale-95"
                      >
                        Browse File
                      </button>
                    ) : (
                      <div className="w-full">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-emerald-700 truncate max-w-[200px]">{selectedFile.name}</span>
                          <span className="text-[9px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-black">READY</span>
                        </div>
                        <button className="w-full bg-slate-800 text-white py-2 rounded-lg text-[11px] font-bold uppercase hover:bg-slate-900">
                          Process & Save Data
                        </button>
                      </div>
                    )}

                    {Object.keys(attendanceData).length > 0 && (
                      <div className="mt-4 w-full max-h-40 overflow-auto border rounded text-[10px]">
                        <table className="w-full">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="p-1 border">Day</th>
                              <th className="p-1 border">In</th>
                              <th className="p-1 border">Out</th>
                              <th className="p-1 border">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(attendanceData).map(([day, val]) => (
                              <tr key={day}>
                                <td className="border p-1">{day}</td>
                                <td className="border p-1">{val.in}</td>
                                <td className="border p-1">{val.out}</td>
                                <td className="border p-1">{val.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <ERPFooter
        isAddMode={mode === "add"}
        isEditMode={mode === "edit"}
        isViewMode={mode === "view"}

        handleSubmit={handleSave}
        onCancel={() => { }}

        onModify={onModify}
        onDelete={onDelete}
        onPrint={() =>
          onPrint({
            ...formData,
            month: selectedMonth,
            year: selectedYear,
            attendanceData
          })
        }
        onNewEntry={onNewEntry}
        onEditCancel={onEditCancel}

        saving={saving}
        canPrint={canPrint}
        rights={rights}

        showPrevious={false}
        showNext={false}
      />
    </div>
  );
};

export default AttendancePage;
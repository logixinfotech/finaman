import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { importEmployees } from "../../utils/api";

const F = "'Inter','Segoe UI',system-ui,sans-serif";
 
const COLUMN_MAP = {
    "Title": "Title", "Gender": "Gender", "First Name": "Led_name",
    "Last Name": "Led_alias", "Date of Birth": "Dob", "Blood Group": "Blood",
    "Religion": "Religion", "Father's / Guardian's Name": "F_name",
    "Mother's Name": "M_name", "Anniversary Date": "Doa", "Spouse Name": "Spouse",
    "Qualification": "E_qua", "Professional Qualification": "P_qua",
    "Mobile No": "Mobile", "Personal Email": "Email",
    "Phone (Residence)": "Phone_residence", "Emerg_Contact Person": "Person",
    "Emerg_Relationship": "Relation", "Emerg_Mobile No": "Phone",
    "Emerg_Alternate No": "Alt_phone", "Driving Licence": "Driving",
    "Aadhaar No": "Aadhar", "Voter ID": "Voter", "PAN Number": "Pan_no",
    "Passport No": "Passport", "C_Address Line 1": "Add1", "C_City": "City",
    "C_District": "Area", "C_Pin Code": "Pin", "C_State": "State",
    "P_Address Line 1": "Padd1", "P_City": "Pcity", "P_District": "Parea",
    "P_Pin Code": "Ppin", "P_State": "Pstate", "Bank Name": "Bank_name",
    "IFSC Code": "Bank_ifsc", "Branch Name": "Bank_add", "Account Number": "Bank_acc",
    "Employment Type": "Emp_type", "Employee ID": "Led_code",
    "Grade / Level": "Op_id1", "Division": "Op_id2",
    "Branch / Location": "Branch_location", "Department": "Op_id3",
    "Designation": "Op_id5", "Reporting Manager": "Op_id6",
    "Status": "Approved", "Joining Date": "Doj", "Confirmation Date": "Doc",
    "Status Leaving Date": "Dol", "Status Reason": "Led_rsn",
    "PF Number": "Epf_no", "ESI Number": "Esic_no", "Basic": "Pay_amt",
    "Remarks": "Pay_rmks", "Middle Name": "Middle_name", "Nationality": "Nationality",
    "Category": "Category", "No. of Children": "No_of_children",
    "Passport Expiry": "Passport_expiry", "Specialization": "Specialization",
    "Alternate Mobile": "Alt_mobile", "Work Email": "Work_email",
    "Phone Extension": "Phone_ext", "C_Address Line 2": "C_Address2",
    "C_Country": "C_Country", "P_Address Line 2": "P_Address2",
    "P_Country": "P_Country", "Cost Centre": "Cost_centre",
    "Work Shift": "Work_shift", "Work Location Type": "Work_loc_type",
    "Employee Category": "Emp_category", "Probation Period": "Probation_period",
    "Notice Period": "Notice_period", "Previous Company": "Prev_company",
    "Last Designation": "Last_desig", "Last CTC": "Last_ctc",
    "Reason for Leaving": "Reason_leaving", "PF Account": "Pf_account_prev",
    "Account Type": "Account_type", "Holder Name": "Holder_name",
    "MICR Code": "Micr_code", "CTC": "Ctc", "HRA": "Hra",
    "Special Allowance": "Special_allow", "Salary Effective Date": "Salary_eff_date",
    "UAN": "Uan", "PT State": "Pt_state", "PF Applicable": "Pf_applicable",
    "ESI Applicable": "Esi_applicable", "Gratuity": "Gratuity",
    "TDS Category": "Tds_category", "Previous Experience": "Prev_exp",
    "Total Experience": "Total_exp",
    "Punch Number": "Punch_no",
    "TDS Applicable": "Is_tds",
};

const REQUIRED_COLS = ["First Name", "Mobile No", "Personal Email"];
 
const SAMPLE_ROWS = [
    {
        "Title": "Mr", "Gender": "Male", "First Name": "Ram", "Last Name": "Alias",
        "Date of Birth": "1990-01-01", "Blood Group": "O+", "Religion": "Hindu",
        "Father's / Guardian's Name": "Father", "Mother's Name": "Motherpppp",
        "Anniversary Date": "2020-01-01", "Spouse Name": "Wife",
        "Qualification": "Grad", "Professional Qualification": "PG",
        "Mobile No": "9999999999", "Personal Email": "rahul@test.com",
        "Phone (Residence)": "8999999999", "Emerg_Contact Person": "Rahul",
        "Emerg_Relationship": "Brother", "Emerg_Mobile No": "9898989811",
        "Emerg_Alternate No": "9888888888", "Driving Licence": "DL8654768546549",
        "Aadhaar No": "123456789012", "Voter ID": "ABC1234567",
        "PAN Number": "ABCDE1234F", "Passport No": "PASS123",
        "C_Address Line 1": "Addr1", "C_City": "Pune", "C_District": "Andheri",
        "C_Pin Code": "400001", "C_State": "gorakhpur",
        "P_Address Line 1": "Addr1", "P_City": "Pune", "P_District": "Andheri",
        "P_Pin Code": "400001", "P_State": "gorakhpur",
        "Bank Name": "HDFC", "IFSC Code": "HDFC0004201", "Branch Name": "Mumbai",
        "Account Number": "1234567809", "Employment Type": "FullTime",
        "Employee ID": "LED001", "Grade / Level": 122, "Division": 12,
        "Branch / Location": "Mumbai", "Department": 54, "Designation": 8,
        "Reporting Manager": 15, "Status": "Active",
        "Joining Date": "2021-01-01", "Confirmation Date": "2025-06-01",
        "Status Leaving Date": "", "Status Reason": "Reason",
        "PF Number": "43556365226", "ESI Number": "7367333283",
        "Basic": 45000, "Remarks": "Remarks", "Middle Name": "kumar",
        "Nationality": "Indian", "Category": "General", "No. of Children": 1,
        "Passport Expiry": "", "Specialization": "yuy",
        "Alternate Mobile": "9888888888", "Work Email": "A@gmail.com",
        "Phone Extension": "P001", "C_Address Line 2": "RTYTRY",
        "C_Country": "India", "P_Address Line 2": "RTYTRY", "P_Country": "India",
        "Cost Centre": "csdvfdvsdcf", "Work Shift": "General", "Work Location Type": "Office",
        "Employee Category": "Probation", "Probation Period": "3 Months",
        "Notice Period": "30 Days", "Previous Company": "TYTTY",
        "Last Designation": "TYTYTY", "Last CTC": 6767676,
        "Reason for Leaving": "Higher Studies", "PF Account": "76767676767667",
        "Account Type": "Current", "Holder Name": "Ram Alias", "MICR Code": "400229012",
        "CTC": 540000, "HRA": 18000, "Special Allowance": 4500,
        "Salary Effective Date": "2021-01-01",
        "UAN": "636563", "PT State": "Maharashtra", "PF Applicable": "Yes", "ESI Applicable": "Yes",
        "Gratuity": "Yes", "TDS Category": "Salaried", "Previous Experience": 3,
        "Total Experience": "5y 5m", "Punch Number": "P001", "TDS Applicable": 0,
    },
    {
        "Title": "Mr", "Gender": "Male", "First Name": "Mohan", "Last Name": "Alias2",
        "Date of Birth": "1992-02-02", "Blood Group": "A+", "Religion": "Hindu",
        "Father's / Guardian's Name": "Father", "Mother's Name": "Mother",
        "Anniversary Date": "2021-01-01", "Spouse Name": "Wife",
        "Qualification": "Grad", "Professional Qualification": "MBA",
        "Mobile No": "9999999999", "Personal Email": "amit@test.com",
        "Phone (Residence)": "", "Emerg_Contact Person": "Amit",
        "Emerg_Relationship": "Father", "Emerg_Mobile No": "9898989898",
        "Emerg_Alternate No": "", "Driving Licence": "DL1233333333333",
        "Aadhaar No": "987654321098", "Voter ID": "ABC1235467",
        "PAN Number": "PQRSX5678Z", "Passport No": "PASS456",
        "C_Address Line 1": "AddrA", "C_City": "Delhi", "C_District": "CP",
        "C_Pin Code": "110001", "C_State": "Delhi",
        "P_Address Line 1": "PAddr2", "P_City": "Delhi", "P_District": "Area2",
        "P_Pin Code": "110001", "P_State": "DL",
        "Bank Name": "SBI", "IFSC Code": "SBIN0001454", "Branch Name": "Delhi",
        "Account Number": "9876543210", "Employment Type": "FullTime",
        "Employee ID": "LED002", "Grade / Level": 122, "Division": 2,
        "Branch / Location": "Delhi", "Department": 34, "Designation": 55,
        "Reporting Manager": 6, "Status": "Active",
        "Joining Date": "2021-02-02", "Confirmation Date": "",
        "Status Leaving Date": "2031-02-02", "Status Reason": "Reason2",
        "PF Number": "543432", "ESI Number": "",
        "Basic": 3000, "Remarks": "Remarks2", "Middle Name": "",
        "Nationality": "Indian", "Category": "", "No. of Children": "",
        "Passport Expiry": "", "Specialization": "",
        "Alternate Mobile": "", "Work Email": "",
        "Phone Extension": "", "C_Address Line 2": "",
        "C_Country": "", "P_Address Line 2": "", "P_Country": "",
        "Cost Centre": "", "Work Shift": "", "Work Location Type": "",
        "Employee Category": "", "Probation Period": "",
        "Notice Period": "", "Previous Company": "",
        "Last Designation": "", "Last CTC": "",
        "Reason for Leaving": "", "PF Account": "",
        "Account Type": "Savings", "Holder Name": "", "MICR Code": "",
        "CTC": "", "HRA": "", "Special Allowance": "",
        "Salary Effective Date": "",
        "UAN": "", "PT State": "", "PF Applicable": "", "ESI Applicable": "",
        "Gratuity": "No", "TDS Category": "", "Previous Experience": "",
        "Total Experience": "5y 4m", "Punch Number": "P002", "TDS Applicable": 0,
    },
];

const downloadSample = () => {
    const headers = Object.keys(COLUMN_MAP);
    const rows = SAMPLE_ROWS.map(r => headers.map(h => r[h] !== undefined ? r[h] : ""));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(h => ({ wch: Math.max(13, Math.min(h.length + 4, 26)) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "Employee_Import_Sample.xlsx");
};

const STEPS = [
    { id: 1, label: "Upload file" },
    { id: 2, label: "Preview & validate" },
    { id: 3, label: "Import" },
];

export default function EmployeeImportModal({ onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState(null);
    const [rows, setRows] = useState([]);
    const [preview, setPreview] = useState([]);
    const [validationErrs, setValidationErrs] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const parseFile = (f) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const wb = XLSX.read(e.target.result, { type: "binary" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
            setRows(data);
            setPreview(data.slice(0, 5));
            const errs = [];
            data.forEach((row, i) => {
                REQUIRED_COLS.forEach(col => {
                    if (!row[col]) errs.push(`Row ${i + 2}: "${col}" is required`);
                });
            });
            setValidationErrs(errs.slice(0, 10));  
            setStep(2);
        };
        reader.readAsBinaryString(f);
    };

    const handleFileInput = (f) => {
        if (!f) return;
        setFile(f);
        setResult(null);
        parseFile(f);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFileInput(f);
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setResult(null);
        try {
            const fd = new FormData();
            fd.append("file", file);

            console.log("Uploading file:", file.name, file.size);
            const data = await importEmployees(fd);
            console.log("Import API response:", data);

            setResult(data);
            setStep(3);
            if (data.success) onSuccess?.();
        } catch (err) {
            console.error("Import upload error:", err);
            console.error("Error response:", err.response?.data);
            setResult({ success: false, message: err.message });
            setStep(3);
        } finally {
            setUploading(false);
        }
    };

    const reset = () => {
        setStep(1); setFile(null); setRows([]); setPreview([]);
        setValidationErrs([]); setResult(null); setUploading(false);
    };

    const allColumns = preview.length > 0 ? Object.keys(preview[0]) : [];
    const visibleCols = allColumns.slice(0, 7);

    return (
        <div style={{
            position: "fixed", inset: 0,
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(2px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, fontFamily: F,
        }}>
            <div style={{
                background: "#fff", borderRadius: 16, width: 780, maxHeight: "88vh",
                display: "flex", flexDirection: "column", overflow: "hidden",
                boxShadow: "0 24px 48px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
            }}>
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 22px", borderBottom: "1px solid #f0f2f6",
                    background: "linear-gradient(135deg,#f8faff,#fff)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: "linear-gradient(135deg,#185FA5,#378ADD)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            <span style={{ fontSize: 18, filter: "brightness(10)" }}>📥</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 15, fontWeight: 700, color: "#1f2937", margin: 0 }}>
                                Import Employees
                            </p>
                            <p style={{ fontSize: 11, color: "#9ca3b0", margin: 0, marginTop: 2 }}>
                                Bulk upload via Excel or CSV — {Object.keys(COLUMN_MAP).length} columns supported
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={downloadSample} style={{
                            height: 32, padding: "0 14px", borderRadius: 8,
                            border: "1.5px solid #d1d5db", background: "#f9fafb",
                            color: "#374151", fontSize: 11, fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6,
                        }}>
                            <span style={{ fontSize: 13 }}>⬇</span> Download sample
                        </button>
                        <button onClick={onClose} style={{
                            width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb",
                            background: "#f9fafb", color: "#6b7280", fontSize: 18,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            lineHeight: 1,
                        }}>×</button>
                    </div>
                </div>
                <div style={{
                    display: "flex", alignItems: "center", padding: "12px 22px",
                    borderBottom: "1px solid #f5f6fa", background: "#fafbff", gap: 0,
                }}>
                    {STEPS.map((s, i) => {
                        const done = step > s.id;
                        const current = step === s.id;
                        return (
                            <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: "50%",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 10, fontWeight: 700,
                                        background: done ? "#EAF3DE" : current ? "#185FA5" : "#f0f2f7",
                                        color: done ? "#27500A" : current ? "#fff" : "#9ca3b0",
                                        border: current ? "none" : done ? "none" : "1.5px solid #e5e7eb",
                                    }}>
                                        {done ? "✓" : s.id}
                                    </div>
                                    <span style={{
                                        fontSize: 11, fontWeight: 600,
                                        color: done ? "#3B6D11" : current ? "#185FA5" : "#9ca3b0",
                                    }}>{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div style={{
                                        flex: 1, height: 1.5, margin: "0 12px",
                                        background: done ? "#C0DD97" : "#e5e7eb",
                                    }} />
                                )}
                            </div>
                        );
                    })}
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
                    {step === 1 && (
                        <div>
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => inputRef.current?.click()}
                                style={{
                                    border: `2px dashed ${dragOver ? "#185FA5" : "#d1d5db"}`,
                                    borderRadius: 12, padding: "48px 24px",
                                    background: dragOver ? "#f0f6ff" : "#fafbff",
                                    cursor: "pointer", textAlign: "center",
                                    transition: "all 0.15s",
                                    marginBottom: 20,
                                }}
                            >
                                <input
                                    ref={inputRef} type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={e => handleFileInput(e.target.files[0])}
                                    style={{ display: "none" }}
                                />
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: 0 }}>
                                    Click to browse or drag & drop your file here
                                </p>
                                <p style={{ fontSize: 12, color: "#9ca3b0", marginTop: 6 }}>
                                    Supports .xlsx, .xls, .csv — Max 5MB
                                </p>
                            </div>
                            <div style={{ background: "#f8f9fc", borderRadius: 10, border: "1px solid #eef0f6", overflow: "hidden" }}>
                                <div style={{ padding: "10px 14px", borderBottom: "1px solid #eef0f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", margin: 0, textTransform: "uppercase", letterSpacing: ".05em" }}>
                                        Accepted columns ({Object.keys(COLUMN_MAP).length})
                                    </p>
                                    <span style={{ fontSize: 10, color: "#9ca3b0" }}>
                                        <span style={{ color: "#dc2626", fontWeight: 700 }}>*</span> Required
                                    </span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, maxHeight: 200, overflowY: "auto" }}>
                                    {Object.keys(COLUMN_MAP).map((col, i) => (
                                        <div key={col} style={{
                                            padding: "5px 12px", fontSize: 11,
                                            color: REQUIRED_COLS.includes(col) ? "#185FA5" : "#4b5563",
                                            fontWeight: REQUIRED_COLS.includes(col) ? 600 : 400,
                                            borderBottom: "0.5px solid #f0f2f6",
                                            borderRight: (i + 1) % 4 !== 0 ? "0.5px solid #f0f2f6" : "none",
                                            background: i % 2 === 0 ? "#fff" : "#fafbff",
                                        }}>
                                            {REQUIRED_COLS.includes(col) && <span style={{ color: "#dc2626", marginRight: 2 }}>*</span>}
                                            {col}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                                {[
                                    { label: "Total rows", value: rows.length, color: "#185FA5", bg: "#E6F1FB" },
                                    { label: "Valid rows", value: rows.length - validationErrs.length, color: "#27500A", bg: "#EAF3DE" },
                                    { label: "Issues found", value: validationErrs.length, color: validationErrs.length > 0 ? "#791F1F" : "#27500A", bg: validationErrs.length > 0 ? "#FCEBEB" : "#EAF3DE" },
                                ].map(({ label, value, color, bg }) => (
                                    <div key={label} style={{ background: bg, borderRadius: 10, padding: "10px 14px" }}>
                                        <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".07em", color, margin: 0, marginBottom: 4 }}>{label}</p>
                                        <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0 }}>{value}</p>
                                    </div>
                                ))}
                            </div>
                            {validationErrs.length > 0 && (
                                <div style={{ background: "#FCEBEB", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: "#791F1F", margin: 0, marginBottom: 6 }}>
                                        ⚠ Validation issues — fix these before importing
                                    </p>
                                    {validationErrs.map((e, i) => (
                                        <p key={i} style={{ fontSize: 11, color: "#991B1B", margin: "2px 0" }}>• {e}</p>
                                    ))}
                                    {validationErrs.length === 10 && (
                                        <p style={{ fontSize: 10, color: "#b45309", margin: "4px 0 0", fontStyle: "italic" }}>… and possibly more. Fix these first.</p>
                                    )}
                                </div>
                            )}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 10,
                                background: "#f5f6fa", borderRadius: 8, padding: "8px 12px", marginBottom: 14,
                                border: "1px solid #eef0f6",
                            }}>
                                <span style={{ fontSize: 20 }}>📄</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file?.name}</p>
                                    <p style={{ fontSize: 10, color: "#9ca3b0", margin: 0 }}>
                                        {rows.length} rows · {allColumns.length} columns detected
                                    </p>
                                </div>
                                <button onClick={reset} style={{
                                    height: 26, padding: "0 10px", borderRadius: 6,
                                    border: "1px solid #d1d5db", background: "#fff",
                                    color: "#6b7280", fontSize: 11, cursor: "pointer", flexShrink: 0,
                                }}>
                                    Change file
                                </button>
                            </div>
                            <div style={{ borderRadius: 8, border: "1px solid #e8eaf0", overflow: "hidden" }}>
                                <div style={{ padding: "8px 12px", borderBottom: "1px solid #f0f2f6", background: "#f5f6fa", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: "#374151", margin: 0 }}>
                                        Preview — first {preview.length} of {rows.length} rows
                                    </p>
                                    {allColumns.length > 7 && (
                                        <p style={{ fontSize: 10, color: "#9ca3b0", margin: 0 }}>Showing 7 of {allColumns.length} columns</p>
                                    )}
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", minWidth: 500 }}>
                                        <thead>
                                            <tr style={{ background: "#f8f9fc" }}>
                                                <th style={{ padding: "7px 10px", textAlign: "left", color: "#9ca3b0", fontWeight: 600, borderBottom: "1px solid #e8eaf0", fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em", width: 36 }}>#</th>
                                                {visibleCols.map(h => (
                                                    <th key={h} style={{
                                                        padding: "7px 10px", textAlign: "left", fontWeight: 600,
                                                        color: REQUIRED_COLS.includes(h) ? "#185FA5" : "#6b7280",
                                                        borderBottom: "1px solid #e8eaf0", whiteSpace: "nowrap",
                                                        fontSize: 10, textTransform: "uppercase", letterSpacing: ".05em",
                                                    }}>
                                                        {REQUIRED_COLS.includes(h) && <span style={{ color: "#dc2626" }}>*</span>} {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((row, i) => (
                                                <tr key={i} style={{ borderBottom: "0.5px solid #f5f6fa", background: i % 2 === 0 ? "#fff" : "#fafbff" }}>
                                                    <td style={{ padding: "6px 10px", color: "#9ca3b0", fontSize: 10 }}>{i + 2}</td>
                                                    {visibleCols.map(col => (
                                                        <td key={col} style={{
                                                            padding: "6px 10px", color: "#374151",
                                                            maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                        }}>{String(row[col] ?? "")}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 3 && result && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 260, gap: 16 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: "50%",
                                background: result.success ? "#EAF3DE" : "#FCEBEB",
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
                            }}>
                                {result.success ? "✓" : "✕"}
                            </div>
              
                            <div style={{ textAlign: "center" }}>
                                <p style={{ fontSize: 16, fontWeight: 700, color: result.success ? "#27500A" : "#791F1F", margin: 0 }}>
                                    {result.success ? "Import completed!" : "Import failed"}
                                </p>
                                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                                    {result.success
                                        ? `✓ ${result.inserted || 0} imported` +
                                        (result.skipped > 0 ? ` · ⊘ ${result.skipped} duplicates skipped` : "") +
                                        (result.failed > 0 ? ` · ✕ ${result.failed} failed` : "")
                                        : result.message}
                                </p>
                            </div>
                            {result.failedRows?.length > 0 && (
                                <div style={{ background: "#FAEEDA", border: "1px solid #FAC775", borderRadius: 8, padding: "10px 14px", width: "100%", maxWidth: 500 }}>
                                    <p style={{ fontSize: 11, fontWeight: 700, color: "#633806", margin: 0, marginBottom: 6 }}>Skipped rows:</p>
                                    {result.failedRows.slice(0, 5).map((r, i) => (
                                        <p key={i} style={{ fontSize: 11, color: "#854F0B", margin: "2px 0" }}>• {r.row} — {r.error}</p>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={reset} style={{
                                    height: 34, padding: "0 18px", borderRadius: 8, border: "1.5px solid #d1d5db",
                                    background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer",
                                }}>Import another file</button>
                                <button onClick={onClose} style={{
                                    height: 34, padding: "0 18px", borderRadius: 8, border: "none",
                                    background: "#185FA5", color: "#E6F1FB", fontSize: 12, fontWeight: 600, cursor: "pointer",
                                }}>Done</button>
                            </div>
                        </div>
                    )}
                </div>
                {step !== 3 && (
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 22px", borderTop: "1px solid #f0f2f6",
                        background: "#fafbff",
                    }}>
                        <div style={{ fontSize: 11, color: "#9ca3b0" }}>
                            {step === 1 && "Download the sample file to see the correct format"}
                            {step === 2 && `${rows.length} rows ready · ${validationErrs.length > 0 ? `${validationErrs.length} issues found` : "All rows valid ✓"}`}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button onClick={onClose} style={{
                                height: 32, padding: "0 14px", borderRadius: 7,
                                border: "1.5px solid #d1d5db", background: "#fff",
                                color: "#374151", fontSize: 12, fontWeight: 500, cursor: "pointer",
                            }}>Cancel</button>

                            {step === 2 && (
                                <>
                                    <button onClick={reset} style={{
                                        height: 32, padding: "0 14px", borderRadius: 7,
                                        border: "1.5px solid #d1d5db", background: "#fff",
                                        color: "#374151", fontSize: 12, fontWeight: 500, cursor: "pointer",
                                    }}>← Back</button>
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading || rows.length === 0}
                                        style={{
                                            height: 32, padding: "0 18px", borderRadius: 7, border: "none",
                                            background: uploading || rows.length === 0 ? "#9ca3b0" : "#185FA5",
                                            color: "#E6F1FB", fontSize: 12, fontWeight: 600,
                                            cursor: uploading || rows.length === 0 ? "not-allowed" : "pointer",
                                            display: "flex", alignItems: "center", gap: 6,
                                        }}
                                    >
                                        {uploading && (
                                            <span style={{
                                                width: 12, height: 12, borderRadius: "50%",
                                                border: "2px solid rgba(255,255,255,0.3)",
                                                borderTop: "2px solid #fff",
                                                display: "inline-block",
                                                animation: "spin 0.8s linear infinite",
                                            }} />
                                        )}
                                        {uploading ? "Importing…" : `Import ${rows.length} employees`}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
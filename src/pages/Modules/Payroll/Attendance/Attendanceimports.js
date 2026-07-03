// ─────────────────────────────────────────────────────────────────────────────
// FILE: AttendanceImports.js
// Biometric Integration + Excel Import modes
// Props: employees, weekoffs, holidays, isViewMode,
//        bioTableData, setBioTableData, excelRows, setExcelRows,
//        bioDay/Month/Year, setBioDay/Month/Year,
//        bioSelectedDate, attendanceType,
//        onSave, onNewEntry, fetchBioData
// ─────────────────────────────────────────────────────────────────────────────
import * as XLSX from "xlsx";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    saveAttendanceLog, updateAttendance, getAttendanceList, resolveEmployeeCodes, getAttendanceById
} from "../../../../utils/api";
import {
    FONT, toast, ConfirmModal,
    OutlineButton, AvatarCell, StatusBadge,
    TableHeader, TableRow, EmptyState, LoadingState, FileChip,
    PeriodDropdowns, getStatusBadge,
    todayDay, todayMonth, todayYear
} from "./Attendancehelpers";

const ImportIcon = (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);
const SampleIcon = (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const TH = { background: "#f1f5f9", color: "#475569", borderBottom: "2px solid #cbd5e1" };
const inputCls = "h-8 w-full text-[13px] text-center font-medium font-mono border border-slate-200 rounded-md px-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-slate-300 transition-colors disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:hidden";

const AttendanceImports = ({
    employees,
    isViewMode,
    attendanceType,           // "Biometric" | "Excel"
    bioTableData, setBioTableData,
    excelRows, setExcelRows,
    bioDay, setBioDay,
    bioMonth, setBioMonth,
    bioYear, setBioYear,
    bioSelectedDate,
    bioPeriodRef,
    onSave, onNewEntry, onModeChange,
    modeRef,
}) => {
    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const years = ["2024", "2025", "2026", "2027", "2028"];

    const [bioFile, setBioFile] = useState(null);
    const [excelFile, setExcelFile] = useState(null);
    const [bioLoading, setBioLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: "", message: "", onConfirm: null
    });
    const bioFileRef = useRef(null);
    const excelFileRef = useRef(null);

    const bioDayOptions = Array.from(
        { length: new Date(parseInt(bioYear), months.indexOf(bioMonth) + 1, 0).getDate() },
        (_, i) => i + 1
    );

    // ── Fetch biometric logs for selected date ──────────────────────────────────
    const fetchBioData = useCallback(async () => {
        setBioLoading(true);
        setBioTableData([]);
        try {
            const mIdx = months.indexOf(bioMonth) + 1;
            const res = await getAttendanceList({
                filters: { month: mIdx, year: bioYear, punch_type: "Biometric" }
            });
            const rows = (res?.data || [])
                .filter(item => {
                    const d = item.in_time?.toString().replace("T", " ").split(".")[0].split(" ")[0];
                    return d === bioSelectedDate;
                })
                .map(item => ({
                    log_id: item.log_id,
                    employee_id: item.employee_id,
                    employee_name: item.employee_name || "—",
                    employee_code: item.employee_code || "",
                    in: item.in_time ? item.in_time.substring(11, 16) : "--:--",
                    out: item.out_time ? item.out_time.substring(11, 16) : "--:--",
                    status: item.attendance_status || "PRESENT",
                    existing_log_id: null,      // filled below for cross-punch-type conflicts
                    existing_punch_type: null,
                }));
            setBioTableData(rows);
        } catch (e) { console.error(e); }
        finally { setBioLoading(false); }
    }, [bioDay, bioMonth, bioYear, bioSelectedDate]);

    useEffect(() => {
        if (attendanceType === "Biometric") fetchBioData();
    }, [attendanceType, bioDay, bioMonth, bioYear, fetchBioData]);

    // ── Sample file download ────────────────────────────────────────────────────
    const downloadSampleFile = () => {
        const ws = XLSX.utils.json_to_sheet([
            { Date: "2026-04-01", In: "10:00", Out: "18:30", EmployeeID: "1", Status: "PRESENT" },
            { Date: "2026-04-02", In: "10:15", Out: "18:40", EmployeeID: "2", Status: "ABSENT" },
            { Date: "2026-04-03", In: "09:55", Out: "18:20", EmployeeID: "11", Status: "PRESENT" },
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, "Sample_Attendance.xlsx");
    };
    const checkExistingLogs = async (rows, dateStr) => {
        try {
            // ✅ Pehle Led_codes resolve karo
            const codes = [...new Set(rows.map(r => String(r.employee_id)).filter(c => isNaN(Number(c))))];
            let codeMap = {};
            if (codes.length > 0) {
                const res = await resolveEmployeeCodes(codes);
                if (res?.data) codeMap = res.data;
            }

            const res = await getAttendanceList({
                filters: {
                    month: parseInt(dateStr.split("-")[1]),
                    year: dateStr.split("-")[0]
                }
            });
            const logsOnDate = (res?.data || []).filter(item => {
                const d = item.in_time?.toString().replace("T", " ").split(".")[0].split(" ")[0];
                return d === dateStr;
            });

            return rows.map(row => {
                // ✅ Raw ID ko resolve karo pehle
                const rawId = String(row.employee_id);
                const resolvedId = isNaN(Number(rawId))
                    ? codeMap[rawId]
                    : Number(rawId);

                const conflict = logsOnDate.find(l =>
                    Number(l.employee_id) === Number(resolvedId)
                );
                return {
                    ...row,
                    existing_log_id: conflict?.log_id || null,
                    existing_punch_type: conflict?.punch_type || null,
                };
            });
        } catch (e) { return rows; }
    };

    // ── Parse Excel file ────────────────────────────────────────────────────────
    const parseExcelFile = (file) => {
        const reader = new FileReader();
        reader.onload = async (evt) => {   // ← async ADD karo
            try {
                const wb = XLSX.read(new Uint8Array(evt.target.result), { type: "array" });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);
                const parsed = rows.map(row => {
                    let dv = row.Date;
                    if (typeof dv === "number") {
                        const ed = XLSX.SSF.parse_date_code(dv);
                        dv = `${ed.y}-${String(ed.m).padStart(2, "0")}-${String(ed.d).padStart(2, "0")}`;
                    }
                    let dateStr = "";
                    try { dateStr = new Date(dv).toISOString().split("T")[0]; } catch (e) { dateStr = String(dv); }
                    const fmtTime = (v) => {
                        if (!v || v === "" || v === null || v === undefined) return "--:--"; // ✅ blank → "--:--"
                        if (typeof v === "number") {
                            if (v === 0) return "--:--"; // ✅ 0 (Excel blank) → "--:--"
                            const s = Math.round(v * 86400);
                            if (s === 0) return "--:--";
                            return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
                        }
                        const str = v.toString().trim().slice(0, 5);
                        if (!str || str === "00:00") return "--:--"; // ✅ "00:00" string → "--:--"
                        return str;
                    };
                    const empId = String(row.EmployeeID || row.ID || row.employee_id || "");
                    const empRec = employees.find(e => String(e.Actled_id) === empId || String(e.Led_code) === empId);
                    const parsedStatus = row.Status || "PRESENT";
                    return {
                        log_id: null,
                        employee_id: empId,
                        employee_name: empRec?.Led_name || `ID: ${empId}`,
                        employee_code: empRec?.Led_code || empId,
                        employee_photo: empRec?.Ledimg || null,
                        date: dateStr,
                        in: parsedStatus === "ABSENT" ? "00:00" : fmtTime(row.In) || "--:--",
                        out: parsedStatus === "ABSENT" ? "00:00" : fmtTime(row.Out) || "--:--",
                        status: parsedStatus,
                    };
                });

                // ✅ YAHAN CHANGE — checkExistingLogs call karo
                // Excel mein alag dates ho sakti hain — har unique date ke liye check karo
                const dateSet = [...new Set(parsed.map(r => r.date).filter(Boolean))];
                let allEnriched = [...parsed];
                for (const dateStr of dateSet) {
                    const rowsForDate = parsed.filter(r => r.date === dateStr);
                    const enriched = await checkExistingLogs(rowsForDate, dateStr);
                    // Merge back into allEnriched
                    enriched.forEach(enrichedRow => {
                        const idx = allEnriched.findIndex(r =>
                            r.employee_id === enrichedRow.employee_id && r.date === enrichedRow.date
                        );
                        if (idx !== -1) allEnriched[idx] = enrichedRow;
                    });
                }

                setExcelRows(allEnriched);
                toast(`${allEnriched.length} records loaded from file`, "info");
            } catch (err) { console.error("Excel parse error:", err); toast("Error reading file", "error"); }
        };
        reader.readAsArrayBuffer(file);
    };

    // ── Parse Biometric file ────────────────────────────────────────────────────
    const parseBioFile = (file) => {
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const wb = XLSX.read(new Uint8Array(evt.target.result), { type: "array" });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);
                const parsed = rows.map(row => {
                    let dv = row.Date;
                    if (typeof dv === "number") {
                        const ed = XLSX.SSF.parse_date_code(dv);
                        dv = `${ed.y}-${String(ed.m).padStart(2, "0")}-${String(ed.d).padStart(2, "0")}`;
                    }
                    let dateStr = "";
                    try { dateStr = new Date(dv).toISOString().split("T")[0]; } catch (e) { dateStr = String(dv); }
                    const fmtTime = (v) => {
                        if (!v || v === "" || v === 0) return "--:--";  // ✅ blank → "--:--"
                        if (typeof v === "number") {
                            const s = Math.round(v * 86400);
                            if (s === 0) return "--:--";  // ✅ 00:00 numeric → "--:--"
                            return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;
                        }
                        return v.toString().slice(0, 5);
                    };
                    const empId = String(row.EmployeeID || row.ID || row.employee_id || "");
                    const empRec = employees.find(e => String(e.Actled_id) === empId || String(e.Led_code) === empId);
                    const parsedStatus = row.Status || "PRESENT";
                    return {
                        log_id: null,
                        employee_id: empId,
                        employee_name: empRec?.Led_name || `ID: ${empId}`,
                        employee_code: empRec?.Led_code || empId,
                        employee_photo: empRec?.Ledimg || null,
                        in: parsedStatus === "ABSENT" ? "00:00" : fmtTime(row.In),
                        out: parsedStatus === "ABSENT" ? "00:00" : fmtTime(row.Out),
                        status: parsedStatus,
                    };
                });
                const enriched = await checkExistingLogs(parsed, bioSelectedDate);
                setBioTableData(enriched);
                toast(`${parsed.length} biometric records loaded`, "info");
            } catch (err) { console.error("Bio parse error:", err); toast("Error reading biometric file", "error"); }
        };
        reader.readAsArrayBuffer(file);
    };

    // AttendanceImports.js mein ADD karo — handleBioSave se pehle:
    const checkAndConfirmDuplicate = (employeeName, existingPunchType) => {
        return new Promise((resolve) => {
            setConfirmModal({
                isOpen: true,
                title: "Duplicate Attendance Found",
                message: `${employeeName} already has attendance on this date (${existingPunchType}). Do you want to update it with new data?`,
                onConfirm: () => { setConfirmModal(m => ({ ...m, isOpen: false })); resolve(true); },
                onCancel: () => { setConfirmModal(m => ({ ...m, isOpen: false })); resolve(false); },
            });
        });
    };
    // ── Save handlers ───────────────────────────────────────────────────────────
    const handleBioSave = async () => {
        if (!bioTableData.length) { toast("No biometric records to save", "info"); return; }
        try {
            // ✅ SAME FIX — Led_code resolve karo
            const allCodes = [...new Set(
                bioTableData
                    .map(r => String(r.employee_id || "").trim())
                    .filter(c => c && isNaN(Number(c)))
            )];
            let codeToIdMap = {};
            if (allCodes.length > 0) {
                const res = await resolveEmployeeCodes(allCodes);
                if (res?.data) codeToIdMap = res.data;
            }

            let saved = 0;
            for (const row of bioTableData) {
                const rawId = String(row.employee_id || "").trim();
                const resolvedId = isNaN(Number(rawId))
                    ? codeToIdMap[rawId]
                    : Number(rawId);

                if (!resolvedId) {
                    toast(`Employee "${rawId}" not found — skipped`, "warning");
                    continue;
                }

                const payload = {
                    employee_id: resolvedId,  // ✅ integer
                    punch_type: "Biometric",
                    attendance_status: row.status || "PRESENT",
                    in_time: `${bioSelectedDate} ${row.in && row.in !== "--:--" ? row.in : "00:00"}:00`,
                    out_time: `${bioSelectedDate} ${row.out && row.out !== "--:--" ? row.out : "00:00"}:00`,
                };

                if (row.log_id) {
                    await updateAttendance(row.log_id, payload);
                } else if (row.existing_log_id) {
                    const ok = await checkAndConfirmDuplicate(row.employee_name, row.existing_punch_type);
                    if (ok) await updateAttendance(row.existing_log_id, payload);
                    else continue;
                } else {
                    const res = await saveAttendanceLog(payload);
                    if (!res?.success) throw new Error(`Save failed for employee ${rawId}`);
                }
                saved++;
            }
            toast(`${saved} biometric records saved successfully`, "success");
            await fetchBioData();
            onNewEntry?.();
            onSave?.();
        } catch (e) { console.error(e); toast("Error saving Biometric data: " + e.message, "error"); }
    };

    const handleExcelSave = async () => {
        if (!excelRows.length) { toast("No records to import", "info"); return; }
        try {
            // ✅ STEP 1 — Saare unique Led_codes collect karo jo string hain
            const allCodes = [...new Set(
                excelRows
                    .map(r => String(r.employee_id || "").trim())
                    .filter(c => c && isNaN(Number(c)))  // sirf string codes jaise "LI0004"
            )];

            // ✅ STEP 2 — Bulk resolve karo ek call mein
            let codeToIdMap = {};
            if (allCodes.length > 0) {
                const res = await resolveEmployeeCodes(allCodes);
                console.log("resolve response:", res);        // ← ADD
                if (res?.data) codeToIdMap = res.data;
            }
            console.log("codeToIdMap:", codeToIdMap);

            let saved = 0;
            for (const row of excelRows) {
                // ✅ STEP 3 — har row mein employee_id resolve karo
                const rawId = String(row.employee_id || "").trim();
                const resolvedId = isNaN(Number(rawId))
                    ? codeToIdMap[rawId]       // "LI0004" → 5
                    : Number(rawId);            // "1" → 1

                if (!resolvedId) {
                    toast(`Employee "${rawId}" not found — skipped`, "warning");
                    continue;
                }
                // Date format helper
                const fmtDateTime = (date, time) => {
                    if (!date || !time || time === "--:--" || time === "00:00") return null;
                    // Ensure: "2026-07-01 09:40:00"
                    const t = time.length === 5 ? time + ":00" : time;
                    return `${date} ${t}`;
                };

                const payload = {
                    employee_id: resolvedId,
                    punch_type: "Excel",
                    attendance_status: row.status || "PRESENT",
                    in_time: fmtDateTime(row.date, row.in),
                    out_time: fmtDateTime(row.date, row.out),
                };
                if (row.log_id) {
                    await updateAttendance(row.log_id, payload);
                } else if (row.existing_log_id) {
                    const existingRes = await getAttendanceById(row.existing_log_id);
                    const existing = existingRes?.data;

                    const existingIn = existing?.in_time || null;
                    const existingOut = existing?.out_time || null;
                    const newIn = payload.in_time;   // null if "--:--"
                    const newOut = payload.out_time;  // null if "--:--"

                    // ✅ Agar sirf out diya aur existing mein in hai → silent merge, no popup
                    const isFillingMissingOut = newOut && !newIn && existingIn && !existingOut;
                    // ✅ Agar sirf in diya aur existing mein out hai → silent merge, no popup  
                    const isFillingMissingIn = newIn && !newOut && !existingIn && existingOut;

                    if (isFillingMissingOut || isFillingMissingIn) {
                        // Silent merge — no popup
                        await updateAttendance(row.existing_log_id, {
                            ...payload,
                            in_time: newIn || existingIn || null,
                            out_time: newOut || existingOut || null,
                        });
                    } else if (!newIn && !newOut) {
                        // ✅ Dono blank hain — kuch nahi karna, skip
                        continue;
                    } else {
                        // Actual duplicate — popup dikhao
                        const ok = await checkAndConfirmDuplicate(row.employee_name, row.existing_punch_type);
                        if (ok) {
                            await updateAttendance(row.existing_log_id, {
                                ...payload,
                                in_time: newIn || existingIn || null,
                                out_time: newOut || existingOut || null,
                            });
                        } else continue;
                    }
                } else {
                    const res = await saveAttendanceLog(payload);
                    if (!res?.success) throw new Error(`Save failed for employee ${rawId}`);
                }
                saved++;
            }
            toast(`${saved} records imported successfully`, "success");
            setExcelFile(null);
            setExcelRows([]);
            onNewEntry?.();
            onSave?.();
        } catch (e) { console.error(e); toast("Error saving Excel data: " + e.message, "error"); }
    };
    // Expose save handlers to parent via ref — parent calls these from ERPFooter
    AttendanceImports.bioSave = handleBioSave;
    AttendanceImports.excelSave = handleExcelSave;

    const [y, m, d] = bioSelectedDate.split("-");

    // ── Controls bar (period + import buttons) ──────────────────────────────────
    const selectCls = "h-8 text-[14px] border border-slate-200 rounded-md px-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors";
    const labelCls = "text-[14px] font-semibold text-slate-700 uppercase whitespace-nowrap tracking-wide";

    return (
        <div className="flex-1 flex flex-col gap-2 overflow-hidden min-w-0" style={{ fontFamily: FONT }}>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={confirmModal.onCancel}
            />
            {/* Controls */}
            {/* Controls — ek hi header */}
            <div className="bg-white rounded-xl border shadow-sm shrink-0 px-3 py-2">
                <div className="flex items-center gap-3 flex-wrap">

                    {/* ✅ Mode dropdown — hamesha dikhega */}
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-3 shrink-0">
                        <span className={labelCls}>Mode:</span>
                        <select
                            ref={modeRef}
                            value={attendanceType}
                            disabled={isViewMode}
                            onChange={e => onModeChange?.(e.target.value)}
                            className={selectCls}
                            style={{ minWidth: 160, height: 32 }}
                        >
                            {/* attendanceTypeOptions parent se prop lo ya yahan hardcode karo */}
                            <option value="List">List Entry</option>
                            <option value="Manual">Manual Entry</option>
                            <option value="Biometric">Biometric</option>
                            <option value="Excel">Excel Import</option>
                        </select>
                    </div>

                    {/* ✅ Day/Month/Year — sirf Biometric mode mein */}
                    {attendanceType === "Biometric" && (
                        <div className="flex items-center gap-2 border-r border-slate-200 pr-3 shrink-0">
                            <PeriodDropdowns
                                ref={bioPeriodRef}
                                day={bioDay} setDay={setBioDay}
                                month={bioMonth} setMonth={setBioMonth}
                                year={bioYear} setYear={setBioYear}
                                dayOpts={bioDayOptions}
                                disabled={isViewMode}
                                months={months} years={years}
                                selectCls={selectCls} labelCls={labelCls}
                            />
                        </div>
                    )}

                    {/* Import/Sample buttons */}
                    <div className="flex items-center gap-2 ml-auto shrink-0 flex-wrap">
                        {attendanceType === "Biometric" && (
                            <>
                                <OutlineButton onClick={() => bioFileRef.current.click()} color="#334155" hoverBg="#f8fafc" icon={ImportIcon} label="Import Logs" disabled={isViewMode} />
                                <OutlineButton onClick={downloadSampleFile} color="#059669" hoverBg="#f0fdf4" icon={SampleIcon} label="Sample File" />
                                <input type="file" ref={bioFileRef} className="hidden" accept=".xlsx,.xls,.csv"
                                    onChange={e => { const f = e.target.files[0]; if (f) { setBioFile(f); parseBioFile(f); } e.target.value = ""; }} />
                                {bioFile && <FileChip file={bioFile} onRemove={() => { setBioFile(null); setBioTableData([]); }} />}
                                <span className="text-[11px] text-slate-400">{bioTableData.length} records</span>
                            </>
                        )}
                        {attendanceType === "Excel" && (
                            <>
                                <OutlineButton onClick={() => excelFileRef.current.click()} color="#334155" hoverBg="#f8fafc" icon={ImportIcon} label="Import Logs" disabled={isViewMode} />
                                <OutlineButton onClick={downloadSampleFile} color="#059669" hoverBg="#f0fdf4" icon={SampleIcon} label="Sample File" />
                                <input type="file" ref={excelFileRef} className="hidden" accept=".xlsx,.xls,.csv"
                                    onChange={e => { const f = e.target.files[0]; if (f) { setExcelFile(f); parseExcelFile(f); } e.target.value = ""; }} />
                                {excelFile && <FileChip file={excelFile} onRemove={() => { setExcelFile(null); setExcelRows([]); }} />}
                                <span className="text-[11px] text-slate-400">{excelRows.length} records</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Table area */}
            <div className="flex-1 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden min-h-0">

                {/* ── BIOMETRIC ── */}
                {attendanceType === "Biometric" && (
                    <>
                        <TableHeader TH={TH}
                            cols={["#", "Employee", "Date", "In Time", "Out Time", "Status"]}
                            template="44px 1.8fr 110px 100px 100px 140px"
                        />
                        <div className="flex-1 overflow-y-auto">
                            {bioLoading ? <LoadingState msg="Loading biometric data…" />
                                : bioTableData.length === 0
                                    ? <EmptyState msg="No biometric logs for this date. Import a file to populate." />
                                    : bioTableData.map((row, idx) => (
                                        <TableRow key={row.log_id || idx} idx={idx} template="44px 1.8fr 110px 100px 100px 140px">
                                            <div className="px-3 py-2 text-center text-[15px] text-slate-400">{idx + 1}</div>
                                            <AvatarCell name={row.employee_name} code={row.employee_code} empId={row.employee_id} photo={row.employee_photo} />
                                            <div className="px-3 py-2 text-[15px] font-mono text-slate-600">{d}-{m}-{y}</div>
                                            <div className="px-3 py-2 font-mono text-[15px] text-blue-700 text-center">{row.in}</div>
                                            <div className="px-3 py-2 font-mono text-[15px] text-blue-700 text-center">{row.out}</div>
                                            <div className="px-3 py-2"><StatusBadge status={row.status} /></div>
                                        </TableRow>
                                    ))
                            }
                        </div>
                        {bioTableData.length > 0 && (
                            <div className="shrink-0 border-t px-4 py-1.5 text-[11px] text-slate-500"
                                style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}>
                                {bioTableData.length} record{bioTableData.length !== 1 ? "s" : ""} — {bioDay} {bioMonth} {bioYear}
                            </div>
                        )}
                    </>
                )}

                {/* ── EXCEL IMPORT ── */}
                {attendanceType === "Excel" && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {excelRows.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center" style={{ background: "#f8fafc" }}>
                                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center text-center shadow-sm"
                                    style={{ maxWidth: 380, width: "100%" }}>
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#eff6ff" }}>
                                        <svg className="w-7 h-7" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-[13px] font-semibold text-slate-800 mb-1">Import Excel Attendance</h3>
                                    <p className="text-[11px] text-slate-400 mb-5">Columns: Date, In, Out, EmployeeID, Status</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <TableHeader TH={TH}
                                    cols={["#", "Employee", "Date", "In Time", "Out Time", "Status"]}
                                    template="44px 1.8fr 110px 100px 100px 140px"
                                />
                                <div className="flex-1 overflow-y-auto">
                                    {excelRows.map((row, idx) => (
                                        <TableRow key={idx} idx={idx} template="44px 1.8fr 110px 100px 100px 140px">
                                            <div className="px-3 py-2 text-center"><span className="text-[14px] text-slate-400">{idx + 1}</span></div>
                                            <AvatarCell name={row.employee_name} code={row.employee_code} empId={row.employee_id} photo={row.employee_photo} />
                                            <div className="px-3 py-2 text-[14px] font-mono text-slate-600">
                                                {(() => { try { const [y, m, d] = row.date.split("-"); return `${d}-${m}-${y}`; } catch (e) { return row.date; } })()}
                                            </div>
                                            <div className="px-3 py-2 font-mono text-[14px] text-blue-700">{row.in}</div>
                                            <div className="px-3 py-2 font-mono text-[14px] text-blue-700">{row.out}</div>
                                            <div className="px-3 py-2"><StatusBadge status={row.status} /></div>
                                        </TableRow>
                                    ))}
                                </div>
                                <div className="shrink-0 border-t px-4 py-1.5 text-[11px] text-slate-500"
                                    style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}>
                                    {excelRows.length} records loaded — click Save to import
                                </div>
                            </>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AttendanceImports;
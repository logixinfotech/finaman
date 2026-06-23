import { getPayslipData } from "./api";

const numberToWords = (num) => {
    if (!num || num === 0) return "Zero";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const convert = (n) => {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
        if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
        if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
        if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
        return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
    };
    return "Rupees " + convert(Math.round(num));
};

const inrFmt = (n) => Math.round(n || 0).toLocaleString("en-IN");

const fetchPhotoBase64 = async (photoPath) => {
    if (!photoPath) return "";
    try {
        const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:63554";
        const r = await fetch(`${baseUrl}${photoPath}`);
        const blob = await r.blob();
        return await new Promise((res) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch { return ""; }
};

const cleanMonthYear = (my) => {
    if (!my) return "unknown";
    const m = String(my).match(/^(\d{4})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}` : String(my).substring(0, 7);
};

const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
});

const buildPayslipHtml = (d, photoBase64) => {
    const rawMonth = d.month_year || "";
    const dateStr = rawMonth.includes("T") ? rawMonth.split("T")[0] : rawMonth;
    const monthLabel = (() => {
        try {
            return new Date((dateStr.length === 7 ? dateStr + "-01" : dateStr))
                .toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        } catch { return rawMonth; }
    })();

    const statusBg = d.status === "Paid" ? "#d1fae5" : d.status === "Approved" ? "#dbeafe" : "#f3f4f6";
    const statusColor = d.status === "Paid" ? "#065f46" : d.status === "Approved" ? "#1e40af" : "#374151";

    const initials = (d.employee_name || "?").substring(0, 2).toUpperCase();
    const photoHtml = photoBase64
        ? `<img src="${photoBase64}" width="64" height="64" style="border-radius:32px;object-fit:cover;border:2px solid #e2e8f0;display:block;" />`
        : `<div style="width:64px;height:64px;border-radius:32px;background:#1e3a5f;color:#fff;font-size:18px;font-weight:700;text-align:center;line-height:60px;border:2px solid #e2e8f0;">${initials}</div>`;

    const incomeRows = (d.income_lines?.length > 0
        ? d.income_lines.map(l =>
            `<tr><td style="padding:3px 0;font-size:10px;color:#374151;">${l.head_name}</td>` +
            `<td style="padding:3px 0;text-align:right;font-size:10px;font-weight:600;color:#0f1f3d;">${inrFmt(l.amount)}</td></tr>`)
        : [`<tr><td style="padding:3px 0;font-size:10px;color:#374151;">Gross Salary</td>` +
            `<td style="padding:3px 0;text-align:right;font-size:10px;font-weight:600;color:#0f1f3d;">${inrFmt(d.gross_monthly)}</td></tr>`]
    ).join("");

    const otRow = d.ot_addition > 0
        ? `<tr><td style="padding:3px 0;font-size:10px;color:#374151;">OT Addition</td><td style="padding:3px 0;text-align:right;font-size:10px;font-weight:600;color:#059669;">${inrFmt(d.ot_addition)}</td></tr>` : "";
    const bonusRow = d.bonus_amount > 0
        ? `<tr><td style="padding:3px 0;font-size:10px;color:#374151;">Bonus</td><td style="padding:3px 0;text-align:right;font-size:10px;font-weight:600;color:#2563eb;">${inrFmt(d.bonus_amount)}</td></tr>` : "";

    const dedRows = (d.deduction_lines || []).map(l =>
        `<tr><td style="padding:3px 0;font-size:10px;color:#374151;">${l.head_name}</td>` +
        `<td style="padding:3px 0;text-align:right;font-size:10px;font-weight:600;color:#dc2626;">-${inrFmt(l.amount)}</td></tr>`
    ).join("");

    const lopRow = d.lop_deduction > 0
        ? `<tr><td style="padding:3px 0;font-size:10px;color:#374151;">LOP Deduction</td><td style="padding:3px 0;text-align:right;font-size:10px;font-weight:600;color:#dc2626;">-${inrFmt(d.lop_deduction)}</td></tr>` : "";

    const attCell = (val, lbl, color) =>
        `<td style="text-align:center;padding:0 2px;">` +
        `<div style="font-size:13px;font-weight:700;color:${color};">${val}</div>` +
        `<div style="font-size:8px;color:#9ca3af;margin-top:1px;">${lbl}</div></td>`;

    const infoItem = (lbl, val) =>
        `<div style="margin-bottom:5px;">` +
        `<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.3px;">${lbl}</div>` +
        `<div style="font-size:10px;font-weight:600;color:#0f1f3d;margin-top:1px;">${val}</div></div>`;

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#111827;width:680px;margin:0;padding:0;}
table{border-collapse:collapse;}
</style></head><body>

<!-- TOP ACCENT -->
<div style="height:5px;background:#1e3a5f;width:680px;"></div>

<!-- COMPANY HEADER -->
<table width="680" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#2563eb 100%); border-bottom:3px solid #dbeafe;">
<tr>
<td style="padding:16px 24px;">
    <div style="
        font-size:20px;
        font-weight:800;
        color:#ffffff;
        letter-spacing:-0.4px;
        margin-bottom:4px;
    ">
        LOGIX Infotech LLP
    </div>

    <div style="
        font-size:9px;
        color:rgba(255,255,255,0.85);
        line-height:1.5;
    ">
        Noida, Uttar Pradesh &nbsp;•&nbsp; GSTIN: 09AAAPL1234F1Z5
    </div>
</td>
 <td style="padding:12px 24px;text-align:right;">
    <div style="font-size:8px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;">
        Salary Slip
    </div>

    <div style="font-size:13px;font-weight:700;color:#0f1f3d;margin-top:2px;">
        ${monthLabel}
    </div>

    <div style="margin-top:6px;">
        <span style="
            display:inline-flex;
            align-items:center;
            justify-content:center;
            background:${statusBg};
            color:${statusColor};
            font-size:9px;
            font-weight:700;
            height:22px;
            min-width:52px;
            padding:0 12px;
            border-radius:20px;
            letter-spacing:0.3px;
        ">
            ${(d.status || "Draft").toUpperCase()}
        </span>
    </div>
</td>
</tr>
</table>

<!-- EMPLOYEE STRIP -->
<table width="680" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-bottom:1px solid #e8edf3;">
<tr>
  <td style="padding:12px 24px;vertical-align:middle;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:10px;vertical-align:middle;">${photoHtml}</td>
      <td style="vertical-align:middle;">
        <div style="font-size:13px;font-weight:700;color:#0f1f3d;">${d.employee_name || "—"}</div>
        <div style="font-size:9px;color:#6b7280;margin-top:2px;">${d.designation || "—"} &nbsp;·&nbsp; ${d.department || "—"} &nbsp;·&nbsp; ${d.employee_code || "—"}</div>
      </td>
    </tr></table>
  </td>
  <td style="padding:12px 24px;vertical-align:middle;text-align:right;">
    <table cellpadding="0" cellspacing="0" style="margin-left:auto;">
      <tr>
        <td style="padding-right:16px;vertical-align:top;">
          <div style="font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.3px;">Joining Date</div>
          <div style="font-size:10px;font-weight:600;color:#0f1f3d;margin-top:1px;">${d.joining_date ? new Date(d.joining_date).toLocaleDateString("en-IN") : "—"}</div>
        </td>
        <td style="vertical-align:top;">
          <div style="font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.3px;">PAN Number</div>
          <div style="font-size:10px;font-weight:600;color:#0f1f3d;margin-top:1px;">${d.pan_no || "—"}</div>
        </td>
      </tr>
    </table>
  </td>
</tr>
</table>

<!-- BANK + ATTENDANCE -->
<table width="680" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #e8edf3;">
<tr valign="top">

  <!-- Bank -->
  <td width="340" style="padding:12px 12px 12px 24px;">
    <div style="border:1px solid #e8edf3;border-radius:4px;padding:10px 12px;background:#f8fafc;">
      <div style="font-size:8px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:6px;border-bottom:1px solid #e8edf3;margin-bottom:8px;">Bank Details</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding-right:8px;">${infoItem("Bank Name", d.bank_name || "—")}</td>
          <td width="50%">${infoItem("Account No.", d.account_no || "—")}</td>
        </tr>
        <tr>
          <td style="padding-right:8px;">${infoItem("IFSC Code", d.ifsc_code || "—")}</td>
          <td>${infoItem("Mobile", d.mobile || "—")}</td>
        </tr>
      </table>
    </div>
  </td>

  <!-- Attendance -->
  <td width="340" style="padding:12px 24px 12px 12px;">
    <div style="border:1px solid #e8edf3;border-radius:4px;padding:10px 12px;background:#f8fafc;">
      <div style="font-size:8px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:6px;border-bottom:1px solid #e8edf3;margin-bottom:8px;">Attendance</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
        ${attCell(d.total_days || 0, "Total", "#0f1f3d")}
${attCell(d.working_days || 0, "Working", "#0f1f3d")}
${attCell(d.present_days || 0, "Present", "#059669")}
${attCell(d.absent_days || 0, "Absent", "#dc2626")}
${attCell(d.lop_days || 0, "LOP", "#ea580c")}
${attCell(d.att_paid_leave || 0, "Leave", "#7c3aed")}
${attCell(d.weekoff_days || 0, "WeekOff", "#0284c7")}
${attCell(d.holiday_days || 0, "Holiday", "#ca8a04")}
        </tr>
      </table>
    </div>
  </td>

</tr>
</table>

<!-- EARNINGS & DEDUCTIONS -->
<table width="680" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #e8edf3;">
<tr valign="top">

  <!-- Earnings -->
  <td width="340" style="padding:12px 12px 12px 24px;border-right:1px solid #e8edf3;">
    <div style="font-size:8px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.6px;padding-bottom:5px;border-bottom:2px solid #059669;margin-bottom:6px;">Earnings</div>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${incomeRows}
      ${otRow}
      ${bonusRow}
      <tr><td colspan="2" style="padding:4px 0 0;"><div style="height:1px;background:#e8edf3;"></div></td></tr>
      <tr>
        <td style="padding:5px 0 0;font-size:10px;font-weight:700;color:#059669;">Gross Earnings</td>
        <td style="padding:5px 0 0;text-align:right;font-size:10px;font-weight:700;color:#059669;">${inrFmt(d.total_income)}</td>
      </tr>
    </table>
  </td>

  <!-- Deductions -->
  <td width="340" style="padding:12px 24px 12px 12px;">
    <div style="font-size:8px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.6px;padding-bottom:5px;border-bottom:2px solid #dc2626;margin-bottom:6px;">Deductions</div>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${dedRows}
      ${lopRow}
      <tr><td colspan="2" style="padding:4px 0 0;"><div style="height:1px;background:#e8edf3;"></div></td></tr>
      <tr>
        <td style="padding:5px 0 0;font-size:10px;font-weight:700;color:#dc2626;">Total Deductions</td>
        <td style="padding:5px 0 0;text-align:right;font-size:10px;font-weight:700;color:#dc2626;">-${inrFmt(d.total_deduction)}</td>
      </tr>
    </table>
  </td>

</tr>
</table>

<!-- NET SALARY — white background -->
<table width="680" cellpadding="0" cellspacing="0" style="background:#fff;border-bottom:1px solid #e8edf3;border-top:2px solid #1e3a5f;">
<tr>
  <td style="padding:14px 24px;vertical-align:middle;">
    <div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:3px;">Net Pay (In Words)</div>
    <div style="font-size:10px;font-weight:700;color:#0f1f3d;">${numberToWords(Math.round(d.net_salary || 0))} Only</div>
  </td>
  <td style="padding:14px 24px;text-align:right;vertical-align:middle;">
    <div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:3px;">Net Salary</div>
    <div style="font-size:20px;font-weight:700;color:#059669;letter-spacing:-0.5px;">${inrFmt(d.net_salary)}</div>
  </td>
</tr>
</table>

<!-- FOOTER -->
<table width="680" cellpadding="0" cellspacing="0" style="background:#f8fafc;">
<tr>
  <td style="padding:7px 24px;font-size:8px;color:#9ca3af;font-style:italic;">Computer generated payslip — signature not required</td>
  <td style="padding:7px 24px;text-align:right;font-size:8px;color:#9ca3af;">Generated: ${new Date().toLocaleDateString("en-IN")}</td>
</tr>
</table>

</body></html>`;
};

export const downloadPayslip = async (row, showToast) => {
    if (!row.payroll_id) {
        showToast("Payslip ke liye pehle payroll approve karo", "err");
        return;
    }
    showToast(`${row.name} ka payslip generate ho raha hai...`);

    try {
        const res = await getPayslipData(row.payroll_id);
        if (!res?.success || !res?.data) { showToast("Payslip data fetch failed", "err"); return; }

        const d = res.data;
        const photoBase64 = await fetchPhotoBase64(d.photo_path);
        const html = buildPayslipHtml(d, photoBase64);

        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");

        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position:absolute;left:-9999px;top:0;width:680px;background:#fff;z-index:-1;";
        wrapper.innerHTML = html;
        document.body.appendChild(wrapper);
 
        await Promise.all(
            Array.from(wrapper.querySelectorAll("img")).map(img =>
                img.complete ? Promise.resolve() :
                    new Promise(r => { img.onload = r; img.onerror = r; })
            )
        );
        await new Promise(r => setTimeout(r, 500));

        const canvas = await window.html2canvas(wrapper, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            width: 680,
            windowWidth: 680,
            logging: false,
        });

        document.body.removeChild(wrapper);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgW = pageW;
        const imgH = (canvas.height * pageW) / canvas.width;
        const imgData = canvas.toDataURL("image/jpeg", 0.98);

        if (imgH <= pageH) {
            pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
        } else {
            let yOff = 0;
            while (yOff < imgH) {
                if (yOff > 0) pdf.addPage();
                pdf.addImage(imgData, "JPEG", 0, -yOff, imgW, imgH);
                yOff += pageH;
            }
        }

        const cleanMonth = cleanMonthYear(d.month_year);
        const empName = (row.name || "Employee").replace(/ /g, "_");
        pdf.save(`Payslip_${empName}_${cleanMonth}.pdf`);

        showToast(`${row.name} ka payslip PDF download ho gaya!`);
    } catch (err) {
        console.error("Payslip error:", err);
        showToast("Payslip generate karne mein error aaya", "err");
    }
};
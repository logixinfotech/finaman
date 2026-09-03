 
export const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
};
 

export const inr  = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
export const inrS = (n) => {
  n = n || 0;
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
  if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "K";
  return "₹" + Math.round(n);
};
export const dmy = (iso) => (iso ? iso.split("-").reverse().join("-") : "");

// group `arr` by key(row), summing val(row) per group
export const by = (arr, keyFn, valFn) => {
  const m = {};
  arr.forEach((r) => {
    const k = keyFn(r) || "—";
    m[k] = (m[k] || 0) + (valFn(r) || 0);
  });
  return m;
};
export const topN = (m, n) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);

// ---------- filtering ----------
export function applyFilters(rows, f) {
  const item = (f.item || "").trim().toUpperCase();
  return rows.filter(
    (r) =>
      (!f.state || r.state === f.state) &&
      (!f.city || r.city === f.city) &&
      (!f.cust || r.cust === f.cust) &&
      (!f.grp || r.grp === f.grp) &&
      (!item || (r.item || "").toUpperCase().includes(item)) &&
      (!f.from || r.dt >= f.from) &&
      (!f.to || r.dt <= f.to)
  );
}
 
export function applyNonDateFilters(rows, f) {
  const item = (f.item || "").trim().toUpperCase();
  return rows.filter(
    (r) =>
      (!f.state || r.state === f.state) &&
      (!f.city || r.city === f.city) &&
      (!f.cust || r.cust === f.cust) &&
      (!f.grp || r.grp === f.grp) &&
      (!item || (r.item || "").toUpperCase().includes(item))
  );
}
 
// ---------- invoice grouping ----------
export function invoiceRows(rows) {
  const m = {};
  rows.forEach((r) => {
    const k = r.invKey || r.inv;          // BILINV_KEY = true unique key
    if (!k) return;
    m[k] = m[k] || { invKey: k, inv: r.inv, dt: r.dt, cust: r.cust, city: r.city, amt: 0, gst: 0 };
    m[k].amt += r.amt || 0;
    m[k].gst += r.gst || 0;
  });
  return Object.values(m);
}

// ---------- date helpers ----------
const MN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthNames = MN;
export const toD = (s) => {
  const [a, b, c] = s.split("-").map(Number);
  return new Date(a, b - 1, c);
};
export const isoOf = (d) =>
  d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
export const fmtD = (d) => String(d.getDate()).padStart(2, "0") + " " + MN[d.getMonth()] + " " + d.getFullYear();
export const monday = (d) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
export const addD = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export function sumRange(rows, a, b) {
  let amt = 0;
  const inv = new Set();
  rows.forEach((r) => {
    if (r.dt >= a && r.dt <= b) {
      amt += r.amt || 0;
      inv.add(r.inv);
    }
  });
  return { amt, inv: inv.size };
}

// ---------- period report (weekly / monthly / quarterly / yearly / FY) ----------
// Indian FY: April–March. Multi-tenant hai isliye constant, hardcode nahi.
export const FY_START_MONTH = 4;

export function fyOf(iso) {
  const y = +iso.slice(0, 4);
  const m = +iso.slice(5, 7);
  return m >= FY_START_MONTH ? y : y - 1; // 2026-03 → FY 2025, 2026-04 → FY 2026
}

export function periodKey(dt, tab) {
  if (!dt) return null;
  if (tab === "F") return String(fyOf(dt));                          // FY
  if (tab === "Y") return dt.slice(0, 4);                            // calendar year
  if (tab === "Q") {                                                 // calendar quarter
    const m = +dt.slice(5, 7);
    return dt.slice(0, 4) + "-Q" + (Math.floor((m - 1) / 3) + 1);
  }
  if (tab === "M") return dt.slice(0, 7);
  return isoOf(monday(toD(dt)));                                     // week
}

export function periodLabel(k, tab) {
  if (tab === "F") return `FY ${k}-${String(+k + 1).slice(2)}`;      // FY 2026-27
  if (tab === "Y") return k;
  if (tab === "Q") {
    const [y, q] = k.split("-");
    return `${q} ${y}`;                                              // Q2 2026
  }
  if (tab === "M") {
    const [y, m] = k.split("-");
    return MN[+m - 1] + " " + y;
  }
  return "Wk " + dmy(k);
}
export function buildPeriodSeries(rows, tab) {
  const m = {};
  rows.forEach((r) => {
    if (!r.dt) return; // skip rows with no invoice date
    const k = periodKey(r.dt, tab);
    m[k] = m[k] || { amt: 0, gst: 0, qty: 0, inv: new Set() };
    const o = m[k];
    o.amt += r.amt || 0;
    o.gst += r.gst || 0;
    o.qty += r.qty || 0;
    o.inv.add(r.inv);
  });
  const keys = Object.keys(m).sort();
  const growth = keys.map((k, i) => {
    if (i === 0) return null;
    const p = m[keys[i - 1]].amt;
    return p > 0 ? ((m[k].amt - p) / p) * 100 : null;
  });
  return { keys, m, growth };
}

// ---------- KPI summary for the filtered row set ----------
export function summarize(rows) {
  const amt = rows.reduce((s, r) => s + (r.amt || 0), 0);
  const gst = rows.reduce((s, r) => s + (r.gst || 0), 0);
  const qty = rows.reduce((s, r) => s + (r.qty || 0), 0);
  const invAmt = rows.reduce((s, r) => s + (r.invAmt || 0), 0);
   const nInv = new Set(rows.map((r) => r.invKey || r.inv)).size;
  const nCust = new Set(rows.map((r) => r.cust)).size;
  const nCity = new Set(rows.map((r) => r.city)).size;
  const nState = new Set(rows.map((r) => r.state)).size;
  const nProd = new Set(rows.map((r) => r.item)).size;
  return { amt, gst, qty, invAmt, nInv, nCust, nCity, nState, nProd };
}

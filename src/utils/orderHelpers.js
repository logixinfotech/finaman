import { inr, inrS, by, topN, dmy, toD } from "./helpers"; // reuse existing formatters

/* ---------- filtering ---------- */
export function applyOrderFilters(rows, f) {
  const item = (f.item || "").trim().toUpperCase();
  return rows.filter(
    (r) =>
      (!f.state || r.state === f.state) &&
      (!f.city || r.city === f.city) &&
      (!f.cust || r.cust === f.cust) &&
      (!f.grp || r.grp === f.grp) &&
      (!item || (r.item || "").toUpperCase().includes(item)) &&
      (!f.orderStatus || (f.orderStatus === "Completed" ? r.comple === "Y" : r.comple === "N")) &&
      (!f.payTerms || r.pay === f.payTerms) &&
      (!f.from || r.dt >= f.from) &&
      (!f.to || r.dt <= f.to)
  );
}

/* ---------- order-level aggregation (line items -> one row per order) ---------- */
export function ordersOf(rows) {
  const m = {};
  rows.forEach((r) => {
    const k = r.ord;
    m[k] = m[k] || { ord: r.ord, dt: r.dt, cust: r.cust, custId: r.custId, amt: 0, qo: 0, qs: 0, qb: 0, comple: "Y", pay: r.pay };
    const o = m[k];
    o.amt += r.amt || 0;
    o.qo += r.qo || 0;
    o.qs += r.qs || 0;
    o.qb += r.qb || 0;
    if (r.comple === "N") o.comple = "N";
  });
  return Object.values(m);
}

/* ---------- KPI summary ---------- */
export function summarizeOrders(rows) {
  const ords = ordersOf(rows);
  const amt = rows.reduce((s, r) => s + (r.amt || 0), 0);
  const qo = rows.reduce((s, r) => s + (r.qo || 0), 0);
  const qs = rows.reduce((s, r) => s + (r.qs || 0), 0);
  const qb = rows.reduce((s, r) => s + (r.qb || 0), 0);
  const nCust = new Set(rows.map((r) => r.custId ?? r.cust)).size;
  return { amt, orders: ords.length, qo, qs, qb, nCust, fulfilPct: qo ? (qs / qo) * 100 : 0 };
}

/* ---------- ABC / Pareto 80-20 (by customer, on order value) ---------- */
export function buildPareto(rows) {
  const ords = ordersOf(rows);
  const agg = {};
  ords.forEach((o) => { agg[o.custId ?? o.cust] = (agg[o.custId ?? o.cust] || { name: o.cust, amt: 0 }); agg[o.custId ?? o.cust].amt += o.amt; });
  const entries = Object.values(agg).sort((a, b) => b.amt - a.amt);
  const tot = Math.max(1, entries.reduce((s, e) => s + e.amt, 0));
  let cum = 0;
  const classed = entries.map((e, i) => {
    cum += e.amt;
    const pct = (cum / tot) * 100;
    return { ...e, cumPct: pct, cls: i === 0 ? "A" : pct <= 70 ? "A" : pct <= 90 ? "B" : "C" };
  });
  return classed;
}

/* ---------- recency buckets + table (needs order rows + history) ---------- */
export function buildRecency(rows, hist, refDate) {
  const lastByCust = {}, ordCountByCust = {};
  ordersOf(rows).forEach((o) => {
    const k = o.custId ?? o.cust;
    lastByCust[k] = !lastByCust[k] || o.dt > lastByCust[k] ? o.dt : lastByCust[k];
    ordCountByCust[k] = (ordCountByCust[k] || 0) + 1;
  });
  const histByCust = {};
  hist.forEach((h) => { histByCust[h.custId] = h; });

  const universe = new Set([...Object.keys(lastByCust), ...hist.map((h) => h.custId)]);
  return [...universe].map((k) => {
    const h = histByCust[k];
    const lastAct = [lastByCust[k], h?.last].filter(Boolean).sort().pop();
    const days = lastAct ? Math.round((toD(refDate) - toD(lastAct)) / 86400000) : Infinity;
    const status = days <= 30 ? "Active" : days <= 60 ? "Watch" : days <= 90 ? "At Risk" : "Dormant/Lost";
    return { custId: k, cust: h?.cust || "", lastAct, days, orders: ordCountByCust[k] || 0, pastInv: h?.inv || 0, status };
  }).sort((a, b) => b.days - a.days);
}

/* ---------- repeat order analysis ---------- */
export function buildRepeatOrders(rows) {
  const byCust = {};
  ordersOf(rows).forEach((o) => {
    const k = o.custId ?? o.cust;
    (byCust[k] = byCust[k] || { cust: o.cust, orders: [] }).orders.push(o);
  });
  return Object.values(byCust)
    .filter((c) => c.orders.length > 1)
    .map((c) => {
      const dts = c.orders.map((o) => o.dt).sort();
      let gapSum = 0;
      for (let i = 1; i < dts.length; i++) gapSum += (toD(dts[i]) - toD(dts[i - 1])) / 86400000;
      return {
        cust: c.cust,
        n: c.orders.length,
        first: dts[0],
        last: dts[dts.length - 1],
        avgGap: gapSum / (dts.length - 1),
        amt: c.orders.reduce((s, o) => s + o.amt, 0),
      };
    })
    .sort((a, b) => b.n - a.n);
}

/* ---------- dormant / lost customers (had history, no current order) ---------- */
export function buildDormant(rows, hist, refDate) {
  const ordCustIds = new Set(rows.map((r) => r.custId).filter(Boolean));
  return hist
    .filter((h) => !ordCustIds.has(h.custId))
    .map((h) => ({ ...h, days: Math.round((toD(refDate) - toD(h.last)) / 86400000) }))
    .sort((a, b) => b.amt - a.amt);
}

/* ---------- pending orders (fulfillment tab) ---------- */
export function buildPendingOrders(rows, refDate) {
  return rows
    .filter((r) => r.qb > 0 || r.comple === "N")
    .map((r) => ({ ...r, openDays: Math.round((toD(refDate) - toD(r.dt)) / 86400000) }))
    .sort((a, b) => b.qb * b.rate - a.qb * a.rate);
}


/* ---------- Average Order Value per customer ---------- */
export function buildAOV(rows, n = 10) {
  const ords = ordersOf(rows);
  const byCust = {};
  ords.forEach((o) => {
    const k = o.custId ?? o.cust;
    byCust[k] = byCust[k] || { cust: o.cust, amt: 0, count: 0 };
    byCust[k].amt += o.amt;
    byCust[k].count += 1;
  });
  return Object.values(byCust)
    .map((c) => ({ cust: c.cust, aov: c.count ? c.amt / c.count : 0 }))
    .sort((a, b) => b.aov - a.aov)
    .slice(0, n);
}

/* ---------- Rate vs MRP margin headroom ---------- */
export function buildMarginHeadroom(rows, n = 200) {
  return rows
    .filter((r) => r.mrp > 0 && r.rate > 0)
    .map((r) => ({
      item: r.item,
      cust: r.cust,
      rate: r.rate,
      mrp: r.mrp,
      headroom: ((r.mrp - r.rate) / r.mrp) * 100,
    }))
    .sort((a, b) => b.headroom - a.headroom)
    .slice(0, n);
}

/* ---------- Combined Customer View — current orders vs past sales, joined by custId ---------- */
export function buildCombinedView(rows, hist, abcMap) {
  const ords = ordersOf(rows);
  const curByCust = {};
  ords.forEach((o) => {
    const k = o.custId ?? o.cust;
    curByCust[k] = curByCust[k] || { cust: o.cust, custId: k, amt: 0, orders: 0 };
    curByCust[k].amt += o.amt;
    curByCust[k].orders += 1;
  });

  const histByCust = {};
  hist.forEach((h) => { histByCust[h.custId] = h; });

  const allIds = new Set([...Object.keys(curByCust), ...hist.map((h) => h.custId)]);

  return [...allIds]
    .map((id) => {
      const cur = curByCust[id];
      const h = histByCust[id];
      const status = cur && h ? "Repeat" : cur ? "New Customer" : "No Current Order";
      return {
        custId: id,
        cust: cur?.cust || h?.cust || "",
        geo: h ? `${h.city} / ${h.state}` : "—",
        curAmt: cur?.amt || 0,
        orders: cur?.orders || 0,
        pastAmt: h?.amt || 0,
        pastInv: h?.inv || 0,
        status,
        abc: abcMap?.[id] || null,
      };
    })
    .sort((a, b) => b.curAmt - a.curAmt || b.pastAmt - a.pastAmt);
}
export { inr, inrS, by, topN, dmy };
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
      (!f.gen || r.gen === f.gen) &&
      (!item || (r.item || "").toUpperCase().includes(item)) &&
      (!f.orderStatus || (f.orderStatus === "Completed" ? r.comple === "Y" : r.comple === "N")) &&
      (!f.payTerms || r.pay === f.payTerms) &&
      (!f.from || r.dt >= f.from) &&
      (!f.to || r.dt <= f.to)
  );
}

/* custId decimal se aata tha (number) aur Object.keys() string deta hai —
   "3728" !== 3728 se ek hi customer do rows me bat jaata tha. Ab backend
   VARCHAR bhejta hai, par defensive rehna sasta hai. */
const keyOf = (r) => String(r.custId ?? r.cust ?? "");

/* ---------- order-level aggregation (line items -> one row per order) ----------
   invQty = FIN_SALES se asli invoiced qty (CUSORD_ID join). SALE_QTY ka
   write-back Dec-2025 se pehle ke orders me chala hi nahi tha — sab 0 pade
   hain jabki invoice ho chuki thi, isliye ~26k legacy lines "100% pending"
   dikhti thin aur fulfilPct 19% aa raha tha.
   NOTE: invQty ORDER-level hai (order ke saare items ka jod), line-level nahi.
   Isliye sum NAHI karte — ek baar uthate hain. */
export function ordersOf(rows) {
  const m = new Map();
  for (const r of rows) {
    const k = r.ord || `__noord__${r.id}`;   // ord null ho to har line alag order,
    let o = m.get(k);                        // warna saari null lines ek me merge ho jaati thin
    if (!o) {
      o = {
        ord: r.ord, dt: r.dt, cust: r.cust, custId: r.custId,
        city: r.city, state: r.state, pay: r.pay,
        amt: 0, qo: 0, qs: 0, qb: 0,
        invQty: r.invQty ?? null,
        comple: "Y",
        cancelDt: r.cancelDt || null,
      };
      m.set(k, o);
    }
    o.amt += r.amt || 0;
    o.qo  += r.qo  || 0;
    o.qs  += r.qs  || 0;
    o.qb  += r.qb  || 0;
    if (r.comple === "N") o.comple = "N";
  }

  // supplied/balance derived — invQty preferred, SALE_QTY fallback
  return [...m.values()].map((o) => {
    const supplied = o.invQty != null ? o.invQty : o.qs;
    return {
      ...o,
      supplied,
      balance: Math.max(0, o.qo - supplied),
      fulfilPct: o.qo > 0 ? (supplied / o.qo) * 100 : 0,
      derived: o.invQty != null,
    };
  });
}

/* ---------- KPI summary ---------- */
export function summarizeOrders(rows) {
  const ords = ordersOf(rows);
  let amt = 0, qo = 0, qs = 0, qb = 0;
  const custSet = new Set();

  for (const r of rows) {                 // 5 alag reduce/map passes -> ek loop
    amt += r.amt || 0;
    qo  += r.qo  || 0;
    qs  += r.qs  || 0;
    qb  += r.qb  || 0;
    custSet.add(keyOf(r));
  }

  // supplied order-level se — line-level qs pe bharosa nahi (upar wala note)
  const supplied = ords.reduce((s, o) => s + o.supplied, 0);
  const balance  = ords.reduce((s, o) => s + o.balance, 0);

  return {
    amt,
    orders: ords.length,
    qo, qs, qb,
    supplied,
    balance,
    nCust: custSet.size,
    fulfilPct: qo ? (supplied / qo) * 100 : 0,
  };
}

/* ---------- ABC / Pareto 80-20 (by customer, on order value) ---------- */
export function buildPareto(rows) {
  const agg = {};
  for (const o of ordersOf(rows)) {
    const k = keyOf(o);
    if (!agg[k]) agg[k] = { custId: k, name: o.cust, amt: 0 };
    agg[k].amt += o.amt;
  }
  const entries = Object.values(agg).sort((a, b) => b.amt - a.amt);
  const tot = Math.max(1, entries.reduce((s, e) => s + e.amt, 0));
  let cum = 0;
  return entries.map((e, i) => {
    cum += e.amt;
    const pct = (cum / tot) * 100;
    return { ...e, cumPct: pct, cls: i === 0 ? "A" : pct <= 70 ? "A" : pct <= 90 ? "B" : "C" };
  });
}

/* ---------- recency buckets + table (needs order rows + history) ----------
   Thresholds: sheet ke 1.2 me "agreed inactive/lost criteria" likha hai —
   ye ALERT_RULE_CONFIG table me jaane chahiye. Tab tak ek jagah se control. */
export const RECENCY_RULES = { active: 30, watch: 60, atRisk: 90 };

export function recencyStatus(days) {
  if (days <= RECENCY_RULES.active) return "Active";
  if (days <= RECENCY_RULES.watch) return "Watch";
  if (days <= RECENCY_RULES.atRisk) return "At Risk";
  return "Dormant/Lost";
}

export function buildRecency(rows, hist, refDate, ords) {
  const list = ords || ordersOf(rows);       // caller already compute kar chuka ho to reuse
  const lastByCust = {}, ordCountByCust = {};

  for (const o of list) {
    const k = keyOf(o);
    if (!lastByCust[k] || o.dt > lastByCust[k]) lastByCust[k] = o.dt;
    ordCountByCust[k] = (ordCountByCust[k] || 0) + 1;
  }

  const histByCust = {};
  for (const h of hist) histByCust[String(h.custId)] = h;

  const universe = new Set([...Object.keys(lastByCust), ...hist.map((h) => String(h.custId))]);
  const refTime = toD(refDate);

  return [...universe]
    .map((k) => {
      const h = histByCust[k];
      const lastAct = [lastByCust[k], h?.last].filter(Boolean).sort().pop();
      const days = lastAct ? Math.round((refTime - toD(lastAct)) / 86400000) : Infinity;
      return {
        custId: k,
        cust: h?.cust || "",
        lastAct,
        days,
        orders: ordCountByCust[k] || 0,
        pastInv: h?.inv || 0,
        status: lastAct ? recencyStatus(days) : "Dormant/Lost",
      };
    })
    .sort((a, b) => b.days - a.days);
}

/* ---------- repeat order analysis ---------- */
export function buildRepeatOrders(rows, ords) {
  const list = ords || ordersOf(rows);
  const byCust = {};
  for (const o of list) {
    const k = keyOf(o);
    (byCust[k] = byCust[k] || { cust: o.cust, orders: [] }).orders.push(o);
  }
  return Object.values(byCust)
    .filter((c) => c.orders.length > 1)
    .map((c) => {
      const dts = c.orders.map((o) => o.dt).filter(Boolean).sort();
      let gapSum = 0;
      for (let i = 1; i < dts.length; i++) gapSum += (toD(dts[i]) - toD(dts[i - 1])) / 86400000;
      return {
        cust: c.cust,
        n: c.orders.length,
        first: dts[0],
        last: dts[dts.length - 1],
        avgGap: dts.length > 1 ? gapSum / (dts.length - 1) : 0,
        amt: c.orders.reduce((s, o) => s + o.amt, 0),
      };
    })
    .sort((a, b) => b.n - a.n);
}

/* ---------- dormant / lost customers (had history, no current order) ---------- */
export function buildDormant(rows, hist, refDate) {
  const ordCustIds = new Set(rows.map(keyOf).filter(Boolean));
  const refTime = toD(refDate);
  return hist
    .filter((h) => !ordCustIds.has(String(h.custId)))
    .map((h) => ({ ...h, days: h.last ? Math.round((refTime - toD(h.last)) / 86400000) : Infinity }))
    .sort((a, b) => b.amt - a.amt);
}

/* ---------- pending order lines (fulfillment tab) ----------
   openDays order date se ginta hai. DLV_DT (promised delivery) column exist
   karta hai par poori table me khaali hai — bhar jaye to yahan switch karna. */
export function buildPendingOrders(rows, refDate) {
  const refTime = toD(refDate);
  return rows
    .filter((r) => !r.cancelDt && ((r.qb || 0) > 0 || r.comple === "N"))
    .map((r) => ({
      ...r,
      openDays: r.dt ? Math.round((refTime - toD(r.dt)) / 86400000) : 0,
      // rate undefined ho to sort NaN se garbage ho jaata tha
      atRisk: (r.qb || 0) * (r.rate || 0),
    }))
    .sort((a, b) => b.atRisk - a.atRisk);
}

/* ---------- Average Order Value per customer ---------- */
export function buildAOV(rows, n = 10, ords) {
  const list = ords || ordersOf(rows);
  const byCust = {};
  for (const o of list) {
    const k = keyOf(o);
    byCust[k] = byCust[k] || { cust: o.cust, amt: 0, count: 0 };
    byCust[k].amt += o.amt;
    byCust[k].count += 1;
  }
  return Object.values(byCust)
    .map((c) => ({ cust: c.cust, aov: c.count ? c.amt / c.count : 0 }))
    .sort((a, b) => b.aov - a.aov)
    .slice(0, n);
}

/* ---------- Rate vs MRP margin headroom ---------- */
export function buildMarginHeadroom(rows, n = 200) {
  return rows
    .filter((r) => r.mrp > 0 && r.rate > 0 && r.rate <= r.mrp)  // rate > mrp = data error, headroom negative aata tha
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
export function buildCombinedView(rows, hist, abcMap, ords) {
  const list = ords || ordersOf(rows);
  const curByCust = {};
  for (const o of list) {
    const k = keyOf(o);
    curByCust[k] = curByCust[k] || { cust: o.cust, custId: k, amt: 0, orders: 0, balance: 0 };
    curByCust[k].amt += o.amt;
    curByCust[k].orders += 1;
    curByCust[k].balance += o.balance || 0;
  }

  const histByCust = {};
  for (const h of hist) histByCust[String(h.custId)] = h;

  const allIds = new Set([...Object.keys(curByCust), ...hist.map((h) => String(h.custId))]);

  return [...allIds]
    .map((id) => {
      const cur = curByCust[id];
      const h = histByCust[id];
      return {
        custId: id,
        cust: cur?.cust || h?.cust || "",
        geo: h ? `${h.city || "—"} / ${h.state || "—"}` : "—",
        curAmt: cur?.amt || 0,
        orders: cur?.orders || 0,
        balance: cur?.balance || 0,
        pastAmt: h?.amt || 0,
        pastInv: h?.inv || 0,
        returnAmt: h?.returnAmt || 0,
        status: cur && h ? "Repeat" : cur ? "New Customer" : "No Current Order",
        abc: abcMap?.[id] || null,
      };
    })
    .sort((a, b) => b.curAmt - a.curAmt || b.pastAmt - a.pastAmt);
}

export { inr, inrS, by, topN, dmy };
import { by, topN, inr, inrS } from "./helpers";

/**
 * Builds the narrative "AI summary" paragraph — same style as the reference
 * dashboard's aiSummaryText(), but adapted to our fields (invoice-level sales:
 * amt, gst, invAmt, qty — we don't have order qty/dispatch/payment-terms since
 * that's the order table, not FIN_SALES).
 */
export function buildAISummary(rows) {
  if (!rows.length) return "No data in the current filter — adjust filters or date range to see AI analysis.";

  const tot = rows.reduce((s, r) => s + (r.amt || 0), 0) || 1;
  const gst = rows.reduce((s, r) => s + (r.gst || 0), 0);
  const nInv = new Set(rows.map((r) => r.inv)).size;
  const nCust = new Set(rows.map((r) => r.cust)).size;

  const stateTop = topN(by(rows.filter((r) => r.state), (r) => r.state, (r) => r.amt), 1);
  const custTop = topN(by(rows, (r) => r.cust, (r) => r.amt), 1);
  const prodTop = topN(by(rows, (r) => r.item, (r) => r.amt), 1);

  const gstPct = (gst / tot) * 100;
  const custPct = custTop.length ? (custTop[0][1] / tot) * 100 : 0;

  let reco;
  if (custPct > 35) {
    reco = `AI recommendation: revenue is concentrated in ${custTop[0][0]} (${custPct.toFixed(1)}%) — diversifying the customer base would reduce risk.`;
  } else if (nInv > 0 && tot / nInv < 20000) {
    reco = "AI recommendation: average invoice value is relatively low — consider bundling or upselling to raise order size.";
  } else {
    reco = "AI recommendation: sales spread looks healthy across customers — maintain current outreach cadence.";
  }

  return (
    `AI analysis of ${rows.length.toLocaleString("en-IN")} invoice lines: total taxable sales ${inrS(tot)} ` +
    `across ${nInv.toLocaleString("en-IN")} invoices from ${nCust.toLocaleString("en-IN")} customers. ` +
    (stateTop.length ? `${stateTop[0][0]} leads with ${((stateTop[0][1] / tot) * 100).toFixed(1)}% of value` : "") +
    (custTop.length ? `, and ${custTop[0][0]} is the largest single account (${custPct.toFixed(1)}%). ` : ". ") +
    (prodTop.length ? `Best-selling product is ${prodTop[0][0]}. ` : "") +
    `GST works out to ${gstPct.toFixed(1)}% of taxable value. ${reco}`
  );
}

/**
 * Builds the insight cards grid. Each insight: { type, icon, html }.
 * type drives the card color: '' (neutral), 'warn', 'alert', 'good'.
 */
export function buildInsights(rows) {
  if (!rows.length) return [];
  const ins = [];
  const push = (type, icon, html) => ins.push({ type, icon, html });

  const tot = rows.reduce((s, r) => s + (r.amt || 0), 0) || 1;

  // Customer concentration
  const custAgg = topN(by(rows, (r) => r.cust, (r) => r.amt), 3);
  if (custAgg.length) {
    const [topCust, topVal] = custAgg[0];
    const share = (topVal / tot) * 100;
    const top3Share = (custAgg.reduce((s, [, v]) => s + v, 0) / tot) * 100;
    push(
      share > 35 ? "warn" : "good",
      "🎯",
      `Top customer <b>${topCust}</b> = <b>${share.toFixed(1)}%</b> of sales; top 3 = <b>${top3Share.toFixed(1)}%</b>${share > 35 ? " — concentration risk" : ""}`
    );
  }

  // Best seller
  const prodAgg = topN(by(rows, (r) => r.item, (r) => r.amt), 1);
  if (prodAgg.length) {
    push("", "💊", `Best seller: <b>${prodAgg[0][0]}</b> = ${inr(prodAgg[0][1])} (${((prodAgg[0][1] / tot) * 100).toFixed(1)}% of value)`);
  }

  // GST load
  const gst = rows.reduce((s, r) => s + (r.gst || 0), 0);
  const gstPct = (gst / tot) * 100;
  push("", "🏛️", `Total GST collected: <b>${inr(gst)}</b> (${gstPct.toFixed(1)}% of taxable value)`);

  // Geographic concentration
  const stateAgg = topN(by(rows.filter((r) => r.state), (r) => r.state, (r) => r.amt), 1);
  const unmapped = rows.filter((r) => !r.state);
  const unAmt = unmapped.reduce((s, r) => s + (r.amt || 0), 0);
  if (stateAgg.length) {
    const sharePct = (stateAgg[0][1] / tot) * 100;
    push(sharePct > 40 ? "warn" : "", "🗺️", `<b>${stateAgg[0][0]}</b> leads geography with <b>${sharePct.toFixed(1)}%</b> of sales`);
  }
  if (unAmt > 0) {
    push("warn", "❓", `<b>${inr(unAmt)}</b> in sales has no state mapped — ${unmapped.length} line items missing city/state data`);
  }

  // Margin headroom (using MRP vs effective per-unit rate = amt/qty)
  const marginable = rows.filter((r) => r.MRP > 0 && r.qty > 0 && r.amt > 0);
  if (marginable.length) {
    const avgMarginPct =
      marginable.reduce((s, r) => {
        const effRate = r.amt / r.qty;
        return s + Math.max(0, (r.MRP - effRate) / r.MRP) * 100;
      }, 0) / marginable.length;
    push(
      avgMarginPct < 25 ? "alert" : avgMarginPct < 45 ? "warn" : "good",
      "📈",
      `Average margin headroom (MRP vs effective rate): <b>${avgMarginPct.toFixed(1)}%</b> across ${marginable.length.toLocaleString("en-IN")} priced line items`
    );
  }

  // Product group mix
  const grpAgg = topN(by(rows, (r) => r.grp || "Other", (r) => r.amt), 1);
  if (grpAgg.length) {
    push("", "🧪", `Leading product group: <b>${grpAgg[0][0]}</b> (${((grpAgg[0][1] / tot) * 100).toFixed(1)}% of sales)`);
  }

  return ins.slice(0, 8);
}

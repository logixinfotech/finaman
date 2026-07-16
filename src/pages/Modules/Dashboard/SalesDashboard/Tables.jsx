import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { invoiceRows, by, topN, inrS, dmy } from "../../../../utils/helpers";

const PAGE_SIZE = 15;

export function InvoiceRegisterTable({ rows }) {
  const [sort, setSort] = useState({ key: "dt", dir: -1 });
  const [page, setPage] = useState(1); 
  const invoices = useMemo(() => {
    const list = invoiceRows(rows);
    list.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key];
      if (typeof va === "string") return va.localeCompare(vb) * sort.dir;
      return (va - vb) * sort.dir;
    });
    return list;
  }, [rows, sort]);

  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
  const pageRows = invoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key) => {
    setSort((s) => ({ key, dir: s.key === key ? -s.dir : -1 }));
    setPage(1);
  };

  const cols = [
    { key: "inv", label: "Invoice #" },
    { key: "dt", label: "Date" },
    { key: "cust", label: "Customer" },
    { key: "city", label: "City" },
    { key: "amt", label: "Taxable Amt" },
    { key: "gst", label: "GST" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Invoice Register</h4>
        <span className="text-xs text-slate-400">{invoices.length.toLocaleString("en-IN")} invoices</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="text-slate-400 text-[11px] uppercase tracking-wide border-b border-slate-100">
            <tr>
              {cols.map((c) => (
                <th key={c.key} className="py-2 pr-4 cursor-pointer select-none hover:text-slate-600" onClick={() => toggleSort(c.key)}>
                  <span className="inline-flex items-center gap-1">{c.label} <ArrowUpDown className="h-3 w-3" /></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pageRows.map((r) => (
              <tr key={r.inv} className="hover:bg-slate-50/60">
                <td className="py-2 pr-4 font-medium text-indigo-600">{r.inv}</td>
                <td className="py-2 pr-4 text-slate-500">{dmy(r.dt)}</td>
                <td className="py-2 pr-4 text-slate-800">{r.cust}</td>
                <td className="py-2 pr-4 text-slate-500">{r.city || "—"}</td>
                <td className="py-2 pr-4">{inrS(r.amt)}</td>
                <td className="py-2 pr-4">{inrS(r.gst)}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">No invoices for current filters</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-slate-200 px-3 py-1 disabled:opacity-40 hover:bg-slate-50">Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-slate-200 px-3 py-1 disabled:opacity-40 hover:bg-slate-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomerRankingTable({ rows }) {
  const ranked = useMemo(() => topN(by(rows, (r) => r.cust, (r) => r.amt), 10), [rows]);
  const max = ranked[0]?.[1] || 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">Customer Ranking</h4>
      <div className="space-y-3">
        {ranked.map(([cust, amt], i) => (
          <div key={cust} className="flex items-center gap-3">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-50 text-slate-400"
            }`}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium text-slate-800">{cust}</span>
                <span className="ml-2 shrink-0 font-semibold text-slate-900">{inrS(amt)}</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(amt / max) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
        {ranked.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No data for current filters</p>}
      </div>
    </div>
  );
}

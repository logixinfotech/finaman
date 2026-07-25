import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, FileText, Trophy, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <FileText className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
          <h4 className="text-[13px] font-bold tracking-tight text-slate-700">Invoice Register</h4>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
          {invoices.length.toLocaleString("en-IN")} invoices
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              {cols.map((c) => {
                const active = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={`cursor-pointer select-none py-2.5 px-4 transition-colors hover:text-indigo-600 ${active ? "text-indigo-600" : ""}`}
                    onClick={() => toggleSort(c.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      {active ? (
                        sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-300" />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pageRows.map((r) => (
              <tr key={r.inv} className="transition-colors hover:bg-indigo-50/40">
                <td className="px-4 py-2.5 font-semibold text-indigo-600">{r.inv}</td>
                <td className="px-4 py-2.5 text-slate-500">{dmy(r.dt)}</td>
                <td className="px-4 py-2.5 text-slate-800">{r.cust}</td>
                <td className="px-4 py-2.5 text-slate-500">{r.city || "—"}</td>
                <td className="px-4 py-2.5 font-medium text-slate-700">{inrS(r.amt)}</td>
                <td className="px-4 py-2.5 text-slate-500">{inrS(r.gst)}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12">
                  <div className="flex flex-col items-center gap-1.5 text-slate-300">
                    <Inbox className="h-7 w-7" strokeWidth={1.5} />
                    <span className="text-xs font-medium text-slate-400">No invoices for current filters</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <span>
            Page <span className="font-semibold text-slate-700">{page}</span> of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const RANK_STYLE = [
  "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-200",
  "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-sm shadow-slate-200",
  "bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow-sm shadow-orange-200",
];

export function CustomerRankingTable({ rows }) {
  const ranked = useMemo(() => topN(by(rows, (r) => r.cust, (r) => r.amt), 10), [rows]);
  const max = ranked[0]?.[1] || 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <h4 className="text-[13px] font-bold tracking-tight text-slate-700">Customer Ranking</h4>
      </div>

      <div className="space-y-3">
        {ranked.map(([cust, amt], i) => (
          <div key={cust} className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                RANK_STYLE[i] || "bg-slate-50 text-slate-400"
              }`}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium text-slate-800">{cust}</span>
                <span className="ml-2 shrink-0 font-semibold text-slate-900">{inrS(amt)}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${(amt / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        {ranked.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 py-8 text-slate-300">
            <Inbox className="h-7 w-7" strokeWidth={1.5} />
            <span className="text-xs font-medium text-slate-400">No data for current filters</span>
          </div>
        )}
      </div>
    </div>
  );
}
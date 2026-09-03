import { useMemo, useState, useCallback } from "react";
import { inrS } from "../../../../utils/helpers";

const THRESHOLD_DAYS = 90;
const STORAGE_KEY = "dormantCustomerNotes"; // { [custId]: { note, followedUp } }

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveNotes(notes) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch { /* storage unavailable — ignore */ }
}

// NOTE: notes/follow-up flags abhi localStorage mein hain (sirf isi browser
// mein save honge, doosre user/device pe nahi dikhenge) — kyunki backend mein
// abhi koi customer-notes table nahi hai. Ye stopgap hai. Agar client ko
// shared/multi-user notes chahiye, ek chhoti `customer_notes` table + 2 API
// routes (save/list) banane honge — batao to wo bhi kar deta hoon.
export default function DormantLostCustomers({ hist, refDate }) {
  const [notes, setNotes] = useState(loadNotes);
  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState("");

  const list = useMemo(() => {
    const ref = new Date(refDate);
    return (hist || [])
      .map((h) => ({ ...h, days: Math.floor((ref - new Date(h.last)) / (1000 * 60 * 60 * 24)) }))
      .filter((h) => h.days >= THRESHOLD_DAYS)
      .sort((a, b) => (b.amt || 0) - (a.amt || 0));
  }, [hist, refDate]);

  const toggleFollowedUp = useCallback((custId) => {
    setNotes((prev) => {
      const next = { ...prev, [custId]: { ...prev[custId], followedUp: !prev[custId]?.followedUp } };
      saveNotes(next);
      return next;
    });
  }, []);

  const openNoteEditor = (custId) => {
    setOpenId(custId);
    setDraft(notes[custId]?.note || "");
  };

  const saveNote = (custId) => {
    setNotes((prev) => {
      const next = { ...prev, [custId]: { ...prev[custId], note: draft } };
      saveNotes(next);
      return next;
    });
    setOpenId(null);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">💤 Dormant / Lost Customer List</h4>
      <p className="text-[11px] text-slate-500 mb-3">{list.length} customers with no order in {THRESHOLD_DAYS}+ days</p>
      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
        {list.map((h) => {
          const n = notes[h.custId] || {};
          return (
            <div key={h.custId} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className={`truncate font-medium text-sm ${n.followedUp ? "text-slate-400 line-through" : "text-slate-700"}`}>{h.cust}</p>
                  <p className="text-[10px] text-slate-400">Last order: {h.last} · {h.days} days ago</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {h.amt != null && <span className="text-[10px] text-slate-400">{inrS(h.amt)}</span>}
                  <button
                    onClick={() => toggleFollowedUp(h.custId)}
                    className={`rounded-md px-2 py-1 text-[10px] font-semibold ${n.followedUp ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  >
                    {n.followedUp ? "✓ Followed up" : "Mark followed up"}
                  </button>
                  <button
                    onClick={() => openNoteEditor(h.custId)}
                    className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-100"
                  >
                    {n.note ? "Edit note" : "+ Note"}
                  </button>
                </div>
              </div>

              {n.note && openId !== h.custId && (
                <p className="mt-1 rounded-md bg-slate-50 px-2 py-1 text-[10.5px] text-slate-500">{n.note}</p>
              )}

              {openId === h.custId && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveNote(h.custId)}
                    placeholder="Add a follow-up note…"
                    className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                  <button onClick={() => saveNote(h.custId)} className="rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-indigo-700">Save</button>
                  <button onClick={() => setOpenId(null)} className="text-[10px] text-slate-400 hover:text-slate-600">Cancel</button>
                </div>
              )}
            </div>
          );
        })}
        {!list.length && <p className="py-6 text-center text-xs text-slate-400">No dormant customers 🎉</p>}
      </div>
    </div>
  );
}
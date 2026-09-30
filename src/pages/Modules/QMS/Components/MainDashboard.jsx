import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMyWork } from "../Utils/QmsAPI";
import { setQmsIntent } from "../QMSIntent/QMSintent";
import { useOpenQmsModule } from "../QMSIntent/opneQMSModule";
 
const TABS = [["needs", "Needs my action"], ["waiting", "Waiting on others"], ["rejected", "Rejected (30 days)"], ["drafts", "My drafts"]];
const EMPTY = {
  needs: "Nothing is waiting on you.",
  waiting: "You are not waiting on anyone.",
  rejected: "No records were rejected in the last 30 days.",
  drafts: "You have no saved drafts.",
};
const sev = (s) => (/^(critical|high)$/i.test(s) ? "r" : /^major$/i.test(s) ? "a" : /^(minor|low)$/i.test(s) ? "g" : "n");
const due = (r) => (r.dueIn == null ? "No target date" : r.dueIn < 0 ? `${-r.dueIn} d overdue` : r.dueIn === 0 ? "Due today" : `Due in ${r.dueIn} d`);
const hello = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
const tone = (r) => (r.dueIn == null ? "" : r.dueIn < 0 ? "r" : r.dueIn <= 3 ? "a" : "");

export default function MyWork({ onOpenPage }) {
  const openModule = useOpenQmsModule(onOpenPage);
  const lastGo = useRef(0);
  const go = (module, intent) => {
    if (Date.now() - lastGo.current < 800) return; // double-click guard
    lastGo.current = Date.now();
    setQmsIntent({ module, ...intent, at: Date.now() });
    openModule(module);
  };

  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("needs");
  const [mine, setMine] = useState(true);
  const [q, setQ] = useState(""); 

  const load = useCallback(async () => {
    setErr("");
    try {
      const r = await getMyWork();
      if (!r?.success) throw new Error(r?.message || "Could not load your work");
      setD(r);
    } catch (e) { setErr(e.message || "Could not load your work"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    let l = d?.[tab] || [];
    if (tab === "needs" && mine) l = l.filter((r) => r.exclusive);
    const s = q.trim().toLowerCase();
    if (s) l = l.filter((r) => `${r.recordNo} ${r.stage} ${r.moduleLabel}`.toLowerCase().includes(s));
    return l;
  }, [d, tab, mine, q]);

  const groups = useMemo(() => {
    const m = {};
    rows.forEach((r) => { (m[r.moduleLabel] = m[r.moduleLabel] || []).push(r); });
    return Object.entries(m);
  }, [rows]);

  

  if (err) return (
    <div className="mw"><style>{CSS}</style>
      <div className="mw-state"><p>{err}</p><button className="mw-b" onClick={load}>Try again</button></div>
    </div>
  );
  if (!d) return (
    <div className="mw"><style>{CSS}</style>
      <div className="mw-skel" aria-busy="true" aria-label="Loading your work">
        <i style={{ width: "38%" }} /><i style={{ width: "100%", height: 14 }} /><i /><i /><i />
      </div>
    </div>
  );

  const k = d.kpi;
  const rest = Math.max(0, k.pending - k.overdue - k.due7);
  const pct = (n) => (k.pending ? (n / k.pending) * 100 : 0);
  const stats = [
    ["My pending", k.pending, "", "waiting for you"],
    ["Only my stage", k.onlyMe, "", "only you can act"],
    ["Overdue", k.overdue, "r", "past target date"],
    ["Due in 7 days", k.due7, "a", "coming up soon"],
    ["Acted this month", k.actedThisMonth, "g", "records you moved"],
  ];

  return (
    <div className="mw"><style>{CSS}</style>

      <header className="mw-hd">
        <div className="mw-hd-top">
          <div className="mw-who">
            <span className="mw-av" aria-hidden="true">{String(d.user?.id || "?").charAt(0).toUpperCase()}</span>
            <div>
              <h2>{hello()}, {d.user?.id}</h2>
              <p className="mw-role">{d.user?.group}</p>
            </div>
          </div>
          {d.create?.length > 0 && (
            <div className="mw-qc">
              {d.create.slice(0, 5).map((c) => (
                <button key={c.module} className="mw-b p" onClick={() => go(c.module, { type: "new" })}>New {c.label}</button>
              ))}
              {d.create.length > 5 && (
                <details className="mw-more"><summary className="mw-b">More</summary>
                  <div>{d.create.slice(5).map((c) => (
                    <button key={c.module} className="mw-b" onClick={() => go(c.module, { type: "new" })}>New {c.label}</button>
                  ))}</div>
                </details>
              )}
            </div>
          )}
        </div>

        {k.pending > 0 && (
          <div className="mw-urg" role="img" aria-label={`${k.overdue} overdue, ${k.due7} due within 7 days, ${rest} on track`}>
            <span className="r" style={{ width: pct(k.overdue) + "%" }} />
            <span className="a" style={{ width: pct(k.due7) + "%" }} />
            <span className="g" style={{ width: pct(rest) + "%" }} />
          </div>
        )}

        <dl className="mw-stats">
          {stats.map(([l, v, c, h]) => (
            <div key={l} className={`mw-st ${c}`}><dt>{l}</dt><dd>{v}</dd><small>{h}</small></div>
          ))}
        </dl>
      </header>

      <section className="mw-panel">
        <div className="mw-bar-top">
          <div className="mw-tabs" role="tablist">
            {TABS.map(([key, label]) => (
              <button key={key} role="tab" aria-selected={tab === key} className="mw-tab" onClick={() => setTab(key)}>
                {label}<em>{(d[key] || []).length}</em>
              </button>
            ))}
          </div>
          <div className="mw-tools">
            <input className="mw-search" type="search" placeholder="Search record no. or stage" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search records" />
            {tab === "needs" && (
              <label className="mw-sw"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Only stages I own</label>
            )}
          </div>
        </div>

        <div className="mw-list">
        {!groups.length && (
          <div className="mw-empty">
            <b>{q ? "No records match your search." : EMPTY[tab]}</b>
            {q && <button className="mw-b" onClick={() => setQ("")}>Clear search</button>}
          </div>
        )}

        {groups.map(([mod, list], i) => {
          const over = list.filter((r) => r.dueIn != null && r.dueIn < 0).length;
          return (
            <details key={mod} open={i === 0 || groups.length < 3} className="mw-g">
              <summary>
                <span className="mw-chev" aria-hidden="true" />
                <span className="mw-gname">{mod}</span>
                <em>{list.length}</em>
                {over > 0 && <span className="mw-c r">{over} overdue</span>}
              </summary>
              {list.map((r) => (
                <div key={r.module + r.id} className="mw-row">
                  <span className={`mw-mark ${tone(r)}`} />
                  <div className="mw-main">
                    <div className="mw-line">
                      <b className="mw-no">{r.recordNo}</b>
                      <span className="mw-c">{r.stage}</span>
                      {r.severity && <span className={`mw-c ${sev(r.severity)}`}>{r.severity}</span>}
                    </div>
                    <div className="mw-sub">
                      <span className={`mw-due ${tone(r)}`}>{due(r)}</span>
                      {r.idleDays != null && <span>{r.idleDays} d since last update</span>}
                      {r.sharedWith?.length > 0 && <span>Also: {r.sharedWith.join(", ")}</span>}
                      {r.heldBy && <span>With: {r.heldBy.join(" / ")}</span>}
                    </div>
                  </div>
                  <div className="mw-act">
                    <button className="mw-b" onClick={() => go(r.module, { type: "open", id: r.id })}>Open</button>
                   
                  </div>
                </div>
              ))}
            </details>
          );
        })}
        </div>
      </section>
 
    </div>
  );
}

const CSS = `
.mw{--p:#0f5c6e;--p2:#0b4757;--pt:#e3f0f3;--ink:#18212f;--mu:#5f6b7d;--ln:#e2e6ec;--bg:#f4f6f9;--r:#b3382f;--rt:#fbeae8;--a:#a86a12;--at:#fbf0dc;--g:#2f7d5b;--gt:#e2f3ea;
  color:var(--ink);font:14px/1.5 Inter,"Segoe UI",system-ui,sans-serif;background:var(--bg);padding:14px;height:100%;min-height:0;overflow:hidden;display:flex;flex-direction:column}
.mw>*{flex:none}
.mw>.mw-panel{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}
.mw-list{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none;-ms-overflow-style:none}
.mw-list::-webkit-scrollbar,.mw::-webkit-scrollbar,.mw-tabs::-webkit-scrollbar{display:none;width:0;height:0}
.mw *{box-sizing:border-box}
.mw{scrollbar-width:none}
.mw button,.mw input,.mw textarea{font:inherit}

/* header */
.mw-hd{background:#fff;border:1px solid var(--ln);border-radius:16px;padding:0 22px;margin-bottom:16px;overflow:hidden;position:relative}
.mw-hd::before{content:"";display:block;height:5px;margin:0 -22px;background:linear-gradient(90deg,var(--p),#3d9aa8 60%,#9fd0d8)}
.mw-hd-top{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;align-items:center;padding-top:20px}
.mw-who{display:flex;gap:16px;align-items:center;min-width:0}
.mw-av{flex:none;width:56px;height:56px;border-radius:16px;background:var(--p);color:#fff;display:grid;place-items:center;font-size:24px;font-weight:700}
.mw-date{display:block;color:var(--mu);font-size:12.5px}
.mw-hd h2{margin:0;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-.015em}
.mw-role{margin:2px 0 0;color:var(--p);font-weight:600;font-size:13px}
.mw-msg{margin:6px 0 0;color:var(--mu);font-size:14.5px}
.mw-msg b{color:var(--ink)}.mw-msg b.r{color:var(--r)}
.mw-qc{display:flex;flex-wrap:wrap;gap:8px;align-items:center}

/* urgency strip */
.mw-urg{display:flex;height:10px;border-radius:6px;overflow:hidden;background:var(--ln);margin:16px 0 4px;gap:2px}
.mw-urg span{display:block;min-width:0}
.mw-urg .r{background:var(--r)}.mw-urg .a{background:#d99a2b}.mw-urg .g{background:#7fb99d}

/* stats */
.mw-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));margin:14px -22px 0;border-top:1px solid var(--ln)}
.mw-st{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:12px;align-items:center;padding:14px 22px;border-left:1px solid var(--ln);min-width:0}
.mw-st:first-child{border-left:0}
.mw-st dd{grid-row:1 / span 2;grid-column:1;margin:0;font-size:26px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1;color:var(--ink)}
.mw-st dt{grid-column:2;grid-row:1;color:var(--ink);font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;align-self:end}
.mw-st small{grid-column:2;grid-row:2;color:var(--mu);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;align-self:start}
.mw-st.r dd{color:var(--r)}.mw-st.a dd{color:var(--a)}.mw-st.g dd{color:var(--g)}

/* panel */
.mw-panel{background:#fff;border:1px solid var(--ln);border-radius:14px;overflow:hidden}
.mw-bar-top{display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:space-between;align-items:center;padding:0 12px;border-bottom:1px solid var(--ln)}
.mw-tabs{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none}
.mw-tab{border:0;background:none;padding:14px 12px 12px;font-weight:600;color:var(--mu);cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap}
.mw-tab:hover{color:var(--ink)}
.mw-tab[aria-selected=true]{color:var(--p);border-color:var(--p)}
.mw-tab em,.mw-g em{font-style:normal;font-size:12px;font-weight:600;background:var(--bg);color:var(--mu);border-radius:20px;padding:1px 8px;margin-left:6px;font-variant-numeric:tabular-nums}
.mw-tab[aria-selected=true] em{background:var(--pt);color:var(--p)}
.mw-tools{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:8px 0}
.mw-search{border:1px solid var(--ln);border-radius:9px;padding:6px 10px;min-width:210px;background:#fff;color:var(--ink)}
.mw-search:focus{outline:2px solid var(--p);outline-offset:1px;border-color:var(--p)}
.mw-sw{color:var(--mu);font-size:13px;white-space:nowrap;cursor:pointer;display:flex;gap:6px;align-items:center}
.mw-sw input{accent-color:var(--p)}

/* groups */
.mw-g summary{position:sticky;top:0;z-index:1;list-style:none;display:flex;align-items:center;gap:8px;padding:10px 16px;background:var(--bg);border-bottom:1px solid var(--ln);cursor:pointer;font-weight:650}
.mw-g summary::-webkit-details-marker{display:none}
.mw-g summary:hover{background:#edf0f5}
.mw-g summary em{margin-left:0}
.mw-gname{font-weight:650}
.mw-chev{width:7px;height:7px;border-right:2px solid var(--mu);border-bottom:2px solid var(--mu);transform:rotate(-45deg);transition:transform .15s}
.mw-g[open]>summary .mw-chev{transform:rotate(45deg)}

/* rows */
.mw-row{display:grid;grid-template-columns:4px 1fr auto;gap:14px;padding:12px 16px;border-bottom:1px solid var(--ln);align-items:center}
.mw-row:hover{background:#fafbfd}
.mw-row:last-child{border-bottom:0}
.mw-mark{align-self:stretch;border-radius:4px;background:var(--ln)}
.mw-mark.r{background:var(--r)}.mw-mark.a{background:#d99a2b}
.mw-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.mw-no{font-variant-numeric:tabular-nums;font-size:14.5px}
.mw-c{font-size:12px;font-weight:600;border-radius:6px;padding:1px 8px;background:var(--pt);color:var(--p)}
.mw-c.r{background:var(--rt);color:var(--r)}.mw-c.a{background:var(--at);color:var(--a)}.mw-c.g{background:var(--gt);color:var(--g)}.mw-c.n{background:var(--bg);color:var(--mu)}
.mw-sub{display:flex;flex-wrap:wrap;gap:2px 14px;color:var(--mu);font-size:12.5px;margin-top:3px}
.mw-due{font-weight:600}.mw-due.r{color:var(--r)}.mw-due.a{color:var(--a)}
.mw-act{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;align-items:center}

/* buttons */
.mw-b{font-weight:600;border:1px solid var(--ln);background:#fff;color:var(--ink);border-radius:9px;padding:7px 12px;cursor:pointer;transition:background .12s,border-color .12s}
.mw-b:hover{background:var(--bg);border-color:#cfd5de}
.mw-b.p{background:var(--p);border-color:var(--p);color:#fff}
.mw-b.p:hover{background:var(--p2);border-color:var(--p2)}
.mw-b.link{border-color:transparent;background:none;padding:7px 6px}
.mw-b.d{color:var(--r)}.mw-b.d:hover{background:var(--rt)}
.mw-b.dd{background:var(--r);border-color:var(--r);color:#fff}
.mw-b:disabled{opacity:.6;cursor:default}
.mw-b:focus-visible,.mw-tab:focus-visible,.mw-g summary:focus-visible{outline:2px solid var(--p);outline-offset:2px}
.mw-more{position:relative}.mw-more summary{list-style:none}.mw-more summary::-webkit-details-marker{display:none}
.mw-more>div{position:absolute;z-index:50;top:110%;right:0;background:#fff;border:1px solid var(--ln);border-radius:10px;padding:6px;display:grid;gap:4px;min-width:210px;box-shadow:0 8px 24px rgba(24,33,47,.12)}

/* states */
.mw-empty{padding:40px 16px;text-align:center;color:var(--mu);display:grid;gap:12px;justify-items:center}
.mw-empty b{font-weight:600;color:var(--ink)}
.mw-state{background:#fff;border:1px solid var(--ln);border-radius:14px;padding:40px 16px;text-align:center;display:grid;gap:12px;justify-items:center;color:var(--mu)}
.mw-skel{background:#fff;border:1px solid var(--ln);border-radius:14px;padding:20px;display:grid;gap:14px}
.mw-skel i{display:block;height:44px;width:100%;border-radius:8px;background:linear-gradient(90deg,#eef1f5 25%,#f7f8fa 50%,#eef1f5 75%);background-size:200% 100%;animation:mwsh 1.3s linear infinite}
@keyframes mwsh{to{background-position:-200% 0}}

/* modal */
.mw-ov{position:fixed;inset:0;background:rgba(24,33,47,.5);display:grid;place-items:center;z-index:2000;padding:16px}
.mw-modal{background:#fff;border-radius:14px;padding:22px;width:100%;max-width:450px;display:grid;gap:12px;box-shadow:0 20px 50px rgba(24,33,47,.25)}
.mw-modal h3{margin:0;font-size:17px}
.mw-modal p{margin:0;color:var(--mu)}
.mw-flow{display:flex;align-items:center;gap:8px}.mw-flow i{font-style:normal;color:var(--mu);font-size:12.5px}
.mw-warn{color:var(--r)!important;font-size:13px}
.mw-modal label{display:grid;gap:4px;font-weight:600;font-size:13px}
.mw-modal textarea,.mw-modal input{padding:8px 10px;border:1px solid var(--ln);border-radius:8px;color:var(--ink)}
.mw-modal textarea:focus,.mw-modal input:focus{outline:2px solid var(--p);outline-offset:1px;border-color:var(--p)}
.mw-err{color:var(--r);font-size:13px}
.mw-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 16px;border-radius:10px;z-index:2100}

@media(max-width:720px){
  .mw{padding:10px;overflow:auto;height:auto}
  .mw>.mw-panel{flex:none}
  .mw-list{overflow:visible}
  .mw-stats{grid-template-columns:repeat(2,minmax(0,1fr));margin:12px -14px 0}
  .mw-st{padding:10px 14px;border-top:1px solid var(--ln)}
  .mw-st:nth-child(-n+2){border-top:0}
  .mw-st:nth-child(odd){border-left:0}
  .mw-st:last-child:nth-child(odd){grid-column:1 / -1}
  .mw-st dd{font-size:22px}
  .mw-st small{display:none}
  .mw-hd{padding:0 14px}
  .mw-hd::before{margin:0 -14px}
  .mw-hd-top{padding-top:14px}
  .mw-msg{font-size:13.5px}
  .mw-qc{width:100%}
  .mw-qc .mw-b{flex:1 1 auto;text-align:center}
  .mw-bar-top{padding:0 6px}
  .mw-row{padding:10px 12px;gap:10px}
  .mw-act .mw-b.p{flex:1 1 auto}
  .mw-av{width:44px;height:44px;font-size:19px;border-radius:12px}
  .mw-hd h2{font-size:21px}
  .mw-row{grid-template-columns:4px 1fr}
  .mw-act{grid-column:2;justify-content:flex-start}
  .mw-search{min-width:0;flex:1}
  .mw-tools{width:100%}
}
@media(min-width:721px) and (max-width:1000px){.mw-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.mw-st:nth-child(4){border-left:0}.mw-st:nth-child(n+4){border-top:1px solid var(--ln)}.mw-st small{display:none}}
@media(prefers-reduced-motion:reduce){.mw *{animation:none!important;transition:none!important}}
`;
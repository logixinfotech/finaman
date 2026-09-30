import { useState, useEffect, useMemo,  } from "react"; 
import {
  F, FD, FM, C, STAT_BADGE, PRIO_CFG,
  Avtar, PDot, 
  
  todayStr, fmtHrs, 
  btnSecondary, 
} from "./WorkDiaryForm";
import {
  ClipboardList, RefreshCw, CheckCircle2, AlertTriangle, Clock,
  X, 
  Flag,   TrendingUp,
} from "lucide-react";

// ─── DateRangePicker ──────────────────────────────────────────────
const PRESETS = [
  { l:"Today",        k:"today" },
  { l:"This Week",    k:"week"  },
  { l:"This Month",   k:"month" },
  { l:"Last Month",   k:"lmonth"},
  { l:"Last 3 Months",k:"q"    },
];

const presetRange = k => {
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
  const fmt = d => d.toISOString().slice(0,10);
  switch(k) {
    case "today":  return { from: fmt(now), to: fmt(now) };
    case "week": {
      const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { from: fmt(mon), to: fmt(sun) };
    }
    case "month":  return { from: fmt(new Date(y,m,1)),   to: fmt(new Date(y,m+1,0)) };
    case "lmonth": return { from: fmt(new Date(y,m-1,1)), to: fmt(new Date(y,m,0)) };
    case "q":      return { from: fmt(new Date(y,m-2,1)), to: fmt(new Date(y,m+1,0)) };
    default:       return { from: fmt(new Date(y,m,1)),   to: fmt(new Date(y,m+1,0)) };
  }
};

const DateRangePicker = ({ from, to, onFrom, onTo, onPreset, activePreset }) => (
  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
    {PRESETS.map(p => (
      <button key={p.k} onClick={() => onPreset(p.k)}
        style={{ padding:"5px 11px", borderRadius:999, border:"1.5px solid",
          fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:F,
          background: activePreset===p.k ? C.blue : C.surface,
          borderColor: activePreset===p.k ? C.blue : C.border,
          color: activePreset===p.k ? "#fff" : C.t3,
          transition:"all .13s" }}>
        {p.l}
      </button>
    ))}
    <div style={{ display:"flex", alignItems:"center", gap:4, marginLeft:4 }}>
      <input type="date" value={from} onChange={e => onFrom(e.target.value)}
        style={{ fontFamily:FM, fontSize:11, padding:"4px 8px", borderRadius:7,
          border:`1.5px solid ${C.border}`, color:C.t1, background:C.surface,
          outline:"none", cursor:"pointer" }} />
      <span style={{ color:C.t4, fontSize:11 }}>→</span>
      <input type="date" value={to} onChange={e => onTo(e.target.value)}
        style={{ fontFamily:FM, fontSize:11, padding:"4px 8px", borderRadius:7,
          border:`1.5px solid ${C.border}`, color:C.t1, background:C.surface,
          outline:"none", cursor:"pointer" }} />
    </div>
  </div>
);

// ─── KpiCard ──────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color, bg, Icon: Ic, trend }) => (
  <div style={{ background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:14,
    padding:"16px 18px", display:"flex", alignItems:"center", gap:14,
    boxShadow:"0 1px 3px rgba(12,25,52,.04)" }}>
    <div style={{ width:44, height:44, borderRadius:12, background:bg,
      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <Ic size={20} color={color} strokeWidth={1.8} />
    </div>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontFamily:FD, fontSize:24, fontWeight:800, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:C.t3, fontWeight:600, marginTop:3 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:C.t4, marginTop:2 }}>{sub}</div>}
    </div>
    {trend !== undefined && (
      <div style={{ fontSize:11, fontWeight:700, fontFamily:FM, flexShrink:0,
        color: trend >= 0 ? "#15803d" : "#b91c1c" }}>
        {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
      </div>
    )}
  </div>
);

// ─── MiniBar ──────────────────────────────────────────────────────
const MiniBar = ({ value, max, color, label, sub }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
    <div style={{ fontSize:12, fontWeight:600, color:C.t2, fontFamily:F, minWidth:100,
      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</div>
    <div style={{ flex:1, height:6, background:C.bg, borderRadius:3, overflow:"hidden" }}>
      <div style={{ height:"100%", borderRadius:3, background:color,
        width:`${max > 0 ? Math.round((value/max)*100) : 0}%`,
        transition:"width .5s ease" }} />
    </div>
    <div style={{ fontSize:11, fontFamily:FM, fontWeight:700, color, minWidth:36, textAlign:"right" }}>{sub || value}</div>
  </div>
);

// ─── WeeklyChart ──────────────────────────────────────────────────
const WeeklyChart = ({ data, colorDone, colorTotal }) => {
  const maxV = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", gap:3 }}>
          <div style={{ width:"100%", display:"flex", flexDirection:"column",
            justifyContent:"flex-end", height:60, gap:1 }}>
            <div style={{ width:"100%", background:colorDone||C.blue,
              borderRadius:"3px 3px 0 0",
              height:`${Math.round((d.done/maxV)*60)}px`,
              transition:"height .4s ease", minHeight: d.done > 0 ? 3 : 0 }} />
            <div style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`,
              borderRadius: d.done > 0 ? "0" : "3px 3px 0 0",
              height:`${Math.round(((d.total-d.done)/maxV)*60)}px`,
              transition:"height .4s ease", minHeight: (d.total-d.done) > 0 ? 3 : 0 }} />
          </div>
          <div style={{ fontSize:9, color:C.t4, fontFamily:FM, textAlign:"center" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

// ─── useReportData ────────────────────────────────────────────────
const useReportData = (from, to, empFilter, deptFilter) => {
  const [data,    setData]    = useState([]);
  const [meta,    setMeta]    = useState({ departments:[], employees:[], is_admin:false });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = { from_date: from, to_date: to };
    if (empFilter)  params.employee_id = empFilter;
    if (deptFilter) params.department  = deptFilter;

    import("../../utils/api").then(({ fetchWorkDiaryReport }) =>
      fetchWorkDiaryReport(params)
    ).then(r => {
      if (cancelled) return;
      setData(Array.isArray(r?.data) ? r.data : []);
      if (r?.meta) setMeta(r.meta);
    }).catch(e => {
      if (!cancelled) setError(e.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [from, to, empFilter, deptFilter]);

  return { data, meta, loading, error };
};

// ─── SummaryScreen ────────────────────────────────────────────────
export const SummaryScreen = ({ list = [], currentUser }) => {
  const tod = todayStr();
  const allTasks = list.flatMap(d => (d.task_lines||[]).map(t => ({ ...t, diary_date:d.diary_date })));

  const heatmapData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 83; i >= 0; i--) {
      const dt = new Date(now); dt.setDate(now.getDate()-i); dt.setHours(0,0,0,0);
      const ds = dt.toISOString().slice(0,10);
      const diary = list.find(d => d.diary_date===ds);
      const ts = diary?.task_lines||[];
      const done = ts.filter(t=>t.status==="Completed").length;
      const total = ts.length;
      days.push({ date:ds, done, total, pct:total?done/total:0, isToday:ds===tod });
    }
    return days;
  }, [list, tod]);

  const hmColor = (pct, total) => {
    if (total===0) return "#f1f5f9";
    if (pct===1)   return "#16a34a";
    if (pct>=.75)  return "#22c55e";
    if (pct>=.5)   return "#86efac";
    if (pct>=.25)  return "#bbf7d0";
    return "#dcfce7";
  };

  const totalDone = allTasks.filter(t=>t.status==="Completed").length;
  const totalHrs  = allTasks.reduce((s,t)=>s+(parseFloat(t.actual_time)||0),0);
  const expHrsAll = allTasks.reduce((s,t)=>s+(parseFloat(t.expected_time)||0),0);
  const onTime    = allTasks.filter(t=>t.status==="Completed"&&(!t.due_date||t.due_date>=tod)).length;
  const onTimePct = totalDone ? Math.round((onTime/totalDone)*100) : 0;

  const streak = useMemo(() => {
    let s = 0;
    for (let i=heatmapData.length-1; i>=0; i--) {
      if (heatmapData[i].total>0) s++;
      else if (i<heatmapData.length-1) break;
    }
    return s;
  }, [heatmapData]);

  // Weekly trend — last 8 weeks
  const weeklyTrend = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let w = 7; w >= 0; w--) {
      const wStart = new Date(now); wStart.setDate(now.getDate() - w*7 - now.getDay() + 1); wStart.setHours(0,0,0,0);
      const wEnd   = new Date(wStart); wEnd.setDate(wStart.getDate()+6);
      const wTasks = allTasks.filter(t => t.diary_date >= wStart.toISOString().slice(0,10) && t.diary_date <= wEnd.toISOString().slice(0,10));
      weeks.push({
        label: wStart.toLocaleDateString("en-IN",{day:"numeric",month:"short"}),
        total: wTasks.length,
        done:  wTasks.filter(t=>t.status==="Completed").length,
      });
    }
    return weeks;
  }, [allTasks]);

  // Category breakdown
  const catBreak = useMemo(() => {
    const map = {};
    allTasks.forEach(t => {
      const c = t.category||"Other";
      if (!map[c]) map[c] = { total:0, done:0 };
      map[c].total++;
      if (t.status==="Completed") map[c].done++;
    });
    return Object.entries(map).map(([name,v])=>({name,...v,rate:v.total?Math.round((v.done/v.total)*100):0}))
      .sort((a,b)=>b.total-a.total);
  }, [allTasks]);

  const CAT_COLORS = ["#185FA5","#8b5cf6","#22c55e","#f59e0b","#ef4444","#0ea5e9","#14b8a6","#f43f5e"];

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"16px 20px 32px",
      display:"flex", flexDirection:"column", gap:16, background:C.bg }}>

      {/* Personal KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:10 }}>
        <KpiCard label="Tasks Completed" value={totalDone} sub={`of ${allTasks.length} total`}
          color="#15803d" bg="#dcfce7" Icon={CheckCircle2} />
        <KpiCard label="On-time Delivery" value={`${onTimePct}%`} sub={`${onTime} tasks on time`}
          color={onTimePct>=80?"#15803d":onTimePct>=60?"#b45309":"#b91c1c"}
          bg={onTimePct>=80?"#dcfce7":onTimePct>=60?"#fef3c7":"#fee2e2"} Icon={Clock} />
        <KpiCard label="Hours Logged" value={`${fmtHrs(totalHrs)}h`} sub={`of ${fmtHrs(expHrsAll)}h planned`}
          color="#0369a1" bg="#e0f2fe" Icon={TrendingUp} />
        <KpiCard label="Active Streak" value={`${streak}d`} sub="consecutive diary days"
          color="#b45309" bg="#fef3c7" Icon={Flag} />
      </div>

      {/* Activity heatmap */}
      <div style={{ background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:14,
        padding:"16px 18px", boxShadow:"0 1px 3px rgba(12,25,52,.04)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.t1, fontFamily:FD }}>Activity — Last 12 Weeks</div>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color:C.t4, fontFamily:FM }}>
            <span>Less</span>
            {["#f1f5f9","#dcfce7","#86efac","#22c55e","#16a34a"].map(cl=>(
              <div key={cl} style={{ width:10, height:10, borderRadius:2, background:cl }} />
            ))}
            <span>More</span>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(12,1fr)", gap:3 }}>
          {Array.from({length:12}).map((_,wIdx)=>(
            <div key={wIdx} style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {[0,1,2,3,4,5,6].map(dow=>{
                const dayIdx=(11-wIdx)*7+(6-dow);
                const day=heatmapData[83-dayIdx];
                if(!day) return <div key={dow} style={{ width:"100%", aspectRatio:"1" }} />;
                return (
                  <div key={dow} title={`${day.date}: ${day.done}/${day.total} done`}
                    style={{ width:"100%", aspectRatio:"1", borderRadius:3, cursor:"pointer",
                      background:hmColor(day.pct,day.total),
                      outline:day.isToday?`2px solid ${C.blue}`:"none", outlineOffset:1,
                      transition:"transform .1s" }}
                    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.3)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly trend + category breakdown side by side */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

        {/* Weekly trend chart */}
        <div style={{ background:C.surface, border:`1.5px solid ${C.border}`,
          borderRadius:14, padding:"16px 18px", boxShadow:"0 1px 3px rgba(12,25,52,.04)" }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.t1, fontFamily:FD, marginBottom:12 }}>
            Weekly Task Trend
          </div>
          <WeeklyChart data={weeklyTrend} colorDone="#185FA5" />
          <div style={{ display:"flex", gap:14, marginTop:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:C.t3 }}>
              <div style={{ width:10, height:10, borderRadius:2, background:C.blue }} /> Completed
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:C.t3 }}>
              <div style={{ width:10, height:10, borderRadius:2, background:C.bg,
                border:`1px solid ${C.border}` }} /> Pending/Other
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ background:C.surface, border:`1.5px solid ${C.border}`,
          borderRadius:14, padding:"16px 18px", boxShadow:"0 1px 3px rgba(12,25,52,.04)" }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.t1, fontFamily:FD, marginBottom:12 }}>
            By Category
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {catBreak.slice(0,6).map((c,i)=>(
              <MiniBar key={c.name} label={c.name}
                value={c.done} max={catBreak[0]?.total||1}
                color={CAT_COLORS[i%CAT_COLORS.length]}
                sub={`${c.rate}%`} />
            ))}
            {catBreak.length===0 && (
              <div style={{ fontSize:12, color:C.t4, fontStyle:"italic" }}>No data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent diary history */}
      <div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.8px", textTransform:"uppercase",
          color:C.t4, marginBottom:10 }}>Recent Diary History</div>
        {list.length===0 ? (
          <div style={{ textAlign:"center", padding:"32px", color:C.t4, fontSize:13 }}>No diaries yet</div>
        ) : (
          <div style={{ background:C.surface, border:`1.5px solid ${C.border}`,
            borderRadius:14, overflow:"hidden", boxShadow:"0 1px 3px rgba(12,25,52,.04)" }}>
            {[...list].sort((a,b)=>(b.diary_date||"").localeCompare(a.diary_date||"")).slice(0,8)
              .map((d,i,arr)=>{
                const lines=d.task_lines||[];
                const done=lines.filter(t=>t.status==="Completed").length;
                const ov=lines.filter(t=>t.due_date&&t.due_date<tod&&t.status!=="Completed").length;
                const actHrs=lines.reduce((s,t)=>s+(parseFloat(t.actual_time)||0),0);
                const expHrs=lines.reduce((s,t)=>s+(parseFloat(t.expected_time)||0),0);
                const pct=lines.length?Math.round((done/lines.length)*100):0;
                const bdg=STAT_BADGE[d.diary_status||"Draft"]||{bg:"#f1f5f9",color:"#475569"};
                return (
                  <div key={d.diary_id} style={{ display:"flex", alignItems:"center", gap:12,
                    padding:"11px 16px", borderBottom:i<arr.length-1?`1px solid ${C.bg}`:"none" }}>
                    <div style={{ textAlign:"center", width:36, flexShrink:0 }}>
                      <div style={{ fontFamily:FD, fontSize:15, fontWeight:800, color:C.t1, lineHeight:1 }}>
                        {d.diary_date?new Date(d.diary_date+"T00:00:00").getDate():"—"}
                      </div>
                      <div style={{ fontSize:9, color:C.t4, textTransform:"uppercase", fontFamily:FM }}>
                        {d.diary_date?new Date(d.diary_date+"T00:00:00").toLocaleDateString("en-IN",{month:"short"}):""}
                      </div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                        <span style={{ fontFamily:FM, fontSize:10, fontWeight:700, padding:"1px 7px",
                          borderRadius:4, background:bdg.bg, color:bdg.color }}>
                          {d.diary_status||"Draft"}
                        </span>
                        {ov>0&&<span style={{ fontSize:10,color:"#b91c1c",fontWeight:700,fontFamily:FM,
                          display:"flex",alignItems:"center",gap:3 }}>
                          <AlertTriangle size={9}/>{ov} overdue
                        </span>}
                      </div>
                      <div style={{ fontSize:11, color:C.t4, fontFamily:FM,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {lines.length} tasks · {done} done · {fmtHrs(actHrs)}h / {fmtHrs(expHrs)}h
                      </div>
                    </div>
                    <div style={{ width:52, flexShrink:0 }}>
                      <div style={{ height:4, background:C.bg, borderRadius:2, overflow:"hidden", marginBottom:3 }}>
                        <div style={{ height:"100%", borderRadius:2,
                          background:pct===100?"#22c55e":C.blue,
                          width:`${pct}%`, transition:"width .5s" }} />
                      </div>
                      <div style={{ fontSize:10, color:C.t4, textAlign:"right", fontFamily:FM }}>{pct}%</div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ReportScreen ─────────────────────────────────────────────────
export const ReportScreen = ({ list = [], employees = [] }) => {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
  const defaultTo   = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);

  const [from,        setFrom]        = useState(defaultFrom);
  const [to,          setTo]          = useState(defaultTo);
  const [activePreset,setActivePreset]= useState("month");
  const [empFilter,   setEmpFilter]   = useState("");
  const [deptFilter,  setDeptFilter]  = useState("");
  const [activeTab,   setActiveTab]   = useState("overview");

  const { data, meta, loading, error } = useReportData(from, to, empFilter, deptFilter);
  const tod = todayStr();
  const isAdmin = meta.is_admin;

  const handlePreset = k => {
    setActivePreset(k);
    const r = presetRange(k);
    setFrom(r.from); setTo(r.to);
  };

  // ── Computed metrics ──────────────────────────────────────────
  const tasks = useMemo(() => data.filter(r => r.line_id), [data]);

  const overview = useMemo(() => {
    const total     = tasks.length;
    const done      = tasks.filter(t=>t.status==="Completed").length;
    const inprog    = tasks.filter(t=>t.status==="In Progress").length;
    const pending   = tasks.filter(t=>t.status==="Pending"||t.status==="Open").length;
    const overdue   = tasks.filter(t=>t.due_date&&t.due_date<tod&&t.status!=="Completed"&&t.status!=="Cancelled").length;
    const expHrs    = tasks.reduce((s,t)=>s+(parseFloat(t.expected_time)||0),0);
    const actHrs    = tasks.reduce((s,t)=>s+(parseFloat(t.actual_time)||0),0);
    const rate      = total?Math.round((done/total)*100):0;
    const highCount = tasks.filter(t=>t.priority==="High").length;
    const highDone  = tasks.filter(t=>t.priority==="High"&&t.status==="Completed").length;
    const diaries   = [...new Set(data.map(r=>r.diary_id))].length;
    const timeEff   = expHrs>0?Math.round((actHrs/expHrs)*100):null;
    return { total, done, inprog, pending, overdue, expHrs, actHrs, rate, highCount, highDone, diaries, timeEff };
  }, [tasks, tod]);

  // Priority breakdown
  const prioBreak = useMemo(() => {
    const map = { High:{total:0,done:0}, Medium:{total:0,done:0}, Low:{total:0,done:0} };
    tasks.forEach(t=>{
      const p=t.priority||"Medium";
      if(map[p]){ map[p].total++; if(t.status==="Completed") map[p].done++; }
    });
    return Object.entries(map).map(([name,v])=>({name,...v,rate:v.total?Math.round((v.done/v.total)*100):0}));
  }, [tasks]);

  // Category breakdown
  const catBreak = useMemo(() => {
    const map = {};
    tasks.forEach(t=>{
      const c=t.category||"Other";
      if(!map[c]) map[c]={total:0,done:0,hrs:0};
      map[c].total++;
      if(t.status==="Completed") map[c].done++;
      map[c].hrs += parseFloat(t.actual_time)||0;
    });
    return Object.entries(map)
      .map(([name,v])=>({name,...v,rate:v.total?Math.round((v.done/v.total)*100):0}))
      .sort((a,b)=>b.total-a.total);
  }, [tasks]);

  // Employee breakdown
  const empBreak = useMemo(() => {
    const map = {};
    tasks.forEach(t=>{
      const id   = t.employee_id||"unknown";
      const name = t.employee_name||id;
      const dept = t.department||"—";
      if(!map[id]) map[id]={id,name,dept,total:0,done:0,overdue:0,inprog:0,expHrs:0,actHrs:0};
      map[id].total++;
      if(t.status==="Completed") map[id].done++;
      if(t.status==="In Progress") map[id].inprog++;
      if(t.due_date&&t.due_date<tod&&t.status!=="Completed"&&t.status!=="Cancelled") map[id].overdue++;
      map[id].expHrs += parseFloat(t.expected_time)||0;
      map[id].actHrs += parseFloat(t.actual_time)||0;
    });
    return Object.values(map)
      .map(e=>({...e,rate:e.total?Math.round((e.done/e.total)*100):0}))
      .sort((a,b)=>b.total-a.total);
  }, [tasks, tod]);

  // Department breakdown
  const deptBreak = useMemo(() => {
    const map = {};
    tasks.forEach(t=>{
      const d=t.department||"—";
      if(!map[d]) map[d]={name:d,total:0,done:0,overdue:0,expHrs:0,actHrs:0};
      map[d].total++;
      if(t.status==="Completed") map[d].done++;
      if(t.due_date&&t.due_date<tod&&t.status!=="Completed"&&t.status!=="Cancelled") map[d].overdue++;
      map[d].expHrs += parseFloat(t.expected_time)||0;
      map[d].actHrs += parseFloat(t.actual_time)||0;
    });
    return Object.values(map)
      .map(d=>({...d,rate:d.total?Math.round((d.done/d.total)*100):0}))
      .sort((a,b)=>b.total-a.total);
  }, [tasks, tod]);

  // Weekly trend
  const weeklyTrend = useMemo(() => {
    const weeks = [];
    const fromD = new Date(from); const toD = new Date(to);
    const diff  = Math.ceil((toD-fromD)/(7*86400000));
    const buckets = Math.min(diff+1, 12);
    for(let i=0;i<buckets;i++){
      const wS=new Date(fromD); wS.setDate(fromD.getDate()+i*7);
      const wE=new Date(wS);    wE.setDate(wS.getDate()+6);
      const wStr=wS.toISOString().slice(0,10); const wEStr=wE.toISOString().slice(0,10);
      const wT=tasks.filter(t=>t.diary_date>=wStr&&t.diary_date<=wEStr);
      weeks.push({
        label:wS.toLocaleDateString("en-IN",{day:"numeric",month:"short"}),
        total:wT.length, done:wT.filter(t=>t.status==="Completed").length,
      });
    }
    return weeks;
  }, [tasks, from, to]);

  const CAT_COLORS = ["#185FA5","#8b5cf6","#22c55e","#f59e0b","#ef4444","#0ea5e9","#14b8a6","#f43f5e"];
  const prioColors = { High:"#ef4444", Medium:"#f59e0b", Low:"#22c55e" };
  const TABS = [
    { k:"overview",  l:"Overview"   },
    { k:"team",      l:"Team",      adminOnly:true },
    { k:"dept",      l:"Departments",adminOnly:true },
    { k:"tasks",     l:"Task List"  },
  ];

  const sectionHead = label => (
    <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.8px", textTransform:"uppercase",
      color:C.t4, marginBottom:10 }}>{label}</div>
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:C.bg }}>

      {/* ── Top controls ── */}
      <div style={{ background:C.surface, borderBottom:`1.5px solid ${C.border}`,
        padding:"10px 16px", flexShrink:0 }}>

        {/* Date range */}
        <div style={{ marginBottom:10 }}>
          <DateRangePicker from={from} to={to} onFrom={v=>{setFrom(v);setActivePreset("");}}
            onTo={v=>{setTo(v);setActivePreset("");}} onPreset={handlePreset} activePreset={activePreset} />
        </div>

        {/* Filters row */}
        {isAdmin && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}
              style={{ fontFamily:F, fontSize:12, padding:"5px 10px", borderRadius:7,
                border:`1.5px solid ${C.border}`, color:C.t1, background:C.surface,
                cursor:"pointer", outline:"none" }}>
              <option value="">All Departments</option>
              {meta.departments.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
            <select value={empFilter} onChange={e=>setEmpFilter(e.target.value)}
              style={{ fontFamily:F, fontSize:12, padding:"5px 10px", borderRadius:7,
                border:`1.5px solid ${C.border}`, color:C.t1, background:C.surface,
                cursor:"pointer", outline:"none" }}>
              <option value="">All Employees</option>
              {meta.employees.map(e=><option key={e.employee_id} value={e.employee_id}>{e.employee_name}</option>)}
            </select>
            {(empFilter||deptFilter) && (
              <button onClick={()=>{setEmpFilter("");setDeptFilter("");}}
                style={{ ...btnSecondary, fontSize:12, padding:"5px 10px" }}>
                <X size={12}/> Clear filters
              </button>
            )}
          </div>
        )}

        {/* Tab strip */}
        <div style={{ display:"flex", gap:2, marginTop:10 }}>
          {TABS.filter(t=>!t.adminOnly||isAdmin).map(t=>(
            <button key={t.k} onClick={()=>setActiveTab(t.k)}
              style={{ padding:"6px 14px", borderRadius:7, border:"none", cursor:"pointer",
                fontFamily:F, fontSize:12, fontWeight:activeTab===t.k?700:500,
                background:activeTab===t.k?C.blueLight:"transparent",
                color:activeTab===t.k?C.blue:C.t3, transition:"all .13s" }}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 32px" }}>

        {loading && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0",
            flexDirection:"column", gap:12, color:C.t4, fontSize:13, fontFamily:F }}>
            <div style={{ width:32, height:32, border:`3px solid ${C.blueLight}`,
              borderTop:`3px solid ${C.blue}`, borderRadius:"50%", animation:"spin .8s linear infinite" }} />
            Loading report data…
          </div>
        )}

        {error && (
          <div style={{ padding:24, textAlign:"center", color:"#b91c1c", fontSize:13 }}>
            Failed to load: {error}
          </div>
        )}

        {!loading && !error && (

          // ── OVERVIEW TAB ──
          activeTab === "overview" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* KPI grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:10 }}>
                <KpiCard label="Total Tasks" value={overview.total}
                  sub={`${overview.diaries} diaries`} color={C.blue} bg={C.blueLight} Icon={ClipboardList} />
                <KpiCard label="Completion Rate" value={`${overview.rate}%`}
                  sub={`${overview.done} done`}
                  color={overview.rate>=80?"#15803d":overview.rate>=60?"#b45309":"#b91c1c"}
                  bg={overview.rate>=80?"#dcfce7":overview.rate>=60?"#fef3c7":"#fee2e2"} Icon={CheckCircle2} />
                <KpiCard label="In Progress" value={overview.inprog}
                  color="#0369a1" bg="#e0f2fe" Icon={RefreshCw} />
                <KpiCard label="Overdue" value={overview.overdue}
                  color="#b91c1c" bg="#fee2e2" Icon={AlertTriangle} />
                <KpiCard label="Hours Logged" value={`${fmtHrs(overview.actHrs)}h`}
                  sub={`of ${fmtHrs(overview.expHrs)}h planned`}
                  color="#b45309" bg="#fef3c7" Icon={Clock} />
                <KpiCard label="High Priority Done"
                  value={`${overview.highCount?Math.round((overview.highDone/overview.highCount)*100):0}%`}
                  sub={`${overview.highDone}/${overview.highCount} tasks`}
                  color="#ef4444" bg="#fee2e2" Icon={Flag} />
              </div>

              {/* Weekly trend */}
              <div style={{ background:C.surface, border:`1.5px solid ${C.border}`,
                borderRadius:14, padding:"16px 18px" }}>
                {sectionHead("Weekly Task Volume")}
                <WeeklyChart data={weeklyTrend} />
                <div style={{ display:"flex", gap:14, marginTop:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:C.t3 }}>
                    <div style={{ width:10,height:10,borderRadius:2,background:C.blue }} /> Completed
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:C.t3 }}>
                    <div style={{ width:10,height:10,borderRadius:2,background:C.bg,border:`1px solid ${C.border}` }} /> Other
                  </div>
                </div>
              </div>

              {/* Priority + Category side by side */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

                <div style={{ background:C.surface, border:`1.5px solid ${C.border}`,
                  borderRadius:14, padding:"16px 18px" }}>
                  {sectionHead("By Priority")}
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {prioBreak.map(p=>(
                      <div key={p.name}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:C.t2, fontFamily:F,
                            display:"flex", alignItems:"center", gap:6 }}>
                            <PDot color={prioColors[p.name]||C.t4} size={7} />{p.name}
                          </span>
                          <span style={{ fontSize:11, fontFamily:FM, fontWeight:700,
                            color:prioColors[p.name]||C.t4 }}>{p.rate}% · {p.done}/{p.total}</span>
                        </div>
                        <div style={{ height:5, background:C.bg, borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", borderRadius:3,
                            background:prioColors[p.name]||C.blue,
                            width:`${p.total?Math.round((p.done/p.total)*100):0}%`,
                            transition:"width .5s" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background:C.surface, border:`1.5px solid ${C.border}`,
                  borderRadius:14, padding:"16px 18px" }}>
                  {sectionHead("By Category")}
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {catBreak.slice(0,6).map((c,i)=>(
                      <MiniBar key={c.name} label={c.name}
                        value={c.done} max={catBreak[0]?.total||1}
                        color={CAT_COLORS[i%CAT_COLORS.length]}
                        sub={`${c.rate}%`} />
                    ))}
                    {catBreak.length===0 && <div style={{ fontSize:12, color:C.t4 }}>No data</div>}
                  </div>
                </div>
              </div>

              {/* Status funnel */}
              <div style={{ background:C.surface, border:`1.5px solid ${C.border}`,
                borderRadius:14, padding:"16px 18px" }}>
                {sectionHead("Status Distribution")}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {[
                    { s:"Pending",     label:"Pending"  },
                    { s:"In Progress", label:"Active"   },
                    { s:"Completed",   label:"Completed"},
                    { s:"Hold",        label:"On Hold"  },
                    { s:"Cancelled",   label:"Cancelled"},
                  ].map(({s,label})=>{
                    const cnt=tasks.filter(t=>t.status===s).length;
                    const pct=overview.total?Math.round((cnt/overview.total)*100):0;
                    const cfg=STAT_BADGE[s]||{bg:"#f1f5f9",color:"#475569"};
                    return (
                      <div key={s} style={{ flex:1, minWidth:100, background:cfg.bg, borderRadius:10,
                        padding:"12px 14px", textAlign:"center" }}>
                        <div style={{ fontFamily:FD, fontSize:22, fontWeight:800,
                          color:cfg.color, lineHeight:1 }}>{cnt}</div>
                        <div style={{ fontSize:10, color:cfg.color, fontWeight:600,
                          marginTop:3, fontFamily:FM }}>{pct}%</div>
                        <div style={{ fontSize:11, color:cfg.color, marginTop:2,
                          fontWeight:600, fontFamily:F }}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          // ── TEAM TAB ──
          ) : activeTab === "team" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Team KPIs */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:10 }}>
                <KpiCard label="Team Members" value={empBreak.length}
                  color={C.blue} bg={C.blueLight} Icon={ClipboardList} />
                <KpiCard label="Avg Completion" value={`${empBreak.length?Math.round(empBreak.reduce((s,e)=>s+e.rate,0)/empBreak.length):0}%`}
                  color="#15803d" bg="#dcfce7" Icon={CheckCircle2} />
                <KpiCard label="Total Overdue" value={empBreak.reduce((s,e)=>s+e.overdue,0)}
                  color="#b91c1c" bg="#fee2e2" Icon={AlertTriangle} />
                <KpiCard label="Total Hours" value={`${fmtHrs(empBreak.reduce((s,e)=>s+e.actHrs,0))}h`}
                  color="#b45309" bg="#fef3c7" Icon={Clock} />
              </div>

              {/* Workload distribution */}
              <div style={{ background:C.surface, border:`1.5px solid ${C.border}`,
                borderRadius:14, padding:"16px 18px" }}>
                {sectionHead("Workload Distribution")}
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {empBreak.map(e=>(
                    <div key={e.id} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <Avtar name={e.name} size={28} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:C.t1, fontFamily:F,
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                            maxWidth:140 }}>{e.name}</span>
                          <span style={{ fontSize:11, fontFamily:FM, fontWeight:700,
                            color:e.rate>=80?"#15803d":e.rate>=60?"#b45309":"#b91c1c",
                            flexShrink:0 }}>{e.rate}%</span>
                        </div>
                        <div style={{ height:6, background:C.bg, borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", borderRadius:3,
                            background:e.rate>=80?"#22c55e":e.rate>=60?"#f59e0b":"#ef4444",
                            width:`${e.rate}%`, transition:"width .5s" }} />
                        </div>
                        <div style={{ display:"flex", gap:10, marginTop:4 }}>
                          <span style={{ fontSize:10, color:C.t4, fontFamily:FM }}>{e.total} tasks</span>
                          <span style={{ fontSize:10, color:"#0369a1", fontFamily:FM }}>{e.inprog} active</span>
                          {e.overdue>0&&<span style={{ fontSize:10, color:"#b91c1c", fontFamily:FM }}>{e.overdue} overdue</span>}
                          <span style={{ fontSize:10, color:C.t4, fontFamily:FM, marginLeft:"auto" }}>{fmtHrs(e.actHrs)}h logged</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {empBreak.length===0 && <div style={{ fontSize:12, color:C.t4 }}>No team data for this period</div>}
                </div>
              </div>

              {/* Full employee table */}
              <div style={{ background:C.surface, border:`1.5px solid ${C.border}`,
                borderRadius:14, overflow:"hidden" }}>
                {sectionHead && <div style={{ padding:"14px 18px 0" }}>{sectionHead("Detailed Employee Report")}</div>}
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse", minWidth:560 }}>
                    <thead>
                      <tr style={{ background:C.bg, borderBottom:`1.5px solid ${C.border}` }}>
                        {["Employee","Dept","Tasks","Done","In Progress","Overdue","Rate","Exp Hrs","Act Hrs"].map(h=>(
                          <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:10,
                            fontWeight:700, color:C.t4, textTransform:"uppercase",
                            letterSpacing:"1.2px", fontFamily:FM, whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {empBreak.map(e=>(
                        <tr key={e.id} style={{ borderBottom:`1px solid ${C.bg}` }}
                          onMouseEnter={el=>el.currentTarget.style.background=C.bg}
                          onMouseLeave={el=>el.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"9px 12px", fontWeight:700, color:C.t1, fontFamily:FD }}>
                            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                              <Avtar name={e.name} size={22} />{e.name}
                            </div>
                          </td>
                          <td style={{ padding:"9px 12px", color:C.t3, fontFamily:FM, fontSize:11 }}>{e.dept}</td>
                          <td style={{ padding:"9px 12px", color:C.t3, fontFamily:FM }}>{e.total}</td>
                          <td style={{ padding:"9px 12px", color:"#15803d", fontFamily:FM, fontWeight:700 }}>{e.done}</td>
                          <td style={{ padding:"9px 12px", color:"#0369a1", fontFamily:FM }}>{e.inprog}</td>
                          <td style={{ padding:"9px 12px", fontFamily:FM }}>
                            {e.overdue>0
                              ? <span style={{ color:"#b91c1c", fontWeight:700 }}>{e.overdue}</span>
                              : <span style={{ color:C.t4 }}>0</span>}
                          </td>
                          <td style={{ padding:"9px 12px" }}>
                            <span style={{ fontFamily:FM, fontWeight:700,
                              color:e.rate>=80?"#15803d":e.rate>=60?"#b45309":"#b91c1c" }}>{e.rate}%</span>
                          </td>
                          <td style={{ padding:"9px 12px", color:C.t3, fontFamily:FM }}>{fmtHrs(e.expHrs)}h</td>
                          <td style={{ padding:"9px 12px", fontFamily:FM,
                            color:e.actHrs>e.expHrs&&e.expHrs>0?"#b91c1c":C.t3 }}>{fmtHrs(e.actHrs)}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          // ── DEPARTMENTS TAB ──
          ) : activeTab === "dept" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
                {deptBreak.map((d,i)=>{
                  const col=CAT_COLORS[i%CAT_COLORS.length];
                  return (
                    <div key={d.name} style={{ background:C.surface, border:`1.5px solid ${C.border}`,
                      borderRadius:14, padding:"16px 18px", borderTop:`3px solid ${col}` }}>
                      <div style={{ fontSize:13, fontWeight:700, color:C.t1, fontFamily:FD,
                        marginBottom:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {d.name}
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                        {[
                          { l:"Tasks",   v:d.total },
                          { l:"Done",    v:d.done  },
                          { l:"Overdue", v:d.overdue, red:d.overdue>0 },
                          { l:"Hours",   v:`${fmtHrs(d.actHrs)}h` },
                        ].map(({l,v,red})=>(
                          <div key={l}>
                            <div style={{ fontFamily:FD, fontSize:18, fontWeight:800,
                              color:red?"#b91c1c":C.t1, lineHeight:1 }}>{v}</div>
                            <div style={{ fontSize:10, color:C.t4, marginTop:2 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ height:5, background:C.bg, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", borderRadius:3, background:col,
                          width:`${d.rate}%`, transition:"width .6s" }} />
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                        <span style={{ fontSize:10, color:C.t4 }}>Completion</span>
                        <span style={{ fontSize:11, fontWeight:700, fontFamily:FM, color:col }}>{d.rate}%</span>
                      </div>
                    </div>
                  );
                })}
                {deptBreak.length===0 && (
                  <div style={{ fontSize:13, color:C.t4, padding:"32px 0", textAlign:"center",
                    gridColumn:"1/-1" }}>No department data for this period</div>
                )}
              </div>

              {/* Dept comparison table */}
              {deptBreak.length > 0 && (
                <div style={{ background:C.surface, border:`1.5px solid ${C.border}`,
                  borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}`,
                    fontSize:12, fontWeight:700, color:C.t1, fontFamily:FD }}>
                    Department Comparison
                  </div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse", minWidth:480 }}>
                      <thead>
                        <tr style={{ background:C.bg }}>
                          {["Department","Tasks","Done","Overdue","Completion","Exp Hrs","Act Hrs"].map(h=>(
                            <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:10,
                              fontWeight:700, color:C.t4, textTransform:"uppercase",
                              letterSpacing:"1.2px", fontFamily:FM }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {deptBreak.map((d,i)=>(
                          <tr key={d.name} style={{ borderBottom:`1px solid ${C.bg}` }}>
                            <td style={{ padding:"9px 12px", fontWeight:700, color:C.t1, fontFamily:F }}>
                              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                <div style={{ width:8, height:8, borderRadius:2,
                                  background:CAT_COLORS[i%CAT_COLORS.length], flexShrink:0 }} />
                                {d.name}
                              </div>
                            </td>
                            <td style={{ padding:"9px 12px", color:C.t3, fontFamily:FM }}>{d.total}</td>
                            <td style={{ padding:"9px 12px", color:"#15803d", fontFamily:FM, fontWeight:700 }}>{d.done}</td>
                            <td style={{ padding:"9px 12px", fontFamily:FM }}>
                              {d.overdue>0
                                ? <span style={{ color:"#b91c1c", fontWeight:700 }}>{d.overdue}</span>
                                : <span style={{ color:C.t4 }}>0</span>}
                            </td>
                            <td style={{ padding:"9px 12px" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ width:60, height:4, background:C.bg, borderRadius:2, overflow:"hidden" }}>
                                  <div style={{ height:"100%", background:CAT_COLORS[i%CAT_COLORS.length],
                                    width:`${d.rate}%` }} />
                                </div>
                                <span style={{ fontFamily:FM, fontWeight:700, fontSize:11,
                                  color:d.rate>=80?"#15803d":d.rate>=60?"#b45309":"#b91c1c" }}>{d.rate}%</span>
                              </div>
                            </td>
                            <td style={{ padding:"9px 12px", color:C.t3, fontFamily:FM }}>{fmtHrs(d.expHrs)}h</td>
                            <td style={{ padding:"9px 12px", fontFamily:FM,
                              color:d.actHrs>d.expHrs&&d.expHrs>0?"#b91c1c":C.t3 }}>{fmtHrs(d.actHrs)}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          // ── TASK LIST TAB ──
          ) : activeTab === "tasks" ? (
            <div>
              <div style={{ marginBottom:12, fontSize:12, color:C.t4, fontFamily:FM }}>
                {tasks.length} tasks · {from} to {to}
              </div>
              <div style={{ background:C.surface, border:`1.5px solid ${C.border}`,
                borderRadius:14, overflow:"hidden" }}>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse", minWidth:700 }}>
                    <thead>
                      <tr style={{ background:C.bg, borderBottom:`1.5px solid ${C.border}` }}>
                        {["Task","Employee","Priority","Status","Category","Due","Exp h","Act h"].map(h=>(
                          <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:10,
                            fontWeight:700, color:C.t4, textTransform:"uppercase",
                            letterSpacing:"1.2px", fontFamily:FM, whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.slice(0,100).map((t,i)=>{
                        const stCfg=STAT_BADGE[t.status]||{bg:"#f1f5f9",color:"#475569"};
                        const pc=PRIO_CFG[t.priority]||PRIO_CFG.Medium;
                        const isOver=t.due_date&&t.due_date<tod&&t.status!=="Completed";
                        return (
                          <tr key={t.line_id||i} style={{ borderBottom:`1px solid ${C.bg}` }}
                            onMouseEnter={el=>el.currentTarget.style.background=C.bg}
                            onMouseLeave={el=>el.currentTarget.style.background="transparent"}>
                            <td style={{ padding:"8px 12px", maxWidth:220 }}>
                              <div style={{ fontWeight:600, color:C.t1, fontFamily:F, fontSize:12,
                                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {t.work_plan||"—"}
                              </div>
                              {t.diary_date&&<div style={{ fontSize:10, color:C.t4, fontFamily:FM }}>{t.diary_date}</div>}
                            </td>
                            <td style={{ padding:"8px 12px", color:C.t3, fontFamily:F, fontSize:11,
                              whiteSpace:"nowrap" }}>{t.employee_name||"—"}</td>
                            <td style={{ padding:"8px 12px" }}>
                              <span style={{ display:"inline-flex", alignItems:"center", gap:4,
                                padding:"2px 7px", borderRadius:4, fontFamily:FM, fontSize:10,
                                fontWeight:700, background:pc.badge.bg, color:pc.badge.color }}>
                                <PDot color={pc.dot} size={5}/>{t.priority||"—"}
                              </span>
                            </td>
                            <td style={{ padding:"8px 12px" }}>
                              <span style={{ padding:"2px 7px", borderRadius:4, fontFamily:FM,
                                fontSize:10, fontWeight:700, background:stCfg.bg, color:stCfg.color }}>
                                {t.status}
                              </span>
                            </td>
                            <td style={{ padding:"8px 12px", color:C.t3, fontFamily:FM, fontSize:11 }}>
                              {t.category||"—"}
                            </td>
                            <td style={{ padding:"8px 12px", fontFamily:FM, fontSize:11,
                              color:isOver?"#b91c1c":C.t3, fontWeight:isOver?700:400 }}>
                              {t.due_date||"—"}
                            </td>
                            <td style={{ padding:"8px 12px", color:C.t3, fontFamily:FM }}>{fmtHrs(t.expected_time)}</td>
                            <td style={{ padding:"8px 12px", fontFamily:FM,
                              color:parseFloat(t.actual_time)>parseFloat(t.expected_time)&&parseFloat(t.expected_time)>0?"#b91c1c":C.t3 }}>
                              {fmtHrs(t.actual_time)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {tasks.length>100&&(
                  <div style={{ padding:"10px 16px", fontSize:12, color:C.t4, textAlign:"center",
                    borderTop:`1px solid ${C.border}`, fontFamily:FM }}>
                    Showing first 100 of {tasks.length} tasks — use filters to narrow results
                  </div>
                )}
              </div>
            </div>
          ) : null
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};
import { memo, useMemo, useState } from "react";

// ── ERP palette — soft, professional ──
const PALETTE = ["#3b6fd4", "#2f9e7e", "#c98a2e", "#c25a5a", "#7c6ac4", "#3d94a8", "#b8628f", "#7a9a3d"];
const TONE = { good: "#2f9e7e", warn: "#c98a2e", bad: "#c25a5a" };
const TONE_SOFT = { good: "#e8f5f0", warn: "#fdf4e6", bad: "#fbeded" };

const fmt = (n) => (n == null ? "—" : new Intl.NumberFormat("en-IN").format(n));

// ══════════════════════════════ CARD ══════════════════════════════
export function ChartCard({ title, subtitle, icon, right, footer, children, className = "" }) {
  return (
    <div className={`bg-white border border-[#dce6f7] rounded-[8px] flex flex-col
                     shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden ${className}`}>

      {/* header strip */}
      <div className="px-[12px] h-[30px] bg-[#eef3fb] border-b border-[#dce6f7]
                      flex items-center gap-[7px] shrink-0">
        {icon && (
          <span className="text-[11px] text-[#3b6fd4] flex items-center shrink-0">{icon}</span>
        )}
        <h3 className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#2f63c4]
                       leading-[14px] truncate flex-1 min-w-0">
          {title}
        </h3>
        {right}
      </div>

      {subtitle && (
        <p className="px-[14px] pt-[8px] text-[10px] text-[#94a3b8] leading-[13px] shrink-0">
          {subtitle}
        </p>
      )}

      <div className="px-[14px] pt-[10px] pb-[13px] flex-1 min-h-0">{children}</div>

      {footer && (
        <div className="px-[14px] py-[8px] bg-[#fafbfd] border-t border-[#f0f3f8] shrink-0">
          <p className="text-[9.5px] text-[#94a3b8] leading-[13px]">{footer}</p>
        </div>
      )}
    </div>
  );
}
// ══════════════════════════════ KPI ══════════════════════════════
export const KpiCard = memo(function KpiCard({ label, value, suffix, tone = "neutral", hint, icon }) {
  const color = TONE[tone] || "#3b6fd4";
  const soft = TONE_SOFT[tone] || "#f0f4fb";
  return (
    <div className="bg-white border border-[#e3e8f0] rounded-[8px] px-[13px] py-[11px]
                    shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex items-center gap-3 min-w-0
                    hover:border-[#cfd9ea] transition-colors">
      {icon && (
        <div className="w-[34px] h-[34px] rounded-[7px] flex items-center justify-center shrink-0"
             style={{ background: soft }}>
          <span className="text-[14px]" style={{ color }}>{icon}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.5px] text-[#94a3b8] truncate">
          {label}
        </div>
        <div className="flex items-baseline gap-[3px] mt-[1px]">
          <span className="text-[21px] font-bold leading-[24px] tracking-[-0.4px]" style={{ color }}>
            {value == null ? "—" : fmt(value)}
          </span>
          {suffix && value != null && (
            <span className="text-[11.5px] font-semibold" style={{ color }}>{suffix}</span>
          )}
        </div>
        {hint && <div className="text-[9.5px] text-[#94a3b8] leading-[12px] truncate">{hint}</div>}
      </div>
    </div>
  );
});

// ═══════════════════════ LINE / AREA CHART ═══════════════════════
export const TrendChart = memo(function TrendChart({ data = [], series = [], height = 200 }) {
  const [hover, setHover] = useState(null);

  const W = 680, H = height, PAD = { t: 16, r: 14, b: 30, l: 38 };
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;

  const { step, top } = useMemo(() => {
    const vals = data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0));
    const max = Math.max(1, ...vals);
    const st = Math.max(1, Math.ceil(max / 4));
    return { step: st, top: st * 4 };
  }, [data, series]);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-1" style={{ height }}>
        <span className="text-[24px] opacity-20">📉</span>
        <span className="text-[11px] text-[#94a3b8]">No records in this period</span>
      </div>
    );
  }

  const x = (i) => PAD.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => PAD.t + ih - (v / top) * ih;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color || PALETTE[si]} stopOpacity="0.20" />
              <stop offset="100%" stopColor={s.color || PALETTE[si]} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>

        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(step * i)} y2={y(step * i)}
                  stroke="#f0f3f8" strokeWidth="1" />
            <text x={PAD.l - 7} y={y(step * i) + 3.5} textAnchor="end" fontSize="9.5" fill="#a8b4c8">
              {step * i}
            </text>
          </g>
        ))}

        {hover != null && (
          <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih}
                stroke="#cfd9ea" strokeWidth="1" strokeDasharray="3 3" />
        )}

        {series.map((s, si) => {
          const col = s.color || PALETTE[si];
          const pts = data.map((d, i) => [x(i), y(Number(d[s.key]) || 0)]);
          const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
          const area = `${line} L${pts[pts.length - 1][0]},${y(0)} L${pts[0][0]},${y(0)} Z`;
          return (
            <g key={s.key}>
              <path d={area} fill={`url(#grad-${s.key})`} />
              <path d={line} fill="none" stroke={col} strokeWidth="2.2"
                    strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 5 : 3.2}
                        fill="#fff" stroke={col} strokeWidth="2.2"
                        style={{ transition: "r .12s" }} />
              ))}
            </g>
          );
        })}

        {data.map((d, i) => (
          <rect key={i} x={x(i) - iw / (data.length * 2 || 1)} y={PAD.t}
                width={iw / (data.length || 1)} height={ih} fill="transparent"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}

        {data.map((d, i) => {
          const every = Math.ceil(data.length / 8);
          if (i % every !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={x(i)} y={H - 9} textAnchor="middle" fontSize="9.5" fill="#a8b4c8">
              {String(d.ym || "").slice(2)}
            </text>
          );
        })}
      </svg>

      {hover != null && (
        <div className="absolute top-2 right-2 bg-white border border-[#e3e8f0] rounded-[6px]
                        shadow-[0_3px_10px_rgba(15,23,42,0.10)] px-2.5 py-1.5 pointer-events-none z-10">
          <div className="text-[10px] font-bold text-[#1e293b] mb-1">{data[hover].ym}</div>
          {series.map((s, si) => (
            <div key={s.key} className="flex items-center gap-2 min-w-[110px]">
              <span className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: s.color || PALETTE[si] }} />
              <span className="text-[9.5px] text-[#64748b] flex-1">{s.label}</span>
              <span className="text-[10.5px] font-bold text-[#1e293b]">{data[hover][s.key] || 0}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-5 mt-1.5">
        {series.map((s, si) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="w-[11px] h-[3px] rounded-full" style={{ background: s.color || PALETTE[si] }} />
            <span className="text-[10px] text-[#64748b] font-medium">{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
});

// ══════════════════════════ DONUT ══════════════════════════
export const DonutChart = memo(function DonutChart({ data = [], centerLabel = "Records" }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((a, d) => a + (Number(d.count) || 0), 0);

  if (!total) {
    return (
      <div className="h-[160px] flex flex-col items-center justify-center gap-1">
        <span className="text-[24px] opacity-20">🍩</span>
        <span className="text-[11px] text-[#94a3b8]">No data</span>
      </div>
    );
  }

  const R = 56, SW = 20, C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0 w-[150px] h-[150px]">
        <svg viewBox="0 0 150 150" className="w-full h-full -rotate-90">
          {data.map((d, i) => {
            const frac = (Number(d.count) || 0) / total;
            const dash = frac * C;
            const el = (
              <circle key={i} cx="75" cy="75" r={R} fill="none"
                      stroke={PALETTE[i % PALETTE.length]}
                      strokeWidth={hover === i ? SW + 4 : SW}
                      strokeDasharray={`${dash} ${C - dash}`}
                      strokeDashoffset={-acc * C}
                      opacity={hover == null || hover === i ? 1 : 0.35}
                      onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                      style={{ transition: "stroke-width .15s, opacity .15s", cursor: "pointer" }} />
            );
            acc += frac;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[20px] font-bold text-[#1e293b] leading-[22px] tracking-[-0.4px]">
            {hover != null ? data[hover].count : total}
          </span>
          <span className="text-[8.5px] text-[#94a3b8] uppercase tracking-[0.4px] max-w-[74px] text-center leading-[10px]">
            {hover != null ? data[hover].label : centerLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-[4px] min-w-0 flex-1 max-h-[150px] overflow-y-auto scrollbar-hide">
        {data.map((d, i) => (
          <div key={i}
               onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
               className={`flex items-center gap-2 px-1.5 py-[3px] rounded-[4px] cursor-default transition-colors ${
                 hover === i ? "bg-[#f4f7fc]" : ""}`}>
            <span className="w-[8px] h-[8px] rounded-full shrink-0"
                  style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="text-[10.5px] text-[#475569] truncate flex-1" title={d.label}>{d.label}</span>
            <span className="text-[10.5px] font-bold text-[#1e293b]">{d.count}</span>
            <span className="text-[9.5px] text-[#a8b4c8] w-[30px] text-right">
              {Math.round((d.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ═══════════════════════ HORIZONTAL BARS ═══════════════════════
export const BarList = memo(function BarList({ data = [], useTone = false, emptyText = "No data", labelWidth = 96 }) {
  const max = Math.max(1, ...data.map((d) => Number(d.count) || 0));
  const total = data.reduce((a, d) => a + (Number(d.count) || 0), 0);

  if (!data.length || !total) {
    return (
      <div className="h-[130px] flex flex-col items-center justify-center gap-1">
        <span className="text-[22px] opacity-20">📊</span>
        <span className="text-[11px] text-[#94a3b8]">{emptyText}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[8px]">
      {data.map((d, i) => {
        const color = useTone ? (TONE[d.tone] || PALETTE[0]) : PALETTE[i % PALETTE.length];
        const pct = ((Number(d.count) || 0) / max) * 100;
        const share = Math.round(((Number(d.count) || 0) / total) * 100);
        return (
          <div key={i} className="group flex items-center gap-2.5">
            <span className="text-[10.5px] text-[#475569] shrink-0 truncate text-right font-medium"
                  style={{ width: labelWidth }} title={d.label}>
              {d.label}
            </span>
            <div className="flex-1 h-[18px] bg-[#f4f7fc] rounded-[4px] overflow-hidden relative">
              <div className="h-full rounded-[4px] transition-all duration-700 ease-out
                              group-hover:brightness-95"
                   style={{ width: `${pct}%`, background: color, minWidth: d.count ? 4 : 0 }} />
              {share >= 12 && (
                <span className="absolute inset-y-0 left-2 flex items-center text-[9px] font-bold text-white/90">
                  {share}%
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold text-[#1e293b] w-[28px] text-right">{d.count}</span>
          </div>
        );
      })}
    </div>
  );
});

// ═══════════════════════ SEGMENTED PROGRESS ═══════════════════════
export const SegmentBar = memo(function SegmentBar({ data = [] }) {
  const total = data.reduce((a, d) => a + (Number(d.count) || 0), 0);
  if (!total) return null;
  return (
    <div>
      <div className="flex h-[9px] rounded-full overflow-hidden bg-[#f4f7fc]">
        {data.map((d, i) => {
          const w = ((Number(d.count) || 0) / total) * 100;
          if (!w) return null;
          return (
            <div key={i} title={`${d.label}: ${d.count}`}
                 style={{ width: `${w}%`, background: TONE[d.tone] || PALETTE[i % PALETTE.length] }} />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3.5 gap-y-1 mt-2">
        {data.map((d, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="w-[7px] h-[7px] rounded-full"
                  style={{ background: TONE[d.tone] || PALETTE[i % PALETTE.length] }} />
            <span className="text-[9.5px] text-[#64748b]">{d.label}</span>
            <span className="text-[9.5px] font-bold text-[#1e293b]">{d.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
});
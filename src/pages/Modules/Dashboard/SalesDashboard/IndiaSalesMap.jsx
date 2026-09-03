import { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import * as d3 from "d3-geo";
import { by, inrS } from "../../../../utils/helpers";
import { CITY_COORDS } from "./indiaCityCoords";

const GEO_URLS = [
  "https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main/geojson/india.geojson",
  "https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/india.geojson",
  "https://cdn.jsdelivr.net/gh/geohacker/india@master/state/india_telengana.geojson",
];

let geoCache = null;
let geoPromise = null;
function loadGeo() {
  if (geoCache) return Promise.resolve(geoCache);
  if (!geoPromise) {
    geoPromise = (async () => {
      for (const url of GEO_URLS) {
        try {
          const r = await fetch(url);
          if (!r.ok) continue;
          const j = await r.json();
          if (j?.features?.length >= 25) {
            geoCache = j;
            return j;
          }
        } catch {
          // try next source
        }
      }
      throw new Error("No India geojson source responded");
    })();
  }
  return geoPromise;
}

const normalize = (s) => (s || "").toUpperCase().replace(/[^A-Z]/g, "");
const featName = (f) => {
  const p = f.properties || {};
  return p.ST_NM || p.st_nm || p.NAME_1 || p.name || p.NAME || p.State_Name || "";
};

function bandColor(v, max) {
  if (v <= 0) return "#e9edf5";
  const p = v / max;
  if (p >= 0.55) return "#15803d";
  if (p >= 0.25) return "#4ade80";
  if (p >= 0.08) return "#f59e0b";
  return "#ef4444";
}

const StatePaths = memo(function StatePaths({
  statePaths, stateSales, maxState, activeState, lowestStateNorm, onHover, onLeave, onClick,
}) {
  return statePaths.map((sp, i) => {
    const active = activeState === sp.name;
    const isLowest = normalize(sp.name) === lowestStateNorm;
    const v = stateSales[normalize(sp.name)] || 0;
    return (
      <path
        key={i}
        d={sp.d}
        fill={bandColor(v, maxState)}
        stroke={active ? "#312e81" : isLowest ? "#dc2626" : "#ffffff"}
        strokeWidth={active ? 1.8 : isLowest ? 1.8 : 0.6}
        style={{
          cursor: "pointer",
          transition: "filter 0.15s, fill 0.15s",
          filter: active ? "drop-shadow(0 0 4px rgba(49,46,129,0.45))" : undefined,
          animation: isLowest ? "fd-map-blink 1.3s ease-in-out infinite" : undefined,
        }}
        onClick={() => onClick(sp.name)}
        onMouseMove={(e) => onHover(e, sp.name, v, isLowest)}
        onMouseLeave={onLeave}
      />
    );
  });
});

const CityBubbles = memo(function CityBubbles({
  citySales, maxCity, projection, onHover, onLeave, onClick,
}) {
  return Object.entries(citySales).map(([city, amt]) => {
    const coord = CITY_COORDS[city?.toUpperCase()];
    if (!coord) return null;
    const [x, y] = projection([coord.lng, coord.lat]) || [];
    if (x == null) return null;
    const r = 3 + Math.sqrt(amt / maxCity) * 10;
    return (
      <circle
        key={city}
        cx={x} cy={y} r={r}
        fill="rgba(99,102,241,0.65)"
        stroke="#4338ca"
        strokeWidth={1}
        style={{ cursor: "pointer" }}
        onClick={() => onClick(city)}
        onMouseMove={(e) => onHover(e, city, amt, false)}
        onMouseLeave={onLeave}
      />
    );
  });
});

export default function IndiaSalesMap({ rows, filters, setFilters, height = 380 }) {
  const [geo, setGeo] = useState(geoCache);
  const [geoError, setGeoError] = useState(false);
  const [hover, setHover] = useState(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(560);
  const resizeTimerRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (geoCache) return;
    let cancelled = false;
    setGeoError(false);
    loadGeo()
      .then((j) => !cancelled && setGeo(j))
      .catch(() => !cancelled && setGeoError(true));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => setWidth(w), 120);
    });
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const stateSales = useMemo(() => by(rows, (r) => normalize(r.state), (r) => r.amt), [rows]);
  const citySales  = useMemo(() => by(rows, (r) => r.city, (r) => r.amt), [rows]);
  const maxState = useMemo(() => Math.max(1, ...Object.values(stateSales)), [stateSales]);
  const maxCity  = useMemo(() => Math.max(1, ...Object.values(citySales)), [citySales]);

  const lowestStateNorm = useMemo(() => {
    const entries = Object.entries(stateSales).filter(([, v]) => v > 0);
    if (!entries.length) return null;
    return entries.sort((a, b) => a[1] - b[1])[0][0];
  }, [stateSales]);

  const projection = useMemo(
    () => d3.geoMercator().center([82.8, 22.6]).scale(width * 1.35).translate([width / 2, height / 2]),
    [width, height]
  );
  const pathGen = useMemo(() => d3.geoPath(projection), [projection]);

  const statePaths = useMemo(() => {
    if (!geo) return [];
    return geo.features.map((f) => ({ name: featName(f), d: pathGen(f) })).filter((sp) => sp.name && sp.d);
  }, [geo, pathGen]);

  const handleHover = useCallback((e, name, amt, isLowest) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (rafRef.current) return; // ek pending frame se zyada mat queue karo
    rafRef.current = requestAnimationFrame(() => {
      setHover({ name, x, y, amt, lowest: isLowest });
      rafRef.current = null;
    });
  }, []);

  const handleLeave = useCallback(() => setHover(null), []);

  const handleStateClick = useCallback((name) => {
    setFilters((prev) => ({ ...prev, state: prev.state === name ? "" : name, city: "" }));
  }, [setFilters]);

  const handleCityClick = useCallback((city) => {
    setFilters((prev) => ({ ...prev, city: prev.city === city ? "" : city }));
  }, [setFilters]);

  const retry = () => {
    geoCache = null;
    geoPromise = null;
    setGeoError(false);
    setGeo(null);
    loadGeo().then(setGeo).catch(() => setGeoError(true));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md lg:col-span-1">
      {/* blink keyframe — scoped here since this is the only place that uses it */}
      <style>{`
        @keyframes fd-map-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            🗺️
          </span>
          <h4 className="text-[13px] font-bold tracking-tight text-slate-700">Sales by Region</h4>
        </div>
        {filters.state && (
          <button
            onClick={() => setFilters((f) => ({ ...f, state: "", city: "" }))}
            className="text-[11px] font-semibold text-indigo-600 hover:underline"
          >
            Clear map filter
          </button>
        )}
      </div>

      <div ref={containerRef} className="relative w-full" style={{ height }}>
        {geoError && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-xs text-slate-400">
            <span>Map data couldn't load. Everything else on the dashboard still works.</span>
            <button onClick={retry} className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-indigo-600 hover:bg-indigo-50">
              Retry
            </button>
          </div>
        )}
        {!geoError && !geo && (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">Loading map…</div>
        )}
        {geo && (
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
            <StatePaths
              statePaths={statePaths}
              stateSales={stateSales}
              maxState={maxState}
              activeState={filters.state}
              lowestStateNorm={lowestStateNorm}
              onHover={handleHover}
              onLeave={handleLeave}
              onClick={handleStateClick}
            />
            <CityBubbles
              citySales={citySales}
              maxCity={maxCity}
              projection={projection}
              onHover={handleHover}
              onLeave={handleLeave}
              onClick={handleCityClick}
            />
          </svg>
        )}

        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg"
            style={{ left: hover.x + 12, top: hover.y + 12 }}
          >
            {hover.name}{hover.lowest ? " 🔻 lowest" : ""}: {inrS(hover.amt)}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[10.5px] font-semibold text-slate-500">
        <LegendDot color="#15803d" label="High" />
        <LegendDot color="#4ade80" label="Medium" />
        <LegendDot color="#f59e0b" label="Low" />
        <LegendDot color="#ef4444" label="Very Low" />
        <LegendDot color="#ef4444" label="Lowest (blinking)" blink />
        <LegendDot color="#e9edf5" label="No Orders" />
        <LegendDot color="#6366f1" label="City (bubble size = value)" round />
      </div>
    </div>
  );
}

function LegendDot({ color, label, blink, round }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={round ? "h-2.5 w-2.5 rounded-full" : "h-2.5 w-2.5 rounded-[3px]"}
        style={{ background: color, animation: blink ? "fd-map-blink 1.3s ease-in-out infinite" : undefined }}
      />
      {label}
    </span>
  );
}
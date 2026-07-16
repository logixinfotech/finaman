import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3-geo";
import { by, inrS } from "../../../../utils/helpers";
import { CITY_COORDS } from "./indiaCityCoords"; 
const GEOJSON_URL = "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson";
 
let geoCache = null;
let geoPromise = null;
function loadGeo() {
  if (geoCache) return Promise.resolve(geoCache);
  if (!geoPromise) {
    geoPromise = fetch(GEOJSON_URL)
      .then((r) => r.json())
      .then((j) => { geoCache = j; return j; });
  }
  return geoPromise;
}

const normalize = (s) => (s || "").toUpperCase().replace(/[^A-Z]/g, "");

export default function IndiaSalesMap({ rows, filters, setFilters, height = 380 }) {
  const [geo, setGeo] = useState(geoCache);
  const [geoError, setGeoError] = useState(false);
  const [hover, setHover] = useState(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(560);
  const resizeTimerRef = useRef(null);

  useEffect(() => {
    if (geoCache) return; // already have it, skip fetch entirely
    let cancelled = false;
    loadGeo()
      .then((j) => !cancelled && setGeo(j))
      .catch(() => !cancelled && setGeoError(true));
    return () => { cancelled = true; };
  }, []);

  // Debounced resize — without this, dragging/maximizing a window or any
  // layout shift fires dozens of resize events, each one recomputing every
  // state path + city bubble position. 120ms debounce keeps it to ~1 recompute.
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

  const stateSales = useMemo(() => by(rows, (r) => normalize(r.state), (r) => r.amt), [rows]);
  const citySales  = useMemo(() => by(rows, (r) => r.city, (r) => r.amt), [rows]);
  const maxState = Math.max(1, ...Object.values(stateSales));
  const maxCity  = Math.max(1, ...Object.values(citySales));

  const lowestStateNorm = useMemo(() => {
    const entries = Object.entries(stateSales).filter(([, v]) => v > 0);
    if (!entries.length) return null;
    return entries.sort((a, b) => a[1] - b[1])[0][0]; // already normalized key
  }, [stateSales]);

  const projection = useMemo(
    () => d3.geoMercator().center([82.8, 22.6]).scale(width * 1.35).translate([width / 2, height / 2]),
    [width, height]
  );
  const pathGen = useMemo(() => d3.geoPath(projection), [projection]);

  // Precompute every state's path string ONCE per geo/projection change,
  // instead of recomputing it inline on every render (React was recalculating
  // pathGen(f) for all ~30 states on every single re-render before).
  const statePaths = useMemo(() => {
    if (!geo) return [];
    return geo.features.map((f) => ({
      name: f.properties.NAME_1 || f.properties.st_nm || f.properties.name,
      d: pathGen(f),
    }));
  }, [geo, pathGen]);

  const colorFor = (name) => {
    const v = stateSales[normalize(name)] || 0;
    if (v <= 0) return "#eef2f7";
    const t = Math.sqrt(v / maxState);
    const stops = ["#dbeafe", "#93c5fd", "#4f46e5", "#3730a3"];
    const idx = Math.min(stops.length - 1, Math.floor(t * stops.length));
    return stops[idx];
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Sales by Region</h4>
        {filters.state && (
          <button onClick={() => setFilters((f) => ({ ...f, state: "", city: "" }))} className="text-[11px] font-semibold text-indigo-600 hover:underline">
            Clear map filter
          </button>
        )}
      </div>

      <div ref={containerRef} className="relative w-full" style={{ height }}>
        {geoError && (
          <div className="flex h-full items-center justify-center text-center text-xs text-slate-400 px-6">
            Map data couldn't load. Everything else on the dashboard still works.
          </div>
        )}
        {!geoError && !geo && (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">Loading map…</div>
        )}
        {geo && (
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
            {statePaths.map((sp, i) => {
              const active = filters.state === sp.name;
              const isLowest = normalize(sp.name) === lowestStateNorm;
              return (
                <path
                  key={i}
                  d={sp.d}
                  fill={colorFor(sp.name)}
                  stroke={active ? "#312e81" : isLowest ? "#ef4444" : "#ffffff"}
                  strokeWidth={active ? 1.6 : isLowest ? 1.8 : 0.6}
                  style={{
                    cursor: "pointer",
                    transition: "fill 0.15s",
                    animation: isLowest ? "fd-map-blink 1.4s ease-in-out infinite" : undefined,
                  }}
                  onClick={() => setFilters((prev) => ({ ...prev, state: prev.state === sp.name ? "" : sp.name, city: "" }))}
                  onMouseMove={(e) => {
                    const rect = containerRef.current.getBoundingClientRect();
                    setHover({ name: sp.name, x: e.clientX - rect.left, y: e.clientY - rect.top, amt: stateSales[normalize(sp.name)] || 0 });
                  }}
                  onMouseLeave={() => setHover(null)}
                />
              );
            })}

            {Object.entries(citySales).map(([city, amt]) => {
              const coord = CITY_COORDS[city?.toUpperCase()];
              if (!coord) return null;
              const [x, y] = projection([coord.lng, coord.lat]) || [];
              if (x == null) return null;
              const r = 3 + Math.sqrt(amt / maxCity) * 10;
              return (
                <circle
                  key={city}
                  cx={x} cy={y} r={r}
                  fill="rgba(239,68,68,0.55)"
                  stroke="#ef4444"
                  strokeWidth={1}
                  style={{ cursor: "pointer" }}
                  onClick={() => setFilters((prev) => ({ ...prev, city: prev.city === city ? "" : city }))}
                  onMouseMove={(e) => {
                    const rect = containerRef.current.getBoundingClientRect();
                    setHover({ name: city, x: e.clientX - rect.left, y: e.clientY - rect.top, amt });
                  }}
                  onMouseLeave={() => setHover(null)}
                />
              );
            })}
          </svg>
        )}

        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg"
            style={{ left: hover.x + 12, top: hover.y + 12 }}
          >
            {hover.name}: {inrS(hover.amt)}
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] text-slate-400">Click a state or city bubble to filter. Bubble size = sales volume.</p>
    </div>
  );
}

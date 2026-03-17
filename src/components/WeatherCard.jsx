import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import AnimatedNumber from "./ui/AnimatedNumber";
import {
  bentgrassStressIndex, dollarSpotRisk, brownPatchRisk,
  couchDormancyStatus, growthPotential,
} from "../services/greenkeeperService";

// ── Mini circular arc gauge ────────────────────────────────────────────────────

function MiniArc({ value, max, color, label, unit, size = 70, delay = 0 }) {
  const sw   = 5;
  const r    = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(1, Math.max(0, (value ?? 0) / max));
  const cx   = size / 2;
  const cy   = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        {/* Animated fill */}
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94], delay }}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 5px ${color}99)` }}
        />
        {/* Value */}
        <text x={cx} y={cy + 5} textAnchor="middle"
          fontSize={size * 0.215} fontWeight="700" fill="white"
          fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">
          {value ?? "—"}
        </text>
      </svg>
      <div className="text-center leading-none">
        <p style={{ fontSize: "10px", color, fontWeight: 600 }}>{label}</p>
        <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.28)" }}>{unit}</p>
      </div>
    </div>
  );
}

// ── Half-arc growth potential gauge ───────────────────────────────────────────

function HalfArc({ value, color, label, sublabel, delay = 0 }) {
  const W  = 94, H = 58, sw = 6;
  const r  = (W - sw * 2) / 2;
  const cx = W / 2, cy = H - 6;
  const halfCirc = Math.PI * r;
  const safeVal  = Math.min(100, Math.max(0, value ?? 0));
  const offset   = halfCirc * (1 - safeVal / 100);

  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        {/* Track */}
        <path d={`M ${sw} ${cy} A ${r} ${r} 0 0 1 ${W - sw} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth={sw} strokeLinecap="round" />
        {/* Animated fill */}
        <motion.path
          d={`M ${sw} ${cy} A ${r} ${r} 0 0 1 ${W - sw} ${cy}`}
          fill="none" stroke={color}
          strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={halfCirc}
          initial={{ strokeDashoffset: halfCirc }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94], delay }}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
        {/* Value */}
        <text x={cx} y={cy - 7} textAnchor="middle"
          fontSize="14" fontWeight="800" fill={color}
          fontFamily="-apple-system, BlinkMacSystemFont, sans-serif">
          {safeVal}%
        </text>
      </svg>
      <p style={{ fontSize: "10px", fontWeight: 600, color, marginTop: "-3px" }}>{label}</p>
      <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{sublabel}</p>
    </div>
  );
}

// ── Risk tile ──────────────────────────────────────────────────────────────────

function RiskTile({ label, level }) {
  const cfg =
    level === "High"     ? { bg: "rgba(239,68,68,0.14)",   color: "#fca5a5", border: "rgba(239,68,68,0.28)",   symbol: "▲" } :
    level === "Moderate" ? { bg: "rgba(251,191,36,0.12)",  color: "#fcd34d", border: "rgba(251,191,36,0.25)",  symbol: "◆" } :
                           { bg: "rgba(52,211,153,0.09)",  color: "#6ee7b7", border: "rgba(52,211,153,0.2)",   symbol: "●" };
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 px-1"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <span style={{ fontSize: "13px", color: cfg.color, lineHeight: 1 }}>{cfg.symbol}</span>
      <span style={{ fontSize: "11px", fontWeight: 700, color: cfg.color }}>{level}</span>
      <span style={{ fontSize: "8.5px", color: "rgba(255,255,255,0.38)", textAlign: "center", lineHeight: 1.25 }}>
        {label}
      </span>
    </div>
  );
}

// ── Forecast weather icons (SVG) ───────────────────────────────────────────────

function SunIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" fill="#fbbf24" />
      {[0,45,90,135,180,225,270,315].map(a => {
        const rad = a * Math.PI / 180;
        return (
          <line key={a}
            x1={12 + 7 * Math.cos(rad)} y1={12 + 7 * Math.sin(rad)}
            x2={12 + 9.5 * Math.cos(rad)} y2={12 + 9.5 * Math.sin(rad)}
            stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

function CloudIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M6.5 19a4.5 4.5 0 01-.5-8.95A6 6 0 0117.8 10l.2.01A4 4 0 0118 18H6.5z"
        fill="#94a3b8" opacity="0.85" />
    </svg>
  );
}

function RainIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6.5 15a4.5 4.5 0 01-.5-8.95A6 6 0 0117.8 6l.2.01A4 4 0 0118 14H6.5z"
        fill="#60a5fa" opacity="0.75" />
      <line x1="8"  y1="18" x2="7"  y2="21" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="18" x2="11" y2="21" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="18" x2="15" y2="21" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const FORECAST_ICONS = { sun: SunIcon, cloud: CloudIcon, rain: RainIcon };

// ── Tooltip ────────────────────────────────────────────────────────────────────

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}{p.unit ?? ""}
        </p>
      ))}
    </div>
  );
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc)" }} />
      <div className="p-5 flex flex-col gap-4">
        <div className="shimmer-block h-4 w-32" />
        <div className="shimmer-block h-16 w-44" />
        <div className="grid grid-cols-4 gap-2">
          {[0,1,2,3].map(i => <div key={i} className="shimmer-block h-20 rounded-xl" />)}
        </div>
        <div className="shimmer-block h-12 rounded-xl" />
        <div className="shimmer-block h-14 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function WeatherCard({ data, loading, disease }) {
  if (loading || !data) return <Skeleton />;

  const temp = data.temperature ?? 0;
  const hum  = data.humidity    ?? 0;

  const bsi      = bentgrassStressIndex(temp, hum);
  const dsModel  = disease?.models?.find(m => m.key === "dollarSpot");
  const bpModel  = disease?.models?.find(m => m.key === "brownPatch");
  const dsr      = dsModel?.risk ?? dollarSpotRisk(temp, hum);
  const bpr      = bpModel?.risk ?? brownPatchRisk(temp, hum);
  const soilEst  = temp - 2;
  const dormancy = couchDormancyStatus(soilEst);
  const gp       = growthPotential(temp);

  const tempGradient =
    temp > 28 ? "linear-gradient(135deg, #f97316 0%, #fbbf24 100%)" :
    temp < 10 ? "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)" :
    temp < 15 ? "linear-gradient(135deg, #34d399 0%, #60a5fa 100%)" :
                "linear-gradient(135deg, #34d399 0%, #a3e635 100%)";

  const gpColor    = v => v >= 75 ? "#34d399" : v >= 40 ? "#fbbf24" : "#f87171";
  const bsiLevel   = bsi < 30 ? "Low" : bsi < 60 ? "Moderate" : "High";
  const dormLevel  = dormancy.color === "green" ? "Low" : dormancy.color === "yellow" ? "Moderate" : "High";

  // Temp window needle
  const SCALE_MAX = 40;
  const needlePos = Math.min(100, Math.max(0, (temp / SCALE_MAX) * 100));
  const needleCol =
    soilEst > 25 ? "#f87171" : soilEst > 20 ? "#fbbf24" :
    temp >= 15   ? "#34d399" : temp < 5      ? "#a78bfa" : "#fbbf24";
  const needleLabel =
    soilEst > 25 ? "Root stress" : soilEst > 20 ? "Root growth ↓" :
    temp >= 15   ? "Optimal"     : temp < 5      ? "Dormancy risk" : "Sub-optimal";

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-[3px] w-full"
        style={{ background: "linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc)" }} />

      <div className="p-5 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">Weather Station</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{data.stationName}</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", color: "#7dd3fc" }}>
            {data.conditions}
          </span>
        </div>

        {/* Temp hero + 4 mini arc gauges */}
        <div className="flex items-center justify-between gap-3">

          {/* Temperature */}
          <div className="flex flex-col">
            <div className="flex items-end">
              <AnimatedNumber value={temp} decimals={1} className="stat-num font-black leading-none"
                style={{
                  fontSize: "clamp(2.6rem, 6vw, 3.8rem)",
                  background: tempGradient,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}
              />
              <span className="font-black text-2xl mb-1"
                style={{ background: tempGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                °C
              </span>
            </div>
            <div className="flex flex-col gap-0.5 mt-1.5">
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                Dew <span style={{ color: "rgba(255,255,255,0.65)" }}>{data.dewPoint ?? "—"}°</span>
              </span>
              {data.et != null && (
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                  ET <span style={{ color: "#6ee7b7" }}>{data.et} mm</span>
                </span>
              )}
              {data.leafWetness != null && (
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                  Leaf <span style={{ color: data.leafWetness > 1 ? "#60a5fa" : "rgba(255,255,255,0.6)" }}>
                    {data.leafWetness}hr
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* 4 mini arcs — 2×2 */}
          <div className="grid grid-cols-2 gap-3">
            <MiniArc value={hum}                           max={100}  color="#60a5fa" label="Humidity" unit="%"     delay={0.10} />
            <MiniArc value={data.windSpeed ?? 0}           max={60}   color="#a78bfa" label="Wind"     unit="km/h"  delay={0.20} />
            <MiniArc value={Math.min(data.solarRadiation ?? 0, 1000)} max={1000} color="#fbbf24" label="Solar" unit="W/m²" delay={0.30} />
            <MiniArc value={Math.min(data.rainfall ?? 0, 25)}         max={25}   color="#38bdf8" label="Rain"  unit="mm"   delay={0.40} />
          </div>
        </div>

        {/* Bentgrass temp-window bar */}
        <div>
          <div className="relative h-1.5 rounded-full overflow-visible"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            {/* Optimal zone 15–24°C */}
            <div className="absolute h-1.5 rounded-sm" style={{
              left:       `${(15 / SCALE_MAX) * 100}%`,
              width:      `${((24 - 15) / SCALE_MAX) * 100}%`,
              background: "rgba(52,211,153,0.2)",
              border:     "1px solid rgba(52,211,153,0.35)",
            }} />
            {/* Animated needle */}
            <motion.div className="absolute top-[-5px] w-[3px] h-[22px] rounded-full"
              style={{ background: needleCol, boxShadow: `0 0 8px ${needleCol}cc` }}
              initial={{ left: "0%" }}
              animate={{ left: `calc(${needlePos}% - 1.5px)` }}
              transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-1.5" style={{ fontSize: "9px", color: "rgba(255,255,255,0.22)" }}>
            <span>0°</span>
            <span style={{ color: needleCol, fontWeight: 600 }}>{needleLabel}</span>
            <span>40°</span>
          </div>
        </div>

        {/* 14-day temperature sparkline */}
        {data.history?.length > 0 && (
          <div>
            <p className="section-label mb-2">14-Day Temp</p>
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={data.history} margin={{ top: 2, right: 2, left: -32, bottom: 0 }}>
                <defs>
                  <linearGradient id="wxTempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date"
                  tick={{ fontSize: 8, fill: "rgba(255,255,255,0.22)" }}
                  tickLine={false} axisLine={false} interval={4} />
                <Tooltip content={<ChartTip />} />
                <Area dataKey="temp" name="Temp" unit="°C"
                  stroke="#38bdf8" strokeWidth={1.5}
                  fill="url(#wxTempGrad)" dot={false}
                  activeDot={{ r: 3, fill: "#38bdf8" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Turf risk grid — 4 tiles */}
        <div>
          <p className="section-label mb-2">Turf Risk</p>
          <div className="grid grid-cols-4 gap-2">
            <RiskTile label="Dollar Spot" level={dsr} />
            <RiskTile label="Brown Patch" level={bpr} />
            <RiskTile label="Bentgrass BSI" level={bsiLevel} />
            <RiskTile label="Couch" level={dormLevel} />
          </div>
        </div>

        {/* Growth potential — two half-arcs */}
        <div>
          <p className="section-label mb-2">Growth Potential</p>
          <div className="flex justify-around gap-2 px-2">
            <HalfArc value={gp.c3} color={gpColor(gp.c3)} label={gp.c3Label} sublabel="C3 Bentgrass" delay={0.5} />
            <div style={{ width: "1px", background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
            <HalfArc value={gp.c4} color={gpColor(gp.c4)} label={gp.c4Label} sublabel="C4 Couch"     delay={0.7} />
          </div>
        </div>

        {/* 3-day forecast */}
        {data.forecast?.length > 0 && (
          <div className="flex gap-2">
            {data.forecast.map((f, fi) => {
              const Icon = FORECAST_ICONS[f.icon] ?? SunIcon;
              const rainPct = parseInt(f.rain) || 0;
              return (
                <div key={f.day} className="flex-1 flex flex-col items-center gap-1.5 rounded-xl py-3 px-1"
                  style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.38)", fontWeight: 600, letterSpacing: "0.07em" }}>
                    {f.day.slice(0, 3).toUpperCase()}
                  </span>
                  <Icon size={22} />
                  <div className="text-center">
                    <p className="font-bold text-white" style={{ fontSize: "13px" }}>{f.high}°</p>
                    <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)" }}>{f.low}°</p>
                  </div>
                  {/* Rain probability bar */}
                  <div className="w-full px-2">
                    <div className="h-[3px] rounded-full w-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div className="h-[3px] rounded-full"
                        style={{ background: rainPct > 50 ? "#60a5fa" : "rgba(96,165,250,0.4)" }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${rainPct}%` }}
                        transition={{ duration: 0.9, delay: 0.8 + fi * 0.1 }}
                      />
                    </div>
                    <p style={{ fontSize: "9px", color: rainPct > 40 ? "#60a5fa" : "rgba(255,255,255,0.22)",
                      textAlign: "center", marginTop: "3px" }}>
                      {f.rain}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-right" style={{ fontSize: "9px", color: "rgba(255,255,255,0.17)" }}>
          ↻ {data.lastUpdated}
        </p>
      </div>
    </div>
  );
}

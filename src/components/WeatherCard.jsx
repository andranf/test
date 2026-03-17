import { Wind, Droplets, CloudRain, Sun, Cloud, Thermometer } from "lucide-react";
import AnimatedNumber from "./ui/AnimatedNumber";
import { bentgrassStressIndex, dollarSpotRisk, brownPatchRisk, couchDormancyStatus } from "../services/greenkeeperService";

// ── Weather icons ─────────────────────────────────────────────────────────────

const ICONS = {
  sun:   <Sun   size={18} style={{ color:"#fbbf24", filter:"drop-shadow(0 0 5px rgba(251,191,36,0.8))"  }} />,
  cloud: <Cloud size={18} style={{ color:"#94a3b8" }} />,
  rain:  <CloudRain size={18} style={{ color:"#60a5fa", filter:"drop-shadow(0 0 5px rgba(96,165,250,0.7))" }} />,
};

// ── Bentgrass temperature window ──────────────────────────────────────────────
// Bentgrass: optimal shoot growth 15–24°C air; root stress onset ~20°C soil;
// root growth ceases ~25°C soil; dormancy risk <5°C.

function TempWindowBar({ temp }) {
  const SCALE_MAX = 40;
  const pos = Math.min(100, Math.max(0, (temp / SCALE_MAX) * 100));
  // Estimate soil temp ~2°C below air
  const soilEst  = temp - 2;
  const stateColor = soilEst > 25 ? "#f87171"
                   : soilEst > 20 ? "#fbbf24"
                   : temp   >= 15 ? "#34d399"
                   : temp   <   5 ? "#a78bfa"
                   :                "#fbbf24";
  const stateLabel = soilEst > 25 ? "Root stress" : soilEst > 20 ? "Root growth ↓" :
                     temp >= 15   ? "Optimal"     : temp < 5     ? "Dormancy risk" : "Sub-optimal";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
        <span>Cold/Dormancy</span>
        <span style={{ color: stateColor }}>{stateLabel}</span>
        <span>Heat Stress</span>
      </div>
      <div className="relative h-2 rounded-full overflow-visible" style={{ background: "rgba(255,255,255,0.07)" }}>
        {/* Optimal zone: 15–24°C air */}
        <div className="absolute h-2 rounded-sm" style={{
          left:       `${(15 / SCALE_MAX) * 100}%`,
          width:      `${((24 - 15) / SCALE_MAX) * 100}%`,
          background: "rgba(52,211,153,0.22)",
          border:     "1px solid rgba(52,211,153,0.35)",
        }} />
        {/* Needle */}
        <div className="absolute top-[-4px] w-1 h-4 rounded-full transition-all duration-700"
          style={{
            left:       `calc(${pos}% - 2px)`,
            background: stateColor,
            boxShadow:  `0 0 8px ${stateColor}cc`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1" style={{ color: "rgba(255,255,255,0.22)" }}>
        <span>0°</span><span>Bentgrass optimal 15–24°C air</span><span>40°</span>
      </div>
    </div>
  );
}

// ── Turf intelligence badges ──────────────────────────────────────────────────

function RiskBadge({ label, level }) {
  const cls = level === "High" ? "risk-high" : level === "Moderate" ? "risk-mod" : "risk-low";
  return (
    <span className={`${cls} text-xs font-semibold px-2.5 py-1 rounded-full`}>{label}: {level}</span>
  );
}

function StatTile({ label, value, unit, icon }) {
  return (
    <div className="glass-inner flex flex-col items-center py-3 px-2 gap-1.5 text-center">
      <div>{icon}</div>
      <div className="stat-num text-base font-bold text-white leading-none">
        {value}<span className="text-xs font-normal ml-0.5" style={{ color:"rgba(255,255,255,0.35)" }}>{unit}</span>
      </div>
      <div className="text-xs" style={{ color:"rgba(255,255,255,0.38)" }}>{label}</div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0d9488, #2563eb)" }} />
      <div className="p-6 flex flex-col gap-4">
        <div className="shimmer-block h-4 w-32" />
        <div className="shimmer-block h-20 w-48" />
        <div className="grid grid-cols-3 gap-2">
          {[0,1,2].map(i => <div key={i} className="shimmer-block h-20 rounded-xl" />)}
        </div>
        <div className="shimmer-block h-24 rounded-xl" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WeatherCard({ data, loading }) {
  if (loading || !data) return <Skeleton />;

  const temp = data.temperature ?? 0;
  const hum  = data.humidity    ?? 0;
  const bsi      = bentgrassStressIndex(temp, hum);
  const dsr      = dollarSpotRisk(temp, hum);
  const bpr      = brownPatchRisk(temp, hum);
  // Soil temp estimated ~2°C below air (conservative for Cranbourne sandy loam)
  const soilEst  = temp - 2;
  const dormancy = couchDormancyStatus(soilEst);

  const tempGradient =
    temp > 28 ? "linear-gradient(135deg, #f97316 0%, #fbbf24 100%)" :
    temp < 10 ? "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)" :
    temp < 15 ? "linear-gradient(135deg, #34d399 0%, #60a5fa 100%)" :
                "linear-gradient(135deg, #34d399 0%, #a3e635 100%)";

  const bsiColor = bsi < 30 ? "#34d399" : bsi < 60 ? "#fbbf24" : "#f87171";

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      {/* Sky-blue accent bar */}
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #0ea5e9, #38bdf8, #7dd3fc)" }} />

      <div className="p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label">Weather Station</p>
            <p className="text-sm mt-0.5" style={{ color:"rgba(255,255,255,0.45)" }}>{data.stationName}</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.22)", color:"#7dd3fc" }}>
            {data.conditions}
          </span>
        </div>

        {/* Temperature hero */}
        <div className="flex items-end gap-5">
          <div>
            <AnimatedNumber
              value={temp} decimals={1} className="stat-num font-black leading-none"
              style={{
                fontSize: "clamp(3rem, 7vw, 4.5rem)",
                background: tempGradient,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}
            />
            <span className="text-3xl font-black" style={{ background: tempGradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>°C</span>
          </div>
          <div className="mb-2 flex flex-col gap-1.5">
            <div className="text-sm" style={{ color:"rgba(255,255,255,0.38)" }}>
              Dew <span style={{ color:"rgba(255,255,255,0.7)" }}>{data.dewPoint}°C</span>
            </div>
            <div className="text-sm" style={{ color:"rgba(255,255,255,0.38)" }}>
              Solar <span style={{ color:"rgba(255,255,255,0.7)" }}>{data.solarRadiation} W/m²</span>
            </div>
            <div className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
              style={{ background: "rgba(255,255,255,0.06)", color: bsiColor, border:`1px solid ${bsiColor}44` }}>
              BSI {bsi}/100
            </div>
          </div>
        </div>

        {/* Bentgrass temperature window */}
        <TempWindowBar temp={temp} />

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Humidity" value={hum} unit="%"
            icon={<Droplets size={16} style={{ color:"#60a5fa" }} />} />
          <StatTile label="Wind" value={data.windSpeed} unit={` km/h`}
            icon={<Wind size={16} style={{ color:"#a78bfa" }} />} />
          <StatTile label="Rainfall" value={data.rainfall} unit="mm"
            icon={<CloudRain size={16} style={{ color:"#38bdf8" }} />} />
        </div>

        {/* Turf intelligence */}
        <div className="rounded-xl p-3 flex flex-wrap gap-2"
          style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <p className="section-label w-full mb-1">Turf Intelligence</p>
          <RiskBadge label="Dollar Spot" level={dsr} />
          <RiskBadge label="Brown Patch" level={bpr} />
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            dormancy.color === "green"  ? "risk-low" :
            dormancy.color === "yellow" ? "risk-mod" : "risk-high"
          }`}>
            Couch: {dormancy.label}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            bsi < 30 ? "risk-low" : bsi < 60 ? "risk-mod" : "risk-high"
          }`}>
            Bentgrass BSI: {bsi < 30 ? "Low" : bsi < 60 ? "Moderate" : "High"}
          </span>
        </div>

        {/* 3-day forecast */}
        {data.forecast?.length > 0 && (
          <div className="rounded-xl px-4 py-3 flex justify-around gap-2"
            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
            {data.forecast.map(f => (
              <div key={f.day} className="flex flex-col items-center gap-2 text-xs">
                <span style={{ color:"rgba(255,255,255,0.38)" }}>{f.day}</span>
                {ICONS[f.icon] ?? ICONS.sun}
                <span className="font-bold text-white">{f.high}°</span>
                <span style={{ color:"rgba(255,255,255,0.3)" }}>{f.low}°</span>
                <span style={{ color: parseInt(f.rain) > 40 ? "#60a5fa" : "rgba(255,255,255,0.28)" }}>{f.rain}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-right" style={{ color:"rgba(255,255,255,0.2)" }}>Updated {data.lastUpdated}</p>
      </div>
    </div>
  );
}

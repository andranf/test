import { Wind, Droplets, CloudRain, Sun, Cloud } from "lucide-react";

const ICON_MAP = {
  sun:   <Sun   size={18} style={{ color: "#fbbf24", filter: "drop-shadow(0 0 6px rgba(251,191,36,0.7))"  }} />,
  cloud: <Cloud size={18} style={{ color: "#94a3b8" }} />,
  rain:  <CloudRain size={18} style={{ color: "#60a5fa", filter: "drop-shadow(0 0 6px rgba(96,165,250,0.6))" }} />,
};

function StatTile({ label, value, unit, icon }) {
  return (
    <div className="glass-inner flex flex-col items-center p-3 gap-1.5 text-center">
      <div>{icon}</div>
      <div className="stat-num font-bold text-white leading-none" style={{ fontSize: "1.1rem" }}>
        {value}
        {unit && <span className="text-xs font-normal ml-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{unit}</span>}
      </div>
      <div className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="glass-card p-6 flex flex-col gap-5">
      <div className="flex justify-between">
        <div className="flex flex-col gap-2">
          <div className="shimmer-block h-3 w-28" />
          <div className="shimmer-block h-3 w-40" />
        </div>
        <div className="shimmer-block h-7 w-24 rounded-full" />
      </div>
      <div className="shimmer-block h-16 w-36" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map(i => <div key={i} className="shimmer-block h-20 rounded-xl" />)}
      </div>
      <div className="shimmer-block h-20 rounded-xl" />
    </div>
  );
}

export default function WeatherCard({ data, loading }) {
  if (loading || !data) return <LoadingSkeleton />;

  const temp = data.temperature ?? 0;
  const tempGradient =
    temp > 28 ? "linear-gradient(135deg, #f97316 0%, #fbbf24 100%)" :
    temp < 10 ? "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)" :
                "linear-gradient(135deg, #34d399 0%, #60a5fa 100%)";

  return (
    <div className="glass-card p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.28)" }}>Weather Station</p>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{data.stationName}</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{
          background: "rgba(56,189,248,0.1)",
          border: "1px solid rgba(56,189,248,0.22)",
          color: "#7dd3fc",
        }}>
          {data.conditions}
        </span>
      </div>

      {/* Temperature hero */}
      <div className="flex items-end gap-4">
        <span
          className="stat-num font-bold leading-none"
          style={{
            fontSize: "clamp(3.2rem, 7vw, 4.5rem)",
            background: tempGradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {temp}°
        </span>
        <div className="mb-1 flex flex-col gap-1 text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
          <span>Dew <span style={{ color: "rgba(255,255,255,0.65)" }}>{data.dewPoint}°C</span></span>
          <span>Solar <span style={{ color: "rgba(255,255,255,0.65)" }}>{data.solarRadiation} W/m²</span></span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile
          label="Humidity" value={data.humidity} unit="%"
          icon={<Droplets size={16} style={{ color: "#60a5fa" }} />}
        />
        <StatTile
          label="Wind" value={data.windSpeed} unit={` ${data.windDirection}`}
          icon={<Wind size={16} style={{ color: "#a78bfa" }} />}
        />
        <StatTile
          label="Rainfall" value={data.rainfall} unit="mm"
          icon={<CloudRain size={16} style={{ color: "#38bdf8" }} />}
        />
      </div>

      {/* 3-day forecast */}
      {data.forecast?.length > 0 && (
        <div className="rounded-xl p-4 flex justify-around gap-2" style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {data.forecast.map((f) => (
            <div key={f.day} className="flex flex-col items-center gap-2 text-xs">
              <span style={{ color: "rgba(255,255,255,0.38)" }}>{f.day}</span>
              {ICON_MAP[f.icon] ?? ICON_MAP.sun}
              <span className="font-bold text-white">{f.high}°</span>
              <span style={{ color: "rgba(255,255,255,0.32)" }}>{f.low}°</span>
              <span style={{ color: parseInt(f.rain) > 40 ? "#60a5fa" : "rgba(255,255,255,0.28)" }}>
                {f.rain}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-right" style={{ color: "rgba(255,255,255,0.2)" }}>
        Updated {data.lastUpdated}
      </p>
    </div>
  );
}

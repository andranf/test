import { Wind, Droplets, Thermometer, Sun, Cloud, CloudRain, Eye } from "lucide-react";

const forecastIcons = {
  sun: <Sun size={16} className="text-yellow-500" />,
  cloud: <Cloud size={16} className="text-slate-400" />,
  rain: <CloudRain size={16} className="text-blue-400" />,
};

function Stat({ label, value, unit, icon }) {
  return (
    <div className="flex flex-col items-center bg-slate-50 rounded-xl p-3 gap-1">
      <div className="text-slate-400">{icon}</div>
      <div className="text-lg font-semibold text-slate-800">
        {value}
        <span className="text-xs font-normal text-slate-400 ml-0.5">{unit}</span>
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export default function WeatherCard({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-12 bg-slate-200 rounded w-1/2 mb-4" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-slate-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Weather</h2>
          <p className="text-sm text-slate-500">{data.stationName}</p>
        </div>
        <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full font-medium">
          {data.conditions}
        </span>
      </div>

      {/* Temperature hero */}
      <div className="flex items-end gap-3">
        <span className="text-5xl font-bold text-slate-800">{data.temperature}°</span>
        <div className="mb-1 text-slate-500 text-sm">
          <div>Dew: {data.dewPoint}°C</div>
          <div>Solar: {data.solarRadiation} W/m²</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Humidity" value={data.humidity} unit="%" icon={<Droplets size={16} />} />
        <Stat label="Wind" value={`${data.windSpeed} ${data.windDirection}`} unit="km/h" icon={<Wind size={16} />} />
        <Stat label="Rainfall" value={data.rainfall} unit="mm" icon={<CloudRain size={16} />} />
      </div>

      {/* 3-day forecast */}
      {data.forecast && data.forecast.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <div className="flex justify-around">
            {data.forecast.map((f) => (
              <div key={f.day} className="flex flex-col items-center gap-1 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{f.day}</span>
                {forecastIcons[f.icon] || <Sun size={16} className="text-yellow-500" />}
                <span className="text-slate-800 font-semibold">{f.high}°</span>
                <span>{f.low}°</span>
                <span className="text-blue-400">{f.rain}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400 text-right">Updated {data.lastUpdated}</p>
    </div>
  );
}

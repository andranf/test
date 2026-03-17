import { motion } from "framer-motion";

/**
 * Animated SVG ring gauge.
 * @param {number}  value       - current value
 * @param {number}  max         - maximum value (default 100)
 * @param {number}  size        - diameter in px (default 96)
 * @param {number}  strokeWidth - ring thickness (default 7)
 * @param {string}  color       - stroke colour (CSS colour)
 * @param {string}  label       - small label below the ring
 * @param {string}  unit        - unit shown inside ring
 * @param {number}  decimals    - decimal places for centre value
 */
export default function GaugeRing({
  value,
  max = 100,
  size = 96,
  strokeWidth = 7,
  color = "#34d399",
  label,
  unit,
  decimals = 0,
}) {
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(1, Math.max(0, (value ?? 0) / max));
  const cx   = size / 2;
  const cy   = size / 2;
  const displayVal = (value ?? 0).toFixed(decimals);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {/* Glow filter */}
        <defs>
          <filter id={`glow-${color.replace(/[^a-zA-Z0-9]/g, "")}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
        />

        {/* Animated progress arc */}
        <motion.circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 5px ${color})` }}
        />

        {/* Centre: value */}
        <text
          x={cx} y={cy + (unit ? -4 : 5)}
          textAnchor="middle"
          fontSize={size * 0.195}
          fontWeight="700"
          fill="white"
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        >
          {displayVal}
        </text>

        {/* Centre: unit */}
        {unit && (
          <text
            x={cx} y={cy + size * 0.16}
            textAnchor="middle"
            fontSize={size * 0.115}
            fill="rgba(255,255,255,0.38)"
            fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
          >
            {unit}
          </text>
        )}
      </svg>

      {label && (
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.38)", textAlign: "center", lineHeight: "1.3" }}>
          {label}
        </span>
      )}
    </div>
  );
}

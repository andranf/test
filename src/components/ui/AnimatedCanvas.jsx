import { useEffect, useRef } from "react";

// Canvas-based animated fluid gradient background.
// Uses additive blending ('lighter') so overlapping blobs create bright cores
// and naturally blend at edges — like an aurora or deep-sea bioluminescence.
const BLOBS = [
  // Deep forest green — top-left (golf turf)
  { bx: 0.08, by: 0.12, r: 0.60, rgb: [8, 140, 70],   vx: 0.00018, vy: 0.00022, px: 0,   py: 1.2 },
  // Sapphire — right-centre (water / sky)
  { bx: 0.88, by: 0.38, r: 0.55, rgb: [25, 110, 210],  vx: 0.00024, vy: 0.00016, px: 2.1, py: 0.4 },
  // Violet — bottom-left
  { bx: 0.28, by: 0.88, r: 0.50, rgb: [110, 45, 190],  vx: 0.00013, vy: 0.00027, px: 3.8, py: 2.2 },
  // Amber / gold — top-right (club prestige)
  { bx: 0.78, by: 0.10, r: 0.38, rgb: [160, 100, 10],  vx: 0.00028, vy: 0.00013, px: 5.2, py: 3.1 },
  // Teal — centre
  { bx: 0.50, by: 0.50, r: 0.42, rgb: [0,  130, 120],  vx: 0.00020, vy: 0.00020, px: 1.4, py: 4.5 },
];

export default function AnimatedCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let raf;
    let t0 = null;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    function frame(ts) {
      if (!t0) t0 = ts;
      const t = ts - t0;

      const W = canvas.width;
      const H = canvas.height;

      // Dark golf-green base
      ctx.fillStyle = "#030d08";
      ctx.fillRect(0, 0, W, H);

      // Additive blending — blobs add light on top of the dark base
      ctx.globalCompositeOperation = "lighter";

      for (const b of BLOBS) {
        const cx = (b.bx + 0.20 * Math.sin(t * b.vx + b.px)) * W;
        const cy = (b.by + 0.16 * Math.cos(t * b.vy + b.py)) * H;
        const radius = b.r * Math.min(W, H) * 0.75;

        const [r, g, bl] = b.rgb;
        const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        g2.addColorStop(0,    `rgba(${r},${g},${bl},0.38)`);
        g2.addColorStop(0.35, `rgba(${r},${g},${bl},0.18)`);
        g2.addColorStop(0.7,  `rgba(${r},${g},${bl},0.05)`);
        g2.addColorStop(1,    `rgba(${r},${g},${bl},0)`);

        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";

      // Subtle grid on top
      ctx.strokeStyle = "rgba(255,255,255,0.018)";
      ctx.lineWidth = 1;
      const GRID = 64;
      for (let x = 0; x < W; x += GRID) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += GRID) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed", inset: 0, zIndex: 0,
        pointerEvents: "none",
        width: "100%", height: "100%",
      }}
    />
  );
}

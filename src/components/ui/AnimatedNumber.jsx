import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * A number that smoothly counts up (spring animation) when its value changes.
 */
export default function AnimatedNumber({ value, decimals = 0, className = "", style = {} }) {
  const mv     = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 55, damping: 18 });
  const display = useTransform(spring, (n) => n.toFixed(decimals));

  useEffect(() => {
    if (value != null) mv.set(value);
  }, [value, mv]);

  return (
    <motion.span className={className} style={style}>
      {display}
    </motion.span>
  );
}

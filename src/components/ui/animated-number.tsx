"use client";

import type { FC } from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, animate } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  formatOptions?: Intl.NumberFormatOptions;
  className?: string; // Added className prop
}

export const AnimatedNumber: FC<AnimatedNumberProps> = ({ value, formatOptions, className }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null); // Use span or div as needed

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    // Use a slightly shorter duration for smoother feel
    const controls = animate(displayValue, value, {
      duration: 0.3, // Animation duration in seconds
      ease: "easeOut",
      onUpdate(latest) {
        setDisplayValue(latest);
      }
    });

    // Cleanup function to stop animation if component unmounts or value changes
    return () => controls.stop();
  }, [value, displayValue]); // Rerun animation when the target value changes

  const formattedValue = useMemo(() => {
    // Default to 'es-ES' locale for Spanish formatting if needed
    return new Intl.NumberFormat('es-ES', formatOptions).format(displayValue);
  }, [displayValue, formatOptions]);

  // Use motion.span for inline display or motion.div for block display
  return <motion.span ref={nodeRef} className={className}>{formattedValue}</motion.span>; // Pass className
};
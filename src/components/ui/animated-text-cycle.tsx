"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedTextCycleProps {
  texts: string[];
  duration?: number;
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
}

export default function AnimatedTextCycle({
  texts,
  duration = 2500,
  className,
  tag = "span",
}: AnimatedTextCycleProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, duration);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [texts, duration]);

  const Tag = tag;

  return (
    <Tag className={cn("relative block h-max w-max", className)}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={texts[index]}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ ease: "easeInOut", duration: 0.5 }}
          className="absolute inset-0"
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
      {/* This is a hack to make the parent have the correct width and height */}
      <span className="invisible">{texts[0]}</span>
    </Tag>
  );
}

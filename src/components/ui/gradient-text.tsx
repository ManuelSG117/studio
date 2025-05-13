"use client";

import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

interface GradientTextProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  from?: string;
  via?: string;
  to?: string;
  size?: string;
  animate?: boolean;
}

export default function GradientText({
  children,
  className,
  from = "from-primary", // Default to theme primary
  via,
  to = "to-accent", // Default to theme accent
  size = "text-2xl md:text-3xl",
  animate = false,
}: GradientTextProps) {
  const Tag = "span"; // Use span for inline text

  return (
    <Tag
      className={cn(
        "relative inline-block bg-clip-text text-transparent",
        `bg-gradient-to-r ${from} ${via ? via : ""} ${to}`,
        size,
        { "animate-gradient": animate },
        className,
      )}
    >
      {children}
    </Tag>
  );
}

// Add this to your tailwind.config.js to enable the animation
//
// keyframes: {
//   gradient: {
//     to: {
//       backgroundPosition: "var(--gradient-size) 0",
//     },
//   },
// },
// animation: {
//   gradient: "gradient 8s linear infinite",
// },
//
// --gradient-size has to be set in a parent container. Example:
// <div style={{"--gradient-size": "200%"} as React.CSSProperties}>
//    <GradientText animate>Hello</GradientText>
// </div>
//
// Or add this to your globals.css
// @keyframes gradient {
//   to {
//     background-position: var(--gradient-size) 0;
//   }
// }

// .animate-gradient {
//   animation: gradient 8s linear infinite;
// }

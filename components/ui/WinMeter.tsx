"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface WinMeterProps {
  value: number;
  className?: string;
}

export function WinMeter({ value, className }: WinMeterProps) {
  const clamped = Math.min(80, Math.max(20, value));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  // Arc covers 240 degrees (from 150° to 390°)
  const arcLength = circumference * (240 / 360);
  const fillLength = arcLength * ((clamped - 20) / 60);
  const offset = arcLength - fillLength;

  const color = useMemo(() => {
    if (clamped >= 60) return "#34D399";
    if (clamped >= 50) return "#4F8EF7";
    if (clamped >= 40) return "#FBBF24";
    return "#F87171";
  }, [clamped]);

  const label = useMemo(() => {
    if (clamped >= 65) return "Favored";
    if (clamped >= 55) return "Slight Edge";
    if (clamped >= 45) return "Even";
    if (clamped >= 35) return "Slight Deficit";
    return "Unfavored";
  }, [clamped]);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <svg
        width="120"
        height="90"
        viewBox="-60 -50 120 95"
        className="overflow-visible"
        aria-label={`Win probability: ${clamped.toFixed(1)}%`}
      >
        {/* Background arc */}
        <circle
          cx="0"
          cy="0"
          r={radius}
          fill="none"
          stroke="#252A35"
          strokeWidth="8"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform="rotate(150)"
        />
        {/* Foreground fill arc */}
        <circle
          cx="0"
          cy="0"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${fillLength} ${circumference - fillLength}`}
          strokeDashoffset={offset * -1}
          strokeLinecap="round"
          transform="rotate(150)"
          style={{
            filter: `drop-shadow(0 0 6px ${color}80)`,
            transition: "stroke-dasharray 0.6s ease-out, stroke 0.3s ease",
          }}
        />

        {/* Percentage text */}
        <text
          x="0"
          y="8"
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fontFamily="var(--font-rajdhani)"
          fill={color}
        >
          {clamped.toFixed(1)}%
        </text>
      </svg>

      <span
        className="text-xs font-semibold font-display uppercase tracking-wide"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}

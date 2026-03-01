"use client";

import { useState, useEffect } from "react";

interface CapacityGaugeProps {
  census: number;
  capacity: number;
  label?: string;
}

const ZONE_COLORS = {
  green: "#3fb950",
  amber: "#d29922",
  red: "#f85149",
};

// Gauge geometry constants
const CX = 100, CY = 100, R = 80, SW = 14;
const L = Math.PI * R; // semicircle arc length ≈ 251.33
const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
// viewBox height = bottom of stroke + 2px margin
const VH = CY + SW / 2 + 2; // 109

export function CapacityGauge({ census, capacity, label = "Bed Utilization" }: CapacityGaugeProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pct = capacity > 0 ? Math.round((census / capacity) * 100) : 0;
  const clampedPct = Math.min(pct, 100);
  const available = Math.max(capacity - census, 0);

  const color = pct >= 90 ? ZONE_COLORS.red : pct >= 75 ? ZONE_COLORS.amber : ZONE_COLORS.green;
  const riskLabel = pct >= 90 ? "CRITICAL" : pct >= 75 ? "ELEVATED" : "NORMAL";

  if (!mounted) {
    return (
      <div className="panel flex h-full flex-col overflow-hidden">
        <div className="panel-header flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-bunker-600" />
          {label}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-2 py-2 sm:px-4 sm:py-3" style={{ minHeight: 140 }}>
          <p className="text-xs text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="panel-header flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        {label}
      </div>

      <div className="flex flex-1 flex-col items-center px-2 py-2 sm:px-4 sm:py-3">
        {/* SVG arc gauge — viewBox clips exactly to the semicircle */}
        <div className="w-full max-w-[180px]">
          <svg viewBox={`0 0 200 ${VH}`} className="w-full" aria-hidden>
            {/* Background track */}
            <path
              d={ARC}
              fill="none"
              stroke="#21262d"
              strokeWidth={SW}
              strokeLinecap="round"
            />
            {/* Colored fill — strokeDasharray reveals pct% of the arc */}
            <path
              d={ARC}
              fill="none"
              stroke={color}
              strokeWidth={SW}
              strokeLinecap="round"
              strokeDasharray={`${(L * clampedPct) / 100} ${L}`}
            />
          </svg>
        </div>

        {/* Percentage sits just below the arc's flat bottom */}
        <p
          className="mt-1 text-xl font-bold leading-none sm:text-2xl"
          style={{ color, fontFamily: "var(--font-jetbrains, monospace)" }}
        >
          {pct}%
        </p>

        {/* Status badge */}
        <div className="mt-1 shrink-0 text-center">
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider sm:px-2.5 sm:text-[10px]"
            style={{ background: `${color}20`, color }}
          >
            {riskLabel}
          </span>
        </div>

        {/* Stats row */}
        <div className="mt-2 grid w-full shrink-0 grid-cols-3 gap-x-4 gap-y-1 text-center sm:mt-3 sm:gap-x-6">
          <div className="flex min-w-0 flex-col items-center">
            <p className="whitespace-nowrap text-[9px] uppercase tracking-wider text-gray-500 sm:text-[10px]">Census</p>
            <p className="data-value mt-0.5 text-xs font-semibold text-gray-200 sm:text-sm">{census.toLocaleString()}</p>
          </div>
          <div className="flex min-w-0 flex-col items-center">
            <p className="whitespace-nowrap text-[9px] uppercase tracking-wider text-gray-500 sm:text-[10px]">Capacity</p>
            <p className="data-value mt-0.5 text-xs text-gray-400 sm:text-sm">{capacity.toLocaleString()}</p>
          </div>
          <div className="flex min-w-0 flex-col items-center">
            <p className="whitespace-nowrap text-[9px] uppercase tracking-wider text-gray-500 sm:text-[10px]">Available</p>
            <p className="data-value mt-0.5 text-xs font-semibold text-signal-green sm:text-sm">{available.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

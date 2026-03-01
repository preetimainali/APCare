"use client";

import { useState, useEffect } from "react";

interface ICURiskIndicatorProps {
  occupied: number;
  total: number;
  trendDirection?: "rising" | "falling" | "stable";
  predictedPeak?: number;
}

const ZONES = [
  { min: 0,  max: 60,  label: "LOW",      color: "#3fb950" },
  { min: 60, max: 75,  label: "MODERATE", color: "#58a6ff" },
  { min: 75, max: 85,  label: "ELEVATED", color: "#d29922" },
  { min: 85, max: 100, label: "CRITICAL", color: "#f85149" },
];

function getZone(pct: number) {
  return ZONES.find((z) => pct <= z.max) ?? ZONES[ZONES.length - 1];
}

function trendArrow(dir?: string) {
  if (dir === "rising") return "↑";
  if (dir === "falling") return "↓";
  return "→";
}

// Gauge geometry constants (identical to CapacityGauge for visual consistency)
const CX = 100, CY = 100, R = 80, SW = 14;
const L = Math.PI * R; // semicircle arc length ≈ 251.33
const ARC = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;
const VH = CY + SW / 2 + 2; // 109 — exact viewBox height

// Needle arm length — sits just inside the inner edge of the track
const NR = 64;

export function ICURiskIndicator({ occupied, total, trendDirection, predictedPeak }: ICURiskIndicatorProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const available = total - occupied;
  const zone = getZone(pct);

  // Needle angle: 0% → 180° (left), 100% → 0° (right)
  const angleDeg = 180 - (Math.min(pct, 100) / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;

  const tipX = CX + NR * Math.cos(angleRad);
  const tipY = CY - NR * Math.sin(angleRad);

  // Needle base: perpendicular to needle direction in SVG coordinates
  const bw = 3.5;
  const b1x = CX + bw * Math.sin(angleRad);
  const b1y = CY + bw * Math.cos(angleRad);
  const b2x = CX - bw * Math.sin(angleRad);
  const b2y = CY - bw * Math.cos(angleRad);

  if (!mounted) {
    return (
      <div className="panel flex h-full flex-col overflow-hidden">
        <div className="panel-header flex items-center justify-between">
          <span className="flex items-center gap-2">ICU Risk Level</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-2 py-2 sm:px-4 sm:py-3" style={{ minHeight: 140 }}>
          <p className="text-xs text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: zone.color }} />
          ICU Risk Level
        </span>
        <span
          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: `${zone.color}20`, color: zone.color }}
        >
          {zone.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center px-2 py-2 sm:px-4 sm:py-3">
        {/* SVG arc gauge */}
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

            {/*
              Colored zone segments via strokeDasharray + negative strokeDashoffset.
              dashoffset = -(L * zone.min / 100) shifts the dash start to zone.min% of the arc.
              dasharray  = "${segLen} 9999" draws exactly the zone's slice.
            */}
            {ZONES.map((z) => {
              const segLen = (L * (z.max - z.min)) / 100;
              const offset = -(L * z.min) / 100;
              return (
                <path
                  key={z.label}
                  d={ARC}
                  fill="none"
                  stroke={z.color}
                  strokeWidth={SW}
                  strokeLinecap="butt"
                  strokeOpacity={0.85}
                  strokeDasharray={`${segLen} 9999`}
                  strokeDashoffset={offset}
                />
              );
            })}

            {/* Needle triangle */}
            <polygon
              points={`${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`}
              fill="#e6edf3"
            />

            {/* Pivot dot */}
            <circle cx={CX} cy={CY} r="5" fill="#e6edf3" />
          </svg>
        </div>

        {/* Percentage */}
        <p
          className="mt-1 text-xl font-bold leading-none sm:text-2xl"
          style={{ color: zone.color, fontFamily: "var(--font-jetbrains, monospace)" }}
        >
          {pct}%
        </p>

        {/* Stats row */}
        <div className="mt-2 grid w-full shrink-0 grid-cols-3 gap-x-4 gap-y-1 text-center sm:mt-3 sm:gap-x-6">
          <div className="flex min-w-0 flex-col items-center">
            <p className="whitespace-nowrap text-[9px] uppercase tracking-wider text-gray-500 sm:text-[10px]">Occupied</p>
            <p className="data-value mt-0.5 text-xs font-semibold text-gray-200 sm:text-sm">{occupied}</p>
          </div>
          <div className="flex min-w-0 flex-col items-center">
            <p className="whitespace-nowrap text-[9px] uppercase tracking-wider text-gray-500 sm:text-[10px]">Available</p>
            <p
              className="data-value mt-0.5 text-xs font-semibold sm:text-sm"
              style={{ color: available <= 3 ? "#f85149" : "#3fb950" }}
            >
              {available}
            </p>
          </div>
          <div className="flex min-w-0 flex-col items-center">
            <p className="whitespace-nowrap text-[9px] uppercase tracking-wider text-gray-500 sm:text-[10px]">Trend</p>
            <p className={`data-value mt-0.5 text-xs font-semibold sm:text-sm ${
              trendDirection === "rising"  ? "text-signal-amber" :
              trendDirection === "falling" ? "text-signal-green" : "text-gray-400"
            }`}>
              {trendArrow(trendDirection)} {trendDirection ?? "—"}
            </p>
          </div>
        </div>

        {predictedPeak !== undefined && (
          <div className="mt-2 w-full rounded border border-bunker-700 bg-bunker-800/50 px-3 py-1.5 text-center">
            <p className="text-[10px] text-gray-500">
              7-day forecast peak:{" "}
              <span className="data-value font-semibold text-gray-300">{Math.round(predictedPeak)}</span>{" "}
              of {total} ({total > 0 ? Math.round((predictedPeak / total) * 100) : 0}%)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

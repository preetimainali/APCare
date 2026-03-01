"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import type { MetricPrediction } from "@/lib/types";

interface ForecastChartProps {
  censusPred: MetricPrediction | null;
  icuPred: MetricPrediction | null;
  totalBeds: number;
  icuMax: number;
}

export function ForecastChart({ censusPred, icuPred, totalBeds, icuMax }: ForecastChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>();

    // Add last observed as starting point for visual continuity
    if (censusPred) {
      const startEntry: Record<string, number | string> = { time: censusPred.lastObservedAt };
      startEntry.census = censusPred.lastObserved;
      startEntry.censusPred = censusPred.lastObserved;
      startEntry.upper = censusPred.lastObserved;
      startEntry.lower = censusPred.lastObserved;
      map.set(censusPred.lastObservedAt, startEntry);
    }
    if (icuPred) {
      const key = icuPred.lastObservedAt;
      const entry = map.get(key) ?? { time: key };
      entry.icu = icuPred.lastObserved;
      entry.icuPred = icuPred.lastObserved;
      map.set(key, entry);
    }

    censusPred?.forecast.forEach((fp) => {
      const entry = map.get(fp.time) ?? { time: fp.time };
      entry.censusPred = fp.predicted;
      entry.upper = fp.upper;
      entry.lower = fp.lower;
      map.set(fp.time, entry);
    });

    icuPred?.forecast.forEach((fp) => {
      const entry = map.get(fp.time) ?? { time: fp.time };
      entry.icuPred = fp.predicted;
      map.set(fp.time, entry);
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.time as string).getTime() - new Date(b.time as string).getTime()
    );
  }, [censusPred, icuPred]);

  if (!mounted) {
    return (
      <div className="panel flex flex-col">
        <div className="panel-header flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          7-Day occupancy forecast
        </div>
        <div className="flex items-center justify-center p-8 text-sm text-gray-500" style={{ minHeight: 320 }}>
          Loading…
        </div>
      </div>
    );
  }

  if (!censusPred && !icuPred) {
    return (
      <div className="panel">
        <div className="panel-header flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          Occupancy forecast (7-day)
        </div>
        <div className="flex items-center justify-center p-8 text-sm text-gray-600">
          Select a facility to view forecast
        </div>
      </div>
    );
  }

  const censusDirection = censusPred?.trendDirection;
  const icuDirection = icuPred?.trendDirection;

  return (
    <div className="panel flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          7-Day occupancy forecast
        </span>
        <div className="flex gap-3 text-[10px] font-normal normal-case">
          {censusDirection && (
            <span className={censusDirection === "rising" ? "text-signal-amber" : censusDirection === "falling" ? "text-signal-green" : "text-gray-500"}>
              Census: {censusDirection}
            </span>
          )}
          {icuDirection && (
            <span className={icuDirection === "rising" ? "text-signal-amber" : icuDirection === "falling" ? "text-signal-green" : "text-gray-500"}>
              ICU: {icuDirection}
            </span>
          )}
        </div>
      </div>
      <div className="p-3" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#21262d" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#c9d1d9", fontSize: 11 }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                return `${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
              }}
              minTickGap={60}
            />
            <YAxis tick={{ fill: "#c9d1d9", fontSize: 11 }} width={48} />
            <Tooltip
              contentStyle={{
                background: "#161b22",
                border: "1px solid #484f58",
                borderRadius: 8,
                fontSize: 12,
                color: "#e6edf3",
              }}
              labelStyle={{ color: "#e6edf3" }}
              itemStyle={{ color: "#c9d1d9" }}
              labelFormatter={(v: string) => new Date(v).toLocaleString()}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#c9d1d9" }} />

            {/* Confidence band */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="rgba(168,85,247,0.12)"
              name="Confidence band"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#0d1117"
              name="_lower"
              legendType="none"
            />

            <Line
              type="monotone"
              dataKey="censusPred"
              name="Census forecast"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="icuPred"
              name="ICU forecast"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />

            {totalBeds > 0 && (
              <ReferenceLine
                y={totalBeds}
                stroke="#f85149"
                strokeDasharray="8 4"
                strokeWidth={1}
                label={{
                  value: `Bed capacity: ${totalBeds}`,
                  fill: "#ff7b72",
                  fontSize: 12,
                  fontWeight: 600,
                  position: "right",
                }}
              />
            )}
            {totalBeds > 0 && (
              <ReferenceLine
                y={Math.round(totalBeds * 0.9)}
                stroke="#d29922"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: "90% threshold",
                  fill: "#e3b341",
                  fontSize: 12,
                  fontWeight: 600,
                  position: "right",
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* Driver explanation row */}
      {censusPred?.drivers && (
        <div className="border-t border-bunker-700 px-4 py-2.5">
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-gray-500">Prediction drivers</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {censusPred.drivers.map((d) => (
              <div key={d.name} className="rounded border border-bunker-700 bg-bunker-800/40 px-3 py-1.5">
                <p className="text-[11px] font-medium text-gray-300">{d.name}</p>
                <p className="text-[10px] text-gray-500">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

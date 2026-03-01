"use client";

import { useState, useEffect } from "react";
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import type { UnifiedTimelinePoint } from "@/lib/data";

interface UnifiedTimelineProps {
  data: UnifiedTimelinePoint[];
  totalBeds: number;
  icuMax: number;
  currentDate: string;
  showAdmDischarge?: boolean;
}

export function UnifiedTimeline({ data, totalBeds, icuMax, currentDate, showAdmDischarge }: UnifiedTimelineProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="panel flex flex-col">
        <div className="panel-header flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-blue" />
          Capacity timeline
        </div>
        <div className="flex items-center justify-center p-12 text-sm text-gray-500" style={{ minHeight: 360 }}>
          Loading…
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-blue" />
          Capacity timeline
        </div>
        <div className="flex items-center justify-center p-12 text-sm text-gray-600">
          No data for selected range
        </div>
      </div>
    );
  }

  const hasForecast = data.some((d) => d.forecastCensus != null);
  const hasHistory = data.some((d) => d.census != null);
  const hasConfidence = data.some((d) => d.upper != null);
  const hasAdm = showAdmDischarge && data.some((d) => d.admissions != null);

  const currentDateIso = currentDate + "T22:00:00";

  return (
    <div className="panel flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-blue" />
          Capacity timeline
        </span>
        <div className="flex items-center gap-3 text-[10px] font-normal normal-case">
          {hasHistory && (
            <span className="flex items-center gap-1.5 text-gray-400">
              <span style={{ width: 16, height: 2, background: "#3fb950", display: "inline-block", borderRadius: 1 }} />
              Historical
            </span>
          )}
          {hasForecast && (
            <span className="flex items-center gap-1.5 text-gray-400">
              <span style={{ width: 16, height: 2, background: "#a855f7", display: "inline-block", borderRadius: 1, borderTop: "1px dashed #a855f7" }} />
              Forecast
            </span>
          )}
          {hasConfidence && (
            <span className="flex items-center gap-1.5 text-gray-400">
              <span style={{ width: 16, height: 8, background: "rgba(168,85,247,0.15)", display: "inline-block", borderRadius: 2 }} />
              Confidence
            </span>
          )}
        </div>
      </div>
      <div className="p-3" style={{ height: hasAdm ? 400 : 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#21262d" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#c9d1d9", fontSize: 10 }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                return `${days[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
              }}
              minTickGap={70}
            />
            <YAxis
              yAxisId="main"
              tick={{ fill: "#c9d1d9", fontSize: 10 }}
              width={48}
            />
            {hasAdm && (
              <YAxis
                yAxisId="flow"
                orientation="right"
                tick={{ fill: "#6e7681", fontSize: 9 }}
                width={36}
              />
            )}
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
              labelFormatter={(v: string) => {
                const d = new Date(v);
                const isFuture = d.getTime() > new Date(currentDateIso).getTime();
                const prefix = isFuture ? "Forecast · " : "";
                return prefix + d.toLocaleString();
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#c9d1d9" }} />

            {/* Confidence band for forecast region */}
            {hasConfidence && (
              <>
                <Area
                  yAxisId="main"
                  type="monotone"
                  dataKey="upper"
                  stroke="none"
                  fill="rgba(168,85,247,0.12)"
                  name="Confidence band"
                  legendType="none"
                />
                <Area
                  yAxisId="main"
                  type="monotone"
                  dataKey="lower"
                  stroke="none"
                  fill="#0d1117"
                  name="_lower"
                  legendType="none"
                />
              </>
            )}

            {/* Admissions / Discharges bars */}
            {hasAdm && (
              <>
                <Bar yAxisId="flow" dataKey="admissions" name="Admissions" fill="#238636" opacity={0.35} barSize={2} legendType="none" />
                <Bar yAxisId="flow" dataKey="discharges" name="Discharges" fill="#da3633" opacity={0.3} barSize={2} legendType="none" />
              </>
            )}

            {/* Historical census — solid green line */}
            {hasHistory && (
              <Line
                yAxisId="main"
                type="monotone"
                dataKey="census"
                name="Census (actual)"
                stroke="#3fb950"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls={false}
              />
            )}

            {/* Historical ICU — solid amber line */}
            {hasHistory && (
              <Line
                yAxisId="main"
                type="monotone"
                dataKey="icu"
                name="ICU (actual)"
                stroke="#d29922"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls={false}
              />
            )}

            {/* Forecast census — dashed purple line */}
            {hasForecast && (
              <Line
                yAxisId="main"
                type="monotone"
                dataKey="forecastCensus"
                name="Census (forecast)"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls={false}
              />
            )}

            {/* Forecast ICU — dashed amber line */}
            {hasForecast && (
              <Line
                yAxisId="main"
                type="monotone"
                dataKey="forecastIcu"
                name="ICU (forecast)"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls={false}
              />
            )}

            {/* Bed capacity reference */}
            {totalBeds > 0 && (
              <ReferenceLine
                yAxisId="main"
                y={totalBeds}
                stroke="#f85149"
                strokeDasharray="8 4"
                strokeWidth={1}
                label={{ value: `Capacity: ${totalBeds}`, fill: "#ff7b72", fontSize: 11, fontWeight: 600, position: "right" }}
              />
            )}

            {/* 90% threshold */}
            {totalBeds > 0 && (
              <ReferenceLine
                yAxisId="main"
                y={Math.round(totalBeds * 0.9)}
                stroke="#d29922"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ value: "90%", fill: "#e3b341", fontSize: 10, position: "right" }}
              />
            )}

            {/* Today marker — vertical line */}
            <ReferenceLine
              yAxisId="main"
              x={currentDateIso}
              stroke="#58a6ff"
              strokeWidth={2}
              strokeDasharray="4 2"
              label={{ value: "Today", fill: "#58a6ff", fontSize: 11, fontWeight: 700, position: "insideTopRight" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

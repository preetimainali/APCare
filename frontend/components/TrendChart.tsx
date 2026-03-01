"use client";

import { useMemo } from "react";
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
import type { TrendPoint, ForecastPoint } from "@/lib/types";

interface TrendChartProps {
  censusTrend: TrendPoint[];
  icuTrend: TrendPoint[];
  totalBeds?: number;
  icuMax?: number;
  censusForecast?: ForecastPoint[];
  icuForecast?: ForecastPoint[];
}

export function TrendChart({
  censusTrend,
  icuTrend,
  totalBeds,
  censusForecast,
  icuForecast,
}: TrendChartProps) {
  const data = useMemo(() => {
    const last72h = Date.now() - 72 * 60 * 60 * 1000;
    const map = new Map<
      string,
      {
        time: string;
        census?: number;
        icu?: number;
        censusPred?: number;
        icuPred?: number;
        censusUpper?: number;
        censusLower?: number;
      }
    >();

    for (const pt of censusTrend) {
      if (new Date(pt.time).getTime() < last72h) continue;
      const entry = map.get(pt.time) ?? { time: pt.time };
      entry.census = pt.value;
      map.set(pt.time, entry);
    }
    for (const pt of icuTrend) {
      if (new Date(pt.time).getTime() < last72h) continue;
      const entry = map.get(pt.time) ?? { time: pt.time };
      entry.icu = pt.value;
      map.set(pt.time, entry);
    }

    if (censusForecast) {
      for (const fp of censusForecast) {
        const entry = map.get(fp.time) ?? { time: fp.time };
        entry.censusPred = fp.predicted;
        entry.censusUpper = fp.upper;
        entry.censusLower = fp.lower;
        map.set(fp.time, entry);
      }
    }
    if (icuForecast) {
      for (const fp of icuForecast) {
        const entry = map.get(fp.time) ?? { time: fp.time };
        entry.icuPred = fp.predicted;
        map.set(fp.time, entry);
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [censusTrend, icuTrend, censusForecast, icuForecast]);

  const hasForecast = censusForecast && censusForecast.length > 0;
  const forecastStart = hasForecast ? censusForecast![0].time : null;

  if (data.length === 0) {
    return (
      <div className="panel flex flex-1 flex-col">
        <div className="panel-header flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-green" />
          Census trend (72h)
        </div>
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-500">
          No trend data available
        </div>
      </div>
    );
  }

  return (
    <div className="panel flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-green" />
          Census trend (72h){hasForecast && " + 7-day forecast"}
        </span>
        {hasForecast && (
          <span className="text-[10px] font-normal normal-case text-purple-400">
            Dashed = predicted
          </span>
        )}
      </div>
      <div className="p-3" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#21262d" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#484f58", fontSize: 10 }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
              }}
              minTickGap={40}
            />
            <YAxis tick={{ fill: "#484f58", fontSize: 10 }} width={42} />
            <Tooltip
              contentStyle={{
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(v: string) => new Date(v).toLocaleString()}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#8b949e" }} />

            {/* Confidence band for census prediction */}
            {hasForecast && (
              <Area
                type="monotone"
                dataKey="censusUpper"
                stroke="none"
                fill="rgba(168,85,247,0.08)"
                name="Confidence band"
                legendType="none"
              />
            )}
            {hasForecast && (
              <Area
                type="monotone"
                dataKey="censusLower"
                stroke="none"
                fill="#0d1117"
                name="_lower"
                legendType="none"
              />
            )}

            {/* Actual lines */}
            <Line
              type="monotone"
              dataKey="census"
              name="Total Census"
              stroke="#58a6ff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="icu"
              name="ICU Occupancy"
              stroke="#d29922"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls={false}
            />

            {/* Predicted lines */}
            {hasForecast && (
              <Line
                type="monotone"
                dataKey="censusPred"
                name="Census (predicted)"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls={false}
              />
            )}
            {icuForecast && icuForecast.length > 0 && (
              <Line
                type="monotone"
                dataKey="icuPred"
                name="ICU (predicted)"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls={false}
              />
            )}

            {/* Capacity reference */}
            {totalBeds && (
              <ReferenceLine
                y={totalBeds}
                stroke="#f85149"
                strokeDasharray="8 4"
                strokeWidth={1}
                label={{
                  value: `Capacity: ${totalBeds}`,
                  fill: "#f85149",
                  fontSize: 10,
                  position: "right",
                }}
              />
            )}

            {/* Forecast start marker */}
            {forecastStart && (
              <ReferenceLine
                x={forecastStart}
                stroke="#a855f7"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: "Forecast →",
                  fill: "#a855f7",
                  fontSize: 10,
                  position: "top",
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

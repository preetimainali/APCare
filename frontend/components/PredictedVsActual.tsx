"use client";

import { useState, useMemo } from "react";
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
import type { BacktestPoint, WindowValidation } from "@/lib/types";

interface PredictedVsActualProps {
  windows: WindowValidation[];
  metricKey: "total_census" | "icu_occupancy";
  metricLabel: string;
  capacity?: number;
}

export function PredictedVsActual({ windows, metricKey, metricLabel, capacity }: PredictedVsActualProps) {
  const validWindows = windows.filter((w) => w[metricKey]?.backtest?.length);
  const [selectedWinId, setSelectedWinId] = useState(validWindows[validWindows.length - 1]?.id ?? "");

  const selectedWindow = validWindows.find((w) => w.id === selectedWinId);
  const data: BacktestPoint[] = selectedWindow?.[metricKey]?.backtest ?? [];

  const chartData = useMemo(
    () => data.map((d) => ({
      time: d.time,
      actual: d.actual,
      predicted: d.predicted,
      upper: d.upper,
      lower: d.lower,
    })),
    [data]
  );

  if (validWindows.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header">Predicted vs Actual — {metricLabel}</div>
        <div className="flex items-center justify-center p-8 text-sm text-gray-500">No backtest data</div>
      </div>
    );
  }

  return (
    <div className="panel flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-blue" />
          Predicted vs actual — {metricLabel}
        </span>
        <div className="flex items-center gap-1">
          {validWindows.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWinId(w.id)}
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                selectedWinId === w.id
                  ? "bg-signal-blue/15 text-signal-blue"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {w.label.split("→")[1]?.trim() ?? w.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#21262d" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#c9d1d9", fontSize: 10 }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                return `${days[d.getDay()]} ${d.getMonth()+1}/${d.getDate()}`;
              }}
              minTickGap={60}
            />
            <YAxis tick={{ fill: "#c9d1d9", fontSize: 10 }} width={48} />
            <Tooltip
              contentStyle={{ background: "#161b22", border: "1px solid #484f58", borderRadius: 8, fontSize: 12, color: "#e6edf3" }}
              labelStyle={{ color: "#e6edf3" }}
              itemStyle={{ color: "#c9d1d9" }}
              labelFormatter={(v: string) => new Date(v).toLocaleString()}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#c9d1d9" }} />

            <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(168,85,247,0.10)" name="Confidence band" legendType="none" />
            <Area type="monotone" dataKey="lower" stroke="none" fill="#0d1117" name="_lower" legendType="none" />

            <Line type="monotone" dataKey="actual" name="Actual" stroke="#3fb950" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
            <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#a855f7" strokeWidth={2} strokeDasharray="6 3" dot={false} activeDot={{ r: 3 }} />

            {capacity && (
              <ReferenceLine y={capacity} stroke="#f85149" strokeDasharray="8 4" strokeWidth={1}
                label={{ value: `Capacity: ${capacity}`, fill: "#ff7b72", fontSize: 11, fontWeight: 600, position: "right" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

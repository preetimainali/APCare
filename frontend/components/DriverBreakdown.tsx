"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { DriverContribution } from "@/lib/types";

interface DriverBreakdownProps {
  ema: DriverContribution;
  trend: DriverContribution;
  seasonal: DriverContribution;
  metricLabel: string;
}

const DRIVERS = [
  { key: "ema", label: "24h EMA Baseline", color: "#58a6ff", description: "Weighted average of recent observations" },
  { key: "trend", label: "72h Linear Trend", color: "#a855f7", description: "Rate-of-change slope, dampened for horizon" },
  { key: "seasonal", label: "Weekday×Hour Pattern", color: "#3fb950", description: "Recurring rhythms by day-of-week and hour" },
] as const;

export function DriverBreakdown({ ema, trend, seasonal, metricLabel }: DriverBreakdownProps) {
  const drivers = { ema, trend, seasonal };
  const pieData = DRIVERS.map((d) => ({
    name: d.label,
    value: drivers[d.key].percent,
    color: d.color,
  }));

  return (
    <div className="panel">
      <div className="panel-header flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
        Driver contribution — {metricLabel}
      </div>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        {/* Donut chart */}
        <div className="flex-shrink-0" style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                dataKey="value"
                stroke="#161b22"
                strokeWidth={2}
              >
                {pieData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Driver bars */}
        <div className="flex-1 space-y-3">
          {DRIVERS.map((d) => {
            const drv = drivers[d.key];
            return (
              <div key={d.key}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded" style={{ background: d.color }} />
                    <span className="text-xs font-medium text-gray-300">{d.label}</span>
                  </div>
                  <span className="data-value text-sm font-semibold" style={{ color: d.color }}>
                    {drv.percent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-bunker-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${drv.percent}%`, background: d.color }}
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-gray-600">{d.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

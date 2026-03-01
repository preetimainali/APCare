"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import type { TrendPoint } from "@/lib/types";

interface FlowTrendChartProps {
  censusTrend: TrendPoint[];
  admissionsTrend: TrendPoint[];
  dischargesTrend: TrendPoint[];
  totalBeds?: number;
}

export function FlowTrendChart({
  censusTrend,
  admissionsTrend,
  dischargesTrend,
  totalBeds,
}: FlowTrendChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => {
    const last72h = Date.now() - 72 * 60 * 60 * 1000;
    const map = new Map<string, Record<string, number | string>>();

    for (const pt of censusTrend) {
      if (new Date(pt.time).getTime() < last72h) continue;
      const entry = map.get(pt.time) ?? { time: pt.time };
      entry.census = pt.value;
      map.set(pt.time, entry);
    }
    for (const pt of admissionsTrend) {
      if (new Date(pt.time).getTime() < last72h) continue;
      const entry = map.get(pt.time) ?? { time: pt.time };
      entry.admissions = pt.value;
      map.set(pt.time, entry);
    }
    for (const pt of dischargesTrend) {
      if (new Date(pt.time).getTime() < last72h) continue;
      const entry = map.get(pt.time) ?? { time: pt.time };
      entry.discharges = pt.value;
      map.set(pt.time, entry);
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.time as string).getTime() - new Date(b.time as string).getTime()
    );
  }, [censusTrend, admissionsTrend, dischargesTrend]);

  if (!mounted) {
    return (
      <div className="panel flex flex-col">
        <div className="panel-header flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-blue" />
            Patient flow &amp; census (72h)
          </span>
        </div>
        <div className="flex items-center justify-center p-8 text-sm text-gray-500" style={{ minHeight: 300 }}>
          Loading…
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header">Patient Flow (72h)</div>
        <div className="flex items-center justify-center p-8 text-sm text-gray-500">
          No trend data
        </div>
      </div>
    );
  }

  return (
    <div className="panel flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-blue" />
          Patient flow &amp; census (72h)
        </span>
        <span className="text-[10px] font-normal normal-case text-gray-400">
          Bars = admissions / discharges · Line = census
        </span>
      </div>
      <div className="p-3" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#21262d" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#c9d1d9", fontSize: 11 }}
              tickFormatter={(v: string) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
              }}
              minTickGap={50}
            />
            <YAxis
              yAxisId="census"
              tick={{ fill: "#c9d1d9", fontSize: 11 }}
              width={48}
            />
            <YAxis
              yAxisId="flow"
              orientation="right"
              tick={{ fill: "#c9d1d9", fontSize: 11 }}
              width={40}
            />
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

            <Bar
              yAxisId="flow"
              dataKey="admissions"
              name="Admissions"
              fill="#3fb950"
              opacity={0.6}
              barSize={4}
            />
            <Bar
              yAxisId="flow"
              dataKey="discharges"
              name="Discharges"
              fill="#f85149"
              opacity={0.5}
              barSize={4}
            />

            <Line
              yAxisId="census"
              type="monotone"
              dataKey="census"
              name="Total Census"
              stroke="#58a6ff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />

            {totalBeds && (
              <ReferenceLine
                yAxisId="census"
                y={totalBeds}
                stroke="#f85149"
                strokeDasharray="8 4"
                strokeWidth={1}
                label={{
                  value: `Capacity: ${totalBeds}`,
                  fill: "#ff7b72",
                  fontSize: 12,
                  fontWeight: 600,
                  position: "right",
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

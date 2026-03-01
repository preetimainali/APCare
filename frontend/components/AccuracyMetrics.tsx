"use client";

import { useState } from "react";
import type { ValidationMetrics, WindowValidation, MetricSummary, TrustLevel } from "@/lib/types";

interface AccuracyMetricsProps {
  windows: WindowValidation[];
  summary: {
    total_census?: MetricSummary;
    icu_occupancy?: MetricSummary;
  };
}

function grade(mape: number): { label: string; color: string } {
  if (mape <= 3) return { label: "Excellent", color: "#3fb950" };
  if (mape <= 7) return { label: "Good", color: "#58a6ff" };
  if (mape <= 15) return { label: "Fair", color: "#d29922" };
  return { label: "Poor", color: "#f85149" };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TRUST_CONFIG: Record<TrustLevel, { color: string; bg: string; label: string }> = {
  HIGH: { color: "#3fb950", bg: "#3fb95020", label: "High trust" },
  MODERATE: { color: "#d29922", bg: "#d2992220", label: "Moderate trust" },
  LOW: { color: "#f85149", bg: "#f8514920", label: "Low trust" },
};

export function AccuracyMetrics({ windows, summary }: AccuracyMetricsProps) {
  const [selectedWindow, setSelectedWindow] = useState<string>("summary");

  return (
    <div className="panel">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-green" />
          Model accuracy
        </span>
        {/* Window selector tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedWindow("summary")}
            className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${
              selectedWindow === "summary"
                ? "bg-signal-green/15 text-signal-green"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Cross-window avg
          </button>
          {windows.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWindow(w.id)}
              className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${
                selectedWindow === w.id
                  ? "bg-purple-500/15 text-purple-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {w.label.split("→")[0].trim().replace("Jan 1–", "→ Day ")}
            </button>
          ))}
        </div>
      </div>

      {selectedWindow === "summary" ? (
        <SummaryView summary={summary} windowCount={windows.length} />
      ) : (
        <WindowView window={windows.find((w) => w.id === selectedWindow)!} />
      )}
    </div>
  );
}

function SummaryView({ summary, windowCount }: { summary: AccuracyMetricsProps["summary"]; windowCount: number }) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3 rounded-lg border border-bunker-700 bg-bunker-800/30 px-4 py-2.5">
        <span className="text-xs text-gray-400">Averaged across <span className="data-value font-semibold text-gray-200">{windowCount}</span> backtest windows</span>
        <span className="mx-2 h-4 w-px bg-bunker-700" />
        {summary.total_census && (
          <TrustBadge trust={summary.total_census.trust} label="Census" />
        )}
        {summary.icu_occupancy && (
          <TrustBadge trust={summary.icu_occupancy.trust} label="ICU" />
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {summary.total_census && (
          <MetricCard label="Total Census" m={summary.total_census.avgMetrics} trust={summary.total_census.trust} />
        )}
        {summary.icu_occupancy && (
          <MetricCard label="ICU Occupancy" m={summary.icu_occupancy.avgMetrics} trust={summary.icu_occupancy.trust} />
        )}
      </div>
    </div>
  );
}

function WindowView({ window: win }: { window: WindowValidation }) {
  const trainPeriod = win.total_census?.trainPeriod ?? win.icu_occupancy?.trainPeriod;
  const testPeriod = win.total_census?.testPeriod ?? win.icu_occupancy?.testPeriod;

  return (
    <div className="space-y-4 p-4">
      {trainPeriod && testPeriod && (
        <div className="flex items-center gap-3 rounded-lg border border-bunker-700 bg-bunker-800/30 px-4 py-2.5 text-xs text-gray-400">
          <span>Train: <span className="text-gray-300">{fmtDate(trainPeriod.start)} – {fmtDate(trainPeriod.end)}</span></span>
          <span className="mx-1 text-gray-600">→</span>
          <span>Test: <span className="text-gray-300">{fmtDate(testPeriod.start)} – {fmtDate(testPeriod.end)}</span></span>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {win.total_census && <MetricCard label="Total Census" m={win.total_census.metrics} />}
        {win.icu_occupancy && <MetricCard label="ICU Occupancy" m={win.icu_occupancy.metrics} />}
      </div>
    </div>
  );
}

function TrustBadge({ trust, label }: { trust: TrustLevel; label: string }) {
  const cfg = TRUST_CONFIG[trust];
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-500">{label}:</span>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
        style={{ background: cfg.bg, color: cfg.color }}
      >
        {cfg.label}
      </span>
    </span>
  );
}

function MetricCard({ label, m, trust }: { label: string; m: ValidationMetrics; trust?: TrustLevel }) {
  const g = grade(m.mape);
  return (
    <div className="rounded-lg border border-bunker-700 bg-bunker-800/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          {trust && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
              style={{ background: TRUST_CONFIG[trust].bg, color: TRUST_CONFIG[trust].color }}
            >
              {trust}
            </span>
          )}
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
            style={{ background: `${g.color}20`, color: g.color }}
          >
            {g.label}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="MAE" value={m.mae.toFixed(1)} sub="avg absolute error" />
        <Stat label="RMSE" value={m.rmse.toFixed(1)} sub="root mean squared" />
        <Stat label="MAPE" value={`${m.mape.toFixed(1)}%`} sub="% error" color={g.color} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat
          label="Bias"
          value={m.bias > 0 ? `+${m.bias.toFixed(1)}` : m.bias.toFixed(1)}
          sub={m.bias > 0 ? "over-predicts" : "under-predicts"}
          color={Math.abs(m.bias) > 10 ? "#d29922" : "#8b949e"}
        />
        <Stat
          label="Coverage"
          value={`${m.coverage}%`}
          sub="actuals in band"
          color={m.coverage >= 80 ? "#3fb950" : m.coverage >= 60 ? "#d29922" : "#f85149"}
        />
        <Stat label="Points" value={String(m.n_points)} sub="test observations" />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="data-value mt-0.5 text-lg font-semibold" style={{ color: color ?? "#e6edf3" }}>{value}</p>
      <p className="text-[9px] text-gray-600">{sub}</p>
    </div>
  );
}

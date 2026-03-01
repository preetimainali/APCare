"use client";

import type { MetricPrediction } from "@/lib/types";

interface PredictionPanelProps {
  censusPred: MetricPrediction | null;
  icuPred: MetricPrediction | null;
}

function trendIcon(dir: string) {
  if (dir === "rising") return "↑";
  if (dir === "falling") return "↓";
  return "→";
}

function trendColor(dir: string) {
  if (dir === "rising") return "text-signal-amber";
  if (dir === "falling") return "text-signal-green";
  return "text-gray-400";
}

function pctColor(pct: number) {
  if (pct >= 90) return "text-signal-red";
  if (pct >= 75) return "text-signal-amber";
  return "text-signal-green";
}

export function PredictionPanel({ censusPred, icuPred }: PredictionPanelProps) {
  if (!censusPred && !icuPred) {
    return (
      <div className="panel h-full">
        <div className="panel-header flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          7-Day forecast
        </div>
        <div className="flex h-full items-center justify-center p-6 text-sm text-gray-600">
          Select a facility for predictions
        </div>
      </div>
    );
  }

  return (
    <div className="panel h-full">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          7-Day forecast
        </span>
        <span className="text-[10px] font-normal normal-case text-gray-600">
          {censusPred?.model ?? icuPred?.model}
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {censusPred && (
          <ForecastCard label="Census" pred={censusPred} />
        )}
        {icuPred && (
          <ForecastCard label="ICU" pred={icuPred} />
        )}
      </div>

      {/* Drivers explanation */}
      <div className="border-t border-bunker-700 px-4 py-3">
        <p className="mb-2 text-[10px] uppercase tracking-wider text-gray-500">
          Prediction drivers
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {(censusPred?.drivers ?? icuPred?.drivers ?? []).map((d) => (
            <div
              key={d.name}
              className="rounded border border-bunker-700 bg-bunker-800/50 px-3 py-2"
            >
              <p className="text-xs font-medium text-gray-300">{d.name}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{d.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ForecastCard({ label, pred }: { label: string; pred: MetricPrediction }) {
  const peakForecast = pred.forecast.reduce(
    (best, fp) => (fp.predicted > best.predicted ? fp : best),
    pred.forecast[0]
  );
  const peakTime = new Date(peakForecast.time);
  const delta = pred.peakPredicted - pred.lastObserved;
  const deltaStr = delta >= 0 ? `+${Math.round(delta)}` : `${Math.round(delta)}`;

  return (
    <div className="rounded-md border border-bunker-700 bg-bunker-800/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <span className={`text-sm font-semibold ${trendColor(pred.trendDirection)}`}>
          {trendIcon(pred.trendDirection)} {pred.trendDirection}
        </span>
      </div>

      <div className="mt-2 flex items-end gap-3">
        <div>
          <p className="text-[10px] text-gray-500">Now</p>
          <p className="data-value text-lg text-gray-300">
            {Math.round(pred.lastObserved)}
          </p>
        </div>
        <div className="text-gray-600">→</div>
        <div>
          <p className="text-[10px] text-gray-500">Peak (7d)</p>
          <p className="data-value text-lg font-semibold text-gray-100">
            {Math.round(pred.peakPredicted)}
          </p>
        </div>
        <div className={`ml-auto data-value text-sm ${delta > 0 ? "text-signal-amber" : "text-signal-green"}`}>
          {deltaStr}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className={pctColor(pred.peakPct)}>
          {pred.peakPct}% of capacity
        </span>
        <span className="text-gray-600">
          range: {Math.round(peakForecast.lower)}–{Math.round(peakForecast.upper)}
        </span>
      </div>

      <p className="mt-1 text-[10px] text-gray-600">
        Peak forecast at {peakTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}

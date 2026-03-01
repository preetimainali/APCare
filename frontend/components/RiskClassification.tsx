"use client";

import type { FacilityValidation, TrustLevel } from "@/lib/types";

interface RiskClassificationProps {
  validations: Record<string, FacilityValidation>;
}

const TIER_CONFIG: Record<string, { color: string; bg: string; order: number }> = {
  CRITICAL: { color: "#f85149", bg: "#f8514915", order: 0 },
  HIGH:     { color: "#d29922", bg: "#d2992215", order: 1 },
  MODERATE: { color: "#58a6ff", bg: "#58a6ff15", order: 2 },
  LOW:      { color: "#3fb950", bg: "#3fb95015", order: 3 },
};

const TRUST_CONFIG: Record<TrustLevel, { color: string; bg: string }> = {
  HIGH: { color: "#3fb950", bg: "#3fb95015" },
  MODERATE: { color: "#d29922", bg: "#d2992215" },
  LOW: { color: "#f85149", bg: "#f8514915" },
};

export function RiskClassification({ validations }: RiskClassificationProps) {
  const rows = Object.entries(validations)
    .filter(([, v]) => v.total_census?.risk)
    .map(([fid, v]) => ({
      facilityId: fid,
      name: v.facilityName,
      tier: v.total_census!.risk.tier,
      peakPct: v.total_census!.risk.peakPct,
      peakPredicted: v.total_census!.risk.peakPredicted,
      capacity: v.total_census!.risk.capacity,
      mape: v.summary?.total_census?.avgMetrics.mape ?? v.total_census!.metrics.mape,
      coverage: v.summary?.total_census?.avgMetrics.coverage ?? v.total_census!.metrics.coverage,
      trust: v.summary?.total_census?.trust ?? ("MODERATE" as TrustLevel),
    }))
    .sort((a, b) => TIER_CONFIG[a.tier].order - TIER_CONFIG[b.tier].order);

  const tierCounts: Record<string, number> = {};
  rows.forEach((r) => { tierCounts[r.tier] = (tierCounts[r.tier] ?? 0) + 1; });

  return (
    <div className="panel">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal-red" />
          7-Day risk classification
        </span>
        <div className="flex gap-2">
          {Object.entries(tierCounts).map(([tier, count]) => (
            <span
              key={tier}
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: TIER_CONFIG[tier].bg, color: TIER_CONFIG[tier].color }}
            >
              {count} {tier}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-bunker-700 text-[10px] uppercase tracking-wider text-gray-500">
              <th className="px-4 py-2">Facility</th>
              <th className="px-4 py-2">Risk tier</th>
              <th className="px-4 py-2">Forecast trust</th>
              <th className="px-4 py-2 text-right">Peak forecast</th>
              <th className="px-4 py-2 text-right">Capacity</th>
              <th className="px-4 py-2 text-right">Peak %</th>
              <th className="px-4 py-2 text-right">Avg MAPE</th>
              <th className="px-4 py-2 text-right">Avg Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const tc = TIER_CONFIG[r.tier];
              return (
                <tr key={r.facilityId} className="border-b border-bunker-800/50 hover:bg-bunker-800/30">
                  <td className="px-4 py-2.5 font-medium text-gray-200">{r.name}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ background: tc.bg, color: tc.color }}
                    >
                      {r.tier}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ background: TRUST_CONFIG[r.trust].bg, color: TRUST_CONFIG[r.trust].color }}
                    >
                      {r.trust}
                    </span>
                  </td>
                  <td className="data-value px-4 py-2.5 text-right text-gray-300">{Math.round(r.peakPredicted)}</td>
                  <td className="data-value px-4 py-2.5 text-right text-gray-500">{r.capacity}</td>
                  <td className="data-value px-4 py-2.5 text-right font-semibold" style={{ color: tc.color }}>
                    {r.peakPct}%
                  </td>
                  <td className="data-value px-4 py-2.5 text-right text-gray-400">{r.mape.toFixed(1)}%</td>
                  <td className="data-value px-4 py-2.5 text-right" style={{ color: r.coverage >= 80 ? "#3fb950" : r.coverage >= 60 ? "#d29922" : "#f85149" }}>
                    {r.coverage}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

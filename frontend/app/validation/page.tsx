"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { HospitalSelector } from "@/components/HospitalSelector";
import { AccuracyMetrics } from "@/components/AccuracyMetrics";
import { PredictedVsActual } from "@/components/PredictedVsActual";
import { DriverBreakdown } from "@/components/DriverBreakdown";
import { RiskClassification } from "@/components/RiskClassification";
import { useRoles } from "@/lib/roles";
import { facilities as allFacilities, getValidation, getAllValidations } from "@/lib/data";

export default function ValidationPage() {
  const { canViewPage, canViewValidation, allowedFacilityIds } = useRoles();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const facilities = useMemo(
    () =>
      allowedFacilityIds === "all"
        ? allFacilities
        : allFacilities.filter((f) => allowedFacilityIds.includes(f.id)),
    [allowedFacilityIds]
  );

  const allValidations = useMemo(() => {
    const all = getAllValidations();
    if (allowedFacilityIds === "all") return all;
    const filtered: Record<string, typeof all[string]> = {};
    for (const fid of allowedFacilityIds) {
      if (all[fid]) filtered[fid] = all[fid];
    }
    return filtered;
  }, [allowedFacilityIds]);

  const validation = useMemo(
    () => (selectedFacilityId ? getValidation(selectedFacilityId) : null),
    [selectedFacilityId]
  );

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId) ?? null;

  const systemMape = useMemo(() => {
    const mapes = Object.values(allValidations)
      .map((v) => v.summary?.total_census?.avgMetrics.mape)
      .filter((m): m is number => m != null);
    return mapes.length > 0 ? (mapes.reduce((s, m) => s + m, 0) / mapes.length).toFixed(1) : "—";
  }, [allValidations]);

  const trustCounts = useMemo(() => {
    const counts = { HIGH: 0, MODERATE: 0, LOW: 0 };
    Object.values(allValidations).forEach((v) => {
      const t = v.summary?.total_census?.trust;
      if (t) counts[t]++;
    });
    return counts;
  }, [allValidations]);

  if (!canViewPage("validation")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="rounded-xl border border-bunker-700 bg-bunker-900 px-8 py-10 text-center">
          <p className="text-sm font-medium text-gray-300">Validation access restricted</p>
          <p className="mt-1 text-xs text-gray-500">Your current role does not have access to this page.</p>
          <div className="mt-4 flex justify-center">
            <Link href="/" className="rounded-lg border border-bunker-700 px-3 py-1.5 text-xs text-gray-400 transition hover:text-gray-200">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const showRisk = canViewValidation("riskClassification");
  const showAccuracy = canViewValidation("accuracyMetrics");
  const showPvA = canViewValidation("predictedVsActual");
  const showDrivers = canViewValidation("driverBreakdown");

  return (
    <div className="min-h-screen bg-bunker-950">
      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5">
        {/* Validation summary bar */}
        <div className="flex flex-col gap-2 rounded-lg border border-bunker-700 bg-bunker-900 px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-200">Model Validation</h2>
            <p className="text-[10px] text-gray-500">Multi-window backtesting &amp; forecast trust</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              {trustCounts.HIGH > 0 && (
                <span className="rounded-full bg-[#3fb95015] px-2 py-0.5 text-[10px] font-semibold text-[#3fb950]">{trustCounts.HIGH} High trust</span>
              )}
              {trustCounts.MODERATE > 0 && (
                <span className="rounded-full bg-[#d2992215] px-2 py-0.5 text-[10px] font-semibold text-[#d29922]">{trustCounts.MODERATE} Moderate</span>
              )}
              {trustCounts.LOW > 0 && (
                <span className="rounded-full bg-[#f8514915] px-2 py-0.5 text-[10px] font-semibold text-[#f85149]">{trustCounts.LOW} Low</span>
              )}
            </div>
            <div className="sm:text-right">
              <p className="data-value text-xs text-gray-400 sm:text-sm">System avg MAPE: {systemMape}%</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-600">{Object.keys(allValidations).length} facilities · 3 backtest windows</p>
            </div>
          </div>
        </div>
        {/* Facility selector + explainer */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-6 lg:grid-cols-12">
          <div className="md:col-span-2 lg:col-span-3">
            <HospitalSelector facilities={facilities} selectedId={selectedFacilityId} onSelect={(id) => setSelectedFacilityId(id || null)} />
          </div>
          <div className="md:col-span-4 lg:col-span-9">
            <div className="panel">
              <div className="p-3 sm:p-4">
                <h2 className="mb-2 text-sm font-semibold text-gray-200">How we validate predictions</h2>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 text-xs text-gray-400 leading-relaxed">
                  <div>
                    <p className="mb-1 font-medium text-gray-300">Multi-window backtesting</p>
                    <p>The model is tested across 3 non-overlapping windows (20, 25, and 30 days of training) to prove robustness across different periods and data regimes.</p>
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-gray-300">Accuracy metrics</p>
                    <p>MAE, RMSE, MAPE, Bias, and Coverage are computed per window, then averaged for a single trust-worthy performance score.</p>
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-gray-300">Forecast trust</p>
                    <p>Cross-window average MAPE determines trust: &le;5% = HIGH, &le;12% = MODERATE, &gt;12% = LOW. Trust level adjusts alert severity and confidence messaging.</p>
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-gray-300">Risk tiers</p>
                    <p>Facilities are classified CRITICAL (&ge;90%), HIGH (&ge;80%), MODERATE (&ge;70%), or LOW (&lt;70%) based on forecast peak vs. bed capacity.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showRisk && <RiskClassification validations={allValidations} />}

        {selectedFacilityId && validation ? (
          <>
            {showAccuracy && (
              <AccuracyMetrics windows={validation.windows} summary={validation.summary} />
            )}
            {showPvA && (
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                {validation.windows.some((w) => w.total_census) && (
                  <PredictedVsActual windows={validation.windows} metricKey="total_census" metricLabel="Total Census" capacity={selectedFacility?.beds} />
                )}
                {validation.windows.some((w) => w.icu_occupancy) && (
                  <PredictedVsActual windows={validation.windows} metricKey="icu_occupancy" metricLabel="ICU Occupancy" capacity={selectedFacility?.icuMax} />
                )}
              </div>
            )}
            {showDrivers && (
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                {validation.summary.total_census && (
                  <DriverBreakdown ema={validation.summary.total_census.drivers.ema} trend={validation.summary.total_census.drivers.trend} seasonal={validation.summary.total_census.drivers.seasonal} metricLabel="Total Census (avg across windows)" />
                )}
                {validation.summary.icu_occupancy && (
                  <DriverBreakdown ema={validation.summary.icu_occupancy.drivers.ema} trend={validation.summary.icu_occupancy.drivers.trend} seasonal={validation.summary.icu_occupancy.drivers.seasonal} metricLabel="ICU Occupancy (avg across windows)" />
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-bunker-700 py-16 text-center">
            <p className="mb-1 text-sm font-medium text-gray-400">Select a facility above</p>
            <p className="text-xs text-gray-600">to see multi-window accuracy metrics, predicted vs actual charts, and driver breakdowns</p>
          </div>
        )}
      </main>
    </div>
  );
}

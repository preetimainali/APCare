"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { HospitalSelector } from "@/components/HospitalSelector";
import { CapacityGauge } from "@/components/CapacityGauge";
import { ICURiskIndicator } from "@/components/ICURiskIndicator";
import { CapacityOverview } from "@/components/CapacityOverview";
import { UnifiedTimeline } from "@/components/UnifiedTimeline";
import { AlertDrawer } from "@/components/AlertDrawer";
import { AlertSettingsPanel } from "@/components/AlertSettingsPanel";
import { AlertToast } from "@/components/AlertToast";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { ExportModal } from "@/components/ExportModal";
import { ShareModal } from "@/components/ShareModal";
import { useRoles } from "@/lib/roles";
import { useHeaderActions } from "@/lib/headerActions";
import { buildAlertSummary } from "@/lib/report";
import type { ExportPayload } from "@/lib/report";
import { loadAlertConfig, saveAlertConfig, generateConfiguredAlerts, DEFAULT_CONFIG } from "@/lib/alertConfig";
import type { AlertConfig, AlertWithReason } from "@/lib/alertConfig";
import {
  facilities as allFacilities,
  getSnapshot,
  getPredictions,
  getValidation,
  getUnifiedTimeline,
  getTrust,
  CURRENT_DATE,
  DATA_START,
  DATA_END,
} from "@/lib/data";

export default function DashboardPage() {
  const { canViewPage, canViewDashboard, allowedFacilityIds, activeRole } = useRoles();
  const { setExportAction, setShareAction, setAlertsDrawerAction } = useHeaderActions();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showAlertDrawer, setShowAlertDrawer] = useState(false);
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(DEFAULT_CONFIG);
  const [dismissedToasts, setDismissedToasts] = useState<Set<string>>(new Set());

  useEffect(() => { setAlertConfig(loadAlertConfig()); }, []);

  useEffect(() => {
    setExportAction(() => setShowExport(true));
    setShareAction(() => setShowShare(true));
    setAlertsDrawerAction(() => setShowAlertDrawer(true));
    return () => {
      setExportAction(null);
      setShareAction(null);
      setAlertsDrawerAction(null);
    };
  }, [setExportAction, setShareAction, setAlertsDrawerAction]);

  const handleSaveAlertConfig = useCallback((cfg: AlertConfig) => {
    setAlertConfig(cfg);
    saveAlertConfig(cfg);
    setDismissedToasts(new Set());
  }, []);

  // Default: last 14 days of history + full forecast
  const [startDate, setStartDate] = useState("2026-01-23");
  const [endDate, setEndDate] = useState(DATA_END);

  const facilities = useMemo(
    () =>
      allowedFacilityIds === "all"
        ? allFacilities
        : allFacilities.filter((f) => allowedFacilityIds.includes(f.id)),
    [allowedFacilityIds]
  );

  const selectedFacility = useMemo(
    () => facilities.find((f) => f.id === selectedFacilityId) ?? null,
    [selectedFacilityId, facilities]
  );

  const { totalBeds, census, icuMax, icuOccupied, admissions, discharges, births } = useMemo(() => {
    if (selectedFacilityId) {
      const fac = facilities.find((f) => f.id === selectedFacilityId);
      const snap = getSnapshot(selectedFacilityId);
      return {
        totalBeds: fac?.beds ?? 0,
        census: snap?.total_census ?? 0,
        icuMax: fac?.icuMax ?? 0,
        icuOccupied: snap?.icu_occupancy ?? 0,
        admissions: snap?.admissions ?? 0,
        discharges: snap?.discharges ?? 0,
        births: snap?.births ?? 0,
      };
    }
    const snaps = facilities.map((f) => getSnapshot(f.id)).filter(Boolean);
    return {
      totalBeds: facilities.reduce((s, f) => s + f.beds, 0),
      census: snaps.reduce((s, snap) => s + (snap?.total_census ?? 0), 0),
      icuMax: facilities.reduce((s, f) => s + f.icuMax, 0),
      icuOccupied: snaps.reduce((s, snap) => s + (snap?.icu_occupancy ?? 0), 0),
      admissions: snaps.reduce((s, snap) => s + (snap?.admissions ?? 0), 0),
      discharges: snaps.reduce((s, snap) => s + (snap?.discharges ?? 0), 0),
      births: snaps.reduce((s, snap) => s + (snap?.births ?? 0), 0),
    };
  }, [selectedFacilityId, facilities]);

  const timelineFacilityIds = useMemo(
    () => selectedFacilityId ? [selectedFacilityId] : facilities.map((f) => f.id),
    [selectedFacilityId, facilities]
  );

  const timelineData = useMemo(
    () => getUnifiedTimeline(timelineFacilityIds, startDate, endDate),
    [timelineFacilityIds, startDate, endDate]
  );

  const predictions = useMemo(
    () => selectedFacilityId ? getPredictions(selectedFacilityId) : null,
    [selectedFacilityId]
  );

  const allConfiguredAlerts = useMemo(
    () => generateConfiguredAlerts(alertConfig),
    [alertConfig]
  );

  const alerts = useMemo(() => {
    const allowedIds = new Set(facilities.map((f) => f.id));
    const filtered = allConfiguredAlerts.filter((a) => allowedIds.has(a.facilityId));
    if (!selectedFacilityId) return filtered;
    return filtered.filter((a) => a.facilityId === selectedFacilityId);
  }, [selectedFacilityId, facilities, allConfiguredAlerts]);

  const toastAlerts = useMemo(() => {
    if (!alertConfig.notifications.includes("popup")) return [];
    return alerts.filter((a) => !a.suppressed && !dismissedToasts.has(a.id));
  }, [alerts, alertConfig.notifications, dismissedToasts]);

  const handleDismissToast = useCallback((id: string) => {
    setDismissedToasts((prev) => new Set(prev).add(id));
  }, []);

  const occupancyPct = totalBeds > 0 ? Math.round((census / totalBeds) * 100) : 0;
  const icuPct = icuMax > 0 ? Math.round((icuOccupied / icuMax) * 100) : 0;

  const exportPayload = useMemo((): ExportPayload => {
    const visibleComponents: string[] = [];
    (["capacityGauge", "icuRisk", "capacityOverview", "flowTrend", "forecast", "alerts"] as const).forEach((c) => {
      if (canViewDashboard(c)) visibleComponents.push(c);
    });
    const fid = selectedFacilityId;
    const pred = fid ? getPredictions(fid) : null;
    const trust = fid ? getTrust(fid, "total_census") : null;
    const validation = fid ? getValidation(fid) : null;
    return {
      reportTitle: "HCA Executive Brief",
      exportedAt: new Date().toISOString(),
      role: activeRole,
      selectedFacilityName: selectedFacility?.name ?? "System-wide",
      startDate,
      endDate,
      visibleComponents,
      occupancyPct,
      icuPct,
      totalBeds,
      census,
      icuMax,
      icuOccupied,
      admissions,
      discharges,
      births,
      alertSummary: buildAlertSummary(alerts.filter((a) => !a.suppressed)),
      forecastSummary: {
        censusPeakPct: pred?.total_census?.peakPct ?? null,
        icuPeakPct: pred?.icu_occupancy?.peakPct ?? null,
        censusTrend: pred?.total_census?.trendDirection ?? null,
        icuTrend: pred?.icu_occupancy?.trendDirection ?? null,
        trustLevel: trust,
      },
      timelineData,
      validation,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole, selectedFacility, startDate, endDate, occupancyPct, icuPct, totalBeds, census, icuMax, icuOccupied, admissions, discharges, births, alerts, timelineData]);

  if (!canViewPage("dashboard")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="rounded-xl border border-bunker-700 bg-bunker-900 px-8 py-10 text-center">
          <p className="text-sm font-medium text-gray-300">Dashboard access restricted</p>
          <p className="mt-1 text-xs text-gray-500">Your current role does not have access to this page.</p>
          <div className="mt-4 flex justify-center">
            <Link href="/validation" className="rounded-lg border border-bunker-700 px-3 py-1.5 text-xs text-gray-400 transition hover:text-gray-200">Go to Validation</Link>
          </div>
        </div>
      </div>
    );
  }

  const showGauge = canViewDashboard("capacityGauge");
  const showICU = canViewDashboard("icuRisk");
  const showOverview = canViewDashboard("capacityOverview");
  const showFlow = canViewDashboard("flowTrend");
  const showForecast = canViewDashboard("forecast");
  const showAlerts = canViewDashboard("alerts");
  const showTimeline = showFlow || showForecast;

  return (
    <div className="min-h-screen bg-bunker-950">
      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-5">
        {/* Row 1: Facility selector + Date range + Gauges */}
        <div className="mb-4 grid gap-3 sm:gap-4 md:grid-cols-6 lg:grid-cols-12">
          <div className="md:col-span-3 lg:col-span-2">
            <HospitalSelector facilities={facilities} selectedId={selectedFacilityId} onSelect={(id) => setSelectedFacilityId(id || null)} />
          </div>
          <div className="md:col-span-3 lg:col-span-3">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartChange={setStartDate}
              onEndChange={setEndDate}
              dataStart={DATA_START}
              dataEnd={DATA_END}
              currentDate={CURRENT_DATE}
            />
          </div>
          {showGauge && (
            <div className="md:col-span-3 lg:col-span-2">
              <CapacityGauge census={census} capacity={totalBeds} />
            </div>
          )}
          {showICU && (
            <div className="md:col-span-3 lg:col-span-2">
              <ICURiskIndicator occupied={icuOccupied} total={icuMax} trendDirection={predictions?.icu_occupancy?.trendDirection} predictedPeak={predictions?.icu_occupancy?.peakPredicted} />
            </div>
          )}
          {showOverview && (
            <div className="md:col-span-6 lg:col-span-3">
              <CapacityOverview totalBeds={totalBeds} census={census} icuMax={icuMax} icuOccupied={icuOccupied} admissions={admissions} discharges={discharges} births={births} />
            </div>
          )}
        </div>

        {/* Row 2: Unified timeline (alerts moved to drawer) */}
        {showTimeline && (
          <div className="mb-4">
            <UnifiedTimeline
              data={timelineData}
              totalBeds={totalBeds}
              icuMax={icuMax}
              currentDate={CURRENT_DATE}
              showAdmDischarge={showFlow}
            />
          </div>
        )}
      </main>
      {showExport && <ExportModal payload={exportPayload} onClose={() => setShowExport(false)} />}
      {showShare && <ShareModal payload={exportPayload} onClose={() => setShowShare(false)} />}
      {showAlertSettings && <AlertSettingsPanel config={alertConfig} onSave={handleSaveAlertConfig} onClose={() => setShowAlertSettings(false)} />}
      {showAlerts && (
        <AlertDrawer
          open={showAlertDrawer}
          onClose={() => setShowAlertDrawer(false)}
          alerts={alerts}
          onOpenSettings={() => setShowAlertSettings(true)}
        />
      )}
      <AlertToast alerts={toastAlerts} onDismiss={handleDismissToast} />
    </div>
  );
}


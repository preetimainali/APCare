import type { Facility, FacilitySnapshot, FacilityTrends, FacilityPredictions, FacilityValidation, TrustLevel, Alert } from "./types";
import facilitiesJson from "./data/facilities.json";
import latestSnapshotJson from "./data/latest-snapshot.json";
import trendsJson from "./data/trends.json";
import predictionsJson from "./data/predictions.json";
import validationJson from "./data/validation.json";

export const facilities: Facility[] = facilitiesJson as Facility[];

const snapshotMap = latestSnapshotJson as Record<string, FacilitySnapshot>;
export function getSnapshot(facilityId: string): FacilitySnapshot | null {
  return snapshotMap[facilityId] ?? null;
}

export function getAllSnapshots(): FacilitySnapshot[] {
  return Object.values(snapshotMap);
}

const trendsMap = trendsJson as Record<string, FacilityTrends>;
export function getTrends(facilityId: string): FacilityTrends | null {
  return trendsMap[facilityId] ?? null;
}

const predictionsMap = predictionsJson as Record<string, FacilityPredictions>;
export function getPredictions(facilityId: string): FacilityPredictions | null {
  return predictionsMap[facilityId] ?? null;
}

const validationMap = validationJson as Record<string, FacilityValidation>;
export function getValidation(facilityId: string): FacilityValidation | null {
  return validationMap[facilityId] ?? null;
}
export function getAllValidations(): Record<string, FacilityValidation> {
  return validationMap;
}

export function getTrust(facilityId: string, metric: "total_census" | "icu_occupancy"): TrustLevel {
  const v = validationMap[facilityId];
  return v?.summary?.[metric]?.trust ?? "MODERATE";
}

// The "current date" is the last observed data point
export const CURRENT_DATE = "2026-02-06";
export const DATA_START = "2026-01-01";
export const DATA_END = "2026-02-13"; // last forecast point

export interface UnifiedTimelinePoint {
  time: string;
  census?: number;
  icu?: number;
  admissions?: number;
  discharges?: number;
  forecastCensus?: number;
  forecastIcu?: number;
  upper?: number;
  lower?: number;
}

export function getUnifiedTimeline(
  facilityIds: string[],
  startDate: string,
  endDate: string
): UnifiedTimelinePoint[] {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate + "T23:59:59").getTime();
  const currentMs = new Date(CURRENT_DATE + "T23:00:00").getTime();

  const map = new Map<string, UnifiedTimelinePoint>();

  for (const fid of facilityIds) {
    const trends = getTrends(fid);
    if (trends) {
      for (const pt of trends.total_census) {
        const ms = new Date(pt.time).getTime();
        if (ms < startMs || ms > endMs) continue;
        const entry = map.get(pt.time) ?? { time: pt.time };
        entry.census = (entry.census ?? 0) + pt.value;
        map.set(pt.time, entry);
      }
      for (const pt of trends.icu_occupancy) {
        const ms = new Date(pt.time).getTime();
        if (ms < startMs || ms > endMs) continue;
        const entry = map.get(pt.time) ?? { time: pt.time };
        entry.icu = (entry.icu ?? 0) + pt.value;
        map.set(pt.time, entry);
      }
      for (const pt of trends.admissions) {
        const ms = new Date(pt.time).getTime();
        if (ms < startMs || ms > endMs) continue;
        const entry = map.get(pt.time) ?? { time: pt.time };
        entry.admissions = (entry.admissions ?? 0) + pt.value;
        map.set(pt.time, entry);
      }
      for (const pt of trends.discharges) {
        const ms = new Date(pt.time).getTime();
        if (ms < startMs || ms > endMs) continue;
        const entry = map.get(pt.time) ?? { time: pt.time };
        entry.discharges = (entry.discharges ?? 0) + pt.value;
        map.set(pt.time, entry);
      }
    }

    const pred = getPredictions(fid);
    if (pred?.total_census) {
      // Bridge point: last actual = first forecast for continuity
      const bridgeTime = pred.total_census.lastObservedAt;
      const bridgeMs = new Date(bridgeTime).getTime();
      if (bridgeMs >= startMs && bridgeMs <= endMs) {
        const entry = map.get(bridgeTime) ?? { time: bridgeTime };
        entry.forecastCensus = (entry.forecastCensus ?? 0) + pred.total_census.lastObserved;
        map.set(bridgeTime, entry);
      }

      for (const fp of pred.total_census.forecast) {
        const ms = new Date(fp.time).getTime();
        if (ms < startMs || ms > endMs) continue;
        const entry = map.get(fp.time) ?? { time: fp.time };
        entry.forecastCensus = (entry.forecastCensus ?? 0) + fp.predicted;
        if (facilityIds.length === 1) {
          entry.upper = (entry.upper ?? 0) + fp.upper;
          entry.lower = (entry.lower ?? 0) + fp.lower;
        }
        map.set(fp.time, entry);
      }
    }
    if (pred?.icu_occupancy) {
      const bridgeTime = pred.icu_occupancy.lastObservedAt;
      const bridgeMs = new Date(bridgeTime).getTime();
      if (bridgeMs >= startMs && bridgeMs <= endMs) {
        const entry = map.get(bridgeTime) ?? { time: bridgeTime };
        entry.forecastIcu = (entry.forecastIcu ?? 0) + pred.icu_occupancy.lastObserved;
        map.set(bridgeTime, entry);
      }

      for (const fp of pred.icu_occupancy.forecast) {
        const ms = new Date(fp.time).getTime();
        if (ms < startMs || ms > endMs) continue;
        const entry = map.get(fp.time) ?? { time: fp.time };
        entry.forecastIcu = (entry.forecastIcu ?? 0) + fp.predicted;
        map.set(fp.time, entry);
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );
}

const OCCUPANCY_WARNING = 80;
const OCCUPANCY_CRITICAL = 90;
const ICU_WARNING = 75;
const ICU_CRITICAL = 85;

export function generateAlerts(): Alert[] {
  const alerts: Alert[] = [];
  for (const fac of facilities) {
    const snap = getSnapshot(fac.id);
    if (!snap) continue;

    const occupancyPct = fac.beds > 0
      ? Math.round((snap.total_census / fac.beds) * 100)
      : 0;
    const icuPct = fac.icuMax > 0
      ? Math.round((snap.icu_occupancy / fac.icuMax) * 100)
      : 0;

    if (occupancyPct >= OCCUPANCY_CRITICAL) {
      alerts.push({
        id: `occ-crit-${fac.id}`,
        facilityId: fac.id,
        facilityName: fac.name,
        severity: "critical",
        message: `Overall occupancy at ${occupancyPct}% — exceeds ${OCCUPANCY_CRITICAL}% threshold`,
        at: snap.total_census_at,
      });
    } else if (occupancyPct >= OCCUPANCY_WARNING) {
      alerts.push({
        id: `occ-warn-${fac.id}`,
        facilityId: fac.id,
        facilityName: fac.name,
        severity: "warning",
        message: `Overall occupancy at ${occupancyPct}% — approaching critical threshold`,
        at: snap.total_census_at,
      });
    }

    if (icuPct >= ICU_CRITICAL) {
      alerts.push({
        id: `icu-crit-${fac.id}`,
        facilityId: fac.id,
        facilityName: fac.name,
        severity: "critical",
        message: `ICU occupancy at ${icuPct}% — exceeds ${ICU_CRITICAL}% threshold (${snap.icu_occupancy}/${fac.icuMax} beds)`,
        at: snap.icu_occupancy_at,
      });
    } else if (icuPct >= ICU_WARNING) {
      alerts.push({
        id: `icu-warn-${fac.id}`,
        facilityId: fac.id,
        facilityName: fac.name,
        severity: "warning",
        message: `ICU occupancy at ${icuPct}% — above ${ICU_WARNING}% warning level`,
        at: snap.icu_occupancy_at,
      });
    }

    // Prediction-based alerts with trust-level confidence messaging
    const pred = getPredictions(fac.id);
    if (pred?.total_census) {
      const p = pred.total_census;
      const trust = getTrust(fac.id, "total_census");
      const confidenceTag = trust === "HIGH" ? "" : trust === "MODERATE" ? " (Moderate confidence)" : " (Low confidence — use caution)";

      if (p.peakPct >= OCCUPANCY_CRITICAL && occupancyPct < OCCUPANCY_CRITICAL) {
        const severity = trust === "LOW" ? "info" as const : "warning" as const;
        alerts.push({
          id: `pred-occ-crit-${fac.id}`,
          facilityId: fac.id,
          facilityName: fac.name,
          severity,
          trust,
          message: `Forecast indicates capacity overload at ${p.peakPct}% within 7 days${confidenceTag}`,
          at: p.lastObservedAt,
        });
      } else if (p.peakPct >= OCCUPANCY_WARNING && occupancyPct < OCCUPANCY_WARNING) {
        const severity = trust === "LOW" ? "info" as const : "info" as const;
        alerts.push({
          id: `pred-occ-warn-${fac.id}`,
          facilityId: fac.id,
          facilityName: fac.name,
          severity,
          trust,
          message: `Forecast occupancy approaching ${p.peakPct}% in next 7 days${confidenceTag}`,
          at: p.lastObservedAt,
        });
      }
    }
    if (pred?.icu_occupancy) {
      const p = pred.icu_occupancy;
      const trust = getTrust(fac.id, "icu_occupancy");
      const confidenceTag = trust === "HIGH" ? "" : trust === "MODERATE" ? " (Moderate confidence)" : " (Low confidence — use caution)";

      if (p.peakPct >= ICU_CRITICAL && icuPct < ICU_CRITICAL) {
        const severity = trust === "LOW" ? "info" as const : "warning" as const;
        alerts.push({
          id: `pred-icu-crit-${fac.id}`,
          facilityId: fac.id,
          facilityName: fac.name,
          severity,
          trust,
          message: `Forecast ICU occupancy will reach ${p.peakPct}% within 7 days${confidenceTag}`,
          at: p.lastObservedAt,
        });
      }
    }
  }

  alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return alerts;
}

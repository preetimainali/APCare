import type { Alert, TrustLevel } from "./types";
import { facilities, getSnapshot, getPredictions, getTrust } from "./data";

// ── Types ──

export type NotificationStyle = "dashboard" | "popup" | "email";

export interface ThresholdPair {
  warning: number;
  critical: number;
}

export interface AlertConfig {
  capacity: ThresholdPair;
  icu: ThresholdPair;
  forecastRisk: ThresholdPair;
  notifications: NotificationStyle[];
  maxAlertsPerFacility: number;
  suppressInfoWhenWarning: boolean;
  emailRecipient: string;
}

export interface AlertWithReason extends Alert {
  reason: string;
  threshold: number;
  actual: number;
  suppressed?: boolean;
}

// ── Defaults ──

export const DEFAULT_CONFIG: AlertConfig = {
  capacity: { warning: 80, critical: 90 },
  icu: { warning: 75, critical: 85 },
  forecastRisk: { warning: 80, critical: 90 },
  notifications: ["dashboard"],
  maxAlertsPerFacility: 4,
  suppressInfoWhenWarning: true,
  emailRecipient: "",
};

// ── Persistence ──

const STORAGE_KEY = "hcc-alert-config";

export function loadAlertConfig(): AlertConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch { /* ignore */ }
  return DEFAULT_CONFIG;
}

export function saveAlertConfig(config: AlertConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// ── Configurable alert generation ──

export function generateConfiguredAlerts(config: AlertConfig): AlertWithReason[] {
  const raw: AlertWithReason[] = [];

  for (const fac of facilities) {
    const snap = getSnapshot(fac.id);
    if (!snap) continue;

    const occPct = fac.beds > 0 ? Math.round((snap.total_census / fac.beds) * 100) : 0;
    const icuPct = fac.icuMax > 0 ? Math.round((snap.icu_occupancy / fac.icuMax) * 100) : 0;

    // Capacity alerts
    if (occPct >= config.capacity.critical) {
      raw.push({
        id: `occ-crit-${fac.id}`,
        facilityId: fac.id,
        facilityName: fac.name,
        severity: "critical",
        message: `Overall occupancy at ${occPct}% — exceeds ${config.capacity.critical}% critical threshold`,
        at: snap.total_census_at,
        reason: `Census (${snap.total_census}) / beds (${fac.beds}) = ${occPct}%, which is ≥ critical threshold of ${config.capacity.critical}%`,
        threshold: config.capacity.critical,
        actual: occPct,
      });
    } else if (occPct >= config.capacity.warning) {
      raw.push({
        id: `occ-warn-${fac.id}`,
        facilityId: fac.id,
        facilityName: fac.name,
        severity: "warning",
        message: `Overall occupancy at ${occPct}% — approaching critical threshold`,
        at: snap.total_census_at,
        reason: `Census (${snap.total_census}) / beds (${fac.beds}) = ${occPct}%, which is ≥ warning threshold of ${config.capacity.warning}% but below critical (${config.capacity.critical}%)`,
        threshold: config.capacity.warning,
        actual: occPct,
      });
    }

    // ICU alerts
    if (icuPct >= config.icu.critical) {
      raw.push({
        id: `icu-crit-${fac.id}`,
        facilityId: fac.id,
        facilityName: fac.name,
        severity: "critical",
        message: `ICU occupancy at ${icuPct}% — exceeds ${config.icu.critical}% threshold (${snap.icu_occupancy}/${fac.icuMax} beds)`,
        at: snap.icu_occupancy_at,
        reason: `ICU occupied (${snap.icu_occupancy}) / ICU beds (${fac.icuMax}) = ${icuPct}%, which is ≥ critical threshold of ${config.icu.critical}%`,
        threshold: config.icu.critical,
        actual: icuPct,
      });
    } else if (icuPct >= config.icu.warning) {
      raw.push({
        id: `icu-warn-${fac.id}`,
        facilityId: fac.id,
        facilityName: fac.name,
        severity: "warning",
        message: `ICU occupancy at ${icuPct}% — above ${config.icu.warning}% warning level`,
        at: snap.icu_occupancy_at,
        reason: `ICU occupied (${snap.icu_occupancy}) / ICU beds (${fac.icuMax}) = ${icuPct}%, which is ≥ warning threshold of ${config.icu.warning}% but below critical (${config.icu.critical}%)`,
        threshold: config.icu.warning,
        actual: icuPct,
      });
    }

    // Forecast-based alerts
    const pred = getPredictions(fac.id);
    if (pred?.total_census) {
      const p = pred.total_census;
      const trust = getTrust(fac.id, "total_census");
      const tag = trust === "HIGH" ? "" : trust === "MODERATE" ? " (Moderate confidence)" : " (Low confidence — use caution)";

      if (p.peakPct >= config.forecastRisk.critical && occPct < config.forecastRisk.critical) {
        const severity = trust === "LOW" ? "info" as const : "warning" as const;
        raw.push({
          id: `pred-occ-crit-${fac.id}`,
          facilityId: fac.id,
          facilityName: fac.name,
          severity, trust,
          message: `Forecast indicates capacity overload at ${p.peakPct}% within 7 days${tag}`,
          at: p.lastObservedAt,
          reason: `7-day forecast peak (${p.peakPct}%) ≥ forecast critical threshold (${config.forecastRisk.critical}%), while current occupancy (${occPct}%) is still below. Model trust: ${trust}.`,
          threshold: config.forecastRisk.critical,
          actual: p.peakPct,
        });
      } else if (p.peakPct >= config.forecastRisk.warning && occPct < config.forecastRisk.warning) {
        raw.push({
          id: `pred-occ-warn-${fac.id}`,
          facilityId: fac.id,
          facilityName: fac.name,
          severity: "info", trust,
          message: `Forecast occupancy approaching ${p.peakPct}% in next 7 days${tag}`,
          at: p.lastObservedAt,
          reason: `7-day forecast peak (${p.peakPct}%) ≥ forecast warning threshold (${config.forecastRisk.warning}%), while current (${occPct}%) is still below. Model trust: ${trust}.`,
          threshold: config.forecastRisk.warning,
          actual: p.peakPct,
        });
      }
    }
    if (pred?.icu_occupancy) {
      const p = pred.icu_occupancy;
      const trust = getTrust(fac.id, "icu_occupancy");
      const tag = trust === "HIGH" ? "" : trust === "MODERATE" ? " (Moderate confidence)" : " (Low confidence — use caution)";

      if (p.peakPct >= config.forecastRisk.critical && icuPct < config.forecastRisk.critical) {
        const severity = trust === "LOW" ? "info" as const : "warning" as const;
        raw.push({
          id: `pred-icu-crit-${fac.id}`,
          facilityId: fac.id,
          facilityName: fac.name,
          severity, trust,
          message: `Forecast ICU occupancy will reach ${p.peakPct}% within 7 days${tag}`,
          at: p.lastObservedAt,
          reason: `7-day ICU forecast peak (${p.peakPct}%) ≥ forecast critical threshold (${config.forecastRisk.critical}%), while current ICU (${icuPct}%) is below. Model trust: ${trust}.`,
          threshold: config.forecastRisk.critical,
          actual: p.peakPct,
        });
      }
    }
  }

  // ── Prioritization ──
  raw.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  // Suppress info alerts when a higher-severity alert exists for the same facility + category
  if (config.suppressInfoWhenWarning) {
    const facilityHighSev = new Set<string>();
    for (const a of raw) {
      if (a.severity !== "info") {
        const cat = a.id.includes("icu") ? "icu" : "occ";
        facilityHighSev.add(`${a.facilityId}:${cat}`);
      }
    }
    for (const a of raw) {
      if (a.severity === "info") {
        const cat = a.id.includes("icu") ? "icu" : "occ";
        if (facilityHighSev.has(`${a.facilityId}:${cat}`)) {
          a.suppressed = true;
        }
      }
    }
  }

  // Cap alerts per facility
  const countByFacility = new Map<string, number>();
  for (const a of raw) {
    if (a.suppressed) continue;
    const n = countByFacility.get(a.facilityId) ?? 0;
    if (n >= config.maxAlertsPerFacility) {
      a.suppressed = true;
    } else {
      countByFacility.set(a.facilityId, n + 1);
    }
  }

  return raw;
}

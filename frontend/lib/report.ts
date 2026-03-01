import type { Role, Alert, FacilityValidation } from "./types";
import type { UnifiedTimelinePoint } from "./data";

export interface AlertSummary {
  critical: number;
  warning: number;
  info: number;
  forecastAlerts: number;
  items: Alert[];
}

export interface ForecastSummary {
  censusPeakPct: number | null;
  icuPeakPct: number | null;
  censusTrend: string | null;
  icuTrend: string | null;
  trustLevel: string | null;
}

export type ReportSection =
  | "keyMetrics"
  | "icuInfo"
  | "alerts"
  | "forecastChart"
  | "trendCharts"
  | "validationMetrics";

export const REPORT_SECTIONS: { key: ReportSection; label: string; description: string }[] = [
  { key: "keyMetrics", label: "Key Metrics", description: "Overall occupancy, census, admissions, discharges, births" },
  { key: "icuInfo", label: "ICU Information", description: "ICU occupancy, available beds, risk level, peak forecast" },
  { key: "alerts", label: "Alerts Summary", description: "Current and forecast-based capacity alerts" },
  { key: "forecastChart", label: "Forecast Chart", description: "7-day predicted census and ICU with confidence bands" },
  { key: "trendCharts", label: "Trend Charts", description: "Historical census, ICU, admissions, and discharges over time" },
  { key: "validationMetrics", label: "Validation Metrics", description: "Model accuracy (MAE, RMSE, MAPE), trust level, risk tier" },
];

export interface ExportPayload {
  reportTitle: string;
  exportedAt: string;
  role: Role;
  selectedFacilityName: string;
  startDate: string;
  endDate: string;
  visibleComponents: string[];
  occupancyPct: number;
  icuPct: number;
  totalBeds: number;
  census: number;
  icuMax: number;
  icuOccupied: number;
  admissions: number;
  discharges: number;
  births: number;
  alertSummary: AlertSummary;
  forecastSummary: ForecastSummary;
  timelineData: UnifiedTimelinePoint[];
  validation: FacilityValidation | null;
}

export function buildAlertSummary(alerts: Alert[]): AlertSummary {
  return {
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
    forecastAlerts: alerts.filter((a) => a.id.startsWith("pred-")).length,
    items: alerts,
  };
}

export function buildShareToken(payload: ExportPayload): string {
  const data = {
    role: payload.role.id,
    facility: payload.selectedFacilityName,
    start: payload.startDate,
    end: payload.endDate,
    components: payload.visibleComponents,
    ts: Date.now(),
  };
  return btoa(JSON.stringify(data)).replace(/=/g, "").slice(0, 32);
}

export function buildShareUrl(token: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/share/${token}`;
}

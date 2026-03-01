export interface Facility {
  id: string;
  name: string;
  beds: number;
  icuMax: number;
}

export interface FacilitySnapshot {
  facilityId: string;
  total_census: number;
  total_census_at: string;
  icu_occupancy: number;
  icu_occupancy_at: string;
  admissions: number;
  admissions_at: string;
  births: number;
  births_at: string;
  discharges: number;
  discharges_at: string;
}

export interface TrendPoint {
  time: string;
  value: number;
}

export interface FacilityTrends {
  total_census: TrendPoint[];
  icu_occupancy: TrendPoint[];
  admissions: TrendPoint[];
  births: TrendPoint[];
  discharges: TrendPoint[];
}

export type TrustLevel = "HIGH" | "MODERATE" | "LOW";

export interface Alert {
  id: string;
  facilityId: string;
  facilityName: string;
  severity: "critical" | "warning" | "info";
  message: string;
  at: string;
  trust?: TrustLevel;
}

export interface ForecastPoint {
  time: string;
  predicted: number;
  upper: number;
  lower: number;
}

export interface PredictionDriver {
  name: string;
  value: number;
  description: string;
  direction?: "rising" | "falling" | "stable";
}

export interface MetricPrediction {
  lastObserved: number;
  lastObservedAt: string;
  capacity: number;
  currentPct: number;
  peakPredicted: number;
  peakPct: number;
  trendDirection: "rising" | "falling" | "stable";
  trendSlope: number;
  forecast: ForecastPoint[];
  drivers: PredictionDriver[];
  model: string;
}

export interface FacilityPredictions {
  total_census?: MetricPrediction;
  icu_occupancy?: MetricPrediction;
}

export interface ValidationMetrics {
  mae: number;
  rmse: number;
  mape: number;
  bias: number;
  coverage: number;
  n_points: number;
}

export interface DriverContribution {
  avg_abs_contribution: number;
  percent: number;
}

export interface RiskClassification {
  tier: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  peakPct: number;
  capacity: number;
  peakPredicted: number;
}

export interface BacktestPoint {
  time: string;
  predicted: number;
  actual: number;
  upper: number;
  lower: number;
  ema_component: number;
  trend_component: number;
  seasonal_component: number;
  error: number;
  abs_error: number;
}

export interface MetricValidation {
  metrics: ValidationMetrics;
  drivers: {
    ema: DriverContribution;
    trend: DriverContribution;
    seasonal: DriverContribution;
  };
  risk: RiskClassification;
  backtest: BacktestPoint[];
  trainPeriod: { start: string; end: string };
  testPeriod: { start: string; end: string };
}

export interface WindowValidation {
  id: string;
  label: string;
  total_census?: MetricValidation;
  icu_occupancy?: MetricValidation;
}

export interface MetricSummary {
  avgMetrics: ValidationMetrics;
  drivers: {
    ema: DriverContribution;
    trend: DriverContribution;
    seasonal: DriverContribution;
  };
  trust: TrustLevel;
  risk: RiskClassification;
}

export interface FacilityValidation {
  facilityName: string;
  windows: WindowValidation[];
  summary: {
    total_census?: MetricSummary;
    icu_occupancy?: MetricSummary;
  };
  total_census?: MetricValidation;
  icu_occupancy?: MetricValidation;
}

// ── Role-based access ──

export type DashboardComponent =
  | "capacityGauge"
  | "icuRisk"
  | "capacityOverview"
  | "flowTrend"
  | "forecast"
  | "alerts";

export type ValidationComponent =
  | "riskClassification"
  | "accuracyMetrics"
  | "predictedVsActual"
  | "driverBreakdown";

export type PageAccess = "dashboard" | "validation";

export interface Role {
  id: string;
  name: string;
  facilityAccess: "all" | string[];
  pages: PageAccess[];
  dashboardComponents: DashboardComponent[];
  validationComponents: ValidationComponent[];
  isBuiltIn?: boolean;
}

# Hospital Command Center — Technical Documentation

**HCA Healthcare · Hackathon Prototype**
Version 0.1.0 · February 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Processing Pipeline](#2-data-processing-pipeline)
3. [Prediction Model](#3-prediction-model)
4. [Role-Based Access Control (RBAC)](#4-role-based-access-control-rbac)
5. [Alert Logic](#5-alert-logic)
6. [Export & Share System](#6-export--share-system)
7. [Frontend Component Map](#7-frontend-component-map)
8. [Data Schemas](#8-data-schemas)

---

## 1. Architecture Overview

### 1.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER (static)                       │
│                                                             │
│   HCA Census Metrics.xlsx                                   │
│          │                                                  │
│          ▼                                                  │
│   Python pipeline (openpyxl, built-in math)                 │
│          │                                                  │
│          ▼                                                  │
│   ┌─────────────┬──────────────┬────────────┬────────────┐  │
│   │facilities   │latest-       │trends.json │predictions │  │
│   │.json        │snapshot.json │            │.json       │  │
│   └─────────────┴──────────────┴────────────┴────────────┘  │
│                     validation.json                         │
└─────────────────────────────────────────────────────────────┘
                          │ imported at build time
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js 14)                      │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │  lib/data.ts │   │  lib/roles   │   │  lib/alert     │  │
│  │  (data API)  │   │  (RBAC ctx)  │   │  Config.ts     │  │
│  └──────┬───────┘   └──────┬───────┘   └────────┬───────┘  │
│         │                  │                     │          │
│         └──────────────────┴─────────────────────┘          │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  app/page.tsx                       │    │
│  │  (Dashboard — gauges, timeline, alerts)             │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            app/validation/page.tsx                  │    │
│  │  (Backtest accuracy, predicted vs actual)           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │ browser
                          ▼
                      End User
```

### 1.2 Technology Stack

| Layer | Technology | Version | Role |
|-------|------------|---------|------|
| UI framework | Next.js App Router | 14.2 | SSR/SSG, routing, layout |
| UI library | React | 18.2 | Component model |
| Language | TypeScript | 5.x | Type safety throughout |
| Styling | Tailwind CSS | 3.4 | Utility-first CSS |
| Charts | Recharts | 2.12 | Timeline, forecast, trend charts |
| Gauges | Inline SVG | — | Semicircle arc gauges (no Recharts) |
| PDF export | jsPDF | 4.2 | Client-side PDF generation |
| State | React Context | — | RBAC, header actions |
| Persistence | localStorage | — | Role selection, alert config |
| Data pipeline | Python 3.x + openpyxl | — | Excel → JSON |
| Runtime | Node.js | — | Dev and build server |

### 1.3 Key Design Decisions

**Static JSON data over a live API**
All data is pre-computed at pipeline time and bundled as static JSON files imported directly by the frontend. This eliminates network latency, removes backend dependency during the demo, makes the data fully auditable, and means the entire application runs from a single `npm run dev` command.

**No backend required for the prototype**
The architecture is designed for production to add a FastAPI backend, but the frontend is entirely self-contained. The same `lib/data.ts` interface can be pointed at a real API by changing the data-fetching functions without touching any component code.

**Client-only Recharts rendering**
All Recharts components are wrapped in a `mounted` guard (`useState` + `useEffect`) to prevent server-side rendering crashes. Charts render a "Loading…" placeholder on the server and swap in the live chart after client hydration. Gauge components use pure SVG instead — SVG is server-safe and needs no guard.

**Component-level `"use client"` directives**
Only components that use browser APIs (charts, localStorage, portals) are marked `"use client"`. The layout and page shell remain server-compatible.

---

## 2. Data Processing Pipeline

### 2.1 Source

| Property | Value |
|----------|-------|
| Source file | `data/HCA Census Metrics.xlsx` |
| Facilities | 10 HCA hospitals |
| Date range | January 1, 2026 → February 6, 2026 |
| Granularity | Hourly (aggregated from sub-hourly inputs) |
| Metrics | total_census, icu_occupancy, admissions, discharges, births |

### 2.2 Pipeline Steps

```
Excel workbook (read-only, openpyxl)
    │
    ▼ Step 1 — Row filtering
    │   Discard: null timestamps, unrecognized facility IDs
    │   Log: every discarded row (no silent drops)
    │
    ▼ Step 2 — Timestamp normalization
    │   Parse → UTC-naive ISO 8601 (1-hour granularity)
    │   Sub-hour records → mean-aggregated to parent hour
    │
    ▼ Step 3 — Metric name canonicalization
    │   "Total Census" / "total census" / "TOTAL_CENSUS" → total_census
    │   Maps to: total_census | icu_occupancy | admissions | discharges | births
    │
    ▼ Step 4 — Duplicate handling
    │   Identical (facility, metric, time) + same value → silent drop
    │   Identical (facility, metric, time) + different values → mean, warn
    │
    ▼ Step 5 — Outlier detection
    │   Threshold: |value − 72h rolling mean| > 3σ
    │   Action: retain in trends (visible in chart), exclude from model training
    │
    ▼ Step 6 — Per-facility aggregation
    │   Sort ascending by ISO timestamp (lexicographic = chronological for ISO 8601)
    │   Output: { time: string, value: number }[]  per metric per facility
    │
    ▼ Step 7 — Snapshot extraction
    │   Latest non-null observation per (facility, metric)
    │   Stores value + timestamp ("as of 2026-02-06T22:00:00")
    │
    ▼ Step 8 — Derived calculations
    │   occupancy_pct = round(census / total_beds × 100)
    │   icu_pct = round(icu_occupied / icu_max × 100)
    │   net_flow = admissions − discharges (most recent 24h)
    │
    ▼ Step 9 — Model execution (per facility, per metric)
    │   Inputs: last 72 hours of hourly values
    │   Outputs: 7-day forecast, confidence bands, driver weights, backtest metrics
    │
    ▼ Step 10 — JSON serialization
        facilities.json       ← facility metadata (id, name, beds, icuMax)
        latest-snapshot.json  ← most recent metric values per facility
        trends.json           ← full hourly time series per metric per facility
        predictions.json      ← 7-day forecast + drivers + trust level
        validation.json       ← backtest windows + accuracy metrics
```

### 2.3 Missing Value Policy

| Situation | Handling |
|-----------|---------|
| Null or empty cell | Omit time-series entry — chart shows gap (no interpolation) |
| Structural zero (e.g. births = 0) | Retained — valid observation |
| Suspicious zero in census/ICU | Flagged in log, not imputed |
| Value exceeds bed capacity (surge) | Retained, occupancy % may exceed 100% |

**Rationale:** Invented values produce false alerts. Visible chart gaps are operationally preferable to silent wrong numbers.

### 2.4 Output File Schemas

See [Section 8 — Data Schemas](#8-data-schemas) for full JSON structures.

### 2.5 Reproducibility

All calculations are **fully deterministic**:
- No random seeds, probabilistic sampling, or stochastic steps
- Same input Excel file → byte-for-byte identical output JSON files
- Arithmetic uses Python built-ins only (`float`, `round()`) — no numpy rounding differences
- Backtest window boundaries are hardcoded date strings, not computed

---

## 3. Prediction Model

### 3.1 Model Type

The forecasting model is a **three-component additive time-series model** — not a black-box neural network. Every prediction can be decomposed into three interpretable parts with known formulas.

```
predicted(t) = EMA_baseline
             + trend_component(t)
             + seasonal_component(t)
```

This design choice prioritizes **explainability and auditability** over marginal accuracy gains from complex models.

### 3.2 Component 1 — EMA (Exponential Moving Average)

**Purpose:** Captures current baseline occupancy level (recent momentum).

**Formula:**
```
EMA_t = α × value_t + (1 − α) × EMA_{t-1}
α = 0.2
```

**Computation:**
- Applied sequentially over the most recent **24 hours** of observations
- α = 0.2 means recent values are weighted moderately, older values decay slowly
- Output: a single scalar representing the smoothed current level

**Why 0.2?** Lower α (e.g. 0.05) over-smooths and misses real shifts. Higher α (e.g. 0.5) is too noisy. 0.2 is a standard choice for hourly health-system data.

---

### 3.3 Component 2 — Linear Trend (OLS Regression)

**Purpose:** Captures the medium-term directional slope (rising/falling census).

**Formula (closed-form Ordinary Least Squares):**
```
slope = Σ[(x_i − x̄)(y_i − ȳ)] / Σ[(x_i − x̄)²]

x_i = index of hour (0, 1, 2, … 71)
y_i = census value at hour i
```

**Computation:**
- Computed over the most recent **72 hours** of observations
- Result is a slope in units of **patients per hour**
- Applied to forecast horizons with **exponential damping** to prevent runaway long-range extrapolation

**Damped projection formula:**
```
trend_contribution(t) = slope × t × damping^(t / 24)
```
Where `t` = hours ahead and damping prevents the trend from projecting indefinitely.

**Trend direction classification:**
```
Rising  → slope > +0.5 patients/hr
Falling → slope < −0.5 patients/hr
Stable  → otherwise
```

---

### 3.4 Component 3 — Seasonal Adjustment

**Purpose:** Captures recurring day-of-week and hour-of-day patterns.

**Construction:**
1. For each `(hour_of_day, day_of_week)` combination (24 × 7 = 168 cells), compute the **historical mean deviation** from the overall mean across all training data
2. Deviation stored as `seasonal_adjustment[hour][weekday]`

**At forecast time:**
```
seasonal_component(t) = seasonal_adjustment[hour_of_day(t)][day_of_week(t)]
```

No interpolation between cells — each future hour looks up its exact (hour, weekday) entry.

---

### 3.5 Confidence Intervals

Uncertainty bands widen with forecast horizon to reflect compounding uncertainty.

**Formula:**
```
σ   = std deviation of the most recent 72 observations
band_width(t) = 1.5 × σ × (1 + 0.5 × √(t / 24))

upper(t) = predicted(t) + band_width(t)
lower(t) = predicted(t) − band_width(t)
```

- At `t=0` (now): width = `1.5σ`
- At `t=24h`: width ≈ `1.5σ × 1.5`
- At `t=168h` (7 days): width ≈ `1.5σ × 2.32`

---

### 3.6 Forecast Output

For each facility and metric, the pipeline produces:

```json
{
  "lastObserved": 334,
  "lastObservedAt": "2026-02-06T22:00:00",
  "capacity": 340,
  "currentPct": 98,
  "peakPredicted": 341,
  "peakPct": 100,
  "trendDirection": "rising",
  "trendSlope": 0.8,
  "forecast": [
    { "time": "2026-02-07T00:00:00", "predicted": 335, "upper": 348, "lower": 322 },
    ...
  ],
  "drivers": [
    { "name": "Recent baseline (EMA)", "value": 331.2, "description": "...", "direction": "stable" },
    { "name": "Linear trend", "value": 0.8, "description": "...", "direction": "rising" },
    { "name": "Seasonal pattern", "value": 2.1, "description": "...", "direction": "stable" }
  ],
  "model": "EMA+Trend+Seasonal"
}
```

---

### 3.7 Backtesting & Validation

**Methodology:** Time-based train/test split — training always precedes testing chronologically to prevent data leakage.

**Three validation windows:**

| Window | Train period | Test period |
|--------|-------------|-------------|
| Window 1 | Jan 1 → Jan 20 | Jan 21 → Jan 26 |
| Window 2 | Jan 1 → Jan 25 | Jan 26 → Jan 31 |
| Window 3 | Jan 1 → Jan 30 | Jan 31 → Feb 5 |

**Accuracy metrics computed:**

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| **MAE** | mean(\|predicted − actual\|) | Average absolute error in patient count |
| **RMSE** | √mean((predicted − actual)²) | Penalizes large errors more than MAE |
| **MAPE** | mean(\|error\| / actual × 100) | % error — facility-size independent |
| **Bias** | mean(predicted − actual) | Positive = over-predicts, negative = under-predicts |
| **Coverage** | % of actuals inside (lower, upper) | Confidence interval calibration |

**Trust level assignment (based on cross-window average MAPE):**

| MAPE | Trust Level | Effect on alerts |
|------|-------------|-----------------|
| ≤ 5% | **HIGH** | Forecast alerts at full severity |
| 5–12% | **MODERATE** | Forecast alerts tagged "(Moderate confidence)" |
| > 12% | **LOW** | Forecast alerts downgraded to Info, tagged "(Low confidence)" |

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Overview

Access control is implemented as a React Context (`RoleContext`) wrapping the entire application. Every component that conditionally renders based on role calls the context — nothing is hidden via CSS; non-permitted components are not rendered at all.

### 4.2 Role Schema

```typescript
interface Role {
  id: string;
  name: string;
  facilityAccess: "all" | string[];    // "all" or list of facility IDs
  pages: PageAccess[];                  // ["dashboard", "validation"]
  dashboardComponents: DashboardComponent[];
  validationComponents: ValidationComponent[];
  isBuiltIn?: boolean;
}
```

### 4.3 Built-in Roles

| Role | `id` | Pages | Dashboard components | Validation components |
|------|------|-------|---------------------|----------------------|
| Administrator | `admin` | dashboard, validation | All | All |
| Chief Nursing Officer | `cno` | dashboard | capacityGauge, icuRisk, capacityOverview, alerts | — |
| CFO | `cfo` | dashboard | capacityGauge, capacityOverview, flowTrend | — |
| Data Analyst | `analyst` | dashboard, validation | flowTrend, forecast, alerts | All |

### 4.4 Component Registry

**Dashboard components:**

| Key | Component | Description |
|-----|-----------|-------------|
| `capacityGauge` | `CapacityGauge` | Bed utilization semicircle gauge |
| `icuRisk` | `ICURiskIndicator` | ICU risk multi-zone gauge with needle |
| `capacityOverview` | `CapacityOverview` | 6-stat grid (occ, ICU, net flow, admissions, discharges, births) |
| `flowTrend` | `UnifiedTimeline` (showAdmDischarge) | Admissions/discharges bars on timeline |
| `forecast` | `UnifiedTimeline` (showForecast) | Forecast line + confidence band |
| `alerts` | `AlertDrawer` | Slide-out alert panel + Alerts button in header |

**Validation components:**

| Key | Component | Description |
|-----|-----------|-------------|
| `riskClassification` | `RiskClassification` | Risk tier table per facility |
| `accuracyMetrics` | `AccuracyMetrics` | MAE/RMSE/MAPE/Bias/Coverage per window |
| `predictedVsActual` | `PredictedVsActual` | Line chart overlay of forecast vs actuals |
| `driverBreakdown` | `DriverBreakdown` | Percentage bar chart of EMA/Trend/Seasonal |

### 4.5 Access Check Functions

```typescript
// Called in every conditionally-rendered block
const canViewPage = (page: PageAccess) =>
  activeRole.pages.includes(page);

const canViewDashboard = (comp: DashboardComponent) =>
  activeRole.dashboardComponents.includes(comp);

const canViewValidation = (comp: ValidationComponent) =>
  activeRole.validationComponents.includes(comp);
```

### 4.6 Persistence

| Data | Storage | Key |
|------|---------|-----|
| Active role ID | `localStorage` | `hcc-active-role` |
| Custom role definitions | `localStorage` | `hcc-roles` |

On load, `useEffect` reads localStorage and hydrates the context. The SSR fallback is `admin` so the server renders the full page, and the client corrects to the stored role after hydration.

### 4.7 Custom Roles

Administrators can create custom roles via the **Admin Panel** (accessible via the gear icon in the RoleSwitcher):
- Arbitrary `id`, `name`, `facilityAccess`, `pages`, `dashboardComponents`, `validationComponents`
- Custom roles are merged with built-ins at load time
- Deleting a custom role resets the active role to `admin`
- Built-in roles cannot be deleted or modified

---

## 5. Alert Logic

### 5.1 Alert Types

| Type | ID prefix | Source | Condition |
|------|-----------|--------|-----------|
| Capacity — current | `occ-crit-`, `occ-warn-` | Latest snapshot | Overall occupancy vs threshold |
| ICU — current | `icu-crit-`, `icu-warn-` | Latest snapshot | ICU occupancy vs threshold |
| Capacity — forecast | `pred-occ-crit-`, `pred-occ-warn-` | 7-day predictions | Forecast peak vs threshold |
| ICU — forecast | `pred-icu-crit-` | 7-day predictions | ICU forecast peak vs threshold |

### 5.2 Default Thresholds

| Metric | Warning | Critical |
|--------|---------|---------|
| Overall occupancy | 80% | 90% |
| ICU occupancy | 75% | 85% |
| Forecast peak (overall) | 80% | 90% |
| Forecast peak (ICU) | — | 90% |

All thresholds are user-configurable per session and persisted in `localStorage` under `hcc-alert-config`.

### 5.3 Current-State Alert Logic

```
For each facility:
  occPct = round(snapshot.total_census / facility.beds × 100)
  icuPct = round(snapshot.icu_occupancy / facility.icuMax × 100)

  if occPct ≥ critical_threshold:
    emit CRITICAL capacity alert
  else if occPct ≥ warning_threshold:
    emit WARNING capacity alert

  if icuPct ≥ icu_critical:
    emit CRITICAL ICU alert
  else if icuPct ≥ icu_warning:
    emit WARNING ICU alert
```

### 5.4 Forecast-Based Alert Logic

Forecast alerts only fire when the current reading is **below** the threshold — they are forward-looking signals, not redundant with current alerts.

```
For each facility (if facility is selected):
  peakPct   = predictions.total_census.peakPct
  trust     = getTrust(facilityId, "total_census")

  if peakPct ≥ forecast_critical AND occPct < forecast_critical:
    severity = (trust == LOW) ? INFO : WARNING
    emit forecast alert with trust tag

  if peakPct ≥ forecast_warning AND occPct < forecast_warning:
    emit INFO forecast alert with trust tag

  (same pattern for icu_occupancy)
```

**Trust-severity modification:**
- `HIGH` trust → full assigned severity (WARNING or INFO)
- `MODERATE` trust → severity unchanged, message appended with "(Moderate confidence)"
- `LOW` trust → severity downgraded to INFO, message appended with "(Low confidence — use caution)"

### 5.5 Alert Prioritization

After generation, all alerts are processed through two suppression rules:

**Rule 1 — Info suppression**
```
For each facility × metric category:
  if a WARNING or CRITICAL alert exists for that (facility, category):
    suppress all INFO alerts for the same (facility, category)
```

Prevents forecast info signals from cluttering the panel when a more urgent alert already covers the same issue.

**Rule 2 — Per-facility cap**
```
maxAlertsPerFacility = 4 (default, configurable)

Sort all alerts: CRITICAL → WARNING → INFO
For each facility: allow first N alerts; suppress the rest
```

Prevents a single high-utilization facility from flooding the panel.

### 5.6 Alert Object Schema

```typescript
interface AlertWithReason {
  id: string;              // e.g. "icu-crit-facility-01"
  facilityId: string;
  facilityName: string;
  severity: "critical" | "warning" | "info";
  message: string;         // human-readable description
  at: string;              // ISO timestamp of the observation
  trust?: TrustLevel;      // "HIGH" | "MODERATE" | "LOW" (forecast alerts only)
  reason: string;          // calculation explanation shown on expand
  threshold: number;       // threshold value that was crossed
  actual: number;          // actual value at time of alert
  suppressed?: boolean;    // true if hidden by prioritization rules
}
```

### 5.7 Notification Modes

| Mode | Behavior |
|------|---------|
| `dashboard` | Alerts shown in the slide-out drawer (always on) |
| `popup` | Toast notification in bottom-right corner for new alerts |
| `email` | Placeholder (email recipient field stores address; delivery not implemented in prototype) |

---

## 6. Export & Share System

### 6.1 PDF Export (`lib/pdfExport.ts`)

Generated client-side using **jsPDF** — no server required.

**Sections (all optional, user-selectable):**

| Section key | Content |
|------------|---------|
| `keyMetrics` | Total beds, census, occupancy %, admissions, discharges, births |
| `icuInfo` | ICU beds, occupied, available, risk level, 7-day forecast peak |
| `alerts` | Summary badges (critical/warning/info/forecast counts) + tabular alert list (up to 15 rows) |
| `forecastChart` | Peak census %, peak ICU %, trend direction, trust level + forecast data table |
| `trendCharts` | Historical min/max/avg/latest per metric + range visualization bars |
| `validationMetrics` | Trust level, risk tier, MAE/RMSE/MAPE/Bias/Coverage per window + driver contribution bars + backtest window table |

**Output file name format:**
```
HCA_Executive_Brief_{RoleName}_{YYYY-MM-DD}.pdf
```

**Print palette:** Light theme (white background) designed for legibility on paper and screen.

### 6.2 CSV Export

Flat CSV with the same section structure. Each section is separated by a blank row. Cells are double-quote escaped. Suitable for loading into Excel or BI tools.

**Output file name format:**
```
HCA_Data_Export_{RoleName}_{YYYY-MM-DD}.csv
```

### 6.3 Secure Share Link (`lib/report.ts`)

```typescript
function buildShareToken(payload: ExportPayload): string {
  const data = {
    role: payload.role.id,
    facility: payload.selectedFacilityName,
    start: payload.startDate,
    end: payload.endDate,
    components: payload.visibleComponents,
    ts: Date.now(),
  };
  return btoa(JSON.stringify(data))
    .replace(/=/g, "")
    .slice(0, 32);
}

function buildShareUrl(token: string): string {
  return `${window.location.origin}/share/${token}`;
}
```

The token is a **base64-encoded snapshot** of the current view state — not a database record. It encodes role, facility scope, date range, and visible components so a recipient loads the same filtered view.

---

## 7. Frontend Component Map

```
app/
├── layout.tsx                  Root layout — RoleProvider, HeaderActionsProvider, GlobalHeader
├── globals.css                 Tailwind config, custom design tokens (panel, badge, signal colors)
├── page.tsx                    Dashboard page — facility selector, date range, gauge grid, timeline
└── validation/
    └── page.tsx                Validation page — risk table, accuracy metrics, backtest charts

components/
├── GlobalHeader.tsx            Sticky header — KPI pills, nav links, Actions menu, role switcher
├── RoleSwitcher.tsx            Role dropdown with built-in + custom role list
├── AdminPanel.tsx              Create/edit/delete custom roles
├── HospitalSelector.tsx        Facility dropdown
├── DateRangeFilter.tsx         Start/end date pickers

├── CapacityGauge.tsx           Bed utilization SVG semicircle gauge
├── ICURiskIndicator.tsx        ICU risk SVG gauge with multi-zone arc and needle
├── CapacityOverview.tsx        6-stat grid card

├── UnifiedTimeline.tsx         Combined Recharts timeline (history + forecast + admissions)
├── FlowTrendChart.tsx          72h census/admissions/discharges chart
├── ForecastChart.tsx           7-day forecast with confidence bands

├── AlertDrawer.tsx             Slide-out portal drawer with alert list
├── AlertPanel.tsx              Inline version (legacy, replaced by drawer)
├── AlertToast.tsx              Bottom-right toast notification
├── AlertSettingsPanel.tsx      Threshold configuration modal

├── ExportModal.tsx             PDF/CSV section selector and export trigger
├── ShareModal.tsx              Share link generator

├── RiskClassification.tsx      Validation: risk tier table per facility
├── AccuracyMetrics.tsx         Validation: MAE/RMSE/MAPE/Bias/Coverage cards
├── PredictedVsActual.tsx       Validation: backtest overlay chart
├── DriverBreakdown.tsx         Validation: EMA/Trend/Seasonal contribution bars

lib/
├── data.ts                     Data access functions + getUnifiedTimeline aggregator
├── types.ts                    All TypeScript interfaces
├── roles.tsx                   RoleProvider + useRoles context
├── headerActions.tsx           HeaderActionsProvider (export/share/alerts callbacks)
├── alertConfig.ts              Alert generation logic + configurable thresholds
├── report.ts                   ExportPayload builder + share token generation
└── pdfExport.ts                jsPDF report renderer + CSV exporter

lib/data/
├── facilities.json             Facility metadata (id, name, beds, icuMax)
├── latest-snapshot.json        Most recent metric values per facility
├── trends.json                 Full hourly time series per metric per facility
├── predictions.json            7-day forecasts + drivers + trust
└── validation.json             Backtest windows + accuracy metrics
```

---

## 8. Data Schemas

### 8.1 `facilities.json`
```json
[
  {
    "id": "facility-01",
    "name": "Nashville Medical Center",
    "beds": 340,
    "icuMax": 42
  }
]
```

### 8.2 `latest-snapshot.json`
```json
{
  "facility-01": {
    "facilityId": "facility-01",
    "total_census": 334,
    "total_census_at": "2026-02-06T22:00:00",
    "icu_occupancy": 37,
    "icu_occupancy_at": "2026-02-06T22:00:00",
    "admissions": 12,
    "admissions_at": "2026-02-06T22:00:00",
    "births": 2,
    "births_at": "2026-02-06T22:00:00",
    "discharges": 8,
    "discharges_at": "2026-02-06T22:00:00"
  }
}
```

### 8.3 `trends.json`
```json
{
  "facility-01": {
    "total_census": [
      { "time": "2026-01-01T00:00:00", "value": 310 },
      { "time": "2026-01-01T01:00:00", "value": 312 }
    ],
    "icu_occupancy": [...],
    "admissions":   [...],
    "births":       [...],
    "discharges":   [...]
  }
}
```

### 8.4 `predictions.json`
```json
{
  "facility-01": {
    "total_census": {
      "lastObserved": 334,
      "lastObservedAt": "2026-02-06T22:00:00",
      "capacity": 340,
      "currentPct": 98,
      "peakPredicted": 341,
      "peakPct": 100,
      "trendDirection": "rising",
      "trendSlope": 0.8,
      "forecast": [
        { "time": "2026-02-07T00:00:00", "predicted": 335, "upper": 348, "lower": 322 }
      ],
      "drivers": [
        { "name": "Recent baseline (EMA)", "value": 331.2, "description": "...", "direction": "stable" },
        { "name": "Linear trend", "value": 0.8, "description": "...", "direction": "rising" },
        { "name": "Seasonal pattern", "value": 2.1, "description": "...", "direction": "stable" }
      ],
      "model": "EMA+Trend+Seasonal"
    },
    "icu_occupancy": { ... }
  }
}
```

### 8.5 `validation.json`
```json
{
  "facility-01": {
    "facilityName": "Nashville Medical Center",
    "windows": [
      {
        "id": "window-1",
        "label": "Jan 1–20 train / Jan 21–26 test",
        "total_census": {
          "metrics": { "mae": 4.2, "rmse": 5.8, "mape": 1.4, "bias": 0.3, "coverage": 95, "n_points": 120 },
          "drivers": { "ema": { "avg_abs_contribution": 310.2, "percent": 92.1 }, "trend": { ... }, "seasonal": { ... } },
          "risk": { "tier": "HIGH", "peakPct": 100, "capacity": 340, "peakPredicted": 341 },
          "backtest": [
            { "time": "...", "predicted": 312, "actual": 310, "upper": 325, "lower": 299, ... }
          ],
          "trainPeriod": { "start": "2026-01-01", "end": "2026-01-20" },
          "testPeriod":  { "start": "2026-01-21", "end": "2026-01-26" }
        }
      }
    ],
    "summary": {
      "total_census": {
        "avgMetrics": { "mae": 4.5, "rmse": 6.1, "mape": 1.6, "bias": 0.2, "coverage": 94 },
        "drivers": { ... },
        "trust": "HIGH",
        "risk": { "tier": "HIGH", "peakPct": 100, "capacity": 340, "peakPredicted": 341 }
      }
    }
  }
}
```

---

*Hospital Command Center · Technical Documentation · HCA Healthcare Hackathon Prototype · v0.1.0*
*All formulas documented here are implemented exactly as written in `README/DATA_INTEGRITY.txt` and `frontend/lib/`.*

# Hospital Command Center — User Guide

**For Hospital Operators, Clinical Leaders, and Executives**
HCA Healthcare · Capacity Intelligence Platform

---

## Table of Contents

1. [Overview](#1-overview)
2. [Navigating the App](#2-navigating-the-app)
3. [Dashboard — Reading the Panels](#3-dashboard--reading-the-panels)
4. [Alerts](#4-alerts)
5. [Forecasting](#5-forecasting)
6. [Sharing & Export](#6-sharing--export)
7. [Role-Based Access](#7-role-based-access)
8. [Quick Reference](#8-quick-reference)

---

## 1. Overview

The **Hospital Command Center** is an executive-ready capacity intelligence platform for HCA Healthcare. It gives clinical and operational leaders a single view of:

- **Where the system is right now** — live census, bed utilization, ICU pressure
- **Where it is heading** — 7-day occupancy forecasts with confidence ranges
- **What needs attention** — configurable threshold alerts and forecast-based early warnings
- **How trustworthy the predictions are** — model accuracy scores and confidence levels

The focus is **actionable early warning**, not raw data. Every number on screen is designed to answer the question: *"Should I act on this?"*

---

## 2. Navigating the App

### 2.1 Header — Always Visible

The sticky header at the top of every page shows the system's health at a glance.

| Element | What it shows |
|---------|--------------|
| **Overall %** | System-wide bed occupancy (census ÷ total beds) |
| **ICU %** | System-wide ICU occupancy |
| **Alerts** | Count of active, unsuppressed capacity alerts |

Color coding applies everywhere:

| Color | Meaning |
|-------|---------|
| 🟢 Green | Normal — within safe thresholds |
| 🟡 Amber | Warning — approaching a critical threshold |
| 🔴 Red | Critical — threshold exceeded, action recommended |

---

### 2.2 Selecting a Facility

The **Facility Selector** dropdown (top-left of the dashboard) lets you filter to a single hospital or view the entire system at once.

- **System-wide (default):** All facilities are aggregated — totals and averages reflect the full network.
- **Single facility:** All panels, charts, alerts, and forecasts update to show only that facility's data.

> **Tip:** When investigating a specific alert, select that facility to see its full context — timeline, ICU status, and 7-day forecast.

---

### 2.3 Setting the Date Range

The **Date Range Filter** (next to the facility selector) controls how much historical data is shown in the timeline chart.

- Default view: last 14 days of history + full 7-day forecast
- Data available: January 1, 2026 → February 6, 2026 (observed) + February 7–13 (forecast)
- The dashed line on the timeline marks the boundary between **observed** and **forecast** data

---

### 2.4 Navigating Between Pages

The navigation bar (below the header KPIs) contains:

| Page | Purpose | Who sees it |
|------|---------|------------|
| **Dashboard** | Live capacity, alerts, forecasts | All roles |
| **Validation** | Model accuracy, backtest results | Analysts, Admins |

Click the page name to switch. Your selected facility and date range carry over.

---

### 2.5 Switching Roles

The **Role Switcher** (top-right of the header) lets you switch between pre-configured access roles.

Built-in roles:

| Role | Pages | Dashboard components visible |
|------|-------|------------------------------|
| **Administrator** | Dashboard + Validation | All components |
| **Chief Nursing Officer** | Dashboard | Gauges, ICU risk, overview, alerts |
| **CFO** | Dashboard | Capacity gauge, overview, flow trend |
| **Data Analyst** | Dashboard + Validation | Flow trend, forecast, alerts |

> Switching roles updates the entire UI — panels the role cannot see are hidden automatically. This is designed to let you preview what any stakeholder sees before sharing a report.

---

## 3. Dashboard — Reading the Panels

### 3.1 Bed Utilization Gauge

A semicircle gauge showing **overall bed occupancy** for the selected scope.

| Indicator | Threshold |
|-----------|-----------|
| 🟢 NORMAL | < 75% |
| 🟡 ELEVATED | 75–89% |
| 🔴 CRITICAL | ≥ 90% |

Below the arc:
- **Census** — current occupied beds
- **Capacity** — total licensed beds
- **Available** — beds currently free

---

### 3.2 ICU Risk Indicator

A multi-zone semicircle gauge showing **ICU occupancy** with a needle pointing to the current level.

The arc is divided into four colored zones:

| Zone | Range | Color |
|------|-------|-------|
| LOW | 0–60% | 🟢 Green |
| MODERATE | 61–75% | 🔵 Blue |
| ELEVATED | 76–85% | 🟡 Amber |
| CRITICAL | 86–100% | 🔴 Red |

Below the gauge:
- **Occupied** — ICU beds in use
- **Available** — ICU beds free (turns red if ≤ 3)
- **Trend** — rising ↑ / falling ↓ / stable → based on recent trajectory
- **7-day forecast peak** — highest predicted ICU load in the next 7 days (if a facility is selected)

---

### 3.3 Capacity Overview

A compact stat grid showing six real-time metrics:

| Metric | What it means |
|--------|--------------|
| **Overall Occ.** | Bed occupancy % |
| **ICU Occ.** | ICU occupancy % |
| **Net Flow** | Admissions minus discharges (positive = census growing) |
| **Admissions** | Patients admitted since last snapshot |
| **Discharges** | Patients discharged since last snapshot |
| **Births** | Births recorded since last snapshot |

---

### 3.4 Capacity Timeline

The main chart. It overlays historical and forecast data on a single timeline.

**What each line/area means:**

| Series | Type | Description |
|--------|------|-------------|
| Census | Solid line | Observed total patient count |
| ICU | Solid line | Observed ICU occupied beds |
| Admissions | Bars | Admission volume |
| Discharges | Bars | Discharge volume |
| Forecast census | Dashed line | Predicted census (7 days ahead) |
| Confidence band | Shaded area | Forecast uncertainty range (upper/lower bounds) |
| Capacity line | Red dashed | Total bed capacity ceiling |

**Reading the chart:**
- Data **to the left** of the vertical "now" line is observed.
- Data **to the right** is model forecast.
- A wider confidence band means the model is less certain — treat wide-band forecasts as directional guidance only.

---

## 4. Alerts

### 4.1 How Alerts Work

Alerts fire automatically when real-time or forecast data crosses a configured threshold. There are three types:

| Type | Source | Example |
|------|--------|---------|
| **Capacity alert** | Current snapshot | "Overall occupancy at 93% — exceeds 90% critical threshold" |
| **ICU alert** | Current snapshot | "ICU occupancy at 87% — exceeds 85% threshold" |
| **Forecast alert** | 7-day prediction | "Forecast indicates capacity overload at 91% within 7 days" |

Severity levels:

| Severity | Meaning |
|----------|---------|
| 🔴 **Critical** | Threshold exceeded right now — immediate awareness needed |
| 🟡 **Warning** | Approaching critical, or forecast will breach critical |
| 🔵 **Info** | Early trend signal — lower priority, monitor |

---

### 4.2 Opening the Alert Drawer

Click the **Alerts** button in the header navigation bar to open the slide-out alert panel.

- All active alerts are listed, sorted by severity (critical first)
- Click any alert row to expand it and see:
  - **Why it fired** — the exact calculation (e.g. "Census 412 / Beds 450 = 92%")
  - **Threshold** — what level triggered it
  - **Actual value** — current reading
  - **Confidence tag** — for forecast alerts, the model's trust level (High / Moderate / Low)

---

### 4.3 Alert Suppression Rules

To prevent alert fatigue, the system applies two rules automatically:

1. **Info suppression:** If a facility already has a Warning or Critical alert for a metric (e.g. ICU), any Info-level forecast alert for the same metric at that facility is suppressed.
2. **Per-facility cap:** A maximum of 4 alerts per facility are shown at once. Lower-priority alerts beyond this cap are suppressed.

Suppressed alerts are counted and shown at the bottom of the drawer so nothing is invisible.

---

### 4.4 Configuring Alert Thresholds

Click the **gear icon** inside the Alert Drawer to open Alert Settings.

You can configure:

| Setting | Default | Description |
|---------|---------|-------------|
| Capacity warning | 80% | Overall occupancy warning trigger |
| Capacity critical | 90% | Overall occupancy critical trigger |
| ICU warning | 75% | ICU warning trigger |
| ICU critical | 85% | ICU critical trigger |
| Forecast warning | 80% | Forecast peak warning trigger |
| Forecast critical | 90% | Forecast peak critical trigger |
| Max alerts per facility | 4 | Cap to prevent flooding |
| Suppress info when warning | On | Reduce noise when higher alerts exist |
| Notification style | Dashboard | Dashboard pop-up, or email |

After saving, thresholds apply immediately — alerts recalculate against the new values. Settings are saved in your browser and persist across sessions.

---

### 4.5 Pop-up Toast Notifications

If **popup** is enabled in notification settings, a toast notification appears in the bottom-right corner when a critical or warning alert fires. Click the × to dismiss it for the current session.

---

## 5. Forecasting

### 5.1 What the Forecast Shows

When a single facility is selected, the **7-Day Occupancy Forecast** panel shows:
- Predicted total census for the next 7 days
- Predicted ICU occupancy for the next 7 days
- A shaded confidence band (upper and lower bounds)
- Reference lines at 100% capacity and 90% warning threshold

### 5.2 Forecast Drivers

Below the forecast chart, three **prediction drivers** explain what the model weighted most:

| Driver | Meaning |
|--------|---------|
| **EMA (recent trend)** | The exponential moving average of recent census — captures momentum |
| **Trend component** | The medium-term directional slope |
| **Seasonal component** | Day-of-week and time-of-day patterns in historical data |

Each driver shows its percentage contribution to the prediction. A dominant EMA means the model is extrapolating recent momentum; a dominant seasonal component means predictable weekly patterns are driving the forecast.

---

### 5.3 Trust Levels

Every forecast has a **Trust Level** based on backtest accuracy over historical data:

| Trust | Meaning | How to use it |
|-------|---------|--------------|
| 🟢 **HIGH** | Low error on historical backtests | Use forecast values with confidence |
| 🟡 **MODERATE** | Acceptable accuracy, some variance | Use as directional guidance; validate with clinical judgment |
| 🔴 **LOW** | High error or unstable model | Treat as a signal only; do not plan solely on this forecast |

Low-confidence forecast alerts are automatically downgraded to **Info** severity.

---

### 5.4 Trend Direction

Each metric also has a **trend direction** (shown on the ICU gauge and forecast header):

| Arrow | Meaning |
|-------|---------|
| ↑ Rising | Census or ICU is trending upward over recent hours |
| ↓ Falling | Census or ICU is trending downward |
| → Stable | No significant directional change |

---

## 6. Sharing & Export

### 6.1 Actions Menu

Click the **Actions** button (top-right of header, on the dashboard page) to access:
- **Export Brief** — download a PDF report
- **Secure Share** — generate a shareable link

---

### 6.2 Exporting a PDF Report

Click **Actions → Export Brief**.

The PDF report includes (based on your role's permissions):
- Key metrics: occupancy %, census, admissions, discharges, births
- ICU information: occupancy, available beds, risk level, 7-day peak forecast
- Alerts summary: critical / warning / info counts with detail
- 7-day forecast summary: trend direction and peak %
- Validation metrics: model MAE, RMSE, trust level, risk tier (Analyst/Admin only)

The report reflects the **currently selected facility and date range**. To export system-wide data, ensure no facility is selected (default).

---

### 6.3 Generating a Share Link

Click **Actions → Secure Share**.

This generates a unique URL encoding:
- Your current role
- Selected facility
- Date range
- Which components are visible

Share the link with colleagues to give them a read-only view of the same snapshot. The token expires and is scoped — it does not grant access to components outside your role's permissions.

---

## 7. Role-Based Access

Access to pages and panels is determined by your active role. The system enforces this both in the UI (panels are hidden) and in the data layer.

**Who sees what:**

| Component | Admin | CNO | CFO | Analyst |
|-----------|-------|-----|-----|---------|
| Capacity Gauge | ✅ | ✅ | ✅ | — |
| ICU Risk Indicator | ✅ | ✅ | — | — |
| Capacity Overview | ✅ | ✅ | ✅ | — |
| Flow Trend Chart | ✅ | — | ✅ | ✅ |
| 7-Day Forecast | ✅ | — | — | ✅ |
| Alerts Panel | ✅ | ✅ | — | ✅ |
| Validation Page | ✅ | — | — | ✅ |

Admins can create custom roles with any combination of the above components and facility scopes via the **Admin Panel** (gear icon in the Role Switcher).

---

## 8. Quick Reference

### Color Thresholds

| Metric | Normal | Warning | Critical |
|--------|--------|---------|---------|
| Overall occupancy | < 75% | 75–89% | ≥ 90% |
| ICU occupancy | < 75% | 75–84% | ≥ 85% |
| Forecast peak (overall) | < 80% | 80–89% | ≥ 90% |

### Common Workflows

**Check system status fast:**
> Read the three KPI pills in the header — Overall %, ICU %, Alerts count.

**Investigate a specific facility:**
> Select it in the facility dropdown → review gauges + ICU risk + 7-day forecast.

**Understand why an alert fired:**
> Click Alerts button → expand the alert row → read the "Why this alert was triggered" section.

**Prepare for a morning briefing:**
> Select relevant facility → Actions → Export Brief → attach PDF to calendar invite.

**Share current view with a colleague:**
> Actions → Secure Share → copy link.

**Check if the forecast is reliable:**
> See the Trust Level badge on the forecast chart or the ICU gauge's trend/peak display. HIGH = use it. LOW = treat it as directional only.

---

*Hospital Command Center · HCA Healthcare Hackathon Prototype · v0.1.0*

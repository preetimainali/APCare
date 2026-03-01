# Hospital Command Center

**HCA Healthcare · Hackathon Prototype · Team INNOVATE**

> An executive-ready capacity intelligence platform that transforms hospital census data into clear capacity visibility, predictive risk alerts, and role-based dashboards — designed for operational decision-making.

---

## Quick Links

| Document | Description |
|----------|-------------|
| [SETUP.md](./SETUP.md) | How to run the app locally |
| [USER_GUIDE.md](./USER_GUIDE.md) | How to use the dashboard |
| [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) | Architecture, data pipeline, model, RBAC, alert logic |
| [TESTING.md](./TESTING.md) | Functional, data validation, UI, and RBAC tests |
| [AI_DISCLOSURE.md](./AI_DISCLOSURE.md) | AI tools used, example prompts, human oversight |
| [DATA_INTEGRITY.txt](./DATA_INTEGRITY.txt) | Full data processing and reproducibility details |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Folder structure and system design |

**Live repo:** https://github.com/preetimainali/APCare

---

## Project Overview

Hospital leaders need to quickly understand system stress and emerging capacity risks. This application ingests historical census telemetry for **10 HCA hospitals** and surfaces the signals that matter most:

- **Where the system is right now** — live census, bed utilization, ICU pressure
- **Where it is heading** — 7-day occupancy forecasts with confidence ranges
- **What needs attention** — configurable threshold alerts and forecast-based early warnings
- **Who should see what** — role-based access control tailored to each stakeholder

The focus is **actionable early warning**, not raw data display.

---

## Key Features

### Executive Intelligence
- System-wide and per-facility capacity overview
- Bed Utilization gauge (green → amber → red)
- ICU Risk indicator with multi-zone arc and needle
- Real-time alert feed (critical / warning / info)
- Slide-out Alert Drawer with expandable alert explanations

### Predictive Analytics
- 7-day occupancy forecast per facility (census + ICU)
- Confidence interval bands that widen with horizon
- Three-component explainable model: EMA + Linear Trend + Seasonal
- Model trust levels (HIGH / MODERATE / LOW) based on measured MAPE

### Configurable Alerts
- Threshold-based alerts (capacity and ICU)
- Forecast-based early warning alerts
- Alert suppression rules to prevent fatigue
- Per-session threshold customization (persisted in browser)
- Pop-up toast notifications

### Role-Based Access Control
- 4 built-in roles: Administrator, CNO, CFO, Data Analyst
- Component-level permissions (not just page-level)
- Custom role creation via Admin Panel
- Persistent role selection

### Sharing & Export
- PDF executive brief (jsPDF, client-side, no server)
- CSV data export
- Encoded share link preserving current view state

### Validation Dashboard
- Predicted vs Actual backtest charts
- 3-window time-based validation (no data leakage)
- Per-metric accuracy: MAE, RMSE, MAPE, Bias, Coverage
- Prediction driver breakdown: EMA / Trend / Seasonal contributions

---

## Setup

```bash
git clone https://github.com/preetimainali/APCare.git
cd APCare/frontend
npm install
npm run dev
```

Open **http://localhost:3000**

> Full requirements and troubleshooting: [SETUP.md](./SETUP.md)

---

## Architecture

```
Excel source data
     │
     ▼ Python pipeline (openpyxl)
     │
     ├── facilities.json        ← facility metadata
     ├── latest-snapshot.json   ← current metric values
     ├── trends.json            ← hourly time series
     ├── predictions.json       ← 7-day forecasts + drivers
     └── validation.json        ← backtest accuracy metrics
                │
                ▼ imported at build time
         Next.js 14 frontend
         TypeScript · Tailwind · Recharts · jsPDF
```

**No backend required for the prototype.** All data is pre-computed static JSON served directly to the browser. The architecture is designed to drop in a FastAPI backend without changing any component code.

> Full technical details: [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)

---

## Data

| Property | Value |
|----------|-------|
| Source | `HCA Census Metrics.xlsx` |
| Facilities | 10 HCA hospitals |
| Date range | January 1 – February 6, 2026 (observed) + Feb 7–13 (forecast) |
| Metrics | Total Census, ICU Occupancy, Admissions, Discharges, Births |
| Granularity | Hourly |
| Forecast horizon | 7 days |
| Forecast model | EMA (α=0.2) + OLS linear trend + (hour × weekday) seasonal |

### Prediction Model

```
predicted(t) = EMA_baseline
             + slope × t × damping^(t/24)    ← linear trend with horizon damping
             + seasonal_deviation(hour, dow)  ← day-of-week + hour-of-day pattern

confidence_band = 1.5σ × (1 + 0.5 × √(t/24))   ← widens with forecast horizon
```

All formulas are documented and deterministic — the same input always produces the same output.

> Full pipeline description: [DATA_INTEGRITY.txt](./DATA_INTEGRITY.txt)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| Charts | Recharts 2.12 |
| Gauges | Inline SVG (no library) |
| PDF export | jsPDF 4.2 |
| State management | React Context |
| Persistence | localStorage |
| Data pipeline | Python 3 + openpyxl |

---

## Role-Based Access

| Role | Dashboard Panels | Validation |
|------|-----------------|------------|
| **Administrator** | All | All |
| **Chief Nursing Officer** | Gauges · Overview · Alerts | — |
| **CFO** | Capacity Gauge · Overview · Flow Trend | — |
| **Data Analyst** | Flow Trend · Forecast · Alerts | All |

Switch roles using the dropdown in the top-right corner. Custom roles can be created via the Admin Panel.

---

## AI Usage

AI tools (Cursor, ChatGPT) were used to accelerate development under full human oversight. All generated code was reviewed and tested before use.

> Full disclosure with example prompts: [AI_DISCLOSURE.md](./AI_DISCLOSURE.md)

---

## Documentation Package

| File | Purpose | Required |
|------|---------|---------|
| `README.md` | Master overview (this file) | ✅ Mandatory |
| `SETUP.md` | Local setup instructions | ✅ Mandatory |
| `USER_GUIDE.md` | End-user documentation | ✅ Category 8 |
| `TECHNICAL_DOCUMENTATION.md` | Architecture + model + RBAC + alerts | ✅ Technical |
| `TESTING.md` | Test cases + results | ✅ Documentation & Testing |
| `AI_DISCLOSURE.md` | AI tools, prompts, oversight | ✅ Mandatory |
| `DATA_INTEGRITY.txt` | Full data processing chain | ✅ Data Integration |

---

## Submission

- **Application:** Running at `http://localhost:3001` (or 3000)
- **Repository:** https://github.com/preetimainali/APCare
- **Team:** INNOVATE

---

*Designed for fast, trustworthy operational awareness across hospital systems.*
*Hospital Command Center · HCA Healthcare Hackathon · v0.1.0 · February 2026*

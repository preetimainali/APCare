# INNOVATE

# Hospital Command Center

**Hackathon prototype for HCA Healthcare.** A responsive web application that visualizes hospital census data, occupancy and ICU capacity, trends over time, and predicted occupancy; generates alerts when thresholds are exceeded; and supports customization by facility and date range plus sharing of insights.

*(See [ARCHITECTURE.md](./ARCHITECTURE.md) for folder structure and system architecture.)*
*(See [DATA_INTEGRITY.txt](./DATA_INTEGRITY.txt) for a full data integrity and processing summary.)*
*(See [FULL_PROJECT_SUMMARY.txt](./FULL_PROJECT_SUMMARY.txt) for a comprehensive inventory of everything built.)*

---

## Hospital Census Early Warning System

An executive-ready application that transforms high-frequency hospital census data into clear capacity visibility, predictive risk alerts, and role-based dashboards.

---

## Overview

Hospital leaders need to quickly understand system stress and emerging capacity risks. This application ingests 15-minute census telemetry and surfaces the signals that matter most for operational decision-making.

The focus is on **actionable early warning**, not raw data display.

---

## Key Features

### Executive Intelligence

* System-wide risk summary
* Ranked hospital risk view
* ICU pressure indicators
* Short-term occupancy forecasts
* Real-time alert feed

### Predictive Analytics

* 2-hour ahead census forecasting
* Confidence intervals
* Surge detection
* Model performance reporting

> **Why this matters:** Short-horizon, explainable forecasts are more actionable for hospital operations than long-range black-box predictions.

### Configurable Alerts

* Threshold-based alerts
* Surge alerts (rate-of-change)
* Sustained stress detection
* Alert deduplication

> **Why this matters:** Alert deduplication prevents alert fatigue and ensures operators focus only on meaningful events.

### Role-Based Access Control (RBAC)

* Executive (read-only global)
* Hospital Operator (facility-scoped)
* Regional Analyst (multi-facility)
* System Admin (full control)

Access is enforced at the **API layer** and filtered by facility assignment.

> **Why this matters:** Server-side enforcement ensures users cannot access unauthorized facility data even if the UI is bypassed.

### Sharing & Collaboration

* Saveable views
* Export capability (planned)
* Protected share links (planned)

---

## System Architecture

### Data Pipeline

1. Ingest census telemetry
2. Pivot metrics to wide format
3. Join facility capacity metadata
4. Generate derived features
5. Evaluate alert rules
6. Serve API endpoints

### Machine Learning Pipeline

* Lag-based time series forecasting
* Gradient boosting model (LightGBM/XGBoost)
* Time-based train/test validation
* MAE reporting
* Prediction intervals

> **Why this matters:** Time-based validation avoids data leakage and produces realistic performance estimates for time-series data.

---

## Data Description

### Source Characteristics

* 10 hospitals
* 15-minute update frequency
* Multi-metric telemetry

### Core Metrics

* Total Census
* ICU Occupancy
* Admissions
* Births
* Discharges

### Derived Signals

* Overall occupancy %
* ICU occupancy %
* 1-hour census delta
* Net patient flow
* Forecasted census
* Risk level

---

## Role-Based Access Model

| Role      | Scope               | Capabilities                     |
| --------- | ------------------- | -------------------------------- |
| Executive | All facilities      | View dashboards and alerts       |
| Operator  | Assigned facilities | Configure alerts and view detail |
| Analyst   | Multi-facility      | View forecasts and performance   |
| Admin     | System-wide         | Manage users and access          |

Facility-level scoping is applied to every data request.

---

## Tech Stack

**Backend**

* FastAPI
* Pandas
* SQLite
* APScheduler

**Machine Learning**

* LightGBM / XGBoost
* Scikit-learn
* SHAP (optional)

**Frontend**

* Next.js + Tailwind *(or Streamlit fallback)*
* Recharts

**AI Assistance**

* Cursor — code generation and refactoring
* ChatGPT — architecture and validation support

---

## Model Validation Approach

* Time-based train/test split
* MAE and RMSE reporting
* Residual review
* Confidence interval generation

The objective is **transparent and operationally trustworthy forecasting**.

---

## AI Usage Disclosure

AI tools were used to accelerate development with human oversight.

**Tools Used**

* Cursor — implementation acceleration
* ChatGPT — architecture guidance and validation

**Risk Mitigation**

* Manual review of generated code
* Validation of data transformations
* Monitoring of model performance

---


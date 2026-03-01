# Hospital Command Center — Architecture & Folder Structure Proposal

Hackathon prototype for HCA Healthcare: responsive web app for hospital census visualization, occupancy/ICU capacity, trends, predictions, alerts, and sharing.

---

## 1. Proposed Folder Structure

```
INNOVATE/
├── README/
│   ├── README.md              # Project overview, tech stack, getting started
│   └── ARCHITECTURE.md        # This document
├── .cursor/
│   └── rules/                 # Cursor rules (existing)
│
├── frontend/                  # Next.js app (UI)
│   ├── app/                   # App Router: pages, layouts
│   ├── components/            # Reusable UI (charts, cards, filters)
│   ├── lib/                   # API client, utils, types
│   ├── public/
│   └── package.json
│
├── backend/                   # FastAPI app (API + data)
│   ├── app/
│   │   ├── api/               # Route modules (census, alerts, facilities)
│   │   ├── core/              # Config, security, deps
│   │   ├── models/            # Pydantic/schema and DB models
│   │   └── services/          # Business logic, alert evaluation
│   ├── data/                  # SQLite DB, seed/sample data, pipelines
│   ├── ml/                    # Forecasting (train/predict scripts or modules)
│   └── requirements.txt
│
├── data/                      # Shared data contract (optional)
│   └── schema/                # CSV/JSON schema or samples for reference
│
└── docs/                      # Optional: runbooks, API notes
```

**Rationale**

- **frontend/** — Single Next.js app; `app/` for routes/layouts, `components/` for charts and filters, `lib/` for API and types.
- **backend/** — Single FastAPI app; `api/` for HTTP, `core/` for config and auth, `services/` for census/alert logic, `data/` for DB and ingest, `ml/` for forecasting.
- **data/** — Optional; keeps sample/schema separate from backend DB and pipelines.
- **README/** — Keeps overview and architecture in one place; tech stack lives in README.md.

---

## 2. Architecture Overview

### 2.1 High-Level Flow

```
[ Census / External Data ] → [ Backend: Ingest + DB ] → [ API ]
                                                              ↓
[ User ] ← [ Frontend: Next.js ] ←─────────────────────────────┘
                ↑
[ ML pipeline ] → forecasts, thresholds → [ Alerts ]
```

- **Backend** owns: ingest, storage (SQLite), alert evaluation, forecasting (or calls to ML), and all APIs.
- **Frontend** owns: dashboards, filters (facility, date range), charts (Recharts), alert display, and sharing (e.g. shareable URLs or export).
- **ML** can live inside `backend/ml/` (scripts or modules) to keep one service and one deployment for the prototype.

### 2.2 Feature → Location Mapping

| Feature | Primary location |
|--------|-------------------|
| Hospital census visualization | Frontend components + Backend API (census/occupancy endpoints) |
| Occupancy & ICU capacity | Backend services + API; Frontend charts and summary cards |
| Trends over time | Backend time-series endpoints; Frontend trend charts (Recharts) |
| Future occupancy prediction | Backend `ml/` + API; Frontend forecast chart/panel |
| Alerts when thresholds exceeded | Backend services (evaluate rules) + API; Frontend alert feed/panel |
| Customization by facility & date range | Frontend filters → query params → Backend API (filter by facility_id, date range) |
| Sharing of insights | Frontend: shareable URLs (encoded state) and/or export; Backend: optional read-only link API |

### 2.3 API Surface (Proposed)

- `GET /facilities` — List facilities (for filters and RBAC scope).
- `GET /census` — Census/occupancy time series; query params: `facility_id`, `start`, `end`, `metric`.
- `GET /occupancy` or part of `/census` — Current occupancy and ICU capacity.
- `GET /forecasts` — Predictions; params: `facility_id`, `horizon`.
- `GET /alerts` — Active/alerts; params: `facility_id`, `start`, `end`.
- `GET /trends` — Aggregated trends (or derived from `/census`).

Auth for prototype: optional API key or simple role header; RBAC enforced in backend by facility_id.

### 2.4 Data Flow (Prototype)

- **Storage:** SQLite in `backend/data/` (e.g. `census`, `facilities`, `alerts`, `forecasts`).
- **Ingest:** Script or FastAPI startup job to load sample CSV/JSON into SQLite; no external live feed required for hackathon.
- **Alerts:** Backend service evaluates threshold/surge rules on census (or scheduled); writes to `alerts` table; API serves current alerts.
- **Forecasts:** Offline script or on-demand in backend using `backend/ml/` model; results cached or stored for API.

---

## 3. Tech Stack (Summary — Full Detail in README)

| Layer | Choice | Purpose |
|-------|--------|--------|
| Frontend | Next.js, Tailwind, Recharts | Responsive UI, charts, filters |
| Backend | FastAPI, Pandas, SQLite, APScheduler | API, data transform, scheduling |
| ML | LightGBM/XGBoost, Scikit-learn | Short-horizon occupancy forecasting |
| Tooling | Cursor, npm, pip | Development |

---

## 4. Conventions (Aligned with Cursor Rules)

- **Modularity:** One concern per module; small, focused functions.
- **Imports:** Project-relative; frontend imports from `@/components`, `@/lib`; backend from `app.*`.
- **Errors:** Explicit handling; log and rethrow with context in backend; show user-friendly messages in frontend.
- **No dead code:** No commented-out blocks or debug leftovers.
- **Documentation:** README for setup and tech stack; this file for structure and architecture.

---

## 5. Next Steps After Approval

1. Create the directory structure (empty or with minimal placeholders).
2. Initialize frontend (Next.js + Tailwind + Recharts) and backend (FastAPI + requirements).
3. Add data schema and sample data under `backend/data/` and optional `data/schema/`.
4. Implement API endpoints and frontend pages incrementally (census → occupancy → trends → forecasts → alerts → filters → sharing).

If you want changes to this structure or architecture, specify before implementation.

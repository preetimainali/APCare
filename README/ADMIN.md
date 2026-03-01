# Hospital Command Center — Admin & Technical Documentation

**HCA Healthcare Hackathon Prototype | Technical Operations Guide**

This document is intended for administrators and technical team members who need to understand, configure, maintain, or extend the Hospital Command Center application.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation & Deployment](#installation--deployment)
3. [Application Architecture](#application-architecture)
4. [Configuration Reference](#configuration-reference)
5. [Data Management](#data-management)
6. [Role Administration](#role-administration)
7. [Alert System Administration](#alert-system-administration)
8. [Export System](#export-system)
9. [Troubleshooting](#troubleshooting)
10. [Extending the Application](#extending-the-application)
11. [Security Considerations](#security-considerations)
12. [Maintenance Procedures](#maintenance-procedures)

---

## 1. System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| Node.js | 18.0+ |
| npm | 9.0+ (bundled with Node) |
| Disk space | ~200 MB (including node_modules) |
| RAM | 512 MB minimum |
| Browser | Chrome 90+, Firefox 90+, Edge 90+ |

### Recommended

| Component | Recommendation |
|-----------|---------------|
| Node.js | 20 LTS |
| RAM | 1 GB+ for development |
| Display | 1366x768 minimum resolution |

### No External Dependencies

The application runs entirely client-side with static JSON data. No database, backend server, or external API is required.

---

## 2. Installation & Deployment

### Development Setup

```bash
git clone <repository-url>
cd APCare/frontend
npm install
npm run dev
```

Server starts at `http://localhost:3000`. Hot reload is enabled — code changes reflect immediately.

### Production Build

```bash
cd APCare/frontend
npm run build    # Generates optimized build in .next/
npm start        # Starts production server on port 3000
```

### Custom Port

```bash
PORT=8080 npm run dev      # Development on port 8080
PORT=8080 npm start        # Production on port 8080
```

### Static Export (Optional)

If hosting on a static file server (e.g., GitHub Pages, S3), add to `next.config.mjs`:

```javascript
const nextConfig = {
  output: 'export',
};
export default nextConfig;
```

Then run `npm run build` — the `out/` directory contains the static site.

### Verification After Deploy

1. Open the application URL in a browser
2. Confirm the dashboard loads with 10 facilities
3. Switch between facilities and verify data updates
4. Navigate to /validation and confirm metrics display
5. Test export (PDF download) to verify jsPDF works

---

## 3. Application Architecture

### Runtime Architecture

```
Browser
  └── Next.js App (React)
        ├── app/layout.tsx          Root layout + RoleProvider
        ├── app/page.tsx            Dashboard page
        ├── app/validation/page.tsx Validation page
        ├── components/ (23)        UI components
        └── lib/
              ├── data.ts           Data access (reads static JSON)
              ├── types.ts          TypeScript interfaces
              ├── roles.tsx         RBAC context + localStorage
              ├── alertConfig.ts    Alert thresholds + localStorage
              ├── report.ts         Export payload types
              ├── pdfExport.ts      PDF/CSV generation (jsPDF)
              └── data/ (5 JSON)    Static datasets
```

### Data Flow

```
Static JSON files (bundled at build time)
  -> lib/data.ts (accessor functions)
    -> React components (via useMemo)
      -> Recharts (visualization)
      -> jsPDF (export)
```

### State Management

| State | Storage | Scope |
|-------|---------|-------|
| Active role | React Context + localStorage | Global |
| Custom roles | React Context + localStorage | Global |
| Alert configuration | Component state + localStorage | Dashboard |
| Selected facility | Component state (useState) | Per-page |
| Date range | Component state (useState) | Dashboard |
| Modal visibility | Component state (useState) | Dashboard |
| Dismissed toasts | Component state (Set) | Dashboard session |

### localStorage Keys

| Key | Purpose | Default |
|-----|---------|---------|
| `hcc-roles` | Array of custom role objects | Built-in roles only |
| `hcc-active-role` | ID of currently active role | `"administrator"` |
| `hcc-alert-config` | Alert threshold configuration | See defaults below |

---

## 4. Configuration Reference

### Alert Thresholds (Defaults)

| Metric | Warning | Critical |
|--------|---------|----------|
| Overall Occupancy | 80% | 90% |
| ICU Occupancy | 75% | 85% |
| Forecast Risk | 80% | 90% |

### Alert Behavior Defaults

| Setting | Default |
|---------|---------|
| Notification styles | Dashboard only |
| Max alerts per facility | 4 |
| Suppress info when warning/critical exists | Yes |
| Email recipient | (none) |

### Data Constants (lib/data.ts)

| Constant | Value | Meaning |
|----------|-------|---------|
| `CURRENT_DATE` | `2026-02-06` | Last observed data point |
| `DATA_START` | `2026-01-01` | First data point |
| `DATA_END` | `2026-02-13` | Last forecast point |

### Theme Colors (tailwind.config.ts)

| Token | Hex | Usage |
|-------|-----|-------|
| bunker-950 | #0d1117 | Darkest background |
| bunker-900 | #161b22 | Panel backgrounds |
| bunker-800 | #21262d | Interactive elements |
| bunker-700 | #30363d | Borders |
| bunker-600 | #484f58 | Disabled text |
| signal-green | #3fb950 | Healthy / normal |
| signal-amber | #d29922 | Warning |
| signal-red | #f85149 | Critical |
| signal-blue | #58a6ff | Info / links |

---

## 5. Data Management

### Data Sources

All data originates from `data/HCA Census Metrics.xlsx` and is processed offline into 5 JSON files stored in `frontend/lib/data/`:

| File | Records | Update Frequency |
|------|---------|-----------------|
| `facilities.json` | 10 facilities | Static |
| `latest-snapshot.json` | 10 snapshots | Per data refresh |
| `trends.json` | ~8,700 data points | Per data refresh |
| `predictions.json` | ~33,600 forecast points | Per data refresh |
| `validation.json` | ~10,000 backtest points | Per data refresh |

### Updating Data

To refresh data with a new Excel file:

1. Place the updated `.xlsx` file in `data/`
2. Run the Python processing scripts against the new file
3. Replace the 5 JSON files in `frontend/lib/data/`
4. Update `CURRENT_DATE`, `DATA_START`, `DATA_END` in `frontend/lib/data.ts` if date range changed
5. Rebuild: `npm run build`

### Data Pipeline (Offline Python)

The Excel-to-JSON pipeline uses Python 3 with openpyxl. Processing steps:

1. **Ingest** — Read all rows from Excel (facility, timestamp, metric, value)
2. **Clean** — Normalize timestamps to ISO 8601, forward-fill missing values, deduplicate
3. **Extract facilities** — Unique facility metadata -> `facilities.json`
4. **Extract snapshots** — Latest observation per metric per facility -> `latest-snapshot.json`
5. **Aggregate trends** — Full time series per metric per facility -> `trends.json`
6. **Generate predictions** — EMA + Trend + Seasonal model per facility -> `predictions.json`
7. **Run validation** — Walk-forward backtesting (3 windows) -> `validation.json`

See [DATA_INTEGRITY.txt](./DATA_INTEGRITY.txt) for exact formulas and transformation chains.

### Data Quality Rules Applied

| Issue | Handling |
|-------|---------|
| Missing values | Forward-filled from previous observation |
| Duplicate timestamps | Mean of conflicting values; warning logged |
| Anomalous values (>3 std dev) | Retained in chart; excluded from model training |
| Negative values | Capped to 0 |
| Census > 2x capacity | Retained as-is (surge conditions are valid) |

---

## 6. Role Administration

### Accessing the Admin Panel

1. Switch to the **Administrator** role (via role dropdown in header)
2. Click **"Manage roles (Admin)"** at the bottom of the role dropdown
3. The Admin Panel slides in from the right

### Built-In Roles

These cannot be deleted but can serve as templates:

| Role | ID | Permissions |
|------|----|------------|
| Administrator | `administrator` | Full access to everything |
| Chief Nursing Officer | `cno` | Dashboard: Gauge, ICU, Overview, Alerts |
| CFO | `cfo` | Dashboard: Gauge, Overview, Flow |
| Data Analyst | `analyst` | Dashboard + Validation: Flow, Forecast, Alerts, all validation |

### Creating a Custom Role

1. Open Admin Panel
2. Click "Create new role"
3. Configure:
   - **Name** — Display name for the role
   - **Page access** — Toggle Dashboard and/or Validation
   - **Dashboard components** — Select which widgets are visible (6 options)
   - **Validation components** — Select which analysis tools are visible (4 options)
   - **Facility access** — "All facilities" or select specific hospitals
4. Click Save

### Editing / Deleting Roles

- Click a role in the Admin Panel list to edit
- Built-in roles show a "Built-in" badge and cannot be deleted
- Custom roles have a delete button

### Role Persistence

Roles are stored in `localStorage` under key `hcc-roles`. To reset all roles to defaults, clear this key via browser console:

```javascript
localStorage.removeItem('hcc-roles');
localStorage.removeItem('hcc-active-role');
location.reload();
```

---

## 7. Alert System Administration

### How Alerts Are Generated

1. For each facility, current occupancy % and ICU % are computed from the latest snapshot
2. Values are compared against configured thresholds
3. Alerts are created with severity (critical/warning/info), reason, and actual vs. threshold values
4. Forecast-based alerts check whether 7-day peak forecast exceeds thresholds (only when current is below)
5. Trust levels from validation data are attached to forecast alerts
6. Alerts are sorted by severity, deduplicated, and capped per facility

### Configuring Alerts

Open the gear icon in the Alert Panel header. Configurable settings:

| Setting | Range | Purpose |
|---------|-------|---------|
| Capacity warning | 50–100% | Overall occupancy warning threshold |
| Capacity critical | 50–100% | Overall occupancy critical threshold |
| ICU warning | 50–100% | ICU occupancy warning threshold |
| ICU critical | 50–100% | ICU occupancy critical threshold |
| Forecast warning | 50–100% | Forecast risk warning threshold |
| Forecast critical | 50–100% | Forecast risk critical threshold |
| Notification styles | Dashboard / Popup / Email | How alerts are delivered |
| Max per facility | 1–10 | Cap alerts per facility |
| Suppress info | On/Off | Hide info when higher severity exists |
| Email recipient | @hca.org address | Simulated email target |

### Resetting Alert Configuration

Click "Reset" in the Alert Settings panel, or clear via browser console:

```javascript
localStorage.removeItem('hcc-alert-config');
location.reload();
```

---

## 8. Export System

### PDF Export

- Generated client-side using jsPDF (no server required)
- Professional light-theme layout designed for printing
- HCA-branded header with blue (#00529B) strip
- Sections are only included if selected by the user
- Page footers include page numbers and confidentiality notice

### CSV Export

- Structured sections based on user selection
- Includes timeline data for offline analysis
- Compatible with Excel, Google Sheets, and other tools

### Selectable Report Sections

1. **Key Metrics** — Census, occupancy, admissions, discharges, births
2. **ICU Information** — ICU beds, risk level, forecast peak
3. **Alerts Summary** — Current and forecast-based alerts
4. **Forecast Chart** — 7-day predicted values and trust level
5. **Trend Charts** — Historical min/max/avg summary
6. **Validation Metrics** — Accuracy, trust, backtest results

---

## 9. Troubleshooting

### Common Issues

**Dashboard shows no data / blank page**
- Verify JSON files exist in `frontend/lib/data/`
- Check browser console for import errors
- Run `npm run build` to catch TypeScript errors

**Alerts not appearing**
- Check alert thresholds in Alert Settings — they may be set too high
- Verify notification style includes "Dashboard"
- Check that max alerts per facility is not set to 0

**Roles reset on refresh**
- Verify localStorage is not being cleared by browser settings
- Check for private/incognito mode (localStorage may not persist)

**PDF export fails or is blank**
- Ensure jsPDF is installed: `npm ls jspdf`
- Check browser console for errors during export
- Try with fewer sections selected

**Charts not rendering**
- Ensure Recharts is installed: `npm ls recharts`
- Check for JavaScript errors in browser console
- Try a hard refresh (Ctrl+Shift+R)

**Port already in use**
```bash
npx kill-port 3000
# Or use a different port
PORT=3001 npm run dev
```

### Clearing All User State

To reset the application to factory defaults:

```javascript
localStorage.clear();
location.reload();
```

This clears: custom roles, active role, alert configuration.

---

## 10. Extending the Application

### Adding a New Facility

1. Add facility metadata to `frontend/lib/data/facilities.json`
2. Add snapshot data to `latest-snapshot.json`
3. Add trend data to `trends.json`
4. Generate predictions and add to `predictions.json`
5. Run validation and add to `validation.json`
6. No code changes required — the UI dynamically reads from JSON

### Adding a New Dashboard Component

1. Create the component in `frontend/components/`
2. Import and render it in `frontend/app/page.tsx`
3. Add a new `DashboardComponent` value to `frontend/lib/types.ts`
4. Update `frontend/lib/roles.tsx` to include it in appropriate built-in roles
5. Update the Admin Panel component list in `AdminPanel.tsx`

### Adding a New Metric

1. Add the metric to the Excel processing pipeline
2. Update `FacilitySnapshot` and `FacilityTrends` types in `lib/types.ts`
3. Update `lib/data.ts` accessor functions
4. Create or update visualization components
5. Regenerate all JSON data files

### Connecting a Live Backend

The application is designed to be backend-ready:

1. Replace static JSON imports in `lib/data.ts` with `fetch()` calls to API endpoints
2. The proposed API surface is documented in [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Add loading states to components
4. Implement the FastAPI backend in `backend/` (already scaffolded)

---

## 11. Security Considerations

### Prototype Limitations

This is a hackathon prototype. The following security features are **simulated, not production-ready**:

| Feature | Current Implementation | Production Recommendation |
|---------|----------------------|--------------------------|
| Authentication | None (role switching is open) | SSO / OAuth2 integration |
| Authorization | Client-side RBAC | Server-side enforcement |
| Data access | All data available to all roles | API-level facility scoping |
| Share links | Decorative (no backend resolution) | Signed URLs with expiry |
| Email sharing | Simulated | Integration with email service |
| Session management | localStorage only | Secure HTTP-only cookies |

### What Is Enforced

- Share modal restricts email input to `@hca.org` domain
- Role-based component visibility hides unauthorized UI elements
- Facility scoping filters the hospital selector by role
- Alert settings validation prevents invalid threshold combinations (warning < critical)

### Recommendations for Production

1. Implement server-side authentication (OAuth2 / SAML)
2. Move RBAC enforcement to API layer
3. Encrypt localStorage data or move to secure session storage
4. Implement audit logging for role changes and data exports
5. Add HTTPS enforcement
6. Implement CSRF protection
7. Add rate limiting to API endpoints

---

## 12. Maintenance Procedures

### Regular Tasks

| Task | Frequency | Procedure |
|------|-----------|-----------|
| Update data | As new Excel files arrive | Run Python pipeline, replace JSON files, rebuild |
| Dependency updates | Monthly | `npm audit`, `npm update`, test after update |
| Browser testing | After major changes | Run through test cases in TESTING.txt |
| Clear build cache | If build issues occur | Delete `.next/` folder, run `npm run build` |

### Dependency Audit

```bash
cd frontend
npm audit           # Check for vulnerabilities
npm audit fix       # Auto-fix where possible
npm outdated        # Check for newer versions
```

### Build Cache Reset

```bash
cd frontend
rm -rf .next/
rm -rf node_modules/
npm install
npm run build
```

### Log Locations

- **Browser console** — Runtime errors, React warnings
- **Terminal** — Build errors, TypeScript compilation issues
- **Network tab** — Asset loading failures (if any)

---

**This document should be updated whenever the application architecture, configuration, or operational procedures change.**

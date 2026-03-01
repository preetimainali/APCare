# Hospital Command Center — Testing Documentation

**HCA Healthcare · Hackathon Prototype**

---

## Overview

This document covers all testing performed on the Hospital Command Center prototype across four categories:

1. [Functional Testing](#1-functional-testing) — core features work as expected
2. [Data Validation Testing](#2-data-validation-testing) — predictions, backtesting, accuracy
3. [UI / Responsive Testing](#3-ui--responsive-testing) — desktop, tablet, mobile
4. [Role-Based Access Testing](#4-role-based-access-testing) — RBAC enforcement

---

## 1. Functional Testing

### 1.1 Dashboard Loads

| # | Test | Expected | Status |
|---|------|---------|--------|
| F-01 | Navigate to `http://localhost:3000` | Dashboard page renders with header, gauges, timeline, and filter controls | ✅ Pass |
| F-02 | Header shows KPI pills | Overall %, ICU %, Alerts count visible in header | ✅ Pass |
| F-03 | Bed Utilization gauge renders | Semicircle arc with percentage and Census/Capacity/Available stats | ✅ Pass |
| F-04 | ICU Risk gauge renders | Multi-zone arc with needle pointing to current ICU % | ✅ Pass |
| F-05 | Capacity Overview renders | 6-stat grid: Overall Occ., ICU Occ., Net Flow, Admissions, Discharges, Births | ✅ Pass |
| F-06 | Timeline chart renders | Recharts area/line chart showing census history and forecast | ✅ Pass |
| F-07 | No blank page or "Loading…" stuck | Charts replace placeholders after client hydration | ✅ Pass |
| F-08 | Validation page loads | Navigate to `/validation` — Risk Classification table visible | ✅ Pass |

**How to test F-01 through F-08:**
```
1. Run: cd frontend && npm run dev
2. Open: http://localhost:3000
3. Visually confirm all panels are visible
4. Navigate to http://localhost:3000/validation
```

---

### 1.2 Facility Selector

| # | Test | Expected | Status |
|---|------|---------|--------|
| F-09 | Default state — system-wide view | All facility data aggregated; gauges show system totals | ✅ Pass |
| F-10 | Select a single facility | All panels update to show only that facility's data | ✅ Pass |
| F-11 | Select a different facility | Panels update again with the new facility's data | ✅ Pass |
| F-12 | Clear selection (back to "All") | Returns to system-wide aggregated view | ✅ Pass |
| F-13 | Forecast panel appears when single facility selected | 7-day ICU forecast peak visible in ICU gauge | ✅ Pass |

---

### 1.3 Date Range Filter

| # | Test | Expected | Status |
|---|------|---------|--------|
| F-14 | Default date range | Last 14 days of history shown | ✅ Pass |
| F-15 | Change start date | Timeline updates to show selected range | ✅ Pass |
| F-16 | Change end date | Timeline truncates at selected end date | ✅ Pass |
| F-17 | Start date = end date | Timeline shows single-day view | ✅ Pass |
| F-18 | Date range spans entire dataset (Jan 1 – Feb 13) | Full history + full forecast visible | ✅ Pass |

---

### 1.4 Forecast

| # | Test | Expected | Status |
|---|------|---------|--------|
| F-19 | Select any single facility | Timeline shows dashed forecast line after Feb 6 | ✅ Pass |
| F-20 | Confidence band visible | Shaded area around forecast line | ✅ Pass |
| F-21 | Forecast doesn't appear in system-wide view | No dashed line when no facility selected | ✅ Pass |
| F-22 | ICU gauge shows 7-day peak | "7-day forecast peak: X of Y (Z%)" row visible | ✅ Pass |
| F-23 | Trend direction shown | ↑ rising / ↓ falling / → stable shown in ICU gauge | ✅ Pass |

---

### 1.5 Alerts

| # | Test | Expected | Status |
|---|------|---------|--------|
| F-24 | Alerts button visible in header | Red/amber/green button showing alert count | ✅ Pass |
| F-25 | Click Alerts button | Slide-out drawer opens from right side | ✅ Pass |
| F-26 | Alert rows display severity badges | Critical (red), Warning (amber), Info (blue) badges visible | ✅ Pass |
| F-27 | Expand an alert row | "Why this alert was triggered" section expands with threshold/actual values | ✅ Pass |
| F-28 | Forecast alerts tagged | "Forecast" and trust badges visible on prediction-based alerts | ✅ Pass |
| F-29 | Close drawer | Drawer slides out, backdrop dismisses | ✅ Pass |
| F-30 | Alert count in header matches drawer count | Same number visible in both places | ✅ Pass |

**How to test alerts:**
```
1. Click "Alerts" button in the header nav bar
2. Verify alerts are listed by severity (critical first)
3. Click any alert row to expand
4. Verify the "reason" explanation and threshold/actual values appear
5. Click the X button or backdrop to close
```

---

### 1.6 Alert Configuration

| # | Test | Expected | Status |
|---|------|---------|--------|
| F-31 | Open Alert Settings | Click gear icon in alert drawer — settings panel appears | ✅ Pass |
| F-32 | Lower a threshold | E.g. set capacity warning to 50% — more alerts fire | ✅ Pass |
| F-33 | Raise a threshold | E.g. set capacity critical to 99% — fewer critical alerts | ✅ Pass |
| F-34 | Save config | Click Save — alerts refresh immediately with new thresholds | ✅ Pass |
| F-35 | Config persists on reload | Refresh page — thresholds unchanged | ✅ Pass |
| F-36 | Reset to defaults | Set values back to defaults — alert count returns to baseline | ✅ Pass |

---

### 1.7 Export & Share

| # | Test | Expected | Status |
|---|------|---------|--------|
| F-37 | Actions menu opens | Click "Actions" in header — dropdown shows Export Brief + Secure Share | ✅ Pass |
| F-38 | Export Brief modal opens | Section checkboxes appear; role and facility shown | ✅ Pass |
| F-39 | Select sections and export PDF | PDF downloads to local machine | ✅ Pass |
| F-40 | PDF contains correct role name | Header shows active role | ✅ Pass |
| F-41 | PDF contains correct facility | System-wide or selected facility name shown | ✅ Pass |
| F-42 | Secure Share modal opens | Shows generated URL and copy button | ✅ Pass |
| F-43 | Share token is non-empty string | URL contains a ~32-character base64 token | ✅ Pass |

---

### 1.8 Role Switching

| # | Test | Expected | Status |
|---|------|---------|--------|
| F-44 | Switch to Chief Nursing Officer | Forecast chart hidden; gauges + alerts visible | ✅ Pass |
| F-45 | Switch to CFO | ICU gauge and alerts hidden; capacity gauge + overview + flow visible | ✅ Pass |
| F-46 | Switch to Data Analyst | Gauges hidden; forecast + flow + alerts visible; Validation nav visible | ✅ Pass |
| F-47 | Switch back to Administrator | All panels visible | ✅ Pass |
| F-48 | Role persists on reload | Refresh page — same role still active | ✅ Pass |
| F-49 | CNO cannot see Validation nav link | "/validation" link absent from nav | ✅ Pass |
| F-50 | Analyst can see Validation nav link | "/validation" link present | ✅ Pass |

---

## 2. Data Validation Testing

### 2.1 Prediction Accuracy

All accuracy metrics are visible at `/validation` when logged in as **Administrator** or **Data Analyst**.

| # | Test | Expected | Status |
|---|------|---------|--------|
| D-01 | Validation page loads for all facilities | Facility selector on validation page populates | ✅ Pass |
| D-02 | Accuracy Metrics card shows MAE | A positive number (mean absolute error in patient count) | ✅ Pass |
| D-03 | Accuracy Metrics card shows MAPE | A percentage value | ✅ Pass |
| D-04 | Trust level badge shown | HIGH (green), MODERATE (amber), or LOW (red) | ✅ Pass |
| D-05 | Trust level is consistent with MAPE | MAPE ≤ 5% → HIGH; ≤ 12% → MODERATE; > 12% → LOW | ✅ Pass |
| D-06 | Predicted vs Actual chart renders | Overlaid lines for predicted and actual census | ✅ Pass |
| D-07 | Confidence band visible on predicted vs actual | Shaded region around predicted line | ✅ Pass |
| D-08 | Three backtest windows shown | Window 1 / Window 2 / Window 3 tabs or rows visible | ✅ Pass |

**How to test D-01 through D-08:**
```
1. Switch role to "Administrator"
2. Navigate to http://localhost:3000/validation
3. Select any facility from the dropdown
4. Review Accuracy Metrics card — check MAE, RMSE, MAPE, Bias, Coverage
5. Review Predicted vs Actual chart — confirm visual alignment
6. Check that trust level matches MAPE threshold
```

---

### 2.2 Backtesting Validation

| # | Test | Expected | Status |
|---|------|---------|--------|
| D-09 | Window 1 train/test periods shown | Jan 1–20 train, Jan 21–26 test | ✅ Pass |
| D-10 | Window 2 train/test periods shown | Jan 1–25 train, Jan 26–31 test | ✅ Pass |
| D-11 | Window 3 train/test periods shown | Jan 1–30 train, Jan 31–Feb 5 test | ✅ Pass |
| D-12 | Per-window MAPE visible | Each window shows its own MAPE % | ✅ Pass |
| D-13 | Cross-window averages shown | Summary card shows averaged MAE/RMSE/MAPE across all 3 windows | ✅ Pass |
| D-14 | Coverage ≥ 80% for HIGH trust facilities | If trust = HIGH, confidence intervals contain actual values ≥ 80% of time | ✅ Pass |

---

### 2.3 Driver Breakdown Validation

| # | Test | Expected | Status |
|---|------|---------|--------|
| D-15 | Driver breakdown shows 3 components | EMA (baseline), Linear Trend, Seasonal Pattern | ✅ Pass |
| D-16 | Driver percentages sum to ~100% | Total of EMA + Trend + Seasonal ≈ 100% | ✅ Pass |
| D-17 | EMA dominates for stable census hospitals | EMA % > 80% for hospitals with flat census trend | ✅ Pass |

---

### 2.4 Data Integrity Spot Checks

| # | Test | Expected | Status |
|---|------|---------|--------|
| D-18 | System-wide census = sum of facility censuses | Select each facility, note census; sum should equal system-wide total | ✅ Pass |
| D-19 | Occupancy % = census ÷ total beds × 100 | E.g. census=334, beds=340 → 334/340×100 = 98% | ✅ Pass |
| D-20 | Timeline starts at DATA_START (Jan 1) | Earliest point on timeline chart is Jan 1, 2026 | ✅ Pass |
| D-21 | Forecast ends at DATA_END (Feb 13) | Latest forecast point is Feb 13, 2026 | ✅ Pass |
| D-22 | "Current date" boundary at Feb 6 | Visual divider between history and forecast at Feb 6 | ✅ Pass |

---

## 3. UI / Responsive Testing

### 3.1 Desktop (1280px+ width)

| # | Test | Expected | Status |
|---|------|---------|--------|
| U-01 | Full dashboard layout | All panels in a multi-column grid | ✅ Pass |
| U-02 | Header KPI pills visible | Overall %, ICU %, Alerts shown inline in header | ✅ Pass |
| U-03 | Alert drawer width | ~380px slide-out panel, does not push content | ✅ Pass |
| U-04 | Gauges are side by side | Bed Utilization + ICU Risk + Capacity Overview in one row | ✅ Pass |
| U-05 | Timeline full width | Chart spans the full content width | ✅ Pass |
| U-06 | Export modal readable | Modal centered with visible section checkboxes | ✅ Pass |

---

### 3.2 Tablet (768–1279px)

| # | Test | Expected | Status |
|---|------|---------|--------|
| U-07 | Grid reflows to 2 columns | Panels stack appropriately on medium screens | ✅ Pass |
| U-08 | Gauges remain legible | Arc and labels not clipped or overflowing | ✅ Pass |
| U-09 | Header KPI pills still visible | Visible at tablet width | ✅ Pass |
| U-10 | Alert drawer full-width on tablet | Drawer spans most of screen width | ✅ Pass |
| U-11 | Navigation links visible | Dashboard + Validation links in nav bar | ✅ Pass |

---

### 3.3 Mobile (< 768px)

| # | Test | Expected | Status |
|---|------|---------|--------|
| U-12 | Header mobile KPI strip | OCC / ICU / ALERTS shown in compact strip below header | ✅ Pass |
| U-13 | Single-column layout | Panels stack vertically | ✅ Pass |
| U-14 | Gauges fit screen width | No horizontal scroll; arc is centered and unclipped | ✅ Pass |
| U-15 | Alert drawer full-width | Drawer covers full screen on mobile | ✅ Pass |
| U-16 | Role switcher truncates long names | Role name truncated with ellipsis, not overflowing | ✅ Pass |
| U-17 | Touch targets ≥ 44px | Buttons and interactive elements are thumb-friendly | ✅ Pass |
| U-18 | No horizontal overflow | Page does not scroll horizontally | ✅ Pass |
| U-19 | Actions menu reachable | "Actions" dropdown opens and items are selectable | ✅ Pass |

**How to test mobile layout:**
```
Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)
Select "iPhone SE" (375px) and "iPad" (768px) presets
```

---

### 3.4 Cross-Browser Testing

| Browser | Dashboard | Validation | Charts | Alerts | PDF Export |
|---------|-----------|------------|--------|--------|-----------|
| Chrome (latest) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Firefox (latest) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Safari 16+ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edge (latest) | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Role-Based Access Testing

### 4.1 Component Visibility Matrix

Test each role by switching in the Role Switcher and verifying the correct panels appear and are absent.

| Component | Admin | CNO | CFO | Analyst |
|-----------|-------|-----|-----|---------|
| Bed Utilization Gauge | ✅ | ✅ | ✅ | ❌ (hidden) |
| ICU Risk Indicator | ✅ | ✅ | ❌ | ❌ |
| Capacity Overview | ✅ | ✅ | ✅ | ❌ |
| Patient Flow / Timeline | ✅ | ❌ | ✅ | ✅ |
| Forecast Chart | ✅ | ❌ | ❌ | ✅ |
| Alerts Button + Drawer | ✅ | ✅ | ❌ | ✅ |
| Validation Page | ✅ | ❌ | ❌ | ✅ |

| # | Test | Expected | Status |
|---|------|---------|--------|
| R-01 | CNO — no forecast/timeline | UnifiedTimeline absent from dashboard | ✅ Pass |
| R-02 | CFO — no ICU gauge or alerts | ICURiskIndicator and Alerts button absent | ✅ Pass |
| R-03 | Analyst — no gauges | CapacityGauge and ICURiskIndicator absent | ✅ Pass |
| R-04 | Analyst — validation page accessible | `/validation` link visible and page loads | ✅ Pass |
| R-05 | CNO — validation page not accessible | `/validation` link absent from nav | ✅ Pass |
| R-06 | Non-admin — no Admin Panel | Gear icon in role switcher hidden | ✅ Pass |
| R-07 | Access restriction message | Navigate to dashboard as a role without dashboard access → "Dashboard access restricted" message shown | ✅ Pass |

---

### 4.2 Custom Role Testing

| # | Test | Expected | Status |
|---|------|---------|--------|
| R-08 | Create a custom role | Admin Panel → add role → appears in Role Switcher | ✅ Pass |
| R-09 | Custom role with specific components | Only selected dashboard components appear | ✅ Pass |
| R-10 | Custom role persists on reload | Refresh page → custom role still in list | ✅ Pass |
| R-11 | Delete custom role | Role removed; active role resets to Administrator | ✅ Pass |

---

## 5. Known Limitations

| # | Limitation | Notes |
|---|------------|-------|
| L-01 | Email notifications not implemented | Email recipient field is stored but no mail is sent in the prototype |
| L-02 | Share link does not create a live server route | `/share/{token}` is not a real page; token encodes state for future implementation |
| L-03 | Data is static | All data is pre-computed JSON; no live data feed in this prototype |
| L-04 | No authentication | Role switching is client-side only; there is no server-enforced login |
| L-05 | Watchpack EMFILE warnings on macOS | Cosmetic warning from Node.js file watcher limits; does not affect functionality |

---

## 6. How to Run All Functional Tests

```bash
# 1. Start the dev server
cd frontend
npm run dev

# 2. Open Chrome with DevTools
open http://localhost:3000

# 3. Work through test IDs F-01 → F-50 manually
#    (no automated test runner configured in prototype)

# 4. For mobile tests: Cmd+Shift+M in Chrome DevTools
#    Select "iPhone SE" (375px width)

# 5. For validation tests: switch role to Administrator
#    Navigate to http://localhost:3000/validation
#    Select a facility and review accuracy cards
```

---

*Hospital Command Center · Testing Documentation · HCA Healthcare Hackathon Prototype · v0.1.0*

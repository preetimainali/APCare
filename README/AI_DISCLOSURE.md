# AI Usage Disclosure

**Hospital Command Center · HCA Healthcare Hackathon**
Version 0.1.0 · February 2026

---

## Summary

AI tools were used throughout this project to accelerate development, explore architecture options, and debug implementation issues. All AI-generated output was reviewed, tested, and approved by the human developer before being committed. Final design and implementation decisions were made by the team.

---

## Tools Used

### 1. Cursor (Primary)

**What it is:** An AI-powered IDE built on VS Code that offers inline code generation, multi-file edits, and conversational coding assistance.

**How it was used in this project:**

| Area | How Cursor helped |
|------|------------------|
| Component scaffolding | Generated initial React component structure for `CapacityGauge`, `ICURiskIndicator`, `UnifiedTimeline`, `AlertDrawer` |
| Recharts integration | Suggested `ResponsiveContainer` + `ComposedChart` patterns for the unified timeline |
| SVG gauge refactor | Helped replace broken Recharts `PieChart` semicircle with deterministic pure SVG `strokeDasharray` approach |
| RBAC system | Assisted in scaffolding the `RoleProvider` React Context with `useCallback` access checks |
| Alert logic | Generated `generateConfiguredAlerts()` with threshold checks, suppression rules, and trust-level modifiers |
| TypeScript types | Generated full interface hierarchy in `lib/types.ts` |
| Bug fixes | Identified and fixed SSR hydration issues (Recharts crashing on server), corrupted `.next` cache, and `mounted` guard pattern |
| Tailwind CSS | Suggested responsive grid breakpoints (`md:grid-cols-6 lg:grid-cols-12`) and mobile layout patterns |
| PDF export | Scaffolded `jsPDF`-based report renderer with light-theme palette and section-by-section layout |
| Documentation | Assisted in writing `USER_GUIDE.md`, `TECHNICAL_DOCUMENTATION.md`, `SETUP.md`, `TESTING.md` |

---

### 2. ChatGPT (Architecture & Validation Support)

**What it is:** OpenAI's conversational AI model, used for brainstorming and architectural guidance.

**How it was used:**

| Area | How ChatGPT helped |
|------|-------------------|
| Architecture design | Explored tradeoffs between static JSON data vs. live FastAPI backend for a hackathon prototype |
| Prediction model design | Discussed EMA + linear trend + seasonal adjustment decomposition approach |
| Confidence interval formula | Validated the `1.5σ × (1 + 0.5 × √(horizon/24))` widening formula for forecast bands |
| Backtest methodology | Confirmed that time-based train/test splits (never testing on data seen during training) are the correct approach for time-series forecasting |
| Alert deduplication logic | Brainstormed suppression rules to reduce alert fatigue |
| Data integrity approach | Discussed best practices for handling missing values, duplicate rows, and anomalies in medical telemetry |

---

## Example Prompts Used

Below are representative examples of actual prompts used during development.

### Architecture Planning
> *"We're building a hackathon prototype for hospital census capacity management. We have an Excel file with hourly census data for 10 hospitals. What's the simplest architecture that gives us a responsive dashboard with forecasting and alerts, where the frontend works standalone without a backend?"*

→ This led to the decision to use pre-computed static JSON files instead of a FastAPI backend, making the demo run with just `npm run dev`.

---

### Prediction Model Design
> *"I want to build a 7-day census forecast that executives can trust and explain. I don't want a black-box model. What's a simple, auditable approach using EMA, trend, and seasonality that I can implement in pure Python without sklearn or numpy?"*

→ This produced the three-component decomposition model with closed-form OLS slope computation and `(hour_of_day, day_of_week)` seasonal lookup tables.

---

### Recharts SSR Fix
> *"My Next.js dashboard is blank — Recharts is crashing during server-side rendering. The page compiles but the browser just shows the header and filter bar, nothing else. How do I fix this without removing the charts?"*

→ Led to the `mounted` guard pattern: `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []);` applied inside each chart component, with a server-safe placeholder.

---

### SVG Gauge Refactor
> *"My Recharts PieChart semicircle gauge is clipping and overflowing on different screen sizes. The arc disappears or gets cut off. Is there a more reliable way to render a responsive semicircle gauge in React?"*

→ Cursor suggested replacing the `PieChart` with a pure SVG `<path>` using `strokeDasharray` to reveal a fraction of the arc, wrapped in `<svg viewBox="0 0 200 109" className="w-full">` for perfect responsive scaling.

---

### Alert Suppression Logic
> *"I have a hospital dashboard with three alert severity levels: critical, warning, info. I want to suppress info alerts when a higher-severity alert already exists for the same facility and metric, and cap alerts per facility at 4 to prevent flooding. How should I structure this?"*

→ Produced the two-pass suppression algorithm in `alertConfig.ts`: sort by severity, mark suppressed by facility+category, then cap by facility count.

---

### Role-Based Access Control
> *"I want a React Context that stores roles and permissions, lets the user switch between built-in roles, and allows admins to create custom roles. Components should call canViewDashboard('capacityGauge') to check access. Roles should persist in localStorage."*

→ Generated the `RoleProvider` with `addRole`, `updateRole`, `deleteRole`, and the three `canViewX` functions backed by array includes.

---

## Benefits Observed

| Benefit | Impact |
|---------|--------|
| **Speed** | Reduced scaffolding time for boilerplate components by ~60–70%. Components like `AlertDrawer`, `ExportModal`, and `ShareModal` would have taken hours; initial drafts were generated in minutes. |
| **Pattern discovery** | Cursor surfaced the `strokeDasharray` SVG technique for the gauges — a solution the developer would likely have taken longer to find manually. |
| **Debugging** | When the dashboard went blank due to SSR crashes, Cursor identified the root cause (Recharts `ResponsiveContainer` reading `window` during SSR) and the fix within a few turns. |
| **Documentation** | Cursor dramatically reduced the time to produce comprehensive markdown documentation by starting from code-accurate outlines. |
| **Architecture clarity** | ChatGPT helped quickly evaluate tradeoffs (static JSON vs. live API, black-box model vs. interpretable decomposition) and validated choices with reasoning. |

---

## Limitations & Required Human Oversight

AI-generated output was **not accepted without review**. The following areas required significant human correction or judgment:

| Area | Issue | Human resolution |
|------|-------|-----------------|
| **Recharts gauge radii** | AI suggested percentage-based `innerRadius`/`outerRadius` which clipped unpredictably at different screen sizes | Developer replaced with pure SVG approach after diagnosing the real cause |
| **Mounted guard scope** | Initial suggestion wrapped entire page content in `if (!mounted) return null` — this blocked all panels from rendering | Developer scoped guards to individual chart components only |
| **Alert suppression edge cases** | First draft didn't distinguish between occupancy and ICU categories when suppressing — info alerts for ICU were incorrectly suppressed by occupancy warnings | Developer added `facilityId:category` compound key |
| **Confidence interval formula** | AI suggested a fixed-width band; developer requested and validated the horizon-widening formula to accurately represent compounding forecast uncertainty | Formula reviewed against time-series forecasting literature |
| **PDF layout** | AI-generated jsPDF code used pixel coordinates not calibrated for A4 page margins | Developer manually calibrated all `x`, `y`, margin, and font-size values |
| **Data schema design** | Initial schema had flat arrays; developer restructured into facility-keyed maps for O(1) lookups | Final schema in `lib/types.ts` reflects developer decisions |

---

## Human Oversight Summary

All of the following were decided and verified by the human developer:

- ✅ Final architectural decisions (static JSON, no backend for prototype)
- ✅ Prediction model design (EMA + OLS + seasonal, not black-box)
- ✅ All threshold values (80%/90% capacity, 75%/85% ICU)
- ✅ Trust level classification criteria (MAPE ≤ 5% = HIGH, etc.)
- ✅ Alert suppression rules and per-facility cap value
- ✅ RBAC role definitions and component permissions
- ✅ Data pipeline preprocessing rules (missing value handling, outlier policy)
- ✅ All mathematical formulas verified manually
- ✅ Final code reviewed before commit; no AI-generated code committed without inspection
- ✅ All documentation reviewed for accuracy against the actual implementation

---

*This disclosure is provided in accordance with the hackathon's AI usage requirements. The intent is full transparency — AI was a productivity tool, not a replacement for engineering judgment.*

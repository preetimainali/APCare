# Hospital Command Center — Setup Instructions

**HCA Healthcare · Hackathon Prototype**

---

## Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **Node.js** | v18.x | v20.x or v22.x |
| **npm** | v9.x | v10.x (bundled with Node 20+) |
| **Browser** | Chrome 110+, Firefox 110+, Safari 16+, Edge 110+ | Chrome latest |
| **OS** | macOS, Windows 10+, Linux | Any |
| **Disk space** | ~250 MB (includes node_modules) | — |
| **RAM** | 2 GB free | 4 GB+ |
| **Internet** | Required for initial `npm install` only | — |

> **No backend setup required.** All data is bundled as static JSON files. The app runs entirely from the frontend directory.

---

## 1. Clone or Download

**Option A — Clone from GitHub:**
```bash
git clone https://github.com/preetimainali/APCare.git
cd APCare
```

**Option B — Download ZIP:**
1. Go to https://github.com/preetimainali/APCare
2. Click **Code → Download ZIP**
3. Unzip and open the folder

---

## 2. Install Dependencies

```bash
cd frontend
npm install
```

Expected output:
```
added 357 packages, and audited 358 packages in 45s
found 0 vulnerabilities
```

> If you see `npm warn Unknown env config "devdir"` — this is harmless and can be ignored.

---

## 3. Start the Development Server

```bash
npm run dev
```

Expected output:
```
  ▲ Next.js 14.2.x
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in ~900ms
```

> If port 3000 is already in use, Next.js automatically tries 3001, then 3002, etc. Check the terminal output for the exact URL.

---

## 4. Open the Application

Open your browser and navigate to:

```
http://localhost:3000
```

- **Dashboard** (main page): `http://localhost:3000`
- **Validation page**: `http://localhost:3000/validation`

The app should load within 2–4 seconds on first visit (Next.js compiles the page on first request).

---

## 5. Verify Everything Works

Once loaded, you should see:

| Element | Expected |
|---------|---------|
| Header | "Hospital Command Center" with Overall %, ICU %, Alerts count |
| Bed Utilization gauge | Semicircle arc with a % value |
| ICU Risk gauge | Multi-zone arc with needle |
| Capacity Overview | 6-stat grid |
| Timeline chart | Chart with census history line |
| Navigation | "Dashboard" and "Validation" links in the nav bar |
| Role Switcher | Dropdown in top-right showing "Administrator" |

---

## 6. Switching Roles

Click the role name in the top-right corner of the header to switch between:
- **Administrator** — sees all panels
- **Chief Nursing Officer** — sees gauges + alerts
- **CFO** — sees capacity + flow trend
- **Data Analyst** — sees forecast + alerts + validation

---

## 7. Production Build (Optional)

To build an optimized production bundle:

```bash
cd frontend
npm run build
npm start
```

The production server also runs on `http://localhost:3000`.

---

## 8. Troubleshooting

### "Port already in use"
```bash
# Kill any existing Next.js processes, then restart
lsof -ti:3000 | xargs kill -9
npm run dev
```

### "Module not found" or blank page after pull
```bash
# Delete the build cache and reinstall
rm -rf .next
npm install
npm run dev
```

### Charts not rendering / "Loading…" stuck
- Hard refresh the page: `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows/Linux)
- This can happen if the browser cached a broken SSR response

### Dashboard shows "Dashboard access restricted"
- Click the role switcher (top-right) and select **Administrator**

### Node version errors
```bash
# Check your version
node --version

# Use nvm to install the correct version
nvm install 20
nvm use 20
```

---

## 9. Project Structure

```
APCare/
├── README/                  ← Documentation
│   ├── README.md
│   ├── SETUP.md             ← This file
│   ├── USER_GUIDE.md
│   ├── TECHNICAL_DOCUMENTATION.md
│   ├── TESTING.md
│   ├── AI_DISCLOSURE.md
│   └── DATA_INTEGRITY.txt
│
├── frontend/                ← Next.js application (run this)
│   ├── app/                 ← Pages (Dashboard, Validation)
│   ├── components/          ← UI components
│   ├── lib/                 ← Data, types, RBAC, alert logic
│   │   └── data/            ← Pre-computed JSON data files
│   ├── package.json
│   └── next.config.mjs
│
├── backend/                 ← Backend placeholder (not implemented)
└── data/
    └── HCA Census Metrics.xlsx   ← Source data
```

---

*For full feature documentation see [USER_GUIDE.md](./USER_GUIDE.md).*
*For architecture and technical details see [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md).*

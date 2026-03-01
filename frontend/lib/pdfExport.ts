import type { ExportPayload, ReportSection } from "./report";

async function getJsPDF() {
  const { jsPDF } = await import("jspdf");
  return jsPDF;
}

type C3 = readonly [number, number, number];

// Light-theme palette designed for print
const WHITE: C3 = [255, 255, 255];
const BG: C3 = [250, 250, 252];
const CARD_BG: C3 = [246, 248, 250];
const BORDER_LIGHT: C3 = [218, 222, 227];
const TEXT_DARK: C3 = [31, 35, 40];
const TEXT_MED: C3 = [87, 96, 106];
const TEXT_LIGHT: C3 = [139, 148, 158];
const HCA_BLUE: C3 = [0, 82, 155];
const ACCENT_BLUE: C3 = [37, 99, 235];
const GREEN: C3 = [22, 163, 74];
const AMBER: C3 = [217, 119, 6];
const RED: C3 = [220, 38, 38];
const PURPLE: C3 = [124, 58, 237];

function riskColor(pct: number): C3 { return pct >= 90 ? RED : pct >= 80 ? AMBER : GREEN; }
function riskLabel(pct: number): string { return pct >= 90 ? "CRITICAL" : pct >= 80 ? "ELEVATED" : "NORMAL"; }

export async function exportToPDF(payload: ExportPayload, sections: Set<ReportSection>): Promise<void> {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const M = 16;
  const CW = W - M * 2;
  let y = 0;
  let pageNum = 1;

  // ── Helpers ──
  const fill = (x: number, fy: number, w: number, h: number, c: C3) => { doc.setFillColor(c[0], c[1], c[2]); doc.rect(x, fy, w, h, "F"); };
  const txt = (s: string, x: number, ty: number, sz: number, c: C3, style: "normal" | "bold" = "normal") => { doc.setFontSize(sz); doc.setFont("helvetica", style); doc.setTextColor(c[0], c[1], c[2]); doc.text(s, x, ty); };
  const txtR = (s: string, x: number, ty: number, sz: number, c: C3, style: "normal" | "bold" = "normal") => { doc.setFontSize(sz); doc.setFont("helvetica", style); doc.setTextColor(c[0], c[1], c[2]); doc.text(s, x, ty, { align: "right" }); };
  const hr = (ly: number) => { doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.setLineWidth(0.3); doc.line(M, ly, W - M, ly); };
  const thickHr = (ly: number, c: C3 = HCA_BLUE) => { doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(0.8); doc.line(M, ly, W - M, ly); };

  function pageBreak() {
    addFooter();
    doc.addPage();
    pageNum++;
    fill(0, 0, W, H, WHITE);
    y = 18;
  }

  function ensureSpace(needed: number) { if (y + needed > H - 20) pageBreak(); }

  function sectionHeading(title: string) {
    ensureSpace(16);
    y += 4;
    thickHr(y, ACCENT_BLUE);
    y += 7;
    txt(title.toUpperCase(), M, y, 13, HCA_BLUE, "bold");
    y += 8;
  }

  function addFooter() {
    hr(H - 14);
    txt("HCA Healthcare  ·  Hospital Command Center", M, H - 9, 7, TEXT_LIGHT);
    txt("CONFIDENTIAL — Not for clinical decision-making", M, H - 5.5, 6, TEXT_LIGHT);
    txtR(`Page ${pageNum}`, W - M, H - 9, 7, TEXT_LIGHT);
    txtR(new Date(payload.exportedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), W - M, H - 5.5, 6, TEXT_LIGHT);
  }

  // ── Page background ──
  fill(0, 0, W, H, WHITE);

  // ══════════════════════════════════════════
  // COVER / HEADER
  // ══════════════════════════════════════════
  fill(0, 0, W, 52, HCA_BLUE);
  fill(0, 52, W, 1.5, ACCENT_BLUE);

  // Logo
  fill(M, 12, 14, 14, [0, 65, 130]);
  doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.3); doc.rect(M, 12, 14, 14);
  txt("H", M + 4, 22.5, 16, WHITE, "bold");

  txt("Hospital Command Center", M + 18, 19, 20, WHITE, "bold");
  txt("Executive Brief", M + 18, 27, 11, [180, 210, 240]);

  // Right side metadata
  txtR(new Date(payload.exportedAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }), W - M, 17, 9, [180, 210, 240]);
  txtR(`${payload.role.name}  ·  ${payload.selectedFacilityName}`, W - M, 24, 9, WHITE, "bold");

  // Status strip
  const statusY = 36;
  const statusItems = [
    `Overall: ${payload.occupancyPct}%`,
    `ICU: ${payload.icuPct}%`,
    `Alerts: ${payload.alertSummary.critical + payload.alertSummary.warning + payload.alertSummary.info}`,
    `Date: ${payload.startDate} → ${payload.endDate}`,
  ];
  txtR(statusItems.join("   |   "), W - M, statusY, 7.5, [150, 195, 240]);

  y = 62;

  // ── Context row ──
  fill(M, y, CW, 16, CARD_BG);
  doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.setLineWidth(0.3);
  doc.rect(M, y, CW, 16);

  const ctxItems = [
    { l: "FACILITY", v: payload.selectedFacilityName },
    { l: "DATE RANGE", v: `${payload.startDate}  →  ${payload.endDate}` },
    { l: "ROLE", v: payload.role.name },
    { l: "SECTIONS", v: `${sections.size} included` },
  ];
  const ctxW = CW / ctxItems.length;
  ctxItems.forEach((item, i) => {
    const cx = M + i * ctxW + 5;
    txt(item.l, cx, y + 6, 6.5, TEXT_LIGHT, "bold");
    txt(item.v, cx, y + 12, 8.5, TEXT_DARK, "bold");
  });
  y += 22;

  // ══════════════════════════════════════════
  // SECTION: KEY METRICS
  // ══════════════════════════════════════════
  if (sections.has("keyMetrics")) {
    sectionHeading("Key Metrics");
    const metrics = [
      { l: "Total Beds", v: String(payload.totalBeds), c: TEXT_DARK },
      { l: "Current Census", v: String(payload.census), c: TEXT_DARK },
      { l: "Overall Occupancy", v: `${payload.occupancyPct}%`, c: riskColor(payload.occupancyPct) },
      { l: "Admissions", v: String(payload.admissions), c: GREEN },
      { l: "Discharges", v: String(payload.discharges), c: ACCENT_BLUE },
      { l: "Births", v: String(payload.births), c: PURPLE },
    ];
    const mW = CW / 3;
    metrics.forEach((m, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const mx = M + col * mW;
      const my = y + row * 24;
      fill(mx, my, mW - 3, 20, CARD_BG);
      doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.rect(mx, my, mW - 3, 20);
      fill(mx, my, mW - 3, 1.5, m.c);
      txt(m.l, mx + 4, my + 8, 8, TEXT_MED);
      txt(m.v, mx + 4, my + 16, 16, m.c, "bold");
    });
    y += Math.ceil(metrics.length / 3) * 24 + 4;

    // Occupancy risk badge
    const rLevel = riskLabel(payload.occupancyPct);
    const rc = riskColor(payload.occupancyPct);
    fill(M, y, CW, 10, [rc[0], rc[1], rc[2]]);
    doc.setGState(doc.GState({ opacity: 0.12 }));
    fill(M, y, CW, 10, rc);
    doc.setGState(doc.GState({ opacity: 1 }));
    fill(M, y, CW, 10, [...rc.map(v => Math.min(255, v + 200))] as unknown as C3);
    fill(M, y, 2, 10, rc);
    txt(`Occupancy Status: ${rLevel}`, M + 6, y + 6.5, 9, rc, "bold");
    txtR(`${payload.census} patients  /  ${payload.totalBeds} beds  (${payload.occupancyPct}%)`, W - M - 4, y + 6.5, 8, TEXT_MED);
    y += 14;
  }

  // ══════════════════════════════════════════
  // SECTION: ICU INFORMATION
  // ══════════════════════════════════════════
  if (sections.has("icuInfo")) {
    sectionHeading("ICU Information");
    const icuAvail = payload.icuMax - payload.icuOccupied;
    const icuRisk = riskLabel(payload.icuPct);
    const ic = riskColor(payload.icuPct);

    const icuMetrics = [
      { l: "ICU Beds", v: String(payload.icuMax), c: TEXT_DARK },
      { l: "ICU Occupied", v: String(payload.icuOccupied), c: ic },
      { l: "ICU Available", v: String(icuAvail), c: icuAvail <= 2 ? RED : GREEN },
      { l: "ICU Occupancy", v: `${payload.icuPct}%`, c: ic },
      { l: "Risk Level", v: icuRisk, c: ic },
    ];

    if (payload.forecastSummary.icuPeakPct !== null) {
      icuMetrics.push({ l: "Forecast Peak (7d)", v: `${payload.forecastSummary.icuPeakPct}%`, c: riskColor(payload.forecastSummary.icuPeakPct) });
    }

    const iW = CW / 3;
    icuMetrics.forEach((m, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const mx = M + col * iW;
      const my = y + row * 22;
      fill(mx, my, iW - 3, 18, CARD_BG);
      doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.rect(mx, my, iW - 3, 18);
      fill(mx, my, iW - 3, 1.5, m.c);
      txt(m.l, mx + 4, my + 7, 7.5, TEXT_MED);
      txt(m.v, mx + 4, my + 14, 14, m.c, "bold");
    });
    y += Math.ceil(icuMetrics.length / 3) * 22 + 4;

    // ICU risk banner
    fill(M, y, CW, 10, [...ic.map(v => Math.min(255, v + 200))] as unknown as C3);
    fill(M, y, 2, 10, ic);
    txt(`ICU Risk Level: ${icuRisk}`, M + 6, y + 6.5, 9, ic, "bold");
    txtR(`${payload.icuOccupied}/${payload.icuMax} beds occupied  ·  ${icuAvail} available`, W - M - 4, y + 6.5, 8, TEXT_MED);
    y += 14;
  }

  // ══════════════════════════════════════════
  // SECTION: ALERTS SUMMARY
  // ══════════════════════════════════════════
  if (sections.has("alerts")) {
    sectionHeading("Alerts Summary");

    // Summary badges
    const sums = [
      { l: "Critical", n: payload.alertSummary.critical, c: RED },
      { l: "Warning", n: payload.alertSummary.warning, c: AMBER },
      { l: "Informational", n: payload.alertSummary.info, c: ACCENT_BLUE },
      { l: "Forecast-based", n: payload.alertSummary.forecastAlerts, c: PURPLE },
    ].filter((s) => s.n > 0);

    if (sums.length > 0) {
      const bW = CW / Math.max(sums.length, 1);
      sums.forEach((s, i) => {
        const bx = M + i * bW;
        fill(bx, y, bW - 3, 14, [...s.c.map(v => Math.min(255, v + 200))] as unknown as C3);
        fill(bx, y, 2, 14, s.c);
        txt(`${s.n}`, bx + 6, y + 9, 14, s.c, "bold");
        txt(s.l, bx + 18, y + 9, 9, TEXT_MED, "bold");
      });
      y += 18;
    }

    // Alert table
    if (payload.alertSummary.items.length > 0) {
      // Table header
      fill(M, y, CW, 8, CARD_BG);
      doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.rect(M, y, CW, 8);
      txt("SEVERITY", M + 3, y + 5.5, 6.5, TEXT_LIGHT, "bold");
      txt("FACILITY", M + 25, y + 5.5, 6.5, TEXT_LIGHT, "bold");
      txt("MESSAGE", M + 65, y + 5.5, 6.5, TEXT_LIGHT, "bold");
      txt("TYPE", W - M - 15, y + 5.5, 6.5, TEXT_LIGHT, "bold");
      y += 8;

      const sevColor: Record<string, C3> = { critical: RED, warning: AMBER, info: ACCENT_BLUE };
      payload.alertSummary.items.slice(0, 15).forEach((a, i) => {
        ensureSpace(9);
        const rowBg = i % 2 === 0 ? WHITE : CARD_BG;
        fill(M, y, CW, 8, rowBg);
        doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
        doc.line(M, y + 8, W - M, y + 8);

        const sc = sevColor[a.severity] ?? ACCENT_BLUE;
        fill(M, y, 1.5, 8, sc);
        txt(a.severity.toUpperCase(), M + 4, y + 5.5, 6.5, sc, "bold");
        txt(a.facilityName.substring(0, 18), M + 25, y + 5.5, 6.5, TEXT_DARK);

        doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(TEXT_MED[0], TEXT_MED[1], TEXT_MED[2]);
        const msgLines = doc.splitTextToSize(a.message, 90);
        doc.text(msgLines[0], M + 65, y + 5.5);

        const type = a.id.startsWith("pred-") ? "Forecast" : "Current";
        const tc = a.id.startsWith("pred-") ? PURPLE : TEXT_MED;
        txt(type, W - M - 15, y + 5.5, 6.5, tc);
        y += 8;
      });
      if (payload.alertSummary.items.length > 15) {
        txt(`+ ${payload.alertSummary.items.length - 15} additional alerts not shown`, M, y + 4, 7, TEXT_LIGHT);
        y += 8;
      }
      y += 4;
    } else {
      fill(M, y, CW, 12, CARD_BG);
      doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.rect(M, y, CW, 12);
      txt("No active alerts — all metrics within normal ranges.", M + 5, y + 8, 9, GREEN, "bold");
      y += 16;
    }
  }

  // ══════════════════════════════════════════
  // SECTION: FORECAST CHART (rendered as a data table)
  // ══════════════════════════════════════════
  if (sections.has("forecastChart")) {
    sectionHeading("7-Day Forecast Summary");

    const fs = payload.forecastSummary;
    if (fs.censusPeakPct !== null || fs.icuPeakPct !== null) {
      const fMetrics = [];
      if (fs.censusPeakPct !== null) {
        fMetrics.push({ l: "Peak Census Occupancy", v: `${fs.censusPeakPct}%`, c: riskColor(fs.censusPeakPct) });
        fMetrics.push({ l: "Census Trend", v: (fs.censusTrend ?? "stable").charAt(0).toUpperCase() + (fs.censusTrend ?? "stable").slice(1), c: fs.censusTrend === "rising" ? AMBER : fs.censusTrend === "falling" ? GREEN : TEXT_MED });
      }
      if (fs.icuPeakPct !== null) {
        fMetrics.push({ l: "Peak ICU Occupancy", v: `${fs.icuPeakPct}%`, c: riskColor(fs.icuPeakPct) });
        fMetrics.push({ l: "ICU Trend", v: (fs.icuTrend ?? "stable").charAt(0).toUpperCase() + (fs.icuTrend ?? "stable").slice(1), c: fs.icuTrend === "rising" ? AMBER : fs.icuTrend === "falling" ? GREEN : TEXT_MED });
      }
      if (fs.trustLevel) {
        const tc = fs.trustLevel === "HIGH" ? GREEN : fs.trustLevel === "MODERATE" ? AMBER : RED;
        fMetrics.push({ l: "Forecast Trust Level", v: fs.trustLevel, c: tc });
      }

      const fW = CW / Math.min(fMetrics.length, 3);
      fMetrics.forEach((m, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const mx = M + col * fW;
        const my = y + row * 22;
        fill(mx, my, fW - 3, 18, CARD_BG);
        doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.rect(mx, my, fW - 3, 18);
        fill(mx, my, fW - 3, 1.5, m.c);
        txt(m.l, mx + 4, my + 7, 7.5, TEXT_MED);
        txt(m.v, mx + 4, my + 14, 14, m.c, "bold");
      });
      y += Math.ceil(fMetrics.length / 3) * 22 + 4;
    }

    // Forecast data points as mini sparkline table
    const forecastPts = payload.timelineData.filter((d) => d.forecastCensus != null);
    if (forecastPts.length > 0) {
      ensureSpace(10 + Math.min(forecastPts.length, 8) * 7);
      txt("Forecast Data Points", M, y + 4, 8, TEXT_MED, "bold");
      y += 8;

      fill(M, y, CW, 7, CARD_BG);
      doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.rect(M, y, CW, 7);
      txt("DATE/TIME", M + 3, y + 5, 6, TEXT_LIGHT, "bold");
      txt("CENSUS", M + 55, y + 5, 6, TEXT_LIGHT, "bold");
      txt("ICU", M + 82, y + 5, 6, TEXT_LIGHT, "bold");
      if (forecastPts.some((p) => p.upper != null)) {
        txt("UPPER CI", M + 105, y + 5, 6, TEXT_LIGHT, "bold");
        txt("LOWER CI", M + 130, y + 5, 6, TEXT_LIGHT, "bold");
      }
      y += 7;

      forecastPts.slice(0, 8).forEach((p, i) => {
        const rowBg = i % 2 === 0 ? WHITE : CARD_BG;
        fill(M, y, CW, 6.5, rowBg);
        const time = new Date(p.time).toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + new Date(p.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        txt(time, M + 3, y + 4.5, 6.5, TEXT_DARK);
        txt(p.forecastCensus != null ? String(Math.round(p.forecastCensus)) : "—", M + 55, y + 4.5, 6.5, ACCENT_BLUE, "bold");
        txt(p.forecastIcu != null ? String(Math.round(p.forecastIcu)) : "—", M + 82, y + 4.5, 6.5, PURPLE, "bold");
        if (p.upper != null) txt(String(Math.round(p.upper)), M + 105, y + 4.5, 6.5, TEXT_LIGHT);
        if (p.lower != null) txt(String(Math.round(p.lower)), M + 130, y + 4.5, 6.5, TEXT_LIGHT);
        y += 6.5;
      });
      if (forecastPts.length > 8) {
        txt(`… ${forecastPts.length - 8} more data points in full dataset`, M + 3, y + 4, 6.5, TEXT_LIGHT);
        y += 8;
      }
      y += 4;
    }
  }

  // ══════════════════════════════════════════
  // SECTION: TREND CHARTS (as summary table)
  // ══════════════════════════════════════════
  if (sections.has("trendCharts")) {
    sectionHeading("Historical Trend Summary");

    const histPts = payload.timelineData.filter((d) => d.census != null);
    if (histPts.length > 0) {
      const censusVals = histPts.map((d) => d.census!);
      const icuVals = histPts.filter((d) => d.icu != null).map((d) => d.icu!);
      const admVals = histPts.filter((d) => d.admissions != null).map((d) => d.admissions!);
      const disVals = histPts.filter((d) => d.discharges != null).map((d) => d.discharges!);

      const stats = [
        { metric: "Total Census", min: Math.min(...censusVals), max: Math.max(...censusVals), avg: Math.round(censusVals.reduce((a, b) => a + b, 0) / censusVals.length), latest: censusVals[censusVals.length - 1], c: ACCENT_BLUE },
      ];
      if (icuVals.length > 0) stats.push({ metric: "ICU Occupancy", min: Math.min(...icuVals), max: Math.max(...icuVals), avg: Math.round(icuVals.reduce((a, b) => a + b, 0) / icuVals.length), latest: icuVals[icuVals.length - 1], c: PURPLE });
      if (admVals.length > 0) stats.push({ metric: "Admissions", min: Math.min(...admVals), max: Math.max(...admVals), avg: Math.round(admVals.reduce((a, b) => a + b, 0) / admVals.length), latest: admVals[admVals.length - 1], c: GREEN });
      if (disVals.length > 0) stats.push({ metric: "Discharges", min: Math.min(...disVals), max: Math.max(...disVals), avg: Math.round(disVals.reduce((a, b) => a + b, 0) / disVals.length), latest: disVals[disVals.length - 1], c: AMBER });

      // Range info
      const first = new Date(histPts[0].time).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const last = new Date(histPts[histPts.length - 1].time).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      txt(`Period: ${first} — ${last}  (${histPts.length} data points)`, M, y, 8, TEXT_MED);
      y += 6;

      // Table
      fill(M, y, CW, 8, CARD_BG);
      doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.rect(M, y, CW, 8);
      txt("METRIC", M + 4, y + 5.5, 7, TEXT_LIGHT, "bold");
      txt("MIN", M + 55, y + 5.5, 7, TEXT_LIGHT, "bold");
      txt("MAX", M + 78, y + 5.5, 7, TEXT_LIGHT, "bold");
      txt("AVG", M + 101, y + 5.5, 7, TEXT_LIGHT, "bold");
      txt("LATEST", M + 124, y + 5.5, 7, TEXT_LIGHT, "bold");
      y += 8;

      stats.forEach((s, i) => {
        const rowBg = i % 2 === 0 ? WHITE : CARD_BG;
        fill(M, y, CW, 9, rowBg);
        doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
        doc.line(M, y + 9, W - M, y + 9);
        fill(M, y, 2, 9, s.c);
        txt(s.metric, M + 6, y + 6.5, 8, TEXT_DARK, "bold");
        txt(String(s.min), M + 55, y + 6.5, 8.5, TEXT_MED);
        txt(String(s.max), M + 78, y + 6.5, 8.5, TEXT_MED);
        txt(String(s.avg), M + 101, y + 6.5, 8.5, TEXT_MED, "bold");
        txt(String(s.latest), M + 124, y + 6.5, 8.5, s.c, "bold");
        y += 9;
      });
      y += 6;

      // Mini sparkline visual (horizontal bar showing range)
      ensureSpace(20 + stats.length * 14);
      txt("Range Visualization", M, y + 4, 8, TEXT_MED, "bold");
      y += 10;
      stats.forEach((s) => {
        const allVals = s.metric === "Total Census" ? censusVals : s.metric === "ICU Occupancy" ? icuVals : s.metric === "Admissions" ? admVals : disVals;
        const chartW = CW - 40;
        const chartX = M + 38;
        const barH = 8;

        txt(s.metric.substring(0, 14), M, y + 5.5, 7, TEXT_MED);

        fill(chartX, y, chartW, barH, CARD_BG);
        doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.rect(chartX, y, chartW, barH);

        if (s.max > s.min) {
          const latestX = ((s.latest - s.min) / (s.max - s.min)) * chartW;
          const avgX = ((s.avg - s.min) / (s.max - s.min)) * chartW;
          fill(chartX, y, latestX, barH, [...s.c.map(v => Math.min(255, v + 170))] as unknown as C3);
          // avg marker
          doc.setDrawColor(s.c[0], s.c[1], s.c[2]); doc.setLineWidth(0.6);
          doc.line(chartX + avgX, y, chartX + avgX, y + barH);
        }
        txt(String(s.min), chartX - 1, y + barH + 4, 5.5, TEXT_LIGHT);
        txtR(String(s.max), chartX + chartW + 1, y + barH + 4, 5.5, TEXT_LIGHT);
        y += barH + 7;
      });
      y += 2;
    }
  }

  // ══════════════════════════════════════════
  // SECTION: VALIDATION METRICS
  // ══════════════════════════════════════════
  if (sections.has("validationMetrics") && payload.validation) {
    sectionHeading("Model Validation & Accuracy");

    const v = payload.validation;
    const summaryTC = v.summary?.total_census;
    const summaryICU = v.summary?.icu_occupancy;

    // Trust level and risk
    if (summaryTC) {
      const tc = summaryTC.trust === "HIGH" ? GREEN : summaryTC.trust === "MODERATE" ? AMBER : RED;
      const tierC = summaryTC.risk.tier === "CRITICAL" ? RED : summaryTC.risk.tier === "HIGH" ? AMBER : summaryTC.risk.tier === "MODERATE" ? AMBER : GREEN;

      // Trust badge
      fill(M, y, CW / 2 - 2, 14, [...tc.map(v => Math.min(255, v + 200))] as unknown as C3);
      fill(M, y, 2, 14, tc);
      txt("Forecast Trust", M + 6, y + 6, 7, TEXT_MED);
      txt(summaryTC.trust, M + 6, y + 11.5, 10, tc, "bold");

      // Risk tier
      fill(M + CW / 2, y, CW / 2, 14, [...tierC.map(v => Math.min(255, v + 200))] as unknown as C3);
      fill(M + CW / 2, y, 2, 14, tierC);
      txt("Risk Classification", M + CW / 2 + 6, y + 6, 7, TEXT_MED);
      txt(`${summaryTC.risk.tier}  (Peak ${summaryTC.risk.peakPct}%)`, M + CW / 2 + 6, y + 11.5, 10, tierC, "bold");
      y += 18;
    }

    // Accuracy metrics table
    const metricSets: { label: string; m: { mae: number; rmse: number; mape: number; bias: number; coverage: number } | null }[] = [];
    if (summaryTC) metricSets.push({ label: "Total Census", m: summaryTC.avgMetrics });
    if (summaryICU) metricSets.push({ label: "ICU Occupancy", m: summaryICU.avgMetrics });

    if (metricSets.length > 0) {
      ensureSpace(12 + metricSets.length * 10);
      txt("Accuracy Metrics (Cross-Window Average)", M, y + 4, 8, TEXT_MED, "bold");
      y += 9;

      fill(M, y, CW, 8, CARD_BG);
      doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.rect(M, y, CW, 8);
      txt("METRIC", M + 4, y + 5.5, 6.5, TEXT_LIGHT, "bold");
      txt("MAE", M + 50, y + 5.5, 6.5, TEXT_LIGHT, "bold");
      txt("RMSE", M + 72, y + 5.5, 6.5, TEXT_LIGHT, "bold");
      txt("MAPE", M + 94, y + 5.5, 6.5, TEXT_LIGHT, "bold");
      txt("BIAS", M + 116, y + 5.5, 6.5, TEXT_LIGHT, "bold");
      txt("COVERAGE", M + 138, y + 5.5, 6.5, TEXT_LIGHT, "bold");
      y += 8;

      metricSets.forEach((ms, i) => {
        if (!ms.m) return;
        const rowBg = i % 2 === 0 ? WHITE : CARD_BG;
        fill(M, y, CW, 9, rowBg);
        doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
        doc.line(M, y + 9, W - M, y + 9);
        txt(ms.label, M + 4, y + 6.5, 8, TEXT_DARK, "bold");
        txt(ms.m.mae.toFixed(1), M + 50, y + 6.5, 8, TEXT_MED);
        txt(ms.m.rmse.toFixed(1), M + 72, y + 6.5, 8, TEXT_MED);

        const mapeC = ms.m.mape <= 5 ? GREEN : ms.m.mape <= 12 ? AMBER : RED;
        txt(`${ms.m.mape.toFixed(1)}%`, M + 94, y + 6.5, 8, mapeC, "bold");
        txt(ms.m.bias.toFixed(1), M + 116, y + 6.5, 8, TEXT_MED);
        const covC = ms.m.coverage >= 90 ? GREEN : ms.m.coverage >= 70 ? AMBER : RED;
        txt(`${ms.m.coverage.toFixed(0)}%`, M + 138, y + 6.5, 8, covC, "bold");
        y += 9;
      });
      y += 6;
    }

    // Driver contributions
    if (summaryTC?.drivers) {
      ensureSpace(30);
      txt("Prediction Driver Contributions", M, y + 4, 8, TEXT_MED, "bold");
      y += 9;

      const drivers = [
        { name: "EMA (Current Baseline)", pct: summaryTC.drivers.ema.percent, c: ACCENT_BLUE },
        { name: "Linear Trend", pct: summaryTC.drivers.trend.percent, c: GREEN },
        { name: "Seasonal Pattern", pct: summaryTC.drivers.seasonal.percent, c: PURPLE },
      ];

      drivers.forEach((d) => {
        txt(d.name, M, y + 5, 8, TEXT_DARK);
        txtR(`${d.pct.toFixed(1)}%`, M + 55, y + 5, 8, d.c, "bold");

        const barX = M + 60;
        const barW = CW - 62;
        fill(barX, y, barW, 7, CARD_BG);
        doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.rect(barX, y, barW, 7);
        const fillW = (d.pct / 100) * barW;
        fill(barX, y, fillW, 7, d.c);
        y += 11;
      });
      y += 4;
    }

    // Backtest windows summary
    if (v.windows && v.windows.length > 0) {
      ensureSpace(10 + v.windows.length * 9);
      txt("Backtest Windows", M, y + 4, 8, TEXT_MED, "bold");
      y += 9;

      fill(M, y, CW, 7, CARD_BG);
      doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]); doc.rect(M, y, CW, 7);
      txt("WINDOW", M + 4, y + 5, 6.5, TEXT_LIGHT, "bold");
      txt("TRAIN PERIOD", M + 45, y + 5, 6.5, TEXT_LIGHT, "bold");
      txt("TEST PERIOD", M + 95, y + 5, 6.5, TEXT_LIGHT, "bold");
      txt("MAPE", M + 145, y + 5, 6.5, TEXT_LIGHT, "bold");
      y += 7;

      v.windows.forEach((w, i) => {
        const rowBg = i % 2 === 0 ? WHITE : CARD_BG;
        fill(M, y, CW, 8, rowBg);
        doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
        doc.line(M, y + 8, W - M, y + 8);
        txt(w.label || w.id, M + 4, y + 5.5, 7, TEXT_DARK);
        if (w.total_census) {
          txt(`${w.total_census.trainPeriod.start} → ${w.total_census.trainPeriod.end}`, M + 45, y + 5.5, 6.5, TEXT_MED);
          txt(`${w.total_census.testPeriod.start} → ${w.total_census.testPeriod.end}`, M + 95, y + 5.5, 6.5, TEXT_MED);
          const mc = w.total_census.metrics.mape <= 5 ? GREEN : w.total_census.metrics.mape <= 12 ? AMBER : RED;
          txt(`${w.total_census.metrics.mape.toFixed(1)}%`, M + 145, y + 5.5, 7, mc, "bold");
        }
        y += 8;
      });
      y += 4;
    }
  }

  // ── Final footer ──
  addFooter();

  const ts = new Date(payload.exportedAt).toISOString().slice(0, 10);
  doc.save(`HCA_Executive_Brief_${payload.role.name.replace(/\s+/g, "_")}_${ts}.pdf`);
}

export function exportToCSV(payload: ExportPayload, sections: Set<ReportSection>): void {
  const rows: string[][] = [];

  rows.push(["HCA Healthcare — Executive Brief"]);
  rows.push(["Exported", payload.exportedAt]);
  rows.push(["Role", payload.role.name]);
  rows.push(["Facility", payload.selectedFacilityName]);
  rows.push(["Date Range", `${payload.startDate} → ${payload.endDate}`]);
  rows.push([]);

  if (sections.has("keyMetrics")) {
    rows.push(["=== KEY METRICS ==="]);
    rows.push(["Metric", "Value", "Capacity", "Pct"]);
    rows.push(["Total Census", String(payload.census), String(payload.totalBeds), `${payload.occupancyPct}%`]);
    rows.push(["Admissions", String(payload.admissions)]);
    rows.push(["Discharges", String(payload.discharges)]);
    rows.push(["Births", String(payload.births)]);
    rows.push([]);
  }

  if (sections.has("icuInfo")) {
    rows.push(["=== ICU INFORMATION ==="]);
    rows.push(["ICU Occupied", String(payload.icuOccupied), String(payload.icuMax), `${payload.icuPct}%`]);
    rows.push(["ICU Available", String(payload.icuMax - payload.icuOccupied)]);
    rows.push([]);
  }

  if (sections.has("alerts")) {
    rows.push(["=== ALERTS ==="]);
    rows.push(["Severity", "Facility", "Message", "Time", "Type"]);
    payload.alertSummary.items.forEach((a) => {
      rows.push([a.severity.toUpperCase(), a.facilityName, a.message, new Date(a.at).toLocaleString(), a.id.startsWith("pred-") ? "Forecast" : "Current"]);
    });
    rows.push([]);
  }

  if (sections.has("forecastChart")) {
    rows.push(["=== FORECAST SUMMARY ==="]);
    rows.push(["Peak Census %", String(payload.forecastSummary.censusPeakPct ?? "")]);
    rows.push(["Peak ICU %", String(payload.forecastSummary.icuPeakPct ?? "")]);
    rows.push(["Trust Level", payload.forecastSummary.trustLevel ?? ""]);
    rows.push([]);
    rows.push(["=== FORECAST DATA ==="]);
    rows.push(["Time", "Census", "ICU", "Upper CI", "Lower CI"]);
    payload.timelineData.filter((d) => d.forecastCensus != null).forEach((d) => {
      rows.push([d.time, String(d.forecastCensus ?? ""), String(d.forecastIcu ?? ""), String(d.upper ?? ""), String(d.lower ?? "")]);
    });
    rows.push([]);
  }

  if (sections.has("trendCharts")) {
    rows.push(["=== HISTORICAL TRENDS ==="]);
    rows.push(["Time", "Census", "ICU", "Admissions", "Discharges"]);
    payload.timelineData.filter((d) => d.census != null).forEach((d) => {
      rows.push([d.time, String(d.census ?? ""), String(d.icu ?? ""), String(d.admissions ?? ""), String(d.discharges ?? "")]);
    });
    rows.push([]);
  }

  if (sections.has("validationMetrics") && payload.validation) {
    const v = payload.validation;
    rows.push(["=== VALIDATION METRICS ==="]);
    if (v.summary?.total_census) {
      const m = v.summary.total_census.avgMetrics;
      rows.push(["Census — MAE", String(m.mae.toFixed(2))]);
      rows.push(["Census — RMSE", String(m.rmse.toFixed(2))]);
      rows.push(["Census — MAPE", `${m.mape.toFixed(2)}%`]);
      rows.push(["Census — Bias", String(m.bias.toFixed(2))]);
      rows.push(["Census — Coverage", `${m.coverage.toFixed(1)}%`]);
      rows.push(["Census — Trust", v.summary.total_census.trust]);
    }
    if (v.summary?.icu_occupancy) {
      const m = v.summary.icu_occupancy.avgMetrics;
      rows.push(["ICU — MAE", String(m.mae.toFixed(2))]);
      rows.push(["ICU — RMSE", String(m.rmse.toFixed(2))]);
      rows.push(["ICU — MAPE", `${m.mape.toFixed(2)}%`]);
      rows.push(["ICU — Trust", v.summary.icu_occupancy.trust]);
    }
    rows.push([]);
  }

  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ts = new Date(payload.exportedAt).toISOString().slice(0, 10);
  a.download = `HCA_Data_Export_${payload.role.name.replace(/\s+/g, "_")}_${ts}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

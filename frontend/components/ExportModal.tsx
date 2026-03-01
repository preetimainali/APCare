"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { ExportPayload, ReportSection } from "@/lib/report";
import { REPORT_SECTIONS } from "@/lib/report";
import { exportToPDF, exportToCSV } from "@/lib/pdfExport";

interface ExportModalProps {
  payload: ExportPayload;
  onClose: () => void;
}

const ALL_SECTIONS: ReportSection[] = REPORT_SECTIONS.map((s) => s.key);

export function ExportModal({ payload, onClose }: ExportModalProps) {
  const [sections, setSections] = useState<Set<ReportSection>>(new Set(ALL_SECTIONS));
  const [exporting, setExporting] = useState<"pdf" | "csv" | null>(null);
  const [done, setDone] = useState<"pdf" | "csv" | null>(null);

  function toggle(key: ReportSection) {
    setSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() { setSections(new Set(ALL_SECTIONS)); }
  function selectNone() { setSections(new Set()); }

  async function handlePDF() {
    if (sections.size === 0) return;
    setExporting("pdf");
    try { await exportToPDF(payload, sections); setDone("pdf"); }
    finally { setExporting(null); }
  }

  function handleCSV() {
    if (sections.size === 0) return;
    setExporting("csv");
    exportToCSV(payload, sections);
    setDone("csv");
    setExporting(null);
  }

  const occColor = payload.occupancyPct >= 90 ? "#dc2626" : payload.occupancyPct >= 80 ? "#d97706" : "#16a34a";
  const icuColor = payload.icuPct >= 85 ? "#dc2626" : payload.icuPct >= 75 ? "#d97706" : "#16a34a";

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div style={{ position: "relative", width: "100%", maxWidth: 620, maxHeight: "90vh", margin: 16, background: "#161b22", border: "1px solid #30363d", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ background: "#0d1117", padding: "16px 20px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#21262d", border: "1px solid #30363d", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 2h7l4 4v10H4V2z" stroke="#58a6ff" strokeWidth="1.3" strokeLinejoin="round"/><path d="M11 2v4h4" stroke="#58a6ff" strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 9h5M7 12h3" stroke="#58a6ff" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e6edf3" }}>Executive Brief</p>
              <p style={{ margin: 0, fontSize: 11, color: "#8b949e" }}>Configure and export a printable report</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8b949e", cursor: "pointer", padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
          {/* Preview bar */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <MiniKpi label="Facility" value={payload.selectedFacilityName} color="#58a6ff" />
            <MiniKpi label="Occupancy" value={`${payload.occupancyPct}%`} color={occColor} />
            <MiniKpi label="ICU" value={`${payload.icuPct}%`} color={icuColor} />
            <MiniKpi label="Role" value={payload.role.name} color="#a78bfa" />
          </div>

          {/* Section selector */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e" }}>
              Report sections ({sections.size}/{REPORT_SECTIONS.length})
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={selectAll} style={{ background: "none", border: "none", color: "#58a6ff", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}>All</button>
              <button onClick={selectNone} style={{ background: "none", border: "none", color: "#8b949e", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}>None</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginBottom: 20 }}>
            {REPORT_SECTIONS.map((s) => {
              const checked = sections.has(s.key);
              return (
                <button key={s.key} onClick={() => toggle(s.key)} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                  borderRadius: 9, border: `1px solid ${checked ? "#58a6ff40" : "#30363d"}`,
                  background: checked ? "rgba(88,166,255,0.06)" : "#0d1117",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                    border: `1.5px solid ${checked ? "#58a6ff" : "#484f58"}`,
                    background: checked ? "#58a6ff" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {checked && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: checked ? "#e6edf3" : "#8b949e" }}>{s.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "#6e7681", lineHeight: 1.3 }}>{s.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Output format info */}
          <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7a5 5 0 1010 0A5 5 0 002 7z" stroke="#58a6ff" strokeWidth="1.2"/><path d="M7 5v3M7 9.5v.5" stroke="#58a6ff" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#c9d1d9" }}>Report output</p>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "#8b949e", lineHeight: 1.5 }}>
              <strong style={{ color: "#c9d1d9" }}>PDF</strong> — Professional light-background report with large headings, clean typography, and visual charts rendered for printing. Designed for executive sharing.
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8b949e", lineHeight: 1.5 }}>
              <strong style={{ color: "#c9d1d9" }}>CSV</strong> — Raw data export with selected sections for spreadsheet analysis.
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            <button onClick={handlePDF} disabled={exporting === "pdf" || sections.size === 0} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "13px 16px", border: "none", borderRadius: 10,
              background: done === "pdf" ? "rgba(22,163,74,0.12)" : sections.size === 0 ? "#21262d" : "linear-gradient(135deg, #1d4ed8, #2563eb)",
              color: done === "pdf" ? "#16a34a" : sections.size === 0 ? "#484f58" : "#fff",
              cursor: sections.size === 0 ? "not-allowed" : exporting === "pdf" ? "wait" : "pointer",
              fontSize: 13, fontWeight: 700, transition: "all 0.15s",
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2h6l3 3v9H4V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M8 7v5M6 10l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {exporting === "pdf" ? "Generating..." : done === "pdf" ? "PDF Ready!" : "Download PDF"}
            </button>

            <button onClick={handleCSV} disabled={exporting === "csv" || sections.size === 0} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "13px 16px", border: `1px solid ${sections.size === 0 ? "#21262d" : "#30363d"}`, borderRadius: 10,
              background: done === "csv" ? "rgba(88,166,255,0.08)" : "#21262d",
              color: done === "csv" ? "#58a6ff" : sections.size === 0 ? "#484f58" : "#c9d1d9",
              cursor: sections.size === 0 ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 600, transition: "all 0.15s",
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h3v8H2zM6 4h4v8H6zM11 4h3v8h-3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M2 2h12M2 14h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {done === "csv" ? "CSV Ready!" : "Export CSV"}
            </button>
          </div>

          {sections.size === 0 && (
            <p style={{ marginTop: 8, textAlign: "center", fontSize: 11, color: "#f85149" }}>Select at least one section to export.</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function MiniKpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: "1 1 100px", minWidth: 80, background: "#0d1117", border: "1px solid #21262d", borderRadius: 7, padding: "6px 10px", borderTop: `2px solid ${color}` }}>
      <p style={{ margin: 0, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6e7681" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
    </div>
  );
}

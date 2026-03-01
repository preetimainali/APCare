"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { AlertConfig, NotificationStyle, ThresholdPair } from "@/lib/alertConfig";
import { DEFAULT_CONFIG } from "@/lib/alertConfig";

interface AlertSettingsPanelProps {
  config: AlertConfig;
  onSave: (config: AlertConfig) => void;
  onClose: () => void;
}

export function AlertSettingsPanel({ config, onSave, onClose }: AlertSettingsPanelProps) {
  const [draft, setDraft] = useState<AlertConfig>({ ...config });
  const [saved, setSaved] = useState(false);

  function update(patch: Partial<AlertConfig>) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }

  function updateThreshold(key: "capacity" | "icu" | "forecastRisk", field: "warning" | "critical", value: number) {
    setDraft((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
    setSaved(false);
  }

  function toggleNotification(style: NotificationStyle) {
    setDraft((prev) => {
      const has = prev.notifications.includes(style);
      const next = has ? prev.notifications.filter((n) => n !== style) : [...prev.notifications, style];
      if (next.length === 0) next.push("dashboard");
      return { ...prev, notifications: next };
    });
    setSaved(false);
  }

  function handleSave() {
    onSave(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setDraft({ ...DEFAULT_CONFIG });
    setSaved(false);
  }

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />

      <div style={{ position: "relative", width: "100%", maxWidth: 640, maxHeight: "90vh", margin: 16, background: "#161b22", border: "1px solid #30363d", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ background: "#0d1117", padding: "16px 20px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "#21262d", border: "1px solid #30363d", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1l1.5 4.5H15l-3.5 2.7L13 13l-4-3-4 3 1.5-4.8L3 5.5h4.5z" stroke="#d29922" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#e6edf3" }}>Alert Configuration</p>
              <p style={{ margin: 0, fontSize: 11, color: "#8b949e" }}>Customize thresholds, severity, and notifications</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8b949e", cursor: "pointer", padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>

          {/* Capacity thresholds */}
          <ThresholdSection
            title="Overall Capacity Thresholds"
            description="Alerts trigger when total census exceeds these percentages of available beds."
            pair={draft.capacity}
            onChange={(f, v) => updateThreshold("capacity", f, v)}
            warningLabel="Warning threshold"
            criticalLabel="Critical threshold"
          />

          {/* ICU thresholds */}
          <ThresholdSection
            title="ICU Capacity Thresholds"
            description="Alerts trigger when ICU occupancy exceeds these percentages of ICU bed capacity."
            pair={draft.icu}
            onChange={(f, v) => updateThreshold("icu", f, v)}
            warningLabel="ICU warning"
            criticalLabel="ICU critical"
          />

          {/* Forecast thresholds */}
          <ThresholdSection
            title="Forecast Risk Thresholds"
            description="Predictive alerts trigger when the 7-day forecast peak exceeds these levels, while current occupancy remains below."
            pair={draft.forecastRisk}
            onChange={(f, v) => updateThreshold("forecastRisk", f, v)}
            warningLabel="Forecast warning"
            criticalLabel="Forecast critical"
          />

          {/* Notification style */}
          <SectionLabel text="Notification Style" />
          <p style={{ margin: "0 0 10px", fontSize: 11, color: "#8b949e", lineHeight: 1.5 }}>
            Choose how alerts are delivered. At least one method must be active.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            <NotifToggle
              active={draft.notifications.includes("dashboard")}
              onClick={() => toggleNotification("dashboard")}
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 13h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>}
              label="Dashboard"
              description="Alerts shown in the panel"
            />
            <NotifToggle
              active={draft.notifications.includes("popup")}
              onClick={() => toggleNotification("popup")}
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="1" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 9l2 3 2-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              label="Popup Toast"
              description="Slide-in notifications"
            />
            <NotifToggle
              active={draft.notifications.includes("email")}
              onClick={() => toggleNotification("email")}
              icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              label="Email (sim.)"
              description="Simulated email alerts"
            />
          </div>

          {draft.notifications.includes("email") && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e", marginBottom: 6 }}>
                Email recipient
              </label>
              <input
                type="email"
                value={draft.emailRecipient}
                onChange={(e) => update({ emailRecipient: e.target.value })}
                placeholder="admin@hca.org"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", background: "#21262d", border: "1px solid #30363d", borderRadius: 8, color: "#e6edf3", fontSize: 12, outline: "none" }}
              />
            </div>
          )}

          {/* Prioritization */}
          <SectionLabel text="Alert Prioritization" />
          <p style={{ margin: "0 0 10px", fontSize: 11, color: "#8b949e", lineHeight: 1.5 }}>
            Control how alerts are filtered to prevent overload and keep attention on what matters.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d1117", border: "1px solid #21262d", borderRadius: 8, padding: "10px 14px" }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#c9d1d9" }}>Max alerts per facility</p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#6e7681" }}>Limits alert count to prevent one facility from dominating the panel</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => update({ maxAlertsPerFacility: Math.max(1, draft.maxAlertsPerFacility - 1) })} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #30363d", background: "#21262d", color: "#c9d1d9", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <span style={{ width: 28, textAlign: "center", fontSize: 14, fontWeight: 700, color: "#58a6ff", fontFamily: "monospace" }}>{draft.maxAlertsPerFacility}</span>
                <button onClick={() => update({ maxAlertsPerFacility: Math.min(10, draft.maxAlertsPerFacility + 1) })} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #30363d", background: "#21262d", color: "#c9d1d9", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>

            <button
              onClick={() => update({ suppressInfoWhenWarning: !draft.suppressInfoWhenWarning })}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d1117", border: "1px solid #21262d", borderRadius: 8, padding: "10px 14px", cursor: "pointer", textAlign: "left" }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#c9d1d9" }}>Suppress low-priority duplicates</p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#6e7681" }}>Hide info-level alerts when a warning or critical alert already exists for the same facility and category</p>
              </div>
              <ToggleSwitch on={draft.suppressInfoWhenWarning} />
            </button>
          </div>

          {/* Explanation box */}
          <div style={{ background: "rgba(88,166,255,0.06)", border: "1px solid rgba(88,166,255,0.15)", borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#58a6ff", marginBottom: 4 }}>How alerts are triggered</p>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#8b949e", lineHeight: 1.7 }}>
              <li><strong style={{ color: "#c9d1d9" }}>Current alerts</strong> fire when the latest census snapshot exceeds your threshold.</li>
              <li><strong style={{ color: "#c9d1d9" }}>Forecast alerts</strong> fire when the 7-day prediction peak exceeds the forecast threshold, but only if the current value is still below.</li>
              <li><strong style={{ color: "#c9d1d9" }}>Trust levels</strong> (HIGH/MODERATE/LOW) are derived from model validation MAPE and affect forecast alert severity.</li>
              <li><strong style={{ color: "#c9d1d9" }}>Prioritization</strong> sorts critical alerts first, then caps per-facility counts to prevent overload.</li>
            </ul>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleSave} style={{
              flex: 1, padding: "12px", border: "none", borderRadius: 10,
              background: saved ? "rgba(63,185,80,0.12)" : "linear-gradient(135deg, #238636, #2ea043)",
              color: saved ? "#3fb950" : "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              {saved ? "Settings saved!" : "Save Configuration"}
            </button>
            <button onClick={handleReset} style={{
              padding: "12px 20px", border: "1px solid #30363d", borderRadius: 10,
              background: "#21262d", color: "#8b949e",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Sub-components ──

function SectionLabel({ text }: { text: string }) {
  return <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e" }}>{text}</p>;
}

function ThresholdSection({ title, description, pair, onChange, warningLabel, criticalLabel }: {
  title: string; description: string; pair: ThresholdPair;
  onChange: (field: "warning" | "critical", value: number) => void;
  warningLabel: string; criticalLabel: string;
}) {
  const warningValid = pair.warning < pair.critical;

  return (
    <div style={{ marginBottom: 20 }}>
      <SectionLabel text={title} />
      <p style={{ margin: "0 0 10px", fontSize: 11, color: "#8b949e", lineHeight: 1.5 }}>{description}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        <ThresholdInput label={warningLabel} value={pair.warning} onChange={(v) => onChange("warning", v)} color="#d29922" />
        <ThresholdInput label={criticalLabel} value={pair.critical} onChange={(v) => onChange("critical", v)} color="#f85149" />
      </div>
      {!warningValid && (
        <p style={{ margin: "6px 0 0", fontSize: 10, color: "#f85149" }}>Warning must be lower than critical.</p>
      )}
      {/* Visual range bar */}
      <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: "#21262d", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pair.warning}%`, background: "rgba(63,185,80,0.3)", borderRadius: "3px 0 0 3px" }} />
        <div style={{ position: "absolute", left: `${pair.warning}%`, top: 0, height: "100%", width: `${pair.critical - pair.warning}%`, background: "rgba(210,153,34,0.3)" }} />
        <div style={{ position: "absolute", left: `${pair.critical}%`, top: 0, height: "100%", width: `${100 - pair.critical}%`, background: "rgba(248,81,73,0.3)", borderRadius: "0 3px 3px 0" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <span style={{ fontSize: 9, color: "#3fb950" }}>Normal</span>
        <span style={{ fontSize: 9, color: "#d29922" }}>Warning ({pair.warning}%)</span>
        <span style={{ fontSize: 9, color: "#f85149" }}>Critical ({pair.critical}%)</span>
      </div>
    </div>
  );
}

function ThresholdInput({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 8, padding: "8px 12px", borderLeft: `3px solid ${color}` }}>
      <label style={{ display: "block", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6e7681", marginBottom: 4 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="range" min={50} max={100} step={1} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: color, height: 4 }}
        />
        <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "monospace", minWidth: 36, textAlign: "right" }}>{value}%</span>
      </div>
    </div>
  );
}

function NotifToggle({ active, onClick, icon, label, description }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; description: string }) {
  return (
    <button onClick={onClick} style={{
      flex: "1 1 100px", minWidth: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      padding: "12px 8px", borderRadius: 9,
      border: `1px solid ${active ? "#58a6ff40" : "#30363d"}`,
      background: active ? "rgba(88,166,255,0.06)" : "#0d1117",
      color: active ? "#58a6ff" : "#6e7681",
      cursor: "pointer", textAlign: "center", transition: "all 0.15s",
    }}>
      {icon}
      <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 9, color: "#6e7681" }}>{description}</span>
      {active && <span style={{ fontSize: 8, fontWeight: 700, color: "#3fb950", textTransform: "uppercase", letterSpacing: "0.1em" }}>Active</span>}
    </button>
  );
}

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <div style={{
      width: 36, height: 20, borderRadius: 10, flexShrink: 0,
      background: on ? "#238636" : "#30363d",
      position: "relative", transition: "background 0.2s",
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: 8,
        background: "#fff",
        position: "absolute", top: 2,
        left: on ? 18 : 2,
        transition: "left 0.2s",
      }} />
    </div>
  );
}

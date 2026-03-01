"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { AlertWithReason } from "@/lib/alertConfig";

interface AlertToastProps {
  alerts: AlertWithReason[];
  onDismiss: (id: string) => void;
}

const SEV_STYLES: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  critical: { bg: "#1a0a0a", border: "#f8514940", dot: "#f85149", label: "CRITICAL" },
  warning: { bg: "#1a1408", border: "#d2992240", dot: "#d29922", label: "WARNING" },
  info: { bg: "#0a1420", border: "#58a6ff30", dot: "#58a6ff", label: "INFO" },
};

export function AlertToast({ alerts, onDismiss }: AlertToastProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || alerts.length === 0) return null;

  return createPortal(
    <div style={{
      position: "fixed", bottom: 12, right: 12, left: 12, zIndex: 10000,
      display: "flex", flexDirection: "column", gap: 8,
      maxHeight: "60vh", overflowY: "auto",
      maxWidth: 360, marginLeft: "auto",
    }}>
      {alerts.map((a) => (
        <ToastItem key={a.id} alert={a} onDismiss={() => onDismiss(a.id)} />
      ))}
    </div>,
    document.body
  );
}

function ToastItem({ alert, onDismiss }: { alert: AlertWithReason; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const sev = SEV_STYLES[alert.severity] ?? SEV_STYLES.info;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 8000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div style={{
      background: sev.bg,
      border: `1px solid ${sev.border}`,
      borderLeft: `3px solid ${sev.dot}`,
      borderRadius: 10,
      padding: "12px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      transform: visible ? "translateX(0)" : "translateX(120%)",
      opacity: visible ? 1 : 0,
      transition: "all 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", background: sev.dot,
            animation: alert.severity === "critical" ? "pulse 1.5s infinite" : undefined,
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: sev.dot }}>{sev.label}</span>
          {alert.id.startsWith("pred-") && (
            <span style={{ fontSize: 9, fontWeight: 600, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.06em" }}>Forecast</span>
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(onDismiss, 300); }} style={{
          background: "none", border: "none", color: "#6e7681", cursor: "pointer", padding: 2, lineHeight: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#e6edf3" }}>{alert.facilityName}</p>
      <p style={{ margin: "3px 0 0", fontSize: 11, color: "#8b949e", lineHeight: 1.4 }}>{alert.message}</p>
      <p style={{ margin: "6px 0 0", fontSize: 10, color: "#484f58", lineHeight: 1.4, borderTop: "1px solid #21262d", paddingTop: 6 }}>
        {alert.reason}
      </p>
    </div>
  );
}

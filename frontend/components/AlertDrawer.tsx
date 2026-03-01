"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { TrustLevel } from "@/lib/types";
import type { AlertWithReason } from "@/lib/alertConfig";

interface AlertDrawerProps {
  open: boolean;
  onClose: () => void;
  alerts: AlertWithReason[];
  onOpenSettings?: () => void;
}

const severityBorder: Record<string, string> = {
  critical: "border-l-signal-red",
  warning: "border-l-signal-amber",
  info: "border-l-signal-blue",
};

const severityDot: Record<string, string> = {
  critical: "bg-signal-red pulse-critical",
  warning: "bg-signal-amber",
  info: "bg-signal-blue",
};

const severityBadge: Record<string, string> = {
  critical: "badge-critical",
  warning: "badge-warning",
  info: "badge-info",
};

const TRUST_STYLE: Record<TrustLevel, { color: string; bg: string }> = {
  HIGH: { color: "#3fb950", bg: "#3fb95018" },
  MODERATE: { color: "#d29922", bg: "#d2992218" },
  LOW: { color: "#f85149", bg: "#f8514918" },
};

function AlertRow({ alert: a }: { alert: AlertWithReason }) {
  const [expanded, setExpanded] = useState(false);
  const isForecast = a.id.startsWith("pred-");

  return (
    <div className={`rounded-md border-l-2 bg-bunker-800/50 ${severityBorder[a.severity]}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-2.5 px-3 py-2 text-left"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${severityDot[a.severity]}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={severityBadge[a.severity]}>{a.severity}</span>
            {isForecast && (
              <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-purple-400">
                Forecast
              </span>
            )}
            {isForecast && a.trust && (
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                style={{ background: TRUST_STYLE[a.trust].bg, color: TRUST_STYLE[a.trust].color }}
              >
                {a.trust === "HIGH" ? "High confidence" : a.trust === "MODERATE" ? "Moderate confidence" : "Low confidence"}
              </span>
            )}
            <span className="ml-auto flex-shrink-0 text-[10px] text-gray-600">
              {new Date(a.at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s", flexShrink: 0 }}
            >
              <path d="M2 4l3 3 3-3" stroke="#6e7681" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-1 text-xs font-medium text-gray-300">{a.facilityName}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-gray-400">{a.message}</p>
        </div>
      </button>

      {expanded && (
        <div className="mx-3 mb-2 border-t border-bunker-700 px-3 py-2" style={{ marginLeft: 28 }}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Why this alert was triggered</p>
          <p className="text-[11px] leading-relaxed text-gray-400">{a.reason}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[10px] text-gray-600">
              Threshold: <strong className="text-gray-400">{a.threshold}%</strong>
            </span>
            <span className="text-[10px] text-gray-600">
              Actual: <strong style={{ color: a.actual >= a.threshold ? "#f85149" : "#3fb950" }}>{a.actual}%</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function AlertDrawer({ open, onClose, alerts, onOpenSettings }: AlertDrawerProps) {
  const visible = alerts.filter((a) => !a.suppressed);
  const suppressed = alerts.filter((a) => a.suppressed);
  const criticalCount = visible.filter((a) => a.severity === "critical").length;
  const warningCount = visible.filter((a) => a.severity === "warning").length;
  const infoCount = visible.filter((a) => a.severity === "info").length;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const content = mounted ? (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 transition-opacity duration-300 sm:bg-black/30"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
        aria-hidden
      />
      {/* Drawer pane */}
      <div
        className="fixed right-0 top-0 z-[9999] flex h-full w-full flex-col bg-bunker-900 shadow-2xl transition-transform duration-300 ease-out sm:w-[380px]"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          borderLeft: "1px solid #30363d",
        }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-bunker-700 bg-bunker-800/80 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {criticalCount > 0 && <span className="h-2 w-2 rounded-full bg-signal-red pulse-critical" />}
            {criticalCount === 0 && <span className="h-1.5 w-1.5 rounded-full bg-signal-green" />}
            <span className="text-sm font-semibold uppercase tracking-wider text-gray-200">Capacity Alerts</span>
            <div className="flex flex-wrap items-center gap-1">
              {criticalCount > 0 && <span className="badge-critical">{criticalCount} critical</span>}
              {warningCount > 0 && <span className="badge-warning">{warningCount} warning</span>}
              {infoCount > 0 && <span className="badge-info">{infoCount} info</span>}
              {visible.length === 0 && <span className="text-[10px] text-gray-600">None active</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-bunker-700 bg-bunker-800 text-gray-500 transition hover:border-bunker-600 hover:text-gray-300"
                title="Alert settings"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v1M6 10v1M1 6h1M10 6h1M2.5 2.5l.7.7M8.8 8.8l.7.7M9.5 2.5l-.7.7M3.2 8.8l-.7.7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1"/></svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-bunker-700 bg-bunker-800 text-gray-500 transition hover:border-bunker-600 hover:text-gray-200"
              aria-label="Close drawer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-3">
          {visible.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-12 text-center text-sm text-gray-600">
              All capacity levels within normal parameters
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {visible.map((a) => (
                <AlertRow key={a.id} alert={a} />
              ))}
            </div>
          )}
          {suppressed.length > 0 && (
            <div className="mt-3 rounded-md border border-bunker-700 bg-bunker-800/40 px-3 py-2">
              <p className="text-[10px] text-gray-600">
                {suppressed.length} lower-priority alert{suppressed.length > 1 ? "s" : ""} suppressed by prioritization rules.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  ) : null;

  return mounted ? createPortal(content, document.body) : null;
}

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRoles } from "@/lib/roles";
import { useHeaderActions } from "@/lib/headerActions";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { facilities as allFacilities, getSnapshot } from "@/lib/data";
import { generateConfiguredAlerts, loadAlertConfig } from "@/lib/alertConfig";

const PILL_COLORS: Record<string, { dot: string; text: string; border: string }> = {
  red: { dot: "#f85149", text: "#f85149", border: "rgba(248,81,73,0.35)" },
  amber: { dot: "#d29922", text: "#d29922", border: "rgba(210,153,34,0.35)" },
  green: { dot: "#3fb950", text: "#3fb950", border: "rgba(63,185,80,0.35)" },
};

function StatusPill({ label, value, color }: { label: string; value: string; color: "red" | "amber" | "green" }) {
  const c = PILL_COLORS[color];
  return (
    <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-1" style={{ borderColor: c.border }}>
      <span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span>
      <span className="data-value text-xs font-semibold" style={{ color: c.text }}>{value}</span>
    </div>
  );
}

function CompactKpi({ label, value, color }: { label: string; value: string; color: "red" | "amber" | "green" }) {
  const c = PILL_COLORS[color];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 9, color: "#6e7681", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: c.text, fontFamily: "var(--font-jetbrains), monospace" }}>{value}</span>
    </div>
  );
}

export function GlobalHeader() {
  const pathname = usePathname();
  const { canViewPage, canViewDashboard, allowedFacilityIds } = useRoles();
  const { exportAction, shareAction, alertsDrawerAction } = useHeaderActions();
  const showAlertsButton = pathname === "/" && canViewDashboard("alerts");

  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        actionsRef.current && !actionsRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { setActionsOpen(false); }, [pathname]);

  const facilities = useMemo(
    () => allowedFacilityIds === "all" ? allFacilities : allFacilities.filter(f => allowedFacilityIds.includes(f.id)),
    [allowedFacilityIds]
  );

  const { occupancyPct, icuPct } = useMemo(() => {
    const snaps = facilities.map(f => getSnapshot(f.id)).filter(Boolean);
    const totalBeds = facilities.reduce((s, f) => s + f.beds, 0);
    const census = snaps.reduce((s, snap) => s + (snap?.total_census ?? 0), 0);
    const icuMax = facilities.reduce((s, f) => s + f.icuMax, 0);
    const icuOccupied = snaps.reduce((s, snap) => s + (snap?.icu_occupancy ?? 0), 0);
    return {
      occupancyPct: totalBeds > 0 ? Math.round((census / totalBeds) * 100) : 0,
      icuPct: icuMax > 0 ? Math.round((icuOccupied / icuMax) * 100) : 0,
    };
  }, [facilities]);

  const alertCount = useMemo(() => {
    if (!mounted) return 0;
    const config = loadAlertConfig();
    const allAlerts = generateConfiguredAlerts(config);
    const allowedIds = new Set(facilities.map(f => f.id));
    return allAlerts.filter(a => !a.suppressed && allowedIds.has(a.facilityId)).length;
  }, [mounted, facilities]);

  const occColor: "red" | "amber" | "green" = occupancyPct >= 90 ? "red" : occupancyPct >= 75 ? "amber" : "green";
  const icuColor: "red" | "amber" | "green" = icuPct >= 85 ? "red" : icuPct >= 75 ? "amber" : "green";
  const alertColor: "red" | "amber" | "green" = alertCount >= 5 ? "red" : alertCount > 0 ? "amber" : "green";

  const hasAnyAction = exportAction || shareAction;

  function toggleActions() {
    if (!actionsOpen && actionsRef.current) {
      const rect = actionsRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setActionsOpen(!actionsOpen);
  }

  const actionsMenu = actionsOpen && mounted && hasAnyAction
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            right: menuPos.right,
            zIndex: 9999,
            width: "min(210px, calc(100vw - 32px))",
            background: "#1c2129",
            border: "1px solid #444c56",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "6px 0" }}>
            {exportAction && (
              <button
                onClick={() => { exportAction(); setActionsOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "12px 16px",
                  border: "none", background: "transparent",
                  cursor: "pointer", textAlign: "left",
                  fontSize: 13, fontWeight: 500, color: "#9ca3af",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#272e38"; e.currentTarget.style.color = "#e6edf3"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2h5l3 3v7H3V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M7 6v4M5 8l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Export Brief
              </button>
            )}
            {shareAction && (
              <button
                onClick={() => { shareAction(); setActionsOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "12px 16px",
                  border: "none", background: "transparent",
                  cursor: "pointer", textAlign: "left",
                  fontSize: 13, fontWeight: 500, color: "#9ca3af",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#272e38"; e.currentTarget.style.color = "#e6edf3"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="3.5" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 6.5l4.5-2.5M5 7.5l4.5 2.5" stroke="currentColor" strokeWidth="1.2"/></svg>
                Secure Share
              </button>
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-bunker-800 bg-bunker-900/95 backdrop-blur-sm">
      {/* Row 1 — Identity + System Status */}
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-3 py-2 sm:px-6 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-bunker-700 bg-bunker-800 sm:h-9 sm:w-9">
            <span className="text-base font-bold text-signal-green sm:text-lg">H</span>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-gray-100 sm:text-lg">
              Hospital Command Center
            </h1>
            <p className="truncate text-[9px] text-gray-500 sm:text-xs">
              HCA Healthcare &middot; Executive capacity dashboard
            </p>
          </div>
        </div>

        {/* Desktop KPI pills */}
        <div className="hidden items-center gap-3 sm:flex">
          <StatusPill label="Overall" value={`${occupancyPct}%`} color={occColor} />
          <StatusPill label="ICU" value={`${icuPct}%`} color={icuColor} />
          <StatusPill label="Alerts" value={String(alertCount)} color={alertColor} />
        </div>
      </div>

      {/* Mobile-only compact KPI strip */}
      <div className="flex items-center justify-center gap-4 border-t border-bunker-800/30 px-3 py-1.5 sm:hidden">
        <CompactKpi label="OCC" value={`${occupancyPct}%`} color={occColor} />
        <CompactKpi label="ICU" value={`${icuPct}%`} color={icuColor} />
        <CompactKpi label="ALERTS" value={String(alertCount)} color={alertColor} />
      </div>

      {/* Subtle inner divider */}
      <div className="border-t border-bunker-800/50" />

      {/* Row 2 — Navigation + Actions */}
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-3 py-1 sm:px-6 sm:py-1.5">
        <nav className="flex items-center gap-1">
          {canViewPage("dashboard") && (
            <Link
              href="/"
              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition sm:px-3.5 sm:py-1.5 sm:text-xs ${
                pathname === "/"
                  ? "border-signal-green/30 bg-signal-green/10 text-signal-green"
                  : "border-transparent text-gray-400 hover:bg-bunker-800 hover:text-gray-200"
              }`}
            >
              Dashboard
            </Link>
          )}
          {canViewPage("validation") && (
            <Link
              href="/validation"
              className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition sm:px-3.5 sm:py-1.5 sm:text-xs ${
                pathname === "/validation"
                  ? "border-signal-green/30 bg-signal-green/10 text-signal-green"
                  : "border-transparent text-gray-400 hover:bg-bunker-800 hover:text-gray-200"
              }`}
            >
              Validation
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {showAlertsButton && alertsDrawerAction && (
            <button
              onClick={() => alertsDrawerAction()}
              className={`flex items-center gap-2 rounded-md border px-2.5 py-1 text-[11px] font-medium transition hover:opacity-90 sm:px-3 sm:py-1.5 sm:text-xs ${
                alertCount > 0
                  ? "border-signal-red/40 bg-signal-red/10 text-signal-red"
                  : "border-bunker-700 text-gray-400 hover:bg-bunker-800 hover:text-gray-200"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v3l2 4H5l2-4V1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 10v2a1 1 0 001 1h6a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Alerts
              {alertCount > 0 && (
                <span className="rounded-full bg-current/20 px-1.5 py-0.5 text-[10px] font-bold">
                  {alertCount}
                </span>
              )}
            </button>
          )}
          {hasAnyAction && (
            <>
              <button
                ref={actionsRef}
                onClick={toggleActions}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 8,
                  border: "1px solid #30363d",
                  background: "#21262d",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#58a6ff",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#58a6ff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#30363d"; }}
              >
                Actions
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  style={{ transition: "transform 0.2s", transform: actionsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {actionsMenu}
            </>
          )}
          <RoleSwitcher />
        </div>
      </div>
    </header>
  );
}

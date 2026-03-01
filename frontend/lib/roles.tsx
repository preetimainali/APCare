"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Role, DashboardComponent, ValidationComponent, PageAccess } from "./types";

const STORAGE_KEY = "hcc-roles";
const ACTIVE_KEY = "hcc-active-role";

export const ALL_DASHBOARD_COMPONENTS: { key: DashboardComponent; label: string }[] = [
  { key: "capacityGauge", label: "Capacity gauge" },
  { key: "icuRisk", label: "ICU risk indicator" },
  { key: "capacityOverview", label: "Capacity overview stats" },
  { key: "flowTrend", label: "Patient flow trend chart" },
  { key: "forecast", label: "7-day forecast chart" },
  { key: "alerts", label: "Capacity alerts panel" },
];

export const ALL_VALIDATION_COMPONENTS: { key: ValidationComponent; label: string }[] = [
  { key: "riskClassification", label: "Risk classification table" },
  { key: "accuracyMetrics", label: "Accuracy metrics" },
  { key: "predictedVsActual", label: "Predicted vs actual charts" },
  { key: "driverBreakdown", label: "Driver breakdown" },
];

export const ALL_PAGES: { key: PageAccess; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "validation", label: "Validation" },
];

const ALL_DASH: DashboardComponent[] = ALL_DASHBOARD_COMPONENTS.map((c) => c.key);
const ALL_VAL: ValidationComponent[] = ALL_VALIDATION_COMPONENTS.map((c) => c.key);
const ALL_PG: PageAccess[] = ALL_PAGES.map((p) => p.key);

const BUILT_IN_ROLES: Role[] = [
  {
    id: "admin",
    name: "Administrator",
    facilityAccess: "all",
    pages: [...ALL_PG],
    dashboardComponents: [...ALL_DASH],
    validationComponents: [...ALL_VAL],
    isBuiltIn: true,
  },
  {
    id: "cno",
    name: "Chief Nursing Officer",
    facilityAccess: "all",
    pages: ["dashboard"],
    dashboardComponents: ["capacityGauge", "icuRisk", "capacityOverview", "alerts"],
    validationComponents: [],
    isBuiltIn: true,
  },
  {
    id: "cfo",
    name: "CFO",
    facilityAccess: "all",
    pages: ["dashboard"],
    dashboardComponents: ["capacityGauge", "capacityOverview", "flowTrend"],
    validationComponents: [],
    isBuiltIn: true,
  },
  {
    id: "analyst",
    name: "Data Analyst",
    facilityAccess: "all",
    pages: [...ALL_PG],
    dashboardComponents: ["flowTrend", "forecast", "alerts"],
    validationComponents: [...ALL_VAL],
    isBuiltIn: true,
  },
];

interface RoleContextValue {
  roles: Role[];
  activeRole: Role;
  setActiveRoleId: (id: string) => void;
  addRole: (role: Role) => void;
  updateRole: (role: Role) => void;
  deleteRole: (id: string) => void;
  canViewPage: (page: PageAccess) => boolean;
  canViewDashboard: (comp: DashboardComponent) => boolean;
  canViewValidation: (comp: ValidationComponent) => boolean;
  allowedFacilityIds: "all" | string[];
  adminPanelOpen: boolean;
  setAdminPanelOpen: (open: boolean) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function useRoles() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRoles must be used inside RoleProvider");
  return ctx;
}

function loadRoles(): Role[] {
  if (typeof window === "undefined") return BUILT_IN_ROLES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const custom: Role[] = JSON.parse(stored);
      return [...BUILT_IN_ROLES, ...custom.filter((r) => !BUILT_IN_ROLES.some((b) => b.id === r.id))];
    }
  } catch { /* ignore */ }
  return BUILT_IN_ROLES;
}

function saveCustomRoles(roles: Role[]) {
  const custom = roles.filter((r) => !r.isBuiltIn);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

function loadActiveId(): string {
  if (typeof window === "undefined") return "admin";
  return localStorage.getItem(ACTIVE_KEY) ?? "admin";
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<Role[]>(BUILT_IN_ROLES);
  const [activeRoleId, setActiveRoleIdState] = useState("admin");
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  useEffect(() => {
    setRoles(loadRoles());
    setActiveRoleIdState(loadActiveId());
  }, []);

  const activeRole = roles.find((r) => r.id === activeRoleId) ?? roles[0];

  const setActiveRoleId = useCallback((id: string) => {
    setActiveRoleIdState(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }, []);

  const addRole = useCallback((role: Role) => {
    setRoles((prev) => {
      const next = [...prev, role];
      saveCustomRoles(next);
      return next;
    });
  }, []);

  const updateRole = useCallback((role: Role) => {
    setRoles((prev) => {
      const next = prev.map((r) => (r.id === role.id ? role : r));
      saveCustomRoles(next);
      return next;
    });
  }, []);

  const deleteRole = useCallback((id: string) => {
    setRoles((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveCustomRoles(next);
      return next;
    });
    setActiveRoleId("admin");
  }, [setActiveRoleId]);

  const canViewPage = useCallback(
    (page: PageAccess) => activeRole.pages.includes(page),
    [activeRole]
  );

  const canViewDashboard = useCallback(
    (comp: DashboardComponent) => activeRole.dashboardComponents.includes(comp),
    [activeRole]
  );

  const canViewValidation = useCallback(
    (comp: ValidationComponent) => activeRole.validationComponents.includes(comp),
    [activeRole]
  );

  return (
    <RoleContext.Provider
      value={{
        roles,
        activeRole,
        setActiveRoleId,
        addRole,
        updateRole,
        deleteRole,
        canViewPage,
        canViewDashboard,
        canViewValidation,
        allowedFacilityIds: activeRole.facilityAccess,
        adminPanelOpen,
        setAdminPanelOpen,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

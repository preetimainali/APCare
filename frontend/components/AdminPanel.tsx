"use client";

import { useState } from "react";
import { useRoles, ALL_DASHBOARD_COMPONENTS, ALL_VALIDATION_COMPONENTS, ALL_PAGES } from "@/lib/roles";
import { facilities } from "@/lib/data";
import type { Role, DashboardComponent, ValidationComponent, PageAccess } from "@/lib/types";

function newBlankRole(): Omit<Role, "id"> {
  return {
    name: "",
    facilityAccess: "all",
    pages: ["dashboard", "validation"],
    dashboardComponents: ALL_DASHBOARD_COMPONENTS.map((c) => c.key),
    validationComponents: ALL_VALIDATION_COMPONENTS.map((c) => c.key),
  };
}

export function AdminPanel() {
  const { roles, adminPanelOpen, setAdminPanelOpen, addRole, updateRole, deleteRole, activeRole, setActiveRoleId } = useRoles();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [draft, setDraft] = useState<Omit<Role, "id">>(newBlankRole());
  const [mode, setMode] = useState<"list" | "edit">("list");

  if (!adminPanelOpen) return null;

  function startCreate() {
    setDraft(newBlankRole());
    setEditingRole(null);
    setMode("edit");
  }

  function startEdit(role: Role) {
    setDraft({ ...role });
    setEditingRole(role);
    setMode("edit");
  }

  function handleSave() {
    if (!draft.name.trim()) return;
    if (editingRole) {
      updateRole({ ...editingRole, ...draft });
    } else {
      const id = `custom-${Date.now()}`;
      addRole({ id, ...draft });
      setActiveRoleId(id);
    }
    setMode("list");
  }

  function handleDelete(id: string) {
    deleteRole(id);
  }

  function toggleArray<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }

  function toggleFacility(fid: string) {
    if (draft.facilityAccess === "all") {
      setDraft({ ...draft, facilityAccess: [fid] });
    } else {
      const next = toggleArray(draft.facilityAccess, fid);
      setDraft({ ...draft, facilityAccess: next.length === 0 || next.length === facilities.length ? "all" : next });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAdminPanelOpen(false)} />

      {/* Panel */}
      <div className="relative ml-auto flex h-full w-full max-w-lg flex-col border-l border-bunker-700 bg-bunker-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bunker-700 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-100">Admin Mode</h2>
            <p className="text-[10px] text-gray-500">Role-based dashboard customization</p>
          </div>
          <button
            onClick={() => setAdminPanelOpen(false)}
            className="rounded-lg border border-bunker-700 p-1.5 text-gray-500 transition hover:bg-bunker-800 hover:text-gray-300"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {mode === "list" ? (
            <div className="space-y-4">
              {/* Active role indicator */}
              <div className="rounded-lg border border-signal-green/20 bg-signal-green/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Active role</p>
                <p className="mt-0.5 text-sm font-semibold text-signal-green">{activeRole.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeRole.pages.map((p) => (
                    <span key={p} className="rounded bg-bunker-800 px-1.5 py-0.5 text-[9px] text-gray-400">{p}</span>
                  ))}
                  <span className="rounded bg-bunker-800 px-1.5 py-0.5 text-[9px] text-gray-400">
                    {activeRole.facilityAccess === "all" ? "All facilities" : `${activeRole.facilityAccess.length} facilities`}
                  </span>
                </div>
              </div>

              {/* Role list */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-300">Roles</p>
                  <button
                    onClick={startCreate}
                    className="rounded-md border border-signal-green/30 bg-signal-green/10 px-2.5 py-1 text-[10px] font-semibold text-signal-green transition hover:bg-signal-green/20"
                  >
                    + New role
                  </button>
                </div>
                <div className="space-y-1.5">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className={`group flex items-center justify-between rounded-lg border px-3 py-2.5 transition ${
                        activeRole.id === role.id
                          ? "border-signal-green/30 bg-signal-green/5"
                          : "border-bunker-700 bg-bunker-800/30 hover:border-bunker-600"
                      }`}
                    >
                      <button
                        onClick={() => setActiveRoleId(role.id)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-200">{role.name}</span>
                          {role.isBuiltIn && (
                            <span className="rounded bg-bunker-700 px-1.5 py-0.5 text-[9px] text-gray-500">Built-in</span>
                          )}
                          {activeRole.id === role.id && (
                            <span className="rounded-full bg-signal-green/15 px-1.5 py-0.5 text-[9px] font-semibold text-signal-green">Active</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] text-gray-500">
                          {role.pages.join(", ")} · {role.dashboardComponents.length + role.validationComponents.length} widgets
                          · {role.facilityAccess === "all" ? "All facilities" : `${role.facilityAccess.length} facility`}
                        </p>
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => startEdit(role)}
                          className="rounded p-1 text-gray-500 hover:bg-bunker-700 hover:text-gray-300"
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M9.5 2.5l2 2M2 10l-.5 2.5L4 12l7.5-7.5-2-2L2 10z" stroke="currentColor" strokeWidth="1.2" />
                          </svg>
                        </button>
                        {!role.isBuiltIn && (
                          <button
                            onClick={() => handleDelete(role.id)}
                            className="rounded p-1 text-gray-500 hover:bg-signal-red/10 hover:text-signal-red"
                            title="Delete"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M3 4h8l-.7 8H3.7L3 4zM5.5 2h3M2 4h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Edit / Create mode */
            <div className="space-y-5">
              <button
                onClick={() => setMode("list")}
                className="flex items-center gap-1 text-xs text-gray-500 transition hover:text-gray-300"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back to roles
              </button>

              <h3 className="text-sm font-semibold text-gray-200">
                {editingRole ? `Edit: ${editingRole.name}` : "Create new role"}
              </h3>

              {/* Name */}
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-gray-500">Role name</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g., CFO, Nursing Director"
                  className="w-full rounded-lg border border-bunker-600 bg-bunker-800 px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-600 focus:border-signal-green focus:ring-1 focus:ring-signal-green/30"
                  disabled={editingRole?.isBuiltIn}
                />
              </div>

              {/* Page access */}
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-wider text-gray-500">Page access</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PAGES.map((p) => (
                    <ToggleChip
                      key={p.key}
                      label={p.label}
                      active={draft.pages.includes(p.key)}
                      onClick={() => setDraft({ ...draft, pages: toggleArray(draft.pages, p.key) as PageAccess[] })}
                    />
                  ))}
                </div>
              </div>

              {/* Dashboard components */}
              {draft.pages.includes("dashboard") && (
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-wider text-gray-500">Dashboard widgets</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_DASHBOARD_COMPONENTS.map((c) => (
                      <ToggleChip
                        key={c.key}
                        label={c.label}
                        active={draft.dashboardComponents.includes(c.key)}
                        onClick={() => setDraft({ ...draft, dashboardComponents: toggleArray(draft.dashboardComponents, c.key) as DashboardComponent[] })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Validation components */}
              {draft.pages.includes("validation") && (
                <div>
                  <label className="mb-2 block text-[10px] uppercase tracking-wider text-gray-500">Validation widgets</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_VALIDATION_COMPONENTS.map((c) => (
                      <ToggleChip
                        key={c.key}
                        label={c.label}
                        active={draft.validationComponents.includes(c.key)}
                        onClick={() => setDraft({ ...draft, validationComponents: toggleArray(draft.validationComponents, c.key) as ValidationComponent[] })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Facility access */}
              <div>
                <label className="mb-2 block text-[10px] uppercase tracking-wider text-gray-500">Facility access</label>
                <div className="mb-2">
                  <ToggleChip
                    label="All facilities"
                    active={draft.facilityAccess === "all"}
                    onClick={() => setDraft({ ...draft, facilityAccess: "all" })}
                    accent
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {facilities.map((f) => (
                    <ToggleChip
                      key={f.id}
                      label={f.name}
                      active={draft.facilityAccess === "all" || draft.facilityAccess.includes(f.id)}
                      onClick={() => toggleFacility(f.id)}
                      small
                    />
                  ))}
                </div>
              </div>

              {/* Save */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={!draft.name.trim()}
                  className="flex-1 rounded-lg bg-signal-green px-4 py-2.5 text-xs font-semibold text-bunker-950 transition hover:bg-signal-green/90 disabled:opacity-40"
                >
                  {editingRole ? "Save changes" : "Create role"}
                </button>
                <button
                  onClick={() => setMode("list")}
                  className="rounded-lg border border-bunker-700 px-4 py-2.5 text-xs text-gray-400 transition hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleChip({ label, active, onClick, accent, small }: { label: string; active: boolean; onClick: () => void; accent?: boolean; small?: boolean }) {
  const base = small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border font-medium transition ${base} ${
        active
          ? accent
            ? "border-signal-green/40 bg-signal-green/15 text-signal-green"
            : "border-purple-500/40 bg-purple-500/15 text-purple-400"
          : "border-bunker-700 bg-bunker-800/40 text-gray-500 hover:border-bunker-600 hover:text-gray-400"
      }`}
    >
      {label}
    </button>
  );
}

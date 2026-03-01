"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRoles } from "@/lib/roles";

export function RoleSwitcher() {
  const { roles, activeRole, setActiveRoleId, setAdminPanelOpen } = useRoles();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen(!open);
  }

  const menu = open && mounted
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: pos.top,
            right: Math.max(8, pos.right),
            zIndex: 9999,
            width: "min(272px, calc(100vw - 24px))",
            background: "#1c2129",
            border: "1px solid #444c56",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #30363d", background: "#272e38" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#a78bfa", margin: 0 }}>
              Switch role
            </p>
          </div>

          {/* Role options */}
          <div style={{ padding: "4px 0" }}>
            {roles.map((role) => {
              const isActive = activeRole.id === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => { setActiveRoleId(role.id); setOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 16px",
                    border: "none",
                    background: isActive ? "rgba(139,92,246,0.12)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: 500,
                    color: isActive ? "#c4b5fd" : "#9ca3af",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "#272e38"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? "rgba(139,92,246,0.12)" : "transparent"; }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: isActive ? "#a78bfa" : "#484f58",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1 }}>{role.name}</span>
                  {isActive && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: "rgba(139,92,246,0.2)",
                        color: "#a78bfa",
                      }}
                    >
                      Active
                    </span>
                  )}
                  {role.isBuiltIn && !isActive && (
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#30363d", color: "#6e7681" }}>
                      Built-in
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Admin link */}
          <div style={{ borderTop: "1px solid #30363d" }}>
            <button
              onClick={() => { setAdminPanelOpen(true); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "12px 16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 12,
                fontWeight: 600,
                color: "#8b949e",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#272e38"; e.currentTarget.style.color = "#e6edf3"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b949e"; }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Manage roles (Admin)
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          border: "2px solid rgba(139,92,246,0.5)",
          borderRadius: 8,
          background: "rgba(139,92,246,0.12)",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: "#c4b5fd",
          transition: "all 0.15s",
          maxWidth: 180,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.7)"; e.currentTarget.style.background = "rgba(139,92,246,0.18)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)"; e.currentTarget.style.background = "rgba(139,92,246,0.12)"; }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: "#a78bfa", flexShrink: 0 }}>
          <path d="M8 1C5.8 1 4 2.8 4 5s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zM2 14c0-2.2 2.7-4 6-4s6 1.8 6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeRole.name}</span>
        <svg
          width="10" height="10" viewBox="0 0 12 12" fill="none"
          style={{ color: "#a78bfa", flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M3 4.5L6 7.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {menu}
    </>
  );
}

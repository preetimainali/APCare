"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { buildShareToken, buildShareUrl } from "@/lib/report";
import type { ExportPayload } from "@/lib/report";

interface ShareModalProps {
  payload: ExportPayload;
  onClose: () => void;
}

type Step = "compose" | "sending" | "sent";

const ALLOWED_DOMAIN = "@hca.org";

export function ShareModal({ payload, onClose }: ShareModalProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<Step>("compose");
  const [copied, setCopied] = useState(false);

  const token = buildShareToken(payload);
  const shareUrl = buildShareUrl(token);

  function validateEmail(val: string): string {
    if (!val.trim()) return "Email address is required.";
    if (!val.toLowerCase().endsWith(ALLOWED_DOMAIN))
      return "Only @hca.org email addresses are permitted for secure sharing.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      return "Please enter a valid email address.";
    return "";
  }

  function handleSend() {
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setEmailError("");
    setStep("sending");
    setTimeout(() => setStep("sent"), 1400);
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={step !== "sending" ? onClose : undefined} />

      <div style={{ position: "relative", width: "100%", maxWidth: 520, margin: 16, background: "#161b22", border: "1px solid #30363d", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        {/* Header */}
        <div style={{ background: "#0d1117", padding: "16px 20px", borderBottom: "1px solid #21262d", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#21262d", border: "1px solid #30363d", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="4" cy="8" r="2" stroke="#3fb950" strokeWidth="1.2"/>
                <circle cx="13" cy="3" r="2" stroke="#3fb950" strokeWidth="1.2"/>
                <circle cx="13" cy="13" r="2" stroke="#3fb950" strokeWidth="1.2"/>
                <path d="M6 7l5-3M6 9l5 3" stroke="#3fb950" strokeWidth="1.2"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e6edf3" }}>Secure Share</p>
              <p style={{ margin: 0, fontSize: 11, color: "#8b949e" }}>Enterprise-restricted sharing · @hca.org only</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8b949e", cursor: "pointer", padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {step !== "sent" ? (
            <>
              {/* View snapshot */}
              <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
                <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e" }}>View snapshot being shared</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <SnapRow label="Role" value={payload.role.name} />
                  <SnapRow label="Facility" value={payload.selectedFacilityName} />
                  <SnapRow label="Date range" value={`${payload.startDate} → ${payload.endDate}`} />
                  <SnapRow label="Components" value={`${payload.visibleComponents.length} visible`} />
                </div>
              </div>

              {/* Share link */}
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e" }}>Generated secure link</p>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                <div style={{ flex: 1, background: "#21262d", border: "1px solid #30363d", borderRadius: 8, padding: "9px 12px", fontFamily: "monospace", fontSize: 11, color: "#c9d1d9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {shareUrl}
                </div>
                <button onClick={handleCopy} style={{ padding: "9px 14px", border: "1px solid #30363d", borderRadius: 8, background: copied ? "rgba(63,185,80,0.1)" : "#21262d", color: copied ? "#3fb950" : "#c9d1d9", cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.15s" }}>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e", marginBottom: 6 }}>Send to (@hca.org only)</label>
                <input
                  type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  placeholder="colleague@hca.org"
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", background: "#21262d", border: `1px solid ${emailError ? "#f85149" : "#30363d"}`, borderRadius: 8, color: "#e6edf3", fontSize: 13, outline: "none" }}
                />
                {emailError && (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.3)", borderRadius: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#f85149" strokeWidth="1.2"/><path d="M6 3v4M6 8.5v.5" stroke="#f85149" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    <span style={{ fontSize: 11, color: "#ff7b72" }}>{emailError}</span>
                  </div>
                )}
              </div>

              {/* Note */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e", marginBottom: 6 }}>Note (optional)</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add context for the recipient..." rows={2}
                  style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", background: "#21262d", border: "1px solid #30363d", borderRadius: 8, color: "#c9d1d9", fontSize: 12, outline: "none", resize: "none", fontFamily: "inherit" }} />
              </div>

              {/* Domain notice */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(88,166,255,0.06)", border: "1px solid rgba(88,166,255,0.2)", borderRadius: 8, marginBottom: 16 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="4" width="12" height="9" rx="1.5" stroke="#58a6ff" strokeWidth="1.2"/><path d="M5 4V2.5a2 2 0 014 0V4" stroke="#58a6ff" strokeWidth="1.2" strokeLinecap="round"/><circle cx="7" cy="8.5" r="1.2" fill="#58a6ff"/></svg>
                <p style={{ margin: 0, fontSize: 11, color: "#8b949e" }}>
                  Sharing restricted to <strong style={{ color: "#58a6ff" }}>@hca.org</strong> addresses. Links expire after 24 hours.
                </p>
              </div>

              <button onClick={handleSend} disabled={step === "sending"} style={{
                width: "100%", padding: 13, border: "none", borderRadius: 10,
                background: step === "sending" ? "#21262d" : "linear-gradient(135deg, #238636, #2ea043)",
                color: step === "sending" ? "#8b949e" : "#fff",
                fontSize: 14, fontWeight: 700, cursor: step === "sending" ? "wait" : "pointer", letterSpacing: "0.02em",
              }}>
                {step === "sending" ? "Sending..." : "Send Secure Link"}
              </button>
            </>
          ) : (
            /* ── Success ── */
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(63,185,80,0.12)", border: "2px solid #3fb950", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#3fb950" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#e6edf3" }}>Link sent successfully</p>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#8b949e" }}>
                A secure dashboard link has been simulated to<br/>
                <strong style={{ color: "#58a6ff" }}>{email}</strong>
              </p>

              {/* Email preview */}
              <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 10, padding: "12px 16px", marginBottom: 20, textAlign: "left" }}>
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e" }}>Simulated email preview</p>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6e7681" }}>From: <span style={{ color: "#8b949e" }}>noreply@hca-command-center.hca.org</span></p>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6e7681" }}>To: <span style={{ color: "#58a6ff" }}>{email}</span></p>
                <p style={{ margin: "0 0 10px", fontSize: 11, color: "#6e7681" }}>Subject: <span style={{ color: "#c9d1d9" }}>HCA Dashboard View — {payload.role.name} · {payload.selectedFacilityName}</span></p>
                <div style={{ borderTop: "1px solid #21262d", paddingTop: 10 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, color: "#c9d1d9" }}>You have been granted access to an HCA Hospital Command Center dashboard view.</p>
                  {note && <p style={{ margin: "0 0 6px", fontSize: 12, color: "#8b949e", fontStyle: "italic" }}>Note: &ldquo;{note}&rdquo;</p>}
                  <p style={{ margin: "0 0 6px", fontSize: 11, color: "#6e7681" }}>Role: {payload.role.name} · Facility: {payload.selectedFacilityName}</p>
                  <p style={{ margin: "0 0 6px", fontSize: 11, color: "#6e7681" }}>Valid for 24 hours. @hca.org authentication required.</p>
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "#21262d", borderRadius: 6, fontFamily: "monospace", fontSize: 10, color: "#58a6ff", wordBreak: "break-all" }}>
                    {shareUrl}
                  </div>
                </div>
              </div>

              <button onClick={onClose} style={{ padding: "10px 28px", border: "1px solid #30363d", borderRadius: 8, background: "#21262d", color: "#e6edf3", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function SnapRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 9, color: "#6e7681", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#c9d1d9" }}>{value}</p>
    </div>
  );
}

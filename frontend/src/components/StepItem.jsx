import { useState } from "react";

function StepIcon({ status }) {
  if (status === "pending")    return <span style={{ color: "var(--text-muted)" }}>○</span>;
  if (status === "generating") return <span style={{ color: "var(--primary)", display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span>;
  if (status === "sending")    return <span style={{ color: "var(--warning)", display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>;
  if (status === "done")       return <span style={{ color: "var(--success)" }}>✓</span>;
  if (status === "error")      return <span style={{ color: "var(--error)" }}>✗</span>;
  return null;
}

export default function StepItem({ step }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = step.status === "generating" || step.status === "sending";

  return (
    <div className={`stepItem ${isActive ? "active" : ""}`} style={{
      overflow: "hidden",
      cursor: step.code ? "pointer" : "default",
    }}
    onClick={() => step.code && setExpanded((v) => !v)}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", userSelect: "none" }}
      >
        <StepIcon status={step.status} />
        <span style={{ flex: 1, fontSize: "13px", fontWeight: isActive ? "700" : "600", color: isActive ? "var(--primary-dark)" : "var(--text-main)" }}>
          Step {step.index}: {step.label}
        </span>
        {step.code && <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{expanded ? "▲" : "▼"}</span>}
      </div>
      {expanded && step.code && (
        <pre className="codeBlock" style={{ margin: 0, borderRadius: 0, borderTop: "1px solid var(--glass-border)", maxHeight: "250px" }}>
          <code>{step.code}</code>
        </pre>
      )}
      {step.fusionResult && !step.fusionResult.success && (
        <div className="errorBubble" style={{ margin: 0, borderRadius: 0, background: "rgba(239, 68, 68, 0.1)", color: "var(--error)", padding: "10px 14px", fontSize: "13px", borderTop: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <span style={{ marginRight: "8px" }}>⚠</span>
          {step.fusionResult.message}
        </div>
      )}
    </div>
  );
}

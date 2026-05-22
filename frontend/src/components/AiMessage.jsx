import StepItem from "./StepItem";

export default function AiMessage({ msg }) {
  if (msg.type === "error") {
    return (
      <div className="message assistant">
        <div className="messageAvatar ai">✦</div>
        <div className="messageBubble aiBubble" style={{ background: "rgba(254, 242, 242, 0.8)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
             <span style={{ fontSize: "20px" }}>⚠</span>
             <div>
                <div style={{ fontWeight: "700", color: "#991b1b" }}>Error Detected</div>
                <div style={{ fontSize: "13px", color: "#b91c1c" }}>{msg.statusText}</div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message assistant">
      <div className="messageAvatar ai">✦</div>
      <div className="messageBubble aiBubble">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {msg.type !== "done"
              ? <div className="streamingDots"><span /><span /><span /></div>
              : <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "var(--success)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>✓</div>
            }
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-main)" }}>{msg.statusText}</span>
          </div>
          {msg.totalSteps > 0 && (
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--primary-dark)", background: "rgba(14, 165, 233, 0.1)", padding: "2px 10px", borderRadius: "var(--radius-full)" }}>
              {msg.currentStep} / {msg.totalSteps}
            </span>
          )}
        </div>

        {msg.totalSteps > 0 && (
          <div style={{ height: "6px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "var(--radius-full)", marginBottom: "16px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(msg.currentStep / msg.totalSteps) * 100}%`,
              background: "var(--primary-gradient)",
              transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }} />
          </div>
        )}

        {msg.steps?.length > 0 && (
          <div style={{ marginTop: "4px" }}>
            {msg.steps.map((step) => <StepItem key={step.index} step={step} />)}
          </div>
        )}

        {msg.type === "done" && (
          <div style={{
            marginTop: "16px", padding: "14px",
            background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "var(--radius-sm)", color: "#065f46", fontSize: "14px", fontWeight: "700",
            textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}>
            <span>✨</span> Model Ready in Fusion 360!
          </div>
        )}
      </div>
    </div>
  );
}

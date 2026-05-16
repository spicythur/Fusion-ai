import { useState, useRef, useEffect } from "react";
import { useFusionStatus, useGenerate } from "./hooks/useFusion";
import "./App.css";

const PRESETS = [
  { icon: "📦", label: "Box 5x5x5cm", prompt: "Create a 5cm x 5cm x 5cm box" },
  { icon: "🔩", label: "Hex bolt M8", prompt: "Create a hex bolt M8 with head diameter 13mm, head height 5mm, shaft diameter 8mm, shaft length 30mm" },
  { icon: "🫙", label: "Hollow cylinder", prompt: "Create a hollow cylinder outer diameter 40mm inner diameter 34mm height 60mm" },
  { icon: "📐", label: "L-bracket", prompt: "Create an L-bracket 80mm x 40mm thickness 5mm with 4 M4 bolt holes on each side" },
  { icon: "⚙️", label: "Spur gear", prompt: "Create a spur gear with 20 teeth module 2 width 15mm bore hole 8mm" },
  { icon: "📱", label: "Phone stand", prompt: "Create a simple phone stand with base 80x60mm height 100mm at 70 degree angle" },
];

function StepIcon({ status }) {
  if (status === "pending")    return <span style={{ color: "var(--text-muted)" }}>○</span>;
  if (status === "generating") return <span style={{ color: "var(--primary)", display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span>;
  if (status === "sending")    return <span style={{ color: "var(--warning)", display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>;
  if (status === "done")       return <span style={{ color: "var(--success)" }}>✓</span>;
  if (status === "error")      return <span style={{ color: "var(--error)" }}>✗</span>;
  return null;
}

function StepItem({ step }) {
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

function AiMessage({ msg }) {
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

export default function App() {
  const { connected, checking } = useFusionStatus();
  const { messages, loading, generate } = useGenerate();
  const [prompt, setPrompt] = useState("");
  const [autoSend, setAutoSend] = useState(true);
  const chatRef = useRef(null);
  const textareaRef = useRef(null);

  const hasMessages = messages.filter((m) => m.type !== "welcome").length > 0;

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleSend = (promptText) => {
    const p = (promptText || prompt).trim();
    if (!p || loading) return;
    generate({ prompt: p, autoSend });
    setPrompt("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  return (
    <div className="app">
      <div className="app-bg-3" />
      {/* Header */}
      <header className="header">
        <div className="headerLeft">
          <div className="logo">F</div>
          <div>
            <div className="headerTitle">Fusion AI Generator</div>
            <div className="headerSubtitle">Natural Language to 3D Model</div>
          </div>
        </div>
        <div className="headerRight">
          <div className={`statusBadge ${connected ? "connected" : "disconnected"}`}>
            <div className={`statusDot ${connected ? "active" : "inactive"}`} />
            <span>{checking ? "Checking..." : connected ? "Fusion 360 Connected" : "Disconnected"}</span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="chatArea" ref={chatRef}>
        {!hasMessages ? (
          <div className="welcome">
            <div className="welcomeIcon">✦</div>
            <div>
              <div className="welcomeTitle">Mulai Membuat di Fusion 360</div>
              <div className="welcomeDesc">
                Jelaskan model 3D yang ingin Anda buat dalam bahasa alami. AI akan mengeksekusi langkah-langkah desain secara otomatis.
              </div>
            </div>
            <div className="presets">
              {PRESETS.map((p) => (
                <button key={p.label} className="presetChip" onClick={() => handleSend(p.prompt)}>
                  <span>{p.icon}</span> {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.filter((m) => m.type !== "welcome").map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className="message user">
                <div className="messageAvatar userAvatar">👤</div>
                <div className="messageBubble userBubble">{msg.content}</div>
              </div>
            ) : (
              <AiMessage key={msg.id} msg={msg} />
            )
          )
        )}
      </div>

      {/* Input Area */}
      <div className="inputArea">
        <div className="inputContainer">
          <div className="inputControls">
            <div className="autoSendToggle" onClick={() => setAutoSend((v) => !v)}>
              <div className={`toggleTrack ${autoSend ? "active" : ""}`}>
                <div className="toggleThumb" />
              </div>
              Auto-send to Fusion 360
            </div>
            {!connected && !checking && (
              <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--error)", marginLeft: "auto", background: "var(--error-bg)", padding: "4px 10px", borderRadius: "var(--radius-full)" }}>
                ⚠ Add-in tidak terdeteksi
              </span>
            )}
          </div>

          <div className="inputWrapper">
            <textarea
              ref={textareaRef}
              className="inputField"
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); autoResize(e); }}
              onKeyDown={handleKey}
              placeholder="Deskripsikan model 3D (cth: Buat kotak 5x5cm)..."
              rows={1}
              disabled={loading}
            />
            <button className="sendBtn" onClick={() => handleSend()} disabled={loading || !prompt.trim()}>
              {loading ? "⟳" : "↑"}
            </button>
          </div>

          {loading && (
            <div className="statusBar">
              <div className="streamingDots"><span /><span /><span /></div>
              <span>AI sedang memproses permintaan Anda...</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .stepItem:hover { border-color: var(--primary); box-shadow: var(--shadow-sm); }
      `}</style>
    </div>
  );
}
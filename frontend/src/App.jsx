import { useState, useRef, useEffect, useCallback } from "react";
import { useFusion } from "./hooks/useFusion";
import "./App.css";

// ---------------------------------------------------------------------------
// Preset prompts
// ---------------------------------------------------------------------------
const PRESETS = [
  { icon: "📦", label: "Box", prompt: "Create a 5cm x 5cm x 5cm box" },
  { icon: "⚙️", label: "Gear", prompt: "Create a spur gear with 20 teeth, module 1, and 10mm thickness" },
  { icon: "🔩", label: "Bolt M8", prompt: "Create a hex bolt M8 with head diameter 13mm, head height 5mm, shaft diameter 8mm, shaft length 30mm" },
  { icon: "📱", label: "Phone Stand", prompt: "Create a simple phone stand with base 80x60mm height 100mm at 70 degree angle" },
  { icon: "🔧", label: "L-Bracket", prompt: "Create an L-bracket 80mm x 40mm thickness 5mm with 4 M4 bolt holes on each side" },
  { icon: "🏗️", label: "Flanged Pipe", prompt: "Create a flanged pipe: outer diameter 3cm, inner diameter 2.4cm, length 10cm, flange 5cm diameter 0.5cm thick" },
  { icon: "🛞", label: "Spoked Wheel", prompt: "Create a spoked wheel outer diameter 10cm, hub diameter 3cm, bore 2cm, 5 spokes width 1cm" },
  { icon: "⚡", label: "Drone Frame", prompt: "Create an X-frame drone: center plate 5x5x0.5cm, four arms 12cm each, motor mount pads 3cm diameter at each arm tip" },
];

// ---------------------------------------------------------------------------
// App Component
// ---------------------------------------------------------------------------
function App() {
  const {
    wsConnected,
    fusionConnected,
    isGenerating,
    lastResult,
    messages,
    sendPrompt,
    sendToFusion,
    clearChat,
  } = useFusion();

  const [input, setInput] = useState("");
  const [autoSend, setAutoSend] = useState(true);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lastResult]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "24px";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }, [input]);

  // Submit handler
  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    sendPrompt(trimmed, autoSend);
    setInput("");
  }, [input, isGenerating, autoSend, sendPrompt]);

  // Keyboard handler
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Download as .py
  const downloadCode = (code) => {
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fusion_script_${Date.now()}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preset click
  const handlePreset = (prompt) => {
    if (isGenerating) return;
    sendPrompt(prompt, autoSend);
  };

  // Retry last user prompt
  const handleRetry = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg && !isGenerating) {
      sendPrompt(lastUserMsg.content, autoSend);
    }
  }, [messages, isGenerating, autoSend, sendPrompt]);

  // Check if chat has messages
  const hasMessages = messages.length > 0 || isGenerating;

  // Find last assistant message (for success card)
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="app">
      {/* ---- HEADER ---- */}
      <header className="header">
        <div className="headerLeft">
          <div className="logo">✦</div>
          <div>
            <div className="headerTitle">Fusion AI</div>
            <div className="headerSubtitle">Natural Language → 3D Models</div>
          </div>
        </div>

        <div className="headerRight">
          {hasMessages && (
            <button className="headerBtn" onClick={clearChat} id="clear-chat-btn" title="Clear chat">
              <span className="headerBtnIcon">↺</span> New
            </button>
          )}

          <div className={`statusBadge ${wsConnected ? "connected" : "disconnected"}`}>
            <span className={`statusDot ${wsConnected ? "active" : "inactive"}`}></span>
            <span>Server</span>
          </div>

          <div className={`statusBadge ${fusionConnected ? "connected" : "disconnected"}`}>
            <span className={`statusDot ${fusionConnected ? "active" : "inactive"}`}></span>
            <span>Fusion 360</span>
          </div>
        </div>
      </header>

      {/* ---- CHAT AREA ---- */}
      <div className="chatArea">
        {!hasMessages ? (
          /* Welcome Screen */
          <div className="welcome">
            <div className="welcomeIcon">✦</div>
            <h1 className="welcomeTitle">What do you want to create?</h1>
            <p className="welcomeDesc">
              Describe any 3D model in natural language.<br />
              AI generates the script and sends it to Fusion 360.
            </p>

            <div className="presets">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  className="presetChip"
                  onClick={() => handlePreset(p.prompt)}
                  id={`preset-${i}`}
                >
                  <span className="presetIcon">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                {/* User message */}
                {msg.role === "user" && (
                  <>
                    <div style={{ flex: 1 }} />
                    <div className="messageBubble userBubble">{msg.content}</div>
                    <div className="messageAvatar userAvatar">U</div>
                  </>
                )}

                {/* Assistant message — show success card, not raw code */}
                {msg.role === "assistant" && (
                  <>
                    <div className="messageAvatar ai">✦</div>
                    <div className="messageBubble aiBubble">
                      <div className="successCard">
                        <div className="successHeader">
                          <div className="successIcon">✓</div>
                          <div className="successText">
                            <div className="successTitle">Script Generated</div>
                            <div className="successMeta">{msg.content.length} characters</div>
                          </div>
                        </div>
                        <div className="successActions">
                          <button
                            className="actionBtn"
                            onClick={() => downloadCode(msg.content)}
                            id={`download-btn-${i}`}
                          >
                            ↓ Download
                          </button>
                          <button
                            className="actionBtn primary"
                            onClick={() => sendToFusion(msg.content)}
                            id={`send-fusion-btn-${i}`}
                          >
                            → Send to Fusion
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Error message */}
                {msg.role === "error" && (
                  <>
                    <div className="messageAvatar ai">✦</div>
                    <div className="messageBubble aiBubble">
                      <div className="errorCard">
                        <div className="errorIcon">!</div>
                        <div className="errorText">{msg.content}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Generating indicator */}
            {isGenerating && (
              <div className="message assistant">
                <div className="messageAvatar ai">✦</div>
                <div className="generatingCard">
                  <div className="generatingPulse"></div>
                  <div className="generatingText">
                    {lastResult?.message || "Generating script..."}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ---- INPUT AREA ---- */}
      <div className="inputArea">
        <div className="inputRow">
          <div className="inputWrapper">
            <textarea
              ref={textareaRef}
              className="inputField"
              placeholder="Describe a 3D model..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              id="prompt-input"
            />
            <button
              className="sendBtn"
              onClick={handleSubmit}
              disabled={!input.trim() || isGenerating}
              id="send-btn"
            >
              {isGenerating ? (
                <span className="sendSpinner"></span>
              ) : (
                <span className="sendArrow">→</span>
              )}
            </button>
          </div>

          <label className="autoSendToggle" id="auto-send-toggle">
            <div
              className={`toggleTrack ${autoSend ? "active" : ""}`}
              onClick={() => setAutoSend(!autoSend)}
            >
              <div className="toggleThumb"></div>
            </div>
            <span className="toggleLabel">Auto-send</span>
          </label>
        </div>

        {/* Status Bar */}
        {lastResult && !isGenerating && (
          <div className={`statusBar ${lastResult.status}`}>
            <span className="statusIcon">
              {lastResult.status === "success" && "✓"}
              {lastResult.status === "error" && "✗"}
              {lastResult.status === "sending" && "↻"}
            </span>
            {lastResult.message}
            {lastResult.status === "error" && (
              <button className="retryBtn" onClick={handleRetry}>
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

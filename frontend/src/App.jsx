import { useState, useRef, useEffect, useCallback } from "react";
import { useFusion } from "./hooks/useFusion";
import "./App.css";

// ---------------------------------------------------------------------------
// Preset prompts
// ---------------------------------------------------------------------------
const PRESETS = [
  { label: "Box 5x5x5 cm", prompt: "Create a 5cm x 5cm x 5cm box" },
  { label: "Cylinder r=3 h=8", prompt: "Create a cylinder with radius 3cm and height 8cm" },
  { label: "Spur Gear 20T", prompt: "Create a spur gear with 20 teeth, module 1, and 10mm thickness" },
  { label: "Phone Case", prompt: "Create a basic phone case for a 15cm x 7cm x 0.8cm phone with 1mm wall thickness and rounded corners" },
  { label: "Simple House", prompt: "Create a simple house shape with a rectangular base 10cm x 8cm x 6cm and a triangular roof" },
  { label: "Star Shape", prompt: "Create a 5-pointed star shape extruded to 1cm thickness with outer radius 5cm" },
  { label: "Hex Bolt M8", prompt: "Create a hex bolt M8 with head diameter 13mm, head height 5mm, shaft diameter 8mm, and shaft length 30mm" },
  { label: "Torus Ring", prompt: "Create a torus (donut shape) with major radius 4cm and minor radius 1cm" },
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
  const [autoSend, setAutoSend] = useState(false);
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

  // Copy to clipboard
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
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

  return (
    <div className="app">
      {/* ---- HEADER ---- */}
      <header className="header">
        <div className="headerLeft">
          <div className="logo">F</div>
          <div>
            <div className="headerTitle">Fusion AI Generator</div>
            <div className="headerSubtitle">Natural Language → 3D Models</div>
          </div>
        </div>

        <div className="headerRight">
          {/* Clear chat */}
          {hasMessages && (
            <button className="headerBtn" onClick={clearChat} id="clear-chat-btn" title="Clear chat">
              Clear
            </button>
          )}

          {/* WebSocket status */}
          <div className={`statusBadge ${wsConnected ? "connected" : "disconnected"}`}>
            <span className={`statusDot ${wsConnected ? "active" : "inactive"}`}></span>
            <span>Server</span>
          </div>

          {/* Fusion status */}
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
            <div className="welcomeIcon">F</div>
            <h1 className="welcomeTitle">What do you want to create?</h1>
            <p className="welcomeDesc">
              Describe any 3D model in natural language and I'll generate the
              Fusion 360 Python script to build it automatically.
            </p>

            <div className="presets">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  className="presetChip"
                  onClick={() => handlePreset(p.prompt)}
                  id={`preset-${i}`}
                >
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
                {msg.role === "assistant" && (
                  <div className="messageAvatar ai">F</div>
                )}

                {msg.role === "user" && (
                  <>
                    <div style={{ flex: 1 }} />
                    <div className="messageBubble userBubble">{msg.content}</div>
                    <div className="messageAvatar userAvatar">U</div>
                  </>
                )}

                {msg.role === "assistant" && (
                  <div className="messageBubble aiBubble">
                    <div className="codeWrapper">
                      <pre className="codeBlock">{msg.content}</pre>
                      <div className="codeActions">
                        <button
                          className="codeBtn"
                          onClick={() => copyCode(msg.content)}
                          id={`copy-btn-${i}`}
                        >
                          Copy
                        </button>
                        <button
                          className="codeBtn"
                          onClick={() => downloadCode(msg.content)}
                          id={`download-btn-${i}`}
                        >
                          Download
                        </button>
                        <button
                          className="codeBtn sendFusion"
                          onClick={() => sendToFusion(msg.content)}
                          id={`send-fusion-btn-${i}`}
                        >
                          Send to Fusion
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {msg.role === "error" && (
                  <div className="errorBubble">
                    <span>!</span>
                    <span>{msg.content}</span>
                  </div>
                )}
              </div>
            ))}

            {/* Generating indicator */}
            {isGenerating && (
              <div className="message assistant">
                <div className="messageAvatar ai">F</div>
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
        <div className="inputControls">
          <label className="autoSendToggle" id="auto-send-toggle">
            <div
              className={`toggleTrack ${autoSend ? "active" : ""}`}
              onClick={() => setAutoSend(!autoSend)}
            >
              <div className="toggleThumb"></div>
            </div>
            <span>Auto-send to Fusion 360</span>
          </label>
        </div>

        <div className="inputWrapper">
          <textarea
            ref={textareaRef}
            className="inputField"
            placeholder="Describe a 3D model... (Enter to send, Shift+Enter for new line)"
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
            {isGenerating ? "..." : "→"}
          </button>
        </div>

        {/* Status Bar */}
        {lastResult && (
          <div className={`statusBar ${lastResult.status}`}>
            {lastResult.status === "success" && ""}
            {lastResult.status === "error" && ""}
            {lastResult.status === "sending" && ""}
            {lastResult.message}
            {lastResult.status === "error" && !isGenerating && (
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

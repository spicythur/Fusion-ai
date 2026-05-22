export default function InputArea({
  prompt,
  setPrompt,
  handleSend,
  loading,
  autoSend,
  setAutoSend,
  connected,
  checking,
  textareaRef,
  handleKey,
  autoResize
}) {
  return (
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
  );
}

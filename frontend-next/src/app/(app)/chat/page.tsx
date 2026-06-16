"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useFusion } from "@/hooks/useFusion";
import WelcomeScreen from "@/components/WelcomeScreen";
import MessageBubble from "@/components/MessageBubble";
import InputArea from "@/components/InputArea";
import { Wifi, WifiOff, Box, RotateCcw } from "lucide-react";

export default function ChatPage() {
  const { wsConnected, fusionConnected, isGenerating, lastResult, messages, sendPrompt, sendToFusion, clearChat } = useFusion();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [autoSend, setAutoSend] = useState(true);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, lastResult]);

  const handleSubmit = useCallback((prompt: string) => { sendPrompt(prompt, autoSend); }, [sendPrompt, autoSend]);
  const handlePreset = useCallback((prompt: string) => { if (!isGenerating) sendPrompt(prompt, autoSend); }, [sendPrompt, autoSend, isGenerating]);

  const downloadCode = useCallback((code: string) => {
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `fusion_${Date.now()}.py`; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const hasMessages = messages.length > 0 || isGenerating;

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-2.5 glass" style={{ borderBottom: "1px solid var(--glass-border)" }}>
        <div className="flex items-center gap-1.5">
          {wsConnected ? <Wifi size={12} style={{ color: "var(--success)" }} /> : <WifiOff size={12} style={{ color: "var(--text-tertiary)" }} />}
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Server</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Box size={12} style={{ color: fusionConnected ? "var(--success)" : "var(--text-tertiary)" }} />
          <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Fusion 360</span>
        </div>
        {hasMessages && (
          <button onClick={clearChat} className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors" style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <RotateCcw size={11} /> New Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          <WelcomeScreen onPreset={handlePreset} />
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} index={i} onDownload={downloadCode} onSendToFusion={sendToFusion} />
            ))}
            {isGenerating && (
              <div className="flex items-start gap-3 px-6 py-4 animate-fade-in">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: "var(--accent)" }}>F</div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{lastResult?.message || "Generating..."}</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Status */}
      {lastResult && !isGenerating && (
        <div className="flex items-center justify-center gap-1.5 mx-4 mb-2 px-3 py-1.5 rounded-lg text-xs"
          style={{
            background: lastResult.status === "success" ? "var(--success-soft)" : lastResult.status === "error" ? "var(--error-soft)" : "var(--accent-soft)",
            color: lastResult.status === "success" ? "var(--success)" : lastResult.status === "error" ? "var(--error)" : "var(--accent)",
          }}
        >
          {lastResult.message}
        </div>
      )}

      <InputArea isGenerating={isGenerating} autoSend={autoSend} onToggleAutoSend={() => setAutoSend(!autoSend)} onSubmit={handleSubmit} />
    </div>
  );
}

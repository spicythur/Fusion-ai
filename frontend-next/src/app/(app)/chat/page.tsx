"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useFusion } from "@/hooks/useFusion";
import WelcomeScreen from "@/components/WelcomeScreen";
import MessageBubble from "@/components/MessageBubble";
import InputArea from "@/components/InputArea";

export default function ChatPage() {
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

  const chatEndRef = useRef<HTMLDivElement>(null);
  const [autoSend, setAutoSend] = useState(true);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, lastResult]);

  const handleSubmit = useCallback((prompt: string) => {
    sendPrompt(prompt, autoSend);
  }, [sendPrompt, autoSend]);

  const handlePreset = useCallback((prompt: string) => {
    if (!isGenerating) sendPrompt(prompt, autoSend);
  }, [sendPrompt, autoSend, isGenerating]);

  const downloadCode = useCallback((code: string) => {
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fusion_script_${Date.now()}.py`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const hasMessages = messages.length > 0 || isGenerating;

  return (
    <div className="flex flex-col h-full">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-6 py-2 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? "bg-emerald-400" : "bg-[var(--text-muted)]"}`}></div>
          <span className="text-xs text-[var(--text-muted)]">Server</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${fusionConnected ? "bg-emerald-400" : "bg-[var(--text-muted)]"}`}></div>
          <span className="text-xs text-[var(--text-muted)]">Fusion 360</span>
        </div>
        {hasMessages && (
          <button onClick={clearChat} className="ml-auto px-3 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-all">
            ↺ New Chat
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
              <MessageBubble
                key={i}
                message={msg}
                index={i}
                onDownload={downloadCode}
                onSendToFusion={sendToFusion}
              />
            ))}

            {isGenerating && (
              <div className="flex items-start gap-3 px-6 py-4 animate-[fadeIn_0.3s_ease]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">✦</div>
                <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                  <span className="text-sm text-[var(--text-secondary)]">{lastResult?.message || "Generating script..."}</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Status message */}
      {lastResult && !isGenerating && (
        <div className={`flex items-center justify-center gap-2 mx-6 mb-2 px-4 py-2 rounded-lg text-xs font-medium ${
          lastResult.status === "success" ? "bg-emerald-500/10 text-emerald-400" :
          lastResult.status === "error" ? "bg-red-500/10 text-red-400" :
          "bg-blue-500/10 text-blue-400"
        }`}>
          {lastResult.status === "success" && "✓"}
          {lastResult.status === "error" && "✗"}
          {lastResult.message}
        </div>
      )}

      {/* Input */}
      <InputArea
        isGenerating={isGenerating}
        autoSend={autoSend}
        onToggleAutoSend={() => setAutoSend(!autoSend)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useFusion } from "@/hooks/useFusion";
import Header from "@/components/Header";
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
    <div className="flex flex-col h-screen max-h-screen w-full max-w-[720px] mx-auto bg-[var(--bg)] relative overflow-hidden">
      <Header
        wsConnected={wsConnected}
        fusionConnected={fusionConnected}
        hasMessages={hasMessages}
        onClear={clearChat}
      />

      <div className="flex-1 overflow-y-auto flex flex-col">
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
              <div className="flex items-start gap-2.5 px-5 py-4 animate-[fadeIn_0.25s_ease]">
                <div className="w-7 h-7 rounded-full bg-[var(--text)] text-[var(--bg)] flex items-center justify-center text-xs font-semibold shrink-0">✦</div>
                <div className="flex items-center gap-2.5 px-3 py-3 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl animate-[fadeIn_0.25s_ease]">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0 animate-pulse"></div>
                  <div className="text-[13px] text-[var(--text-secondary)] font-medium">
                    {lastResult?.message || "Generating script..."}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      {lastResult && !isGenerating && (
        <div className={`flex items-center justify-center gap-1.5 mx-5 mb-2 px-3 py-1.5 rounded-lg text-xs font-medium text-center ${
          lastResult.status === "success" ? "bg-[var(--success-soft)] text-[#059669]" :
          lastResult.status === "error" ? "bg-[var(--error-soft)] text-[var(--error)]" :
          "bg-[var(--accent-soft)] text-[var(--accent)]"
        }`}>
          {lastResult.status === "success" && "✓"}
          {lastResult.status === "error" && "✗"}
          {lastResult.status === "sending" && "↻"}
          {lastResult.message}
        </div>
      )}

      <InputArea
        isGenerating={isGenerating}
        autoSend={autoSend}
        onToggleAutoSend={() => setAutoSend(!autoSend)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

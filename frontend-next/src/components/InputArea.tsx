"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";

interface InputAreaProps {
  isGenerating: boolean;
  autoSend: boolean;
  onToggleAutoSend: () => void;
  onSubmit: (prompt: string) => void;
}

export default function InputArea({ isGenerating, autoSend, onToggleAutoSend, onSubmit }: InputAreaProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "24px"; ta.style.height = Math.min(ta.scrollHeight, 100) + "px"; }
  }, [input]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    onSubmit(trimmed);
    setInput("");
  }, [input, isGenerating, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="shrink-0 p-3 glass" style={{ borderTop: "1px solid var(--glass-border)" }}>
      <div className="flex items-end gap-2">
        <div className="flex-1 flex items-end gap-2 rounded-xl px-3.5 py-2.5 glass-input">
          <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Describe a 3D model..." rows={1}
            className="flex-1 bg-transparent border-none outline-none text-sm resize-none min-h-[24px] max-h-[100px]" style={{ color: "var(--text-primary)" }} aria-label="Prompt input" />
          <button onClick={handleSubmit} disabled={!input.trim() || isGenerating}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-30" style={{ background: "var(--accent)", color: "#fff" }} aria-label="Send prompt">
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>

        <button onClick={onToggleAutoSend}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium border transition-colors shrink-0"
          style={{ background: autoSend ? "var(--accent-soft)" : "var(--bg-elevated)", borderColor: autoSend ? "var(--accent)" : "var(--border)", color: autoSend ? "var(--accent)" : "var(--text-tertiary)" }}
          aria-pressed={autoSend}
        >
          <div className="w-6 h-3 rounded-full relative transition-colors" style={{ background: autoSend ? "var(--accent)" : "var(--bg-hover)" }}>
            <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-[1px] transition-transform shadow-sm" style={{ left: 2, transform: autoSend ? "translateX(10px)" : "none" }} />
          </div>
          Auto
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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
    if (ta) {
      ta.style.height = "24px";
      ta.style.height = Math.min(ta.scrollHeight, 100) + "px";
    }
  }, [input]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;
    onSubmit(trimmed);
    setInput("");
  }, [input, isGenerating, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="shrink-0 p-4 bg-[var(--bg)] border-t border-[var(--border)]">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3">
          <div className="flex-1 flex items-end gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-4 py-3 focus-within:border-blue-500/50 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe a 3D model..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-sm text-white leading-relaxed resize-none min-h-[24px] max-h-[100px] placeholder:text-[var(--text-muted)]"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isGenerating}
              className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all shrink-0"
            >
              {isGenerating ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              )}
            </button>
          </div>

          <button
            onClick={onToggleAutoSend}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium transition-all ${
              autoSend 
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" 
                : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border)]"
            }`}
          >
            <div className={`w-8 h-[18px] rounded-full relative transition-colors ${autoSend ? "bg-blue-500" : "bg-[var(--bg-elevated)]"}`}>
              <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-transform shadow-sm ${autoSend ? "translate-x-[14px]" : "left-[2px]"}`}></div>
            </div>
            Auto-send
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy, Download, Send, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

interface Message { role: "user" | "assistant" | "error"; content: string; timestamp?: number; }
interface MessageBubbleProps { message: Message; index: number; onDownload: (code: string) => void; onSendToFusion: (code: string) => void; }

export default function MessageBubble({ message, index, onDownload, onSendToFusion }: MessageBubbleProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => { navigator.clipboard.writeText(message.content); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (message.role === "user") {
    return (
      <div className="flex items-start gap-3 px-6 py-4 animate-fade-in">
        <div className="flex-1" />
        <div className="max-w-[70%] px-3.5 py-2 rounded-xl text-sm" style={{ background: "var(--accent)", color: "#fff" }}>
          {message.content}
        </div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: "var(--text-tertiary)" }}>U</div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex items-start gap-3 px-6 py-4 animate-fade-in">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: "var(--accent)" }}>F</div>
        <div className="flex items-start gap-2 p-3 rounded-xl border" style={{ background: "var(--error-soft)", borderColor: "var(--error)", maxWidth: "80%" }}>
          <AlertCircle size={14} style={{ color: "var(--error)", flexShrink: 0, marginTop: 2 }} />
          <span className="text-xs" style={{ color: "var(--error)" }}>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 px-6 py-4 animate-fade-in">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: "var(--accent)" }}>F</div>
      <div className="flex-1 max-w-[85%]">
        <div className="rounded-xl overflow-hidden glass-card">
          {/* Status */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--success)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--success)" }}>Script generated</span>
            </div>
            <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{message.content.length} chars</span>
          </div>

          {/* Actions */}
          <div className="flex border-t" style={{ borderColor: "var(--border)" }}>
            <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors" style={{ color: "var(--text-secondary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
            </button>
            <div className="w-px" style={{ background: "var(--border)" }} />
            <button onClick={() => onDownload(message.content)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors" style={{ color: "var(--text-secondary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <Download size={12} /> Download
            </button>
            <div className="w-px" style={{ background: "var(--border)" }} />
            <button onClick={() => onSendToFusion(message.content)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors" style={{ color: "var(--accent)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-soft)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <Send size={12} /> Send to Fusion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

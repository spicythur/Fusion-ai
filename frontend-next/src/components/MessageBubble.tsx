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
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--success)" }} />
              <span className="text-[11px] font-medium" style={{ color: "var(--success)" }}>Generated</span>
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{message.content.length} chars</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleCopy} className="p-1 rounded transition-colors" style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }} aria-label="Copy code">
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
              <button onClick={() => setExpanded(!expanded)} className="p-1 rounded transition-colors" style={{ color: "var(--text-tertiary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }} aria-label={expanded ? "Collapse code" : "Expand code"}>
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* Code */}
          <div className={`overflow-hidden transition-all duration-200 ${expanded ? "max-h-[500px]" : "max-h-24"}`}>
            <pre className="p-3 text-[11px] font-mono overflow-x-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <code>{message.content}</code>
            </pre>
          </div>
          {!expanded && <div className="h-6 -mt-6 relative z-10" style={{ background: `linear-gradient(transparent, var(--bg-surface))` }} />}

          {/* Actions */}
          <div className="flex border-t" style={{ borderColor: "var(--border)" }}>
            <button onClick={() => onDownload(message.content)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors" style={{ color: "var(--text-secondary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <Download size={12} /> Download
            </button>
            <div className="w-px" style={{ background: "var(--border)" }} />
            <button onClick={() => onSendToFusion(message.content)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors" style={{ color: "var(--accent)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-soft)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <Send size={12} /> Send to Fusion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

interface Message {
  role: "user" | "assistant" | "error";
  content: string;
  timestamp?: number;
}

interface MessageBubbleProps {
  message: Message;
  index: number;
  onDownload: (code: string) => void;
  onSendToFusion: (code: string) => void;
}

export default function MessageBubble({ message, index, onDownload, onSendToFusion }: MessageBubbleProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === "user") {
    return (
      <div className="flex items-start gap-3 px-6 py-4 animate-[slideInRight_0.3s_ease]">
        <div className="flex-1" />
        <div className="max-w-[70%] px-4 py-3 bg-blue-600 text-white rounded-2xl rounded-br-md text-sm leading-relaxed">
          {message.content}
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">U</div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex items-start gap-3 px-6 py-4 animate-[fadeIn_0.3s_ease]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">✦</div>
        <div className="max-w-[80%]">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full text-xs font-bold shrink-0">!</div>
            <div className="text-sm text-red-400 leading-relaxed">{message.content}</div>
          </div>
        </div>
      </div>
    );
  }

  // Assistant — code with expand/collapse
  return (
    <div className="flex items-start gap-3 px-6 py-4 animate-[fadeIn_0.3s_ease]">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">✦</div>
      <div className="flex-1 max-w-[85%]">
        {/* Code block */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs font-medium text-emerald-400">Generated Script</span>
              <span className="text-xs text-[var(--text-muted)]">({message.content.length} chars)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-all"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="px-2.5 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-all"
              >
                {expanded ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          {/* Code preview / full */}
          <div className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-[600px]" : "max-h-32"}`}>
            <pre className="p-4 text-xs text-[var(--text-secondary)] font-mono overflow-x-auto leading-relaxed">
              <code>{message.content}</code>
            </pre>
          </div>

          {/* Gradient overlay when collapsed */}
          {!expanded && (
            <div className="h-8 bg-gradient-to-t from-[var(--bg-card)] to-transparent -mt-8 relative z-10"></div>
          )}

          {/* Actions */}
          <div className="flex border-t border-[var(--border)]">
            <button
              onClick={() => onDownload(message.content)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </button>
            <div className="w-px bg-[var(--border)]"></div>
            <button
              onClick={() => onSendToFusion(message.content)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/5 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              Send to Fusion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

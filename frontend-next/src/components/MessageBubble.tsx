"use client";

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
  if (message.role === "user") {
    return (
      <div className="flex items-start gap-3 px-5 py-4 animate-slide-in-right">
        <div className="flex-1" />
        <div className="max-w-[80%] px-4 py-3 bg-blue-600 text-white rounded-2xl rounded-br-md text-sm leading-relaxed">
          {message.content}
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">U</div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex items-start gap-3 px-5 py-4 animate-fade-in-up">
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

  // Assistant — success card
  return (
    <div className="flex items-start gap-3 px-5 py-4 animate-fade-in-up">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">✦</div>
      <div className="max-w-[440px] w-full">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-blue-500/30 transition-all group">
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg">✓</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">Script Generated</div>
              <div className="text-xs text-[var(--text-muted)]">{message.content.length} characters • Ready to execute</div>
            </div>
          </div>
          <div className="flex border-t border-[var(--border)]">
            <button onClick={() => onDownload(message.content)} className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </button>
            <div className="w-px bg-[var(--border)]"></div>
            <button onClick={() => onSendToFusion(message.content)} className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/5 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              Send to Fusion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";

const BACKEND_URL = "http://localhost:3001";
const WS_URL = "ws://localhost:3001/ws/generate";

// ── Status koneksi Fusion ────────────────────────────────────────────────────
export function useFusionStatus() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/fusion/status`, { signal: AbortSignal.timeout(3000) });
      const d = await r.json();
      setConnected(d.connected);
    } catch {
      setConnected(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [check]);

  return { connected, checking };
}

// ── Main generate hook ───────────────────────────────────────────────────────
export function useGenerate() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "ai",
      type: "welcome",
      content: "Siap! Deskripsiin model 3D yang mau kamu buat. Untuk model kompleks, gw akan otomatis pecah jadi beberapa langkah dan eksekusi satu per satu ke Fusion 360.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateMessage = useCallback((id, updater) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updater(m) } : m))
    );
  }, []);

  const generate = useCallback(({ prompt, autoSend }) => {
    if (loading) return;
    setLoading(true);

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    addMessage({ id: userMsgId, role: "user", type: "text", content: prompt });
    addMessage({
      id: aiMsgId,
      role: "ai",
      type: "processing",
      status: "decomposing",
      statusText: "Menganalisa prompt...",
      steps: [],
      currentStep: 0,
      totalSteps: 0,
    });

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => ws.send(JSON.stringify({ prompt, autoSend }));

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      switch (data.type) {
        case "decomposing":
          updateMessage(aiMsgId, (m) => ({
            ...m,
            statusText: data.message,
          }));
          break;

        case "steps":
          updateMessage(aiMsgId, (m) => ({
            ...m,
            totalSteps: data.steps.length,
            steps: data.steps.map((s, i) => ({
              index: i + 1,
              label: s,
              status: "pending",
              code: "",
              fusionResult: null,
            })),
          }));
          break;

        case "step_start":
          updateMessage(aiMsgId, (m) => ({
            ...m,
            currentStep: data.step,
            statusText: data.message,
            steps: m.steps.map((s) =>
              s.index === data.step ? { ...s, status: "generating" } : s
            ),
          }));
          break;

        case "token":
          updateMessage(aiMsgId, (m) => ({
            ...m,
            steps: m.steps.map((s) =>
              s.index === data.step ? { ...s, code: s.code + data.content } : s
            ),
          }));
          break;

        case "step_complete":
          updateMessage(aiMsgId, (m) => ({
            ...m,
            steps: m.steps.map((s) =>
              s.index === data.step ? { ...s, status: "sending", code: data.code } : s
            ),
          }));
          break;

        case "fusion_sending":
          updateMessage(aiMsgId, (m) => ({
            ...m,
            statusText: data.message,
          }));
          break;

        case "fusion_result":
          updateMessage(aiMsgId, (m) => ({
            ...m,
            steps: m.steps.map((s) =>
              s.index === data.step
                ? { ...s, status: data.success ? "done" : "error", fusionResult: data }
                : s
            ),
          }));
          break;

        case "fusion_error":
          updateMessage(aiMsgId, (m) => ({
            ...m,
            steps: m.steps.map((s) =>
              s.index === data.step ? { ...s, status: "error", fusionResult: data } : s
            ),
          }));
          break;

        case "done":
          updateMessage(aiMsgId, (m) => ({
            ...m,
            type: "done",
            statusText: data.message,
          }));
          setLoading(false);
          break;

        case "error":
          updateMessage(aiMsgId, (m) => ({
            ...m,
            type: "error",
            statusText: data.message,
          }));
          setLoading(false);
          break;
      }
    };

    ws.onerror = () => {
      updateMessage(aiMsgId, () => ({
        type: "error",
        statusText: "Koneksi ke backend gagal. Pastikan server jalan di port 3001.",
      }));
      setLoading(false);
    };
  }, [loading, addMessage, updateMessage]);

  return { messages, loading, generate };
}
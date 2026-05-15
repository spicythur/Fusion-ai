import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = "ws://localhost:3001/ws/generate";
const API_URL = "http://localhost:3001";

/**
 * Custom hook for Fusion AI — WebSocket streaming + Fusion status polling
 */
export function useFusion() {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  // Connection states
  const [wsConnected, setWsConnected] = useState(false);
  const [fusionConnected, setFusionConnected] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedCode, setStreamedCode] = useState("");
  const [lastResult, setLastResult] = useState(null);

  // Message history
  const [messages, setMessages] = useState([]);

  // ----- WebSocket connection -----
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setWsConnected(true);
      console.log("[WS] Connected");
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log("[WS] Disconnected — retrying in 3s");
      reconnectTimer.current = setTimeout(connectWs, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "start":
          setIsGenerating(true);
          setStreamedCode("");
          setLastResult(null);
          break;

        case "token":
          setStreamedCode((prev) => prev + data.content);
          break;

        case "complete":
          setIsGenerating(false);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.code, timestamp: Date.now() },
          ]);
          break;

        case "fusion_sending":
          setLastResult({ status: "sending", message: "Sending to Fusion 360..." });
          break;

        case "fusion_result":
          setLastResult({
            status: data.success ? "success" : "error",
            message: data.message,
          });
          break;

        case "fusion_error":
          setLastResult({ status: "error", message: data.message });
          break;

        case "error":
          setIsGenerating(false);
          setLastResult({ status: "error", message: data.message });
          setMessages((prev) => [
            ...prev,
            { role: "error", content: data.message, timestamp: Date.now() },
          ]);
          break;

        default:
          break;
      }
    };

    wsRef.current = ws;
  }, []);

  // ----- Send prompt -----
  const sendPrompt = useCallback(
    (prompt, autoSend = false) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setLastResult({ status: "error", message: "WebSocket not connected" });
        return;
      }

      // Add user message
      setMessages((prev) => [
        ...prev,
        { role: "user", content: prompt, timestamp: Date.now() },
      ]);

      setStreamedCode("");
      setIsGenerating(true);
      setLastResult(null);

      wsRef.current.send(JSON.stringify({ prompt, autoSend }));
    },
    []
  );

  // ----- Send script manually to Fusion -----
  const sendToFusion = useCallback(async (code) => {
    setLastResult({ status: "sending", message: "Sending to Fusion 360..." });
    try {
      const res = await fetch(`${API_URL}/fusion/status`);
      const status = await res.json();

      if (!status.connected) {
        setLastResult({ status: "error", message: "Fusion 360 is not connected" });
        return;
      }

      // Send via backend proxy — we'll use the addin URL directly via backend
      const execRes = await fetch("http://localhost:8080", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const result = await execRes.json();
      setLastResult({
        status: result.success ? "success" : "error",
        message: result.message,
      });
    } catch (err) {
      setLastResult({
        status: "error",
        message: "Failed to reach Fusion 360: " + err.message,
      });
    }
  }, []);

  // ----- Fusion status polling -----
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/fusion/status`);
        const data = await res.json();
        setFusionConnected(data.connected);
      } catch {
        setFusionConnected(false);
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // ----- WebSocket lifecycle -----
  useEffect(() => {
    connectWs();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connectWs]);

  return {
    wsConnected,
    fusionConnected,
    isGenerating,
    streamedCode,
    lastResult,
    messages,
    sendPrompt,
    sendToFusion,
    setMessages,
  };
}

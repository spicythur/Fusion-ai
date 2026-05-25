import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = `ws://${window.location.hostname}:3001/ws/generate`;
const API_URL = ""; // relative URLs go through Vite proxy
const GENERATION_TIMEOUT_MS = 130000; // slightly longer than backend 120s

/**
 * Custom hook for Fusion AI — WebSocket streaming + Fusion status polling
 */
export function useFusion() {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const generationTimer = useRef(null);

  // Connection states
  const [wsConnected, setWsConnected] = useState(false);
  const [fusionConnected, setFusionConnected] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
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
          setLastResult(null);
          // Start generation timeout
          clearTimeout(generationTimer.current);
          generationTimer.current = setTimeout(() => {
            setIsGenerating(false);
            setLastResult({ status: "error", message: "Generation timed out. Please try again." });
          }, GENERATION_TIMEOUT_MS);
          break;

        case "generating":
          setLastResult({ status: "sending", message: data.message });
          break;

        case "validating":
          setLastResult({ status: "sending", message: `Validating... (attempt ${data.attempt})` });
          break;

        case "fixing":
          setLastResult({ status: "sending", message: `Fixing syntax errors... (attempt ${data.attempt})` });
          break;

        case "complete":
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.code, timestamp: Date.now() },
          ]);
          break;

        case "fusion_sending":
          setLastResult({ status: "sending", message: data.message });
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

        case "done":
          clearTimeout(generationTimer.current);
          setIsGenerating(false);
          setLastResult((prev) => prev || { status: "success", message: data.message });
          break;

        case "error":
          clearTimeout(generationTimer.current);
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

  // ----- Clear chat history -----
  const clearChat = useCallback(() => {
    setMessages([]);
    setLastResult(null);
    setIsGenerating(false);
    clearTimeout(generationTimer.current);
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

      setIsGenerating(true);
      setLastResult(null);

      wsRef.current.send(JSON.stringify({ prompt, autoSend }));
    },
    []
  );

  // ----- Send script manually to Fusion (via backend proxy) -----
  const sendToFusion = useCallback(async (code) => {
    setLastResult({ status: "sending", message: "Sending to Fusion 360..." });
    try {
      const url = `${API_URL}/fusion/send`;
      console.log("[FUSION] Sending to:", url);
      const execRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      console.log("[FUSION] Response status:", execRes.status, "content-type:", execRes.headers.get("content-type"));

      if (!execRes.ok) {
        const text = await execRes.text();
        console.error("[FUSION] Error response:", text.substring(0, 200));
        setLastResult({
          status: "error",
          message: `Server error (${execRes.status}): ${text.substring(0, 100)}`,
        });
        return;
      }

      const contentType = execRes.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await execRes.text();
        console.error("[FUSION] Non-JSON response:", text.substring(0, 200));
        setLastResult({
          status: "error",
          message: `Server returned non-JSON (${contentType}). Is the backend running on port 3001?`,
        });
        return;
      }

      const result = await execRes.json();
      setLastResult({
        status: result.success ? "success" : "error",
        message: result.message,
      });
    } catch (err) {
      console.error("[FUSION] Fetch error:", err);
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
      clearTimeout(generationTimer.current);
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
    lastResult,
    messages,
    sendPrompt,
    sendToFusion,
    setMessages,
    clearChat,
  };
}

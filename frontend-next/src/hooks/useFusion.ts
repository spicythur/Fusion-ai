"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = `ws://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:3001/ws/generate`;
const API_URL = ""; // relative URLs go through proxy
const GENERATION_TIMEOUT_MS = 130000;

interface Message {
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: number;
}

interface LastResult {
  status: "success" | "error" | "sending";
  message: string;
}

export function useFusion() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [fusionConnected, setFusionConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onclose = () => {
      setWsConnected(false);
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
          clearTimeout(generationTimer.current!);
          generationTimer.current = setTimeout(() => {
            setIsGenerating(false);
            setLastResult({ status: "error", message: "Generation timed out. Please try again." });
          }, GENERATION_TIMEOUT_MS);
          break;

        case "generating":
          setLastResult({ status: "sending", message: data.message });
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

        case "done":
          clearTimeout(generationTimer.current!);
          setIsGenerating(false);
          setLastResult((prev) => prev || { status: "success", message: data.message });
          break;

        case "error":
          clearTimeout(generationTimer.current!);
          setIsGenerating(false);
          setLastResult({ status: "error", message: data.message });
          setMessages((prev) => [
            ...prev,
            { role: "error", content: data.message, timestamp: Date.now() },
          ]);
          break;
      }
    };

    wsRef.current = ws;
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setLastResult(null);
    setIsGenerating(false);
    clearTimeout(generationTimer.current!);
  }, []);

  const sendPrompt = useCallback((prompt: string, autoSend = false) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setLastResult({ status: "error", message: "WebSocket not connected" });
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", content: prompt, timestamp: Date.now() },
    ]);

    setIsGenerating(true);
    setLastResult(null);

    wsRef.current.send(JSON.stringify({ prompt, autoSend }));
  }, []);

  const sendToFusion = useCallback(async (code: string) => {
    setLastResult({ status: "sending", message: "Sending to Fusion 360..." });
    try {
      const res = await fetch(`${API_URL}/fusion/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const text = await res.text();
        setLastResult({
          status: "error",
          message: `Server error (${res.status}): ${text.substring(0, 100)}`,
        });
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        setLastResult({
          status: "error",
          message: `Server returned non-JSON (${contentType}). Is the backend running on port 3001?`,
        });
        return;
      }

      const result = await res.json();
      setLastResult({
        status: result.success ? "success" : "error",
        message: result.message,
      });
    } catch (err) {
      setLastResult({
        status: "error",
        message: "Failed to reach Fusion 360: " + (err as Error).message,
      });
    }
  }, []);

  // Fusion status polling
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

  // WebSocket lifecycle
  useEffect(() => {
    connectWs();
    return () => {
      clearTimeout(reconnectTimer.current!);
      clearTimeout(generationTimer.current!);
      if (wsRef.current) {
        wsRef.current.onclose = null;
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
    clearChat,
  };
}

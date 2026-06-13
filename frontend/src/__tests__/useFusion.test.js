import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFusion } from "../hooks/useFusion.js";

// Mock WebSocket — connects synchronously
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this.sent = [];
    queueMicrotask(() => this.onopen?.());
  }
  send(data) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
}

// Helper to create mock Response-like objects
function mockResponse({ ok, status = 200, contentType = "application/json", body = {} }) {
  return {
    ok,
    status,
    headers: { get: (key) => key === "content-type" ? contentType : null },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
  };
}

// URL-based fetch mock
function createUrlMockFetch() {
  const handler = vi.fn();
  // Default: /fusion/status returns disconnected
  handler.mockImplementation((url) => {
    if (typeof url === "string" && url.includes("/fusion/status")) {
      return Promise.resolve(mockResponse({ ok: true, body: { connected: false } }));
    }
    return Promise.resolve(mockResponse({ ok: true, body: { success: true, message: "OK" } }));
  });
  return handler;
}

describe("useFusion", () => {
  let OriginalWebSocket;
  let OriginalFetch;
  let mockFetch;

  beforeEach(() => {
    OriginalWebSocket = global.WebSocket;
    OriginalFetch = global.fetch;
    global.WebSocket = MockWebSocket;
    mockFetch = createUrlMockFetch();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.WebSocket = OriginalWebSocket;
    global.fetch = OriginalFetch;
    vi.restoreAllMocks();
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useFusion());

    expect(result.current.wsConnected).toBe(false);
    expect(result.current.fusionConnected).toBe(false);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.lastResult).toBe(null);
    expect(result.current.messages).toEqual([]);
  });

  it("provides all required functions", () => {
    const { result } = renderHook(() => useFusion());
    expect(typeof result.current.sendPrompt).toBe("function");
    expect(typeof result.current.sendToFusion).toBe("function");
    expect(typeof result.current.clearChat).toBe("function");
  });

  it("clearChat resets messages and state", () => {
    const { result } = renderHook(() => useFusion());

    act(() => {
      result.current.clearChat();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.lastResult).toBe(null);
    expect(result.current.isGenerating).toBe(false);
  });

  it("sendPrompt handles disconnected state gracefully", () => {
    class NeverOpenWS extends MockWebSocket {
      constructor(url) {
        super(url);
        this.readyState = 3;
      }
    }
    global.WebSocket = NeverOpenWS;

    const { result } = renderHook(() => useFusion());

    act(() => {
      result.current.sendPrompt("Create a box", false);
    });

    expect(result.current.lastResult?.status).toBe("error");
  });

  it("sendToFusion sends POST request", async () => {
    mockFetch.mockImplementation((url, opts) => {
      if (typeof url === "string" && url.includes("/fusion/status")) {
        return Promise.resolve(mockResponse({ ok: true, body: { connected: false } }));
      }
      return Promise.resolve(mockResponse({ ok: true, body: { success: true, message: "OK" } }));
    });

    const { result } = renderHook(() => useFusion());

    await act(async () => {
      await result.current.sendToFusion("print('hello')");
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/fusion/send"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sendToFusion handles success response", async () => {
    mockFetch.mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/fusion/status")) {
        return Promise.resolve(mockResponse({ ok: true, body: { connected: false } }));
      }
      return Promise.resolve(mockResponse({ ok: true, body: { success: true, message: "Created!" } }));
    });

    const { result } = renderHook(() => useFusion());

    await act(async () => {
      await result.current.sendToFusion("code");
    });

    expect(result.current.lastResult?.status).toBe("success");
    expect(result.current.lastResult?.message).toBe("Created!");
  });

  it("sendToFusion handles failure response", async () => {
    mockFetch.mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/fusion/status")) {
        return Promise.resolve(mockResponse({ ok: true, body: { connected: false } }));
      }
      return Promise.resolve(mockResponse({ ok: true, body: { success: false, message: "Fusion error" } }));
    });

    const { result } = renderHook(() => useFusion());

    await act(async () => {
      await result.current.sendToFusion("code");
    });

    expect(result.current.lastResult?.status).toBe("error");
    expect(result.current.lastResult?.message).toBe("Fusion error");
  });

  it("sendToFusion handles network error", async () => {
    mockFetch.mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/fusion/status")) {
        return Promise.resolve(mockResponse({ ok: true, body: { connected: false } }));
      }
      return Promise.reject(new Error("Network fail"));
    });

    const { result } = renderHook(() => useFusion());

    await act(async () => {
      await result.current.sendToFusion("code");
    });

    expect(result.current.lastResult?.status).toBe("error");
    expect(result.current.lastResult?.message).toContain("Failed to reach");
  });

  it("sendToFusion handles non-JSON response", async () => {
    mockFetch.mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/fusion/status")) {
        return Promise.resolve(mockResponse({ ok: true, body: { connected: false } }));
      }
      return Promise.resolve(mockResponse({ ok: true, contentType: "text/html", body: "<html>Error</html>" }));
    });

    const { result } = renderHook(() => useFusion());

    await act(async () => {
      await result.current.sendToFusion("code");
    });

    expect(result.current.lastResult?.status).toBe("error");
    expect(result.current.lastResult?.message).toContain("non-JSON");
  });

  it("sendToFusion handles server error status", async () => {
    mockFetch.mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/fusion/status")) {
        return Promise.resolve(mockResponse({ ok: true, body: { connected: false } }));
      }
      return Promise.resolve(mockResponse({ ok: false, status: 500, contentType: "text/plain", body: "Internal Server Error" }));
    });

    const { result } = renderHook(() => useFusion());

    await act(async () => {
      await result.current.sendToFusion("code");
    });

    expect(result.current.lastResult?.status).toBe("error");
    expect(result.current.lastResult?.message).toContain("500");
  });
});

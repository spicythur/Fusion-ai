import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { WebSocket, WebSocketServer } from "ws";
import http from "http";

// ---------------------------------------------------------------------------
// Minimal WebSocket server for integration testing
// ---------------------------------------------------------------------------
function createTestServer() {
  return new Promise((resolve) => {
    const server = http.createServer();
    const wss = new WebSocketServer({ server, path: "/ws/generate" });

    wss.on("connection", (ws) => {
      ws.on("message", (raw) => {
        let data;
        try {
          data = JSON.parse(raw.toString());
        } catch {
          ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
          return;
        }

        const { prompt, autoSend } = data;

        if (!prompt) {
          ws.send(JSON.stringify({ type: "error", message: "No prompt provided" }));
          return;
        }

        if (prompt.length > 2000) {
          ws.send(JSON.stringify({ type: "error", message: "Prompt too long (max 2000 characters)" }));
          return;
        }

        ws.send(JSON.stringify({ type: "start" }));
        ws.send(JSON.stringify({ type: "generating", message: "Generating script..." }));
        ws.send(JSON.stringify({ type: "complete", code: "# generated code" }));
        ws.send(JSON.stringify({ type: "done", message: "Done!" }));
      });
    });

    server.listen(0, () => {
      const port = server.address().port;
      resolve({ server, wss, port });
    });
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("WebSocket flow", () => {
  let server, port;

  beforeAll(async () => {
    const testServer = await createTestServer();
    server = testServer.server;
    port = testServer.port;
  });

  afterAll(() => {
    server.close();
  });

  it("receives full generation flow for valid prompt", async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/generate`);
    const messages = [];

    await new Promise((resolve) => {
      ws.on("open", () => {
        ws.send(JSON.stringify({ prompt: "Create a box", autoSend: false }));
      });

      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        messages.push(msg);
        if (msg.type === "done") {
          ws.close();
          resolve();
        }
      });
    });

    const types = messages.map((m) => m.type);
    expect(types).toContain("start");
    expect(types).toContain("generating");
    expect(types).toContain("complete");
    expect(types).toContain("done");

    const completeMsg = messages.find((m) => m.type === "complete");
    expect(completeMsg.code).toBe("# generated code");
  });

  it("returns error for missing prompt", async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/generate`);
    const messages = [];

    await new Promise((resolve) => {
      ws.on("open", () => {
        ws.send(JSON.stringify({}));
      });

      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        messages.push(msg);
        ws.close();
        resolve();
      });
    });

    expect(messages[0].type).toBe("error");
    expect(messages[0].message).toBe("No prompt provided");
  });

  it("returns error for too-long prompt", async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/generate`);
    const messages = [];

    await new Promise((resolve) => {
      ws.on("open", () => {
        ws.send(JSON.stringify({ prompt: "a".repeat(2001) }));
      });

      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        messages.push(msg);
        ws.close();
        resolve();
      });
    });

    expect(messages[0].type).toBe("error");
    expect(messages[0].message).toContain("2000");
  });

  it("returns error for invalid JSON", async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/generate`);
    const messages = [];

    await new Promise((resolve) => {
      ws.on("open", () => {
        ws.send("not json");
      });

      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        messages.push(msg);
        ws.close();
        resolve();
      });
    });

    expect(messages[0].type).toBe("error");
    expect(messages[0].message).toBe("Invalid JSON");
  });
});

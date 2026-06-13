import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App.jsx";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

vi.mock("../hooks/useFusion.js", () => ({
  useFusion: () => ({
    wsConnected: true,
    fusionConnected: false,
    isGenerating: false,
    lastResult: null,
    messages: [],
    sendPrompt: vi.fn(),
    sendToFusion: vi.fn(),
    clearChat: vi.fn(),
  }),
}));

describe("App", () => {
  it("renders the header title", () => {
    render(<App />);
    expect(screen.getByText("Fusion AI")).toBeTruthy();
  });

  it("renders welcome screen", () => {
    render(<App />);
    expect(screen.getByText("What do you want to create?")).toBeTruthy();
  });

  it("renders preset buttons", () => {
    render(<App />);
    expect(screen.getByText("Box")).toBeTruthy();
    expect(screen.getByText("Gear")).toBeTruthy();
    expect(screen.getByText("Bolt M8")).toBeTruthy();
    expect(screen.getByText("Phone Stand")).toBeTruthy();
    expect(screen.getByText("L-Bracket")).toBeTruthy();
    expect(screen.getByText("Flanged Pipe")).toBeTruthy();
    expect(screen.getByText("Spoked Wheel")).toBeTruthy();
    expect(screen.getByText("Drone Frame")).toBeTruthy();
  });

  it("renders input field", () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Describe a 3D model/)).toBeTruthy();
  });

  it("shows status badges", () => {
    render(<App />);
    expect(screen.getByText("Server")).toBeTruthy();
    expect(screen.getByText("Fusion 360")).toBeTruthy();
  });
});

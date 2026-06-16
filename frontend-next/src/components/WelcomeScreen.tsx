"use client";

import { Box, Cog, Wrench, Smartphone, Pipette, Cylinder, Disc3, Zap } from "lucide-react";

const PRESETS = [
  { icon: Box, label: "Box", prompt: "Create a 5cm x 5cm x 5cm box" },
  { icon: Cog, label: "Gear", prompt: "Create a spur gear with 20 teeth, module 1, and 10mm thickness" },
  { icon: Wrench, label: "Bolt M8", prompt: "Create a hex bolt M8 with head diameter 13mm, head height 5mm, shaft diameter 8mm, shaft length 30mm" },
  { icon: Smartphone, label: "Phone Stand", prompt: "Create a simple phone stand with base 80x60mm height 100mm at 70 degree angle" },
  { icon: Pipette, label: "L-Bracket", prompt: "Create an L-bracket 80mm x 40mm thickness 5mm with 4 M4 bolt holes on each side" },
  { icon: Cylinder, label: "Flanged Pipe", prompt: "Create a flanged pipe: outer diameter 3cm, inner diameter 2.4cm, length 10cm, flange 5cm diameter 0.5cm thick" },
  { icon: Disc3, label: "Spoked Wheel", prompt: "Create a spoked wheel outer diameter 10cm, hub diameter 3cm, bore 2cm, 5 spokes width 1cm" },
  { icon: Zap, label: "Drone Frame", prompt: "Create an X-frame drone: center plate 5x5x0.5cm, four arms 12cm each, motor mount pads 3cm diameter at each arm tip" },
];

interface WelcomeScreenProps { onPreset: (prompt: string) => void; }

export default function WelcomeScreen({ onPreset }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-6" style={{ background: "var(--accent)" }}>F</div>
      <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>What do you want to create?</h1>
      <p className="text-sm mb-8 max-w-md text-center" style={{ color: "var(--text-secondary)" }}>
        Describe any 3D model in natural language. AI generates the script and sends it to Fusion 360.
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {PRESETS.map((p, i) => (
          <button key={i} onClick={() => onPreset(p.prompt)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all hover:-translate-y-0.5"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-soft)"; e.currentTarget.style.boxShadow = "var(--shadow-glow)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <p.icon size={14} strokeWidth={1.5} style={{ color: "var(--text-tertiary)" }} />
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

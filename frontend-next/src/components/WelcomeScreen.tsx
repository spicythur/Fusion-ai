"use client";

const PRESETS = [
  { icon: "📦", label: "Box", prompt: "Create a 5cm x 5cm x 5cm box" },
  { icon: "⚙️", label: "Gear", prompt: "Create a spur gear with 20 teeth, module 1, and 10mm thickness" },
  { icon: "🔩", label: "Bolt M8", prompt: "Create a hex bolt M8 with head diameter 13mm, head height 5mm, shaft diameter 8mm, shaft length 30mm" },
  { icon: "📱", label: "Phone Stand", prompt: "Create a simple phone stand with base 80x60mm height 100mm at 70 degree angle" },
  { icon: "🔧", label: "L-Bracket", prompt: "Create an L-bracket 80mm x 40mm thickness 5mm with 4 M4 bolt holes on each side" },
  { icon: "🏗️", label: "Flanged Pipe", prompt: "Create a flanged pipe: outer diameter 3cm, inner diameter 2.4cm, length 10cm, flange 5cm diameter 0.5cm thick" },
  { icon: "🛞", label: "Spoked Wheel", prompt: "Create a spoked wheel outer diameter 10cm, hub diameter 3cm, bore 2cm, 5 spokes width 1cm" },
  { icon: "⚡", label: "Drone Frame", prompt: "Create an X-frame drone: center plate 5x5x0.5cm, four arms 12cm each, motor mount pads 3cm diameter at each arm tip" },
];

interface WelcomeScreenProps {
  onPreset: (prompt: string) => void;
}

export default function WelcomeScreen({ onPreset }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12">
      {/* Hero icon */}
      <div className="relative mb-8 animate-fade-in-up">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl text-white shadow-xl shadow-blue-500/25">✦</div>
        <div className="absolute -inset-4 bg-blue-500/10 rounded-3xl blur-xl -z-10"></div>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 text-center animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        What do you want to create?
      </h1>
      <p className="text-[var(--text-secondary)] text-center max-w-md mb-10 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
        Describe any 3D model in natural language.<br/>
        AI generates the script and sends it to Fusion 360.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap justify-center gap-3 max-w-2xl animate-fade-in-up" style={{animationDelay: '0.3s'}}>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => onPreset(p.prompt)}
            className="group flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text)] hover:border-blue-500/50 hover:bg-blue-500/5 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.97] transition-all"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

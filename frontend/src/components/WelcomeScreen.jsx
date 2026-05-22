export const PRESETS = [
  { icon: "📦", label: "Box 5x5x5cm", prompt: "Create a 5cm x 5cm x 5cm box" },
  { icon: "🔩", label: "Hex bolt M8", prompt: "Create a hex bolt M8 with head diameter 13mm, head height 5mm, shaft diameter 8mm, shaft length 30mm" },
  { icon: "🫙", label: "Hollow cylinder", prompt: "Create a hollow cylinder outer diameter 40mm inner diameter 34mm height 60mm" },
  { icon: "📐", label: "L-bracket", prompt: "Create an L-bracket 80mm x 40mm thickness 5mm with 4 M4 bolt holes on each side" },
  { icon: "⚙️", label: "Spur gear", prompt: "Create a spur gear with 20 teeth module 2 width 15mm bore hole 8mm" },
  { icon: "📱", label: "Phone stand", prompt: "Create a simple phone stand with base 80x60mm height 100mm at 70 degree angle" },
];

export default function WelcomeScreen({ onSend }) {
  return (
    <div className="welcome">
      <div className="welcomeIcon">✦</div>
      <div>
        <div className="welcomeTitle">Mulai Membuat di Fusion 360</div>
        <div className="welcomeDesc">
          Jelaskan model 3D yang ingin Anda buat dalam bahasa alami. AI akan mengeksekusi langkah-langkah desain secara otomatis.
        </div>
      </div>
      <div className="presets">
        {PRESETS.map((p) => (
          <button key={p.label} className="presetChip" onClick={() => onSend(p.prompt)}>
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}L

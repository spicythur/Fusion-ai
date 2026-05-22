export default function Header({ connected, checking, mode, setMode }) {
  return (
    <header className="header">
      <div className="headerLeft">
        <div className="logo">F</div>
        <div>
          <div className="headerTitle">Fusion AI Generator</div>
          <div className="headerSubtitle">Natural Language to 3D Model</div>
        </div>
      </div>

      <div style={{ display:"flex", border:"1px solid var(--glass-border)", borderRadius:"var(--radius-full)", overflow:"hidden", background: "var(--bg-card)" }}>
        {[["chat","Chat"],["builder","Builder"]].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            style={{ 
              padding:"6px 18px", 
              background: mode === m ? "var(--primary)" : "transparent", 
              color: mode === m ? "#fff" : "var(--text-secondary)", 
              border:"none", 
              cursor:"pointer", 
              fontSize:"13px",
              fontWeight: mode === m ? "600" : "500",
              transition: "all 0.2s ease"
            }}>
            {label}
          </button>
        ))}
      </div>

      <div className="headerRight">
        <div className={`statusBadge ${connected ? "connected" : "disconnected"}`}>
          <div className={`statusDot ${connected ? "active" : "inactive"}`} />
          <span>{checking ? "Checking..." : connected ? "Fusion 360 Connected" : "Disconnected"}</span>
        </div>
      </div>
    </header>
  );
}

import { useState } from "react";

const NODE_DEFS = [
  { cat:"Primitives", type:"box",      label:"Box",       icon:"□", color:"#378ADD", params:[{k:"width",l:"Width",v:"5",u:"cm"},{k:"height",l:"Height",v:"5",u:"cm"},{k:"depth",l:"Depth",v:"5",u:"cm"}] },
  { cat:"Primitives", type:"cylinder", label:"Cylinder",  icon:"○", color:"#378ADD", params:[{k:"radius",l:"Radius",v:"2.5",u:"cm"},{k:"height",l:"Height",v:"10",u:"cm"}] },
  { cat:"Primitives", type:"sphere",   label:"Sphere",    icon:"◎", color:"#378ADD", params:[{k:"radius",l:"Radius",v:"3",u:"cm"}] },
  { cat:"Mechanical", type:"bolt",     label:"Hex Bolt",  icon:"⬡", color:"#1D9E75", params:[{k:"head_d",l:"Head diameter",v:"1.3",u:"cm"},{k:"head_h",l:"Head height",v:"0.5",u:"cm"},{k:"shaft_d",l:"Shaft diameter",v:"0.8",u:"cm"},{k:"shaft_l",l:"Shaft length",v:"3.0",u:"cm"}] },
  { cat:"Mechanical", type:"gear",     label:"Spur Gear", icon:"⚙", color:"#1D9E75", params:[{k:"teeth",l:"Teeth",v:"20",u:""},{k:"module",l:"Module",v:"2",u:""},{k:"width",l:"Width",v:"1.5",u:"cm"},{k:"bore",l:"Bore",v:"0.8",u:"cm"}] },
  { cat:"Mechanical", type:"bracket",  label:"L-Bracket", icon:"⌐", color:"#1D9E75", params:[{k:"length",l:"Length",v:"8",u:"cm"},{k:"width",l:"Width",v:"4",u:"cm"},{k:"thick",l:"Thickness",v:"0.5",u:"cm"}] },
  { cat:"Operations", type:"fillet",   label:"Fillet",    icon:"◡", color:"#BA7517", params:[{k:"radius",l:"Radius",v:"0.2",u:"cm"}] },
  { cat:"Operations", type:"chamfer",  label:"Chamfer",   icon:"◪", color:"#BA7517", params:[{k:"distance",l:"Distance",v:"0.1",u:"cm"}] },
  { cat:"Operations", type:"shell",    label:"Shell",     icon:"◫", color:"#BA7517", params:[{k:"thickness",l:"Thickness",v:"0.3",u:"cm"}] },
  { cat:"Operations", type:"hole",     label:"Hole",      icon:"⊙", color:"#BA7517", params:[{k:"diameter",l:"Diameter",v:"0.4",u:"cm"},{k:"depth",l:"Depth",v:"1.0",u:"cm"}] },
];

export default function BuilderMode({ onSendPrompt }) {
  const [nodes, setNodes] = useState([]);
  const [search, setSearch] = useState("");

  const handleDragStart = (e, def) => {
    e.dataTransfer.setData("application/json", JSON.stringify(def));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      // Add a unique ID to the node
      const newNode = { ...data, id: Date.now() + Math.random(), params: data.params.map(p => ({ ...p })) };
      setNodes([...nodes, newNode]);
    } catch (err) {
      console.error("Drop error", err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleParamChange = (nodeId, paramKey, val) => {
    setNodes(nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          params: n.params.map(p => p.k === paramKey ? { ...p, v: val } : p)
        };
      }
      return n;
    }));
  };

  const handleDeleteNode = (nodeId) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
  };

  const runBuild = () => {
    if (nodes.length === 0) return;
    const steps = nodes.map((node, i) => {
      const params = node.params.map(p => `${p.l}: ${p.v}${p.u}`).join(", ");
      return `${i + 1}. ${node.label} (${params})`;
    });
    const prompt = `Create a 3D model with these sequential steps:\n${steps.join("\n")}`;
    onSendPrompt(prompt);
  };

  const filteredDefs = NODE_DEFS.filter(n => n.label.toLowerCase().includes(search.toLowerCase()) || n.cat.toLowerCase().includes(search.toLowerCase()));
  
  // Group by category
  const groupedDefs = filteredDefs.reduce((acc, curr) => {
    if (!acc[curr.cat]) acc[curr.cat] = [];
    acc[curr.cat].push(curr);
    return acc;
  }, {});

  return (
    <div className="builder-container">
      <div className="builder-sidebar">
        <div className="builder-search">
          <input 
            type="text" 
            placeholder="Search nodes..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="builder-palette">
          {Object.entries(groupedDefs).map(([cat, defs]) => (
            <div key={cat} className="builder-cat">
              <div className="builder-cat-title">{cat}</div>
              <div className="builder-cat-items">
                {defs.map(def => (
                  <div 
                    key={def.type} 
                    className="builder-def-node"
                    draggable
                    onDragStart={(e) => handleDragStart(e, def)}
                    style={{ borderLeftColor: def.color }}
                  >
                    <span className="builder-node-icon" style={{ color: def.color }}>{def.icon}</span>
                    <span>{def.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="builder-main">
        <div 
          className={`builder-canvas ${nodes.length === 0 ? "empty" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {nodes.length === 0 ? (
            <div className="builder-empty-state">
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📥</div>
              Drag and drop nodes here to build your model
            </div>
          ) : (
            <div className="builder-nodes-list">
              {nodes.map((node, i) => (
                <div key={node.id} className="builder-node">
                  {i > 0 && <div className="builder-node-connector" />}
                  <div className="builder-node-card" style={{ borderTopColor: node.color }}>
                    <div className="builder-node-header">
                      <div className="builder-node-title">
                        <span className="builder-node-icon" style={{ color: node.color }}>{node.icon}</span>
                        {node.label}
                      </div>
                      <button className="builder-node-delete" onClick={() => handleDeleteNode(node.id)}>×</button>
                    </div>
                    <div className="builder-node-params">
                      {node.params.map(p => (
                        <div key={p.k} className="builder-param-row">
                          <label>{p.l}</label>
                          <div className="builder-param-input">
                            <input 
                              type="text" 
                              value={p.v} 
                              onChange={(e) => handleParamChange(node.id, p.k, e.target.value)} 
                            />
                            {p.u && <span className="builder-param-unit">{p.u}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="builder-footer">
          <button className="builder-btn-clear" onClick={() => setNodes([])} disabled={nodes.length === 0}>
            Clear Canvas
          </button>
          <button className="builder-btn-run" onClick={runBuild} disabled={nodes.length === 0}>
            <span>⚡</span> Run in Fusion 360
          </button>
        </div>
      </div>
    </div>
  );
}

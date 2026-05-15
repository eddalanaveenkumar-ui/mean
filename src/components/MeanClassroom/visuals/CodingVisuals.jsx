import React from 'react';

/* ── Neural Network Visualization ── */
export function NeuralNetViz({ layers }) {
  const l = layers || [3, 5, 4, 2];
  const W = 400, H = 240;
  const layerGap = W / (l.length + 1);
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  const nodePositions = l.map((count, li) => {
    const x = layerGap * (li + 1);
    const gap = Math.min(40, (H - 40) / count);
    const startY = (H - (count - 1) * gap) / 2;
    return Array.from({ length: count }, (_, ni) => ({ x, y: startY + ni * gap }));
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mc-viz-svg" style={{ width: '100%', height: '240px' }}>
      {/* Connections */}
      {nodePositions.slice(0, -1).map((layer, li) =>
        layer.map((from, fi) =>
          nodePositions[li + 1].map((to, ti) => (
            <line key={`${li}-${fi}-${ti}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={colors[li % colors.length]} strokeWidth="0.8" opacity="0.2" />
          ))
        )
      )}
      {/* Nodes */}
      {nodePositions.map((layer, li) =>
        layer.map((pos, ni) => (
          <g key={`n${li}-${ni}`}>
            <circle cx={pos.x} cy={pos.y} r="10" fill={`${colors[li % colors.length]}22`}
              stroke={colors[li % colors.length]} strokeWidth="1.5">
              <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${li * 0.15}s`} fill="freeze" />
            </circle>
          </g>
        ))
      )}
      {/* Layer labels */}
      {l.map((count, li) => (
        <text key={`l${li}`} x={layerGap * (li + 1)} y={H - 5} fill="#666" fontSize="9" textAnchor="middle">
          {li === 0 ? 'Input' : li === l.length - 1 ? 'Output' : `Hidden ${li}`}
        </text>
      ))}
    </svg>
  );
}

/* ── Flowchart Visualization ── */
export function FlowchartViz({ nodes, edges }) {
  const defaultNodes = [
    { id: 0, x: 180, y: 30, label: 'Start', shape: 'oval', color: '#10b981' },
    { id: 1, x: 180, y: 90, label: 'Process A', shape: 'rect', color: '#3b82f6' },
    { id: 2, x: 180, y: 150, label: 'Decision?', shape: 'diamond', color: '#f59e0b' },
    { id: 3, x: 80, y: 210, label: 'Yes Path', shape: 'rect', color: '#8b5cf6' },
    { id: 4, x: 280, y: 210, label: 'No Path', shape: 'rect', color: '#ef4444' },
  ];
  const defaultEdges = [[0, 1], [1, 2], [2, 3, 'Yes'], [2, 4, 'No']];
  const n = nodes || defaultNodes;
  const e = edges || defaultEdges;

  return (
    <svg viewBox="0 0 360 260" className="mc-viz-svg" style={{ width: '100%', height: '260px' }}>
      <defs>
        <marker id="fcArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.4)" />
        </marker>
      </defs>
      {/* Edges */}
      {e.map(([from, to, lbl], i) => n[from] && n[to] && (
        <g key={`e${i}`}>
          <line x1={n[from].x} y1={n[from].y + 18} x2={n[to].x} y2={n[to].y - 18}
            stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" markerEnd="url(#fcArrow)" />
          {lbl && <text x={(n[from].x + n[to].x) / 2 + 8} y={(n[from].y + n[to].y) / 2}
            fill="#888" fontSize="9" fontWeight="600">{lbl}</text>}
        </g>
      ))}
      {/* Nodes */}
      {n.map((node, i) => (
        <g key={`n${i}`}>
          {node.shape === 'diamond' ? (
            <polygon points={`${node.x},${node.y - 20} ${node.x + 40},${node.y} ${node.x},${node.y + 20} ${node.x - 40},${node.y}`}
              fill={`${node.color}15`} stroke={node.color} strokeWidth="2" />
          ) : node.shape === 'oval' ? (
            <ellipse cx={node.x} cy={node.y} rx="40" ry="16"
              fill={`${node.color}15`} stroke={node.color} strokeWidth="2" />
          ) : (
            <rect x={node.x - 45} y={node.y - 16} width="90" height="32" rx="6"
              fill={`${node.color}15`} stroke={node.color} strokeWidth="2" />
          )}
          <text x={node.x} y={node.y + 4} fill="#fff" fontSize="10" textAnchor="middle" fontWeight="600">{node.label}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── System Architecture ── */
export function SystemArchViz({ blocks }) {
  const defaultBlocks = [
    { label: 'Client', x: 30, y: 20, w: 80, h: 40, color: '#3b82f6' },
    { label: 'Load Balancer', x: 140, y: 20, w: 100, h: 40, color: '#f59e0b' },
    { label: 'Server 1', x: 140, y: 90, w: 80, h: 36, color: '#10b981' },
    { label: 'Server 2', x: 240, y: 90, w: 80, h: 36, color: '#10b981' },
    { label: 'Database', x: 180, y: 155, w: 90, h: 40, color: '#8b5cf6' },
    { label: 'Cache', x: 60, y: 155, w: 70, h: 40, color: '#ef4444' },
  ];
  const b = blocks || defaultBlocks;
  return (
    <svg viewBox="0 0 360 220" className="mc-viz-svg" style={{ width: '100%', height: '220px' }}>
      {/* Connection lines */}
      <line x1="70" y1="60" x2="170" y2="40" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="190" y1="60" x2="180" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <line x1="190" y1="60" x2="280" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <line x1="180" y1="126" x2="225" y2="155" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <line x1="280" y1="126" x2="225" y2="155" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      <line x1="180" y1="126" x2="95" y2="155" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Blocks */}
      {b.map((block, i) => (
        <g key={i}>
          <rect x={block.x} y={block.y} width={block.w} height={block.h} rx="8"
            fill={`${block.color}12`} stroke={block.color} strokeWidth="2">
            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${i * 0.1}s`} fill="freeze" />
          </rect>
          <text x={block.x + block.w / 2} y={block.y + block.h / 2 + 4} fill="#fff"
            fontSize="10" textAnchor="middle" fontWeight="600">{block.label}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── Layer Stack Visualization ── */
export function LayerStackViz({ layers }) {
  const defaultLayers = [
    { label: 'Frontend (React)', color: '#06b6d4' },
    { label: 'API Layer (Express)', color: '#10b981' },
    { label: 'Business Logic', color: '#8b5cf6' },
    { label: 'Database (MongoDB)', color: '#f59e0b' },
    { label: 'Infrastructure', color: '#ef4444' },
  ];
  const l = layers || defaultLayers;
  const W = 300, itemH = 38, gap = 4;
  const H = l.length * (itemH + gap) + 20;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mc-viz-svg" style={{ width: '100%', height: `${H}px` }}>
      {l.map((layer, i) => {
        const y = 10 + i * (itemH + gap);
        return (
          <g key={i}>
            <rect x="20" y={y} width={W - 40} height={itemH} rx="8"
              fill={`${layer.color}12`} stroke={layer.color} strokeWidth="2">
              <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${i * 0.12}s`} fill="freeze" />
            </rect>
            <text x={W / 2} y={y + itemH / 2 + 4} fill="#fff" fontSize="11"
              textAnchor="middle" fontWeight="600">{layer.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Database Schema Visualization ── */
export function DatabaseViz({ tables }) {
  const defaultTables = [
    { name: 'Users', fields: ['id', 'name', 'email'], x: 30, y: 20, color: '#3b82f6' },
    { name: 'Posts', fields: ['id', 'title', 'user_id'], x: 200, y: 20, color: '#10b981' },
  ];
  const t = tables || defaultTables;
  return (
    <svg viewBox="0 0 360 200" className="mc-viz-svg" style={{ width: '100%', height: '200px' }}>
      {/* Relationship line */}
      <line x1="155" y1="60" x2="200" y2="60" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="178" y="54" fill="#f59e0b" fontSize="8" textAnchor="middle">1:N</text>
      {t.map((table, ti) => (
        <g key={ti}>
          <rect x={table.x} y={table.y} width="125" height={28 + table.fields.length * 22} rx="8"
            fill="rgba(15,15,35,0.8)" stroke={table.color} strokeWidth="2" />
          <rect x={table.x} y={table.y} width="125" height="28" rx="8 8 0 0"
            fill={`${table.color}25`} />
          <text x={table.x + 62} y={table.y + 18} fill="#fff" fontSize="11"
            textAnchor="middle" fontWeight="700">{table.name}</text>
          {table.fields.map((field, fi) => (
            <text key={fi} x={table.x + 12} y={table.y + 44 + fi * 22}
              fill="#aaa" fontSize="10" fontWeight="500">
              {fi === 0 ? '🔑 ' : '  '}{field}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}

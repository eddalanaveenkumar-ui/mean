import React from 'react';

/* ── Array Visualization ── */
export function ArrayViz({ values, highlight }) {
  return (
    <div className="mc-viz-array-wrap">
      <div className="mc-viz-row">
        <span className="mc-viz-label">Index →</span>
        {values.map((_, i) => (
          <span key={i} className={`mc-viz-idx ${i === highlight ? 'hl' : ''}`}>{i}</span>
        ))}
      </div>
      <div className="mc-viz-row">
        <span className="mc-viz-label">Value →</span>
        {values.map((v, i) => (
          <div key={i} className={`mc-viz-cell ${i === highlight ? 'hl' : ''}`}>{v}</div>
        ))}
      </div>
      {highlight >= 0 && highlight < values.length && (
        <div className="mc-viz-pointer" style={{ marginLeft: `${72 + highlight * 60}px` }}>
          <div className="mc-viz-pointer-line" />
          <div className="mc-viz-pointer-badge">arr[{highlight}] = {values[highlight]}</div>
        </div>
      )}
    </div>
  );
}

/* ── Linked List Visualization ── */
export function LinkedListViz({ values, highlight }) {
  return (
    <div className="mc-viz-ll-wrap">
      {values.map((v, i) => (
        <React.Fragment key={i}>
          <div className={`mc-viz-ll-node ${i === highlight ? 'hl' : ''}`}>
            <div className="mc-viz-ll-data">{v}</div>
            <div className="mc-viz-ll-next">{i < values.length - 1 ? '●' : 'NULL'}</div>
          </div>
          {i < values.length - 1 && <div className="mc-viz-ll-arrow">→</div>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Tree Visualization ── */
export function TreeViz({ values, highlight }) {
  const positions = [[200, 20], [120, 80], [280, 80], [80, 140], [160, 140], [240, 140], [320, 140]];
  const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
  return (
    <svg viewBox="0 0 400 180" className="mc-viz-svg" style={{ width: '100%', height: '180px' }}>
      {edges.map(([a, b], i) => positions[a] && positions[b] && (
        <line key={i} x1={positions[a][0]} y1={positions[a][1] + 15} x2={positions[b][0]} y2={positions[b][1] + 15}
          stroke="#f59e0b" strokeWidth="1.5" opacity="0.4" />
      ))}
      {values.slice(0, 7).map((v, i) => positions[i] && (
        <g key={i}>
          <circle cx={positions[i][0]} cy={positions[i][1] + 15} r="22"
            fill={i === highlight ? 'rgba(124,58,237,0.3)' : '#1e1e3a'}
            stroke={i === highlight ? '#7c3aed' : '#f59e0b'} strokeWidth="2" />
          <text x={positions[i][0]} y={positions[i][1] + 20} fill="#fff" fontSize="12"
            textAnchor="middle" fontWeight="700">{v}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── Stack Visualization ── */
export function StackViz({ values, highlight }) {
  return (
    <div className="mc-viz-stack-wrap">
      {[...values].reverse().map((v, i) => {
        const ri = values.length - 1 - i;
        return (
          <div key={i} className={`mc-viz-stack-item ${ri === highlight ? 'hl' : ''}`}>
            {ri === values.length - 1 && <span className="mc-viz-stack-top">TOP →</span>}
            <div className="mc-viz-stack-val">{v}</div>
          </div>
        );
      })}
      <div className="mc-viz-stack-base">── Stack Base ──</div>
    </div>
  );
}

/* ── Queue Visualization ── */
export function QueueViz({ values, highlight }) {
  return (
    <div className="mc-viz-ll-wrap">
      <span className="mc-viz-label" style={{ color: '#10b981' }}>Front →</span>
      {values.map((v, i) => (
        <div key={i} className={`mc-viz-cell ${i === highlight ? 'hl' : ''}`}
          style={{ width: 50, height: 50 }}>{v}</div>
      ))}
      <span className="mc-viz-label" style={{ color: '#ef4444' }}>← Rear</span>
    </div>
  );
}

/* ── Graph Visualization ── */
export function GraphViz({ nodes: customNodes, edges: customEdges }) {
  const defaultNodes = [[80, 40, 'A'], [240, 40, 'B'], [40, 130, 'C'], [160, 160, 'D'], [300, 130, 'E']];
  const defaultEdges = [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4]];
  const nodes = customNodes || defaultNodes;
  const edges = customEdges || defaultEdges;
  return (
    <svg viewBox="0 0 360 200" className="mc-viz-svg" style={{ width: '100%', height: '200px' }}>
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="#10b981" strokeWidth="1.5" opacity="0.4" />
      ))}
      {nodes.map(([x, y, v], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="24" fill="#1e1e3a" stroke="#10b981" strokeWidth="2" />
          <text x={x} y={y + 5} fill="#fff" fontSize="14" textAnchor="middle" fontWeight="700">{v}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── HashMap Visualization ── */
export function HashMapViz({ pairs: customPairs }) {
  const defaultPairs = [['name', 'Alice'], ['age', '25'], ['city', 'NYC'], ['job', 'Dev']];
  const pairs = customPairs || defaultPairs;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 0' }}>
      {pairs.map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="mc-viz-cell" style={{ width: 80, height: 36, fontSize: '0.8rem', background: 'rgba(59,130,246,0.12)', borderColor: '#3b82f6' }}>{k}</div>
          <span style={{ color: '#3b82f6' }}>→</span>
          <div className="mc-viz-cell" style={{ width: 80, height: 36, fontSize: '0.8rem', background: 'rgba(16,185,129,0.1)', borderColor: '#10b981' }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

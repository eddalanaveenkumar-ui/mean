import React from 'react';

/* ── Molecule Visualization ── */
export function MoleculeViz({ atoms, bonds, formula }) {
  const defaultAtoms = [
    { x: 180, y: 100, label: 'O', color: '#ef4444', r: 24 },
    { x: 100, y: 160, label: 'H', color: '#60a5fa', r: 18 },
    { x: 260, y: 160, label: 'H', color: '#60a5fa', r: 18 },
  ];
  const defaultBonds = [[0, 1], [0, 2]];
  const a = atoms || defaultAtoms;
  const b = bonds || defaultBonds;
  return (
    <div className="mc-viz-molecule-wrap">
      <svg viewBox="0 0 360 220" className="mc-viz-svg" style={{ width: '100%', height: '220px' }}>
        {b.map(([from, to], i) => a[from] && a[to] && (
          <line key={i} x1={a[from].x} y1={a[from].y} x2={a[to].x} y2={a[to].y}
            stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round">
            <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin={`${i * 0.2}s`} fill="freeze" />
          </line>
        ))}
        {a.map((atom, i) => (
          <g key={i}>
            <circle cx={atom.x} cy={atom.y} r={atom.r || 20} fill={atom.color || '#8b5cf6'} opacity="0.2" />
            <circle cx={atom.x} cy={atom.y} r={atom.r || 20} fill="none"
              stroke={atom.color || '#8b5cf6'} strokeWidth="2">
              <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${i * 0.15}s`} fill="freeze" />
            </circle>
            <text x={atom.x} y={atom.y + 5} fill="#fff" fontSize="14"
              textAnchor="middle" fontWeight="700">{atom.label}</text>
          </g>
        ))}
      </svg>
      {formula && <div className="mc-viz-formula">{formula}</div>}
    </div>
  );
}

/* ── Atom Model ── */
export function AtomViz({ element, protons, electrons, shells }) {
  const el = element || 'C';
  const sh = shells || [2, 4];
  const shellRadii = [35, 60, 85, 110];
  return (
    <svg viewBox="0 0 300 260" className="mc-viz-svg" style={{ width: '100%', height: '240px' }}>
      {/* Nucleus */}
      <circle cx="150" cy="130" r="22" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="2" />
      <text x="150" y="135" fill="#fff" fontSize="16" textAnchor="middle" fontWeight="800">{el}</text>
      <text x="150" y="148" fill="#ef4444" fontSize="8" textAnchor="middle">{protons || '?'}p</text>
      {/* Electron shells */}
      {sh.map((count, si) => {
        const r = shellRadii[si] || 35 + si * 25;
        const electrons = [];
        for (let e = 0; e < count; e++) {
          const angle = (2 * Math.PI * e) / count - Math.PI / 2;
          electrons.push({ x: 150 + r * Math.cos(angle), y: 130 + r * Math.sin(angle) });
        }
        return (
          <g key={si}>
            <circle cx="150" cy="130" r={r} fill="none" stroke="rgba(96,165,250,0.2)" strokeWidth="1" strokeDasharray="4 3" />
            {electrons.map((pos, ei) => (
              <circle key={ei} cx={pos.x} cy={pos.y} r="4" fill="#60a5fa">
                <animateTransform attributeName="transform" type="rotate"
                  from={`0 150 130`} to={`360 150 130`}
                  dur={`${3 + si}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Wave Diagram ── */
export function WaveViz({ wavelength, amplitude, frequency }) {
  const W = 400, H = 180, midY = 90;
  const amp = amplitude || 50;
  const wl = wavelength || 100;
  const points = [];
  for (let x = 0; x <= W; x += 2) {
    const y = midY - amp * Math.sin((2 * Math.PI * x) / wl);
    points.push(`${x},${y}`);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mc-viz-svg" style={{ width: '100%', height: '180px' }}>
      <line x1="0" y1={midY} x2={W} y2={midY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 3" />
      <polyline points={points.join(' ')} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
      {/* Amplitude arrow */}
      <line x1={wl / 4} y1={midY} x2={wl / 4} y2={midY - amp} stroke="#f59e0b" strokeWidth="1.5" />
      <text x={wl / 4 + 8} y={midY - amp / 2} fill="#f59e0b" fontSize="10" fontWeight="600">A</text>
      {/* Wavelength arrow */}
      <line x1={0} y1={H - 15} x2={wl} y2={H - 15} stroke="#10b981" strokeWidth="1.5" />
      <text x={wl / 2} y={H - 4} fill="#10b981" fontSize="10" textAnchor="middle" fontWeight="600">λ</text>
      {frequency && <text x={W - 10} y={20} fill="#888" fontSize="10" textAnchor="end">f = {frequency} Hz</text>}
    </svg>
  );
}

/* ── Force Diagram ── */
export function ForceViz({ forces }) {
  const defaultForces = [
    { label: 'F_N', dir: 'up', color: '#3b82f6' },
    { label: 'F_g', dir: 'down', color: '#ef4444' },
    { label: 'F_app', dir: 'right', color: '#10b981' },
    { label: 'f', dir: 'left', color: '#f59e0b' },
  ];
  const f = forces || defaultForces;
  const cx = 180, cy = 110, len = 60;
  const dirMap = { up: [0, -len], down: [0, len], left: [-len, 0], right: [len, 0] };
  return (
    <svg viewBox="0 0 360 220" className="mc-viz-svg" style={{ width: '100%', height: '220px' }}>
      <rect x={cx - 25} y={cy - 25} width="50" height="50" rx="6" fill="rgba(139,92,246,0.15)" stroke="#8b5cf6" strokeWidth="2" />
      <text x={cx} y={cy + 5} fill="#a78bfa" fontSize="12" textAnchor="middle" fontWeight="700">m</text>
      {f.map((force, i) => {
        const [dx, dy] = dirMap[force.dir] || [0, 0];
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={cx + dx} y2={cy + dy}
              stroke={force.color || '#fff'} strokeWidth="2.5" markerEnd={`url(#fArrow${i})`} />
            <text x={cx + dx * 1.3} y={cy + dy * 1.3 + 4} fill={force.color || '#fff'}
              fontSize="11" textAnchor="middle" fontWeight="600">{force.label}</text>
            <defs>
              <marker id={`fArrow${i}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={force.color || '#fff'} />
              </marker>
            </defs>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Circuit Diagram ── */
export function CircuitViz() {
  return (
    <svg viewBox="0 0 360 200" className="mc-viz-svg" style={{ width: '100%', height: '200px' }}>
      {/* Battery */}
      <line x1="40" y1="60" x2="40" y2="140" stroke="#f59e0b" strokeWidth="2" />
      <line x1="30" y1="85" x2="50" y2="85" stroke="#f59e0b" strokeWidth="3" />
      <line x1="35" y1="100" x2="45" y2="100" stroke="#f59e0b" strokeWidth="1.5" />
      <line x1="30" y1="115" x2="50" y2="115" stroke="#f59e0b" strokeWidth="3" />
      <text x="40" y="155" fill="#f59e0b" fontSize="10" textAnchor="middle" fontWeight="600">V</text>
      {/* Wires */}
      <line x1="40" y1="60" x2="180" y2="60" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <line x1="180" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <line x1="320" y1="60" x2="320" y2="140" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <line x1="320" y1="140" x2="180" y2="140" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <line x1="180" y1="140" x2="40" y2="140" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      {/* Resistor */}
      <rect x="155" y="48" width="50" height="24" rx="4" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="2" />
      <text x="180" y="64" fill="#60a5fa" fontSize="10" textAnchor="middle" fontWeight="600">R</text>
      {/* Bulb */}
      <circle cx="320" cy="100" r="16" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" strokeWidth="2" />
      <text x="320" y="104" fill="#f59e0b" fontSize="10" textAnchor="middle">💡</text>
      {/* Current arrow */}
      <text x="110" y="52" fill="#10b981" fontSize="10" fontWeight="600">I →</text>
    </svg>
  );
}

/* ── Periodic Element Card ── */
export function PeriodicElementViz({ symbol, name, number, mass, category }) {
  const catColors = {
    'metal': '#3b82f6', 'nonmetal': '#10b981', 'noble gas': '#8b5cf6',
    'metalloid': '#f59e0b', 'halogen': '#ef4444', default: '#6366f1'
  };
  const clr = catColors[(category || '').toLowerCase()] || catColors.default;
  return (
    <div className="mc-viz-element-card" style={{ borderColor: clr }}>
      <div className="mc-viz-element-number" style={{ color: clr }}>{number || '6'}</div>
      <div className="mc-viz-element-symbol">{symbol || 'C'}</div>
      <div className="mc-viz-element-name">{name || 'Carbon'}</div>
      <div className="mc-viz-element-mass">{mass || '12.011'}</div>
    </div>
  );
}

import React from 'react';

/* ── Graph/Function Plotter ── */
export function GraphPlotter({ func, label, xRange, yRange, color }) {
  const fn = func || 'x*x';
  const lbl = label || `y = ${fn}`;
  const [xMin, xMax] = xRange || [-5, 5];
  const [yMin, yMax] = yRange || [-5, 25];
  const clr = color || '#3b82f6';
  const W = 400, H = 280, pad = 40;
  const plotW = W - 2 * pad, plotH = H - 2 * pad;
  const toSvgX = (x) => pad + ((x - xMin) / (xMax - xMin)) * plotW;
  const toSvgY = (y) => pad + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const points = [];
  for (let i = 0; i <= 200; i++) {
    const x = xMin + (i / 200) * (xMax - xMin);
    let y;
    try {
      y = Function('x', `return ${fn.replace(/\^/g,'**').replace(/sin/g,'Math.sin').replace(/cos/g,'Math.cos').replace(/sqrt/g,'Math.sqrt').replace(/abs/g,'Math.abs').replace(/log/g,'Math.log').replace(/pi/g,'Math.PI')}`)(x);
    } catch { y = 0; }
    if (isFinite(y) && y >= yMin - 5 && y <= yMax + 5) points.push(`${toSvgX(x)},${toSvgY(y)}`);
  }

  const gridX = [], gridY = [];
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) gridX.push(x);
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += Math.max(1, Math.floor((yMax - yMin) / 10))) gridY.push(y);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mc-viz-svg" style={{ width: '100%', height: '280px' }}>
      <rect x={pad} y={pad} width={plotW} height={plotH} fill="rgba(15,15,35,0.6)" rx="4" />
      {gridX.map(x => <line key={`gx${x}`} x1={toSvgX(x)} y1={pad} x2={toSvgX(x)} y2={pad+plotH} stroke="rgba(255,255,255,0.06)" />)}
      {gridY.map(y => <line key={`gy${y}`} x1={pad} y1={toSvgY(y)} x2={pad+plotW} y2={toSvgY(y)} stroke="rgba(255,255,255,0.06)" />)}
      {yMin<=0&&yMax>=0&&<line x1={pad} y1={toSvgY(0)} x2={pad+plotW} y2={toSvgY(0)} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>}
      {xMin<=0&&xMax>=0&&<line x1={toSvgX(0)} y1={pad} x2={toSvgX(0)} y2={pad+plotH} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>}
      <polyline points={points.join(' ')} fill="none" stroke={clr} strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <polyline points={points.join(' ')} fill="none" stroke={clr} strokeWidth="6" strokeLinecap="round" opacity="0.15"/>
      <text x={W/2} y={H-8} fill={clr} fontSize="13" textAnchor="middle" fontWeight="700">{lbl}</text>
    </svg>
  );
}

/* ── Equation Renderer ── */
export function EquationViz({ equation, description }) {
  return (
    <div className="mc-viz-equation">
      <div className="mc-viz-equation-box"><span className="mc-viz-equation-text">{equation || 'ax² + bx + c = 0'}</span></div>
      {description && <div className="mc-viz-equation-desc">{description}</div>}
    </div>
  );
}

/* ── Geometry Visualization ── */
export function GeometryViz({ shape }) {
  const s = (shape || 'triangle').toLowerCase();
  if (s.includes('circle')) {
    return (
      <svg viewBox="0 0 300 260" className="mc-viz-svg" style={{width:'100%',height:'220px'}}>
        <circle cx="150" cy="120" r="80" fill="rgba(16,185,129,0.06)" stroke="#10b981" strokeWidth="2.5"/>
        <circle cx="150" cy="120" r="3" fill="#10b981"/><line x1="150" y1="120" x2="230" y2="120" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 3"/>
        <text x="190" y="112" fill="#f59e0b" fontSize="12" fontWeight="600">r</text>
        <text x="150" y="230" fill="#10b981" fontSize="12" textAnchor="middle" fontWeight="600">A = πr² | C = 2πr</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 300 220" className="mc-viz-svg" style={{width:'100%',height:'220px'}}>
      <polygon points="150,30 40,190 260,190" fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round"/>
      <text x="150" y="20" fill="#60a5fa" fontSize="14" textAnchor="middle" fontWeight="700">A</text>
      <text x="28" y="205" fill="#60a5fa" fontSize="14" textAnchor="middle" fontWeight="700">B</text>
      <text x="272" y="205" fill="#60a5fa" fontSize="14" textAnchor="middle" fontWeight="700">C</text>
    </svg>
  );
}

/* ── Number Line ── */
export function NumberLineViz({ min, max, highlights }) {
  const lo = min ?? -5, hi = max ?? 5;
  const hl = highlights || [];
  const W = 400, H = 80, pad = 30, lineY = 40;
  const toX = (v) => pad + ((v - lo) / (hi - lo)) * (W - 2 * pad);
  const ticks = [];
  for (let v = lo; v <= hi; v++) ticks.push(v);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mc-viz-svg" style={{width:'100%',height:'80px'}}>
      <line x1={pad-10} y1={lineY} x2={W-pad+10} y2={lineY} stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
      {ticks.map(v=><g key={v}><line x1={toX(v)} y1={lineY-6} x2={toX(v)} y2={lineY+6} stroke={hl.includes(v)?'#3b82f6':'rgba(255,255,255,0.2)'} strokeWidth={hl.includes(v)?2.5:1.5}/><text x={toX(v)} y={lineY+20} fill={hl.includes(v)?'#60a5fa':'#666'} fontSize="10" textAnchor="middle">{v}</text>{hl.includes(v)&&<circle cx={toX(v)} cy={lineY} r="5" fill="#3b82f6" opacity="0.8"/>}</g>)}
    </svg>
  );
}

/* ── Matrix ── */
export function MatrixViz({ matrix, label }) {
  const m = matrix || [[1,2,3],[4,5,6],[7,8,9]];
  return (
    <div className="mc-viz-matrix-wrap">
      {label&&<div className="mc-viz-matrix-label">{label}</div>}
      <div className="mc-viz-matrix">
        <div className="mc-viz-matrix-bracket">[</div>
        <div className="mc-viz-matrix-grid">{m.map((row,i)=><div key={i} className="mc-viz-matrix-row">{row.map((val,j)=><div key={j} className="mc-viz-matrix-cell">{val}</div>)}</div>)}</div>
        <div className="mc-viz-matrix-bracket">]</div>
      </div>
    </div>
  );
}

/* ── Venn Diagram ── */
export function SetViz({ setA, setB, label }) {
  return (
    <svg viewBox="0 0 360 220" className="mc-viz-svg" style={{width:'100%',height:'220px'}}>
      <circle cx="140" cy="110" r="80" fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth="2"/>
      <circle cx="220" cy="110" r="80" fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth="2"/>
      <clipPath id="clipA"><circle cx="140" cy="110" r="80"/></clipPath>
      <circle cx="220" cy="110" r="80" fill="rgba(168,85,247,0.15)" clipPath="url(#clipA)"/>
      <text x="110" y="115" fill="#60a5fa" fontSize="16" textAnchor="middle" fontWeight="700">{setA||'A'}</text>
      <text x="250" y="115" fill="#f87171" fontSize="16" textAnchor="middle" fontWeight="700">{setB||'B'}</text>
      <text x="180" y="115" fill="#c084fc" fontSize="12" textAnchor="middle" fontWeight="600">A∩B</text>
      {label&&<text x="180" y="210" fill="#888" fontSize="11" textAnchor="middle">{label}</text>}
    </svg>
  );
}

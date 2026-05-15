import React, { useMemo } from 'react';

/* ── Category accent colors ── */
export const CATEGORY_THEMES = {
  math:          { accent: '#3b82f6', glow: 'rgba(59,130,246,0.08)',  icon: '📐', label: 'Mathematics' },
  physics:       { accent: '#f59e0b', glow: 'rgba(245,158,11,0.08)',  icon: '⚡', label: 'Physics' },
  chemistry:     { accent: '#10b981', glow: 'rgba(16,185,129,0.08)',  icon: '🧪', label: 'Chemistry' },
  biology:       { accent: '#ec4899', glow: 'rgba(236,72,153,0.08)',  icon: '🧬', label: 'Biology' },
  dsa:           { accent: '#8b5cf6', glow: 'rgba(139,92,246,0.08)',  icon: '🧮', label: 'DSA' },
  coding:        { accent: '#6366f1', glow: 'rgba(99,102,241,0.08)',  icon: '💻', label: 'Coding' },
  ai_ml:         { accent: '#06b6d4', glow: 'rgba(6,182,212,0.08)',   icon: '🧠', label: 'AI & ML' },
  fullstack:     { accent: '#ec4899', glow: 'rgba(236,72,153,0.08)',  icon: '🌐', label: 'Full Stack' },
  system_design: { accent: '#f97316', glow: 'rgba(249,115,22,0.08)',  icon: '🏗️', label: 'System Design' },
  default:       { accent: '#8b5cf6', glow: 'rgba(139,92,246,0.08)',  icon: '📚', label: 'Learning' },
};

/* ═══════════════════════════════════════════════════
   GENERIC SVG RENDERER
   Renders ANY visual from AI-generated TOON elements.
   The AI outputs >element sub-items with:
     kind: box | circle | arrow | text | line | icon | curve | grid | wave | group
     x, y, w, h, r, label, color, step, ...
   Elements appear with animation when their step <= currentStep.
   ═══════════════════════════════════════════════════ */

/* ── Render a single element ── */
function RenderElement({ el, index, visible, animDelay }) {
  const kind = (el.kind || 'box').toLowerCase();
  const x = Number(el.x) || 0;
  const y = Number(el.y) || 0;
  const w = Number(el.w) || 120;
  const h = Number(el.h) || 50;
  const r = Number(el.r) || 25;
  const color = el.color || '#8b5cf6';
  const label = el.label || '';
  const fontSize = Number(el.fontSize) || 12;
  const opacity = visible ? 1 : 0;
  const delay = `${animDelay}s`;
  const strokeW = Number(el.strokeWidth) || 2;
  const dashed = el.dashed === true || el.dashed === 'true';
  const dashArr = dashed ? '6 4' : 'none';

  const animStyle = {
    opacity,
    transform: visible ? 'scale(1)' : 'scale(0.85)',
    transition: `opacity 0.5s ease ${delay}, transform 0.5s ease ${delay}`,
    transformOrigin: `${x + w / 2}px ${y + h / 2}px`,
  };

  switch (kind) {
    /* ── Rectangle / Box ── */
    case 'box':
    case 'rect':
      return (
        <g style={animStyle} key={index}>
          <rect x={x} y={y} width={w} height={h} rx={Number(el.rx) || 10}
            fill={`${color}18`} stroke={color} strokeWidth={strokeW} strokeDasharray={dashArr} />
          {label && (
            <text x={x + w / 2} y={y + h / 2 + fontSize * 0.35} fill="#fff"
              fontSize={fontSize} textAnchor="middle" fontWeight="600">{label}</text>
          )}
          {el.sublabel && (
            <text x={x + w / 2} y={y + h / 2 + fontSize * 0.35 + 14} fill="#888"
              fontSize={fontSize - 2} textAnchor="middle">{el.sublabel}</text>
          )}
        </g>
      );

    /* ── Circle ── */
    case 'circle':
      return (
        <g style={{ ...animStyle, transformOrigin: `${x}px ${y}px` }} key={index}>
          <circle cx={x} cy={y} r={r} fill={`${color}18`} stroke={color}
            strokeWidth={strokeW} strokeDasharray={dashArr} />
          {label && (
            <text x={x} y={y + fontSize * 0.35} fill="#fff"
              fontSize={fontSize} textAnchor="middle" fontWeight="700">{label}</text>
          )}
        </g>
      );

    /* ── Arrow / Directed line ── */
    case 'arrow':
      const ax1 = Number(el.x1 ?? el.from_x ?? x);
      const ay1 = Number(el.y1 ?? el.from_y ?? y);
      const ax2 = Number(el.x2 ?? el.to_x ?? x + 80);
      const ay2 = Number(el.y2 ?? el.to_y ?? y);
      const mid_x = (ax1 + ax2) / 2;
      const mid_y = (ay1 + ay2) / 2;
      const arrowId = `arrow-${index}`;
      return (
        <g style={animStyle} key={index}>
          <defs>
            <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          </defs>
          <line x1={ax1} y1={ay1} x2={ax2} y2={ay2}
            stroke={color} strokeWidth={strokeW} strokeDasharray={dashArr}
            markerEnd={`url(#${arrowId})`} opacity="0.8" />
          {label && (
            <text x={mid_x + 4} y={mid_y - 6} fill={color}
              fontSize={fontSize - 1} fontWeight="600">{label}</text>
          )}
        </g>
      );

    /* ── Plain line (no arrow) ── */
    case 'line':
      const lx1 = Number(el.x1 ?? x);
      const ly1 = Number(el.y1 ?? y);
      const lx2 = Number(el.x2 ?? x + 80);
      const ly2 = Number(el.y2 ?? y);
      return (
        <g style={animStyle} key={index}>
          <line x1={lx1} y1={ly1} x2={lx2} y2={ly2}
            stroke={color} strokeWidth={strokeW} strokeDasharray={dashArr} opacity="0.6" />
          {label && (
            <text x={(lx1 + lx2) / 2} y={(ly1 + ly2) / 2 - 6}
              fill={color} fontSize={fontSize - 1} textAnchor="middle">{label}</text>
          )}
        </g>
      );

    /* ── Standalone text / annotation ── */
    case 'text':
    case 'label':
      return (
        <g style={animStyle} key={index}>
          <text x={x} y={y} fill={color} fontSize={fontSize}
            textAnchor={el.anchor || 'start'} fontWeight={el.bold ? '700' : '500'}
            fontFamily={el.mono ? "'JetBrains Mono', monospace" : 'inherit'}>
            {label}
          </text>
        </g>
      );

    /* ── Emoji / Icon ── */
    case 'icon':
    case 'emoji':
      return (
        <g style={animStyle} key={index}>
          <text x={x} y={y} fontSize={Number(el.size) || 28} textAnchor="middle">{label}</text>
        </g>
      );

    /* ── Wave / Sine curve ── */
    case 'wave':
    case 'curve':
    case 'sine': {
      const waveW = Number(el.w) || 300;
      const amp = Number(el.amplitude) || 30;
      const freq = Number(el.frequency) || 2;
      const pts = [];
      for (let i = 0; i <= waveW; i += 2) {
        const py = y - amp * Math.sin((2 * Math.PI * freq * i) / waveW);
        pts.push(`${x + i},${py}`);
      }
      return (
        <g style={animStyle} key={index}>
          <polyline points={pts.join(' ')} fill="none" stroke={color}
            strokeWidth={strokeW} strokeLinecap="round" />
          {label && (
            <text x={x + waveW / 2} y={y + amp + 20} fill={color}
              fontSize={fontSize} textAnchor="middle" fontWeight="600">{label}</text>
          )}
        </g>
      );
    }

    /* ── Grid / Coordinate system ── */
    case 'grid': {
      const gw = Number(el.w) || 200;
      const gh = Number(el.h) || 200;
      const step = Number(el.gridStep) || 40;
      const lines = [];
      for (let gx = 0; gx <= gw; gx += step) {
        lines.push(<line key={`gv${gx}`} x1={x + gx} y1={y} x2={x + gx} y2={y + gh}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />);
      }
      for (let gy = 0; gy <= gh; gy += step) {
        lines.push(<line key={`gh${gy}`} x1={x} y1={y + gy} x2={x + gw} y2={y + gy}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />);
      }
      return (
        <g style={animStyle} key={index}>
          <rect x={x} y={y} width={gw} height={gh} fill="rgba(10,10,30,0.5)" rx="4" />
          {lines}
          {/* Axes */}
          <line x1={x} y1={y + gh / 2} x2={x + gw} y2={y + gh / 2} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <line x1={x + gw / 2} y1={y} x2={x + gw / 2} y2={y + gh} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          {label && <text x={x + gw / 2} y={y - 6} fill="#666" fontSize="10" textAnchor="middle">{label}</text>}
        </g>
      );
    }

    /* ── Diamond (decision) ── */
    case 'diamond': {
      const dw = w / 2, dh = h / 2;
      const cx = x + dw, cy = y + dh;
      return (
        <g style={{ ...animStyle, transformOrigin: `${cx}px ${cy}px` }} key={index}>
          <polygon points={`${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`}
            fill={`${color}18`} stroke={color} strokeWidth={strokeW} />
          {label && (
            <text x={cx} y={cy + fontSize * 0.35} fill="#fff"
              fontSize={fontSize} textAnchor="middle" fontWeight="600">{label}</text>
          )}
        </g>
      );
    }

    /* ── Pill / Rounded capsule ── */
    case 'pill':
    case 'capsule':
      return (
        <g style={animStyle} key={index}>
          <rect x={x} y={y} width={w} height={h} rx={h / 2}
            fill={`${color}18`} stroke={color} strokeWidth={strokeW} />
          {label && (
            <text x={x + w / 2} y={y + h / 2 + fontSize * 0.35} fill="#fff"
              fontSize={fontSize} textAnchor="middle" fontWeight="600">{label}</text>
          )}
        </g>
      );

    /* ── Highlight / Glow circle ── */
    case 'highlight':
    case 'glow':
      return (
        <g style={{ ...animStyle, transformOrigin: `${x}px ${y}px` }} key={index}>
          <circle cx={x} cy={y} r={r} fill={`${color}25`} stroke="none">
            <animate attributeName="r" values={`${r};${r + 6};${r}`} dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={x} cy={y} r={r * 0.6} fill={color} opacity="0.5" />
          {label && (
            <text x={x} y={y + fontSize * 0.35} fill="#fff"
              fontSize={fontSize} textAnchor="middle" fontWeight="700">{label}</text>
          )}
        </g>
      );

    /* ── Axis — Coordinate axis with tick marks and labels ── */
    case 'axis': {
      const axisW = Number(el.w) || 400;
      const axisH = Number(el.h) || 300;
      const xMin = Number(el.xMin) ?? -5;
      const xMax = Number(el.xMax) ?? 5;
      const yMin = Number(el.yMin) ?? -5;
      const yMax = Number(el.yMax) ?? 5;
      const tickStep = Number(el.tickStep) || 1;
      const originX = x + ((0 - xMin) / (xMax - xMin)) * axisW;
      const originY = y + axisH - ((0 - yMin) / (yMax - yMin)) * axisH;
      const ticks = [];
      // X ticks
      for (let v = Math.ceil(xMin); v <= Math.floor(xMax); v += tickStep) {
        const tx = x + ((v - xMin) / (xMax - xMin)) * axisW;
        ticks.push(
          <g key={`xt${v}`}>
            <line x1={tx} y1={originY - 4} x2={tx} y2={originY + 4} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            {v !== 0 && <text x={tx} y={originY + 16} fill="#888" fontSize="9" textAnchor="middle">{v}</text>}
          </g>
        );
      }
      // Y ticks
      for (let v = Math.ceil(yMin); v <= Math.floor(yMax); v += tickStep) {
        const ty = y + axisH - ((v - yMin) / (yMax - yMin)) * axisH;
        ticks.push(
          <g key={`yt${v}`}>
            <line x1={originX - 4} y1={ty} x2={originX + 4} y2={ty} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            {v !== 0 && <text x={originX - 10} y={ty + 3} fill="#888" fontSize="9" textAnchor="end">{v}</text>}
          </g>
        );
      }
      return (
        <g style={animStyle} key={index}>
          {/* Grid lines */}
          {Array.from({ length: Math.floor(xMax - xMin) + 1 }, (_, i) => xMin + i).map(v => {
            const gx = x + ((v - xMin) / (xMax - xMin)) * axisW;
            return <line key={`gxl${v}`} x1={gx} y1={y} x2={gx} y2={y + axisH} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
          })}
          {Array.from({ length: Math.floor(yMax - yMin) + 1 }, (_, i) => yMin + i).map(v => {
            const gy = y + axisH - ((v - yMin) / (yMax - yMin)) * axisH;
            return <line key={`gyl${v}`} x1={x} y1={gy} x2={x + axisW} y2={gy} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
          })}
          {/* X-axis */}
          <line x1={x} y1={originY} x2={x + axisW} y2={originY} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* Y-axis */}
          <line x1={originX} y1={y} x2={originX} y2={y + axisH} stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* Arrowheads */}
          <polygon points={`${x + axisW},${originY} ${x + axisW - 6},${originY - 3} ${x + axisW - 6},${originY + 3}`} fill="rgba(255,255,255,0.35)" />
          <polygon points={`${originX},${y} ${originX - 3},${y + 6} ${originX + 3},${y + 6}`} fill="rgba(255,255,255,0.35)" />
          {ticks}
          {/* Axis labels */}
          <text x={x + axisW - 4} y={originY - 10} fill="#aaa" fontSize="11" textAnchor="end" fontWeight="600">{el.xLabel || 'x'}</text>
          <text x={originX + 12} y={y + 12} fill="#aaa" fontSize="11" textAnchor="start" fontWeight="600">{el.yLabel || 'y'}</text>
          {label && <text x={x + axisW / 2} y={y + axisH + 22} fill={color} fontSize="11" textAnchor="middle" fontWeight="600">{label}</text>}
        </g>
      );
    }

    /* ── Plotline — Function curve from points string ── */
    case 'plotline':
    case 'functioncurve': {
      const ptsStr = el.points || '';
      return (
        <g style={animStyle} key={index}>
          <polyline points={ptsStr} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" opacity="0.9" />
          <polyline points={ptsStr} fill="none" stroke={color} strokeWidth={strokeW + 4} strokeLinecap="round" opacity="0.12" />
          {label && (
            <text x={x || 0} y={y || 0} fill={color} fontSize={fontSize} fontWeight="600" textAnchor={el.anchor || 'start'}>{label}</text>
          )}
        </g>
      );
    }

    /* ── Arc — Angle arc with degree label ── */
    case 'arc':
    case 'angle': {
      const arcR = Number(el.r) || 30;
      const startAngle = (Number(el.startAngle) || 0) * (Math.PI / 180);
      const endAngle = (Number(el.endAngle) || 90) * (Math.PI / 180);
      const cx = x, cy = y;
      const x1a = cx + arcR * Math.cos(-startAngle);
      const y1a = cy + arcR * Math.sin(-startAngle);
      const x2a = cx + arcR * Math.cos(-endAngle);
      const y2a = cy + arcR * Math.sin(-endAngle);
      const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
      const midAngle = -(startAngle + endAngle) / 2;
      const labelR = arcR + 14;
      return (
        <g style={{ ...animStyle, transformOrigin: `${cx}px ${cy}px` }} key={index}>
          <path d={`M ${x1a} ${y1a} A ${arcR} ${arcR} 0 ${largeArc} 0 ${x2a} ${y2a}`}
            fill="none" stroke={color} strokeWidth={strokeW} strokeDasharray={dashArr} />
          {label && (
            <text x={cx + labelR * Math.cos(midAngle)} y={cy + labelR * Math.sin(midAngle)}
              fill={color} fontSize={fontSize - 1} textAnchor="middle" fontWeight="600">{label}</text>
          )}
        </g>
      );
    }

    /* ── Dimension — Measurement line with arrows on both ends + label ── */
    case 'dimension':
    case 'measurement': {
      const dx1 = Number(el.x1 ?? x);
      const dy1 = Number(el.y1 ?? y);
      const dx2 = Number(el.x2 ?? x + 100);
      const dy2 = Number(el.y2 ?? y);
      const dmid_x = (dx1 + dx2) / 2;
      const dmid_y = (dy1 + dy2) / 2;
      const dimId = `dim-${index}`;
      const dimIdR = `dim-r-${index}`;
      return (
        <g style={animStyle} key={index}>
          <defs>
            <marker id={dimId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
            <marker id={dimIdR} viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 10 0 L 0 5 L 10 10 z" fill={color} />
            </marker>
          </defs>
          <line x1={dx1} y1={dy1} x2={dx2} y2={dy2}
            stroke={color} strokeWidth="1.5" strokeDasharray={dashed ? '4 3' : 'none'}
            markerStart={`url(#${dimIdR})`} markerEnd={`url(#${dimId})`} opacity="0.7" />
          {label && (
            <text x={dmid_x} y={dmid_y - 8} fill={color} fontSize={fontSize - 1} textAnchor="middle" fontWeight="700"
              style={{ background: 'rgba(10,10,25,0.8)' }}>{label}</text>
          )}
        </g>
      );
    }

    /* ── Polygon — Any polygon from comma-separated points ── */
    case 'polygon':
    case 'triangle':
    case 'pentagon':
    case 'hexagon': {
      const ptsRaw = el.points || `${x},${y + h} ${x + w / 2},${y} ${x + w},${y + h}`;
      return (
        <g style={animStyle} key={index}>
          <polygon points={ptsRaw} fill={`${color}12`} stroke={color} strokeWidth={strokeW}
            strokeLinejoin="round" strokeDasharray={dashArr} />
          {label && (
            <text x={x + (w || 0) / 2} y={y + (h || 0) / 2 + fontSize * 0.35} fill="#fff"
              fontSize={fontSize} textAnchor="middle" fontWeight="600">{label}</text>
          )}
          {el.sublabel && (
            <text x={x + (w || 0) / 2} y={y + (h || 0) / 2 + fontSize * 0.35 + 14} fill="#888"
              fontSize={fontSize - 2} textAnchor="middle">{el.sublabel}</text>
          )}
        </g>
      );
    }

    /* ── Filled Region — Shaded area under curve / between lines ── */
    case 'region':
    case 'filled_region':
    case 'area': {
      const regionPts = el.points || '';
      return (
        <g style={animStyle} key={index}>
          <polygon points={regionPts} fill={`${color}15`} stroke="none" />
          <polyline points={regionPts} fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
          {label && (
            <text x={x} y={y} fill={color} fontSize={fontSize - 1} textAnchor="middle" fontWeight="600">{label}</text>
          )}
        </g>
      );
    }

    /* ── Dot / Point marker ── */
    case 'dot':
    case 'point': {
      const dotR = Number(el.r) || 4;
      return (
        <g style={{ ...animStyle, transformOrigin: `${x}px ${y}px` }} key={index}>
          <circle cx={x} cy={y} r={dotR + 3} fill={`${color}30`} />
          <circle cx={x} cy={y} r={dotR} fill={color} />
          {label && (
            <text x={x + dotR + 6} y={y + fontSize * 0.35} fill={color}
              fontSize={fontSize - 1} fontWeight="600">{label}</text>
          )}
        </g>
      );
    }

    /* ── Cylinder — database / container ── */
    case 'cylinder': {
      const cw = w, ch = h, ry = Math.min(15, h * 0.15);
      return (
        <g style={animStyle} key={index}>
          <rect x={x} y={y + ry} width={cw} height={ch - 2 * ry} fill={`${color}18`} stroke={color} strokeWidth={strokeW} />
          <ellipse cx={x + cw / 2} cy={y + ry} rx={cw / 2} ry={ry} fill={`${color}25`} stroke={color} strokeWidth={strokeW} />
          <ellipse cx={x + cw / 2} cy={y + ch - ry} rx={cw / 2} ry={ry} fill={`${color}10`} stroke={color} strokeWidth={strokeW} />
          {label && (
            <text x={x + cw / 2} y={y + ch / 2 + fontSize * 0.35} fill="#fff"
              fontSize={fontSize} textAnchor="middle" fontWeight="600">{label}</text>
          )}
        </g>
      );
    }

    /* ── Parallelogram — input/output block ── */
    case 'parallelogram': {
      const skew = Number(el.skew) || 20;
      const pts = `${x + skew},${y} ${x + w},${y} ${x + w - skew},${y + h} ${x},${y + h}`;
      return (
        <g style={animStyle} key={index}>
          <polygon points={pts} fill={`${color}18`} stroke={color} strokeWidth={strokeW} strokeLinejoin="round" />
          {label && (
            <text x={x + w / 2} y={y + h / 2 + fontSize * 0.35} fill="#fff"
              fontSize={fontSize} textAnchor="middle" fontWeight="600">{label}</text>
          )}
        </g>
      );
    }

    /* ── Star — priority/highlight ── */
    case 'star': {
      const points_count = Number(el.pointsCount) || 5;
      const outerR = Number(el.r) || 25;
      const innerR = outerR * 0.45;
      const starPts = [];
      for (let i = 0; i < points_count * 2; i++) {
        const angle = (Math.PI / points_count) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? outerR : innerR;
        starPts.push(`${x + rad * Math.cos(angle)},${y + rad * Math.sin(angle)}`);
      }
      return (
        <g style={{ ...animStyle, transformOrigin: `${x}px ${y}px` }} key={index}>
          <polygon points={starPts.join(' ')} fill={`${color}20`} stroke={color} strokeWidth={strokeW} />
          {label && (
            <text x={x} y={y + fontSize * 0.35} fill="#fff" fontSize={fontSize} textAnchor="middle" fontWeight="700">{label}</text>
          )}
        </g>
      );
    }

    default:
      return (
        <g style={animStyle} key={index}>
          <rect x={x} y={y} width={w} height={h} rx="8"
            fill={`${color}15`} stroke={color} strokeWidth="1.5" />
          {label && (
            <text x={x + w / 2} y={y + h / 2 + 4} fill="#fff"
              fontSize={fontSize} textAnchor="middle" fontWeight="600">{label}</text>
          )}
        </g>
      );
  }
}

/* ═══════════════════════════════════════════════════
   MAIN TOON RENDERER
   Reads diagram block with >element sub-items,
   renders them as SVG with step-based animation.
   ═══════════════════════════════════════════════════ */
export default function ToonRenderer({ blocks, stepIdx, category }) {
  const theme = CATEGORY_THEMES[category] || CATEGORY_THEMES.default;

  // Find diagram block(s) with elements
  const diagramBlock = blocks.find(b => b.type === 'diagram' && b.elements?.length > 0) || {};
  const elements = diagramBlock.elements || [];

  const svgW = Number(diagramBlock.width) || 600;
  const svgH = Number(diagramBlock.height) || 340;
  const title = diagramBlock.title || '';

  // Compute which elements are visible at current step
  const visibleElements = useMemo(() => {
    return elements.map((el, i) => {
      const elStep = Number(el.step) || 0;
      // step 0 = always visible, otherwise show when stepIdx >= elStep - 1
      const visible = elStep === 0 || stepIdx >= (elStep - 1);
      const delay = elStep === 0 ? i * 0.06 : 0.1;
      return { ...el, _visible: visible, _delay: delay };
    });
  }, [elements, stepIdx]);

  // If no diagram elements from AI, show a helpful fallback
  if (elements.length === 0) {
    return (
      <div className="mc-toon-frame" style={{ borderColor: `${theme.accent}30`, background: theme.glow }}>
        <div className="mc-toon-badge" style={{ background: `${theme.accent}20`, color: theme.accent }}>
          {theme.icon} {theme.label}
        </div>
        <div className="mc-toon-visual mc-toon-placeholder">
          <div className="mc-toon-placeholder-icon">🎨</div>
          <div className="mc-toon-placeholder-text">AI is drawing the diagram...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mc-toon-frame" style={{ borderColor: `${theme.accent}25`, background: theme.glow }}>
      <div className="mc-toon-badge" style={{ background: `${theme.accent}20`, color: theme.accent }}>
        {theme.icon} {theme.label}
      </div>
      {title && <div className="mc-toon-title" style={{ color: theme.accent }}>{title}</div>}
      <div className="mc-toon-visual">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="mc-toon-svg"
          style={{ width: '100%', height: 'auto', maxHeight: '280px' }}
        >
          {/* Background */}
          <rect x="0" y="0" width={svgW} height={svgH} fill="rgba(10,10,25,0.4)" rx="12" />

          {/* Render all elements */}
          {visibleElements.map((el, i) => (
            <RenderElement
              key={i}
              el={el}
              index={i}
              visible={el._visible}
              animDelay={el._delay}
            />
          ))}
        </svg>
      </div>
      {/* Step indicator dots */}
      {elements.some(el => el.step) && (
        <div className="mc-toon-step-dots">
          {Array.from(new Set(elements.map(el => Number(el.step) || 0).filter(s => s > 0))).sort().map(s => (
            <span key={s} className={`mc-toon-dot ${stepIdx >= s - 1 ? 'active' : ''}`}
              style={{ background: stepIdx >= s - 1 ? theme.accent : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
      )}
    </div>
  );
}

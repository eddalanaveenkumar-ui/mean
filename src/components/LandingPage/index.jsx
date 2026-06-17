import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './LandingPage.css';

/* ── Keyboard layout data ── */
const KB_ROWS = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
  ['TAB','Q','W','E','R','T','Y','U','I','O','P','[',']','\\'],
  ['CAPS','A','S','D','F','G','H','J','K','L',';','\'','ENTER'],
  ['SHIFT','Z','X','C','V','B','N','M','<','>','/','SHIFT'],
  ['CTRL','ALT','','ALT','CTRL'],
];

const WIDE_KEYS = new Set(['BACKSPACE','TAB','CAPS','ENTER','SHIFT','CTRL','ALT']);

const SHORTCUTS = [
  { keys: ['CTRL','K'], label: 'Open Command Palette' },
  { keys: ['CTRL','SHIFT','P'], label: 'Switch AI Provider' },
  { keys: ['CTRL','E'], label: 'Toggle Code Canvas' },
  { keys: ['CTRL','J'], label: 'Start Classroom Mode' },
  { keys: ['CTRL','B'], label: 'Toggle Sidebar' },
  { keys: [''], label: 'Focus Input Area', isSpace: true },
];

/* ── SVG Icons ── */
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const LogoSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="2.4" fill="#1fd1b8"/>
    <ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="#3b82f6" strokeWidth="1.3"/>
    <ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="#1fd1b8" strokeWidth="1.3" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="12" rx="9.5" ry="4" stroke="#3b82f6" strokeWidth="1.3" transform="rotate(120 12 12)"/>
  </svg>
);

export default function LandingPage({ onGetStarted }) {
  const [theme, setTheme] = useState('light');
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeShortcutIdx, setActiveShortcutIdx] = useState(0);
  const [activeKeys, setActiveKeys] = useState([]);
  const [fading, setFading] = useState(false);
  const [comets, setComets] = useState([]);

  const rootRef = useRef(null);

  // Setup document/body classes for scroll override
  useEffect(() => {
    document.documentElement.classList.add('landing-active');
    document.body.classList.add('landing-active');
    return () => {
      document.documentElement.classList.remove('landing-active');
      document.body.classList.remove('landing-active');
    };
  }, []);

  // Stable data generators for stars, dust, particles
  const starsData = useMemo(() => {
    const list = [];
    for (let i = 0; i < 120; i++) {
      const isBright = Math.random() < 0.08;
      const size = isBright ? (1.5 + Math.random() * 2) : (0.5 + Math.random() * 1.5);
      list.push({
        id: i,
        className: isBright ? 'star-bright' : 'star',
        size,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 5,
        delay: Math.random() * 6,
        animationName: isBright ? 'lp-twinkle-bright' : 'lp-twinkle'
      });
    }
    return list;
  }, []);

  const dustData = useMemo(() => {
    const list = [];
    for (let i = 0; i < 40; i++) {
      list.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 10 + Math.random() * 15,
        delay: Math.random() * 12
      });
    }
    return list;
  }, []);

  const particlesData = useMemo(() => {
    const list = [];
    const colors = [
      'rgba(59,130,246,0.3)', 'rgba(168,85,247,0.25)',
      'rgba(31,209,184,0.3)', 'rgba(255,90,78,0.2)',
    ];
    for (let i = 0; i < 18; i++) {
      const drift = -40 + Math.random() * 80;
      list.push({
        id: i,
        left: Math.random() * 100,
        top: 40 + Math.random() * 50,
        background: colors[i % colors.length],
        drift,
        duration: 8 + Math.random() * 8,
        delay: Math.random() * 8
      });
    }
    return list;
  }, []);

  // Comet spawner
  useEffect(() => {
    if (theme !== 'dark') return;
    const spawn = () => {
      const id = Date.now() + Math.random();
      const angle = -25 - Math.random() * 20;
      const startX = Math.random() * 60;
      const startY = Math.random() * 40;
      const newComet = {
        id,
        left: startX,
        top: startY,
        angle,
        dx: 80 + Math.random() * 40,
        dy: 30 + Math.random() * 30,
        duration: 3 + Math.random() * 3
      };
      setComets(prev => [...prev, newComet]);
      setTimeout(() => {
        setComets(prev => prev.filter(c => c.id !== id));
      }, 6000);
    };
    const id = setInterval(spawn, 4000 + Math.random() * 3000);
    const t = setTimeout(spawn, 2000);
    return () => { clearInterval(id); clearTimeout(t); };
  }, [theme]);

  // Nav scroll effect
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // IntersectionObserver for scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in-view');
      }),
      { threshold: 0.15 }
    );
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll('.feature-card, .cta-inner, .demo-caption').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Keyboard shortcut cycling
  useEffect(() => {
    const cycle = () => {
      setFading(true);
      setTimeout(() => {
        setActiveShortcutIdx(prev => (prev + 1) % SHORTCUTS.length);
        setFading(false);
      }, 300);
    };
    const id = setInterval(cycle, 3000);
    return () => clearInterval(id);
  }, []);

  // Update active keys when shortcut changes
  useEffect(() => {
    const sc = SHORTCUTS[activeShortcutIdx];
    if (sc.isSpace) {
      setActiveKeys(['SPACE']);
    } else {
      setActiveKeys(sc.keys.map(k => k.toUpperCase()));
    }
  }, [activeShortcutIdx]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  const isKeyActive = useCallback((label) => {
    if (!label) return false;
    const upper = label.toUpperCase();
    if (activeKeys.includes('SPACE') && label === '') return true;
    return activeKeys.includes(upper);
  }, [activeKeys]);

  const currentShortcut = SHORTCUTS[activeShortcutIdx];

  return (
    <div className="landing-page-root" data-theme={theme} ref={rootRef}>
      {/* Noise overlay */}
      <div className="landing-noise" aria-hidden="true" />

      {/* ── NAV ── */}
      <nav className={`lp-nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="logo">
          <LogoSvg />
          Mean AI
        </div>
        <div className="nav-links">
          <a href="#">Curriculum</a>
          <a href="#">Lab Space</a>
          <a href="#">Interactive Docs</a>
          <a href="#">Pricing</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="theme-toggle" aria-label="Toggle theme" onClick={toggleTheme}>
            {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
          </button>
          <button className="nav-cta" onClick={onGetStarted}>Enter Classroom</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        {/* Dark mode ambient */}
        <div className="hero-ambient" aria-hidden="true">
          <div className="glow-purple" />
          <div className="glow-teal" />
        </div>
        <div className="hero-glow-center" aria-hidden="true" />
        <div className="hero-nebula" aria-hidden="true" />
        <div className="hero-beams" aria-hidden="true">
          <div className="beam" /><div className="beam" /><div className="beam" /><div className="beam" />
        </div>
        <div className="hero-center-deep" aria-hidden="true" />
        <div className="hero-cyan-bloom" aria-hidden="true" />

        {/* Light mode ambient */}
        <div className="hero-ambient-light" aria-hidden="true">
          <div className="glow-tl" /><div className="glow-bl" /><div className="glow-tr" /><div className="glow-br" />
        </div>

        {/* Hero content */}
        <div className="hero-inner">
          <span className="eyebrow">Next-Gen Learning Environment</span>
          <h1>AI-Driven<br/><span className="grad-text">Interactive Classroom</span></h1>
          <p className="hero-sub">
            Step into a 3D-inspired workspace where complex coding and mathematics come to life.
            Real-time reasoning, visual execution stacks, and autonomous AI tutors at your side.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary" onClick={onGetStarted}>
              Start Learning <span aria-hidden="true">🎓</span>
            </button>
            <a className="btn btn-secondary" href="#demo">Watch Demo</a>
          </div>
        </div>

        {/* Space effects */}
        <div className="space-dust" aria-hidden="true">
          {theme === 'dark' && dustData.map(dust => (
            <div
              key={dust.id}
              className="dust-particle"
              style={{
                left: `${dust.left}%`,
                top: `${dust.top}%`,
                animation: `lp-dust-drift ${dust.duration}s linear infinite`,
                animationDelay: `${dust.delay}s`
              }}
            />
          ))}
        </div>
        <div className="stars-container" aria-hidden="true">
          {theme === 'dark' && starsData.map(star => (
            <div
              key={star.id}
              className={star.className}
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                animation: `${star.animationName} ${star.duration}s ease-in-out infinite`,
                animationDelay: `${star.delay}s`
              }}
            />
          ))}
        </div>
        <div className="comets-container" aria-hidden="true">
          {theme === 'dark' && comets.map(c => (
            <div
              key={c.id}
              className="comet"
              style={{
                left: `${c.left}%`,
                top: `${c.top}%`,
                transform: `rotate(${c.angle}deg)`,
                '--dx': `${c.dx}vw`,
                '--dy': `${c.dy}vh`,
                animation: `lp-comet-fly ${c.duration}s linear forwards`
              }}
            >
              <div className="comet-core" />
            </div>
          ))}
        </div>
        <div className="particles-container" aria-hidden="true">
          {theme === 'dark' && particlesData.map(p => (
            <div
              key={p.id}
              className="particle"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                background: p.background,
                '--drift': `${p.drift}px`,
                animation: `lp-particle-float ${p.duration}s ease-in-out infinite`,
                animationDelay: `${p.delay}s`
              }}
            />
          ))}
        </div>

        {/* Orbiting AI logos */}
        <div className="logo-orbit" aria-hidden="true">
          <div className="orbit-logo"><img src="/openai.png" alt="OpenAI" draggable="false" /></div>
          <div className="orbit-logo"><img src="/deepseek-logo.png" alt="DeepSeek" draggable="false" /></div>
          <div className="orbit-logo"><img src="/grok.png" alt="Grok" draggable="false" /></div>
          <div className="orbit-logo"><img src="/xai.png" alt="xAI" draggable="false" /></div>
          <div className="orbit-logo"><img src="/replit.png" alt="Replit" draggable="false" /></div>
          <div className="orbit-logo"><img src="/loveble.jpg" alt="Lovable" draggable="false" /></div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="proof">
        <span className="eyebrow-plain">Utilized by Elite Institutions</span>
        <div className="logos">
          <span>NEXUS LABS</span>
          <span>SYNTHOS ACADEMY</span>
          <span>QUANTUM EDU</span>
          <span>VECTOR MATH</span>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features">
        <div className="features-head">
          <h2>Master Complexity in 3D</h2>
          <p>Our classroom isn't just a video player. It's a living, breathing computational engine.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <div className="card-bottom-glow" />
            <div className="feature-icon icon-ember">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 6L10 12L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Live Trace Reasoning</h3>
            <p>Watch the AI explain its logic through real-time code execution and visual data structures.</p>
          </article>
          <article className="feature-card">
            <div className="card-bottom-glow" />
            <div className="feature-icon icon-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Visual Memory Graph</h3>
            <p>Every concept is stored as an interactive knowledge graph. Navigate ideas visually and see how they connect in real-time.</p>
          </article>
          <article className="feature-card">
            <div className="card-bottom-glow" />
            <div className="feature-icon icon-signal">&Sigma;</div>
            <h3>Interactive Algebra</h3>
            <p>Manipulate 3D mathematical models. Change parameters and watch the world rebuild instantly.</p>
          </article>
          <article className="feature-card">
            <div className="card-bottom-glow" />
            <div className="feature-icon icon-circuit">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Autonomous Tutors</h3>
            <p>Dedicated AI agents that learn your pace and adapt the curriculum to your cognitive style.</p>
          </article>
        </div>
      </section>

      {/* ── VIDEO DEMO ── */}
      <section className="demo" id="demo">
        <div className="features-head">
          <span className="eyebrow">See It In Action</span>
          <h2>Watch Mean AI in motion.</h2>
          <p>A live walkthrough of the interactive classroom — real-time traces, tutors, and 3D models.</p>
        </div>
        <div className="demo-inner">
          <div className="demo-ambient" aria-hidden="true">
            <div className="glow-red" /><div className="glow-purple" />
            <div className="glow-blue" /><div className="glow-teal" />
          </div>
          <video className="demo-video" muted autoPlay loop playsInline>
            <source src="/0617.mp4" type="video/mp4" />
          </video>
          <div className="demo-overlay" />
        </div>
        <p className="demo-caption">
          Experience real-time reasoning, visual execution stacks, and AI tutors — all in your browser.
        </p>
      </section>

      {/* ── CTA ── */}
      <div className="cta-wrap">
        <section className="cta">
          <div className="cta-inner">
            <h2>Ready to evolve your intelligence?</h2>
            <p>
              Join the waitlist for the most immersive learning environment ever created.
              Limited spots for the Early Access cohort.
            </p>
            <div className="cta-buttons">
              <button className="btn btn-primary" onClick={onGetStarted}>Request Invite</button>
              <a className="btn btn-secondary" href="#">View Curriculum</a>
            </div>
          </div>
        </section>
      </div>

      {/* ── KEYBOARD SHORTCUTS ── */}
      <section className="keyboard-section">
        <div className="kb-ambient" aria-hidden="true" />
        <div className="kb-ambient-four" aria-hidden="true">
          <div className="glow-red" /><div className="glow-purple" />
          <div className="glow-blue" /><div className="glow-teal" />
        </div>

        <div className="features-head" style={{ position: 'relative', zIndex: 3 }}>
          <span className="eyebrow">Keyboard-First Design</span>
          <h2>Built for Speed</h2>
          <p>Navigate the entire classroom without lifting your hands from the keyboard.</p>
        </div>

        <div className={`shortcut-label${fading ? ' fading' : ''}`}>
          <div className="shortcut-combo">
            {currentShortcut.isSpace ? (
              <span className="key-glyph" style={{ minWidth: 80 }}>Space</span>
            ) : (
              currentShortcut.keys.map((k, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span style={{ opacity: 0.4 }}>+</span>}
                  <span className="key-glyph">{k}</span>
                </React.Fragment>
              ))
            )}
          </div>
          <p className="shortcut-action">{currentShortcut.label}</p>
        </div>

        <div className="keyboard-wrap">
          <div className="kb-hud-frame">
            {/* SVG Wireframe HUD Background */}
            <svg className="kb-hud-svg" viewBox="0 0 800 400" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="hud-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#hud-glow)">
                {/* Top accent line with dot */}
                <path d="M 135,12 L 790,12" stroke="currentColor" strokeWidth="1" className="hud-line-accent" />
                <circle cx="790" cy="12" r="3.5" fill="currentColor" className="hud-dot-node" />
                
                {/* Outer double accent line (left & top-left corner) */}
                <path d="M 5,120 L 5,50 L 30,25 L 120,25" stroke="currentColor" strokeWidth="1" className="hud-line-accent" />
                
                {/* Main Border Box with top-left and bottom-right chamfer cuts */}
                <path d="M 45,20 L 780,20 L 780,360 L 750,390 L 20,390 L 20,45 L 45,20 Z" stroke="currentColor" strokeWidth="1" className="hud-border-main" />
              </g>
            </svg>

            {/* Top-center Gauge/Progress bar */}
            <div className="hud-gauge">
              <div className="hud-gauge-bar" />
            </div>

            <div className="kb-inner">
              <div className="kb">
                {KB_ROWS.map((row, ri) => (
                  <div className="kb-row" key={ri}>
                    {row.map((label, ci) => {
                      const isSpace = ri === 4 && label === '';
                      const isWide = WIDE_KEYS.has(label);
                      const active = isSpace ? activeKeys.includes('SPACE') : isKeyActive(label);
                      const isDim = !active && label !== '' && !isSpace;
                      return (
                        <div
                          key={`${ri}-${ci}`}
                          className={[
                            'key',
                            isWide && 'wide',
                            isSpace && 'space',
                            active && 'active',
                            isDim && 'dim',
                          ].filter(Boolean).join(' ')}
                        >
                          {isSpace ? '' : label}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo"><LogoSvg /> Mean AI</div>
            <p>Empowering the next generation of polymaths through high-fidelity AI-driven education.</p>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <a href="#">Interactive Lab</a>
            <a href="#">Live Reasoning</a>
            <a href="#">Benchmarks</a>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">API Access</a>
            <a href="#">Research</a>
          </div>
          <div className="footer-col">
            <h4>Social</h4>
            <div className="social-icons">
              <a href="#" aria-label="Website">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </a>
              <a href="#" aria-label="GitHub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Mean AI Lab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

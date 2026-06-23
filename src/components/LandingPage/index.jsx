import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LandingPage.css';

/* ── Keyboard layout data ── */
const KB_ROWS = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','=','BACKSPACE'],
  ['TAB','Q','W','E','R','T','Y','U','I','O','P','[',']','\\'],
  ['CAPS','A','S','D','F','G','H','J','K','L',';',"'",'ENTER'],
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
const PenNibIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);

export default function LandingPage({ onGetStarted }) {
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeShortcutIdx, setActiveShortcutIdx] = useState(0);
  const [activeKeys, setActiveKeys] = useState([]);
  const [fading, setFading] = useState(false);

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

  const isKeyActive = useCallback((label) => {
    if (!label) return false;
    const upper = label.toUpperCase();
    if (activeKeys.includes('SPACE') && label === '') return true;
    return activeKeys.includes(upper);
  }, [activeKeys]);

  const currentShortcut = SHORTCUTS[activeShortcutIdx];

  return (
    <div className="landing-page-root" ref={rootRef}>
      {/* Paper grain overlay */}
      <div className="paper-grain" aria-hidden="true" />

      {/* ── NAV ── */}
      <nav className={`lp-nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="logo">
          <PenNibIcon />
          Mean AI
        </div>
        <div className="nav-links">
          <a href="#">Curriculum</a>
          <a href="#">Lab Space</a>
          <a href="#">Interactive Docs</a>
          <a href="#">Pricing</a>
        </div>
        <button className="nav-cta" onClick={onGetStarted}>Enter Classroom &rarr;</button>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="ruled-lines" aria-hidden="true" />
        <div className="margin-line" aria-hidden="true" />
        <div className="coffee-stain" aria-hidden="true" />

        <div className="hero-inner">
          <span className="eyebrow">&#9998; Paper Classroom</span>
          <h1>AI-Driven<br /><span className="hand-text">Interactive Classroom</span></h1>
          <p className="hero-sub">
            Step into a notebook-inspired workspace where complex coding and mathematics come to life.
            Real-time reasoning, visual execution stacks, and autonomous AI tutors at your side.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary" onClick={onGetStarted}>
              Start Learning <span aria-hidden="true">&#9998;</span>
            </button>
            <a className="btn btn-secondary" href="#demo">Watch Demo</a>
          </div>
        </div>

        {/* AI Logo Stickers */}
        <div className="logo-stickers" aria-hidden="true">
          <div className="sticker" style={{ '--rot': '-6deg', '--x': '6%', '--y': '62%' }}><img src="/openai.png" alt="OpenAI" draggable="false" /></div>
          <div className="sticker" style={{ '--rot': '4deg', '--x': '16%', '--y': '78%' }}><img src="/deepseek-logo.png" alt="DeepSeek" draggable="false" /></div>
          <div className="sticker" style={{ '--rot': '-3deg', '--x': '74%', '--y': '58%' }}><img src="/grok.png" alt="Grok" draggable="false" /></div>
          <div className="sticker" style={{ '--rot': '7deg', '--x': '84%', '--y': '74%' }}><img src="/xai.png" alt="xAI" draggable="false" /></div>
          <div className="sticker" style={{ '--rot': '-5deg', '--x': '64%', '--y': '84%' }}><img src="/replit.png" alt="Replit" draggable="false" /></div>
          <div className="sticker" style={{ '--rot': '3deg', '--x': '44%', '--y': '88%' }}><img src="/loveble.jpg" alt="Lovable" draggable="false" /></div>
        </div>
      </section>

      {/* Fold shadow */}
      <div className="fold-shadow" aria-hidden="true" />

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

      {/* Fold shadow */}
      <div className="fold-shadow" aria-hidden="true" />

      {/* ── FEATURES ── */}
      <section className="features">
        <div className="features-head">
          <h2>Master Complexity in 3D</h2>
          <p>Our classroom isn't just a video player. It's a living, breathing computational engine.</p>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <div className="tape-strip" aria-hidden="true" />
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
            <div className="tape-strip" aria-hidden="true" />
            <div className="feature-icon icon-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Visual Memory Graph</h3>
            <p>Every concept is stored as an interactive knowledge graph. Navigate ideas visually and see how they connect.</p>
          </article>
          <article className="feature-card">
            <div className="tape-strip" aria-hidden="true" />
            <div className="feature-icon icon-signal">&Sigma;</div>
            <h3>Interactive Algebra</h3>
            <p>Manipulate 3D mathematical models. Change parameters and watch the world rebuild instantly.</p>
          </article>
          <article className="feature-card">
            <div className="tape-strip" aria-hidden="true" />
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

      {/* Fold shadow */}
      <div className="fold-shadow" aria-hidden="true" />

      {/* ── VIDEO DEMO ── */}
      <section className="demo" id="demo">
        <div className="features-head">
          <span className="eyebrow">&#9998; See It In Action</span>
          <h2>Watch Mean AI in motion.</h2>
          <p>A live walkthrough of the interactive classroom — real-time traces, tutors, and 3D models.</p>
        </div>
        <div className="demo-inner">
          <div className="tape-strip tape-tl" aria-hidden="true" />
          <div className="tape-strip tape-tr" aria-hidden="true" />
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
        <div className="features-head">
          <span className="eyebrow">&#9998; Keyboard-First Design</span>
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
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo"><PenNibIcon /> Mean AI</div>
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
          <p>&copy; {new Date().getFullYear()} Mean AI Lab. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

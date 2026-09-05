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
          mean ai
        </div>
        <div className="nav-links">
          <a href="#">Platform</a>
          <a href="/apps">Apps</a>
          <a href="#">Developers</a>
          <a href="#">Resources</a>
          <a href="#">Company</a>
        </div>
        <div className="nav-actions">
          <button className="nav-cta btn-navy" onClick={onGetStarted}>Sign up</button>
          <button className="nav-cta btn-white" onClick={() => window.location.href='#'}>Contact Us</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-gradient-glow" aria-hidden="true" />
        <div className="hero-inner">
          <span className="hero-subtitle">India's Sovereign AI Classroom</span>
          <h1>Intelligence for all<br />with Mean AI</h1>
          <p className="hero-sub">
            Built on high-fidelity visual execution. Powered by frontier-class classroom AI.<br />
            Delivering population-scale academic impact.
          </p>
          <p className="hero-creator" style={{fontSize:'0.85rem',opacity:0.6,marginTop:'0.5rem'}}>Founded by <strong>Eddala Naveen Kumar</strong></p>
          <div className="hero-ctas">
            <button className="btn btn-navy" onClick={onGetStarted}>
              Sign up
            </button>
            <a className="btn btn-white" href="#demo">Contact Us</a>
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

      {/* ── SOCIAL PROOF ── */}
      <section className="proof">
        <span className="eyebrow-plain">INDIA BUILDS WITH MEAN AI</span>
        <div className="logos">
          <span>CRED</span>
          <span>CredResolve</span>
          <span>DECENTRO</span>
          <span>IDFC FIRST Bank</span>
          <span>Infosys</span>
          <span>LIC</span>
          <span>Mahindra Finance</span>
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
            <div className="feature-icon icon-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <h3>Visual Memory Graph</h3>
            <p>Every concept is stored as an interactive knowledge graph. Navigate ideas visually and see how they connect.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon icon-signal">&Sigma;</div>
            <h3>Interactive Algebra</h3>
            <p>Manipulate 3D mathematical models. Change parameters and watch the world rebuild instantly.</p>
          </article>
          <article className="feature-card">
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
          <span className="eyebrow">✦ See It In Action</span>
          <h2>Watch Mean AI in motion.</h2>
          <p>A live walkthrough of the interactive classroom — real-time traces, tutors, and 3D models.</p>
        </div>
        <div className="demo-container">
          <div className="demo-gradient-glow" aria-hidden="true" />
          <div className="demo-inner">
            <video className="demo-video" muted autoPlay loop playsInline>
              <source src="/0617.mp4" type="video/mp4" />
            </video>
            <div className="demo-overlay" />
          </div>
        </div>
        <p className="demo-caption">
          Experience real-time reasoning, visual execution stacks, and AI tutors — all in your browser.
        </p>
      </section>

      {/* ── CTA ── */}
      <div className="cta-wrap">
        <section className="cta">
          {/* Spherical grid overlay SVG */}
          <div className="cta-grid-overlay">
            <svg width="100%" height="100%" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M400 400C400 200 600 0 800 0M400 400C400 200 200 0 0 0M400 400C400 250 550 100 700 100M400 400C400 250 250 100 100 100" stroke="rgba(255,255,255,0.16)" strokeWidth="1.8" />
              <circle cx="400" cy="400" r="100" stroke="rgba(255,255,255,0.09)" strokeWidth="1.8" />
              <circle cx="400" cy="400" r="200" stroke="rgba(255,255,255,0.09)" strokeWidth="1.8" />
              <circle cx="400" cy="400" r="300" stroke="rgba(255,255,255,0.09)" strokeWidth="1.8" />
            </svg>
          </div>
          <div className="cta-inner">
            <div className="star-sparkle-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="star-sparkle">
                <path d="M12 0L14.8 9.2L24 12L14.8 14.8L12 24L9.2 14.8L0 12L9.2 9.2L12 0Z" />
              </svg>
            </div>
            <h2>Build the Future of India's AI<br />with Mean AI</h2>
            <div className="cta-buttons">
              <button className="btn btn-glass" onClick={onGetStarted}>Sign Up</button>
            </div>
          </div>
        </section>
      </div>

      {/* ── KEYBOARD SHORTCUTS ── */}
      <section className="keyboard-section">
        <div className="features-head">
          <span className="eyebrow">⌨ Keyboard-First Design</span>
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
        <div className="footer-gradient-glow left" aria-hidden="true" />
        <div className="footer-gradient-glow right" aria-hidden="true" />
        
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo"><PenNibIcon /> mean ai</div>
            <p>AI for India starts here</p>
            <p style={{fontSize:'0.75rem',opacity:0.5,marginTop:'0.5rem'}}>Founded by Eddala Naveen Kumar</p>
            <div className="certifications">
              <div className="badge-cert">
                <span className="cert-code">ISO:27001</span>
              </div>
              <div className="badge-cert">
                <span className="cert-code">AICPA<br />SOC 2<br />TYPE 1</span>
              </div>
            </div>
          </div>
          <div className="footer-col">
            <h4>Products</h4>
            <a href="#">Mean Classroom</a>
            <a href="#">Mean Studio</a>
            <a href="#">Mean Akshar</a>
            <a href="#">Mean Arya</a>
            <a href="#">Mean Indus</a>
            <a href="#">Mean Edge</a>
            <a href="/apps">Desktop Apps</a>
          </div>
          <div className="footer-col">
            <h4>APIs</h4>
            <a href="#">Text to Speech</a>
            <a href="#">Speech to Text</a>
            <a href="#">Doc Digitisation</a>
            <a href="#">Translation</a>
            <a href="#">Dubbing</a>
            <a href="#">Models</a>
          </div>
          <div className="footer-col">
            <h4>Developers</h4>
            <a href="#">Documentation</a>
            <a href="#">API Pricing</a>
            <a href="#">Integrations</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <a href="/about">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Contact Us</a>
            <a href="/blog">Blogs</a>
            <a href="#">Trust Center</a>
            <a href="/terms">Terms of Service</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="#">EULA</a>
          </div>
          <div className="footer-col">
            <h4>Socials</h4>
            <a href="https://www.linkedin.com/in/eddala-naveen-kumar/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="#">X</a>
            <a href="#">YouTube</a>
            <a href="https://github.com/eddalanaveenkumar-ui" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="#">Discord</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <span>&copy; {new Date().getFullYear()} Mean AI Lab. All rights reserved.</span>
            <span>732, Chinmaya Mission Hospital Road, Indiranagar Stage 1, Bengaluru, Karnataka 560038</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

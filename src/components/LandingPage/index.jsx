import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

/* ── Inline SVG Icons ── */
const BrainIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
    <path d="M10 21h4M12 17v4"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const MusicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
);

const PresentIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);

const OrnamentalDivider = () => (
  <svg width="240" height="40" viewBox="0 -10 300 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '24px', opacity: 0.9 }}>
    <g fill="#0a84ff" opacity="0.8">
      {/* Left side */}
      <path d="M140,25 C130,25 120,15 128,8 C135,2 145,8 140,16 C137,20 132,20 130,17 C128,14 132,9 135,12 C139,15 135,22 130,22 C122,22 122,12 130,5 C142,-2 152,8 144,20 C140,24 135,26 128,27" />
      <path d="M128,24 Q95,20 60,16 Q95,28 134,29 Z" />
      <path d="M124,18 Q95,8 75,-2 Q105,15 128,24 Z" />
      <path d="M120,12 Q100,0 90,-8 Q110,8 124,19 Z" />
      <rect x="10" y="32" width="120" height="1.5" rx="0.75" />
      
      {/* Right side - mirrored */}
      <g transform="translate(300, 0) scale(-1, 1)">
        <path d="M140,25 C130,25 120,15 128,8 C135,2 145,8 140,16 C137,20 132,20 130,17 C128,14 132,9 135,12 C139,15 135,22 130,22 C122,22 122,12 130,5 C142,-2 152,8 144,20 C140,24 135,26 128,27" />
        <path d="M128,24 Q95,20 60,16 Q95,28 134,29 Z" />
        <path d="M124,18 Q95,8 75,-2 Q105,15 128,24 Z" />
        <path d="M120,12 Q100,0 90,-8 Q110,8 124,19 Z" />
        <rect x="10" y="32" width="120" height="1.5" rx="0.75" />
      </g>
    </g>
  </svg>
);


export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const container = document.querySelector('.landing-scroll-container');
    const handleScroll = () => setScrolled(container?.scrollTop > 50);
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  const features = [
    { icon: <BrainIcon />, title: 'AI Classroom', desc: 'Interactive roadmap-based teaching that breaks down any topic into visual, digestible blocks with execution flow.' },
    { icon: <ZapIcon />, title: 'Instant Explanations', desc: 'Paste any code and get line-by-line breakdowns with dry runs, variable tracking, and key insights.' },
    { icon: <CodeIcon />, title: 'Smart Chatbot', desc: 'A powerful conversational AI tutor that answers questions across programming, CS concepts, and more.' },
    { icon: <ShieldIcon />, title: 'Secure & Private', desc: 'Your API keys stay local, never touch our servers. JWT auth, HTTPS everywhere, enterprise-grade security.' },
    { icon: <MusicIcon />, title: 'Music Player', desc: 'Built-in ambient music player to help you focus while studying — lo-fi, classical, and nature sounds.' },
    { icon: <PresentIcon />, title: 'Presentations', desc: 'Auto-generate beautiful slide decks from any topic. Export-ready presentations powered by AI.' },
  ];


  const testimonials = [
    { text: 'Mean AI made recursion finally click for me. The execution flow is genius.', author: 'Arjun K.', role: 'CS Student', rating: 5 },
    { text: 'Way better than spending hours on YouTube. I actually understand the code now.', author: 'Priya S.', role: 'Self-taught Developer', rating: 5 },
    { text: 'The classroom feature is incredible — it feels like having a private tutor.', author: 'Ravi M.', role: 'Engineering Student', rating: 5 },
  ];

  return (
    <div className="landing-page">
      {/* Global Cursor Glow */}
      <div 
        className="cursor-glow"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`
        }}
      />

      {/* Animated Background */}
      <div className="landing-bg">
        <div className="bg-grid" />
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />
        <div className="bg-glow bg-glow-3" />
      </div>

      {/* Navbar */}
      <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => document.querySelector('.landing-scroll-container').scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.png" alt="Mean AI" className="nav-logo-img" />
            <span className="nav-logo-text">Mean <span className="accent-text">AI</span></span>
          </div>
          <div className="nav-links">
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/privacy" className="nav-link">Privacy</Link>
            <Link to="/terms" className="nav-link">Terms</Link>
            <Link to="/blog" className="nav-link">Blog</Link>
          </div>
          <div className="nav-actions">
            <button className="nav-btn-primary" onClick={onGetStarted}>
              Get Started →
            </button>
          </div>
        </div>
      </nav>

      {/* Scrollable Content */}
      <div className="landing-scroll-container">

        {/* Hero Section */}
        <section className="hero-section">
          <OrnamentalDivider />

          <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.8rem)' }}>
            The AI That Teaches<br />
            <span className="hero-title-gradient">Like a Real Teacher</span>
          </h1>

          <p className="hero-subtitle">
            Mean AI explains code line-by-line with execution flow, generates interactive classroom sessions, and acts as your personal AI tutor — all in one beautiful platform.
          </p>

          <div className="hero-cta-row">
            <button className="hero-btn-primary" onClick={onGetStarted}>
              Start Learning Free →
            </button>
            <button className="hero-btn-secondary" onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}>
              <CodeIcon /> Live Demo
            </button>
          </div>


        </section>

        {/* Demo Section */}
        <section id="demo" className="landing-section visible">
          <div className="section-header">
            <span className="section-badge">Live Demo</span>
            <h2 className="section-title">See The Magic In Action</h2>
            <p className="section-subtitle">Paste code → Get a complete teaching session with execution flow</p>
          </div>

          <div className="demo-split">
            <div className="demo-panel demo-input">
              <div className="demo-panel-header">
                <span className="demo-dot demo-dot-red" />
                <span className="demo-dot demo-dot-yellow" />
                <span className="demo-dot demo-dot-green" />
                <span className="demo-panel-title">your_code.py</span>
              </div>
              <pre className="demo-code">
                <code>
{`def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

result = fibonacci(5)
print(result)  # Output: 5`}
                </code>
              </pre>
            </div>

            <div className="demo-arrow">→</div>

            <div className="demo-panel demo-output">
              <div className="demo-panel-header">
                <span className="demo-dot demo-dot-red" />
                <span className="demo-dot demo-dot-yellow" />
                <span className="demo-dot demo-dot-green" />
                <span className="demo-panel-title">Mean AI • Explanation</span>
              </div>
              <div className="demo-explanation">
                <div className="demo-step"><span className="demo-step-num">01</span><span>Define recursive function <code>fibonacci(n)</code></span></div>
                <div className="demo-step"><span className="demo-step-num">02</span><span>Base case: if n ≤ 1, return n directly</span></div>
                <div className="demo-step"><span className="demo-step-num">03</span><span>Recursive case: sum of two previous values</span></div>
                <div className="demo-step"><span className="demo-step-num">04</span><span>Call stack: fib(5) → fib(4) + fib(3) → ...</span></div>
                <div className="demo-step demo-step-result"><span className="demo-step-num">✓</span><span>Final result: <strong>5</strong> (0, 1, 1, 2, 3, 5)</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="landing-section features-section visible">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Everything You Need to Learn Code</h2>
            <p className="section-subtitle">A complete learning ecosystem designed to make you a better programmer</p>
          </div>

          <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {features.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className="feature-icon-wrap">
                  {f.icon}
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="landing-section visible">
          <div className="section-header">
            <span className="section-badge">How It Works</span>
            <h2 className="section-title">Three Steps to Understanding</h2>
          </div>

          <div className="steps-row" style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
            {[
              { num: '01', title: 'Paste Your Code', desc: 'Drop any code snippet or type a topic you want to learn about.' },
              { num: '02', title: 'AI Teaches You', desc: 'Mean AI generates a structured, visual explanation with execution flow.' },
              { num: '03', title: 'Master It', desc: 'Follow along, ask follow-ups, and build deep understanding — not memorization.' },
            ].map((s, i) => (
              <div className="step-card" key={i} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '36px 28px', background: 'rgba(255,255,255,0.02)', flex: '1', minWidth: '260px', maxWidth: '340px', textAlign: 'center' }}>
                <span className="step-num">{s.num}</span>
                <h3 className="step-title" style={{ marginBottom: '12px' }}>{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="landing-section testimonials-section visible">
          <div className="section-header">
            <span className="section-badge">Testimonials</span>
            <h2 className="section-title">Loved by Students</h2>
          </div>

          <div className="testimonials-grid" style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {testimonials.map((t, i) => (
              <div className="testimonial-card" key={i} style={{ flex: '1', minWidth: '280px', maxWidth: '360px' }}>
                <div className="testimonial-stars">
                  {[...Array(t.rating)].map((_, j) => <StarIcon key={j} />)}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.author.charAt(0)}</div>
                  <div>
                    <div className="testimonial-name">{t.author}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="landing-section cta-section visible">
          <div className="cta-glow" />
          <div className="cta-content">
            <h2 className="cta-title">Stop Guessing. <br /><span className="accent-text">Start Understanding.</span></h2>
            <p className="section-subtitle" style={{ marginBottom: '36px' }}>Join thousands of students who are learning code the right way — with AI that actually teaches.</p>
            <button className="hero-btn-primary cta-btn" onClick={onGetStarted}>
              Get Started Free →
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-inner" style={{ flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div className="footer-brand" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/logo.png" alt="Mean AI" className="footer-logo-img" />
              <span className="footer-logo-text">Mean <span className="accent-text">AI</span></span>
            </div>
            
            {/* Legal & About Links */}
            <div className="footer-links" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/about" className="nav-link">About</Link>
              <Link to="/privacy" className="nav-link">Privacy Policy</Link>
              <Link to="/terms" className="nav-link">Terms & Conditions</Link>
              <Link to="/blog" className="nav-link">Blog</Link>
            </div>
          </div>
          <div className="footer-bottom" style={{ textAlign: 'center', marginTop: '32px' }}>
            <span>© {new Date().getFullYear()} Mean AI. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
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

const SparkleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
  </svg>
);

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);



export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
  const [visibleSections, setVisibleSections] = useState(new Set());


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
    { icon: <BrainIcon />, title: 'Learn Like a Teacher', desc: 'Get clear, structured explanations for every line of code.' },
    { icon: <ZapIcon />, title: 'Execution Flow', desc: 'See how your code runs step-by-step with real outputs.' },
    { icon: <CodeIcon />, title: 'AI Chatbot', desc: 'Ask anything — from coding to concepts — and get instant answers.' },
    { icon: <ShieldIcon />, title: 'Beginner Friendly', desc: 'Built for students who struggle with confusing explanations.' },
  ];

  const usecases = [
    { num: '01', title: 'Example 1', desc: '“I don’t understand this Python code” → Paste → Get full breakdown' },
    { num: '02', title: 'Example 2', desc: '“Explain recursion simply” → Chat → Learn instantly' }
  ];

  const testimonials = [
    { text: 'This made coding finally click for me.', rating: 5 },
    { text: 'Better than watching long tutorials.', rating: 5 },
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
            <a href="#demo" className="nav-link">Demo</a>
            <a href="#features" className="nav-link">Features</a>
            <Link to="/blog" className="nav-link">Blog</Link>
          </div>
        </div>
      </nav>

      {/* Scrollable Content */}
      <div className="landing-scroll-container">

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-badge">
            <SparkleIcon />
            <span>AI that teaches like a real teacher</span>
          </div>

          <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
            Understand Code Like a <br />
            <span className="hero-title-gradient">Real Teacher</span> — and Chat with AI
          </h1>

          <p className="hero-subtitle">
            MeanAI explains code line-by-line with execution flow, while also acting as a powerful AI chatbot for your questions.
          </p>

          <div className="hero-cta-row" style={{ marginTop: '20px', marginBottom: '80px' }}>
            <button className="hero-btn-primary" onClick={onGetStarted}>
              🚀 Try MeanAI
            </button>
            <button className="hero-btn-secondary" onClick={onGetStarted}>
              💬 Open Chat
            </button>
          </div>

        </section>

        {/* Demo Section */}
        <section id="demo" className="landing-section visible">
          <div className="section-header">
            <span className="section-badge">Demo</span>
            <h2 className="section-title">See How It Works</h2>
          </div>

          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* Left Box (Input) */}
            <div className="demo-box" style={{ background: '#111', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', flex: '1', minWidth: '300px' }}>
              <h4 style={{ color: '#888', marginBottom: '15px' }}>Input Code</h4>
              <pre style={{ color: '#4ade80', fontSize: '1rem', lineHeight: '1.6' }}>
{`for i in range(3):
    print(i)`}
              </pre>
            </div>

            {/* Right Box (Output) */}
            <div className="demo-box" style={{ background: '#111', padding: '30px', borderRadius: '16px', border: '1px solid rgba(232, 145, 58, 0.3)', flex: '1', minWidth: '300px' }}>
              <h4 style={{ color: '#f0ad5e', marginBottom: '15px' }}>MeanAI Output</h4>
              <div style={{ color: '#fff', fontSize: '1rem', lineHeight: '1.8' }}>
                <p>Step 1: Start loop from i = 0</p>
                <p>Step 2: Print 0</p>
                <p>Step 3: Repeat until i = 2</p>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '30px', color: '#aaa', fontStyle: 'italic', fontSize: '1.1rem' }}>
            Not just answers — real understanding.
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="landing-section features-section visible">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Features</h2>
          </div>

          <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {features.map((f, i) => (
              <div className="feature-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon-wrap">
                  {f.icon}
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section id="use-cases" className="landing-section steps-section visible">
          <div className="section-header">
            <span className="section-badge">Use Cases</span>
            <h2 className="section-title">Use Cases</h2>
          </div>

          <div className="steps-row" style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            {usecases.map((s, i) => (
              <div className="step-card" key={i} style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', background: 'rgba(255,255,255,0.02)', maxWidth: '300px' }}>
                <span className="step-num" style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{s.title}</span>
                <p className="step-desc" style={{ fontSize: '1.05rem', color: '#ddd' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="landing-section testimonials-section visible">
          <div className="section-header">
            <span className="section-badge">Social Proof</span>
          </div>

          <div className="testimonials-grid" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            {testimonials.map((t, i) => (
              <div className="testimonial-card" key={i} style={{ maxWidth: '350px' }}>
                <div className="testimonial-stars">
                  {[...Array(t.rating)].map((_, j) => <StarIcon key={j} />)}
                </div>
                <p className="testimonial-text" style={{ fontSize: '1.1rem', color: '#fff' }}>"{t.text}"</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="landing-section cta-section visible">
          <div className="cta-glow" />
          <div className="cta-content">
            <h2 className="cta-title">Stop Guessing. <br /><span className="accent-text">Start Understanding.</span></h2>
            <button className="hero-btn-primary cta-btn" onClick={onGetStarted} style={{ marginTop: '30px' }}>
              👉 Start Learning Now
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

import React, { useState, useEffect, useRef } from 'react';
import './LandingPage.css';

/* ── Inline SVG Icons ── */
const LeafLogo = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 10C50 10 20 30 20 60C20 75 33 90 50 90C50 90 50 70 50 50C50 70 50 90 50 90C67 90 80 75 80 60C80 30 50 10 50 10Z" fill="url(#leafGrad)" />
    <path d="M50 90C50 90 50 50 50 30" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
    <defs>
      <linearGradient id="leafGrad" x1="20" y1="10" x2="80" y2="90">
        <stop offset="0%" stopColor="#f0ad5e" />
        <stop offset="100%" stopColor="#e8913a" />
      </linearGradient>
    </defs>
  </svg>
);

const SparkleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
  </svg>
);

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

const ShieldIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);

const MicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const PresentationIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const ArrowRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);


export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const [visibleSections, setVisibleSections] = useState(new Set());

  useEffect(() => {
    const container = document.querySelector('.landing-scroll-container');
    const handleScroll = () => setScrolled(container.scrollTop > 50);
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.landing-section').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 30,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 30,
    });
  };

  const features = [
    { icon: <BrainIcon />, title: 'Deep Reasoning', desc: 'Advanced AI models that think step-by-step through complex problems with human-like reasoning capabilities.' },
    { icon: <ZapIcon />, title: 'Lightning Fast', desc: 'Real-time streaming responses with sub-second latency. No waiting, no buffering — just instant intelligence.' },
    { icon: <CodeIcon />, title: 'Code Generation', desc: 'Write, debug, and explain code in 50+ programming languages with context-aware completions.' },
    { icon: <MicIcon />, title: 'Voice Interaction', desc: 'Speak naturally and get spoken responses. Have hands-free conversations with your AI assistant.' },
    { icon: <PresentationIcon />, title: 'Presentation Builder', desc: 'Generate beautiful slide decks from a simple prompt. Export to PowerPoint in seconds.' },
    { icon: <ShieldIcon />, title: 'Private & Secure', desc: 'Your data stays yours. End-to-end encryption with zero data retention. Built with privacy first.' },
  ];

  const steps = [
    { num: '01', title: 'Create an Account', desc: 'Sign up in seconds with Google or email. No credit card required.' },
    { num: '02', title: 'Connect Your API', desc: 'Link your OpenRouter API key to unlock access to the world\'s best AI models.' },
    { num: '03', title: 'Start Creating', desc: 'Ask anything, generate code, build presentations, or just have a conversation.' },
  ];

  const testimonials = [
    { name: 'Sarah Chen', role: 'Product Designer', text: 'Mean AI has completely transformed my workflow. The presentation builder alone saves me hours every week.', rating: 5 },
    { name: 'Alex Rodriguez', role: 'Software Engineer', text: 'The code generation is insanely good. It understands context and writes production-ready code.', rating: 5 },
    { name: 'Priya Sharma', role: 'Research Analyst', text: 'I use Mean AI for deep research synthesis. It connects dots I would have missed. Truly intelligent.', rating: 5 },
  ];

  return (
    <div className="landing-page">
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
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#testimonials" className="nav-link">Reviews</a>
          </div>
          <div className="nav-actions">
            <button className="nav-btn-ghost" onClick={onGetStarted}>Log in</button>
            <button className="nav-btn-primary" onClick={onGetStarted}>
              Get Started Free <ArrowRight />
            </button>
          </div>
        </div>
      </nav>

      {/* Scrollable Content */}
      <div className="landing-scroll-container">

        {/* Hero Section */}
        <section className="hero-section" ref={heroRef} onMouseMove={handleMouseMove}>
          <div className="hero-badge">
            <SparkleIcon />
            <span>Powered by the world's best AI models</span>
          </div>

          <h1 className="hero-title">
            Think bigger.<br />
            <span className="hero-title-gradient">Build faster.</span>
          </h1>

          <p className="hero-subtitle">
            Mean AI is your intelligent assistant that helps you brainstorm ideas,
            write code, generate presentations, and solve complex problems — all in one place.
          </p>

          <div className="hero-cta-row">
            <button className="hero-btn-primary" onClick={onGetStarted}>
              Start for Free <ArrowRight />
            </button>
            <button className="hero-btn-secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              See Features
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">AI Models</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Users</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
          </div>

          {/* Animated Orb */}
          <div className="hero-orb-container">
            <div
              className="hero-orb"
              style={{
                transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
              }}
            >
              <div className="orb-inner" />
              <div className="orb-ring orb-ring-1" />
              <div className="orb-ring orb-ring-2" />
              <div className="orb-ring orb-ring-3" />
              <div className="orb-particle orb-particle-1" />
              <div className="orb-particle orb-particle-2" />
              <div className="orb-particle orb-particle-3" />
              <div className="orb-particle orb-particle-4" />
              <div className="orb-particle orb-particle-5" />
              <div className="orb-particle orb-particle-6" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={`landing-section features-section ${visibleSections.has('features') ? 'visible' : ''}`}>
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Everything you need,<br /><span className="accent-text">nothing you don't.</span></h2>
            <p className="section-subtitle">Powerful tools designed to amplify your thinking and accelerate your workflow.</p>
          </div>

          <div className="features-grid">
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

        {/* How It Works */}
        <section id="how-it-works" className={`landing-section steps-section ${visibleSections.has('how-it-works') ? 'visible' : ''}`}>
          <div className="section-header">
            <span className="section-badge">How it works</span>
            <h2 className="section-title">Up and running<br /><span className="accent-text">in 60 seconds.</span></h2>
          </div>

          <div className="steps-row">
            {steps.map((s, i) => (
              <div className="step-card" key={i} style={{ animationDelay: `${i * 0.15}s` }}>
                <span className="step-num">{s.num}</span>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
                {i < steps.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className={`landing-section testimonials-section ${visibleSections.has('testimonials') ? 'visible' : ''}`}>
          <div className="section-header">
            <span className="section-badge">Testimonials</span>
            <h2 className="section-title">Loved by people<br /><span className="accent-text">who think for a living.</span></h2>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div className="testimonial-card" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                <div className="testimonial-stars">
                  {[...Array(t.rating)].map((_, j) => <StarIcon key={j} />)}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className={`landing-section cta-section ${visibleSections.has('testimonials') ? 'visible' : ''}`}>
          <div className="cta-glow" />
          <div className="cta-content">
            <h2 className="cta-title">Ready to think<br /><span className="accent-text">without limits?</span></h2>
            <p className="cta-subtitle">Join thousands of creators, developers, and researchers who use Mean AI every day.</p>
            <button className="hero-btn-primary cta-btn" onClick={onGetStarted}>
              Get Started Free <ArrowRight />
            </button>
            <div className="cta-points">
              <span className="cta-point"><CheckIcon /> No credit card required</span>
              <span className="cta-point"><CheckIcon /> Free to start</span>
              <span className="cta-point"><CheckIcon /> Cancel anytime</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <img src="/logo.png" alt="Mean AI" className="footer-logo-img" />
              <span className="footer-logo-text">Mean <span className="accent-text">AI</span></span>
              <p className="footer-tagline">Intelligence, amplified.</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#how-it-works">How it works</a>
                <a href="#testimonials">Reviews</a>
              </div>
              <div className="footer-col">
                <h4>Legal</h4>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </div>
              <div className="footer-col">
                <h4>Connect</h4>
                <a href="#">Twitter</a>
                <a href="#">GitHub</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Mean AI. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

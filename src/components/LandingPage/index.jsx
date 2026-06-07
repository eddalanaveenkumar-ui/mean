import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Monitor, 
  Sigma, 
  Layers, 
  Braces, 
  Lock, 
  Globe, 
  GraduationCap,
  Play
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });

  // Handle scroll to add backdrop blur to navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track cursor for hover spotlight effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="landing-page-container">
      {/* Global Background glow mapping */}
      <div 
        className="radial-glow-cursor" 
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`
        }}
      />
      <div className="ambient-grid-overlay" />
      <div className="blur-orb blur-orb-teal" />
      <div className="blur-orb blur-orb-purple" />

      {/* Navigation Bar */}
      <nav className={`landing-nav-bar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-content-wrap">
          <div className="nav-left-brand">
            <div className="logo-atom-icon">
              <span className="logo-dot-center" />
            </div>
            <span className="brand-logo-text">Mean AI</span>
          </div>

          <div className="nav-center-menu">
            <a href="#curriculum" className="menu-link-item">Curriculum</a>
            <a href="#labspace" className="menu-link-item">Lab Space</a>
            <a href="#docs" className="menu-link-item">Interactive Docs</a>
            <a href="#pricing" className="menu-link-item">Pricing</a>
          </div>

          <div className="nav-right-actions">
            <button className="btn-enter-classroom" onClick={onGetStarted}>
              Enter Classroom
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-viewport-section">
        <div className="hero-content-inner">
          <div className="badge-wrapper-pill">
            <span className="live-status-dot" />
            <span className="badge-text-lbl">NEXT-GEN LEARNING ENVIRONMENT</span>
          </div>

          <h1 className="hero-main-heading">
            AI-Driven <span className="gradient-text-cyan">Interactive</span><br />
            <span className="gradient-text-purple">Classroom</span>
          </h1>

          <p className="hero-subtext-desc">
            Step into a 3D-inspired workspace where complex coding and mathematics come to life. 
            Real-time reasoning, visual execution stacks, and autonomous AI tutors at your side.
          </p>

          <div className="hero-action-buttons">
            <button className="btn-primary-start" onClick={onGetStarted}>
              Start Learning <GraduationCap size={16} />
            </button>
            <button className="btn-secondary-demo">
              Watch Demo
            </button>
          </div>

          {/* Interactive 3D Graphic Canvas area */}
          <div className="hero-graphic-visual-wrapper">
            <div className="3d-scene-container-box">
              <img 
                src="/hero-3d.png" 
                alt="3D Interactive Neural Network & UI Mockup" 
                className="hero-3d-scene-img" 
                onError={(e) => {
                  // Fallback if the image doesn't exist
                  e.target.style.display = 'none';
                  e.target.parentNode.classList.add('fallback-graphic-active');
                }}
              />
              
              {/* Fallback geometric figures if image is loading or missing */}
              <div className="fallback-3d-elements">
                <div className="fallback-cube animate-sway" />
                <div className="fallback-sphere animate-float" />
                <div className="fallback-torus animate-spin-slow" />
              </div>

              {/* Floating Card Left: VARIABLES SCOPE */}
              <div className="floating-ux-card left-vars-card">
                <div className="card-header-row">
                  <Braces size={12} className="card-header-icon" />
                  <span className="card-header-title">VARIABLES SCOPE</span>
                </div>
                <div className="card-body-rows">
                  <div className="var-item-row">
                    <span className="var-item-lbl">root_node</span>
                    <span className="var-item-val font-mono">0x7F22A</span>
                  </div>
                  <div className="var-item-row">
                    <span className="var-item-lbl">depth</span>
                    <span className="var-item-val font-mono">4</span>
                  </div>
                  <div className="var-item-row">
                    <span className="var-item-lbl">visited</span>
                    <span className="var-item-val font-mono">[ ... ]</span>
                  </div>
                  <div className="var-item-row">
                    <span className="var-item-lbl">status</span>
                    <span className="var-item-val val-green-glowing font-mono">solving</span>
                  </div>
                </div>
              </div>

              {/* Floating Card Right: EXECUTION STACK */}
              <div className="floating-ux-card right-stack-card">
                <div className="card-header-row">
                  <Layers size={12} className="card-header-icon" />
                  <span className="card-header-title">EXECUTION STACK</span>
                </div>
                <div className="card-body-stack">
                  <div className="stack-capsule active-capsule font-mono">
                    calculate_recursion(n-1)
                  </div>
                  <div className="stack-capsule font-mono">
                    optimize_subproblem(id: 42)
                  </div>
                  <div className="stack-capsule font-mono dimmed">
                    main_executor()
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Elite Institutions Section */}
      <section className="institutions-marquee-section">
        <span className="marquee-top-badge">UTILIZED BY ELITE INSTITUTIONS</span>
        <div className="logos-row-grid">
          <div className="brand-logo-item">NEXUS LABS</div>
          <div className="brand-logo-item">SYNTHOS ACADEMY</div>
          <div className="brand-logo-item">QUANTUM EDU</div>
          <div className="brand-logo-item">VECTOR MATH</div>
        </div>
      </section>

      {/* Features Bento Section */}
      <section className="features-bento-section" id="curriculum">
        <div className="section-title-wrap">
          <h2 className="section-heading-text">Master Complexity in 3D</h2>
          <p className="section-subheading-text">
            Our classroom isn't just a video player. It's a living, breathing computational engine.
          </p>
        </div>

        <div className="features-grid-cards">
          {/* Card 1 */}
          <div className="feature-card-item">
            <div className="card-icon-circle-wrap bg-cyan-glow">
              <Monitor size={20} className="feature-lucide-icon text-cyan" />
            </div>
            <h3 className="card-title-lbl">Live Trace Reasoning</h3>
            <p className="card-desc-txt">
              Watch the AI explain its logic through real-time code execution and visual data structures.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-card-item">
            <div className="card-icon-circle-wrap bg-teal-glow">
              <Sigma size={20} className="feature-lucide-icon text-teal" />
            </div>
            <h3 className="card-title-lbl">Interactive Algebra</h3>
            <p className="card-desc-txt">
              Manipulate 3D mathematical models. Change parameters and watch the world rebuild instantly.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-card-item">
            <div className="card-icon-circle-wrap bg-purple-glow">
              <Sparkles size={20} className="feature-lucide-icon text-purple" />
            </div>
            <h3 className="card-title-lbl">Autonomous Tutors</h3>
            <p className="card-desc-txt">
              Dedicated AI agents that learn your pace and adapt the curriculum to your cognitive style.
            </p>
          </div>
        </div>
      </section>

      {/* Evolve Invitation Section */}
      <section className="evolve-invite-section">
        <div className="glass-invite-card-container">
          <div className="invite-glow-backing" />
          <div className="invite-card-content">
            <h2 className="invite-main-title">Ready to evolve your intelligence?</h2>
            <p className="invite-subtext-desc">
              Join the waitlist for the most immersive learning environment ever created. 
              Limited spots for the Early Access cohort.
            </p>
            <div className="invite-action-buttons">
              <button className="btn-invite-request" onClick={onGetStarted}>
                Request Invite
              </button>
              <button className="btn-curriculum-view">
                View Curriculum
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-premium-footer">
        <div className="footer-top-columns">
          <div className="footer-brand-column">
            <div className="nav-left-brand">
              <div className="logo-atom-icon">
                <span className="logo-dot-center" />
              </div>
              <span className="brand-logo-text">Mean AI</span>
            </div>
            <p className="footer-brand-desc">
              Empowering the next generation of polymaths through high-fidelity AI-driven education.
            </p>
            <span className="footer-copyright-lbl">
              © 2024 Mean AI Lab. All rights reserved.
            </span>
          </div>

          <div className="footer-links-grid-cols">
            <div className="footer-nav-col">
              <span className="footer-col-header">PLATFORM</span>
              <a href="#lab" className="footer-col-link">Interactive Lab</a>
              <a href="#reasoning" className="footer-col-link">Live Reasoning</a>
              <a href="#benchmarks" className="footer-col-link">Benchmarks</a>
            </div>

            <div className="footer-nav-col">
              <span className="footer-col-header">RESOURCES</span>
              <a href="#docs" className="footer-col-link">Documentation</a>
              <a href="#api" className="footer-col-link">API Access</a>
              <a href="#research" className="footer-col-link">Research</a>
            </div>

            <div className="footer-nav-col">
              <span className="footer-col-header">SOCIAL</span>
              <div className="social-icons-row">
                <a href="#social-web" className="social-icon-btn">
                  <Globe size={16} />
                </a>
                <a href="#social-console" className="social-icon-btn">
                  <Layers size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

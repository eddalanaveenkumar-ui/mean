import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './StaticPages.css';

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About | Mean AI — Eddala Naveen Kumar, Founder';
    const meta = document.querySelector('meta[name="description"]');
    const original = meta?.content;
    if (meta) {
      meta.content = 'About Eddala Naveen Kumar — Founder of Mean AI, an AI-powered education platform. Vision, skills, and professional background.';
    }

    // Force dark mode on the About page
    const wasLight = document.body.classList.contains('light-theme');
    if (wasLight) {
      document.body.classList.remove('light-theme');
    }

    return () => {
      document.title = 'Mean AI — AI-Powered Education Platform';
      if (meta && original) meta.content = original;
      // Restore light theme if it was active before
      if (wasLight) {
        document.body.classList.add('light-theme');
      }
    };
  }, []);

  return (
    <div className="sp-page">
      <div className="sp-bg">
        <div className="sp-glow sp-glow-1" />
        <div className="sp-glow sp-glow-2" />
      </div>

      <header>
        <nav className="sp-nav">
          <Link to="/" className="sp-nav-brand">
            <img src="/logo-2.png" alt="Mean AI" className="sp-nav-logo sp-logo-light" />
            <img src="/logo-1.png" alt="Mean AI" className="sp-nav-logo sp-logo-dark" />
            <span>Mean <span className="sp-accent">A\</span></span>
          </Link>
          <div className="sp-nav-links">
            <Link to="/blog" className="sp-nav-link">Blog</Link>
            <Link to="/" className="sp-nav-link sp-nav-cta">← Back to Home</Link>
          </div>
        </nav>
      </header>

      <main className="sp-content" style={{ textAlign: 'center' }}>
        <section className="sp-section" style={{ marginTop: '2rem' }}>
          <img 
            src="/eddala-naveen-kumar-ai-full-stack-developer.jpg" 
            alt="Eddala Naveen Kumar - Founder of Mean AI" 
            width="200" 
            height="200" 
            style={{ borderRadius: '50%', objectFit: 'cover', marginBottom: '1.5rem' }} 
          />
          <h1 className="sp-title" style={{ marginBottom: '0.5rem' }}>Eddala Naveen Kumar</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--sp-text-secondary)', marginBottom: '2rem' }}>
            Founder & CEO of Mean AI
          </p>
        </section>

        <section className="sp-section">
          <div className="sp-card" style={{ textAlign: 'left', marginBottom: '3rem' }}>
            <p>I'm Eddala Naveen Kumar, the Founder & CEO of Mean AI — an AI-powered education platform that helps students learn through interactive, AI-driven classroom experiences. My vision is to make quality education accessible to everyone through the power of artificial intelligence. Mean AI features real-time code execution, autonomous AI tutors, and intelligent classrooms that adapt to every learner.</p>
          </div>
        </section>

        <section className="sp-section">
          <div className="sp-card-grid" style={{ textAlign: 'left' }}>
            <div className="sp-card">
              <div className="sp-card-icon">💻</div>
              <h3>Full Stack Development</h3>
              <p>React, Node.js, Python, JavaScript, Firebase, Vite</p>
            </div>

            <div className="sp-card">
              <div className="sp-card-icon">🤖</div>
              <h3>AI & Machine Learning</h3>
              <p>LLMs, Generative AI, NLP, Computer Vision</p>
            </div>

            <div className="sp-card">
              <div className="sp-card-icon">🚀</div>
              <h3>Featured Project — Mean AI</h3>
              <p>An AI-powered education platform with interactive classrooms, real-time code execution, and autonomous AI tutors. <a href="https://www.meanai.site/" className="sp-link" target="_blank" rel="noopener noreferrer">Visit Mean AI</a></p>
            </div>

            <div className="sp-card">
              <div className="sp-card-icon">📚</div>
              <h3>Open Source</h3>
              <p>Contributing to AI-powered education tools. <a href="https://github.com/eddalanaveenkumar-ui" className="sp-link" target="_blank" rel="noopener noreferrer">GitHub Profile</a></p>
            </div>
          </div>
        </section>

        <section className="sp-section" style={{ marginTop: '4rem', marginBottom: '2rem' }}>
          <h2>Connect with me</h2>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
            <a href="https://www.linkedin.com/in/eddala-naveen-kumar/" className="sp-link" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <span>•</span>
            <a href="https://github.com/eddalanaveenkumar-ui" className="sp-link" target="_blank" rel="noopener noreferrer">GitHub</a>
            <span>•</span>
            <a href="https://www.meanai.site/" className="sp-link" target="_blank" rel="noopener noreferrer">Mean AI</a>
            <span>•</span>
            <a href="mailto:support@meanai.site" className="sp-link">Email</a>
          </div>
        </section>
      </main>

      <footer className="sp-footer">
        <div className="sp-footer-links">
          <Link to="/about">About</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/apps">Apps</Link>
        </div>
        <p>© {new Date().getFullYear()} Mean AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

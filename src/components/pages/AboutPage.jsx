import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './StaticPages.css';

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About Eddala Naveen Kumar | AI & Full Stack Developer';
    const meta = document.querySelector('meta[name="description"]');
    const original = meta?.content;
    if (meta) {
      meta.content = 'About Eddala Naveen Kumar — AI & Full Stack Developer, creator of Mean AI. Skills, projects, and professional background.';
    }
    return () => {
      document.title = 'Eddala Naveen Kumar | AI & Full Stack Developer | Creator of Mean AI';
      if (meta && original) meta.content = original;
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
            <img src="/logo.png" alt="Mean AI" className="sp-nav-logo" />
            <span>Mean <span className="sp-accent">AI</span></span>
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
            alt="Eddala Naveen Kumar - AI & Full Stack Developer" 
            width="200" 
            height="200" 
            style={{ borderRadius: '50%', objectFit: 'cover', marginBottom: '1.5rem' }} 
          />
          <h1 className="sp-title" style={{ marginBottom: '0.5rem' }}>Eddala Naveen Kumar</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--sp-text-secondary)', marginBottom: '2rem' }}>
            AI & Full Stack Developer
          </p>
        </section>

        <section className="sp-section">
          <div className="sp-card" style={{ textAlign: 'left', marginBottom: '3rem' }}>
            <p>I'm Eddala Naveen Kumar, an AI & Full Stack Developer passionate about building intelligent applications that make a real impact. I created Mean AI, an AI-powered education platform that helps students learn through interactive, AI-driven classroom experiences. My work spans across React, Node.js, Python, Machine Learning, and Generative AI, with a focus on creating tools that make technology accessible to everyone.</p>
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
        </div>
        <p>© {new Date().getFullYear()} Mean AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

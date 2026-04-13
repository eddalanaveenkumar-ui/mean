import React from 'react';
import { Link } from 'react-router-dom';
import './StaticPages.css';

export default function AboutPage() {
  return (
    <div className="sp-page">
      <div className="sp-bg">
        <div className="sp-glow sp-glow-1" />
        <div className="sp-glow sp-glow-2" />
      </div>

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

      <main className="sp-content">
        <div className="sp-hero-badge">About Us</div>
        <h1 className="sp-title">Built for Learners,<br /><span className="sp-accent">by Learners.</span></h1>

        <div className="sp-card-grid">
          <div className="sp-card">
            <div className="sp-card-icon">🎯</div>
            <h3>Our Mission</h3>
            <p>Mean AI is an advanced educational ecosystem that bridges the gap between structured learning and dynamic artificial intelligence. We help individuals stop guessing and start understanding through personalized, interactive learning experiences.</p>
          </div>

          <div className="sp-card">
            <div className="sp-card-icon">🧠</div>
            <h3>What We Do</h3>
            <p>Designed to feel like a real teacher, our platform breaks down complex concepts — specifically in computer science and programming — line by line, with execution flows and interactive AI sessions.</p>
          </div>

          <div className="sp-card">
            <div className="sp-card-icon">🔬</div>
            <h3>Our Technology</h3>
            <p>We leverage leading AI models from Google Gemini and OpenRouter to deliver fast, context-aware, and deeply insightful educational responses — not just answers, but genuine understanding.</p>
          </div>

          <div className="sp-card">
            <div className="sp-card-icon">🌍</div>
            <h3>Our Vision</h3>
            <p>A future where every student, regardless of background, has access to a patient, intelligent tutor that adapts to their pace and learning style. Education should be personal, not generic.</p>
          </div>
        </div>

        <section className="sp-section">
          <h2>The Team</h2>
          <p>Mean AI is built by a passionate team of developers and educators who believe that the best way to learn code is to have it explained like a real teacher would — with patience, clarity, and depth. We are relentless in our pursuit of making technical education fundamentally better.</p>
        </section>

        <section className="sp-section">
          <h2>Contact Us</h2>
          <p>Have questions, feedback, or partnership inquiries? Reach out to us at <a href="mailto:support@meanai.site" className="sp-link">support@meanai.site</a>. We'd love to hear from you.</p>
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

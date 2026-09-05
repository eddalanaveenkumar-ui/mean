import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './StaticPages.css';

export default function AppsPage() {
  useEffect(() => {
    document.title = 'Apps & Downloads | Mean AI';
    const meta = document.querySelector('meta[name="description"]');
    const original = meta?.content;
    if (meta) {
      meta.content = 'Download Mean AI desktop and mobile applications for a better, seamless AI education experience.';
    }

    // Force dark mode on the Apps page
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
            <img src="/logo.png" alt="Mean AI" className="sp-nav-logo" />
            <span>Mean <span className="sp-accent">AI</span></span>
          </Link>
          <div className="sp-nav-links">
            <Link to="/about" className="sp-nav-link">About</Link>
            <Link to="/blog" className="sp-nav-link">Blog</Link>
            <Link to="/" className="sp-nav-link sp-nav-cta">← Back to Home</Link>
          </div>
        </nav>
      </header>

      <main className="sp-content" style={{ textAlign: 'center', minHeight: '60vh' }}>
        <section className="sp-section" style={{ marginTop: '2rem' }}>
          <h1 className="sp-title" style={{ marginBottom: '0.5rem' }}>Mean AI Apps</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--sp-text-secondary)', marginBottom: '3rem' }}>
            Download our official applications for a seamless, powerful AI learning experience.
          </p>
        </section>

        <section className="sp-section">
          <div className="sp-card-grid" style={{ textAlign: 'left', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="sp-card" style={{ maxWidth: '400px', width: '100%' }}>
              <div className="sp-card-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖥️</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Mean AI for Windows</h3>
              <p style={{ color: 'var(--sp-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Experience the full power of Mean AI directly from your desktop. Enjoy faster performance, dedicated workspaces, and an uninterrupted learning environment.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <a 
                  href="/apps/MeanAI Setup 1.0.0.exe" 
                  className="sp-nav-cta" 
                  style={{ display: 'inline-block', textDecoration: 'none', padding: '0.75rem 1.5rem' }}
                  download
                >
                  Download for Windows (.exe)
                </a>
                <span style={{ fontSize: '0.875rem', color: 'var(--sp-text-secondary)' }}>Version 1.0.0</span>
              </div>
            </div>

            {/* Placeholder for future apps, e.g. Mac, Mobile */}
            <div className="sp-card" style={{ maxWidth: '400px', width: '100%', opacity: 0.6 }}>
              <div className="sp-card-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Mean AI for Mobile</h3>
              <p style={{ color: 'var(--sp-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Learn on the go with our upcoming mobile applications for Android and iOS. Stay tuned for the release!
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                  className="sp-nav-cta" 
                  style={{ display: 'inline-block', textDecoration: 'none', padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid var(--sp-border)', color: 'var(--sp-text-secondary)', cursor: 'not-allowed' }}
                  disabled
                >
                  Coming Soon
                </button>
              </div>
            </div>
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

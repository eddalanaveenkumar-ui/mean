import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AppsPage.css';

export default function AppsPage() {
  useEffect(() => {
    document.title = 'Apps & Downloads | Mean AI';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.content = 'Download Mean AI desktop and mobile applications for a better, seamless AI education experience.';
    }
  }, []);

  return (
    <div className="apps-page-container">
      <nav className="apps-nav">
        <Link to="/" className="apps-nav-brand">
          <img src="/logo-2.png" alt="Mean AI" className="apps-logo-light" onError={(e) => { e.currentTarget.src = '/logo-light.png'; }} />
          <img src="/logo-1.png" alt="Mean AI" className="apps-logo-dark" onError={(e) => { e.currentTarget.src = '/logo.png'; }} />
          <span>Mean AI</span>
        </Link>
        <div className="apps-nav-links">
          <Link to="/about" className="apps-nav-link">About</Link>
          <Link to="/blog" className="apps-nav-link">Blog</Link>
          <Link to="/" className="apps-nav-link" style={{ color: '#3b82f6' }}>Dashboard</Link>
        </div>
      </nav>

      <main className="apps-main">
        <h1 className="apps-title">Mean AI Apps</h1>
        <p className="apps-subtitle">
          Download our official applications for a seamless, powerful AI learning experience.
        </p>

        <div className="apps-grid">
          <div className="apps-card">
            <div className="apps-card-icon">
              <i className="fas fa-desktop" />
            </div>
            <h3>Mean AI for Windows</h3>
            <p>
              Experience the full power of Mean AI directly from your desktop. Enjoy faster performance, dedicated workspaces, and an uninterrupted learning environment for interview prep.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <a 
                href="/apps/MeanAI Setup 1.0.0.exe" 
                className="apps-download-btn"
                download
              >
                <i className="fas fa-download" />
                Download for Windows
              </a>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>v1.0.0</span>
            </div>
          </div>

          <div className="apps-card" style={{ opacity: 0.7 }}>
            <div className="apps-card-icon" style={{ background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.2), rgba(107, 114, 128, 0.2))', color: '#9ca3af' }}>
              <i className="fas fa-mobile-alt" />
            </div>
            <h3>Mean AI for Mobile</h3>
            <p>
              Learn on the go with our upcoming mobile applications for Android and iOS. Stay tuned for the release!
            </p>
            <div style={{ marginTop: 'auto' }}>
              <button className="apps-download-btn disabled" disabled>
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="apps-footer">
        <div className="apps-footer-links">
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

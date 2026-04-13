import React from 'react';
import { Link } from 'react-router-dom';
import './StaticPages.css';

export default function PrivacyPage() {
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
        <div className="sp-hero-badge">Legal</div>
        <h1 className="sp-title">Privacy <span className="sp-accent">Policy</span></h1>
        <p className="sp-subtitle">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <section className="sp-section">
          <h2>1. Introduction</h2>
          <p>Welcome to Mean AI ("we," "our," or "us"). We are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
        </section>

        <section className="sp-section">
          <h2>2. Information We Collect</h2>
          <h3>2.1 Personal Information</h3>
          <p>When you create an account, we may collect your name, email address, and profile picture through Google OAuth. We do not store your Google password.</p>
          <h3>2.2 Usage Data</h3>
          <p>We automatically collect information about how you interact with our services, including chat messages, classroom sessions, and feature usage patterns. This data is used solely to improve the user experience.</p>
          <h3>2.3 API Keys</h3>
          <p>If you provide API keys (OpenRouter, Google Gemini), these are stored locally on your device and are never transmitted to our servers. We never have access to your API keys.</p>
        </section>

        <section className="sp-section">
          <h2>3. How We Use Your Information</h2>
          <ul className="sp-list">
            <li>To provide, maintain, and improve our AI-powered educational services</li>
            <li>To personalize your learning experience and save your classroom progress</li>
            <li>To communicate with you about updates, security alerts, and support</li>
            <li>To analyze usage patterns to improve our product (anonymized analytics via Vercel)</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section className="sp-section">
          <h2>4. Data Sharing & Third Parties</h2>
          <p>We do not sell your personal information. We may share data with the following third-party service providers:</p>
          <ul className="sp-list">
            <li><strong>Firebase (Google):</strong> Authentication and data storage</li>
            <li><strong>OpenRouter:</strong> AI model inference (only when you provide your own key)</li>
            <li><strong>Google Gemini:</strong> AI model inference (only when you provide your own key)</li>
            <li><strong>Vercel:</strong> Hosting, analytics, and performance monitoring</li>
          </ul>
        </section>

        <section className="sp-section">
          <h2>5. Data Security</h2>
          <p>We implement industry-standard security measures including HTTPS encryption, JWT authentication, and secure backend APIs hosted on Render. However, no method of transmission over the Internet is 100% secure.</p>
        </section>

        <section className="sp-section">
          <h2>6. Data Retention</h2>
          <p>Your data is retained as long as your account is active. You may request deletion of your data at any time by contacting us at <a href="mailto:support@meanai.site" className="sp-link">support@meanai.site</a>.</p>
        </section>

        <section className="sp-section">
          <h2>7. Cookies & Local Storage</h2>
          <p>We use browser local storage to persist your session, preferences (theme, API keys), and chat history. We do not use tracking cookies. Vercel Analytics uses privacy-friendly, cookie-less analytics.</p>
        </section>

        <section className="sp-section">
          <h2>8. Children's Privacy</h2>
          <p>Mean AI is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.</p>
        </section>

        <section className="sp-section">
          <h2>9. Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information at any time. You may also opt out of analytics collection by using browser privacy settings.</p>
        </section>

        <section className="sp-section">
          <h2>10. Contact</h2>
          <p>For any privacy concerns, reach out to us at <a href="mailto:support@meanai.site" className="sp-link">support@meanai.site</a>.</p>
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

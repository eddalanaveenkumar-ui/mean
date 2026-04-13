import React from 'react';
import { Link } from 'react-router-dom';
import './StaticPages.css';

export default function TermsPage() {
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
        <h1 className="sp-title">Terms & <span className="sp-accent">Conditions</span></h1>
        <p className="sp-subtitle">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <section className="sp-section">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Mean AI ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not use the Service.</p>
        </section>

        <section className="sp-section">
          <h2>2. Description of Service</h2>
          <p>Mean AI is an AI-powered educational platform that provides code explanations, interactive classroom sessions, AI chatbot functionality, and learning tools. The service is provided "as is" and "as available."</p>
        </section>

        <section className="sp-section">
          <h2>3. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and API keys. You agree to notify us immediately of any unauthorized use of your account. You must be at least 13 years old to create an account.</p>
        </section>

        <section className="sp-section">
          <h2>4. Acceptable Use</h2>
          <p>You agree to use Mean AI only for lawful and educational purposes. You must not:</p>
          <ul className="sp-list">
            <li>Use the Service to generate harmful, illegal, or misleading content</li>
            <li>Attempt to reverse-engineer, disassemble, or exploit the Service</li>
            <li>Share your account access with unauthorized parties</li>
            <li>Use automated systems to excessively access the Service</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section className="sp-section">
          <h2>5. Intellectual Property</h2>
          <p>All content, design, branding, and technology comprising Mean AI are the intellectual property of Mean AI and its licensors. You may not reproduce, distribute, or create derivative works without explicit written permission.</p>
        </section>

        <section className="sp-section">
          <h2>6. API Key Usage</h2>
          <p>Mean AI allows you to use your own API keys for AI model access. You are solely responsible for managing your API key usage, billing, and compliance with the respective API provider's terms.</p>
        </section>

        <section className="sp-section">
          <h2>7. Token & Premium System</h2>
          <p>Mean AI offers a token-based system for free users and premium subscription plans. Tokens earned through ads expire after 24 hours. Premium subscriptions are billed according to the chosen plan and are non-refundable once the billing period begins.</p>
        </section>

        <section className="sp-section">
          <h2>8. Limitation of Liability</h2>
          <p>Mean AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. Our total liability shall not exceed the amount paid by you in the past 12 months.</p>
        </section>

        <section className="sp-section">
          <h2>9. Service Availability</h2>
          <p>We strive to maintain uninterrupted service but do not guarantee 100% uptime. The Service may be modified, suspended, or discontinued at any time without prior notice. We will make reasonable efforts to notify users of significant changes.</p>
        </section>

        <section className="sp-section">
          <h2>10. Termination</h2>
          <p>We reserve the right to terminate or suspend your access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users or the Service.</p>
        </section>

        <section className="sp-section">
          <h2>11. Changes to Terms</h2>
          <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms. We encourage you to review these Terms periodically.</p>
        </section>

        <section className="sp-section">
          <h2>12. Contact</h2>
          <p>For questions about these Terms, contact us at <a href="mailto:support@meanai.site" className="sp-link">support@meanai.site</a>.</p>
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

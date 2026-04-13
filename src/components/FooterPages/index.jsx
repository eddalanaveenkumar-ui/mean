import React from 'react';
import './FooterPages.css';

export default function FooterPages({ page, onClose }) {
  if (!page) return null;

  return (
    <div className="footer-page-overlay" onClick={onClose}>
      <div className="footer-page-modal" onClick={e => e.stopPropagation()}>
        <button className="fp-close-btn" onClick={onClose}>&times;</button>
        <div className="fp-content">
          {page === 'about' && (
            <>
              <h2>About Mean AI</h2>
              <p>Mean AI is an advanced educational ecosystem that bridges the gap between structured learning and dynamic artificial intelligence. Designed to feel like a real teacher, our platform breaks down complex concepts, specifically in computer science and programming, line by line.</p>
              <p>Our mission is to help individuals stop guessing and start understanding through personalized, interactive execution flows.</p>
            </>
          )}

          {page === 'privacy' && (
            <>
              <h2>Privacy Policy</h2>
              <p>Your privacy is important to us. This policy outlines how Mean AI collects, uses, and protects your information.</p>
              <h3>1. Data Collection</h3>
              <p>We only collect data necessary to provide and improve our services, including interaction logs and account metadata via secure authentication providers like Google.</p>
              <h3>2. Data Usage</h3>
              <p>Your chat interactions and generated sessions are securely stored to provide you with continuous, persistent learning experiences. We do not sell your personal data.</p>
              <h3>3. Third-party Services</h3>
              <p>Mean AI utilizes robust third-party APIs such as OpenRouter to process AI prompts, which may be governed by their own usage policies.</p>
            </>
          )}

          {page === 'terms' && (
            <>
              <h2>Terms & Conditions</h2>
              <p>By using Mean AI, you agree to these terms. Please read them carefully.</p>
              <h3>1. Usage Terms</h3>
              <p>You agree to use Mean AI only for educational and lawful purposes.</p>
              <h3>2. Account Responsibility</h3>
              <p>You are responsible for safeguarding your account access and any API keys you connect to our service.</p>
              <h3>3. Service Availability</h3>
              <p>Mean AI aims to provide uninterrupted service, but does not guarantee 100% uptime. Services may be modified or discontinued without notice.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

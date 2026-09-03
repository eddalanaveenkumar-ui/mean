import React from 'react';
import './DesktopAppModal.css';

export default function DesktopAppModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="desktop-app-overlay" onClick={onClose}>
      <div className="desktop-app-modal" onClick={e => e.stopPropagation()}>
        <header className="da-header">
          <div className="da-header-title">
            <i className="fas fa-desktop" style={{ color: '#3b82f6' }} />
            <h2>MeanAI Desktop App</h2>
          </div>
          <button className="da-close-btn" onClick={onClose}>&times;</button>
        </header>

        <div className="da-content">
          <p className="da-description">
            The MeanAI Desktop App is mainly used for cracking interviews. It provides a seamless experience for interview preparation and execution through manual text input and STT (Speech-to-Text) capabilities powered by OpenRouter and inbuilt models.
          </p>
          
          <div className="da-models-section">
            <h3>Supported LLMs</h3>
            <ul className="da-models-list">
              <li><i className="fas fa-check-circle" /> poolside/laguna-s-2.1:free</li>
              <li><i className="fas fa-check-circle" /> nvidia/nemotron-3-ultra-550b-a55b:free</li>
              <li><i className="fas fa-check-circle" /> nvidia/nemotron-3.5-lightning:free</li>
              <li><i className="fas fa-check-circle" /> poolside/laguna-xs-2.1:free</li>
              <li><i className="fas fa-check-circle" /> nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free</li>
              <li><i className="fas fa-check-circle" /> liquid/lfm-2.5-2.6b:free</li>
            </ul>
          </div>

          <div className="da-actions">
            <a href="/apps/MeanAI Setup 1.0.0.exe" download className="da-download-btn">
              <i className="fas fa-download" />
              Download MeanAI Setup 1.0.0.exe
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

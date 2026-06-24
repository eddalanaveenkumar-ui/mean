import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import './ApiKeyPromptModal.css';

export default function ApiKeyPromptModal() {
  const { showApiKeyPrompt, setShowApiKeyPrompt, login, user, logout } = useApp();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [linking, setLinking] = useState(false);

  if (!showApiKeyPrompt) return null;

  const handleSubmit = async () => {
    if (!apiKeyInput.trim()) {
      alert('Please enter a manual API key or connect to OpenRouter.');
      return;
    }

    setLinking(true);
    try {
      const key = apiKeyInput.trim();
      if (user?.jwt) {
        try {
          const response = await fetch('https://mean-backend-nine.vercel.app/update-api-key', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.jwt}`
            },
            body: JSON.stringify({ api_key: key })
          });
          if (!response.ok) {
            console.warn('Backend API key save failed, proceeding locally.');
          }
        } catch (e) {
          console.warn('Backend unavailable, proceeding locally.');
        }
      }

      // Update user in context and localStorage
      login({ ...user, apiKey: key });
      setShowApiKeyPrompt(false);
      setApiKeyInput('');
    } finally {
      setLinking(false);
    }
  };

  const handleConnectOpenRouter = () => {
    // Save current user info to sessionStorage, so redirect flow can restore it
    if (user) {
      sessionStorage.setItem('mean_temp_user', JSON.stringify(user));
    }
    // Logout to ensure login component handles redirect
    logout();
    window.location.href = `https://openrouter.ai/auth?callback_url=${window.location.origin}`;
  };

  return (
    <div className="apikey-prompt-overlay" onClick={() => setShowApiKeyPrompt(false)}>
      <div className="apikey-prompt-modal" onClick={e => e.stopPropagation()}>
        <button className="apikey-prompt-close" onClick={() => setShowApiKeyPrompt(false)} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="apikey-prompt-glow" aria-hidden="true" />

        <div className="apikey-prompt-header">
          <div className="apikey-prompt-icon-wrap">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>
          </div>
          <h2>API Key Required</h2>
          <p>
            To use AI features (chatting, voice chat, presentations, and roadmaps), please connect your OpenRouter account or enter an API key.
          </p>
        </div>

        <div className="apikey-prompt-body">
          <button 
            type="button" 
            className="apikey-prompt-or-btn" 
            onClick={handleConnectOpenRouter}
          >
            Connect with OpenRouter
          </button>

          <div className="apikey-prompt-divider">
            <span className="apikey-prompt-line"></span>
            <span className="apikey-prompt-divider-text">OR</span>
            <span className="apikey-prompt-line"></span>
          </div>

          <div className="apikey-prompt-input-wrap">
            <input
              type="password"
              className="apikey-prompt-input"
              placeholder="Manual API Key (sk-or-v1-...)"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button 
            type="button" 
            className="apikey-prompt-save-btn" 
            onClick={handleSubmit}
            disabled={linking}
          >
            {linking ? 'Linking Key...' : 'Link & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

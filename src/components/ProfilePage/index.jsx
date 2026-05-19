import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, apiKey, setApiKey, logout, setShowProfile, login, theme, setTheme } = useApp();
  const [editApiKey, setEditApiKey] = useState(apiKey);
  
  const [meanAiKeys, setMeanAiKeys] = useState(() => {
    const saved = localStorage.getItem('meanai_cli_keys');
    return saved ? JSON.parse(saved) : [];
  });

  const generateMeanAiKey = () => {
    const keyName = prompt("Enter a name for this API Key (e.g. My Macbook):");
    if (!keyName) return;

    const newKeyObj = {
      id: Date.now().toString(),
      name: keyName.trim(),
      key: 'sk-meanai-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toLocaleDateString()
    };
    
    const updated = [newKeyObj, ...meanAiKeys];
    setMeanAiKeys(updated);
    localStorage.setItem('meanai_cli_keys', JSON.stringify(updated));
  };

  const deleteMeanAiKey = (id) => {
    if (window.confirm("Are you sure you want to delete this key? Any CLI using it will be disconnected.")) {
      const updated = meanAiKeys.filter(k => k.id !== id);
      setMeanAiKeys(updated);
      localStorage.setItem('meanai_cli_keys', JSON.stringify(updated));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('API Key copied to clipboard!');
  };

  const handleSave = () => {
    if (editApiKey.trim() && editApiKey !== apiKey) {
      const updated = { ...user, apiKey: editApiKey.trim() };
      login(updated);
    }
    setShowProfile(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <button className="profile-back-btn" onClick={() => setShowProfile(false)}>
            <i className="fas fa-chevron-left" />
            <span>Settings</span>
          </button>
        </header>

        <div className="profile-main">
          {/* Avatar / Account Section */}
          <div className="ios-section">
            <h4 className="ios-section-title">ACCOUNT</h4>
            <div className="ios-group">
              <div className="ios-row profile-row">
                <div className="profile-card-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="profile-card-info">
                  <h3>{user?.name || 'User'}</h3>
                  <p>ID: {user?.id || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="ios-section">
            <h4 className="ios-section-title">APPEARANCE</h4>
            <div className="ios-group">
              <div className="ios-row theme-row">
                <button
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <i className="fas fa-sun" />
                  <span>Light</span>
                </button>
                <button
                  className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                >
                  <i className="fas fa-desktop" />
                  <span>System</span>
                </button>
                <button
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <i className="fas fa-moon" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="ios-section">
            <h4 className="ios-section-title">API CONFIGURATION</h4>
            <div className="ios-group">
              <div className="ios-row field-row">
                <label>API Key</label>
                <input
                  type="password"
                  value={editApiKey}
                  onChange={e => setEditApiKey(e.target.value)}
                  placeholder="sk-or-... or AIzaSy..."
                  className="ios-input"
                />
              </div>
            </div>
            <p className="ios-section-footer">Your OpenRouter or Google Gemini API key used for text generation.</p>
          </div>

          {/* MeanAI CLI API Keys Section */}
          <div className="ios-section">
            <h4 className="ios-section-title">MEANAI CODER CLI KEYS</h4>
            <div className="ios-group">
              <div className="ios-row" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '16px' }}>
                {meanAiKeys.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px', textAlign: 'center' }}>
                    No keys generated yet.
                  </p>
                )}
                {meanAiKeys.map(kObj => (
                  <div key={kObj.id} className="api-key-display">
                    <div className="api-key-info">
                      <span className="api-key-name">{kObj.name}</span>
                      <span className="api-key-date">Created: {kObj.createdAt}</span>
                    </div>
                    <span className="api-key-text">{typeof kObj === 'string' ? kObj : kObj.key}</span>
                    <div className="api-key-actions">
                      <button className="copy-btn" onClick={() => copyToClipboard(typeof kObj === 'string' ? kObj : kObj.key)} title="Copy API Key">
                        <i className="fas fa-copy" />
                      </button>
                      <button className="delete-btn" onClick={() => deleteMeanAiKey(kObj.id)} title="Delete API Key">
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </div>
                ))}
                <button className="generate-key-btn" onClick={generateMeanAiKey}>
                  <i className="fas fa-plus" style={{ marginRight: '8px' }} />
                  Generate New CLI Key
                </button>
              </div>
            </div>
            <p className="ios-section-footer">Use these keys to authenticate your local MeanAI Coder terminal application.</p>
          </div>

          {/* Actions */}
          <div className="ios-section actions-section">
            <button className="save-btn" onClick={handleSave}>
              Save Changes
            </button>
            <button className="logout-btn" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

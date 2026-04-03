import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, apiKey, setApiKey, logout, setShowProfile, theme, setTheme, login } = useApp();
  const [editApiKey, setEditApiKey] = useState(apiKey);

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
            <i className="fas fa-arrow-left" />
            <span>Back to Chat</span>
          </button>
          <h2 className="profile-page-title">Settings</h2>
        </header>

        <div className="profile-card">
          <div className="profile-card-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="profile-card-info">
            <h3>{user?.name || 'User'}</h3>
            <p>ID: {user?.id || '—'}</p>
          </div>
        </div>

        <div className="settings-section">
          <h4 className="settings-label">API Configuration</h4>
          <div className="settings-field">
            <label>OpenRouter API Key</label>
            <input
              type="password"
              value={editApiKey}
              onChange={e => setEditApiKey(e.target.value)}
              placeholder="sk-or-..."
            />
          </div>
        </div>

        <div className="settings-section">
          <h4 className="settings-label">Appearance</h4>
          <div className="theme-toggle-row">
            <span>Theme</span>
            <div className="theme-switch-group">
              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <i className="fas fa-moon" /> Dark
              </button>
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <i className="fas fa-sun" /> Light
              </button>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="save-btn" onClick={handleSave}>
            <i className="fas fa-check" /> Save Changes
          </button>
          <button className="logout-btn" onClick={logout}>
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}

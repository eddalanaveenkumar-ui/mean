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

          {/* Appearance Section */}
          <div className="ios-section">
            <h4 className="ios-section-title">APPEARANCE</h4>
            <div className="ios-group">
              <div className="ios-row theme-row">
                <span>Theme</span>
                <div className="theme-switch-group">
                  <button
                    className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                    onClick={() => setTheme('system')}
                  >
                    <i className="fas fa-desktop" /> System
                  </button>
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

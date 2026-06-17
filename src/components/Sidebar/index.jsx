import React from 'react';
import { useApp } from '../../context/AppContext';
import './Sidebar.css';

const SidebarToggleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="3" x2="9" y2="21"/>
  </svg>
);

export default function Sidebar({ onTeacher, onPpt, onMusic, onTokenBank, onPremiumPlans, onMeanClassroom, onFreebuffAgent, onOptics }) {
  const {
    chats, currentChatId, sidebarOpen, setSidebarOpen,
    sidebarCollapsed, setSidebarCollapsed,
    newChat, deleteChat, loadChat,
    setShowProfile, user,
    webSearchActive, setWebSearchActive,
  } = useApp();

  const filteredChats = chats.filter(c => c.messages && c.messages.length > 0);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const week = new Date(today); week.setDate(week.getDate() - 7);

  const getGroup = (chat) => {
    const d = new Date(parseInt(chat.id));
    if (isNaN(d.getTime())) return 'older';
    if (d >= today) return 'today';
    if (d >= yesterday) return 'yesterday';
    if (d >= week) return 'week';
    return 'older';
  };

  const groups = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'This Week' },
    { key: 'older', label: 'Older' },
  ];

  // ===== COLLAPSED ICON STRIP =====
  if (sidebarCollapsed && !sidebarOpen) {
    return (
      <aside className="sidebar-collapsed">
        <button className="sc-icon" onClick={() => setSidebarCollapsed(false)} title="Open sidebar">
          <SidebarToggleIcon />
        </button>
        <button className="sc-icon" onClick={newChat} title="New chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </button>
        <div className="sc-divider" />
        <button className="sc-icon" onClick={() => { onTeacher?.(); }} title="AI Classroom">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </button>
        <button className="sc-icon" onClick={() => { onPpt?.(); }} title="Presentation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="3"/>
            <path d="M9 22V2M2 12h20"/>
          </svg>
        </button>
        <button className="sc-icon" onClick={() => { onOptics?.(); }} title="AI Video Editor">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </button>
        <div className="sc-divider" />
        <button className={`sc-icon ${webSearchActive ? 'active' : ''}`} onClick={() => setWebSearchActive(!webSearchActive)} title="Live Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </button>
        <div className="sc-spacer" />
        <button className="sc-icon" onClick={() => setShowProfile(true)} title="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
        <button className="sc-avatar" onClick={() => setShowProfile(true)} title={user?.name || 'Profile'} style={{ padding: user?.photoURL ? 0 : undefined, overflow: 'hidden' }}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            user?.name?.charAt(0)?.toUpperCase() || 'U'
          )}
        </button>
      </aside>
    );
  }

  // ===== EXPANDED SIDEBAR =====
  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand header */}
        <header className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sb-brand-name">Mean <span className="sb-brand-ai">AI</span></span>
            <span className="sb-brand-sub">Workspace</span>
          </div>
          <button className="sidebar-toggle-btn desktop-only" onClick={() => { setSidebarCollapsed(true); setSidebarOpen(false); }} title="Collapse sidebar">
            <SidebarToggleIcon />
          </button>
        </header>

        {/* New Chat button */}
        <button className="sb-new-chat" onClick={newChat}>
          <i className="fas fa-pen-to-square" />
          <span>New Chat</span>
        </button>

        {/* Navigation section */}
        <nav className="sb-nav">
          <button className="sb-nav-item" onClick={() => { onTeacher?.(); setSidebarOpen(false); }}>
            <i className="fas fa-graduation-cap" />
            <span>AI Classroom</span>
          </button>
          <button className={`sb-nav-item ${webSearchActive ? 'active' : ''}`} onClick={() => setWebSearchActive(!webSearchActive)}>
            <i className="fas fa-search" />
            <span>Research</span>
            {webSearchActive && <span className="sb-nav-badge">ON</span>}
          </button>
          <button className="sb-nav-item" onClick={() => { onPpt?.(); setSidebarOpen(false); }}>
            <i className="fas fa-file-powerpoint" />
            <span>Presentations</span>
          </button>
          <button className="sb-nav-item" onClick={() => { onOptics?.(); setSidebarOpen(false); }}>
            <i className="fas fa-video" />
            <span>AI Video Editor</span>
          </button>
          <button className="sb-nav-item" onClick={() => { setShowProfile(true); setSidebarOpen(false); }}>
            <i className="fas fa-gear" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Chat History Header */}
        <div className="chat-history-header">
          <i className="fas fa-clock-rotate-left" />
          <span>Recent Conversations</span>
        </div>

        {/* Chat history list */}
        <div className="chat-list">
          {groups.map(({ key, label }) => {
            const group = filteredChats.filter(c => getGroup(c) === key);
            if (group.length === 0) return null;
            return (
              <div key={key}>
                <div className="chat-group-label">{label}</div>
                {group.map(chat => (
                  <div
                    key={chat.id}
                    className={`chat-item ${chat.id === currentChatId ? 'active' : ''}`}
                    onClick={() => { loadChat(chat.id); setSidebarOpen(false); }}
                  >
                    <span className="chat-item-title">{chat.title}</span>
                    <button
                      className="chat-delete-btn"
                      onClick={e => { e.stopPropagation(); deleteChat(chat.id); }}
                    >
                      <i className="fas fa-trash-alt" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer — Anchored User profile card */}
        <div className="sidebar-footer">
          <div className="sidebar-profile-card" onClick={() => setShowProfile(true)}>
            <div className="sb-profile-avatar" style={{ padding: user?.photoURL ? 0 : undefined, overflow: 'hidden' }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className="sb-profile-info">
              <span className="sb-profile-name">{user?.name || 'Eddala'}</span>
              <span className="sb-profile-tier">AI Student</span>
            </div>
            <i className="fas fa-ellipsis sb-profile-more" />
          </div>
        </div>
      </aside>
    </>
  );
}

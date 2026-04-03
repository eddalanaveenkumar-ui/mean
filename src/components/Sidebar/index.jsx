import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import './Sidebar.css';

// Inline SVG icons for collapsed mode
const NewChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const ClassroomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);
const SidebarToggleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="3" x2="9" y2="21"/>
  </svg>
);

export default function Sidebar({ onTeacher, onPpt, onMusic }) {
  const {
    chats, currentChatId, sidebarOpen, setSidebarOpen,
    sidebarCollapsed, setSidebarCollapsed,
    newChat, deleteChat, loadChat,
    setShowProfile, user
  } = useApp();
  const [search, setSearch] = useState('');

  const filteredChats = chats.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

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
          <NewChatIcon />
        </button>
        <div className="sc-divider" />
        <button className="sc-icon" onClick={() => { onTeacher?.(); }} title="AI Classroom">
          <ClassroomIcon />
        </button>
        <button className="sc-icon" onClick={() => { onPpt?.(); }} title="Presentation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="3"/>
            <path d="M9 22V2M2 12h20"/>
          </svg>
        </button>
        <button className="sc-icon" onClick={() => { onMusic?.(); }} title="Music">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        </button>
        <div className="sc-spacer" />
        <button className="sc-avatar" onClick={() => setShowProfile(true)} title={user?.name || 'Profile'}>
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </button>
      </aside>
    );
  }

  // ===== EXPANDED SIDEBAR =====
  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Header — logo + toggle */}
        <header className="sidebar-header">
          <img src="/logo.svg" alt="Mean AI" className="sidebar-logo" />
          <button className="sidebar-toggle-btn" onClick={() => { setSidebarCollapsed(true); setSidebarOpen(false); }} title="Collapse sidebar">
            <SidebarToggleIcon />
          </button>
        </header>

        <button className="new-chat-pill" onClick={newChat}>
          <i className="fas fa-plus" />
          <span>New chat</span>
        </button>

        <div className="sidebar-search">
          <i className="fas fa-search search-icon" />
          <input
            placeholder="Search chats..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* TOOLS section */}
        <div className="sidebar-tools">
          <div className="tools-label">Tools</div>
          <button className="tool-item" onClick={() => { onTeacher?.(); setSidebarOpen(false); }}>
            <i className="fas fa-chalkboard-teacher" />
            <span>AI Classroom</span>
          </button>
          <button className="tool-item" onClick={() => { onPpt?.(); setSidebarOpen(false); }}>
            <i className="fas fa-file-powerpoint" />
            <span>Presentation</span>
          </button>
          <button className="tool-item" onClick={() => { onMusic?.(); setSidebarOpen(false); }}>
            <i className="fas fa-music" />
            <span>Music Player</span>
          </button>
        </div>

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
                    onClick={() => loadChat(chat.id)}
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

        <div className="sidebar-footer">
          <button className="profile-btn" onClick={() => { setShowProfile(true); setSidebarOpen(false); }}>
            <div className="profile-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="profile-info">
              <span className="profile-name-text">{user?.name || 'User'}</span>
            </div>
            <i className="fas fa-ellipsis-h profile-dots" />
          </button>
        </div>
      </aside>
    </>
  );
}

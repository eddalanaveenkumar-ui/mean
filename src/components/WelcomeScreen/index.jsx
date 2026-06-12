import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { extractFileContent } from '../../utils/fileExtractor';
import './WelcomeScreen.css';

const SUGGESTION_PILLS = [
  '💻 Help me debug code',
  '📄 Summarize a PDF',
  '📊 Create a presentation',
  '🧠 Teach me Python',
  '🚀 Build a website',
];

export default function WelcomeScreen({ onVoice, onPpt, onTeacher, onMusic }) {
  const {
    user, sendMessage, isStreaming,
    deepdiveActive, setDeepdiveActive,
    webSearchActive, setWebSearchActive,
    chats, loadChat
  } = useApp();

  const [text, setText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedContent, setAttachedContent] = useState('');
  const [extractStatus, setExtractStatus] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const fileRef = useRef(null);

  const handleSend = () => {
    if (!text.trim() && !attachedFile) return;
    const isImg = attachedFile?.type?.startsWith('image/');
    const imgUrl = isImg ? URL.createObjectURL(attachedFile) : null;
    sendMessage(text, attachedContent || null, attachedFile?.name || null, imgUrl);
    setText('');
    setAttachedFile(null);
    setAttachedContent('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    setIsExtracting(true);
    
    const content = await extractFileContent(file, setExtractStatus);
    setAttachedContent(content);
    setIsExtracting(false);
    setTimeout(() => setExtractStatus(''), 2000);
    e.target.value = '';
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        handleFileChange({ target: { files: [file] } });
        e.preventDefault();
        break;
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    // Strip leading emoji and spaces from suggestion
    const cleanPrompt = suggestion.replace(/^([^\w\s\d]+)\s*/u, '').trim();
    setText(cleanPrompt);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const hasInput = text.trim().length > 0 || attachedFile;
  const firstName = user?.name?.split(' ')[0] || 'there';
  const filteredChats = chats.filter(c => c.messages && c.messages.length > 0);

  return (
    <div className="welcome-block">
      {/* ===== Scrollable Content ===== */}
      <div className="welcome-scroll">
        {/* Greeting */}
        <h1 className="welcome-greeting">
          <span className="greeting-line">
            {getGreeting()}, <span className="greeting-name">{firstName}</span> 👋
          </span>
        </h1>
        <p className="welcome-subtitle">
          How can Mean AI help today?
        </p>
        <p className="welcome-personality">
          Your AI tutor, researcher and creator.
        </p>

        {/* Cards Grid — Symmetrical 33% columns */}
        <div className="welcome-cards-grid">
          {/* Card 1 — Learn */}
          <div className="wc-side-card" onClick={() => onTeacher?.()}>
            <div className="wc-side-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
              <i className="fas fa-graduation-cap" />
            </div>
            <div className="wc-side-title">Learn</div>
            <div className="wc-side-desc">Interactive AI Classroom sessions.</div>
          </div>

          {/* Card 2 — Research */}
          <div className={`wc-side-card ${webSearchActive ? 'active' : ''}`} onClick={() => setWebSearchActive(!webSearchActive)}>
            <div className="wc-side-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <i className="fas fa-search" />
            </div>
            <div className="wc-side-title">Research</div>
            <div className="wc-side-desc">Instant, fact-checked answers from the web.</div>
            {webSearchActive && (
              <div className="wc-search-status">
                <i className="fas fa-check-circle" /> Web search ON
              </div>
            )}
          </div>

          {/* Card 3 — Create */}
          <div className="wc-side-card" onClick={() => onPpt?.()}>
            <div className="wc-side-icon" style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899' }}>
              <i className="fas fa-file-powerpoint" />
            </div>
            <div className="wc-side-title">Create</div>
            <div className="wc-side-desc">Structure narratives and generate presentations.</div>
          </div>
        </div>

        {/* Recent Chats Section */}
        {filteredChats && filteredChats.length > 0 && (
          <div className="recent-chats-wrap">
            <h4 className="recent-chats-title">Recent Chats</h4>
            <div className="recent-chats-list">
              {filteredChats.slice(0, 3).map(chat => (
                <button key={chat.id} className="recent-chat-btn" onClick={() => loadChat(chat.id)}>
                  <i className="far fa-comment-dots" />
                  <span className="recent-chat-title">{chat.title || 'Untitled Chat'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== Suggestion Pills ===== */}
      <div className="welcome-suggestions">
        <div className="suggestions-track">
          {SUGGESTION_PILLS.map((pill, i) => (
            <button key={`orig-${i}`} className="ws-pill" onClick={() => handleSuggestionClick(pill)}>
              {pill}
            </button>
          ))}
          {SUGGESTION_PILLS.map((pill, i) => (
            <button key={`dup-${i}`} className="ws-pill" onClick={() => handleSuggestionClick(pill)}>
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Bottom Input Container ===== */}
      <div className="welcome-input-container">
        {attachedFile && (
          <div className="w-attach-bar" style={attachedFile.type?.startsWith('image/') ? { padding: '12px', background: 'transparent', border: 'none' } : {}}>
            {attachedFile.type?.startsWith('image/') ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={URL.createObjectURL(attachedFile)} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'block' }} alt="preview" />
                <button onClick={() => { setAttachedFile(null); setAttachedContent(''); }} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', background: '#374151', color: 'white', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', padding: 0 }}>
                  <i className="fas fa-times" />
                </button>
              </div>
            ) : (
              <>
                <i className="fas fa-file-alt" />
                <span>{attachedFile.name}</span>
                <button onClick={() => { setAttachedFile(null); setAttachedContent(''); }}><i className="fas fa-times" /></button>
              </>
            )}
          </div>
        )}

        <div className="premium-input-box">
          <textarea
            className="w-textarea-input"
            placeholder={isExtracting ? extractStatus || "Extracting file..." : "Ask Mean AI anything..."}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isStreaming || isExtracting}
            rows={1}
            autoFocus
          />

          <div className="w-input-toolbar">
            <div className="w-toolbar-left">
              <button className="w-tool-btn" onClick={() => fileRef.current?.click()} title="Upload file">
                <i className="fas fa-paperclip" />
              </button>
              <button className={`w-tool-btn ${webSearchActive ? 'active' : ''}`} onClick={() => setWebSearchActive(!webSearchActive)} title="Toggle Web Search">
                <i className="fas fa-globe" />
              </button>
              <button className={`w-tool-btn ${deepdiveActive ? 'active' : ''}`} onClick={() => setDeepdiveActive(!deepdiveActive)} title="Toggle Deepdive">
                <i className="fas fa-microscope" />
              </button>
            </div>
            <div className="w-toolbar-right">
              <button className="w-tool-btn" onClick={onVoice} title="Voice Input">
                <i className="fas fa-microphone" />
              </button>
              <button className={`w-premium-send-btn ${hasInput ? 'has-input' : ''}`} onClick={handleSend} disabled={!hasInput}>
                <i className="fas fa-arrow-up" />
              </button>
            </div>
          </div>
        </div>

        {extractStatus && isExtracting && (
           <div style={{ position: 'absolute', bottom: '100%', left: '16px', marginBottom: '8px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <span className="tc-loading-spinner" style={{ width: '12px', height: '12px', margin: 0 }}></span>
              {extractStatus}
           </div>
        )}

        <input type="file" ref={fileRef} accept="image/*,.txt,.md,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>
    </div>
  );
}

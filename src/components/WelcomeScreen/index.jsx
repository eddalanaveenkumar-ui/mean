import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import './WelcomeScreen.css';

export default function WelcomeScreen({ onVoice, onPpt, onTeacher, onMusic }) {
  const { sendMessage, isStreaming, deepdiveActive, setDeepdiveActive, webSearchActive, setWebSearchActive } = useApp();
  const [text, setText] = useState('');
  const [showTools, setShowTools] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedContent, setAttachedContent] = useState('');
  const fileRef = useRef(null);

  const handleSend = () => {
    if (!text.trim() && !attachedFile) return;
    sendMessage(text, attachedContent || null, attachedFile?.name || null);
    setText('');
    setAttachedFile(null);
    setAttachedContent('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    const textExts = ['.txt','.md','.json','.csv','.py','.js','.html','.css','.java','.xml','.yaml','.yml'];
    const isText = file.type.includes('text') || textExts.some(ext => file.name.toLowerCase().endsWith(ext));
    setAttachedContent(isText ? await file.text() : `[File: ${file.name}]`);
    e.target.value = '';
  };

  const hasInput = text.trim().length > 0 || attachedFile;

  return (
    <div className="welcome-block">
      {/* Heading */}
      <h1 className="welcome-heading">What are you working on?</h1>

      {/* Centered Input Bar */}
      <div className="welcome-input-wrap">
        {attachedFile && (
          <div className="w-attach-bar">
            <i className="fas fa-file-alt" />
            <span>{attachedFile.name}</span>
            <button onClick={() => { setAttachedFile(null); setAttachedContent(''); }}><i className="fas fa-times" /></button>
          </div>
        )}
        <div className="welcome-input-row">
          <button className="w-plus-btn" onClick={() => setShowTools(!showTools)}>
            <i className={`fas ${showTools ? 'fa-times' : 'fa-plus'}`} />
          </button>

          <input
            type="text"
            className="w-input"
            placeholder="Ask anything"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            autoFocus
          />

          <div className="w-right-btns">
            {hasInput ? (
              <button className="w-send-btn" onClick={handleSend}>
                <i className="fas fa-arrow-up" />
              </button>
            ) : (
              <>
                <button className="w-mic-btn" onClick={onVoice}><i className="fas fa-microphone" /></button>
                <button className="w-voice-btn" onClick={onVoice}>
                  <div className="w-wave-bars"><span /><span /><span /><span /></div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tools dropdown */}
        {showTools && (
          <div className="w-tools-dropdown">
            <button onClick={() => { fileRef.current?.click(); setShowTools(false); }}>
              <i className="fas fa-paperclip" /> Attach file
            </button>
            <button onClick={() => { onPpt?.(); setShowTools(false); }}>
              <i className="fas fa-file-powerpoint" /> Create presentation
            </button>
            <button onClick={() => { onTeacher?.(); setShowTools(false); }}>
              <i className="fas fa-chalkboard-teacher" /> AI Classroom
            </button>
            <button onClick={() => { onMusic?.(); setShowTools(false); }}>
              <i className="fas fa-music" /> Music player
            </button>
            <div className="w-tools-divider" />
            <button className={deepdiveActive ? 'active' : ''} onClick={() => setDeepdiveActive(!deepdiveActive)}>
              <i className="fas fa-microscope" /> Deepdive {deepdiveActive && '✓'}
            </button>
            <button className={webSearchActive ? 'active' : ''} onClick={() => setWebSearchActive(!webSearchActive)}>
              <i className="fas fa-globe" /> Web search {webSearchActive && '✓'}
            </button>
          </div>
        )}
        <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* Action pills with real icons */}
      <div className="welcome-pills">
        <button className="w-pill" onClick={() => setText('Create an image')}>
          <svg className="w-pill-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8913a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span className="w-pill-text">Create image</span>
        </button>
        <button className="w-pill" onClick={() => setText('Help me write')}>
          <svg className="w-pill-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8913a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
          <span className="w-pill-text">Write or edit</span>
        </button>
        <button className="w-pill" onClick={() => setText('Look up ')}>
          <svg className="w-pill-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e8913a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
          <span className="w-pill-text">Look something up</span>
        </button>
      </div>
    </div>
  );
}

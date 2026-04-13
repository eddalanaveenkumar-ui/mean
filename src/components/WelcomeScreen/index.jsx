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
      <h1 className="welcome-heading">Paste your code or ask a question.</h1>

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

      {/* Action cards */}
      <div className="welcome-pills" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="w-pill" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '15px', height: 'auto', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', minWidth: '180px' }} onClick={() => { onTeacher?.(); }}>
          <div style={{ fontWeight: 'bold', color: '#0A84FF', marginBottom: '8px', fontSize: '1rem' }}>📚 Teach a Topic</div>
          <div style={{ color: '#aaa', fontSize: '0.85rem', textAlign: 'left', whiteSpace: 'normal', lineHeight: '1.4' }}>Get a full classroom session on any topic.</div>
        </button>
        <button className="w-pill" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '15px', height: 'auto', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', minWidth: '180px' }} onClick={() => { onPpt?.(); }}>
          <div style={{ fontWeight: 'bold', color: '#0A84FF', marginBottom: '8px', fontSize: '1rem' }}>📊 Create PPTs</div>
          <div style={{ color: '#aaa', fontSize: '0.85rem', textAlign: 'left', whiteSpace: 'normal', lineHeight: '1.4' }}>Auto-generate presentations from any topic.</div>
        </button>
        <button className="w-pill" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '15px', height: 'auto', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', minWidth: '180px' }} onClick={() => { setWebSearchActive(!webSearchActive); }}>
          <div style={{ fontWeight: 'bold', color: '#0A84FF', marginBottom: '8px', fontSize: '1rem' }}>🔍 Live Google Search</div>
          <div style={{ color: '#aaa', fontSize: '0.85rem', textAlign: 'left', whiteSpace: 'normal', lineHeight: '1.4' }}>{webSearchActive ? 'Web search is ON ✓' : 'Search the web in real-time with AI.'}</div>
        </button>
      </div>
    </div>
  );
}

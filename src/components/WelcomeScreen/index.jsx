import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { extractFileContent } from '../../utils/fileExtractor';
import './WelcomeScreen.css';

export default function WelcomeScreen({ onVoice, onPpt, onTeacher, onMusic }) {
  const { user, sendMessage, isStreaming, deepdiveActive, setDeepdiveActive, webSearchActive, setWebSearchActive } = useApp();
  const [text, setText] = useState('');
  const [showTools, setShowTools] = useState(false);
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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
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

  const hasInput = text.trim().length > 0 || attachedFile;
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="welcome-block">
      {/* Centered greeting + actions */}
      <div className="welcome-center">
        <h1 className="welcome-greeting">
          <span className="greeting-hi">Hi {firstName},</span>
          <span className="greeting-sub">what's on your mind?</span>
        </h1>

        {/* Action rows — vertical list like ChatGPT */}
        <div className="welcome-actions">
          <button className="w-action-row" onClick={() => onTeacher?.()}>
            <div className="w-action-icon"><i className="fas fa-chalkboard-teacher" /></div>
            <span className="w-action-text">AI Classroom</span>
          </button>
          <button className="w-action-row" onClick={() => onPpt?.()}>
            <div className="w-action-icon"><i className="fas fa-file-powerpoint" /></div>
            <span className="w-action-text">Create presentation</span>
          </button>
          <button className="w-action-row" onClick={() => setWebSearchActive(!webSearchActive)}>
            <div className="w-action-icon"><i className="fas fa-globe" /></div>
            <span className="w-action-text">{webSearchActive ? 'Web search is ON ✓' : 'Look something up'}</span>
          </button>
        </div>
      </div>

      {/* Bottom-fixed input bar */}
      <div className="welcome-input-wrap">
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
        <div className="welcome-input-row">
          <button className="w-plus-btn" onClick={() => setShowTools(!showTools)}>
            <i className={`fas ${showTools ? 'fa-times' : 'fa-plus'}`} />
          </button>

          <input
            type="text"
            className="w-input"
            placeholder={isExtracting ? extractStatus || "Extracting file..." : "Ask anything"}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isStreaming || isExtracting}
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

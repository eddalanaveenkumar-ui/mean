import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { extractFileContent } from '../../utils/fileExtractor';
import './InputArea.css';

export default function InputArea({ onVoice, onPpt, onTeacher, onMusic }) {
  const { sendMessage, isStreaming, deepdiveActive, setDeepdiveActive, webSearchActive, setWebSearchActive } = useApp();
  const [text, setText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedContent, setAttachedContent] = useState('');
  const [showTools, setShowTools] = useState(false);
  const [extractStatus, setExtractStatus] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  const handleSend = () => {
    if (isStreaming) return;
    if (!text.trim() && !attachedFile) return;
    sendMessage(text, attachedContent || null, attachedFile?.name || null);
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

  const hasInput = text.trim().length > 0 || attachedFile;

  return (
    <div className="input-wrapper">
      <div className="input-container">
        {/* Attachment preview */}
        {attachedFile && (
          <div className="attach-preview">
            <i className="fas fa-file-alt" />
            <span>{attachedFile.name}</span>
            <button onClick={() => { setAttachedFile(null); setAttachedContent(''); }}>
              <i className="fas fa-times" />
            </button>
          </div>
        )}

        <div className="input-main-row">
          {/* Plus/attach button */}
          <button className="input-plus-btn" onClick={() => setShowTools(!showTools)} title="Tools">
            <i className={`fas ${showTools ? 'fa-times' : 'fa-plus'}`} />
          </button>

          {/* Text area */}
          <textarea
            ref={inputRef}
            className="main-input"
            placeholder={isExtracting ? extractStatus || "Extracting file..." : "Ask anything"}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1}
            disabled={isStreaming || isExtracting}
          />

          {/* Right side: mic + send/voice */}
          <div className="input-right-btns">
            {isStreaming ? (
              <button className="send-circle-btn stop-btn" onClick={() => sendMessage('')} title="Stop Generating">
                <i className="fas fa-stop" />
              </button>
            ) : hasInput ? (
              <button className="send-circle-btn" onClick={handleSend} title="Send Message">
                <i className="fas fa-arrow-up" />
              </button>
            ) : (
              <>
                <button className="input-icon-btn" onClick={onVoice} title="Voice input">
                  <i className="fas fa-microphone" />
                </button>
                <button className="voice-wave-btn" onClick={onVoice} title="Voice conversation">
                  <i className="fas fa-waveform" />
                  <div className="wave-bars">
                    <span /><span /><span /><span />
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tools dropdown */}
        {showTools && (
          <div className="tools-dropdown">
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
            <div className="tools-divider" />
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

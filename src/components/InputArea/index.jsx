import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import './InputArea.css';

export default function InputArea({ onVoice, onPpt, onTeacher, onMusic }) {
  const { sendMessage, isStreaming, deepdiveActive, setDeepdiveActive, webSearchActive, setWebSearchActive } = useApp();
  const [text, setText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedContent, setAttachedContent] = useState('');
  const [showTools, setShowTools] = useState(false);
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
    const textExts = ['.txt','.md','.json','.csv','.py','.js','.html','.css','.java','.xml','.yaml','.yml','.tsx','.jsx','.ts','.c','.cpp','.h','.sql','.sh'];
    const isText = file.type.includes('text') || textExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (isText) {
      setAttachedContent(await file.text());
    } else {
      setAttachedContent(`[File: ${file.name}, ${(file.size / 1024).toFixed(1)}KB]`);
    }
    e.target.value = '';
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
            placeholder="Ask anything"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isStreaming}
          />

          {/* Right side: mic + send/voice */}
          <div className="input-right-btns">
            {hasInput ? (
              <button className="send-circle-btn" onClick={handleSend}>
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

        <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={handleFileChange} />
      </div>
    </div>
  );
}

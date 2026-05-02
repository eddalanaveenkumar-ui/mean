import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { runCode, getExtension } from '../../utils/codeRunner';
import './CodeCanvas.css';

// --- SVG Icons ---
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
);
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const StopIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
);
const CodeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
);

export default function CodeCanvas() {
  const {
    canvasOpen, canvasCode, canvasLang, canvasTitle,
    canvasVersions, canvasVersionIdx,
    updateCanvasCode, closeCanvas, navigateVersion
  } = useApp();

  const [localCode, setLocalCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dirty, setDirty] = useState(false);

  // ── Streaming & animation state ──
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamCode, setStreamCode] = useState('');
  const [changedLines, setChangedLines] = useState(new Set()); // lines that changed after stream
  const originalCodeRef = useRef(''); // code before AI edit started

  const editorRef = useRef(null);
  const lineNumRef = useRef(null);
  const previewRef = useRef(null);
  const streamContainerRef = useRef(null);

  // ── Sync local code with context code (for version nav, first load) ──
  useEffect(() => {
    if (canvasCode !== undefined && !isStreaming) {
      setLocalCode(canvasCode);
      setDirty(false);
    }
  }, [canvasCode, canvasVersionIdx]);

  // ── Listen for live canvas stream updates ──
  useEffect(() => {
    const handleStreamUpdate = (e) => {
      const { code, done } = e.detail;

      if (!isStreaming) {
        // First chunk — save original code and enter streaming mode
        originalCodeRef.current = localCode;
        setIsStreaming(true);
      }

      setStreamCode(code);

      if (done) {
        // Stream finished — compute changed lines for highlight
        const oldLines = originalCodeRef.current.split('\n');
        const newLines = code.split('\n');
        const changed = new Set();
        const maxLen = Math.max(oldLines.length, newLines.length);
        for (let i = 0; i < maxLen; i++) {
          if (oldLines[i] !== newLines[i]) changed.add(i);
        }
        setChangedLines(changed);

        // Switch to final code after a brief pause
        setTimeout(() => {
          setLocalCode(code);
          setStreamCode('');
          setIsStreaming(false);
          setDirty(false);

          // Fade out highlights after 3 seconds
          setTimeout(() => setChangedLines(new Set()), 3000);
        }, 600);
      }
    };

    const handleStreamEnd = () => {
      // Safety: if stream ends without a done flag
      if (isStreaming) {
        setTimeout(() => {
          if (streamCode) {
            setLocalCode(streamCode);
          }
          setStreamCode('');
          setIsStreaming(false);
          setDirty(false);
        }, 300);
      }
    };

    window.addEventListener('canvas-stream-update', handleStreamUpdate);
    window.addEventListener('stream-end', handleStreamEnd);
    return () => {
      window.removeEventListener('canvas-stream-update', handleStreamUpdate);
      window.removeEventListener('stream-end', handleStreamEnd);
    };
  }, [isStreaming, localCode, streamCode]);

  // Reset output when canvas closes
  useEffect(() => {
    if (!canvasOpen) {
      setRunOutput(null);
      setShowPreview(false);
      setIsStreaming(false);
      setStreamCode('');
      setChangedLines(new Set());
    }
  }, [canvasOpen]);

  // ── Auto-scroll stream container to bottom as code types in ──
  useEffect(() => {
    if (isStreaming && streamContainerRef.current) {
      streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
    }
  }, [streamCode, isStreaming]);

  // ── Line numbers ──
  const displayCode = isStreaming ? streamCode : localCode;
  const displayLines = displayCode.split('\n');

  const updateLineNumbers = useCallback(() => {
    if (!lineNumRef.current) return;
    const count = displayLines.length;
    lineNumRef.current.innerHTML = Array.from({ length: count }, (_, i) => `<div>${i + 1}</div>`).join('');
  }, [displayLines.length]);

  useEffect(() => { updateLineNumbers(); }, [updateLineNumbers]);

  const handleEditorScroll = () => {
    if (lineNumRef.current && editorRef.current) {
      lineNumRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  const handleCodeChange = (e) => { setLocalCode(e.target.value); setDirty(true); };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = localCode.substring(0, start) + '  ' + localCode.substring(end);
      setLocalCode(newCode);
      setDirty(true);
      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 2; }, 0);
    }
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (dirty) { updateCanvasCode(localCode); setDirty(false); }
    }
  };

  // ── Run code ──
  const handleRun = async () => {
    if (isRunning) return;
    if (dirty) { updateCanvasCode(localCode); setDirty(false); }
    setIsRunning(true);
    setShowPreview(true);
    setRunOutput(null);
    try {
      const result = await runCode(localCode, canvasLang);
      setRunOutput(result);
    } catch (err) {
      setRunOutput({ type: 'text', content: `❌ Error: ${err.message}`, error: true });
    }
    setIsRunning(false);
  };

  const handleCopy = () => { navigator.clipboard.writeText(localCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleDownload = () => {
    const ext = getExtension(canvasLang);
    const filename = (canvasTitle || 'code').toLowerCase().replace(/\s+/g, '_') + '.' + ext;
    const blob = new Blob([localCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const canGoPrev = canvasVersionIdx > 0;
  const canGoNext = canvasVersionIdx < canvasVersions.length - 1;
  const versionLabel = canvasVersions.length > 0 ? `v${canvasVersionIdx + 1}/${canvasVersions.length}` : '';

  if (!canvasOpen) return null;

  return (
    <div className="code-canvas">
      {/* Header */}
      <div className="cc-header">
        <div className="cc-header-left">
          <CodeIcon />
          <span className="cc-title">{canvasTitle || 'Code'}</span>
          <span className="cc-lang-badge">{(canvasLang || 'text').toUpperCase()}</span>
          {isStreaming && <span className="cc-editing-badge">✨ Editing...</span>}
        </div>
        <div className="cc-header-right">
          {canvasVersions.length > 1 && (
            <div className="cc-version-nav">
              <button className="cc-icon-btn" onClick={() => navigateVersion(-1)} disabled={!canGoPrev} title="Previous version"><ChevronLeft /></button>
              <span className="cc-version-label">{versionLabel}</span>
              <button className="cc-icon-btn" onClick={() => navigateVersion(1)} disabled={!canGoNext} title="Next version"><ChevronRight /></button>
            </div>
          )}

          {showPreview ? (
            <button className="cc-action-btn cc-run-btn" onClick={() => setShowPreview(false)}>
              <StopIcon /> Stop
            </button>
          ) : (
            <>
              <button className={`cc-action-btn cc-run-btn ${isRunning ? 'running' : ''}`} onClick={handleRun} disabled={isRunning || isStreaming}>
                {isRunning ? <><StopIcon /> Running...</> : <><PlayIcon /> Run</>}
              </button>
              <button className={`cc-icon-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy code">
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
              <button className="cc-icon-btn" onClick={handleDownload} title="Download">
                <DownloadIcon />
              </button>
            </>
          )}

          <button className="cc-icon-btn cc-close-btn" onClick={closeCanvas} title="Close canvas">
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="cc-body">
        {/* Editor */}
        {!showPreview && (
          <div className="cc-editor-pane">
            <div className="cc-editor-wrap">
              <div className="cc-line-numbers" ref={lineNumRef} />

              {isStreaming ? (
                /* ── Live streaming view: code appears line by line ── */
                <div className="cc-stream-container" ref={streamContainerRef}>
                  {displayLines.map((line, i) => {
                    const origLines = originalCodeRef.current.split('\n');
                    const isChanged = origLines[i] !== line;
                    const isNew = i >= origLines.length;
                    return (
                      <div
                        key={i}
                        className={`cc-stream-line ${isChanged || isNew ? 'changed' : ''}`}
                      >
                        {line || '\u00A0'}
                      </div>
                    );
                  })}
                  <span className="cc-typing-cursor" />
                </div>
              ) : (
                /* ── Normal editable textarea with highlight overlay ── */
                <div className="cc-editor-container">
                  {changedLines.size > 0 && (
                    <div className="cc-highlight-overlay">
                      {localCode.split('\n').map((line, i) => (
                        <div
                          key={i}
                          className={`cc-highlight-line ${changedLines.has(i) ? 'highlighted' : ''}`}
                        />
                      ))}
                    </div>
                  )}
                  <textarea
                    ref={editorRef}
                    className="cc-editor"
                    value={localCode}
                    onChange={handleCodeChange}
                    onKeyDown={handleKeyDown}
                    onScroll={handleEditorScroll}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                </div>
              )}
            </div>
            {dirty && (
              <div className="cc-dirty-indicator">
                <span>Unsaved changes</span>
                <button onClick={() => { updateCanvasCode(localCode); setDirty(false); }}>Save (Ctrl+S)</button>
              </div>
            )}
          </div>
        )}

        {/* Preview / Output */}
        {showPreview && (
          <div className="cc-preview-pane">
            <div className="cc-preview-body">
              {isRunning && (
                <div className="cc-preview-loading">
                  <div className="cc-spinner" />
                  <span>Executing...</span>
                </div>
              )}
              {!isRunning && runOutput?.type === 'html' && (
                <iframe ref={previewRef} className="cc-preview-iframe" sandbox="allow-scripts allow-modals allow-forms" srcDoc={runOutput.content} title="Code Preview" />
              )}
              {!isRunning && runOutput?.type === 'text' && (
                <pre className={`cc-output-text ${runOutput.error ? 'error' : ''}`}>{runOutput.content}</pre>
              )}
              {!isRunning && !runOutput && (
                <div className="cc-preview-empty">Click <strong>Run</strong> to execute the code</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

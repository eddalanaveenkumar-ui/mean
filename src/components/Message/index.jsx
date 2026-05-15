import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useApp } from '../../context/AppContext';
import InlineClassroom from '../InlineClassroom';
import './Message.css';

// Inline SVG icons matching the user's reference screenshot (outlined style)
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

/* ── Render LaTeX math with KaTeX ── */
function renderMath(text) {
  if (!text || !window.katex) return text;
  const render = (expr, display) => {
    try {
      return window.katex.renderToString(expr.trim(), { displayMode: display, throwOnError: false });
    } catch { return `<span class="math-error">${expr}</span>`; }
  };
  // Block math: $$...$$ 
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, e) => render(e, true));
  // Block math: \[...\]
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, e) => render(e, true));
  // Inline math: \(...\)
  text = text.replace(/\\\(([\s\S]+?)\\\)/g, (_, e) => render(e, false));
  // Inline math: $...$ (but not $$)
  text = text.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_, e) => render(e, false));
  return text;
}

function renderMarkdown(text) {
  if (!text) return '';
  let finalHtml = '';
  try {
    if (window.marked) {
      window.marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false });
      // Process math BEFORE markdown so $ symbols don't get mangled
      let processed = renderMath(text);
      let html = window.marked.parse(processed);
      // SVG icon strings
      const copyIco = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
      const dlIco = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
      const runIco = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>';

      html = html.replace(
        /<pre><code class="language-(\w+)">/g,
        (_, lang) => `<pre data-lang="${lang}"><span class="code-lang-label">${lang}</span><div class="code-actions"><button class="run-code-btn" title="Run code" data-lang="${lang}">${runIco}<span>Run</span></button><button class="copy-code-btn" title="Copy code">${copyIco}<span>Copy</span></button><button class="download-code-btn" title="Download">${dlIco}</button></div><code class="language-${lang} hljs">`
      );
      html = html.replace(
        /<pre><code>(?!class)/g,
        `<pre><div class="code-actions"><button class="copy-code-btn" title="Copy code">${copyIco}<span>Copy</span></button></div><code class="hljs">`
      );
      finalHtml = html;
    } else {
      finalHtml = renderMath(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
    }
  } catch (e) {
    finalHtml = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
  }

  return finalHtml;
}

function injectCursor(html) {
  const cursor = '<span class="gen-cursor">▍</span>';
  const lastCloseIdx = html.lastIndexOf('</');
  if (lastCloseIdx > 0) {
    return html.slice(0, lastCloseIdx) + cursor + html.slice(lastCloseIdx);
  }
  return html + cursor;
}

function highlightCode(el) {
  if (!el || !window.hljs) return;
  el.querySelectorAll('pre code').forEach(block => {
    if (!block.classList.contains('hljs-done')) {
      window.hljs.highlightElement(block);
      block.classList.add('hljs-done');
    }
  });
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className={`msg-copy-btn ${copied ? 'done' : ''}`} onClick={handleCopy} title="Copy">
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function DownloadButton({ text }) {
  const handleDl = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mean-ai-response.md'; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button className="msg-dl-btn" onClick={handleDl} title="Download">
      <DownloadIcon />
      <span>Download</span>
    </button>
  );
}

export default function Message({ message, streaming = false, messageIndex, chatId, updateMessageData, onTeacher }) {
  const contentRef = useRef(null);
  const { openCanvas, canvasOpen } = useApp();
  const isUser = message.role === 'user';
  let displayText = message.displayContent || message.content;
  
  let canvasData = null;
  if (!isUser) {
    // Extract [CANVAS_UPDATE] block to render as a clickable card
    const canvasRegex = /\[CANVAS_UPDATE\]([\s\S]*?)(?:\[\/CANVAS_UPDATE\]|$)/;
    const canvasMatch = displayText.match(canvasRegex);
    
    if (canvasMatch) {
      const fullMatch = canvasMatch[0];
      let innerContent = canvasMatch[1];
      let lang = 'text';
      let code = innerContent.trim();
      
      const langMatch = innerContent.match(/^[\s]*```(\w+)?\n([\s\S]*?)(?:```|$)/);
      if (langMatch) {
        lang = langMatch[1] || 'text';
        code = langMatch[2].trim();
      }
      
      canvasData = { lang, code };
      // Remove it from the text since we will render a custom card
      displayText = displayText.replace(canvasRegex, '');
    }
  }

  useEffect(() => {
    if (contentRef.current && !isUser) highlightCode(contentRef.current);
  }, [displayText, isUser]);

  const handleContentClick = useCallback((e) => {
    const copyBtn = e.target.closest('.copy-code-btn');
    const dlBtn = e.target.closest('.download-code-btn');
    const runBtn = e.target.closest('.run-code-btn');

    if (copyBtn) {
      e.preventDefault();
      const pre = copyBtn.closest('pre');
      const code = pre?.querySelector('code')?.textContent || '';
      navigator.clipboard.writeText(code).then(() => {
        const labelEl = copyBtn.querySelector('span');
        copyBtn.classList.add('copied');
        if (labelEl) labelEl.textContent = 'Copied!';
        const svgEl = copyBtn.querySelector('svg');
        if (svgEl) svgEl.outerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          if (labelEl) labelEl.textContent = 'Copy';
          const s = copyBtn.querySelector('svg');
          if (s) s.outerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
        }, 2000);
      });
    }

    if (dlBtn) {
      e.preventDefault();
      const pre = dlBtn.closest('pre');
      const code = pre?.querySelector('code')?.textContent || '';
      const langEl = pre?.querySelector('.code-lang-label');
      const langLabel = langEl?.textContent || 'txt';
      const extMap = { python:'py', javascript:'js', html:'html', css:'css', java:'java', cpp:'cpp', bash:'sh', json:'json', typescript:'ts' };
      const ext = extMap[langLabel.toLowerCase()] || 'txt';
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `code.${ext}`; a.click();
      URL.revokeObjectURL(url);
    }

    if (runBtn) {
      e.preventDefault();
      const pre = runBtn.closest('pre');
      if (!pre) return;
      const code = pre.querySelector('code')?.textContent || '';
      const lang = runBtn.dataset.lang || pre.dataset.lang || 'text';
      // Derive a title from the language
      const langTitles = { html: 'HTML Page', javascript: 'JavaScript', js: 'JavaScript', python: 'Python Script', py: 'Python Script', css: 'CSS Styles', java: 'Java Program', cpp: 'C++ Program', c: 'C Program', typescript: 'TypeScript', ts: 'TypeScript', go: 'Go Program', rust: 'Rust Program', ruby: 'Ruby Script', php: 'PHP Script', bash: 'Shell Script', sh: 'Shell Script' };
      const title = langTitles[lang.toLowerCase()] || lang.toUpperCase() + ' Code';
      openCanvas(code, lang, title);
    }
  }, [openCanvas]);

  if (isUser) {
    let userImgUrl = null;
    let docFileName = null;
    let finalUserText = displayText;
    
    // Check for our special attached image syntax
    const imgMatch = displayText.match(/^!\[Attached Image\]\((blob:[^)]+|data:image\/[^)]+)\)\n\n([\s\S]*)$/);
    if (imgMatch) {
      userImgUrl = imgMatch[1];
      finalUserText = imgMatch[2];
    } else {
      // Check for attached document syntax
      const docMatch = displayText.match(/^📎 (.*)\n\n([\s\S]*)$/);
      if (docMatch) {
        docFileName = docMatch[1];
        finalUserText = docMatch[2];
      }
    }

    return (
      <div className="msg-row msg-user">
        <div className="msg-user-bubble">
          {userImgUrl && (
            <img 
              src={userImgUrl} 
              alt="Uploaded" 
              style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', marginBottom: '10px', display: 'block', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
            />
          )}
          {docFileName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '10px', marginBottom: '10px', fontSize: '13px', fontWeight: '500' }}>
              <i className="fas fa-file-alt" style={{ fontSize: '20px', color: '#e8913a' }}></i>
              <span style={{ wordBreak: 'break-all' }}>{docFileName}</span>
            </div>
          )}
          {finalUserText}
        </div>
      </div>
    );
  }

  const inlineMatch = displayText.match(/\[RENDER_CLASSROOM_INLINE:\s*"([^"]+)"\]/);
  
  let inlineTopic = null;
  let textBefore = displayText;
  let textAfter = '';

  if (inlineMatch && !isUser) {
    inlineTopic = inlineMatch[1];
    const splitArr = displayText.split(inlineMatch[0]);
    textBefore = splitArr[0];
    textAfter = splitArr[1] || '';
  }

  const renderedBefore = renderMarkdown(textBefore);
  const renderedAfter = renderMarkdown(textAfter);

  return (
    <div className="msg-row msg-bot">
      <div className="msg-bot-content">
        {streaming && !renderedBefore && !renderedAfter && !inlineTopic && !canvasData && (
          <div className="msg-buffering">
            <div className="buf-infinity">
              <svg viewBox="0 0 100 50" width="40" height="20">
                <defs>
                  <linearGradient id="inf-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="var(--accent-warm)" />
                  </linearGradient>
                </defs>
                {/* Background track */}
                <path 
                  d="M 50 25 C 65 5, 85 5, 85 25 C 85 45, 65 45, 50 25 C 35 5, 15 5, 15 25 C 15 45, 35 45, 50 25" 
                  fill="none" 
                  stroke="var(--accent)" 
                  strokeWidth="6" 
                  opacity="0.15"
                />
                {/* Glowing animated snake */}
                <path 
                  d="M 50 25 C 65 5, 85 5, 85 25 C 85 45, 65 45, 50 25 C 35 5, 15 5, 15 25 C 15 45, 35 45, 50 25" 
                  fill="none" 
                  stroke="url(#inf-grad)" 
                  strokeWidth="6" 
                  strokeLinecap="round" 
                  pathLength="100"
                  className="inf-path"
                />
              </svg>
            </div>
            <span className="buf-text">Mean AI is thinking...</span>
          </div>
        )}

        {renderedBefore && (
          <div
            className="msg-content"
            ref={contentRef}
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: streaming && !inlineTopic ? injectCursor(renderedBefore) : renderedBefore }}
          />
        )}
        
        {inlineTopic && !streaming && (
          <InlineClassroom 
            topic={inlineTopic} 
            cachedSlides={message.classroomSlides}
            onSaveSlides={(slides) => {
              if (updateMessageData && chatId && messageIndex !== undefined) {
                updateMessageData(chatId, messageIndex, { classroomSlides: slides });
              }
            }}
            onExpand={(t, slides) => { if (onTeacher) onTeacher(t, slides); }} 
          />
        )}
        
        {renderedAfter && (
          <div
            className="msg-content"
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: streaming ? injectCursor(renderedAfter) : renderedAfter }}
          />
        )}
        
        {canvasData && (
          <div className="canvas-card-container" onClick={() => {
            const langTitles = { html: 'HTML Page', javascript: 'JavaScript', js: 'JavaScript', python: 'Python Script', py: 'Python Script', css: 'CSS Styles', java: 'Java Program', cpp: 'C++ Program', c: 'C Program', typescript: 'TypeScript', ts: 'TypeScript', go: 'Go Program', rust: 'Rust Program', ruby: 'Ruby Script', php: 'PHP Script', bash: 'Shell Script', sh: 'Shell Script' };
            const title = langTitles[canvasData.lang.toLowerCase()] || canvasData.lang.toUpperCase() + ' Code';
            openCanvas(canvasData.code, canvasData.lang, title);
          }}>
            <div className="canvas-card-content">
              <div className="canvas-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              </div>
              <div className="canvas-card-info">
                <span className="canvas-card-title">{streaming ? 'Generating Code...' : 'Canvas Ready'}</span>
                <span className="canvas-card-subtitle">{streaming ? `Writing ${canvasData.lang}...` : 'Click to open code canvas'}</span>
              </div>
            </div>
            <div className="canvas-card-action">
              <span>Open</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          </div>
        )}
        
        {!streaming && (
          <div className="msg-actions-row">
            <CopyButton text={message.content} />
            <DownloadButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  );
}

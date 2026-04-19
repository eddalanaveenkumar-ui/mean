import React, { useRef, useEffect, useCallback, useState } from 'react';
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

function renderMarkdown(text) {
  if (!text) return '';
  try {
    if (window.marked) {
      window.marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false });
      let html = window.marked.parse(text);
      html = html.replace(
        /<pre><code class="language-(\w+)">/g,
        (_, lang) => `<pre><span class="code-lang-label">${lang}</span><div class="code-actions"><button class="copy-code-btn" title="Copy code"><span class="cc-icon">copy</span></button><button class="download-code-btn" title="Download"><span class="cc-icon">dl</span></button></div><code class="language-${lang} hljs">`
      );
      html = html.replace(
        /<pre><code>(?!class)/g,
        '<pre><div class="code-actions"><button class="copy-code-btn" title="Copy code"><span class="cc-icon">copy</span></button></div><code class="hljs">'
      );
      return html;
    }
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
  } catch (e) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
  }
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

export default function Message({ message, streaming = false }) {
  const contentRef = useRef(null);
  const isUser = message.role === 'user';
  const displayText = message.displayContent || message.content;

  useEffect(() => {
    if (contentRef.current && !isUser) highlightCode(contentRef.current);
  }, [displayText, isUser]);

  const handleContentClick = useCallback((e) => {
    const copyBtn = e.target.closest('.copy-code-btn');
    const dlBtn = e.target.closest('.download-code-btn');

    if (copyBtn) {
      e.preventDefault();
      const pre = copyBtn.closest('pre');
      const code = pre?.querySelector('code')?.textContent || '';
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.classList.add('copied');
        const iconEl = copyBtn.querySelector('.cc-icon');
        if (iconEl) iconEl.textContent = '✓';
        setTimeout(() => { copyBtn.classList.remove('copied'); if (iconEl) iconEl.textContent = 'copy'; }, 2000);
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
  }, []);

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

  const renderedHtml = renderMarkdown(displayText);
  const finalHtml = streaming ? injectCursor(renderedHtml) : renderedHtml;

  return (
    <div className="msg-row msg-bot">
      <div className="msg-bot-content">
        <div
          className="msg-content"
          ref={contentRef}
          onClick={handleContentClick}
          dangerouslySetInnerHTML={{ __html: finalHtml }}
        />
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

import React, { useRef, useEffect, useCallback, useState } from 'react';
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

function renderMarkdown(text) {
  if (!text) return '';
  let finalHtml = '';
  try {
    if (window.marked) {
      window.marked.setOptions({ breaks: true, gfm: true, headerIds: false, mangle: false });
      let html = window.marked.parse(text);
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
      finalHtml = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
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
  const isUser = message.role === 'user';
  const displayText = message.displayContent || message.content;

  useEffect(() => {
    if (contentRef.current && !isUser) highlightCode(contentRef.current);
  }, [displayText, isUser]);

  // === CODE EXECUTION ENGINE ===
  const runCodeInBrowser = useCallback((code, lang) => {
    return new Promise((resolve) => {
      const lLang = lang.toLowerCase();

      // HTML / CSS — render in iframe
      if (lLang === 'html' || lLang === 'css') {
        const htmlDoc = lLang === 'css'
          ? `<!DOCTYPE html><html><head><style>${code}</style></head><body><div class="demo">CSS Preview</div></body></html>`
          : code;
        resolve({ type: 'html', content: htmlDoc });
        return;
      }

      // JavaScript / TypeScript — sandbox iframe eval
      if (lLang === 'javascript' || lLang === 'js' || lLang === 'typescript' || lLang === 'ts') {
        const logs = [];
        const iframe = document.createElement('iframe');
        iframe.sandbox = 'allow-scripts';
        iframe.style.display = 'none';
        const script = `
          <script>
            const __logs = [];
            const __origLog = console.log;
            console.log = (...args) => __logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
            console.error = (...args) => __logs.push('❌ ' + args.map(a => String(a)).join(' '));
            console.warn = (...args) => __logs.push('⚠️ ' + args.map(a => String(a)).join(' '));
            try {
              ${code.replace(/<\/script>/gi, '<\\/script>')}
            } catch(e) {
              __logs.push('❌ Error: ' + e.message);
            }
            parent.postMessage({ type: 'CODE_RESULT', logs: __logs }, '*');
          <\/script>`;
        const handler = (e) => {
          if (e.data?.type === 'CODE_RESULT') {
            window.removeEventListener('message', handler);
            iframe.remove();
            resolve({ type: 'text', content: e.data.logs.join('\n') || '(No output)' });
          }
        };
        window.addEventListener('message', handler);
        iframe.srcdoc = `<!DOCTYPE html><html><body>${script}</body></html>`;
        document.body.appendChild(iframe);
        // Timeout safety
        setTimeout(() => { window.removeEventListener('message', handler); iframe.remove(); resolve({ type: 'text', content: '⏱ Execution timed out (5s)' }); }, 5000);
        return;
      }

      // All other languages — use Piston API (free, 50+ languages)
      const pistonLangMap = {
        python: 'python', py: 'python', python3: 'python',
        java: 'java', c: 'c', cpp: 'c++', 'c++': 'c++', csharp: 'csharp', 'c#': 'csharp',
        go: 'go', golang: 'go', rust: 'rust', ruby: 'ruby', php: 'php',
        swift: 'swift', kotlin: 'kotlin', r: 'r', perl: 'perl',
        bash: 'bash', sh: 'bash', shell: 'bash', lua: 'lua',
        dart: 'dart', scala: 'scala', haskell: 'haskell',
      };
      const pistonLang = pistonLangMap[lLang];
      if (!pistonLang) {
        resolve({ type: 'text', content: `⚠️ Language "${lang}" is not supported for execution.` });
        return;
      }

      fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: pistonLang,
          version: '*',
          files: [{ content: code }]
        })
      })
      .then(r => r.json())
      .then(data => {
        const output = (data.run?.output || data.run?.stderr || '(No output)').trim();
        resolve({ type: 'text', content: output });
      })
      .catch(err => {
        resolve({ type: 'text', content: `❌ Execution error: ${err.message}` });
      });
    });
  }, []);

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

      // Toggle existing output panel
      let outputPanel = pre.nextElementSibling;
      if (outputPanel?.classList.contains('code-output-panel') && !outputPanel.classList.contains('running')) {
        outputPanel.remove();
        return;
      }

      // Create output panel
      if (!outputPanel?.classList.contains('code-output-panel')) {
        outputPanel = document.createElement('div');
        outputPanel.className = 'code-output-panel running';
        pre.after(outputPanel);
      }
      outputPanel.className = 'code-output-panel running';
      outputPanel.innerHTML = '<div class="code-output-header"><span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Output</span><button class="code-output-close" title="Close">✕</button></div><div class="code-output-body"><div class="code-output-spinner"></div><span>Running...</span></div>';
      outputPanel.querySelector('.code-output-close')?.addEventListener('click', () => outputPanel.remove());

      // Update Run button to show running state
      const labelEl = runBtn.querySelector('span');
      if (labelEl) labelEl.textContent = 'Running...';
      runBtn.disabled = true;

      runCodeInBrowser(code, lang).then(result => {
        runBtn.disabled = false;
        if (labelEl) labelEl.textContent = 'Run';
        outputPanel.classList.remove('running');

        if (result.type === 'html') {
          outputPanel.innerHTML = '<div class="code-output-header"><span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Preview</span><button class="code-output-close" title="Close">✕</button></div><iframe class="code-output-iframe" sandbox="allow-scripts allow-modals"></iframe>';
          const iframeEl = outputPanel.querySelector('iframe');
          if (iframeEl) iframeEl.srcdoc = result.content;
        } else {
          const escaped = (result.content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          outputPanel.innerHTML = `<div class="code-output-header"><span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Output</span><button class="code-output-close" title="Close">✕</button></div><pre class="code-output-body">${escaped}</pre>`;
        }
        outputPanel.querySelector('.code-output-close')?.addEventListener('click', () => outputPanel.remove());
      });
    }
  }, [runCodeInBrowser]);

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

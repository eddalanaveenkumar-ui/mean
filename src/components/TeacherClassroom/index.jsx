import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import './TeacherClassroom.css';

// Lazy-loaded library variables
let pdfjsLib = null;
let mammoth = null;

// Safe async initializer
const initLibs = async () => {
  try {
    if (!pdfjsLib) {
       pdfjsLib = await import('pdfjs-dist');
       pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }
  } catch (e) {
    console.warn('[Classroom] pdfjs-dist not available:', e.message);
  }
  try {
    if (!mammoth) {
       const m = await import('mammoth');
       mammoth = m.default || m;
    }
  } catch (e) {
    console.warn('[Classroom] mammoth not available:', e.message);
  }
};
// Fire initializer without blocking the module JS export chain
initLibs();

const YOUTUBE_SEARCH_URL = 'https://www.youtube.com/results?search_query=';

// HashMap for instant slide lookup by index (DSA optimization)
class SlideCache {
  constructor() { this.map = new Map(); }
  set(key, val) { this.map.set(key, val); }
  get(key) { return this.map.get(key); }
  has(key) { return this.map.has(key); }
}

// Completely block React from re-reconciling the interior DOM tree while text is speaking
// Without this, parent state updates (like real-time countdown timer) obliterate our `.tc-hw` word spans!
const StaticSlideBody = React.memo(({ html, innerRef }) => {
  return (
    <div className="tc-slide-body">
      <div 
        ref={innerRef}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}, (prevProps, nextProps) => prevProps.html === nextProps.html);

export default function TeacherClassroom({ isOpen, onClose }) {
  const { user, webSearchActive, saveClass, classes, deleteClass, theme } = useApp();
  const [phase, setPhase] = useState('idle');
  const [topic, setTopic] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');
  const [subject, setSubject] = useState('General');
  const [level] = useState('high');
  const lang = 'English';
  const duration = 30;

  // Settings modal — local keys from AI Studio and OpenRouter
  const [showSettings, setShowSettings] = useState(false);
  const [localKey, setLocalKey] = useState(() => localStorage.getItem('meanai_gemini_key') || '');
  const saveKey = (k) => { setLocalKey(k); localStorage.setItem('meanai_gemini_key', k); };

  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('meanai_openrouter_key') || '');
  const saveOpenRouterKey = (k) => { setOpenRouterKey(k); localStorage.setItem('meanai_openrouter_key', k); };

  // Model Selection
  const [activeEngine, setActiveEngine] = useState('gemini'); // 'gemini' | 'arcee'

  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState(''); // 'syllabus', 'concepts', 'questions'
  const [extracting, setExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState('');
  const fileInputRef = useRef(null);

  // Presentation state
  const [slides, setSlides] = useState([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [slideContents, setSlideContents] = useState(new SlideCache());
  const [voiceState, setVoiceState] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const slideBodyRef = useRef(null);
  const [loading, _setLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const [jsonStreamData, setJsonStreamData] = useState('');
  const setLoading = useCallback((val) => { isLoadingRef.current = val; _setLoading(val); }, []);
  const fetchingRefs = useRef(new Set());
  const [showDoubt, setShowDoubt] = useState(false);
  const [doubtText, setDoubtText] = useState('');
  const [doubtAnswer, setDoubtAnswer] = useState('');

  // Right panel — YouTube videos & images
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [isAgentLogExpanded, setIsAgentLogExpanded] = useState(false);
  const [showClassList, setShowClassList] = useState(false);
  const [iframeSrcDoc, setIframeSrcDoc] = useState('');

  // YouTube Data API v3 key from environment variables
  const APP_YT_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

  // Full class notes for PDF
  const classNotesRef = useRef([]);
  const timerRef = useRef(null);
  const activeRef = useRef(false);
  const contentRef = useRef(null);
  const sessionVideoRef = useRef(null);

  const fetchAI = useCallback(async (messages, maxTokens = 2000, retryCount = 1) => {
    try {
      let systemPrompt = "";
      let contents = [];
      let url, headers, payload;

      if (activeEngine === 'gemini') {
        const cleanedKey = localKey ? localKey.trim() : '';
        if (!cleanedKey) return '';
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${cleanedKey}`;
        headers = { 'Content-Type': 'application/json' };
        for (const m of messages) {
           if (m.role === 'system') systemPrompt += m.content + "\n";
           else contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] });
        }
        payload = { contents };
        if (systemPrompt) payload.systemInstruction = { parts: [{ text: systemPrompt }] };
      } else {
        const cleanedKey = openRouterKey ? openRouterKey.trim() : '';
        if (!cleanedKey) return '';
        url = 'https://openrouter.ai/api/v1/chat/completions';
        headers = { 'Authorization': `Bearer ${cleanedKey}`, 'Content-Type': 'application/json' };
        for (const m of messages) {
            contents.push(m);
        }
        payload = { model: 'arcee-ai/trinity-large-preview:free', messages: contents, max_tokens: maxTokens };
      }

      const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
      const data = await resp.json();
      
      let content = '';
      if (activeEngine === 'gemini') {
        content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      } else {
        content = data.choices?.[0]?.message?.content;
      }
        
      if (!content && retryCount > 0) {
        await new Promise(r => setTimeout(r, 500));
        return fetchAI(messages, maxTokens, retryCount - 1);
      }
      return content || '';
    } catch (e) {
      if (retryCount > 0) {
        await new Promise(r => setTimeout(r, 500));
        return fetchAI(messages, maxTokens, retryCount - 1);
      }
      return '';
    }
  }, [localKey, openRouterKey, activeEngine]);

  // Fetch roadmap.html dynamically to bypass Vercel/DNS iframe security redirect blocks
  // Added Date.now() timestamp to force bypass the PWA Service Worker cache!
  useEffect(() => {
    fetch(`/roadmap.html?v=${Date.now()}`)
      .then(res => {
         if (!res.ok) throw new Error("Failed to load roadmap HTML");
         return res.text();
      })
      .then(html => setIframeSrcDoc(html))
      .catch(err => console.error(err));
  }, []);

  // Wrap all visible text nodes inside the slide body with word spans for highlighting
  const wrapWordsInDOM = useCallback(() => {
    const el = slideBodyRef.current;
    if (!el) return 0;

    // Clear any previous wrapping by re-rendering (React handles this via key)
    // But if already wrapped from a previous call in the same render, skip
    const existing = el.querySelectorAll('.tc-hw');
    if (existing.length > 0) return existing.length;

    let wordIdx = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (const node of textNodes) {
      const text = node.textContent;
      if (!text || !text.trim()) continue;

      // Code blocks will now be wrapped and spoken word-by-word!

      const frag = document.createDocumentFragment();
      const parts = text.split(/(\s+)/);
      for (const part of parts) {
        if (/^\s+$/.test(part) || !part) {
          frag.appendChild(document.createTextNode(part || ''));
        } else {
          const span = document.createElement('span');
          span.className = 'tc-hw';
          span.setAttribute('data-wi', wordIdx.toString());
          span.textContent = part;
          frag.appendChild(span);
          wordIdx++;
        }
      }
      if (node.parentNode) node.parentNode.replaceChild(frag, node);
    }
    return wordIdx;
  }, []);

  const updateLiveVisualizer = (wordSpan) => {
    const container = document.getElementById('tc-live-visualizer-inject');
    if (!container || !slideBodyRef.current) return;

    // Is it inside Line-by-Line Explanation?
    const explContainer = wordSpan.closest('.tc-expl-container');
    if (explContainer) {
      const p = wordSpan.closest('p');
      if (p && p.textContent.includes('What:') && p.querySelector('code')) {
        const codeText = p.querySelector('code').innerHTML;
        let html = `<div class="tc-live-header active"><i class="fas fa-play-circle"></i> Explaining Node</div>`;
        html += `<pre class="tc-live-code-block active"><code>${codeText}</code></pre>`;
        
        let cleanedHtml = p.innerHTML.replace(/[→>]*\s*<code(.*?)\/code><br>/, '');
        html += `<div class="tc-live-details">${cleanedHtml}</div>`;
        
        container.innerHTML = html;
        container.className = 'tc-code-workspace active';
        return;
      }
    }

    // Is it inside a Dry Run Table?
    const tableContainer = wordSpan.closest('.tc-dyn-table');
    if (tableContainer) {
      const tr = wordSpan.closest('tr');
      if (tr && tr.closest('table')) {
        const table = tr.closest('table');
        let html = `<div class="tc-live-header active"><i class="fas fa-table"></i> Algorithm State</div>`;
        html += `<div class="tc-live-table-wrapper">${table.outerHTML}</div>`;
        container.innerHTML = html;
        container.className = 'tc-code-workspace table-mode active';
        
        const newTable = container.querySelector('table');
        const rowIndex = Array.from(tr.parentNode.children).indexOf(tr);
        if (rowIndex >= 0 && newTable) {
           const rows = newTable.querySelectorAll('tr');
           if (rows[rowIndex]) rows[rowIndex].classList.add('tc-live-row-active');
        }
        return;
      }
    }

    // Default state if outside
    const fullCode = slideBodyRef.current.querySelector('.tc-block-reveal pre code');
    if (fullCode) {
      container.innerHTML = `<div class="tc-live-header"><i class="fas fa-check"></i> Code Ready</div><pre class="tc-live-code-block"><code>${fullCode.innerHTML}</code></pre>`;
      container.className = 'tc-code-workspace idle';
    }
  };

  const speakText = useCallback(async (text) => {
    window.speechSynthesis?.cancel();
    if (!('speechSynthesis' in window)) return;
    setVoiceState('speaking');

    // Wait for React to finish rendering the new content into the DOM
    await new Promise(r => setTimeout(r, 400));
    // Force a second frame paint
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const totalWrapped = wrapWordsInDOM();
    if (totalWrapped === 0 || !slideBodyRef.current) {
      setVoiceState('idle'); 
      return; 
    }

    // Build the EXACT string to speak directly from the DOM spans.
    // Strip emojis and punctuation so TTS engines don't choke or drop boundaries.
    const spans = slideBodyRef.current.querySelectorAll('.tc-hw');
    let exactText = '';
    let spanMap = [];
    
    spans.forEach((span, idx) => {
      // Remove emojis and common markdown artifacts left over
      const w = span.textContent.replace(/[#*`_\[\]()~\->📌👉💡⚡✅🔥📝🎯📊🏫🔍🧠📎]/g, '').trim();
      
      // Only map and speak words that contain speakable characters
      if (w.length > 0) {
        spanMap.push({ domIdx: idx, startChar: exactText.length, length: w.length });
        exactText += w + ' ';
      }
    });
    
    exactText = exactText.trim();
    if (!exactText) { setVoiceState('idle'); return; }

    console.log(`[TTS] Speaking ${totalWrapped} words from DOM`);

    return new Promise(resolve => {
      const utt = new SpeechSynthesisUtterance(exactText);
      utt.rate = 0.92; utt.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const langMap = { English: 'en', Hindi: 'hi', Telugu: 'te', Tamil: 'ta', Kannada: 'kn', Malayalam: 'ml', Marathi: 'mr' };
      const code = langMap[lang] || 'en';
      const voice = voices.find(v => v.lang.startsWith(code)) || voices[0];
      if (voice) utt.voice = voice;

      let prevHighlight = null;
      let boundaryFired = false;

      // Helper to avoid erratic scrolling jitter
      const scrollIfHidden = (el) => {
        const rect = el.getBoundingClientRect();
        const container = document.querySelector('.tc-board-left');
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      };

      // Method 1: onboundary (works beautifully when exact text matches)
      utt.onboundary = (e) => {
        if (e.name === 'word') {
          boundaryFired = true;
          
          // KILL the fallback timer if it accidentally started before the TTS engine loaded!
          // This prevents the timer and the real boundaries from fighting and bouncing back and forth.
          if (fallbackTimer) clearInterval(fallbackTimer);
          clearTimeout(fallbackStart);

          const charIdx = e.charIndex;
          const target = spanMap.find(w => charIdx >= w.startChar && charIdx < w.startChar + w.length);
          
          if (target && slideBodyRef.current) {
            if (prevHighlight) prevHighlight.classList.remove('tc-hw-active');
            const wordSpan = slideBodyRef.current.querySelector(`[data-wi="${target.domIdx}"]`);
            if (wordSpan) {
              wordSpan.classList.add('tc-hw-active');
              scrollIfHidden(wordSpan);
              prevHighlight = wordSpan;
              updateLiveVisualizer(wordSpan);
            }
          }
        }
      };

      // Method 2: Timer fallback (for browsers like Firefox that don't trigger per-word boundaries)
      let fallbackTimer = null;
      let fIdx = 0;
      const wordsPerSecond = 2.5 / utt.rate;
      const msPerWord = 1000 / wordsPerSecond;

      const startFallback = () => {
        if (boundaryFired || !slideBodyRef.current) return;
        console.log('[TTS] onboundary missing, using timer fallback');
        fallbackTimer = setInterval(() => {
          if (!slideBodyRef.current || fIdx >= spanMap.length) {
            clearInterval(fallbackTimer);
            return;
          }
          if (prevHighlight) prevHighlight.classList.remove('tc-hw-active');
          const wordSpan = slideBodyRef.current.querySelector(`[data-wi="${spanMap[fIdx].domIdx}"]`);
          if (wordSpan) {
            wordSpan.classList.add('tc-hw-active');
            scrollIfHidden(wordSpan);
            prevHighlight = wordSpan;
            updateLiveVisualizer(wordSpan);
          }
          fIdx++;
        }, msPerWord);
      };

      // Wait a generous 3 seconds for the TTS engine to start before assuming it's broken
      const fallbackStart = setTimeout(startFallback, 3000);

      const clearHighlights = () => {
        clearTimeout(fallbackStart);
        if (fallbackTimer) clearInterval(fallbackTimer);
        if (prevHighlight) prevHighlight.classList.remove('tc-hw-active');
        slideBodyRef.current?.querySelectorAll('.tc-hw-active').forEach(el => el.classList.remove('tc-hw-active'));
        setVoiceState('idle');
        resolve();
      };
      utt.onend = clearHighlights;
      utt.onerror = clearHighlights;
      window.speechSynthesis.speak(utt);
    });
  }, [lang, wrapWordsInDOM]);

  // ===== TEXT EXTRACTION UTILITIES =====

  // Extract text from PDF using pdf.js
  const extractPdfText = async (arrayBuffer) => {
    setExtractStatus('📄 Loading PDF...');
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    let fullText = '';
    let hasTextContent = false;

    for (let i = 1; i <= totalPages; i++) {
      setExtractStatus(`📄 Extracting page ${i}/${totalPages}...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');

      if (pageText.trim().length > 10) {
        hasTextContent = true;
      }
      fullText += `\n--- Page ${i} ---\n${pageText}\n`;
    }

    // If very little text was found, the PDF might be scanned/image-based — try OCR
    if (!hasTextContent && window.Tesseract) {
      setExtractStatus('🔍 Scanned PDF detected — running OCR...');
      fullText = '';

      for (let i = 1; i <= Math.min(totalPages, 10); i++) {
        setExtractStatus(`🔍 OCR processing page ${i}/${Math.min(totalPages, 10)}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        // Render page to canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;

        // OCR the canvas image
        const imageDataUrl = canvas.toDataURL('image/png');
        try {
          const result = await window.Tesseract.recognize(imageDataUrl, 'eng', {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setExtractStatus(`🔍 OCR page ${i}: ${Math.round(m.progress * 100)}%`);
              }
            }
          });
          fullText += `\n--- Page ${i} (OCR) ---\n${result.data.text}\n`;
        } catch (ocrErr) {
          console.warn('OCR failed for page', i, ocrErr);
          fullText += `\n--- Page ${i} ---\n[OCR failed]\n`;
        }

        canvas.remove();
      }
    }

    return fullText.trim();
  };

  // Extract text from DOCX using mammoth
  const extractDocxText = async (arrayBuffer) => {
    setExtractStatus('📝 Extracting DOCX content...');
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  };

  // Extract text from images using Tesseract.js OCR
  const extractImageText = async (file) => {
    if (!window.Tesseract) {
      setExtractStatus('⚠️ OCR not available');
      return '[OCR library not loaded]';
    }

    setExtractStatus('🖼️ Running OCR on image...');
    const imageUrl = URL.createObjectURL(file);

    try {
      const result = await window.Tesseract.recognize(imageUrl, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setExtractStatus(`🖼️ OCR: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      URL.revokeObjectURL(imageUrl);
      return result.data.text.trim();
    } catch (err) {
      URL.revokeObjectURL(imageUrl);
      console.warn('Image OCR failed:', err);
      return '[Image OCR failed]';
    }
  };

  // Auto-detect file content type
  const detectFileType = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('syllabus') || lower.includes('curriculum') || lower.includes('semester') || lower.includes('unit') || lower.includes('module')) {
      return 'syllabus';
    } else if (lower.includes('question') || lower.includes('answer') || lower.includes('?') || lower.includes('solve') || lower.includes('exam') || lower.includes('marks')) {
      return 'questions';
    }
    return 'concepts';
  };

  // ===== MAIN FILE HANDLER =====
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const name = file.name;
    const ext = name.split('.').pop().toLowerCase();
    setFileName(name);
    setUploadedFile(file);
    setExtracting(true);
    setExtractStatus('📂 Reading file...');

    try {
      let extractedText = '';

      // PDF files
      if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        extractedText = await extractPdfText(arrayBuffer);
      }
      // DOCX files
      else if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        extractedText = await extractDocxText(arrayBuffer);
      }
      // DOC files (old Word format) — try mammoth, fallback to text
      else if (ext === 'doc') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          extractedText = await extractDocxText(arrayBuffer);
        } catch {
          setExtractStatus('📝 Reading as plain text...');
          extractedText = await file.text();
        }
      }
      // Image files — OCR
      else if (['png', 'jpg', 'jpeg', 'bmp', 'webp', 'tiff', 'tif'].includes(ext)) {
        extractedText = await extractImageText(file);
      }
      // Plain text files (.txt, .md, .csv, .json, etc.)
      else {
        setExtractStatus('📝 Reading text file...');
        extractedText = await file.text();
      }

      if (!extractedText || extractedText.trim().length < 5) {
        setExtractStatus('⚠️ No text could be extracted');
        extractedText = '[File content could not be extracted. The file may be empty or in an unsupported format.]';
      }

      setFileContent(extractedText);
      setFileType(detectFileType(extractedText));
      setExtractStatus(`✅ Extracted ${extractedText.length.toLocaleString()} characters`);
    } catch (err) {
      console.error('File extraction error:', err);
      setExtractStatus('❌ Extraction failed — trying plain text...');
      try {
        const fallbackText = await file.text();
        setFileContent(fallbackText);
        setFileType(detectFileType(fallbackText));
        setExtractStatus(`⚠️ Fallback: ${fallbackText.length.toLocaleString()} chars (may contain artifacts)`);
      } catch {
        setFileContent('[Failed to extract file content]');
        setExtractStatus('❌ Could not read file');
      }
    } finally {
      setExtracting(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileContent('');
    setFileName('');
    setFileType('');
    setExtractStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ===== FETCH MEDIA (YouTube + Images) =====

  // YouTube Data API v3 — real video search
  const searchYouTube = async (query, maxResults = 3) => {
    if (!APP_YT_KEY) return [];
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        videoDuration: 'medium', // Completely eliminates YouTube Shorts!
        maxResults: maxResults.toString(),
        relevanceLanguage: lang === 'English' ? 'en' : lang.slice(0, 2).toLowerCase(),
        safeSearch: 'strict',
        key: APP_YT_KEY
      });
      const resp = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
      if (!resp.ok) throw new Error(`YT API ${resp.status}`);
      const data = await resp.json();
      return (data.items || []).map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description?.slice(0, 100),
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        channel: item.snippet.channelTitle
      }));
    } catch (err) {
      console.warn('YouTube API error:', err);
      return [];
    }
  };

  // Image search — Unsplash Source (free, no API key) + Wikimedia fallback
  const searchImages = async (query, limit = 3) => {
    const images = [];
    const cleanQuery = encodeURIComponent(query.replace(/[^\w\s]/g, '').trim());
    
    // Strategy 1: Unsplash Source — beautiful, highly relevant stock images (no API key needed)
    for (let i = 0; i < limit; i++) {
      images.push({
        url: `https://source.unsplash.com/600x400/?${cleanQuery}&sig=${Date.now() + i}`,
        alt: `${query} illustration ${i + 1}`
      });
    }

    // Strategy 2: Wikimedia Commons fallback (only if Unsplash fails to load)
    try {
      const searchParams = new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: `${query} diagram illustration`,
        srnamespace: '6',
        srlimit: '3',
        format: 'json',
        origin: '*'
      });
      const searchResp = await fetch(`https://commons.wikimedia.org/w/api.php?${searchParams}`);
      const searchData = await searchResp.json();
      const results = searchData.query?.search || [];

      for (const result of results.slice(0, 2)) {
        const title = result.title;
        const infoParams = new URLSearchParams({
          action: 'query',
          titles: title,
          prop: 'imageinfo',
          iiprop: 'url|mime',
          format: 'json',
          origin: '*'
        });
        const infoResp = await fetch(`https://commons.wikimedia.org/w/api.php?${infoParams}`);
        const infoData = await infoResp.json();
        const infoPages = infoData.query?.pages || {};
        for (const p of Object.values(infoPages)) {
          if (p.imageinfo?.[0]?.mime?.startsWith('image/') && !p.imageinfo[0].url.includes('.svg')) {
            images.push({
              url: p.imageinfo[0].url,
              alt: title.replace('File:', '').replace(/\.[^.]+$/, '').replace(/_/g, ' ')
            });
          }
        }
      }
    } catch (err) {
      console.warn('Wikimedia fallback error:', err);
    }

    return images.slice(0, limit + 2); // Return up to 5 images (3 Unsplash + 2 Wikimedia)
  };

  const fetchMediaForSlide = useCallback(async (slideTitle, slideContent) => {
    setMediaLoading(true);
    const result = { youtube: [], images: [], keyTerms: [] };

    try {
      // Extract key terms using Regex
      const boldWordsMatch = slideContent.match(/\*\*(.*?)\*\*/g) || [];
      const extractedTerms = [...new Set(boldWordsMatch.map(w => w.replace(/\*\*/g, '').trim()))];
      result.keyTerms = extractedTerms.filter(w => w.length > 2 && w.split(' ').length <= 3).slice(0, 5);

      const topKeyword = extractedTerms[0] || topic;
      const imageQuery = `${topic} ${slideTitle}`;

      // Global Session Video: Fetch exactly 1 long-form video per session globally
      if (!sessionVideoRef.current && APP_YT_KEY) {
        const searchQuery = `${subject} ${topic} full lecture -shorts`;
        const vids = await searchYouTube(`${searchQuery} ${lang !== 'English' ? lang : ''}`, 1);
        if (vids.length > 0) sessionVideoRef.current = vids;
      }
      
      result.youtube = sessionVideoRef.current || [];
      
      // Fetch relevant images using topic + slide title
      result.images = await searchImages(imageQuery, 3);

    } catch (e) {
      console.warn('Media fetch error:', e);
    }

    setMediaItems(result);
    setMediaLoading(false);
  }, [subject, topic, lang, APP_YT_KEY]);

  // ===== ARCHITECTURAL ROADMAP PROMPT =====
  const buildTeachingPrompt = (node, prevContext) => {
    return `Generate detailed explanation for node "${node.address}".
Title: ${node['in-content']}
Context: ${prevContext}
Ensure you strictly follow the roadmap context.`;
  };

  // ===== START CLASS =====
  const handleNewSession = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setPhase('idle');
    setTopic('');
    setSessionTitle('');
    setSessionTopic('');
    setSlides([]);
    setJsonStreamData('');
    setLoading(false);
    
    // Clear the roadmap iframe completely
    const frame = document.getElementById('roadmapFrame');
    if (frame?.contentWindow) {
      // Send clear message
      frame.contentWindow.postMessage({ type: 'CLEAR_ROADMAP' }, '*');
      frame.contentWindow.postMessage({ type: 'LOAD_ROADMAP', payload: [], isPartial: false }, '*');
      // Also directly clear the DOM inside the iframe as fallback
      try {
        const world = frame.contentDocument?.getElementById('world');
        if (world) {
          world.querySelectorAll('.block-node').forEach(n => n.remove());
          // Clear SVG arrows too
          const svg = frame.contentDocument?.querySelector('svg');
          if (svg) svg.innerHTML = '';
        }
      } catch(_) {}
    }
  };

  const startClass = async () => {
    if (!topic.trim()) return;
    const key = activeEngine === 'gemini' ? localKey.trim() : openRouterKey.trim();
    if (!key) { setShowSettings(true); return; }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Save the topic for the prompt, then clear the input field
    const currentTopic = topic.trim();
    setSessionTopic(currentTopic);
    setTopic('');
    setSessionTitle('');

    setPhase('loading');
    setJsonStreamData('');
    setSlides([]);
    activeRef.current = true;

    const fileContext = fileContent
      ? `\n\nAttached document: "${fileName}"\nContent: ${fileContent.slice(0, 1500)}\nUse this as primary source.`
      : '';

    const outlinePrompt = `You are creating a visual block-diagram interactive Roadmap for "${currentTopic}".
Return ONLY a JSON array representing the flow. Current year: 2026.

CRITICAL GRAPH FRACTURING RULES:
1. MAX DEPTH 1: A tree can ONLY consist of ONE Parent and its immediate direct children. 
2. FRACTURE SUB-TREES: If a child node (e.g. "B") needs its own children, DO NOT build it inside the same tree. You MUST create a completely separate, disconnected tree where "B" is the new parent. 
3. DUPLICATE WITH UNIQUE IDs: Because "B" appears as a child in Tree 1, and a parent in Tree 2, you MUST give them different 'address' IDs (e.g. "B_child" and "B_root") so the layout engine draws them as totally separate islands! Do not connect them!

MANDATORY TEXTBLOCK RULE:
- EVERY single block node MUST have AT LEAST ONE textblock connected to it.
- The textblock acts as the detailed explanation/sub-category for that block.
- Add the textblock's address to the block's "connect" array.
- The textblock should provide useful, educational content explaining the concept of its parent block.
- You can attach MULTIPLE textblocks to a single block if the topic needs it (e.g. "Definition", "Example", "Syntax").

MANDATORY CODE VISUALIZATION RULE:
- If the topic involves ANY coding example or algorithm (Python, Java, C, C++, C#, JavaScript, HTML, etc.), you MUST include these three connected blocks:
  1. Coder: {"type": "coder", "address": "coder_1", "group": "g1", "language": "python", "code": "full code here with newlines", "connect": ["viz_1"]}
  2. Visualizer: {"type": "visualizer", "address": "viz_1", "group": "g1", "coder_ref": "coder_1", "steps": [{"line": 1, "description": "What happens at this line", "variables": {"var_name": "value"}, "output": ""}, ...], "connect": ["out_1"]}
  3. Outputer: {"type": "outputer", "address": "out_1", "group": "g1", "visualizer_ref": "viz_1"}
- The "group" field MUST be the SAME string across all 3 blocks to link them.
- Each step in "steps" must have: "line" (1-indexed line number), "description" (what happens), "variables" (current state of all variables as key-value), "output" (what gets printed at this step, empty string if nothing).
- Include enough steps to trace through the FULL execution of the code with realistic sample input.
- Arrow connections between coder->visualizer->outputer are MANDATORY.

MANDATORY MATHBLOCK RULE:
- If the topic involves ANY mathematical problem, equation, physics formula, calculus, algebra, geometry, statistics, or numerical computation, you MUST include a mathblock.
- Mathblock: {"type": "mathblock", "address": "math_1", "title": "Solving [Problem Name]", "steps": [{"label": "Given", "content": "LaTeX expression"}, {"label": "Step 1", "content": "LaTeX expression"}, {"label": "Answer", "content": "LaTeX expression"}]}
- EVERY step "content" MUST use LaTeX notation for math expressions (e.g. \\frac{a}{b}, \\sqrt{x}, x^2, \\int, \\sum, \\alpha, \\beta, \\pi, \\theta, \\geq, \\leq, \\cdot, \\times, \\div, \\pm, \\infty, \\rightarrow, \\vec{F}, \\hat{i}).
- Use \\text{...} for plain text within LaTeX expressions.
- Steps should be detailed like a teacher's handwritten notes: show every substitution, simplification, and intermediate result.
- Use labels like: "Given", "Formula", "Step 1", "Step 2", "Substituting", "Simplifying", "Answer", "Verification".
- For physics: include units, dimensional analysis, and diagrams where possible.

MANDATORY DIABLOCK RULE (CRITICAL - DO NOT SKIP):
- If the topic mentions or relates to ANY of these keywords: array, linked list, list, tree, binary tree, BST, graph, stack, queue, heap, hash table, trie, sorting, bubble sort, merge sort, quick sort, insertion sort, searching, binary search, BFS, DFS, traversal, insertion, deletion, Dijkstra, pointer, node, data structure, algorithm — you MUST generate a diablock. FAILURE TO DO SO IS AN ERROR.
- Diablock: {"type": "diablock", "address": "dia_1", "title": "Algorithm/DS Name", "nodes": [{"id": "n1", "value": "10", "shape": "box|circle|diamond", "label": "optional"}], "edges": [{"from": "n1", "to": "n2", "type": "arrow|line|dashed", "label": "optional"}], "steps": [{"description": "What happens", "highlightNodes": ["n1"], "highlightEdges": [{"from": "n1", "to": "n2"}], "modifyNodes": [{"id": "n1", "newValue": "20", "action": "modify|add|remove"}]}]}
- EXAMPLE for "linked list": nodes=[{id:"h",value:"HEAD",shape:"diamond"},{id:"n1",value:"10",shape:"box"},{id:"n2",value:"20",shape:"box"},{id:"n3",value:"30",shape:"box"},{id:"t",value:"NULL",shape:"circle"}], edges=[{from:"h",to:"n1",type:"arrow"},{from:"n1",to:"n2",type:"arrow",label:"next"},{from:"n2",to:"n3",type:"arrow",label:"next"},{from:"n3",to:"t",type:"arrow",label:"next"}], steps showing traversal highlighting each node.
- Use "box" for array/list nodes, "circle" for tree/graph nodes, "diamond" for HEAD/decision points.
- Include at least 4-8 animation steps showing the full operation.

JSON STRUCTURE RULES:
- Block: {"type": "block", "address": "unique_id", "in-content": "Display Text", "shape": "square|circle", "explanation": "Short tooltip...", "connect": ["child_block_id", "textblock_id", ...]}
- Textblock (MANDATORY for each block): {"type": "textblock", "address": "tb_unique_id", "title": "Sub-category Title", "content": "Detailed multi-line explanation text here..."}
- Arrow (for EVERY connection): {"type": "arrow", "in-content": "relationship label", "first-connection": "parent_id", "next-connection": "child_id"}

CRITICAL REMINDER: If the topic is about data structures or algorithms, the JSON response MUST contain at least one diablock. If the topic has code, include coder+visualizer+outputer. If the topic has math, include mathblock.

Dense and accurate.${fileContext}
Return ONLY valid JSON array.`;

    try {
      let url, headers, payload;
      if (activeEngine === 'gemini') {
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${key}`;
        headers = { 'Content-Type': 'application/json' };
        payload = {
          systemInstruction: { parts: [{ text: 'Output valid JSON array ONLY representing a node graph. No markdown.' }] },
          contents: [{ role: 'user', parts: [{ text: outlinePrompt }] }]
        };
      } else {
        url = 'https://openrouter.ai/api/v1/chat/completions';
        headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
        payload = {
          model: 'arcee-ai/trinity-large-preview:free',
          messages: [
            { role: 'system', content: 'Output valid JSON array ONLY representing a node graph. No markdown.' },
            { role: 'user', content: outlinePrompt }
          ],
          stream: true
        };
      }

      const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), signal: abortControllerRef.current.signal });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`API Error (${resp.status}): ${errText.slice(0, 300)}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split('\n');
        buffer = lines.pop();

        for (let line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const chunk = JSON.parse(dataStr);
              let chunkText = '';
              if (activeEngine === 'gemini') {
                chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
              } else {
                chunkText = chunk.choices?.[0]?.delta?.content;
              }
              if (chunkText) {
                fullText += chunkText;
                setJsonStreamData(fullText);

                // === LIVE BLOCK RENDERING ===
                // Aggressive partial JSON parsing to render live nodes character-by-character
                try {
                  let clean = fullText.replace(/```json/gi, '').replace(/```/g, '').trim();
                  const firstBracket = clean.indexOf('[');
                  const lastBrace = clean.lastIndexOf('}');
                  
                  if (firstBracket !== -1 && lastBrace > firstBracket) {
                    // Force complete the array by slicing at the last fully closed object and adding ]
                    const partialStr = clean.substring(firstBracket, lastBrace + 1) + ']';
                    const partial = JSON.parse(partialStr);
                    if (Array.isArray(partial) && partial.length > 0) {
                      setSlides(partial);
                      const frame = document.getElementById('roadmapFrame');
                      if (frame?.contentWindow) {
                        frame.contentWindow.postMessage({ type: 'LOAD_ROADMAP', payload: partial, isPartial: true }, '*');
                      }
                    }
                  }
                } catch (_) { /* partial JSON not yet complete, skip */ }
              }
            } catch (_) { /* ignore partial SSE chunks */ }
          }
        }
      }

      // Final parse
      let parsed = null;
      try {
        let clean = fullText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const match = clean.match(/\[[\s\S]*\]/);
        if (match) parsed = JSON.parse(match[0]);
      } catch (_) {}

      if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
        setPhase('error'); return;
      }

      setSlides(parsed);
      setPhase('done');
      saveClass(currentTopic, parsed); // Save automatically to DB

      // Generate a summarized title for the session header
      try {
        const titleText = await fetchAI([
          { role: 'system', content: 'Generate a SHORT title (max 6 words) summarizing the topic. Return ONLY the title, no quotes or punctuation.' },
          { role: 'user', content: currentTopic.slice(0, 300) }
        ], 30);
        const cleanTitle = (titleText || '').replace(/^["'`#*]+|["'`#*]+$/g, '').trim();
        setSessionTitle(cleanTitle || currentTopic.slice(0, 40));
      } catch (_) {
        setSessionTitle(currentTopic.length > 40 ? currentTopic.slice(0, 37) + '...' : currentTopic);
      }
      
      const frame = document.getElementById('roadmapFrame');
      if (frame?.contentWindow) {
        frame.contentWindow.postMessage({ type: 'LOAD_ROADMAP', payload: parsed, isPartial: false }, '*');
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        console.log('[Classroom] Generation aborted by user.');
        return;
      }
      console.error('[Classroom] Fatal:', e);
      setJsonStreamData(`[ERROR] ${e.message}`);
      setPhase('error');
    }
  };

  const handleIframeLoad = (e) => {
    if (e.target && e.target.contentWindow) {
      if (slides.length > 0) {
        e.target.contentWindow.postMessage({ type: 'LOAD_ROADMAP', payload: slides }, '*');
      }
      e.target.contentWindow.postMessage({ type: 'SET_THEME', payload: theme }, '*');
    }
  };

  useEffect(() => {
    const frame = document.getElementById('roadmapFrame');
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: 'SET_THEME', payload: theme }, '*');
    }
  }, [theme]);

  // Forward mouse movements to iframe for particle glow tracking when hovering over React UI
  useEffect(() => {
    const handleMouseMove = (e) => {
      const frame = document.getElementById('roadmapFrame');
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'MOUSE_MOVE', payload: { x: e.clientX, y: e.clientY } }, '*');
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);



  // ===== DOUBT =====
  const askDoubt = async () => {
    if (!doubtText.trim()) return;
    const q = doubtText.trim();
    setDoubtText('');
    setDoubtAnswer('⏳ Thinking...');

    try {
      const answer = await fetchAI([
        { role: 'system', content: `Expert ${subject} teacher. Answer student's doubt about "${topic}" using the structured Block format. If it's a theory doubt: Block 1 (Topic) → Block 2 (Definition) → Block 3 (Explanation) → Block 4 (Why It Matters). If it's a code doubt: Block 1 (Goal) → Block 2 (Line-by-Line with → arrows) → Block 3 (Dry Run) → Block 4 (Key Insight). Use 📌 for key info, 💡 for tips. Be thorough but concise. Language: ${lang}.` },
        { role: 'user', content: q }
      ]);
      setDoubtAnswer(answer);
      classNotesRef.current.push({ slideIdx: currentSlideIdx, title: `❓ Doubt: ${q}`, content: answer, timestamp: new Date().toLocaleTimeString() });
    } catch (e) {
      setDoubtAnswer('Failed to get answer. Try again.');
    }
  };

  // ===== PDF DOWNLOAD =====
  const downloadPDF = () => {
    const notes = slideContents.getAll();
    if (notes.length === 0) { alert('No notes to download!'); return; }

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${subject} - ${topic} | Mean AI Classroom</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background: #fff; color: #1a1a1a; padding: 40px; line-height: 1.7; }
      .cover { text-align: center; padding: 60px 20px; border-bottom: 3px solid #e8913a; margin-bottom: 40px; }
      .cover h1 { font-size: 2.4rem; color: #e8913a; margin-bottom: 8px; }
      .cover h2 { font-size: 1.5rem; color: #333; font-weight: 400; }
      .cover p { color: #888; margin-top: 12px; font-size: 0.9rem; }
      .cover .method { display: inline-block; background: #fef3e2; color: #e8913a; padding: 6px 16px; border-radius: 6px; font-weight: 600; margin-top: 16px; font-size: 0.85rem; }
      .slide { page-break-inside: avoid; margin-bottom: 36px; border-left: 4px solid #e8913a; padding-left: 20px; }
      .slide h2 { font-size: 1.4rem; color: #e8913a; margin-bottom: 6px; }
      .slide .time { font-size: 0.75rem; color: #aaa; margin-bottom: 12px; }
      .slide .content { font-size: 0.95rem; white-space: pre-wrap; }
      .slide .content h1, .slide .content h2, .slide .content h3 { color: #e8913a; margin: 12px 0 6px; }
      .slide .content pre { background: #f4f4f4; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; margin: 8px 0; }
      .slide .content code { font-family: 'Fira Code', 'Consolas', monospace; }
      .footer { text-align: center; padding-top: 30px; border-top: 1px solid #eee; color: #bbb; font-size: 0.8rem; margin-top: 40px; }
      @media print { body { padding: 20px; } .slide { page-break-inside: avoid; } }
    </style></head><body>
    <div class="cover">
      <h1>${topic}</h1>
      <h2>${subject} • ${level} Level</h2>
      <p>Generated by Mean AI Classroom • ${new Date().toLocaleDateString()} • Duration: ${duration} min • Language: ${lang}</p>
      <p>Student: ${user?.name || 'Student'}</p>
      <div class="method">📐 Teaching Method: D.S.E.C.A.R Framework</div>
    </div>`;

    notes.forEach((note) => {
      let content = note.content;
      content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>');
      content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>');
      content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>');
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
      content = content.replace(/`(.*?)`/g, '<code>$1</code>');
      content = content.replace(/\n/g, '<br>');

      html += `<div class="slide">
        <h2>${note.slide.title}</h2>
        <div class="time">⏱ ${new Date().toLocaleTimeString()}</div>
        <div class="content">${content}</div>
      </div>`;
    });

    html += `<div class="footer">📚 Generated with ❤️ by Mean AI Classroom (Block-Based Teaching) — ${new Date().toLocaleString()}</div></body></html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 800);
  };

  // ===== END CLASS =====
  const endClass = () => {
    activeRef.current = false;
    clearInterval(timerRef.current);
    window.speechSynthesis?.cancel();
    setVoiceState('idle');
    setPhase('complete');
  };

  const handleClose = () => {
    activeRef.current = false;
    clearInterval(timerRef.current);
    window.speechSynthesis?.cancel();
    setPhase('setup');
    setSlides([]);
    setSlideContents(new SlideCache());
    classNotesRef.current = [];
    setMediaItems([]);
    removeFile();
    onClose();
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const renderMarkdown = (text) => {
    if (!text) return '';
    if (window.marked) {
      return window.marked.parse(text, { breaks: true, headerIds: false, mangle: false });
    }
    return text.replace(/\n/g, '<br>');
  };

  // Split markdown into sections by ## headers and wrap each in a reveal block
  const renderBlockRevealHtml = (text) => {
    if (!text) return '';
    // Split raw markdown by ## headers
    const sections = text.split(/(?=^## )/m).filter(s => s.trim());
    if (sections.length <= 1) {
      return `<div class="tc-block-reveal">${renderMarkdown(text)}</div>`;
    }
    return sections.map(section => {
      let cls = 'tc-block-reveal';
      const low = section.toLowerCase();
      if (low.includes('line-by-line')) cls += ' tc-expl-container';
      if (low.includes('dry run') || low.includes('step-by-step')) cls += ' tc-dyn-table';
      return `<div class="${cls}">${renderMarkdown(section)}</div>`;
    }).join('');
  };

  const currentContent = slideContents.has(currentSlideIdx)
    ? slideContents.get(currentSlideIdx)
    : null;

  // Memoize the HTML so React doesn't forcefully overwrite our word-highlighting DOM spans every 1s when timeLeft updates
  const currentHtml = React.useMemo(() => {
    return currentContent ? renderBlockRevealHtml(currentContent.content) : '';
  }, [currentContent?.content]);

  // Generate particle grid (coordinate-positioned tiny particles)
  const particles = React.useMemo(() => {
    const pts = [];
    const cols = 25;
    const rows = 18;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        pts.push({
          left: `${(c / cols) * 100 + (Math.random() * 2 - 1)}%`,
          top: `${(r / rows) * 100 + (Math.random() * 2 - 1)}%`,
        });
      }
    }
    return pts;
  }, []);

  if (!isOpen) return null;

  // ===== UNIFIED CANVAS WORKSPACE =====
  return (
    <div className="tc-overlay" style={{ background: 'var(--bg-dark)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleClose} style={{ background: 'var(--hover-bg)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <i className="fas fa-arrow-left" />
          </button>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '15px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sessionTitle || 'Mean AI • Canvas'}
          </span>
          <button 
            onClick={() => setShowClassList(!showClassList)} 
            style={{ marginLeft: '10px', background: showClassList ? 'var(--text-primary)' : 'var(--hover-bg)', color: showClassList ? 'var(--bg-dark)' : 'var(--text-primary)', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fas fa-layer-group" /> Collection
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={handleNewSession}
            style={{ background: 'var(--hover-bg)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
            title="New session"
          >
            <i className="fas fa-plus" /> New
          </button>
          <button onClick={() => setShowSettings(true)} style={{ background: 'var(--hover-bg)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}>
            <i className="fas fa-cog" />
          </button>
        </div>
      </header>

      {/* Class Collection Side Panel */}
      {showClassList && (
        <div style={{
          position: 'absolute', top: '70px', left: '20px', width: '320px', bottom: '100px',
          background: 'rgba(18, 18, 20, 0.97)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px', zIndex: 11, overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>
               Saved Classes
            </span>
            <button onClick={() => setShowClassList(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <i className="fas fa-times" />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
            {classes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#7d8590', fontSize: '13px' }}>
                <i className="fas fa-folder-open" style={{ fontSize: '24px', opacity: 0.5, marginBottom: '10px', display: 'block' }}/>
                No classes saved yet.
              </div>
            ) : (
              classes.map(cls => (
                <div key={cls.class_id} style={{
                  background: 'var(--hover-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--input-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                onClick={() => {
                   if (cls.slides && Array.isArray(cls.slides)) {
                      setSlides(cls.slides);
                      setPhase('done');
                      const frame = document.getElementById('roadmapFrame');
                      if (frame && frame.contentWindow) {
                         frame.contentWindow.postMessage({ type: 'LOAD_ROADMAP', payload: cls.slides }, '*');
                      }
                      setShowClassList(false);
                   }
                }}>
                  <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '13px', marginBottom: '4px' }}>{cls.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#7d8590' }}>
                      {new Date(cls.created_at).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteClass(cls.class_id); }}
                      style={{ background: 'transparent', border: 'none', color: '#ff4444', opacity: 0.7, cursor: 'pointer' }}
                    ><i className="fas fa-trash-alt"/></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Canvas iframe - Loaded via srcDoc to bypass Vercel domain redirect blocks */}
      {iframeSrcDoc && (
        <iframe id="roadmapFrame" srcDoc={iframeSrcDoc}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', zIndex: 1 }}
          title="Canvas" onLoad={handleIframeLoad} />
      )}

      {/* Agent Log — left panel (visible when generating or error) */}
      {(phase === 'loading' || phase === 'error') && (
        <div style={{
          position: 'absolute', top: '70px', left: '16px', width: isAgentLogExpanded ? '400px' : 'auto',
          background: 'var(--card-bg)', border: '1px solid var(--border-color)',
          borderRadius: '12px', zIndex: 10, overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.8)' // Solid bg + shadow fixes Chromium composite flickering
        }}>
          <div 
             style={{ padding: '10px 14px', borderBottom: isAgentLogExpanded ? '1px solid var(--border-color)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '16px' }}
             onClick={() => setIsAgentLogExpanded(!isAgentLogExpanded)}
             title={isAgentLogExpanded ? "Hide Logs" : "Show Agent Logs"}
          >
            <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-terminal" style={{ color: '#10b981' }}/> Agent Log
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {phase === 'loading' && <span className="tc-loading-spinner" style={{ margin: 0, width: '14px', height: '14px', opacity: isAgentLogExpanded ? 1 : 0.6 }} />}
              {phase === 'error' && <span style={{ color: '#ff4d4f', fontSize: '12px' }}>⚠️ Error</span>}
              <button 
                onClick={(e) => { e.stopPropagation(); setIsAgentLogExpanded(!isAgentLogExpanded); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                <i className={`fas fa-chevron-${isAgentLogExpanded ? 'up' : 'down'}`} />
              </button>
            </div>
          </div>
          {isAgentLogExpanded && (
            <div style={{ padding: '14px', color: 'var(--text-secondary)', fontFamily: 'SFMono-Regular, Consolas, monospace', fontSize: '11px', whiteSpace: 'pre-wrap', maxHeight: '420px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
              {jsonStreamData || 'Waiting for generation...'}
              {phase === 'loading' && <span className="cursor-blink" style={{ color: '#10b981', fontWeight: 'bold' }}>|</span>}
            </div>
          )}
        </div>
      )}

      {/* Bottom Floating Prompt Bar */}
      <div style={{
        position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
        width: '90%', maxWidth: '720px', background: 'var(--input-bg)',
        border: '1px solid var(--border-color)', borderRadius: '32px', zIndex: 10,
        padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '10px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '15px', outline: 'none', fontWeight: 500 }}
            placeholder="What would you like to change or create?"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && topic.trim() && phase !== 'loading') startClass(); }}
            disabled={phase === 'loading'}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', transition: 'transform 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='var(--text-primary)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-secondary)'}>
              <i className="fas fa-plus" />
            </button>
            <label style={{ cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='var(--text-primary)'} onMouseOut={e=>e.currentTarget.style.color='var(--text-secondary)'}>
              <i className="fas fa-paperclip" /> {uploadedFile ? fileName : ''}
              <input type="file" onChange={handleFileUpload} accept=".txt,.md,.pdf,.doc,.docx" hidden disabled={phase==='loading'}/>
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setActiveEngine('gemini')}
                style={{ background: activeEngine === 'gemini' ? 'var(--hover-bg)' : 'transparent', border: 'none', color: activeEngine === 'gemini' ? 'var(--text-primary)' : 'var(--text-secondary)', padding: '6px 10px', fontSize: '12px', fontWeight: activeEngine === 'gemini' ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <i className="fas fa-gem" style={{ color: '#0A84FF', marginRight: '6px' }}/> Gemini
              </button>
              <button 
                onClick={() => setActiveEngine('arcee')}
                style={{ background: activeEngine === 'arcee' ? 'var(--hover-bg)' : 'transparent', border: 'none', color: activeEngine === 'arcee' ? 'var(--text-primary)' : 'var(--text-secondary)', padding: '6px 10px', fontSize: '12px', fontWeight: activeEngine === 'arcee' ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <i className="fas fa-brain" style={{ color: '#5E5CE6', marginRight: '6px' }}/> Arcee
              </button>
            </div>
            {phase === 'loading' ? (
              <button
                onClick={() => {
                   if (abortControllerRef.current) abortControllerRef.current.abort();
                   setPhase('idle');
                }}
                style={{
                  background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                  cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', boxShadow: '0 4px 12px rgba(255, 69, 58, 0.4)'
                }}
              >
                <i className="fas fa-stop" style={{ fontSize: '11px' }}/>
              </button>
            ) : (
              <button
                onClick={startClass}
                disabled={!topic.trim()}
                style={{
                  background: topic.trim() ? 'linear-gradient(135deg, var(--accent), var(--accent-light))' : 'var(--hover-bg)',
                  color: topic.trim() ? '#fff' : 'var(--text-muted)',
                  border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                  cursor: topic.trim() ? 'pointer' : 'default',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  boxShadow: topic.trim() ? 'var(--shadow-glow)' : 'none'
                }}
              >
                <i className="fas fa-arrow-up" style={{ fontSize: '13px' }}/>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowSettings(false)}
        >
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '28px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px', fontSize: '16px' }}><i className="fas fa-key" style={{ color: '#e8913a', marginRight: '8px' }}/>Gemini API Key</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 8px' }}>Get your free key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: '#0a84ff' }}>Google AI Studio</a></p>
              <input
                type="password"
                placeholder="AIza..."
                value={localKey}
                onChange={e => saveKey(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px', fontSize: '16px' }}><i className="fas fa-star" style={{ color: '#5e5ce6', marginRight: '8px' }}/>OpenRouter API Key</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 8px' }}>For Arcee Model: <span style={{ color: 'var(--text-muted)' }}>arcee-ai/trinity-large-preview:free</span></p>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={openRouterKey}
                onChange={e => saveOpenRouterKey(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '10px' }}>
              <button onClick={() => setShowSettings(false)} style={{ padding: '8px 20px', background: 'var(--text-primary)', color: 'var(--bg-dark)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Done</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

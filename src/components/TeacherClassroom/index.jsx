import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import './TeacherClassroom.css';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const MODEL = 'qwen/qwen3-coder:free';
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
  const { apiKey, user } = useApp();
  const [phase, setPhase] = useState('setup');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('high');
  const [duration, setDuration] = useState(30);
  const [lang, setLang] = useState('English');

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
  const setLoading = useCallback((val) => { isLoadingRef.current = val; _setLoading(val); }, []);
  const fetchingRefs = useRef(new Set());
  const [showDoubt, setShowDoubt] = useState(false);
  const [doubtText, setDoubtText] = useState('');
  const [doubtAnswer, setDoubtAnswer] = useState('');

  // Right panel — YouTube videos & images
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);

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
      const isGeminiKey = apiKey && apiKey.startsWith('AIza');
      const url = isGeminiKey 
        ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' 
        : 'https://openrouter.ai/api/v1/chat/completions';
      const activeModel = isGeminiKey ? 'gemini-2.0-flash' : MODEL;

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: activeModel, messages, stream: false, max_tokens: maxTokens })
      });
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content && retryCount > 0) {
        // Rate limit hit or bad response on free model. Pause and retry automatically.
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
  }, [apiKey]);

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

  // ===== STRUCTURED BLOCK-BASED TEACHING PROMPT =====
  const buildTeachingPrompt = (slide, prevContext) => {
    const fileContext = fileContent
      ? `\nDOCUMENT: "${fileName}" (${fileType})\n${fileContent.slice(0, 1200)}\nUse this as primary reference.`
      : '';

    return `${subject} teacher explaining "${slide.title}" — ${slide.subtitle} for ${level} level.
Points: ${slide.points.join(', ')}
${prevContext ? `Context: ${prevContext.slice(0, 200)}` : ''}${fileContext}

FOR THEORY — use these ## sections:
## Topic Name | ## Definition (max 20 words) | ## Core Explanation (step-by-step) | ## Why It Matters | ## Examples (2+) | ## Summary

FOR CODE — use these ## sections:
## Goal (1-2 lines) | ## The Code (full code block)
## Line-by-Line Explanation ← THIS MUST BE THE LONGEST SECTION
For EVERY line: → \`code\` then **What:** / **Why:** / **Effect:**
NEVER skip any line. Not even print() or assignments.
## Dry Run (table with variables at each step)
## Output (exact output + how each line was produced)
## Key Insight (1-2 sentences)

RULES: Use natural ## titles (NOT "Block 1"). Use → arrows for code lines. Use tables for dry runs. Be thorough with code explanations.
Markdown output.`;
  };

  // ===== START CLASS =====
  const startClass = async () => {
    if (!subject.trim() || !topic.trim()) { alert('Fill subject and topic!'); return; }
    setPhase('loading');
    activeRef.current = true;
    classNotesRef.current = [];
    sessionVideoRef.current = null;
    setSlideContents(new SlideCache());
    setTimeLeft(duration * 60);
    setMediaItems([]);

    const fileContext = fileContent
      ? `\n\nThe student has attached a ${fileType} document: "${fileName}"\nContent: ${fileContent.slice(0, 1500)}\n\nUse this document as the primary source.`
      : '';

    const outlinePrompt = `Expert ${subject} teacher. Create a slide outline for "${topic}" at ${level} level.
${fileContext}

Return ONLY a JSON array. Each slide: {"title": "...", "subtitle": "...", "points": ["..."]}

Generate 3-5 slides: Introduction, Core (1-2), Examples, Summary.
${fileContent ? 'Use the attached document.' : ''}
Return ONLY the JSON array.`;

    try {
      const content = await fetchAI([{ role: 'user', content: outlinePrompt }], 800);
      console.log('[Classroom] Outline response:', content?.slice(0, 200));
      
      let parsed = null;
      try {
        // Strip markdown backticks if present
        let cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        // Extract array from first [ to last ]
        const match = cleanContent.match(/\[[\s\S]*\]/);
        if (match) parsed = JSON.parse(match[0]);
      } catch (parseErr) {
        console.warn('[Classroom] JSON parse failed:', parseErr);
        console.log('[Classroom] Attempted to parse:', content);
      }
      
      if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
        console.warn('[Classroom] Using fallback slides');
        parsed = [
          { title: 'Introduction', subtitle: `Overview of ${topic}`, points: ['What is it?', 'Why is it important?', 'Prerequisites'] },
          { title: 'Core Concepts', subtitle: 'Fundamental ideas', points: ['Concept 1', 'Concept 2'] },
          { title: 'Examples', subtitle: 'Real-world applications', points: ['Example 1', 'Example 2'] },
          { title: 'Summary', subtitle: 'Key takeaways', points: ['Recap', 'Next steps'] },
        ];
      }
      
      setSlides(parsed);
      setCurrentSlideIdx(0);

      // Load first slide content — but DON'T block on it
      try {
        await loadSlideContent(parsed, 0);
      } catch (slideErr) {
        console.warn('[Classroom] First slide load failed:', slideErr);
      }
      
      if (!activeRef.current) return;

      setPhase('presenting');

      // Start timer (pauses when buffering)
      timerRef.current = setInterval(() => {
        if (!isLoadingRef.current) {
          setTimeLeft(prev => { if (prev <= 1) { endClass(); return 0; } return prev - 1; });
        }
      }, 1000);
    } catch (e) {
      console.error('[Classroom] Fatal error:', e);
      alert('Failed to generate outline. Check your API key.');
      setPhase('setup');
    }
  };

  // ===== LOAD SLIDE CONTENT =====
  const loadSlideContent = async (slideData, idx) => {
    if (!activeRef.current || idx >= slideData.length) return;
    setLoading(true);

    const slide = slideData[idx];
    const prevContext = classNotesRef.current.slice(-2).map(n => n.content).join('\n');

    const explainPrompt = buildTeachingPrompt(slide, prevContext);

    try {
      let content = await fetchAI([
        { role: 'system', content: `You are a ${subject} teacher who explains code LINE BY LINE like a real classroom instructor. CRITICAL RULE: When there is ANY code, you MUST explain EVERY SINGLE LINE using → arrows. The line-by-line Block 3 must be the LONGEST section. NEVER just show code and output — the explanation between code and output IS the lesson. For each line write: → \`code\` then What/Why/Effect. Then do a dry run table. Then show output. Level: ${level}.` },
        { role: 'user', content: explainPrompt }
      ], 3000);
      
      // Fallback if the Free API completely drops the request even after retries
      if (!content || content.trim() === '') {
        content = "## ⚠️ AI API Rate Limit Reached\n\nThe free AI provider (OpenRouter) is currently dropping requests due to high network traffic on your API Key.\n\n👉 **What to do:** Slide content will retry automatically in the background, or you can skip to the next slide.";
      }

      // Cache the content safely
      setSlideContents(prevCache => {
        const newCache = new SlideCache();
        newCache.map = new Map(prevCache.map);
        newCache.set(idx, { slide, content, explained: false });
        return newCache;
      });

      classNotesRef.current.push({
        slideIdx: idx,
        title: slide.title,
        content: content,
        timestamp: new Date().toLocaleTimeString()
      });

      setLoading(false);
      setCurrentSlideIdx(idx);

      // Auto-scroll content
      setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);

      // Fetch media for right panel
      fetchMediaForSlide(slide.title, content);

      // Trigger background buffering for the next slide automatically
      prefetchNextSlide(slideData, idx);

      // Non-blocking TTS (Reads actual slide content, saving an API call!)
      if (activeRef.current) speakText(content);
    } catch (e) {
      setLoading(false);
    }
  };

  // ===== BACKGROUND PREFETCH =====
  const prefetchNextSlide = async (slidesArray, currentIndex) => {
    const nextIdx = currentIndex + 1;
    if (!activeRef.current || nextIdx >= slidesArray.length) return;
    
    // If it's already cached or actively fetching, try the next one
    if (slideContents.has(nextIdx) || fetchingRefs.current.has(nextIdx)) {
      prefetchNextSlide(slidesArray, nextIdx);
      return;
    }

    fetchingRefs.current.add(nextIdx);
    
    // Minimal pause before prefetch
    await new Promise(r => setTimeout(r, 300));
    if (!activeRef.current) return;

    const slide = slidesArray[nextIdx];
    const prevContext = classNotesRef.current.slice(-2).map(n => n.content).join('\n');
    const explainPrompt = buildTeachingPrompt(slide, prevContext);

    try {
      let content = await fetchAI([
        { role: 'system', content: `Expert ${subject} teacher. CRITICAL: For ANY code, you MUST explain EVERY LINE using → arrows with What/Why/Effect for each. Block 3 (Line-by-Line) must be the LONGEST block. NEVER skip any line — not even print statements or variable assignments. Do a full dry run with a table. Then show how output is produced step by step.` },
        { role: 'user', content: explainPrompt }
      ], 3000);
      
      if (!content || content.trim() === '') {
        content = "## ⚠️ AI API Rate Limit Reached\n\nThe free AI provider (OpenRouter) is currently dropping requests due to high network traffic on your API Key.\n\n👉 **What to do:** Reload the classroom to retry.";
      }
      
      if (activeRef.current) {
        setSlideContents(prevCache => {
          const newCache = new SlideCache();
          newCache.map = new Map(prevCache.map);
          newCache.set(nextIdx, { slide, content, explained: false });
          return newCache;
        });
        
        // Auto-prefetch the slide after this one
        prefetchNextSlide(slidesArray, nextIdx);
      }
    } catch (e) {
      console.warn('Background prefetch failed:', e);
    } finally {
      fetchingRefs.current.delete(nextIdx);
    }
  };

  // ===== NAVIGATION =====
  const nextSlide = () => {
    if (currentSlideIdx < slides.length - 1) {
      const next = currentSlideIdx + 1;
      window.speechSynthesis?.cancel();
      if (slideContents.has(next)) {
        setCurrentSlideIdx(next);
        // Re-fetch media for this slide
        const cached = slideContents.get(next);
        if (cached) {
          fetchMediaForSlide(cached.slide.title, cached.content);
          if (activeRef.current) speakText(cached.content);
        }
        setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      } else {
        loadSlideContent(slides, next);
      }
    }
  };

  const prevSlide = () => {
    if (currentSlideIdx > 0) {
      window.speechSynthesis?.cancel();
      const prev = currentSlideIdx - 1;
      setCurrentSlideIdx(prev);
      const cached = slideContents.get(prev);
      if (cached) {
        fetchMediaForSlide(cached.slide.title, cached.content);
        if (activeRef.current) speakText(cached.content);
      }
      setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

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

  // ===== SETUP SCREEN =====
  if (phase === 'setup') {
    return (
      <div className="tc-overlay">
        <div className="tc-setup-card">
          <button className="tc-close-x" onClick={handleClose}><i className="fas fa-times" /></button>
          <div className="tc-setup-top">
            <div className="tc-setup-emoji">🏫</div>
            <h2>AI Classroom</h2>
            <p>Start an interactive lesson with structured Block-Based teaching</p>
            <div className="tc-method-badge">
              <span>📐</span> Block 1 → Block 2 → Block 3 → Block 4 → Block 5 → Block 6
            </div>
          </div>
          <div className="tc-setup-form">
            <div className="tc-field">
              <label>📚 Subject</label>
              <input placeholder="e.g. Computer Science" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="tc-field">
              <label>📖 Topic</label>
              <input placeholder="e.g. Binary Search Trees" value={topic} onChange={e => setTopic(e.target.value)} />
            </div>

            {/* File Upload Section — OPTIONAL */}
            <div className="tc-field">
              <label>📎 Attach File <span className="tc-label-optional">— Optional</span></label>
              <span className="tc-label-hint-block">Upload a syllabus, concepts, questions, or snap a photo</span>
              <div className="tc-file-upload-area">
                {extracting ? (
                  <div className="tc-file-extracting">
                    <div className="tc-extract-spinner" />
                    <span className="tc-extract-status">{extractStatus}</span>
                  </div>
                ) : uploadedFile ? (
                  <div className="tc-file-attached">
                    <div className="tc-file-info">
                      <i className={`fas ${
                        fileName.endsWith('.pdf') ? 'fa-file-pdf' :
                        fileName.endsWith('.docx') || fileName.endsWith('.doc') ? 'fa-file-word' :
                        ['png','jpg','jpeg','bmp','webp'].some(e => fileName.toLowerCase().endsWith(e)) ? 'fa-file-image' :
                        'fa-file-alt'
                      }`} />
                      <div className="tc-file-details">
                        <span className="tc-file-name">{fileName}</span>
                        <div className="tc-file-meta-row">
                          <span className="tc-file-type-badge">{fileType || 'document'}</span>
                          {extractStatus && <span className="tc-extract-result">{extractStatus}</span>}
                        </div>
                      </div>
                    </div>
                    <button className="tc-file-remove" onClick={removeFile}>
                      <i className="fas fa-times" />
                    </button>
                  </div>
                ) : (
                  <div className="tc-upload-options">
                    {/* File picker — documents & images */}
                    <label className="tc-file-dropzone" htmlFor="tc-file-input">
                      <i className="fas fa-cloud-upload-alt" />
                      <span>Upload File</span>
                      <span className="tc-file-hint">PDF, DOCX, TXT, Images</span>
                      <input
                        ref={fileInputRef}
                        id="tc-file-input"
                        type="file"
                        accept=".txt,.md,.text,.csv,.json,.pdf,.doc,.docx,.png,.jpg,.jpeg,.bmp,.webp,.tiff,.tif,image/*"
                        onChange={handleFileUpload}
                        hidden
                      />
                    </label>

                    {/* Camera capture — for mobile/Android */}
                    <label className="tc-camera-btn" htmlFor="tc-camera-input">
                      <i className="fas fa-camera" />
                      <span>Scan / Camera</span>
                      <span className="tc-file-hint">Take photo & OCR</span>
                      <input
                        id="tc-camera-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        hidden
                      />
                    </label>
                  </div>
                )}
              </div>
              {uploadedFile && !extracting && (
                <div className="tc-file-type-selector">
                  <span>Content type:</span>
                  <button className={fileType === 'syllabus' ? 'active' : ''} onClick={() => setFileType('syllabus')}>📋 Syllabus</button>
                  <button className={fileType === 'concepts' ? 'active' : ''} onClick={() => setFileType('concepts')}>📖 Concepts</button>
                  <button className={fileType === 'questions' ? 'active' : ''} onClick={() => setFileType('questions')}>❓ Questions</button>
                </div>
              )}
            </div>

            <div className="tc-field-row">
              <div className="tc-field">
                <label>🎯 Level</label>
                <select value={level} onChange={e => setLevel(e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="high">High School</option>
                  <option value="college">College</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="tc-field">
                <label>🌐 Language</label>
                <select value={lang} onChange={e => setLang(e.target.value)}>
                  {['English','Hindi','Telugu','Tamil','Kannada','Malayalam','Marathi','Bengali','Gujarati'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="tc-field">
              <label>⏱ Duration: {duration} min</label>
              <input type="range" min="5" max="120" value={duration} onChange={e => setDuration(+e.target.value)} />
            </div>

            <button className="tc-start-btn" onClick={startClass}>
              <i className="fas fa-play" /> Start Lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== LOADING =====
  if (phase === 'loading') {
    return (
      <div className="tc-overlay">
        <div className="tc-loading-card">
          <div className="tc-loading-spinner" />
          <h3>Preparing your structured lesson...</h3>
          <p>Generating slides for <strong>{topic}</strong></p>
          <p className="tc-loading-hint">It may take 4 - 7 mins to generate all blocks</p>
          {uploadedFile && <p className="tc-loading-file">📎 Processing: {fileName}</p>}
        </div>
      </div>
    );
  }

  // ===== COMPLETE =====
  if (phase === 'complete') {
    return (
      <div className="tc-overlay">
        <div className="tc-complete-card">
          <div className="tc-complete-emoji">🎓</div>
          <h2>Class Complete!</h2>
          <p>Great job, {user?.name || 'Student'}! You covered {slides.length} slides on <strong>{topic}</strong> using the Block-Based teaching method.</p>
          <div className="tc-complete-actions">
            <button className="tc-download-btn" onClick={downloadPDF}>
              <i className="fas fa-file-pdf" /> Download Notes (PDF)
            </button>
            <button className="tc-restart-btn" onClick={() => { setPhase('setup'); setSlides([]); setMediaItems([]); }}>
              <i className="fas fa-redo" /> Start New Lesson
            </button>
            <button className="tc-close-btn" onClick={handleClose}>
              <i className="fas fa-times" /> Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== PRESENTING — SPLIT BOARD =====

  return (
    <div className="tc-overlay tc-presentation">
      {/* Particle Grid Background */}
      <div className="tc-particle-grid">
        {particles.map((p, i) => (
          <div key={i} className="tc-particle" style={{ left: p.left, top: p.top }} />
        ))}
      </div>

      {/* Header */}
      <header className="tc-pres-header">
        <button className="tc-pres-back" onClick={handleClose}><i className="fas fa-arrow-left" /></button>
        <div className="tc-pres-info">
          <span className="tc-pres-subject">{subject}</span>
          <span className="tc-pres-topic">{topic}</span>
        </div>
        <div className="tc-pres-method-badge">Block Teaching</div>
        <div className="tc-pres-meta">
          <span className={`tc-pres-timer ${timeLeft < 120 ? 'warn' : ''}`}>
            <i className="fas fa-clock" /> {formatTime(timeLeft)}
          </span>
          <span className="tc-pres-slide-num">
            {currentSlideIdx + 1}/{slides.length}
          </span>
          {voiceState === 'speaking' && <span className="tc-pres-speaking">🔊</span>}
        </div>
      </header>

      {/* Slide Progress Bar */}
      <div className="tc-progress-bar">
        {slides.map((_, i) => (
          <div key={i} className={`tc-progress-dot ${i === currentSlideIdx ? 'active' : i < currentSlideIdx ? 'done' : ''}`}
            onClick={() => { if (slideContents.has(i)) { setCurrentSlideIdx(i); window.speechSynthesis?.cancel(); const cached = slideContents.get(i); if (cached) fetchMediaForSlide(cached.slide.title, cached.content); } }}
          />
        ))}
      </div>

      {/* ===== SPLIT BOARD ===== */}
      <div className="tc-split-board">
        {/* LEFT COLUMN — D.S.E.C.A.R Content */}
        <div className="tc-board-left" ref={contentRef}>
          {loading ? (
            <div className="tc-pres-loading">
              <div className="tc-loading-spinner small" />
              <p>Generating block-by-block explanation...</p>
            </div>
          ) : currentContent ? (
            <div className="tc-pres-slide">
              <div className="tc-slide-title-bar">
                <div className="tc-slide-title-row">
                  <span className="tc-slide-badge">Slide {currentSlideIdx + 1}</span>
                  <span className="tc-dsecar-badge">📐 Block Teaching</span>
                </div>
                <h1 className="tc-slide-title">{currentContent.slide.title}</h1>
                {currentContent.slide.subtitle && (
                  <p className="tc-slide-subtitle">{currentContent.slide.subtitle}</p>
                )}
              </div>
              <StaticSlideBody html={currentHtml} innerRef={slideBodyRef} />
            </div>
          ) : (
            <div className="tc-pres-loading"><p>No content available</p></div>
          )}

          {/* Doubt Answer */}
          {doubtAnswer && (
            <div className="tc-doubt-answer">
              <h4>💬 Answer</h4>
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(doubtAnswer) }} />
              <button onClick={() => setDoubtAnswer('')}><i className="fas fa-times" /> Dismiss</button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Media Panel */}
        <div className="tc-board-right">
          <div className="tc-media-header">
            <h3><i className="fas fa-photo-video" /> Resources</h3>
            <span className="tc-media-hint">Videos & visual aids</span>
          </div>

          {mediaLoading ? (
            <div className="tc-media-loading">
              <div className="tc-loading-spinner small" />
              <p>Finding relevant resources...</p>
            </div>
          ) : (
            <div className="tc-media-content">
              {/* ===== CODE VISUALIZER ===== */}
              {currentContent && currentContent.content.includes('```') && (
                <div className="tc-media-section tc-code-visualizer">
                  <h4><i className="fas fa-code" /> Code Visualizer</h4>
                  <div className="tc-code-workspace" id="tc-live-visualizer-inject">
                    <div className="tc-live-header"><i className="fas fa-check"></i> Code Ready</div>
                    <pre className="tc-live-code-block"><code>
                      {(() => {
                        const match = currentContent.content.match(/```(?:\w+)?\n([\s\S]*?)```/);
                        return match ? match[1] : 'No code block found';
                      })()}
                    </code></pre>
                  </div>
                </div>
              )}

              {/* Embedded YouTube Videos */}
              {mediaItems.youtube && mediaItems.youtube.length > 0 && (
                <div className="tc-media-section">
                  <h4><i className="fab fa-youtube" /> Videos</h4>
                  {mediaItems.youtube.map((video, i) => (
                    <div key={i} className="tc-yt-embed-card">
                      {video.videoId ? (
                        <div className="tc-yt-embed-wrapper">
                          <iframe
                            src={`https://www.youtube.com/embed/${video.videoId}`}
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <a
                          className="tc-youtube-card"
                          href={`${YOUTUBE_SEARCH_URL}${encodeURIComponent(video.query || video.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="tc-yt-thumb">
                            <i className="fas fa-play-circle" />
                          </div>
                          <div className="tc-yt-info">
                            <span className="tc-yt-title">{video.title}</span>
                          </div>
                        </a>
                      )}
                      <div className="tc-yt-embed-info">
                        <span className="tc-yt-title">{video.title}</span>
                        {video.channel && <span className="tc-yt-channel">{video.channel}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No YouTube key warning */}
              {!APP_YT_KEY && (
                <div className="tc-media-section tc-api-hint">
                  <p><i className="fas fa-info-circle" /> Set VITE_YOUTUBE_API_KEY in .env to enable embedded videos</p>
                </div>
              )}

              {/* Key Terms */}
              {mediaItems.keyTerms && mediaItems.keyTerms.length > 0 && (
                <div className="tc-media-section">
                  <h4><i className="fas fa-tags" /> Key Terms</h4>
                  <div className="tc-key-terms">
                    {mediaItems.keyTerms.map((term, i) => (
                      <span key={i} className="tc-term-chip">{term}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Real Images from Wikimedia */}
              {mediaItems.images && mediaItems.images.length > 0 && (
                <div className="tc-media-section">
                  <h4><i className="fas fa-image" /> Visual Aids</h4>
                  <div className="tc-real-images">
                    {mediaItems.images.map((img, i) => (
                      <div key={i} className="tc-real-image-card">
                        <img
                          src={img.url}
                          alt={img.alt}
                          loading="lazy"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="tc-img-caption">{img.alt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* D.S.E.C.A.R Legend */}
              <div className="tc-media-section tc-dsecar-legend">
                <h4><i className="fas fa-graduation-cap" /> Block Teaching Method</h4>
                <div className="tc-legend-items">
                  <div className="tc-legend-item"><span className="tc-legend-letter">T</span> Theory Blocks</div>
                  <div className="tc-legend-item"><span className="tc-legend-letter">1</span> Topic / Goal</div>
                  <div className="tc-legend-item"><span className="tc-legend-letter">2</span> Definition / Input</div>
                  <div className="tc-legend-item"><span className="tc-legend-letter">3</span> Core / Line-by-Line</div>
                  <div className="tc-legend-item"><span className="tc-legend-letter">4</span> Why / Dry Run</div>
                  <div className="tc-legend-item"><span className="tc-legend-letter">5</span> Examples / Output</div>
                  <div className="tc-legend-item"><span className="tc-legend-letter">6</span> Summary / Insight</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="tc-pres-controls">
        {showDoubt ? (
          <div className="tc-doubt-bar">
            <input
              placeholder="Ask your doubt..."
              value={doubtText}
              onChange={e => setDoubtText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askDoubt()}
              autoFocus
            />
            <button className="tc-doubt-send" onClick={askDoubt}><i className="fas fa-paper-plane" /></button>
            <button className="tc-doubt-cancel" onClick={() => { setShowDoubt(false); setDoubtText(''); }}><i className="fas fa-times" /></button>
          </div>
        ) : (
          <div className="tc-nav-bar">
            <button className="tc-nav-btn" onClick={prevSlide} disabled={currentSlideIdx === 0}>
              <i className="fas fa-chevron-left" /> Prev
            </button>
            <div className="tc-center-btns">
              <button className="tc-ctrl-btn" onClick={() => setShowDoubt(true)}>
                <i className="fas fa-hand-paper" /> Ask Doubt
              </button>
              <button className="tc-ctrl-btn" onClick={downloadPDF}>
                <i className="fas fa-download" /> Notes
              </button>
              <button className="tc-ctrl-btn end" onClick={endClass}>
                <i className="fas fa-stop" /> End
              </button>
            </div>
            <button className="tc-nav-btn primary" onClick={nextSlide} disabled={currentSlideIdx >= slides.length - 1 || loading}>
              Next <i className="fas fa-chevron-right" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

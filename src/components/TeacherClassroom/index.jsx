import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import './TeacherClassroom.css';

const MODEL = 'arcee-ai/trinity-large-preview:free';

// HashMap for instant slide lookup by index (DSA optimization)
class SlideCache {
  constructor() { this.map = new Map(); }
  set(key, val) { this.map.set(key, val); }
  get(key) { return this.map.get(key); }
  has(key) { return this.map.has(key); }
  getAll() { return [...this.map.entries()].sort((a, b) => a[0] - b[0]).map(e => e[1]); }
}

export default function TeacherClassroom({ isOpen, onClose }) {
  const { apiKey, user } = useApp();
  const [phase, setPhase] = useState('setup');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('high');
  const [duration, setDuration] = useState(30);
  const [lang, setLang] = useState('English');

  // Presentation state
  const [slides, setSlides] = useState([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [slideContents, setSlideContents] = useState(new SlideCache());
  const [voiceState, setVoiceState] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDoubt, setShowDoubt] = useState(false);
  const [doubtText, setDoubtText] = useState('');
  const [doubtAnswer, setDoubtAnswer] = useState('');

  // Full class notes for PDF
  const classNotesRef = useRef([]);
  const timerRef = useRef(null);
  const activeRef = useRef(false);
  const contentRef = useRef(null);

  const fetchAI = useCallback(async (messages) => {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages, stream: false, max_tokens: 2000 })
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }, [apiKey]);

  const speakText = useCallback(async (text) => {
    if (!('speechSynthesis' in window)) return;
    setVoiceState('speaking');
    const clean = text.replace(/[#*`_\[\]()~\->📌👉💡⚡✅🔥📝🎯📊🏫]/g, '').replace(/<[^>]+>/g, '').trim();
    if (!clean) { setVoiceState('idle'); return; }
    return new Promise(resolve => {
      const utt = new SpeechSynthesisUtterance(clean);
      utt.rate = 0.92; utt.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const langMap = { English: 'en', Hindi: 'hi', Telugu: 'te', Tamil: 'ta', Kannada: 'kn', Malayalam: 'ml', Marathi: 'mr' };
      const code = langMap[lang] || 'en';
      const voice = voices.find(v => v.lang.startsWith(code)) || voices[0];
      if (voice) utt.voice = voice;
      utt.onend = () => { setVoiceState('idle'); resolve(); };
      utt.onerror = () => { setVoiceState('idle'); resolve(); };
      window.speechSynthesis.speak(utt);
    });
  }, [lang]);

  // ===== START CLASS =====
  const startClass = async () => {
    if (!subject.trim() || !topic.trim()) { alert('Fill subject and topic!'); return; }
    setPhase('loading');
    activeRef.current = true;
    classNotesRef.current = [];
    setSlideContents(new SlideCache());
    setTimeLeft(duration * 60);

    const outlinePrompt = `You are an expert ${subject} teacher. Create a detailed presentation outline for teaching "${topic}" at ${level} level.

Return ONLY a JSON array of slides. Each slide has:
- "title": slide title
- "subtitle": brief subtitle
- "points": array of 3-5 key points to cover

Generate 5-8 slides. Include: Introduction, Core Concepts (2-3 slides), Examples/Applications, Summary/Key Takeaways.

Return ONLY the JSON array, no other text.`;

    try {
      const content = await fetchAI([{ role: 'user', content: outlinePrompt }]);
      const match = content.match(/\[[\s\S]*\]/);
      let parsed = match ? JSON.parse(match[0]) : null;
      if (!parsed || !Array.isArray(parsed)) {
        parsed = [
          { title: 'Introduction', subtitle: `Overview of ${topic}`, points: ['What is it?', 'Why is it important?', 'Prerequisites'] },
          { title: 'Core Concepts', subtitle: 'Fundamental ideas', points: ['Concept 1', 'Concept 2', 'Concept 3'] },
          { title: 'Examples', subtitle: 'Real-world applications', points: ['Example 1', 'Example 2'] },
          { title: 'Summary', subtitle: 'Key takeaways', points: ['Recap', 'Next steps'] },
        ];
      }
      setSlides(parsed);
      setCurrentSlideIdx(0);
      setPhase('presenting');

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => { if (prev <= 1) { endClass(); return 0; } return prev - 1; });
      }, 1000);

      // Load first slide content
      await loadSlideContent(parsed, 0);
    } catch (e) {
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

    const explainPrompt = `You are an expert ${subject} teacher giving a live class on "${topic}" at ${level} level.

Current slide: "${slide.title}" - ${slide.subtitle}
Points to cover: ${slide.points.join(', ')}
${prevContext ? `Previous context: ${prevContext.slice(0, 300)}` : ''}

Write the FULL slide content as a beautiful, engaging presentation. Follow these rules:

FORMATTING (VERY IMPORTANT):
- Start with a single # for the slide title
- Use ## for subtopics
- Use 👉 for ALL bullet points (NOT dashes or asterisks)
- Use 📌 for key definitions or important terms
- Use 💡 for tips, tricks, or insights
- Use ⚡ for crucial points students must remember
- Use ✅ for examples or step-by-step instructions
- Use 🔥 for interesting facts or highlights
- Use 📝 for notes or things to remember
- Use **bold** for key terms
- If coding topic: include a well-commented code block
- If math: show formulas clearly
- Keep explanations CLEAR and DETAILED (200-350 words)
- Use real-world analogies students can relate to
- End with a "📌 Key Takeaway" one-liner

Language: ${lang}`;

    try {
      const content = await fetchAI([
        { role: 'system', content: `Expert ${subject} teacher. You explain concepts with great clarity using examples and analogies.` },
        { role: 'user', content: explainPrompt }
      ]);

      // Cache the content
      const cache = slideContents;
      cache.set(idx, { slide, content, explained: false });
      setSlideContents(cache);

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

      // TTS
      const speechPrompt = `Summarize this slide content for spoken lecture in 2-3 sentences in ${lang}. Only return the spoken text, no formatting: ${content.slice(0, 500)}`;
      const speech = await fetchAI([{ role: 'user', content: speechPrompt }]);
      if (activeRef.current) await speakText(speech);
    } catch (e) {
      setLoading(false);
    }
  };

  // ===== NAVIGATION =====
  const nextSlide = () => {
    if (currentSlideIdx < slides.length - 1) {
      const next = currentSlideIdx + 1;
      window.speechSynthesis?.cancel();
      if (slideContents.has(next)) {
        setCurrentSlideIdx(next);
        setTimeout(() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      } else {
        loadSlideContent(slides, next);
      }
    }
  };

  const prevSlide = () => {
    if (currentSlideIdx > 0) {
      window.speechSynthesis?.cancel();
      setCurrentSlideIdx(currentSlideIdx - 1);
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
        { role: 'system', content: `Expert ${subject} teacher. Answer student's doubt about "${topic}" clearly. Use 👉 for points, 📌 for key info, 💡 for tips. Be thorough but concise. Language: ${lang}.` },
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
    const notes = classNotesRef.current;
    if (notes.length === 0) { alert('No notes to download!'); return; }

    // Build rich HTML for PDF
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${subject} - ${topic} | Mean AI Classroom</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background: #fff; color: #1a1a1a; padding: 40px; line-height: 1.7; }
      .cover { text-align: center; padding: 60px 20px; border-bottom: 3px solid #e8913a; margin-bottom: 40px; }
      .cover h1 { font-size: 2.4rem; color: #e8913a; margin-bottom: 8px; }
      .cover h2 { font-size: 1.5rem; color: #333; font-weight: 400; }
      .cover p { color: #888; margin-top: 12px; font-size: 0.9rem; }
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
    </div>`;

    notes.forEach((note, i) => {
      let content = note.content;
      // Convert markdown to basic HTML for PDF
      content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>');
      content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>');
      content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>');
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
      content = content.replace(/`(.*?)`/g, '<code>$1</code>');
      content = content.replace(/\n/g, '<br>');

      html += `<div class="slide">
        <h2>${note.title}</h2>
        <div class="time">⏱ ${note.timestamp}</div>
        <div class="content">${content}</div>
      </div>`;
    });

    html += `<div class="footer">📚 Generated with ❤️ by Mean AI Classroom — ${new Date().toLocaleString()}</div></body></html>`;

    // Open in new window for print/save as PDF
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

  const currentContent = slideContents.has(currentSlideIdx)
    ? slideContents.get(currentSlideIdx)
    : null;

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
            <p>Start an interactive lesson with a virtual teacher</p>
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
          <h3>Preparing your lesson...</h3>
          <p>Generating slides for <strong>{topic}</strong></p>
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
          <p>Great job, {user?.name || 'Student'}! You covered {slides.length} slides on <strong>{topic}</strong>.</p>
          <div className="tc-complete-actions">
            <button className="tc-download-btn" onClick={downloadPDF}>
              <i className="fas fa-file-pdf" /> Download Notes (PDF)
            </button>
            <button className="tc-restart-btn" onClick={() => { setPhase('setup'); setSlides([]); }}>
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

  // ===== PRESENTING =====
  return (
    <div className="tc-overlay tc-presentation">
      {/* Header */}
      <header className="tc-pres-header">
        <button className="tc-pres-back" onClick={handleClose}><i className="fas fa-arrow-left" /></button>
        <div className="tc-pres-info">
          <span className="tc-pres-subject">{subject}</span>
          <span className="tc-pres-topic">{topic}</span>
        </div>
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
            onClick={() => { if (slideContents.has(i)) { setCurrentSlideIdx(i); window.speechSynthesis?.cancel(); } }}
          />
        ))}
      </div>

      {/* Content Area */}
      <div className="tc-pres-content" ref={contentRef}>
        {loading ? (
          <div className="tc-pres-loading">
            <div className="tc-loading-spinner small" />
            <p>Loading slide content...</p>
          </div>
        ) : currentContent ? (
          <div className="tc-pres-slide">
            <div className="tc-slide-title-bar">
              <span className="tc-slide-badge">Slide {currentSlideIdx + 1}</span>
              <h1 className="tc-slide-title">{currentContent.slide.title}</h1>
              {currentContent.slide.subtitle && (
                <p className="tc-slide-subtitle">{currentContent.slide.subtitle}</p>
              )}
            </div>
            <div
              className="tc-slide-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(currentContent.content) }}
            />
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

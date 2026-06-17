import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import './VideoEditor.css';

const RETENTION_SYSTEM_PROMPT = `You are RetentionOS — an autonomous AI Video Editing Operating System.

Your purpose is to maximize: Audience Retention, Watch Time, Completion Rate, Shares, Replays, Engagement.

You operate like a team of: Story Editor, YouTube Retention Expert, Motion Graphics Artist, Sound Designer, Meme Editor, Documentary Editor, Computer Vision Analyst, Audience Psychology Expert.

Analyze the user's provided content (transcript, descriptions, video details) and produce a comprehensive retention optimization plan.

IMPORTANT RULES:
1. Analyze what is being said, shown, what emotions exist, what story exists.
2. Extract Strong/Emotional/Funny/Educational/Viral/Controversial/Curiosity moments.
3. Reconstruct the story for highest retention (Hook→Problem→Solution, Hook→Journey→Discovery, etc.)
4. Design a hook within the first 5 seconds (score it 0-100, rebuild if < 80).
5. Generate a cut timeline removing dead air, filler words, repeated info, low energy.
6. For every scene calculate: curiosity, emotion, surprise, energy, information_density, drop_probability (0-100 each).
7. Suggest asset matching (b-roll, memes, motion graphics, sound effects, transitions, captions, reactions).
8. Design captions (max 4 words/line, highlight numbers/money/emotions).
9. Create complete timeline with retention goals.
10. Score the final result: hook_score, story_score, retention_score, viral_probability, engagement_prediction, completion_rate_prediction.

Format your response as a detailed, well-structured analysis with clear sections. Use markdown formatting with headers, bullet points, and scores. Include specific timestamps and actionable editing instructions.`;

export default function VideoEditor({ isOpen, onClose }) {
  const { apiKey } = useApp();
  
  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Processing state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result, setResult] = useState('');
  const [phase, setPhase] = useState('upload'); // 'upload' | 'processing' | 'result'
  
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

  // File handling
  const handleFiles = useCallback((files) => {
    const allowed = ['video/', 'image/', 'audio/'];
    const validFiles = Array.from(files).filter(f => allowed.some(t => f.type.startsWith(t)));
    
    const newFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      isVideo: file.type.startsWith('video/'),
      isAudio: file.type.startsWith('audio/'),
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = (id) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  // Drag and drop
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  // Extract text from video/audio (basic metadata description)
  const buildContentDescription = () => {
    let content = '';
    
    if (textInput.trim()) {
      content += `=== TRANSCRIPT / SCRIPT ===\n${textInput.trim()}\n\n`;
    }
    
    if (uploadedFiles.length > 0) {
      content += `=== MEDIA FILES ===\n`;
      uploadedFiles.forEach((f, i) => {
        const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
        content += `${i + 1}. ${f.name} (${f.type}, ${sizeMB} MB)\n`;
      });
      content += '\n';
    }
    
    if (additionalNotes.trim()) {
      content += `=== ADDITIONAL NOTES / PREFERENCES ===\n${additionalNotes.trim()}\n\n`;
    }
    
    return content;
  };

  // Process with AI
  const handleProcess = async () => {
    const contentDesc = buildContentDescription();
    if (!contentDesc.trim() && uploadedFiles.length === 0) {
      alert('Please add some content — upload media files or paste a transcript/script.');
      return;
    }
    
    if (!apiKey) {
      alert('Please set your OpenRouter API key in Settings first.');
      return;
    }

    setPhase('processing');
    setProcessing(true);
    setResult('');
    setProgress(0);

    const steps = [
      { pct: 5, label: 'Analyzing content structure...' },
      { pct: 15, label: 'Detecting story arc & emotional peaks...' },
      { pct: 25, label: 'Running Hook Engine...' },
      { pct: 35, label: 'Identifying cut points & dead air...' },
      { pct: 45, label: 'Computing retention scores per scene...' },
      { pct: 55, label: 'Matching assets (b-roll, memes, SFX)...' },
      { pct: 65, label: 'Generating caption timeline...' },
      { pct: 75, label: 'Building motion graphics plan...' },
      { pct: 85, label: 'Scoring retention & viral probability...' },
      { pct: 95, label: 'Compiling final edit plan...' },
    ];

    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      if (stepIdx < steps.length) {
        setProgress(steps[stepIdx].pct);
        setProgressLabel(steps[stepIdx].label);
        stepIdx++;
      }
    }, 2000);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          stream: true,
          messages: [
            { role: 'system', content: RETENTION_SYSTEM_PROMPT },
            { role: 'user', content: `Analyze the following content and produce a complete RetentionOS optimization plan:\n\n${contentDesc}` }
          ]
        }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error(`API error: ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        
        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              setResult(fullText);
            }
          } catch (_) {}
        }
      }

      clearInterval(progressInterval);
      setProgress(100);
      setProgressLabel('Analysis complete!');
      setPhase('result');

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Video editor AI error:', err);
        alert('Failed to process content. Please check your API key and try again.');
        setPhase('upload');
      }
    } finally {
      clearInterval(progressInterval);
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setProcessing(false);
    setPhase('upload');
  };

  const handleReset = () => {
    setUploadedFiles([]);
    setTextInput('');
    setAdditionalNotes('');
    setResult('');
    setPhase('upload');
    setProgress(0);
  };

  const copyResult = () => {
    navigator.clipboard.writeText(result);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div className="ve-overlay">
      {/* Header */}
      <header className="ve-header">
        <div className="ve-header-left">
          <button className="ve-back-btn" onClick={onClose}>
            <i className="fas fa-arrow-left" />
          </button>
          <div className="ve-brand">
            <i className="fas fa-video ve-brand-icon" />
            <div>
              <h1>AI Video Editor</h1>
              <span>RetentionOS v1.0</span>
            </div>
          </div>
        </div>
        <div className="ve-header-right">
          {phase === 'result' && (
            <>
              <button className="ve-header-action" onClick={copyResult}>
                <i className="fas fa-copy" /> Copy Analysis
              </button>
              <button className="ve-header-action ve-reset-btn" onClick={handleReset}>
                <i className="fas fa-redo" /> New Project
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="ve-main">
        {phase === 'upload' && (
          <div className="ve-upload-layout">
            {/* Left: Upload Zone */}
            <div className="ve-upload-panel">
              <h2 className="ve-section-title">
                <i className="fas fa-cloud-arrow-up" /> Media Inputs
              </h2>
              
              <div 
                className={`ve-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/*,image/*,audio/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  style={{ display: 'none' }}
                />
                <div className="ve-dropzone-content">
                  <div className="ve-dropzone-icon">
                    <i className="fas fa-film" />
                  </div>
                  <p className="ve-dropzone-title">Drop videos, images, or audio here</p>
                  <p className="ve-dropzone-sub">or click to browse • MP4, MOV, JPG, PNG, MP3, WAV</p>
                </div>
              </div>

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="ve-file-list">
                  {uploadedFiles.map(f => (
                    <div key={f.id} className="ve-file-item">
                      <div className="ve-file-thumb">
                        {f.preview ? (
                          <img src={f.preview} alt={f.name} />
                        ) : f.isVideo ? (
                          <i className="fas fa-video" />
                        ) : f.isAudio ? (
                          <i className="fas fa-music" />
                        ) : (
                          <i className="fas fa-file" />
                        )}
                      </div>
                      <div className="ve-file-info">
                        <span className="ve-file-name">{f.name}</span>
                        <span className="ve-file-meta">{formatFileSize(f.size)}</span>
                      </div>
                      <button className="ve-file-remove" onClick={() => removeFile(f.id)}>
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional notes */}
              <div className="ve-notes-section">
                <h3><i className="fas fa-sliders" /> Editing Preferences</h3>
                <textarea
                  className="ve-notes-input"
                  placeholder="Target platform (YouTube, TikTok, Instagram), desired length, style preferences, target audience..."
                  value={additionalNotes}
                  onChange={e => setAdditionalNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Right: Transcript / Script */}
            <div className="ve-text-panel">
              <h2 className="ve-section-title">
                <i className="fas fa-file-lines" /> Transcript / Script
              </h2>
              <textarea
                className="ve-transcript-input"
                placeholder="Paste your video transcript, script, or detailed description of the content here...

Example:
'Hey guys, welcome back to the channel. Today we're going to talk about why most people fail at starting a business. The number one reason is...'

The more detail you provide, the better the AI can optimize retention."
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
              />

              {/* Engine cards */}
              <div className="ve-engines">
                <div className="ve-engine-card">
                  <i className="fas fa-brain" />
                  <span>Hook Engine</span>
                </div>
                <div className="ve-engine-card">
                  <i className="fas fa-scissors" />
                  <span>Cut Engine</span>
                </div>
                <div className="ve-engine-card">
                  <i className="fas fa-chart-line" />
                  <span>Retention Engine</span>
                </div>
                <div className="ve-engine-card">
                  <i className="fas fa-closed-captioning" />
                  <span>Caption Engine</span>
                </div>
                <div className="ve-engine-card">
                  <i className="fas fa-music" />
                  <span>Sound Design</span>
                </div>
                <div className="ve-engine-card">
                  <i className="fas fa-face-laugh" />
                  <span>Meme Engine</span>
                </div>
              </div>

              <button 
                className="ve-process-btn" 
                onClick={handleProcess}
                disabled={!textInput.trim() && uploadedFiles.length === 0}
              >
                <i className="fas fa-wand-magic-sparkles" />
                <span>Optimize for Maximum Retention</span>
              </button>
            </div>
          </div>
        )}

        {phase === 'processing' && (
          <div className="ve-processing">
            <div className="ve-processing-card">
              <div className="ve-processing-visual">
                <div className="ve-orbit-system">
                  <div className="ve-orbit-ring ve-ring-1"><div className="ve-orbit-dot" /></div>
                  <div className="ve-orbit-ring ve-ring-2"><div className="ve-orbit-dot" /></div>
                  <div className="ve-orbit-ring ve-ring-3"><div className="ve-orbit-dot" /></div>
                  <div className="ve-orbit-core">
                    <i className="fas fa-video" />
                  </div>
                </div>
              </div>
              <h2>RetentionOS is analyzing your content</h2>
              <p className="ve-progress-label">{progressLabel}</p>
              <div className="ve-progress-bar">
                <div className="ve-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="ve-progress-pct">{progress}%</span>
              <button className="ve-cancel-btn" onClick={handleCancel}>Cancel</button>
            </div>
            
            {/* Live streaming result preview */}
            {result && (
              <div className="ve-live-preview">
                <h3><i className="fas fa-terminal" /> Live Analysis Output</h3>
                <div className="ve-live-text">{result}</div>
              </div>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div className="ve-result-layout">
            <div className="ve-result-content">
              <div className="ve-result-header">
                <h2><i className="fas fa-check-circle" /> Retention Optimization Complete</h2>
                <p>Your content has been analyzed by all 15 RetentionOS engines</p>
              </div>
              <div className="ve-result-body" dangerouslySetInnerHTML={{ __html: formatMarkdown(result) }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple markdown formatter
function formatMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="ve-code-block"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="ve-inline-code">$1</code>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="ve-hr"/>')
    .replace(/^===+$/gm, '<hr class="ve-hr"/>')
    // Bullet points
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  
  // Wrap consecutive <li> items in <ul>
  html = html.replace(/(<li>.*?<\/li>)(?:\s*<br\/>)?/g, '$1');
  html = '<p>' + html + '</p>';
  
  return html;
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { parseTOON } from '../../utils/toonParser';
import './DSACanvas.css';

/* ── AI helpers ── */
function getKeys() {
  return {
    or: (localStorage.getItem('meanai_openrouter_key') || '').trim(),
    g: (localStorage.getItem('meanai_gemini_key') || '').trim(),
  };
}

// Non-streaming fetch
async function fetchAI(messages, maxTokens = 3000) {
  const { or: orKey, g: gKey } = getKeys();
  if (orKey) {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', headers: { 'Authorization': `Bearer ${orKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openrouter/free', messages, max_tokens: maxTokens })
    });
    const d = await r.json(); return d.choices?.[0]?.message?.content || '';
  }
  if (gKey) {
    const contents = []; let sys = '';
    for (const m of messages) {
      if (m.role === 'system') sys += m.content + '\n';
      else contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] });
    }
    const payload = { contents };
    if (sys) payload.systemInstruction = { parts: [{ text: sys }] };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const d = await r.json(); return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  return '';
}

// Streaming fetch — calls onChunk with accumulated text
async function streamAI(messages, onChunk, maxTokens = 3000) {
  const { or: orKey, g: gKey } = getKeys();
  let full = '';

  if (gKey) {
    const contents = []; let sys = '';
    for (const m of messages) {
      if (m.role === 'system') sys += m.content + '\n';
      else contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] });
    }
    const payload = { contents };
    if (sys) payload.systemInstruction = { parts: [{ text: sys }] };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${gKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try {
          const j = JSON.parse(line.slice(6));
          const t = j.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (t) { full += t; onChunk(full); }
        } catch {}
      }
    }
    return full;
  }

  if (orKey) {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', headers: { 'Authorization': `Bearer ${orKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openrouter/free', messages, max_tokens: maxTokens, stream: true })
    });
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
        try {
          const j = JSON.parse(line.slice(6));
          const t = j.choices?.[0]?.delta?.content || '';
          if (t) { full += t; onChunk(full); }
        } catch {}
      }
    }
    return full;
  }

  return '';
}

/* ── Visual renderers from TOON blocks ── */
function renderVisualFromToon(blocks, stepIdx) {
  const visBlock = blocks.find(b => b.type === 'visualizer' || b.type === 'coder');
  const stepBlocks = blocks.filter(b => b.type === 'step');
  const currentStep = stepBlocks[stepIdx] || null;

  // Find data structure type from blocks
  const dsType = blocks.find(b => b.ds_type)?.ds_type || blocks.find(b => b.structure)?.structure || 'array';
  const dataBlock = blocks.find(b => b.type === 'data' || b.data);
  const values = dataBlock?.data || blocks.find(b => b.values)?.values || [];

  // Parse values if string
  const vals = typeof values === 'string'
    ? values.split(',').map(v => v.trim())
    : Array.isArray(values) ? values : [];

  const hl = currentStep?.highlight ?? currentStep?.index ?? -1;

  if (dsType.includes('linked') || dsType.includes('list')) {
    return <LinkedListViz values={vals.length ? vals : ['10','20','30','40']} highlight={hl} />;
  }
  if (dsType.includes('tree') || dsType.includes('bst')) {
    return <TreeViz values={vals.length ? vals : ['50','30','70','20','40','60','80']} highlight={hl} />;
  }
  if (dsType.includes('stack')) {
    return <StackViz values={vals.length ? vals : ['10','20','30']} highlight={hl} />;
  }
  if (dsType.includes('queue')) {
    return <QueueViz values={vals.length ? vals : ['10','20','30','40']} highlight={hl} />;
  }
  if (dsType.includes('graph')) {
    return <GraphViz />;
  }
  if (dsType.includes('hash')) {
    return <HashMapViz />;
  }
  // Default: array
  return <ArrayViz values={vals.length ? vals : ['10','20','30','40','50','60','70']} highlight={hl} />;
}

/* ── Visual Components ── */
function ArrayViz({ values, highlight }) {
  return (
    <div className="dv-array-wrap">
      <div className="dv-row">
        <span className="dv-label">Index →</span>
        {values.map((_, i) => <span key={i} className={`dv-idx ${i===highlight?'hl':''}`}>{i}</span>)}
      </div>
      <div className="dv-row">
        <span className="dv-label">Value →</span>
        {values.map((v, i) => <div key={i} className={`dv-cell ${i===highlight?'hl':''}`}>{v}</div>)}
      </div>
      {highlight >= 0 && highlight < values.length && (
        <div className="dv-pointer" style={{ marginLeft: `${72 + highlight * 60}px` }}>
          <div className="dv-pointer-line" />
          <div className="dv-pointer-badge">arr[{highlight}] = {values[highlight]}</div>
        </div>
      )}
    </div>
  );
}

function LinkedListViz({ values, highlight }) {
  return (
    <div className="dv-ll-wrap">
      {values.map((v, i) => (
        <React.Fragment key={i}>
          <div className={`dv-ll-node ${i===highlight?'hl':''}`}>
            <div className="dv-ll-data">{v}</div>
            <div className="dv-ll-next">{i < values.length-1 ? '●' : 'NULL'}</div>
          </div>
          {i < values.length-1 && <div className="dv-ll-arrow">→</div>}
        </React.Fragment>
      ))}
    </div>
  );
}

function TreeViz({ values, highlight }) {
  const positions = [[200,20],[120,80],[280,80],[80,140],[160,140],[240,140],[320,140]];
  const edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
  return (
    <svg viewBox="0 0 400 180" className="ds-viz-svg" style={{width:'100%',height:'180px'}}>
      {edges.map(([a,b],i) => positions[a] && positions[b] && (
        <line key={i} x1={positions[a][0]} y1={positions[a][1]+15} x2={positions[b][0]} y2={positions[b][1]+15} stroke="#f59e0b" strokeWidth="1.5" opacity="0.4"/>
      ))}
      {values.slice(0,7).map((v,i) => positions[i] && (
        <g key={i}>
          <circle cx={positions[i][0]} cy={positions[i][1]+15} r="22" fill={i===highlight?'rgba(124,58,237,0.3)':'#1e1e3a'} stroke={i===highlight?'#7c3aed':'#f59e0b'} strokeWidth="2"/>
          <text x={positions[i][0]} y={positions[i][1]+20} fill="#fff" fontSize="12" textAnchor="middle" fontWeight="700">{v}</text>
        </g>
      ))}
    </svg>
  );
}

function StackViz({ values, highlight }) {
  return (
    <div className="dv-stack-wrap">
      {[...values].reverse().map((v,i) => {
        const ri = values.length-1-i;
        return (
          <div key={i} className={`dv-stack-item ${ri===highlight?'hl':''}`}>
            {ri === values.length-1 && <span className="dv-stack-top">TOP →</span>}
            <div className="dv-stack-val">{v}</div>
          </div>
        );
      })}
      <div className="dv-stack-base">── Stack Base ──</div>
    </div>
  );
}

function QueueViz({ values, highlight }) {
  return (
    <div className="dv-ll-wrap">
      <span className="dv-label" style={{color:'#10b981'}}>Front →</span>
      {values.map((v,i) => (
        <div key={i} className={`dv-cell ${i===highlight?'hl':''}`} style={{width:50,height:50}}>{v}</div>
      ))}
      <span className="dv-label" style={{color:'#ef4444'}}>← Rear</span>
    </div>
  );
}

function GraphViz() {
  const nodes = [[80,40,'A'],[240,40,'B'],[40,130,'C'],[160,160,'D'],[300,130,'E']];
  const edges = [[0,1],[0,2],[1,4],[2,3],[3,4]];
  return (
    <svg viewBox="0 0 360 200" className="ds-viz-svg" style={{width:'100%',height:'200px'}}>
      {edges.map(([a,b],i) => <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#10b981" strokeWidth="1.5" opacity="0.4"/>)}
      {nodes.map(([x,y,v],i) => (
        <g key={i}><circle cx={x} cy={y} r="24" fill="#1e1e3a" stroke="#10b981" strokeWidth="2"/><text x={x} y={y+5} fill="#fff" fontSize="14" textAnchor="middle" fontWeight="700">{v}</text></g>
      ))}
    </svg>
  );
}

function HashMapViz() {
  const pairs = [['name','Alice'],['age','25'],['city','NYC'],['job','Dev']];
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6,padding:'10px 0'}}>
      {pairs.map(([k,v],i) => (
        <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
          <div className="dv-cell" style={{width:80,height:36,fontSize:'0.8rem',background:'rgba(59,130,246,0.12)',borderColor:'#3b82f6'}}>{k}</div>
          <span style={{color:'#3b82f6'}}>→</span>
          <div className="dv-cell" style={{width:80,height:36,fontSize:'0.8rem',background:'rgba(16,185,129,0.1)',borderColor:'#10b981'}}>{v}</div>
        </div>
      ))}
    </div>
  );
}

/* ── DSA Prompt for AI ── */
const DSA_SYSTEM_PROMPT = `You are a DSA visual explainer. Given a topic, generate a structured TOON response with steps.
Return ONLY valid TOON format. Each block separated by ---.

Required blocks:
1. A "config" block with: type: config, topic: <topic>, ds_type: <array|linked_list|tree|stack|queue|graph|hashmap>, values: <comma separated initial values>

2. Multiple "step" blocks (5-8 steps), each with:
type: step
title: <step title>
index: <which element to highlight, -1 for none>
code: <one line of code or pseudocode>
explain: <2-3 sentence explanation>
example: <real-world analogy>
chat: <what the AI tutor says in chat>

Example:
---
type: config
topic: Arrays
ds_type: array
values: 10, 20, 30, 40, 50, 60, 70
---
type: step
title: What is an Array?
index: -1
code: int arr[] = {10, 20, 30, 40, 50, 60, 70}
explain: An array stores elements in contiguous memory. Each element accessed by index starting from 0.
example: Like numbered lockers in a school hallway.
chat: Hello! Let me explain Arrays visually. Think of numbered lockers!`;

/* ── Main Component ── */
export default function DSACanvas({ onClose }) {
  const [topic, setTopic] = useState('');
  const [toonBlocks, setToonBlocks] = useState([]);
  const [streamText, setStreamText] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [doubtInput, setDoubtInput] = useState('');
  const [doubtMessages, setDoubtMessages] = useState([]);
  const [doubtLoading, setDoubtLoading] = useState(false);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);

  const configBlock = toonBlocks.find(b => b.type === 'config') || {};
  const stepBlocks = toonBlocks.filter(b => b.type === 'step');
  const currentStep = stepBlocks[stepIdx] || {};

  // Auto-advance
  useEffect(() => {
    if (playing && stepBlocks.length > 0) {
      timerRef.current = setInterval(() => {
        setStepIdx(prev => {
          if (prev >= stepBlocks.length - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, 5000);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, stepBlocks.length]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [stepIdx, doubtMessages.length]);

  const handleDoubt = async (e) => {
    e.preventDefault();
    if (!doubtInput.trim() || doubtLoading) return;
    const question = doubtInput.trim();
    setDoubtInput('');
    setDoubtMessages(prev => [...prev, { role: 'user', text: question }]);
    setDoubtLoading(true);
    // Add placeholder for streaming
    const aiIdx = doubtMessages.length + 1;
    setDoubtMessages(prev => [...prev, { role: 'ai', text: '' }]);
    try {
      const topicName = configBlock.topic || topic;
      await streamAI([
        { role: 'system', content: `You are a friendly DSA tutor. The student is learning about "${topicName}". Answer their doubt concisely in 2-4 sentences. Use real-world examples. Be encouraging.` },
        { role: 'user', content: question }
      ], (partial) => {
        setDoubtMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'ai', text: partial }; return u; });
      }, 500);
    } catch {
      setDoubtMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'ai', text: 'Oops! Something went wrong.' }; return u; });
    }
    setDoubtLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setStepIdx(0);
    setToonBlocks([]);
    setStreamText('');
    setDoubtMessages([]);

    try {
      const final = await streamAI([
        { role: 'system', content: DSA_SYSTEM_PROMPT },
        { role: 'user', content: `Explain "${topic.trim()}" with visual step-by-step DSA explanation. Include real-world examples in every step.` }
      ], (partial) => {
        setStreamText(partial);
        // Try to parse partial TOON for live preview
        const blocks = parseTOON(partial);
        if (blocks.length > 0) setToonBlocks(blocks);
      }, 3000);

      const blocks = parseTOON(final);
      if (blocks.length > 0) setToonBlocks(blocks);
      else setToonBlocks(getFallbackBlocks(topic.trim()));
    } catch (err) {
      console.error('AI fetch error:', err);
      setToonBlocks(getFallbackBlocks(topic.trim()));
    }
    setLoading(false);
    setStreamText('');
  };

  const speakStep = () => {
    window.speechSynthesis?.cancel();
    if (!currentStep.chat) return;
    setSpeaking(true);
    const utt = new SpeechSynthesisUtterance(currentStep.chat.replace(/[🎯✅❌👋💡🌍●🚀💥📦⚡🔗➕❌🔍]/g, ''));
    utt.rate = 0.95;
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  // ── Always show classroom view ──
  const hasContent = stepBlocks.length > 0;
  const progress = hasContent ? ((stepIdx + 1) / stepBlocks.length) * 100 : 0;

  return (
    <div className="dsa-canvas-overlay">
      <div className="dsa-topbar">
        <div className="dsa-topbar-left">
          <div className="dsa-logo">{'</>'}</div>
          <div><div className="dsa-brand">DSA EXPLAINER</div><div className="dsa-sub">AI Powered Learning</div></div>
        </div>
        {hasContent && <div className="dsa-topic-select">Topic: <strong style={{color:'#c4b5fd'}}>{configBlock.topic || topic}</strong></div>}
        <button className="dsa-topbar-btn close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="dsa-classroom">
        <div className="dsa-canvas-left">
          {/* Canvas card — show visual or empty state */}
          <div className="dsa-canvas-card">
            {hasContent ? (
              <>
                <h2 className="dsa-canvas-title">{configBlock.topic || topic}</h2>
                <p className="dsa-canvas-desc">{stepBlocks[0]?.explain?.split('.')[0] || ''}.</p>
                <div className="dsa-visual-area">{renderVisualFromToon(toonBlocks, stepIdx)}</div>
                {currentStep.code && <div className="dsa-code-badge">{currentStep.code}</div>}
              </>
            ) : loading ? (
              <div className="dsa-empty-state">
                <div className="dsa-prompt-avatar" style={{fontSize:'2.5rem',animation:'speakPulse 1s infinite'}}>🤖</div>
                <h3 style={{color:'#fff',margin:'8px 0 4px'}}>Generating visual for "{topic}"...</h3>
                {streamText && <pre className="dsa-stream-preview">{streamText.slice(-200)}</pre>}
                <div className="dsa-loading-dots"><span/><span/><span/></div>
              </div>
            ) : (
              <div className="dsa-empty-state">
                <div style={{fontSize:'3rem',marginBottom:8}}>🤖</div>
                <h3 style={{color:'#fff',margin:'0 0 4px'}}>DSA Visual Classroom</h3>
                <p style={{color:'#666',fontSize:'0.82rem',margin:0}}>Type a topic below to get started</p>
              </div>
            )}
          </div>

          {/* Explanation box */}
          {hasContent && (
            <div className="dsa-explain-box">
              <div className="dsa-explain-icon">✦</div>
              <div className="dsa-explain-text">{currentStep.explain || ''}</div>
            </div>
          )}

          {/* Playback (only when content exists) */}
          {hasContent && (
          <div className="dsa-playback">
            <button className="dsa-play-btn" onClick={() => setPlaying(!playing)}>{playing ? '⏸' : '▶'}</button>
            <div className="dsa-progress-bar">
              <div className="dsa-progress-fill" style={{ width: `${progress}%` }} />
              <input type="range" min={0} max={stepBlocks.length-1} value={stepIdx} onChange={e => { setStepIdx(+e.target.value); setPlaying(false); }} />
            </div>
            <span className="dsa-step-count">Step {stepIdx+1} / {stepBlocks.length}</span>
            <button className="dsa-replay-btn" onClick={() => { setStepIdx(0); setPlaying(true); }}>↻</button>
          </div>
          )}

          {/* Topic input — always visible at bottom */}
          <form className="dsa-topic-form" onSubmit={handleSubmit}>
            <input className="dsa-prompt-input" value={topic} onChange={e => setTopic(e.target.value)} placeholder='Type a DSA topic... e.g. "Linked List"' disabled={loading} />
            <button className="dsa-prompt-submit" type="submit" disabled={loading || !topic.trim()}>
              {loading ? '⏳' : '→'}
            </button>
          </form>
        </div>

        <div className="dsa-chat-right">
          <div className="dsa-tutor-header">
            <div className="dsa-tutor-info"><span className="dsa-tutor-name">AI Tutor</span><span className="dsa-tutor-status">{speaking ? '🔊 Speaking...' : 'Explaining...'}</span></div>
            <div className={`dsa-tutor-avatar ${speaking?'speaking':''}`}>🤖</div>
          </div>
          <div className="dsa-chat-messages">
            {stepBlocks.slice(0, stepIdx+1).map((s, i) => (
              <div key={i} className={`dsa-chat-msg ${i===stepIdx?'current':''}`}>
                <div className="dsa-chat-avatar">🤖</div>
                <div className="dsa-chat-bubble">
                  {s.chat?.split('\n').map((line, j) => <p key={j}>{line}</p>)}
                  {s.code && <div className="dsa-chat-code">{s.code}</div>}
                </div>
              </div>
            ))}
            {doubtMessages.map((m, i) => (
              <div key={`d${i}`} className={`dsa-chat-msg ${m.role === 'user' ? 'user-msg' : 'current'}`}>
                <div className="dsa-chat-avatar">{m.role === 'user' ? '🧑' : '🤖'}</div>
                <div className="dsa-chat-bubble">
                  {m.text.split('\n').map((line, j) => <p key={j}>{line}</p>)}
                </div>
              </div>
            ))}
            {doubtLoading && (
              <div className="dsa-chat-msg current">
                <div className="dsa-chat-avatar">🤖</div>
                <div className="dsa-chat-bubble"><p>Thinking...</p></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form className="dsa-chat-input-area" onSubmit={handleDoubt}>
            <input className="dsa-chat-input" placeholder="Ask me anything..." value={doubtInput} onChange={e => setDoubtInput(e.target.value)} />
            <button className="dsa-chat-send" type="submit" disabled={doubtLoading}>➤</button>
          </form>
          <button className="dsa-listen-btn" onClick={speakStep}>🔊 Listen Explanation</button>
        </div>
      </div>
    </div>
  );
}

/* ── Fallback blocks when AI is unavailable ── */
function getFallbackBlocks(topic) {
  const t = topic.toLowerCase();
  let dsType = 'array', vals = '10,20,30,40,50,60,70';
  if (t.includes('linked') || t.includes('list')) { dsType = 'linked_list'; vals = '10,20,30,40'; }
  else if (t.includes('tree') || t.includes('bst')) { dsType = 'tree'; vals = '50,30,70,20,40,60,80'; }
  else if (t.includes('stack')) { dsType = 'stack'; vals = '10,20,30'; }
  else if (t.includes('queue')) { dsType = 'queue'; vals = '10,20,30,40'; }
  else if (t.includes('graph')) { dsType = 'graph'; vals = 'A,B,C,D,E'; }
  else if (t.includes('hash')) { dsType = 'hashmap'; vals = ''; }

  return parseTOON(`---
type: config
topic: ${topic}
ds_type: ${dsType}
values: ${vals}
---
type: step
title: Introduction
index: -1
code:
explain: Let's explore ${topic}. This is a fundamental concept in Data Structures & Algorithms.
example: Like organizing items in real life — the method you choose affects efficiency.
chat: Hello! 👋 Let's learn about ${topic}! I'll explain it step by step with visuals.
---
type: step
title: Structure
index: 0
code: // Accessing first element
explain: Understanding the basic structure is key. Each element has a specific position and relationship with others.
example: Think of a well-organized kitchen — everything has its place.
chat: Let me show you the structure. Notice how elements are organized and connected.
---
type: step
title: Operations
index: 2
code: // Core operation
explain: The main operations define how we interact with this data structure — insertion, deletion, and access.
example: Like a library system — you can add, remove, and find books.
chat: Now let's look at the key operations. Each has different time complexity.
---
type: step
title: Time Complexity
index: -1
code: // O(n) vs O(1) vs O(log n)
explain: Understanding when to use this structure depends on the time complexity of its operations.
example: Choosing between stairs and elevator depends on which floor.
chat: ⚡ Time Complexity matters! It determines which structure to use for your problem.
---
type: step
title: Summary
index: -1
code:
explain: ${topic} is essential for writing efficient code. Practice with real coding problems to master it.
example: Like learning to drive — basics first, then advanced techniques.
chat: 🎯 Great job! You now understand the fundamentals of ${topic}. Practice makes perfect!`);
}

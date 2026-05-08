import React, { useState, useEffect, useRef } from 'react';

const VISUALS = {
  'linked list': (
    <svg viewBox="0 0 520 80" className="ds-viz-svg" height="80">
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x={i*130+10} y={15} width={90} height={50} rx="8" fill="#1e1e3a" stroke="#8b5cf6" strokeWidth="2">
            <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin={`${i*0.3}s`} fill="freeze"/>
          </rect>
          <text x={i*130+55} y={45} fill="#fff" fontSize="14" textAnchor="middle" fontWeight="600">
            Node {i+1}
          </text>
          {i < 3 && <line x1={i*130+100} y1={40} x2={i*130+140} y2={40} stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrow)"/>}
        </g>
      ))}
      <text x={510} y={45} fill="#ef4444" fontSize="12" fontWeight="700">NULL</text>
      <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6"/></marker></defs>
    </svg>
  ),
  'arrays': (
    <svg viewBox="0 0 480 80" className="ds-viz-svg" height="80">
      {[5,12,3,8,1,9,4].map((v,i) => (
        <g key={i}>
          <rect x={i*65+10} y={10} width={55} height={55} rx="6" fill="#1e1e3a" stroke="#10b981" strokeWidth="2">
            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${i*0.15}s`} fill="freeze"/>
          </rect>
          <text x={i*65+37} y={43} fill="#fff" fontSize="16" textAnchor="middle" fontWeight="700">{v}</text>
          <text x={i*65+37} y={78} fill="#666" fontSize="10" textAnchor="middle">[{i}]</text>
        </g>
      ))}
    </svg>
  ),
  'binary tree': (
    <svg viewBox="0 0 400 200" className="ds-viz-svg" height="200">
      {[[200,20,'10'],[120,80,'5'],[280,80,'15'],[80,140,'3'],[160,140,'7'],[240,140,'12'],[320,140,'20']].map(([x,y,v],i) => (
        <g key={i}>
          <circle cx={x} cy={y+15} r="22" fill="#1e1e3a" stroke="#f59e0b" strokeWidth="2">
            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${i*0.2}s`} fill="freeze"/>
          </circle>
          <text x={x} y={y+20} fill="#fff" fontSize="13" textAnchor="middle" fontWeight="700">{v}</text>
        </g>
      ))}
      {[[200,35,120,80],[200,35,280,80],[120,95,80,140],[120,95,160,140],[280,95,240,140],[280,95,320,140]].map(([x1,y1,x2,y2],i) => (
        <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth="1.5" opacity="0.5"/>
      ))}
    </svg>
  ),
  'stack': (
    <svg viewBox="0 0 200 220" className="ds-viz-svg" height="220">
      {['TOP→ 42','17','8','3'].map((v,i) => (
        <g key={i}>
          <rect x={30} y={i*50+10} width={140} height={40} rx="6" fill="#1e1e3a" stroke={i===0?'#ef4444':'#8b5cf6'} strokeWidth="2">
            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin={`${i*0.2}s`} fill="freeze"/>
          </rect>
          <text x={100} y={i*50+35} fill="#fff" fontSize="14" textAnchor="middle" fontWeight="600">{v}</text>
        </g>
      ))}
    </svg>
  ),
  'graphs': (
    <svg viewBox="0 0 360 220" className="ds-viz-svg" height="220">
      {[[80,40,'A'],[240,40,'B'],[40,140,'C'],[160,180,'D'],[300,150,'E']].map(([x,y,v],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="24" fill="#1e1e3a" stroke="#10b981" strokeWidth="2"/>
          <text x={x} y={y+5} fill="#fff" fontSize="15" textAnchor="middle" fontWeight="700">{v}</text>
        </g>
      ))}
      {[[80,40,240,40],[80,40,40,140],[240,40,300,150],[40,140,160,180],[160,180,300,150]].map(([x1,y1,x2,y2],i) => (
        <line key={`e${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10b981" strokeWidth="1.5" opacity="0.4"/>
      ))}
    </svg>
  ),
  'hashmap': (
    <svg viewBox="0 0 400 180" className="ds-viz-svg" height="180">
      {[['name','Alice'],['age','25'],['city','NYC'],['job','Dev']].map(([k,v],i) => (
        <g key={i}>
          <rect x={10} y={i*42+5} width={120} height={34} rx="6" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1.5"/>
          <text x={70} y={i*42+27} fill="#60a5fa" fontSize="13" textAnchor="middle" fontWeight="600">{k}</text>
          <line x1={135} y1={i*42+22} x2={180} y2={i*42+22} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 3"/>
          <rect x={185} y={i*42+5} width={120} height={34} rx="6" fill="rgba(16,185,129,0.1)" stroke="#10b981" strokeWidth="1.5"/>
          <text x={245} y={i*42+27} fill="#34d399" fontSize="13" textAnchor="middle" fontWeight="600">{v}</text>
        </g>
      ))}
    </svg>
  ),
};

function getVisual(title) {
  const t = title.toLowerCase();
  for (const [key, svg] of Object.entries(VISUALS)) {
    if (t.includes(key)) return svg;
  }
  return VISUALS['arrays']; // default
}

export default function ExplainPanel({ node, onClose, isFullScreen }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!node) return;
    setLoading(true);
    // Use fallback explanation (no AI key needed)
    setTimeout(() => {
      setExplanation(buildExplanation(node.title));
      setLoading(false);
    }, 800);
    return () => window.speechSynthesis?.cancel();
  }, [node?.id]);

  const speakAll = () => {
    if (!explanation) return;
    window.speechSynthesis?.cancel();
    setSpeaking(true);
    const text = `${explanation.intro}. ${explanation.steps.map(s => `${s.title}. ${s.content}. Example: ${s.example}`).join('. ')}. ${explanation.summary}`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const stopSpeak = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  if (!node) return null;

  if (loading) {
    return (
      <div className="explain-fullscreen">
        <div className="explain-fs-loading">
          <div className="explain-fs-dots"><span/><span/><span/></div>
          <p>Teacher is preparing the lesson on <strong>{node.title}</strong>...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="explain-fullscreen">
      {/* Header */}
      <div className="explain-fs-header">
        <button className="explain-fs-back" onClick={onClose}>←</button>
        <div className="explain-fs-title">📖 {explanation?.title || node.title}</div>
        <div className={`explain-fs-avatar ${speaking ? 'speaking' : ''}`}>
          {speaking ? '🗣️' : '👨‍🏫'}
        </div>
      </div>

      {/* Canvas */}
      <div className="explain-fs-canvas">
        {/* Intro */}
        <div className="explain-fs-intro">
          <span className="explain-fs-intro-icon">💡</span>
          <p>{explanation?.intro}</p>
        </div>

        {/* Visual Diagram */}
        <div className="explain-visual-area">
          <div className="explain-visual-title">📐 Visual Representation</div>
          {getVisual(node.title)}
        </div>

        {/* Steps */}
        <div className="explain-fs-steps">
          {explanation?.steps.map((s, i) => (
            <div key={i} className={`explain-fs-step ${i === step ? 'active' : ''}`} onClick={() => setStep(i)}>
              <div className="explain-fs-step-head">
                <span style={{fontSize:'1.1rem'}}>{s.emoji}</span>
                <span className="explain-fs-step-num">Step {i+1}</span>
                <h3>{s.title}</h3>
              </div>
              <p>{s.content}</p>
              <div className="explain-fs-example">
                <span className="explain-fs-example-label">🌍 Real-world:</span>
                <span>{s.example}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="explain-fs-summary"><strong>📝 Summary:</strong> {explanation?.summary}</div>
        <div className="explain-fs-practice"><strong>🎯 Try this:</strong> {explanation?.practice}</div>
      </div>

      {/* Controls */}
      <div className="explain-fs-controls">
        <button className="explain-fs-btn" onClick={speakAll} disabled={speaking}>
          {speaking ? '🔊 Speaking...' : '▶ Play Narration'}
        </button>
        {speaking && <button className="explain-fs-btn stop" onClick={stopSpeak}>⏹ Stop</button>}
        <button className="explain-fs-btn nav" onClick={() => setStep(Math.max(0, step-1))} disabled={step===0}>← Prev</button>
        <button className="explain-fs-btn nav" onClick={() => setStep(Math.min((explanation?.steps?.length||1)-1, step+1))} disabled={step>=(explanation?.steps?.length||1)-1}>Next →</button>
      </div>
    </div>
  );
}

function buildExplanation(title) {
  const t = title.toLowerCase();
  const explanations = {
    'linked list': {
      title: 'Understanding Linked Lists',
      intro: 'Imagine a treasure hunt where each clue tells you where to find the next one. That\'s exactly how a Linked List works! Each element (node) contains data AND a pointer to the next element.',
      steps: [
        { emoji:'📦', title:'What is a Node?', content:'A node is like a box with two compartments — one holds the data, the other holds the address of the next box.', example:'Think of a train — each coach (node) is connected to the next coach. You can only move forward by following the connection.' },
        { emoji:'🔗', title:'How Linking Works', content:'Each node stores a reference (pointer) to the next node. The last node points to NULL, meaning "end of list".', example:'Like a scavenger hunt — each clue tells you where the next clue is. The last clue says "You found the treasure!"' },
        { emoji:'➕', title:'Insertion', content:'To add a node, you just change the pointers. No shifting of elements like in arrays! O(1) at the beginning.', example:'Imagine a line of people holding hands. To add someone, you just break one handhold and insert the new person.' },
        { emoji:'❌', title:'Deletion', content:'To remove a node, the previous node skips over it and points to the next one. The removed node is freed from memory.', example:'Like removing a link from a chain — you connect the links on either side and remove the middle one.' },
        { emoji:'⚡', title:'Types of Linked Lists', content:'Singly (one direction), Doubly (both directions), Circular (last connects to first). Each has its use case.', example:'Singly = one-way street, Doubly = two-way street, Circular = a roundabout.' },
      ],
      summary: 'Linked Lists are ideal when you need frequent insertions/deletions and don\'t need random access. Arrays are better for indexed access.',
      practice: 'Try implementing a function to reverse a singly linked list. Think about what happens to the pointers!',
    },
    'arrays': {
      title: 'Understanding Arrays',
      intro: 'Think of a row of numbered lockers in a school. Each locker has a number (index) and stores one item. That\'s an array — a contiguous block of memory with indexed access!',
      steps: [
        { emoji:'📦', title:'What is an Array?', content:'An array stores elements in contiguous memory locations. Each element is accessed by its index (0, 1, 2...).', example:'Like numbered parking spots in a lot — spot 0, spot 1, spot 2. You go directly to spot 5 without checking others.' },
        { emoji:'⚡', title:'Random Access O(1)', content:'Since elements are stored side-by-side, accessing any element by index takes constant time.', example:'Like opening locker #42 directly — you don\'t need to open lockers 1 through 41 first.' },
        { emoji:'➕', title:'Insertion Challenges', content:'Inserting in the middle requires shifting all subsequent elements. This is O(n) in the worst case.', example:'Like squeezing into the middle of a theater row — everyone to your right must shift one seat.' },
        { emoji:'🔍', title:'Searching', content:'Linear search checks every element O(n). But if sorted, binary search gives O(log n)!', example:'Finding a name in an unsorted class list vs. a sorted phonebook — totally different speeds.' },
        { emoji:'🎯', title:'Two Pointers & Sliding Window', content:'Advanced techniques use two indices to solve problems efficiently without nested loops.', example:'Like two people searching a hallway from both ends — they meet in the middle, covering everything once.' },
      ],
      summary: 'Arrays give O(1) random access but O(n) insertion/deletion. Best for fixed-size data with frequent reads.',
      practice: 'Find the maximum sum subarray using Kadane\'s Algorithm. Can you do it in one pass?',
    },
  };

  // Default explanation for any topic
  const defaultExp = {
    title: `Understanding ${title}`,
    intro: `Let\'s explore ${title} with real-world analogies! Every concept in DSA maps to something you already know from daily life.`,
    steps: [
      { emoji:'📦', title:`What is ${title}?`, content:`${title} is a fundamental concept in Data Structures & Algorithms that helps organize and process data efficiently.`, example:'Think of organizing books on a shelf — the method you choose affects how quickly you can find or add books.' },
      { emoji:'⚙️', title:'How it Works', content:`The core mechanism involves specific operations that manipulate data in a structured way for optimal performance.`, example:'Like a well-organized kitchen — everything has its place, making cooking (processing) much faster.' },
      { emoji:'📊', title:'Time Complexity', content:'Understanding when to use this structure depends on the time complexity of its operations.', example:'Choosing between stairs and elevator depends on which floor — similarly, choose the right structure for your data size.' },
      { emoji:'🌍', title:'Real Applications', content:`${title} is used in databases, operating systems, web browsers, and many everyday applications you use.`, example:'Your browser\'s back button, undo in text editors, GPS navigation — all use these concepts!' },
      { emoji:'💡', title:'Pro Tips', content:'Master the basics first, then learn the variations and optimizations. Practice with real coding problems.', example:'Like learning to drive — first learn the basics, then parallel parking and highway driving.' },
    ],
    summary: `${title} is essential for writing efficient code. Understanding it well opens doors to solving complex problems.`,
    practice: `Implement a basic version of ${title} from scratch and test it with sample inputs.`,
  };

  for (const [key, exp] of Object.entries(explanations)) {
    if (t.includes(key)) return exp;
  }
  return defaultExp;
}

import React, { useState, useRef, useEffect } from 'react';
import { parseTOON } from '../../utils/toonParser';
import ToonRenderer, { CATEGORY_THEMES } from './visuals/ToonRenderer';
import { getTopicTemplate } from './topicFallbacks';
import { useApp } from '../../context/AppContext';
import './MeanClassroom.css';

/* ── AI helpers ── */
// Resolve API key: app settings key > TeacherClassroom local keys
function resolveKey(appKey) {
  const cleaned = (appKey || '').trim();
  if (cleaned) {
    const isGemini = cleaned.includes('AIza');
    return { or: isGemini ? '' : cleaned, g: isGemini ? cleaned : '' };
  }
  // Fallback to TeacherClassroom localStorage keys
  return {
    or: (localStorage.getItem('meanai_openrouter_key') || '').trim(),
    g: (localStorage.getItem('meanai_gemini_key') || '').trim(),
  };
}

async function fetchAI(messages, appKey, maxTokens = 3000) {
  const { or: orKey, g: gKey } = resolveKey(appKey);
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

async function streamAI(messages, onChunk, appKey, maxTokens = 3000) {
  const { or: orKey, g: gKey } = resolveKey(appKey);
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

/* ── Subject Categories ── */
const SUBJECT_CATEGORIES = [
  { key: 'math',     icon: '📐', label: 'Mathematics',     examples: ['Quadratic Equations', 'Calculus Derivatives', 'Trigonometry', 'Probability'] },
  { key: 'physics',  icon: '⚡', label: 'Physics',          examples: ["Newton's Laws", 'Wave Motion', 'Electric Circuits', 'Optics'] },
  { key: 'chemistry',icon: '🧪', label: 'Chemistry',        examples: ['Water Molecule H2O', 'Chemical Bonding', 'Periodic Table', 'Organic Chemistry'] },
  { key: 'dsa',      icon: '🧮', label: 'DSA',              examples: ['Binary Search Tree', 'Linked List', 'Dynamic Programming', 'Graph Algorithms'] },
  { key: 'ai_ml',    icon: '🧠', label: 'AI & ML',          examples: ['Neural Networks', 'Backpropagation', 'CNN Architecture', 'Gradient Descent'] },
  { key: 'fullstack',icon: '🌐', label: 'Full Stack',       examples: ['REST API Design', 'React Components', 'Database Schema', 'Authentication Flow'] },
  { key: 'system_design', icon: '🏗️', label: 'System Design', examples: ['Load Balancing', 'Microservices', 'Caching Strategies', 'Message Queues'] },
  { key: 'coding',   icon: '💻', label: 'All Coding',       examples: ['OOP Principles', 'Design Patterns', 'Recursion', 'Big O Notation'] },
];

/* ── Math topic detection ── */
function isMathTopic(t) {
  return /quadrat|algebra|calcul|trig|geom|math|equation|integr|deriv|matrix|probab|statist|factor|polynom|limit|differen|logarithm|function|graph|parabola|hyperbola|ellipse|sine|cosine|tangent|vector|determinant|binomial|permut|combin|set.?theory|number.?line|inequalit|ratio|proportion|percentage|area|volume|perimeter|circumference|angle|triangle|circle|rectangle|square|cone|sphere|cylinder|∫|∑|√|solve|find.*root|prove|simplif|expand|evaluat/i.test(t);
}

/* ── Math System Prompt — In-depth step-by-step solving with graphs & shapes ── */
const MATH_SYSTEM_PROMPT = `You are MEAN Math Solver — a JEE/competitive math expert who SOLVES problems IN DETAIL step-by-step on a visual whiteboard.

CRITICAL RULES:
- SOLVE the problem showing EVERY single calculation and sub-step IN DETAIL.
- NO definitions. NO real-world examples. NO analogies. NO chat text. NO teaching — ONLY solving.
- Show the FULL mathematical working: substitutions, simplifications, intermediate results.
- Each step should be thorough — show WHY each transformation happens.
- DRAW the graph or geometric shape with ALL measurements.
- The LAST step must have an "answer" field with the final boxed answer.
- Return ONLY valid TOON format. Blocks separated by ---.

═══ BLOCK 1 — Config ═══
---
type: config
topic: <problem statement>
category: math

═══ BLOCK 2 — Diagram ═══
DRAW the mathematical figure. Use these element kinds:
- axis: Coordinate axes with ticks. Props: x, y, w, h, xMin, xMax, yMin, yMax, tickStep, xLabel, yLabel
- plotline: Function curve. Props: points (SVG polyline points string), color, label
- dot/point: Point marker. Props: x, y, r, label, color
- line: Straight line. Props: x1, y1, x2, y2, label, color, dashed
- arrow: Directed line. Props: x1, y1, x2, y2, label, color
- dimension: Measurement with arrows both ends. Props: x1, y1, x2, y2, label, color
- arc/angle: Angle arc. Props: x, y, r, startAngle, endAngle, label, color
- circle: Circle. Props: x (cx), y (cy), r, label, color
- polygon/triangle: Polygon. Props: points (SVG points string), label, color
- region/area: Shaded region. Props: points (SVG polygon points string), color, label
- text: Label text. Props: x, y, label, color, fontSize, bold, anchor
- box: Rectangle. Props: x, y, w, h, label, color
- wave/sine: Wave curve. Props: x, y, w, amplitude, frequency, label, color

Canvas: 600x380. step:0 = always visible.
Draw 8-25 elements. Include axis labels, measurement values, angle degrees, coordinate points.

For GRAPHS: Always include axis element with proper xMin/xMax/yMin/yMax, then plotline with computed points.
For GEOMETRY: Draw the shape with polygon/line, add dimension lines showing side lengths, arc elements showing angles with degree values.

═══ BLOCK 3+ — Solution Steps (6-12 DETAILED steps) ═══
Each step must be DETAILED with thorough mathematical working:

---
type: step
title: <Clear label — e.g. "Factorize the expression", "Apply quadratic formula">
point1: <Line of mathematical working>
point2: <Next line — substitution, expansion, or simplification>
point3: <Continue the working — show intermediate calculation>
point4: <Next line of working or result>
point5: <Additional detail — verification, alternate form, or note>
point6: <Extra working line if needed>
equation: <The KEY equation for this step — displayed prominently centered>
answer: <ONLY on the LAST step — the final answer, displayed in a box>

IMPORTANT FORMATTING RULES:
- Use 6-12 steps minimum. Break complex problems into MANY small steps.
- Each step focuses on ONE mathematical operation (factor, substitute, simplify, etc.)
- "equation" field = the main equation/formula shown centered in large font
- "answer" field = ONLY on the final step = boxed final answer
- point1-point6: show the actual working, not descriptions
- Use mathematical symbols: ², ³, √, ∫, π, θ, ±, ∞, ≤, ≥, ⇒, →, ∴, ∵
- DO NOT include: realworld, chat, subtopic, example, explain fields.

═══ EXAMPLE — Solve x² - 5x + 6 = 0 ═══
---
type: config
topic: Solve x² - 5x + 6 = 0
category: math
---
type: diagram
title: Graph of y = x² - 5x + 6
width: 600
height: 380
>element
  kind: axis
  x: 50
  y: 10
  w: 500
  h: 300
  xMin: -1
  xMax: 6
  yMin: -2
  yMax: 8
  tickStep: 1
  xLabel: x
  yLabel: y
  color: #3b82f6
  step: 0
>element
  kind: plotline
  points: 50,298 120,210 190,138 260,82 330,42 365,34 400,42 470,82 540,160
  color: #3b82f6
  label: y = x² - 5x + 6
  x: 400
  y: 330
  step: 0
>element
  kind: dot
  x: 214
  y: 310
  r: 5
  label: (2, 0)
  color: #ef4444
  step: 0
>element
  kind: dot
  x: 297
  y: 310
  r: 5
  label: (3, 0)
  color: #ef4444
  step: 0
>element
  kind: dot
  x: 330
  y: 42
  r: 4
  label: vertex (2.5, -0.25)
  color: #f59e0b
  step: 0
>element
  kind: text
  x: 300
  y: 370
  label: Roots: x = 2, x = 3
  color: #10b981
  fontSize: 13
  bold: true
  anchor: middle
  step: 0
---
type: step
title: Given Equation
point1: We are given the quadratic equation:
point2: x² - 5x + 6 = 0
point3: This is in standard form ax² + bx + c = 0
point4: Comparing: a = 1, b = -5, c = 6
equation: x² − 5x + 6 = 0
---
type: step
title: Calculate the Discriminant
point1: Discriminant D = b² - 4ac
point2: D = (-5)² - 4(1)(6)
point3: D = 25 - 24
point4: D = 1
point5: Since D > 0, the equation has two distinct real roots
point6: Since D is a perfect square, roots are rational ⇒ factorable
equation: D = b² − 4ac = 25 − 24 = 1
---
type: step
title: Factorize
point1: We need two numbers that multiply to give c = 6
point2: And add up to give b = -5
point3: Checking: (-2) × (-3) = 6 ✓
point4: Checking: (-2) + (-3) = -5 ✓
point5: ∴ x² - 5x + 6 = (x - 2)(x - 3)
equation: x² − 5x + 6 = (x − 2)(x − 3)
---
type: step
title: Set Each Factor to Zero
point1: For the product to be zero, at least one factor must be zero:
point2: x - 2 = 0  ⇒  x = 2
point3: x - 3 = 0  ⇒  x = 3
point4: These are the two roots of the equation
equation: x − 2 = 0 ⇒ x = 2  ,  x − 3 = 0 ⇒ x = 3
---
type: step
title: Verify x = 2
point1: Substituting x = 2 in the original equation:
point2: (2)² - 5(2) + 6
point3: = 4 - 10 + 6
point4: = 0 ✓
point5: LHS = RHS, so x = 2 is correct
equation: f(2) = 4 − 10 + 6 = 0 ✓
---
type: step
title: Verify x = 3
point1: Substituting x = 3 in the original equation:
point2: (3)² - 5(3) + 6
point3: = 9 - 15 + 6
point4: = 0 ✓
point5: LHS = RHS, so x = 3 is correct
equation: f(3) = 9 − 15 + 6 = 0 ✓
---
type: step
title: Additional Properties
point1: Sum of roots = -b/a = -(-5)/1 = 5
point2: Check: 2 + 3 = 5 ✓
point3: Product of roots = c/a = 6/1 = 6
point4: Check: 2 × 3 = 6 ✓
point5: Vertex of parabola at x = -b/(2a) = 5/2 = 2.5
point6: y at vertex = (2.5)² - 5(2.5) + 6 = 6.25 - 12.5 + 6 = -0.25
equation: Sum = 5, Product = 6, Vertex = (2.5, −0.25)
---
type: step
title: Roots
point1: The quadratic equation x² - 5x + 6 = 0 has two real roots
point2: Found by factorization method
point3: Verified by substitution
answer: x = 2, x = 3`;

/* ── Universal System Prompt ── */
const CLASSROOM_SYSTEM_PROMPT = `You are MEAN Classroom AI — a world-class visual teacher who explains ANY topic like a real human teacher on a whiteboard.

Given ANY topic, you MUST:
1. Detect the subject category
2. DRAW a detailed diagram using >element sub-items (boxes, circles, arrows, lines, text)
3. Write 5-7 teaching steps that EXPLORE THE TOPIC IN DEPTH — including sub-topics

Return ONLY valid TOON format. Blocks separated by ---.

CATEGORIES: math, physics, chemistry, biology, dsa, coding, ai_ml, fullstack, system_design

═══ BLOCK 1 — Config ═══
---
type: config
topic: <topic>
category: <category>

═══ BLOCK 2 — Diagram ═══
Draw with >element sub-items. ELEMENT KINDS: box, circle, arrow, line, text, icon, diamond, pill, wave, highlight
Each element has: kind, x, y, w, h, r, label, sublabel, color, step, fontSize, x1, y1, x2, y2, dashed, bold, mono, anchor, amplitude, frequency
Canvas: 600x340. step:0 = always visible. step:N = appears at step N.
Draw 10-20 elements. Use arrows for flow, circles for nodes, boxes for concepts, text for definitions.

═══ BLOCK 3+ — Steps (5-7 steps) ═══
EACH STEP must teach like a human teacher with these fields:

---
type: step
title: <Side Heading — clear topic/sub-topic name>
point1: <First key point — short, clear definition or fact>
point2: <Second key point — how it works or why it matters>
point3: <Third key point — technical detail, formula, or rule>
point4: <Fourth key point — edge case, tip, or comparison>
realworld: <MANDATORY real-world example/analogy that makes it click>
code: <Code snippet, formula, or equation if relevant to this step>
subtopic: <Related sub-topic to explore deeper, or empty>
chat: <What the AI tutor says conversationally — friendly, encouraging>

═══ TEACHING RULES ═══
- Start with the BIG PICTURE, then ZOOM INTO sub-topics
- Each step should cover a DIFFERENT aspect or sub-topic
- Step 1: Definition + Overview (what is it?)
- Step 2-3: Core mechanics + sub-concepts (how does it work?)
- Step 4-5: Technical details, complexity, formulas
- Step 6-7: Applications, comparisons, when to use
- ALWAYS include real-world examples — students learn through analogies
- If the topic has sub-topics (e.g., "Arrays" has indexing, insertion, deletion, searching), cover each as a separate step
- Include code/formulas ONLY when relevant (math equations, code snippets, Big-O notation)
- Diagram elements should progressively reveal matching each step

═══ EXAMPLE — Stack Data Structure ═══
---
type: config
topic: Stack
category: dsa
---
type: diagram
title: Stack — LIFO Data Structure
width: 600
height: 340
>element
  kind: text
  x: 300
  y: 20
  label: Stack: Last In, First Out (LIFO)
  color: #c4b5fd
  fontSize: 15
  bold: true
  anchor: middle
  step: 0
>element
  kind: box
  x: 220
  y: 250
  w: 160
  h: 40
  label: 10
  sublabel: Bottom
  color: #8b5cf6
  step: 1
>element
  kind: box
  x: 220
  y: 200
  w: 160
  h: 40
  label: 20
  color: #8b5cf6
  step: 2
>element
  kind: box
  x: 220
  y: 150
  w: 160
  h: 40
  label: 30
  color: #10b981
  step: 2
>element
  kind: arrow
  x1: 180
  y1: 120
  x2: 180
  y2: 155
  label: push
  color: #10b981
  step: 3
>element
  kind: arrow
  x1: 420
  y1: 155
  x2: 420
  y2: 120
  label: pop
  color: #ef4444
  step: 4
>element
  kind: text
  x: 30
  y: 100
  label: TOP →
  color: #f59e0b
  fontSize: 12
  bold: true
  step: 3
>element
  kind: text
  x: 30
  y: 300
  label: Operations: push(), pop(), peek()
  color: #888
  fontSize: 10
  step: 5
>element
  kind: text
  x: 400
  y: 300
  label: Time: O(1) for all ops
  color: #10b981
  fontSize: 10
  bold: true
  step: 5
---
type: step
title: What is a Stack?
point1: A Stack is a linear data structure that follows LIFO — Last In, First Out
point2: Elements can only be added or removed from the TOP — no random access
point3: Think of it as a restricted list where only one end is accessible
point4: Stacks are fundamental in computing — used in function calls, undo systems, parsing
realworld: Stack of plates in a cafeteria — you always take the top plate, and new plates go on top. You can never pull from the middle!
code: Stack<int> s; // Empty stack created
subtopic: LIFO vs FIFO
chat: 👋 Welcome! A Stack is like a stack of plates — last plate placed is the first one taken. Simple but powerful!
---
type: step
title: Push — Adding Elements
point1: push(x) adds element x to the TOP of the stack
point2: The stack grows upward — each push increases size by 1
point3: Push is always O(1) — constant time, no matter the stack size
point4: If using a fixed array, push can fail when stack is full (Stack Overflow!)
realworld: Like stacking books on a desk — each new book goes on top of the pile
code: s.push(10); s.push(20); s.push(30); // Stack: [10, 20, 30] top=30
subtopic: Stack Overflow
chat: Watch the diagram! We push 10, 20, 30 — each one stacks on top. The last pushed (30) is now at the TOP.
---
type: step
title: Pop — Removing Elements
point1: pop() removes and returns the TOP element
point2: After pop, the element below becomes the new top
point3: Pop is O(1) — just remove top, no shifting needed
point4: Popping from empty stack causes underflow — always check isEmpty() first
realworld: Removing the top plate from a stack — the plate below is now exposed
code: s.pop(); // Returns 30, stack becomes [10, 20]
subtopic: Stack Underflow
chat: Pop removes from the top! We pop 30, now 20 is the new top. Always check if stack is empty before popping!
---
type: step
title: Peek & Key Operations
point1: peek() returns the top element WITHOUT removing it — just looking
point2: isEmpty() checks if stack has any elements — prevents underflow
point3: size() returns current number of elements in the stack
point4: All three operations are O(1) — instant access to top
realworld: Looking at the top plate without picking it up — you know what's on top without disturbing the stack
code: s.peek(); // Returns 20 (doesn't remove it)
subtopic: Stack implementation using array vs linked list
chat: peek() is like peeking at the top plate without touching it. O(1) for everything — that's the beauty of stacks!
---
type: step
title: Real Applications of Stacks
point1: Function Call Stack — every function call pushes a frame, return pops it
point2: Undo/Redo in editors — each action is pushed, Ctrl+Z pops the last one
point3: Browser Back button — pages are pushed onto history stack
point4: Expression parsing — compilers use stacks to evaluate mathematical expressions
realworld: Your browser's back button IS a stack! Each page you visit gets pushed, clicking back pops the last page
code: // Balanced parentheses check using stack
subtopic: Call Stack and Recursion
chat: ⚡ Stacks are EVERYWHERE! Your browser back button, Ctrl+Z, even how functions call each other — all stacks!`;

/* ── Main Component ── */
export default function MeanClassroom({ onClose }) {
  const { apiKey: appKey } = useApp();
  const [topic, setTopic] = useState('');
  const [toonBlocks, setToonBlocks] = useState([]);
  const [streamText, setStreamText] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState('default');
  const timerRef = useRef(null);

  // Saved classes
  const [savedClasses, setSavedClasses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mc_saved_classes') || '[]'); } catch { return []; }
  });
  const saveCurrentClass = () => {
    if (!toonBlocks.length) return;
    const cls = { id: Date.now(), topic: configBlock.topic || topic, category, blocks: toonBlocks, date: new Date().toLocaleDateString() };
    const updated = [cls, ...savedClasses].slice(0, 20);
    setSavedClasses(updated);
    localStorage.setItem('mc_saved_classes', JSON.stringify(updated));
  };
  const loadClass = (cls) => { setToonBlocks(cls.blocks); setStepIdx(0); setTopic(cls.topic); setDetectedCategory(cls.category || 'default'); };
  const deleteClass = (id) => {
    const updated = savedClasses.filter(c => c.id !== id);
    setSavedClasses(updated);
    localStorage.setItem('mc_saved_classes', JSON.stringify(updated));
  };

  const configBlock = toonBlocks.find(b => b.type === 'config') || {};
  const stepBlocks = toonBlocks.filter(b => b.type === 'step');
  const currentStep = stepBlocks[stepIdx] || {};
  const category = configBlock.category || detectedCategory;
  const theme = CATEGORY_THEMES[category] || CATEGORY_THEMES.default;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setStepIdx(0);
    setToonBlocks([]);
    setStreamText('');

    try {
      const isMath = isMathTopic(topic.trim());
      const sysPrompt = isMath ? MATH_SYSTEM_PROMPT : CLASSROOM_SYSTEM_PROMPT;
      const userMsg = isMath
        ? `Solve this math problem step by step, showing every calculation. Draw the graph or geometric shape with all measurements, coordinates, and labels: "${topic.trim()}"`
        : `Explain "${topic.trim()}" with detailed step-by-step theory. If this is a math/JEE problem, solve it step by step showing every calculation. Include real-world examples. If a graph or diagram is essential (math functions, data structures, chemistry molecules), draw it with >element sub-items. Detect the subject category automatically.`;

      if (isMath) setDetectedCategory('math');

      const final = await streamAI([
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userMsg }
      ], (partial) => {
        setStreamText(partial);
        const blocks = parseTOON(partial);
        if (blocks.length > 0) {
          setToonBlocks(blocks);
          const cat = blocks.find(b => b.category)?.category;
          if (cat) setDetectedCategory(cat);
        }
      }, appKey, 4000);

      const blocks = parseTOON(final);
      if (blocks.length > 0) {
        setToonBlocks(blocks);
        const cat = blocks.find(b => b.category)?.category;
        if (cat) setDetectedCategory(cat);
      } else {
        setToonBlocks(getFallbackBlocks(topic.trim()));
      }
    } catch (err) {
      console.error('AI fetch error:', err);
      setToonBlocks(getFallbackBlocks(topic.trim()));
    }
    setLoading(false);
    setStreamText('');
  };

  const hasContent = stepBlocks.length > 0;
  const isMathMode = category === 'math';
  const progress = hasContent ? ((stepIdx + 1) / stepBlocks.length) * 100 : 0;
  const hasDiagram = toonBlocks.some(b => b.type === 'diagram');

  return (
    <div className="mc-overlay">
      {/* ── Top Bar ── */}
      <div className="mc-topbar" style={{ borderBottomColor: `${theme.accent}20` }}>
        <div className="mc-topbar-left">
          <div className="mc-logo" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}99)` }}>
            {theme.icon}
          </div>
          <div>
            <div className="mc-brand">MEAN CLASSROOM</div>
            <div className="mc-sub">Universal AI Learning</div>
          </div>
        </div>
        {hasContent && (
          <div className="mc-topic-badge" style={{ background: `${theme.accent}15`, borderColor: `${theme.accent}30`, color: theme.accent }}>
            {theme.icon} {configBlock.topic || topic}
          </div>
        )}
        <button className="mc-topbar-btn close-btn" onClick={onClose}>✕</button>
      </div>

      {/* ── Classroom Body ── */}
      <div className="mc-classroom">
        {/* Main Content — Theory First */}
        <div className="mc-canvas-left">
          <div className="mc-canvas-card">
            {(hasContent && isMathMode) || (loading && isMathMode && toonBlocks.length > 0) ? (
              /* ── MATH MODE: Diagram + All Steps rendered LIVE (No buffering screen) ── */
              <>
                <h2 className="mc-canvas-title" style={{ color: theme.accent }}>
                  📐 {configBlock.topic || topic}
                  {loading && <span className="mc-math-loading-badge">solving...</span>}
                </h2>

                {/* Diagram at top — all elements visible */}
                {hasDiagram && (
                  <div className="mc-visual-area" style={{ marginBottom: 16 }}>
                    <ToonRenderer blocks={toonBlocks} stepIdx={999} category={category} />
                  </div>
                )}

                {/* ALL solution steps — rendered live as they stream in */}
                <div className="mc-math-steps">
                  {stepBlocks.map((step, idx) => (
                    <div key={idx} className={`mc-math-step ${step.answer ? 'mc-math-step-final' : ''}`} style={{ borderLeftColor: theme.accent }}>
                      <div className="mc-math-step-header">
                        <span className="mc-math-step-num" style={{ background: `${theme.accent}20`, color: theme.accent }}>
                          {idx + 1}
                        </span>
                        <h3 className="mc-math-step-title" style={{ color: theme.accent }}>
                          {step.title || `Step ${idx + 1}`}
                        </h3>
                      </div>
                      <div className="mc-math-step-body">
                        {[step.point1, step.point2, step.point3, step.point4, step.point5, step.point6]
                          .filter(Boolean)
                          .map((pt, i) => (
                            <div key={i} className="mc-math-line">
                              <span className="mc-math-line-text">{pt}</span>
                            </div>
                          ))}
                      </div>
                      {/* Centered equation display */}
                      {(step.equation || step.code) && (
                        <div className="mc-math-equation-display" style={{ borderColor: `${theme.accent}20` }}>
                          <span className="mc-math-equation-text" style={{ color: theme.accent }}>
                            {step.equation || step.code}
                          </span>
                        </div>
                      )}
                      {/* Boxed final answer */}
                      {step.answer && (
                        <div className="mc-math-answer-box" style={{ borderColor: theme.accent, color: '#fff' }}>
                          <span className="mc-math-answer-text">{step.answer}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : hasContent ? (
              /* ── NORMAL MODE: Slide-based with real-world examples ── */
              <>
                <h2 className="mc-canvas-title" style={{ color: theme.accent }}>
                  {configBlock.topic || topic}
                </h2>
                <p className="mc-canvas-desc">{stepBlocks[0]?.point1?.split('.')[0] || stepBlocks[0]?.explain?.split('.')[0] || ''}.</p>

                {/* Theory Explanation — Primary Content */}
                <div className="mc-explain-panel" style={{ borderColor: `${theme.accent}20` }}>
                  <div className="mc-explain-header">
                    <span className="mc-explain-step-num" style={{ background: `${theme.accent}20`, color: theme.accent }}>
                      {stepIdx + 1}
                    </span>
                    <h3 className="mc-explain-title" style={{ color: theme.accent }}>
                      {currentStep.title || ''}
                    </h3>
                  </div>
                  <div className="mc-explain-points">
                    {[currentStep.point1, currentStep.point2, currentStep.point3, currentStep.point4]
                      .filter(Boolean)
                      .map((pt, i) => (
                        <div key={i} className="mc-point-item">
                          <span className="mc-point-dot" style={{ background: theme.accent }} />
                          <span className="mc-point-text">{pt}</span>
                        </div>
                      ))}
                    {!currentStep.point1 && currentStep.explain && (
                      <div className="mc-point-item">
                        <span className="mc-point-dot" style={{ background: theme.accent }} />
                        <span className="mc-point-text">{currentStep.explain}</span>
                      </div>
                    )}
                  </div>
                  {(currentStep.realworld || currentStep.example) && (
                    <div className="mc-realworld-box">
                      <span className="mc-realworld-icon">🌍</span>
                      <div>
                        <span className="mc-realworld-label">Real-World Example</span>
                        <p className="mc-realworld-text">{currentStep.realworld || currentStep.example}</p>
                      </div>
                    </div>
                  )}
                  {currentStep.code && (
                    <div className="mc-step-code">
                      <span className="mc-code-label">{/math|physics/i.test(category) ? '📐 Formula / Solution' : '💻 Code'}</span>
                      <pre className="mc-code-block">{currentStep.code}</pre>
                    </div>
                  )}
                  {currentStep.subtopic && (
                    <button className="mc-subtopic-btn" onClick={() => setTopic(currentStep.subtopic)}
                      style={{ borderColor: `${theme.accent}30`, color: theme.accent }}>
                      🔍 Explore: {currentStep.subtopic} →
                    </button>
                  )}
                </div>

                {/* Diagram — Only when graph/diagram elements exist */}
                {hasDiagram && (
                  <div className="mc-visual-area" style={{ marginTop: 14 }}>
                    <ToonRenderer blocks={toonBlocks} stepIdx={stepIdx} category={category} />
                  </div>
                )}
              </>
            ) : loading ? (
              <div className="mc-empty-state">
                <div className="mc-loading-avatar">🤖</div>
                <h3 style={{ color: '#fff', margin: '8px 0 4px' }}>Generating explanation for "{topic}"...</h3>
                {streamText && <pre className="mc-stream-preview">{streamText.slice(-200)}</pre>}
                <div className="mc-loading-dots"><span /><span /><span /></div>
              </div>
            ) : (
              <div className="mc-empty-state">
                <div className="mc-hero-icon">🎓</div>
                <h3 className="mc-hero-title">MEAN Classroom</h3>
                <p className="mc-hero-sub">Learn anything — Math, Physics, Chemistry, Coding, AI & more</p>
                <p style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: 4 }}>
                  🔢 JEE Math: "Solve ∫x²dx", "Find roots of x²-5x+6=0", "Differentiate sin(x²)"
                </p>
                <div className="mc-subject-grid">
                  {SUBJECT_CATEGORIES.map(cat => (
                    <button key={cat.key} className="mc-subject-card"
                      style={{ borderColor: `${CATEGORY_THEMES[cat.key].accent}30` }}
                      onClick={() => {
                        const example = cat.examples[Math.floor(Math.random() * cat.examples.length)];
                        setTopic(example);
                      }}>
                      <span className="mc-subject-icon">{cat.icon}</span>
                      <span className="mc-subject-label">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Playback — hidden for math mode (all steps shown at once) */}
          {hasContent && !isMathMode && (
            <div className="mc-playback">
              <button className="mc-play-btn" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)` }}
                onClick={() => setPlaying(!playing)}>{playing ? '⏸' : '▶'}</button>
              <div className="mc-progress-bar">
                <div className="mc-progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent}99)` }} />
                <input type="range" min={0} max={stepBlocks.length - 1} value={stepIdx}
                  onChange={e => { setStepIdx(+e.target.value); setPlaying(false); }} />
              </div>
              <span className="mc-step-count">Step {stepIdx + 1} / {stepBlocks.length}</span>
              <button className="mc-replay-btn" onClick={() => { setStepIdx(0); setPlaying(true); }}>↻</button>
            </div>
          )}

          {/* Topic Input */}
          <form className="mc-topic-form" onSubmit={handleSubmit}>
            <input className="mc-prompt-input" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder='Ask anything — "Quadratic Equations", "Solve ∫x²dx", "Binary Search Tree"...'
              disabled={loading} />
            <button className="mc-prompt-submit" type="submit" disabled={loading || !topic.trim()}
              style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)` }}>
              {loading ? '⏳' : '→'}
            </button>
          </form>
        </div>

        {/* Right — Saved Classes */}
        <div className="mc-classes-right">
          <div className="mc-classes-header">
            <span className="mc-classes-title">📚 My Classes</span>
            {hasContent && (
              <button className="mc-save-btn" onClick={saveCurrentClass}
                style={{ background: `${theme.accent}20`, color: theme.accent, border: `1px solid ${theme.accent}30` }}>
                💾 Save
              </button>
            )}
          </div>
          <div className="mc-classes-list">
            {savedClasses.length === 0 ? (
              <div className="mc-classes-empty">
                <span style={{ fontSize: '2rem' }}>📝</span>
                <p>No saved classes yet</p>
                <p className="mc-classes-hint">Generate a topic, then click Save</p>
              </div>
            ) : (
              savedClasses.map(cls => (
                <div key={cls.id} className="mc-class-item" onClick={() => loadClass(cls)}>
                  <span className="mc-class-icon">{CATEGORY_THEMES[cls.category]?.icon || '📘'}</span>
                  <div className="mc-class-info">
                    <span className="mc-class-name">{cls.topic}</span>
                    <span className="mc-class-date">{cls.date}</span>
                  </div>
                  <button className="mc-class-delete" onClick={(e) => { e.stopPropagation(); deleteClass(cls.id); }}>✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Fallback blocks when AI unavailable — uses topic-specific templates ── */
function getFallbackBlocks(topic) {
  // Try topic-specific template first
  const tpl = getTopicTemplate(topic);
  if (tpl) return parseTOON(tpl);

  const t = topic.toLowerCase();
  let cat = 'dsa';
  const colors = { dsa:'#8b5cf6', math:'#3b82f6', physics:'#f59e0b', chemistry:'#10b981', ai_ml:'#06b6d4', fullstack:'#ec4899', system_design:'#f97316', coding:'#6366f1' };

  if (/quadrat|algebra|calcul|trig|geom|math|equation|integr|deriv|matrix|probab|statist/i.test(t)) cat = 'math';
  else if (/newton|physics|force|wave|motion|electric|magnet|optic|thermo|gravity|velocity|acceleration/i.test(t)) cat = 'physics';
  else if (/chem|molecule|atom|element|bond|reaction|periodic|organic|compound|acid|base/i.test(t)) cat = 'chemistry';
  else if (/neural|deep.?learn|machine.?learn|ai|nlp|cnn|rnn|gradient|backprop|tensor/i.test(t)) cat = 'ai_ml';
  else if (/react|node|express|mongo|sql|database|frontend|backend|fullstack|api|rest|auth/i.test(t)) cat = 'fullstack';
  else if (/system.?design|scalab|microservice|load.?balanc|cache|message.?queue/i.test(t)) cat = 'system_design';
  else if (/oop|design.?pattern|solid|function|class|inherit|polymorphi|encapsul/i.test(t)) cat = 'coding';

  const c = colors[cat] || '#8b5cf6';

  return parseTOON(`---
type: config
topic: ${topic}
category: ${cat}
---
type: diagram
title: ${topic}
width: 600
height: 300
>element
  kind: text
  x: 300
  y: 25
  label: ${topic}
  color: ${c}
  fontSize: 18
  bold: true
  anchor: middle
  step: 0
>element
  kind: box
  x: 30
  y: 70
  w: 160
  h: 60
  label: Concept
  sublabel: Foundation
  color: ${c}
  step: 1
>element
  kind: arrow
  x1: 190
  y1: 100
  x2: 240
  y2: 100
  color: ${c}
  step: 1
>element
  kind: box
  x: 240
  y: 70
  w: 160
  h: 60
  label: Structure
  sublabel: How it works
  color: ${c}
  step: 2
>element
  kind: arrow
  x1: 400
  y1: 100
  x2: 440
  y2: 100
  color: ${c}
  step: 2
>element
  kind: box
  x: 440
  y: 70
  w: 130
  h: 60
  label: Apply
  sublabel: Real world
  color: ${c}
  step: 3
>element
  kind: icon
  x: 300
  y: 180
  label: 💡
  size: 32
  step: 4
>element
  kind: text
  x: 300
  y: 220
  label: Understanding ${topic} step by step
  color: #888
  fontSize: 12
  anchor: middle
  step: 4
>element
  kind: highlight
  x: 110
  y: 100
  r: 40
  color: ${c}
  step: 5
---
type: step
title: Introduction
index: -1
code:
explain: Let's explore ${topic}. This is a fascinating concept that we'll break down step by step with visuals.
example: Like exploring a new city — we'll start with the big picture and zoom into the details.
chat: Hello! 👋 Let's learn about ${topic}! I'll explain it step by step with interactive visuals.
---
type: step
title: Core Concept
index: 0
code: // Understanding the fundamentals
explain: Understanding the basic structure is key. Every concept builds on foundational principles that connect to real-world applications.
example: Think of building blocks — each piece supports the next to create something amazing.
chat: Let me show you the core concept. Notice how everything is organized and connected.
---
type: step
title: How It Works
index: 1
code: // Key mechanism
explain: The main mechanisms define how this concept operates — understanding the process flow is essential.
example: Like a recipe — you need to know the ingredients and steps to get the desired result.
chat: Now let's look at how it actually works. Each part plays a specific role.
---
type: step
title: Real-World Application
index: 2
code: // Practical usage
explain: This concept is used widely in real applications. Understanding it opens doors to solving complex problems efficiently.
example: Like learning to cook — once you know the basics, you can create any dish.
chat: See how this applies to the real world? That's where the magic happens!
---
type: step
title: Key Insights
index: -1
code: // Important consideration
explain: Understanding the deeper insights helps you apply this knowledge effectively. This is what separates beginners from experts.
example: Like learning chess — knowing the rules is one thing, but strategy makes you win.
chat: ⚡ Here's the key insight! This is what separates understanding from mastery. Keep practicing! 🎯`);
}

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { parseTOON, parsePartialTOON } from '../../utils/toonParser';
import './InlineClassroom.css';

export default function InlineClassroom({ topic, cachedSlides, onSaveSlides, onExpand }) {
  const { apiKey, user, selectedModel } = useApp();
  const [phase, setPhase] = useState('idle'); // idle, generating, done, error
  const [errorMsg, setErrorMsg] = useState('');
  const [slides, setSlides] = useState([]);
  const [iframeHtml, setIframeHtml] = useState('');
  const frameRef = useRef(null);
  const abortRef = useRef(null);
  const hasStartedRef = useRef(false);

  // Keep a ref to the latest parsed blocks so the iframe can request them
  const slidesRef = useRef([]);
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  // Handle iframe messages
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data === 'READY') {
        if (frameRef.current?.contentWindow && slidesRef.current.length > 0) {
          frameRef.current.contentWindow.postMessage({
            type: 'LOAD_ROADMAP',
            payload: slidesRef.current,
            isPartial: phase === 'generating'
          }, '*');
        }
      } else if (e.data?.type === 'SPEAK_TEXT') {
        // inline classroom doesn't auto-speak to avoid audio spam
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [phase]);

  // Fetch roadmap.html for srcDoc to avoid iframe origin/routing issues
  useEffect(() => {
    fetch(`/roadmap.html?v=${Date.now()}`)
      .then(r => r.text())
      .then(html => setIframeHtml(html))
      .catch(err => console.error('Failed to load roadmap.html for inline classroom:', err));
  }, []);

  // When iframe content loads, resend any accumulated slides (race condition recovery)
  useEffect(() => {
    if (!iframeHtml) return;
    const timer = setTimeout(() => {
      if (frameRef.current?.contentWindow && slidesRef.current.length > 0) {
        frameRef.current.contentWindow.postMessage({
          type: 'LOAD_ROADMAP',
          payload: slidesRef.current,
          isPartial: phase === 'generating'
        }, '*');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [iframeHtml, phase]);

  // Auto-start generation or use cache on mount
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    
    if (cachedSlides && cachedSlides.length > 0) {
      setSlides(cachedSlides);
      setPhase('done');
    } else {
      generateClass();
    }

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line
  }, []);

  const generateClass = async () => {
    if (!topic) return;
    setPhase('generating');
    setErrorMsg('');
    abortRef.current = new AbortController();

    // Show "Generating Tree..." placeholder immediately on the canvas
    setTimeout(() => {
      if (frameRef.current?.contentWindow) {
        frameRef.current.contentWindow.postMessage({ type: 'LOAD_ROADMAP', payload: [], isPartial: true }, '*');
      }
    }, 300);

    const outlinePrompt = `You are creating a visual block-diagram interactive Roadmap for "${topic}".
Return ONLY valid TOON format (Token-Oriented Object Notation). Current year: 2026.

TOON FORMAT RULES:
- Each block is separated by a line containing only ---
- Properties use key: value (one per line)
- Multi-line values (like code): use key: | then indent each line with 2 spaces
- Nested array items start with >tag (e.g. >dialog, >step) on its own line, then indented properties with 2 spaces
- Comma-separated arrays: connect: id1, id2, id3
- Variable maps: variables: x=5, y=10
- Do NOT use JSON syntax. No braces, no brackets, no quotes around keys/values.

CRITICAL GRAPH FRACTURING RULES:
1. MAX DEPTH 1: A tree can ONLY consist of ONE Parent and its immediate direct children.
2. FRACTURE SUB-TREES: If a child node needs its own children, create a separate disconnected tree where it is the new parent.
3. DUPLICATE WITH UNIQUE IDs: Give them different address IDs so the layout draws them as separate islands.

MANDATORY TEXTBLOCK RULE:
- EVERY block node MUST have AT LEAST ONE textblock connected to it.
- Add the textblock address to the block's connect list.
- Provide useful educational content. You can attach MULTIPLE textblocks per block.

MANDATORY CODE VISUALIZATION RULE:
- If the topic involves ANY coding, you MUST include these three connected blocks:
1. Coder block example:
---
type: coder
address: coder_1
group: g1
language: python
code: |
  x = 5
  y = 10
  print(x + y)
connect: viz_1
>dialog
  topic: Addition Program
  input: x=5, y=10
  output: 15
  explanation: This program demonstrates basic variable assignment and addition.

2. Visualizer block example:
---
type: visualizer
address: viz_1
group: g1
coder_ref: coder_1
connect: out_1
>step
  line: 1
  description: Assign 5 to variable x
  variables: x=5
  output:
>step
  line: 2
  description: Assign 10 to variable y
  variables: x=5, y=10
  output:
>step
  line: 3
  description: Print sum of x and y
  variables: x=5, y=10
  output: 15

3. Outputer block example:
---
type: outputer
address: out_1
group: g1
visualizer_ref: viz_1

- The group field MUST be the SAME across all 3 blocks.
- Include enough steps to trace FULL execution.

MANDATORY MATHBLOCK RULE:
- For math/physics/calculus topics, include a mathblock:
---
type: mathblock
address: math_1
title: Solving Quadratic Equation
>step
  label: Given
  content: ax^2 + bx + c = 0
>step
  label: Formula
  content: x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}
>step
  label: Answer
  content: x = 2 \\text{ or } x = 3

- Use LaTeX notation (\\frac, \\sqrt, \\int, \\sum, \\alpha, \\pi, etc.).
- Show every substitution and simplification step.

MANDATORY GRAPHBLOCK RULE (IF USER ASKS TO GRAPH):
- For charts, plots, statistics: use graphblock, NOT diablock.
---
type: graphblock
address: g_1
title: Sales Chart
chartType: line
labels: Q1, Q2, Q3, Q4
>dataset
  label: Revenue
  data: 100, 200, 150, 300

- For scatter plots: use chartType: scatter and data: {x:1,y:2}, {x:3,y:4} with showLine: true.

MANDATORY DRAWING RULE (IF USER ASKS TO DRAW):
- Use diablock with layout: coordinate for geometry/shapes.
---
type: diablock
address: dia_1
title: Coordinate Sketch
layout: coordinate
>dianode
  id: A
  value: (2,3)
  shape: point
  label: Point A
>dianode
  id: B
  value: (8,3)
  shape: point
>edge
  from: A
  to: B

MANDATORY DIABLOCK RULE (DATA STRUCTURES & ALGORITHMS):
- For linked lists, trees, graphs, stacks, queues, sorting traces:
---
type: diablock
address: dia_1
layout: horizontal
>dianode
  id: n1
  value: 10
  shape: box
  label: Head
>dianode
  id: n2
  value: 20
  shape: box
>edge
  from: n1
  to: n2
  type: arrow
>diastep
  description: Start at head node
  highlightNodes: n1

- LAYOUTS: horizontal for Lists/Queues, vertical for Stacks, tree for Trees/Graphs.

BLOCK STRUCTURE RULES:
Block example:
---
type: block
address: unique_id
in-content: Display Text
shape: square
explanation: Short tooltip
connect: child_id, textblock_id
>dialog
  topic: Topic Name
  input:
  output:
  explanation: Detailed explanation at least 20 words...

Textblock example:
---
type: textblock
address: tb_unique_id
title: Sub-category Title
content: Detailed explanation text here
>dialog
  topic: Details
  input:
  output:
  explanation: Detailed explanation at least 20 words...

Arrow example:
---
type: arrow
in-content: relationship label
first-connection: parent_id
next-connection: child_id

MANDATORY VIRTUAL CURSOR DIALOGS RULE:
- EVERY block MUST include >dialog entries. This is what the AI speaks.
- ALL dialog text MUST be in: English.
- Each >dialog needs: topic, input, output, explanation (at least 20 words).
- Use clear real-world analogies.

CRITICAL REMINDER: Charts → graphblock. Data structures → diablock. Code → coder+visualizer+outputer. Math → mathblock.

Dense and accurate.
Return ONLY valid TOON format. Start with --- for the first block.`;

    const cleanedKey = apiKey ? apiKey.trim() : '';
    const isGeminiKey = cleanedKey.includes('AIza');
    const activeEngine = selectedModel?.provider === 'google' && isGeminiKey ? 'gemini' : 'openrouter';

    let keyToUse = cleanedKey;
    if (activeEngine === 'gemini') {
      const localGemini = localStorage.getItem('meanai_gemini_key');
      if (localGemini) keyToUse = localGemini.trim();
    } else {
      const localOR = localStorage.getItem('meanai_openrouter_key');
      if (localOR) keyToUse = localOR.trim();
    }

    if (!keyToUse) {
       setErrorMsg('Please configure an API key in Teacher Classroom settings.');
       setPhase('error');
       return;
    }

    try {
      let url, headers, payload;
      if (activeEngine === 'gemini') {
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${keyToUse}`;
        headers = { 'Content-Type': 'application/json' };
        payload = {
          systemInstruction: { parts: [{ text: 'Output valid TOON format ONLY (Token-Oriented Object Notation). Blocks separated by ---. Use key: value pairs. No JSON. No markdown fences.' }] },
          contents: [{ role: 'user', parts: [{ text: outlinePrompt }] }]
        };
      } else {
        url = 'https://openrouter.ai/api/v1/chat/completions';
        headers = { 'Authorization': `Bearer ${keyToUse}`, 'Content-Type': 'application/json' };
        payload = {
          model: 'openrouter/free',
          messages: [
            { role: 'system', content: 'Output valid TOON format ONLY (Token-Oriented Object Notation). Blocks separated by ---. Use key: value pairs. No JSON. No markdown fences.' },
            { role: 'user', content: outlinePrompt }
          ],
          stream: true
        };
      }

      const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), signal: abortRef.current.signal });

      if (!resp.ok) {
        throw new Error(`API Error (${resp.status})`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              let delta = activeEngine === 'gemini'
                ? parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
                : parsed.choices?.[0]?.delta?.content || '';
              
              if (delta) {
                fullText += delta;
                const partialParsed = parsePartialTOON(fullText);
                if (partialParsed && partialParsed.length > 0) {
                   setSlides(partialParsed);
                   if (frameRef.current?.contentWindow) {
                     frameRef.current.contentWindow.postMessage({ type: 'LOAD_ROADMAP', payload: partialParsed, isPartial: true }, '*');
                   }
                }
              }
            } catch (e) { /* ignore */ }
          }
        }
      }

      const finalParsed = parseTOON(fullText);
      setSlides(finalParsed);
      if (onSaveSlides) {
        onSaveSlides(finalParsed);
      }
      
      if (frameRef.current?.contentWindow) {
        frameRef.current.contentWindow.postMessage({ type: 'LOAD_ROADMAP', payload: finalParsed, isPartial: false }, '*');
        frameRef.current.contentWindow.postMessage({ type: 'GENERATION_DONE' }, '*');
      }
      setPhase('done');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setErrorMsg(err.message || 'Generation failed.');
      setPhase('error');
    }
  };

  return (
    <div className="inline-classroom">
      <div className="ic-header">
        <div className="ic-title">
          <i className="fas fa-chalkboard-teacher"></i> 
          <span>Classroom: <strong>{topic}</strong></span>
        </div>
        <div className="ic-actions">
          {phase === 'generating' && <span className="ic-badge generating"><i className="fas fa-spinner fa-spin"></i> Generating</span>}
          {phase === 'error' && <span className="ic-badge error"><i className="fas fa-exclamation-triangle"></i> Error</span>}
          {phase === 'done' && <span className="ic-badge done"><i className="fas fa-check-circle"></i> Ready</span>}
          <button className="ic-btn-expand" onClick={() => onExpand(topic, slides)} title="Open Full Screen">
            <i className="fas fa-expand"></i> Expand
          </button>
        </div>
      </div>
      
      <div className="ic-body">
        {phase === 'generating' && slides.length === 0 && (
          <div className="ic-loading">
            <div className="ic-spinner"></div>
            <p>Initializing classroom environment...</p>
          </div>
        )}
        
        {phase === 'error' ? (
          <div className="ic-error">
            <i className="fas fa-times-circle"></i>
            <p>{errorMsg}</p>
            <button onClick={generateClass}>Retry</button>
          </div>
        ) : (
          <iframe
            ref={frameRef}
            srcDoc={iframeHtml}
            className="ic-iframe"
            title="Inline Roadmap"
            style={{ opacity: (phase === 'generating' && slides.length === 0) ? 0 : 1 }}
          />
        )}
      </div>
    </div>
  );
}

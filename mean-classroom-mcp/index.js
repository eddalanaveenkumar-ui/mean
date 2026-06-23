import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLASSES_FILE_PATH = path.join(__dirname, "../public/mcp_classes.json");

// Ensure public classes file exists
try {
  if (!fs.existsSync(CLASSES_FILE_PATH)) {
    fs.mkdirSync(path.dirname(CLASSES_FILE_PATH), { recursive: true });
    fs.writeFileSync(CLASSES_FILE_PATH, "[]", "utf-8");
  }
} catch (err) {
  console.error("Failed to initialize classes file:", err);
}

// System prompts constants
const MATH_SYSTEM_PROMPT = `You are a math teacher solving on a blackboard. Write ONLY the solution — no explanations, no headings, no teaching.

RULES:
- Solve like writing on a blackboard: label → equation → next label → next equation
- NO paragraphs. NO explanations. NO side headings. NO descriptions.
- Just SHORT labels and EQUATIONS. That's it.
- DRAW the graph or shape with measurements in the diagram block.
- The LAST step MUST have an "answer" field.
- Return ONLY valid TOON format. Blocks separated by ---.

FORMAT:
---
type: config
topic: <problem>
category: math
---
type: diagram
(draw the graph/shape with axis, plotline, dot, line, dimension, arc, polygon, text elements)
---
type: step
label: <short action label like "Given:" or "Factorize:" or "Substitute x = 2:">
equation: <the equation or calculation, shown centered>
answer: <ONLY on the very last step — the final answer>

RULES FOR STEPS:
- Each step has ONLY "label" and "equation" fields. Nothing else.
- "label" = 2-4 words max (e.g. "Factorize:", "Apply formula:", "Discriminant:", "Verify x = 2:")
- "equation" = the actual math (centered, large). Can be multi-line using \\n
- Keep it SHORT. A teacher writes equations, not essays.
- Use symbols: ², ³, √, ∫, π, θ, ±, ∞, ≤, ≥, ⇒, →, ∴

DIAGRAM ELEMENT KINDS:
axis, plotline, dot/point, line, arrow, dimension, arc/angle, circle, polygon/triangle, region/area, text, box, wave/sine
Canvas: 600x340. step:0 = always visible.

CRITICAL DIAGRAM RULES:
- Space elements at least 60px apart — NO overlapping text or shapes.
- Place text labels ABOVE or BELOW elements, not on top.
- Use fontSize 11-13 for labels.
- Keep the diagram CLEAN and SIMPLE — fewer elements with good spacing is better than many cramped ones.
- Maximum 10-15 elements. Do NOT overcrowd.

EXAMPLE — Solve x² - 5x + 6 = 0:
---
type: config
topic: Solve x² - 5x + 6 = 0
category: math
---
type: diagram
title: y = x² - 5x + 6
width: 600
height: 340
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
  color: #3b82f6
  step: 0
>element
  kind: plotline
  points: 50,298 120,210 190,138 260,82 330,42 365,34 400,42 470,82 540,160
  color: #3b82f6
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
---
type: step
equation: x² − 5x + 6 = 0
---
type: step
label: Factorize:
equation: x² − 5x + 6 = (x − 2)(x − 3)
---
type: step
label: Set each factor equal to zero:
equation: x − 2 = 0   ⇒   x = 2\\nx − 3 = 0   ⇒   x = 3
---
type: step
label: Verify x = 2:
equation: (2)² − 5(2) + 6 = 4 − 10 + 6 = 0 ✓
---
type: step
label: Verify x = 3:
equation: (3)² − 5(3) + 6 = 9 − 15 + 6 = 0 ✓
---
type: step
label: Roots
answer: x = 2, x = 3`;

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

// Initialize MCP Server
const server = new Server(
  {
    name: "mean-classroom-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

/* ─── TOON PARSER IMPLEMENTATION ─── */
const SUB_ITEM_MAP = {
  'dialog':   'dialogs',
  'step':     'steps',
  'mathstep': 'steps',
  'dataset':  'datasets',
  'dianode':  'nodes',
  'edge':     'edges',
  'diastep':  'steps',
  'element':  'elements',
  'annotation': 'annotations',
};

const ARRAY_FIELDS = new Set([
  'connect', 'labels', 'highlightNodes', 'points', 'values',
]);

function inferType(raw) {
  if (raw === undefined || raw === null || raw === '') return '';
  const v = raw.trim();
  if (v === 'true')  return true;
  if (v === 'false') return false;
  if (v === 'null')  return null;
  if (/^-?\d+$/.test(v))       return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v))  return parseFloat(v);
  return v;
}

function parseVariables(str) {
  if (!str || !str.trim()) return {};
  const obj = {};
  for (const pair of str.split(',')) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = pair.slice(0, eqIdx).trim();
    const val = pair.slice(eqIdx + 1).trim();
    if (key) obj[key] = inferType(val);
  }
  return obj;
}

function parseDataField(str) {
  if (!str || !str.trim()) return [];
  const trimmed = str.trim();
  if (trimmed.includes('{')) {
    const items = [];
    const re = /\{\s*x\s*:\s*([^,}]+)\s*,\s*y\s*:\s*([^}]+)\s*\}/g;
    let m;
    while ((m = re.exec(trimmed))) {
      items.push({ x: inferType(m[1]), y: inferType(m[2]) });
    }
    return items;
  }
  return trimmed.split(',').map(v => inferType(v));
}

function parseBlock(blockStr) {
  const obj = {};
  const lines = blockStr.split('\n');
  let i = 0;
  let currentSubItem = null;
  let currentSubField = null;

  const flushSubItem = () => {
    if (currentSubItem && currentSubField) {
      if (!obj[currentSubField]) obj[currentSubField] = [];
      obj[currentSubField].push(currentSubItem);
    }
    currentSubItem = null;
    currentSubField = null;
  };

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) { i++; continue; }

    const subMatch = trimmed.match(/^>(\w+)$/);
    if (subMatch) {
      flushSubItem();
      const tag = subMatch[1].toLowerCase();
      currentSubField = SUB_ITEM_MAP[tag] || tag + 's';
      currentSubItem = {};
      i++;
      continue;
    }

    const indent = raw.match(/^(\s*)/)[1].length;
    const isSubProp = indent >= 2 && currentSubItem !== null;

    const kvMatch = trimmed.match(/^([^\s:][^:]*?):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      let value = kvMatch[2];

      if (value.trim() === '|') {
        let multiLine = '';
        i++;
        while (i < lines.length) {
          const nextRaw = lines[i];
          if (nextRaw.trim() === '' && i + 1 < lines.length && !lines[i + 1].startsWith('  ') && !lines[i + 1].startsWith('\t')) {
            break;
          }
          if (!nextRaw.startsWith('  ') && !nextRaw.startsWith('\t') && nextRaw.trim() !== '') {
            break;
          }
          if (nextRaw.trim() === '') { i++; continue; }
          multiLine += (multiLine ? '\n' : '') + nextRaw.replace(/^  /, '');
          i++;
        }
        if (isSubProp) {
          currentSubItem[key] = multiLine;
        } else {
          obj[key] = multiLine;
        }
        continue;
      }

      const target = isSubProp ? currentSubItem : obj;

      if (key === 'variables') {
        target[key] = parseVariables(value);
      } else if (key === 'data') {
        target[key] = parseDataField(value);
      } else if (ARRAY_FIELDS.has(key)) {
        target[key] = value ? value.split(',').map(v => v.trim()).filter(v => v) : [];
      } else if (key === 'points') {
        target[key] = value.trim();
      } else {
        target[key] = inferType(value);
      }

      if (!isSubProp && currentSubItem !== null && indent === 0) {
        flushSubItem();
        if (key === 'variables') {
          obj[key] = parseVariables(value);
        } else if (key === 'data') {
          obj[key] = parseDataField(value);
        } else if (ARRAY_FIELDS.has(key)) {
          obj[key] = value ? value.split(',').map(v => v.trim()).filter(v => v) : [];
        } else {
          obj[key] = inferType(value);
        }
      }
    }

    i++;
  }

  flushSubItem();
  return obj;
}

export function parseTOON(toonStr) {
  if (!toonStr || typeof toonStr !== 'string') return [];

  let clean = toonStr.replace(/```toon/gi, '').replace(/```/g, '').trim();

  const firstBlock = clean.indexOf('---');
  if (firstBlock > 0) {
    const preamble = clean.slice(0, firstBlock).trim();
    if (preamble && !preamble.includes(':')) {
      clean = clean.slice(firstBlock);
    }
  }

  const blocks = clean
    .split(/\n?---\n?/)
    .map(b => b.trim())
    .filter(b => b.length > 0 && b.includes(':'));

  const result = [];
  for (const block of blocks) {
    const obj = parseBlock(block);
    if (obj && Object.keys(obj).length > 0) {
      result.push(obj);
    }
  }

  return result;
}

/* ─── MCP TOOLS DECLARATION ─── */

server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "build_class",
      description: "Builds a visual lesson/class from raw TOON code and saves it to the Mean AI Classroom application",
      inputSchema: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The topic of the class (e.g. 'Stack Data Structure', 'Calculus')"
          },
          category: {
            type: "string",
            description: "Category of the class (e.g., 'math', 'physics', 'chemistry', 'biology', 'dsa', 'coding', 'ai_ml', 'fullstack', 'system_design')"
          },
          toonCode: {
            type: "string",
            description: "The raw TOON code defining config, diagram elements, and teaching steps"
          }
        },
        required: ["topic", "category", "toonCode"]
      }
    },
    {
      name: "get_classroom_system_prompt",
      description: "Get the system prompt and instructions for generating valid TOON classroom files. Use this to format lessons correctly.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "The lesson category. Use 'math' for math equations/JEE problems, and 'general' for physics, chemistry, coding, biology, dsa, etc.",
            enum: ["math", "general"]
          }
        },
        required: ["category"]
      }
    },
    {
      name: "get_saved_classes",
      description: "Fetch all classes currently saved in the local classroom system",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "clear_saved_classes",
      description: "Clear all saved classroom classes from the file",
      inputSchema: {
        type: "object",
        properties: {}
      }
    }
  ]
}));

/* ─── MCP PROMPTS DECLARATION ─── */

server.setRequestHandler("prompts/list", async () => ({
  prompts: [
    {
      name: "generate_classroom_toon",
      description: "Instructs the AI to generate a lesson plan formatted in TOON code for Mean AI Classroom",
      arguments: [
        {
          name: "topic",
          description: "The topic of the class (e.g. 'Backpropagation', 'Quadratic Equations')",
          required: true
        },
        {
          name: "category",
          description: "The category (e.g., 'math', 'physics', 'chemistry', 'biology', 'dsa', 'coding', 'ai_ml', 'fullstack', 'system_design')",
          required: true
        }
      ]
    }
  ]
}));

server.setRequestHandler("prompts/get", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "generate_classroom_toon") {
    const topic = args?.topic || "";
    const category = args?.category || "general";
    const promptInstructions = category === "math" ? MATH_SYSTEM_PROMPT : CLASSROOM_SYSTEM_PROMPT;

    return {
      description: `Generate a classroom TOON file for topic: ${topic}`,
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `${promptInstructions}\n\nNow, generate a complete and valid TOON code format class for the topic: "${topic}" under the category: "${category}". Do not output explanations outside the TOON code.`
          }
        }
      ]
    };
  }

  throw new Error(`Prompt not found: ${name}`);
});

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "build_class") {
    const { topic, category, toonCode } = args;

    try {
      const parsedBlocks = parseTOON(toonCode);
      if (parsedBlocks.length === 0) {
        return {
          content: [{ type: "text", text: "Error: Failed to parse any valid TOON blocks. Please verify the format." }],
          isError: true
        };
      }

      // Read current classes
      let currentClasses = [];
      if (fs.existsSync(CLASSES_FILE_PATH)) {
        try {
          currentClasses = JSON.parse(fs.readFileSync(CLASSES_FILE_PATH, "utf-8"));
        } catch (_) {
          currentClasses = [];
        }
      }

      // Construct class object
      const newClass = {
        id: Date.now(),
        topic: topic,
        category: category || "default",
        blocks: parsedBlocks,
        date: new Date().toLocaleDateString()
      };

      // Put the new class at the beginning
      currentClasses = [newClass, ...currentClasses].slice(0, 50);

      // Write back
      fs.writeFileSync(CLASSES_FILE_PATH, JSON.stringify(currentClasses, null, 2), "utf-8");

      // Post to public backend shares to generate a live link for meanai.site users
      let liveShareUrl = "";
      try {
        const shareResponse = await fetch("https://mean-backend-nine.vercel.app/shares", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic,
            slides: parsedBlocks
          })
        });
        if (shareResponse.ok) {
          const shareData = await shareResponse.json();
          if (shareData.chat_id && shareData.user_id) {
            liveShareUrl = `https://www.meanai.site/?chat_id=${shareData.chat_id}&user_id=${shareData.user_id}`;
          }
        }
      } catch (err) {
        console.error("Failed to generate live share URL:", err);
      }

      let responseText = `Successfully built and saved class: "${topic}" under category "${category}"!`;
      if (liveShareUrl) {
        responseText += `\n\n🔗 Live Web Link (for meanai.site users): ${liveShareUrl}`;
      }

      return {
        content: [{ type: "text", text: responseText }]
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error occurred: ${err.message}` }],
        isError: true
      };
    }
  }

  if (name === "get_classroom_system_prompt") {
    const { category } = args;
    const prompt = category === "math" ? MATH_SYSTEM_PROMPT : CLASSROOM_SYSTEM_PROMPT;
    return {
      content: [{ type: "text", text: prompt }]
    };
  }

  if (name === "get_saved_classes") {
    try {
      let currentClasses = [];
      if (fs.existsSync(CLASSES_FILE_PATH)) {
        currentClasses = JSON.parse(fs.readFileSync(CLASSES_FILE_PATH, "utf-8"));
      }
      return {
        content: [{ type: "text", text: JSON.stringify(currentClasses, null, 2) }]
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error occurred fetching classes: ${err.message}` }],
        isError: true
      };
    }
  }

  if (name === "clear_saved_classes") {
    try {
      fs.writeFileSync(CLASSES_FILE_PATH, "[]", "utf-8");
      return {
        content: [{ type: "text", text: "Successfully cleared all saved classes." }]
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error clearing classes: ${err.message}` }],
        isError: true
      };
    }
  }

  throw new Error(`Tool not found: ${name}`);
});

// Run server using stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Mean AI Classroom MCP Server is running...");

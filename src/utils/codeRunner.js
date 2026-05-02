/**
 * Code Runner Utility — Shared execution engine for the Code Canvas
 * Supports: HTML, CSS, JavaScript, TypeScript (browser sandbox)
 *           Python, Java, C++, Go, Rust, Ruby, PHP, etc. (Piston API)
 */

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

const PISTON_LANG_MAP = {
  python: 'python', py: 'python', python3: 'python',
  java: 'java', c: 'c', cpp: 'c++', 'c++': 'c++',
  csharp: 'csharp', 'c#': 'csharp',
  go: 'go', golang: 'go', rust: 'rust', ruby: 'ruby', php: 'php',
  swift: 'swift', kotlin: 'kotlin', r: 'r', perl: 'perl',
  bash: 'bash', sh: 'bash', shell: 'bash', lua: 'lua',
  dart: 'dart', scala: 'scala', haskell: 'haskell',
  typescript: 'typescript', ts: 'typescript',
};

const EXT_MAP = {
  python: 'py', javascript: 'js', html: 'html', css: 'css',
  java: 'java', cpp: 'cpp', c: 'c', csharp: 'cs',
  go: 'go', rust: 'rs', ruby: 'rb', php: 'php',
  swift: 'swift', kotlin: 'kt', r: 'r', perl: 'pl',
  bash: 'sh', lua: 'lua', dart: 'dart', scala: 'scala',
  haskell: 'hs', typescript: 'ts', json: 'json',
};

/**
 * Run code and return result
 * @param {string} code - Source code to execute
 * @param {string} lang - Language identifier
 * @returns {Promise<{type: 'text'|'html', content: string, error?: boolean}>}
 */
export async function runCode(code, lang) {
  const l = (lang || '').toLowerCase().trim();

  // HTML — render in iframe
  if (l === 'html') {
    return { type: 'html', content: code };
  }

  // CSS — wrap in HTML template
  if (l === 'css') {
    const htmlDoc = `<!DOCTYPE html><html><head><style>${code}</style></head><body><div class="demo" style="padding:20px;font-family:sans-serif"><h2>CSS Preview</h2><p>Your styles are applied to this page.</p><button>Button</button> <input placeholder="Input"/></div></body></html>`;
    return { type: 'html', content: htmlDoc };
  }

  // JavaScript — sandbox iframe eval
  if (l === 'javascript' || l === 'js') {
    return runJavaScript(code);
  }

  // TypeScript — run as JS (basic, strips types)
  if (l === 'typescript' || l === 'ts') {
    // Try Piston first for proper TS support, fallback to JS eval
    const pistonResult = await runWithPiston(code, 'typescript');
    if (!pistonResult.error) return pistonResult;
    return runJavaScript(code);
  }

  // All other languages — Piston API
  const pistonLang = PISTON_LANG_MAP[l];
  if (!pistonLang) {
    return { type: 'text', content: `⚠️ Language "${lang}" is not supported for execution.`, error: true };
  }

  return runWithPiston(code, pistonLang);
}

function runJavaScript(code) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts';
    iframe.style.display = 'none';
    const escapedCode = code.replace(/<\/script>/gi, '<\\/script>');
    const script = `<script>
      const __logs = [];
      console.log = (...args) => __logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
      console.error = (...args) => __logs.push('❌ ' + args.map(a => String(a)).join(' '));
      console.warn = (...args) => __logs.push('⚠️ ' + args.map(a => String(a)).join(' '));
      console.info = (...args) => __logs.push('ℹ️ ' + args.map(a => String(a)).join(' '));
      try {
        ${escapedCode}
      } catch(e) {
        __logs.push('❌ ' + e.name + ': ' + e.message);
      }
      parent.postMessage({ type: 'CODE_RESULT', logs: __logs }, '*');
    <\/script>`;

    const handler = (e) => {
      if (e.data?.type === 'CODE_RESULT') {
        window.removeEventListener('message', handler);
        iframe.remove();
        resolve({ type: 'text', content: e.data.logs.join('\n') || '✅ Code executed successfully (no output)' });
      }
    };
    window.addEventListener('message', handler);
    iframe.srcdoc = `<!DOCTYPE html><html><body>${script}</body></html>`;
    document.body.appendChild(iframe);

    // Timeout
    setTimeout(() => {
      window.removeEventListener('message', handler);
      iframe.remove();
      resolve({ type: 'text', content: '⏱ Execution timed out (5s)', error: true });
    }, 5000);
  });
}

async function runWithPiston(code, language) {
  try {
    const resp = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        version: '*',
        files: [{ content: code }]
      })
    });

    if (!resp.ok) {
      return { type: 'text', content: `❌ Execution server error (${resp.status})`, error: true };
    }

    const data = await resp.json();
    const stdout = data.run?.stdout || '';
    const stderr = data.run?.stderr || '';
    const output = (stdout + (stderr ? '\n⚠️ stderr:\n' + stderr : '')).trim();

    return { type: 'text', content: output || '✅ Code executed successfully (no output)' };
  } catch (err) {
    return { type: 'text', content: `❌ Network error: ${err.message}`, error: true };
  }
}

/**
 * Get file extension for a language
 */
export function getExtension(lang) {
  return EXT_MAP[(lang || '').toLowerCase()] || 'txt';
}

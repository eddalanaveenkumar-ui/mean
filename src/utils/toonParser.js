/**
 * TOON Parser — Token-Oriented Object Notation
 * 
 * Converts TOON-formatted text (optimized for LLM token efficiency) into
 * standard JavaScript objects. Produces the EXACT same data structure as
 * the previous JSON format so all downstream consumers are unaffected.
 *
 * Format rules:
 *   - Blocks separated by `---`
 *   - Properties as `key: value`
 *   - Multi-line values: `key: |` followed by indented lines
 *   - Nested array items: `>dialog`, `>step`, `>mathstep`, `>dataset`,
 *     `>dianode`, `>edge`, `>diastep`
 *   - Comma-separated arrays: `connect: a, b, c`
 *   - Variable maps: `variables: x=5, y=10`
 */

// ─── Sub-item tag → target array field mapping ───
const SUB_ITEM_MAP = {
  'dialog':   'dialogs',
  'step':     'steps',
  'mathstep': 'steps',
  'dataset':  'datasets',
  'dianode':  'nodes',
  'edge':     'edges',
  'diastep':  'steps',
};

// Fields that should always be parsed as comma-separated arrays
const ARRAY_FIELDS = new Set([
  'connect', 'labels', 'highlightNodes',
]);

// ─── Type inference for scalar values ───
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

// ─── Parse `variables: x=5, y=10` → { x: 5, y: 10 } ───
function parseVariables(str) {
  if (!str || !str.trim()) return {};
  const obj = {};
  // Split on comma, then on first `=`
  for (const pair of str.split(',')) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = pair.slice(0, eqIdx).trim();
    const val = pair.slice(eqIdx + 1).trim();
    if (key) obj[key] = inferType(val);
  }
  return obj;
}

// ─── Parse `data: 10, 20, 30` or `data: {x:1,y:2}, {x:3,y:4}` ───
function parseDataField(str) {
  if (!str || !str.trim()) return [];
  const trimmed = str.trim();

  // Scatter / point data: array of {x, y} objects
  if (trimmed.includes('{')) {
    const items = [];
    const re = /\{\s*x\s*:\s*([^,}]+)\s*,\s*y\s*:\s*([^}]+)\s*\}/g;
    let m;
    while ((m = re.exec(trimmed))) {
      items.push({ x: inferType(m[1]), y: inferType(m[2]) });
    }
    return items;
  }

  // Simple numeric array
  return trimmed.split(',').map(v => inferType(v));
}

// ─── Parse a single block string into a JS object ───
function parseBlock(blockStr) {
  const obj = {};
  const lines = blockStr.split('\n');
  let i = 0;
  let currentSubItem = null;   // current >dialog / >step etc.
  let currentSubField = null;  // 'dialogs' / 'steps' etc.

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

    // Skip blank lines
    if (!trimmed) { i++; continue; }

    // ── Sub-item header: >dialog, >step, >edge, etc. ──
    const subMatch = trimmed.match(/^>(\w+)$/);
    if (subMatch) {
      flushSubItem();
      const tag = subMatch[1].toLowerCase();
      currentSubField = SUB_ITEM_MAP[tag] || tag + 's';
      currentSubItem = {};
      i++;
      continue;
    }

    // ── Property line ──
    // Determine indentation level — sub-item props have 2+ spaces
    const indent = raw.match(/^(\s*)/)[1].length;
    const isSubProp = indent >= 2 && currentSubItem !== null;

    const kvMatch = trimmed.match(/^([^\s:][^:]*?):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      let value = kvMatch[2];

      // Multi-line value (key: |)
      if (value.trim() === '|') {
        let multiLine = '';
        i++;
        while (i < lines.length) {
          const nextRaw = lines[i];
          // Multi-line block ends at a non-indented line, a sub-item, or block separator
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

      // Assign to sub-item or top-level object
      const target = isSubProp ? currentSubItem : obj;

      if (key === 'variables') {
        target[key] = parseVariables(value);
      } else if (key === 'data') {
        target[key] = parseDataField(value);
      } else if (ARRAY_FIELDS.has(key)) {
        target[key] = value ? value.split(',').map(v => v.trim()).filter(v => v) : [];
      } else if (key === 'points') {
        // SVG-style points string — keep as-is
        target[key] = value.trim();
      } else {
        target[key] = inferType(value);
      }

      // If we just set a top-level prop while a sub-item was active
      // and the indent was 0, flush the sub-item first
      if (!isSubProp && currentSubItem !== null && indent === 0) {
        flushSubItem();
        // Re-assign to top-level since we flushed
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

  // Flush any remaining sub-item
  flushSubItem();
  return obj;
}

// ─── PUBLIC: Parse complete TOON string → JS array ───
export function parseTOON(toonStr) {
  if (!toonStr || typeof toonStr !== 'string') return [];

  // Strip markdown fences if the model wrapped output
  let clean = toonStr.replace(/```toon/gi, '').replace(/```/g, '').trim();

  // Also strip leading/trailing noise before the first ---
  const firstBlock = clean.indexOf('---');
  if (firstBlock > 0) {
    const preamble = clean.slice(0, firstBlock).trim();
    // If there's meaningful content before the first ---, skip it (model chatter)
    if (preamble && !preamble.includes(':')) {
      clean = clean.slice(firstBlock);
    }
  }

  // Split by --- separator (handles leading ---)
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

// ─── PUBLIC: Parse partial/streaming TOON → JS array (safe) ───
// Only returns fully complete blocks (skips the last potentially incomplete one)
export function parsePartialTOON(toonStr) {
  if (!toonStr || typeof toonStr !== 'string') return [];

  let clean = toonStr.replace(/```toon/gi, '').replace(/```/g, '').trim();

  // Find the last --- separator
  const lastSep = clean.lastIndexOf('\n---');
  if (lastSep === -1) {
    // Only one block — check if it looks complete (has type + address)
    if (clean.includes('type:') && clean.includes('address:')) {
      try { return parseTOON(clean); } catch (_) { return []; }
    }
    return [];
  }

  // Everything before the last separator contains complete blocks
  const completeStr = clean.substring(0, lastSep);
  try {
    return parseTOON(completeStr);
  } catch (_) {
    return [];
  }
}

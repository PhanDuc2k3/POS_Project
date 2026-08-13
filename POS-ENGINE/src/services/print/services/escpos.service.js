/**
 * ESC/POS Encoder
 *
 * Pure encoder: parses our custom HTML-like template tags and produces
 * a raw ESC/POS byte buffer for thermal printers.
 *
 * Supported tags (case-insensitive):
 *   <b>...</b>                     : bold on/off
 *   <center>...</center>           : center alignment
 *   <right>...</right>             : right alignment
 *   <left>...</left>               : left alignment (reset)
 *   <line>                         : 32x '-' separator (auto-resets align & bold)
 *   <cut>                          : partial cut
 *   <feed>n</feed>                 : feed n lines (default 1)
 *   <beep>n</beep>                 : buzzer (n×100ms)
 *   <double>...</double>           : double-width + double-height
 *   <reset>                        : printer reset
 *
 * Built directly on this codebase, no external printer lib required.
 */

const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

const DEFAULT_PAPER_WIDTH = 32; // characters per line (58mm = 32, 80mm = 48)

/**
 * Node.js Buffer doesn't accept 'CP437' or 'UTF-8' for non-ASCII chars.
 * We always emit plain ASCII characters, since most thermal printers
 * only support CP437 / PC850 code pages. For Vietnamese diacritics
 * we have two options:
 *   - Keep as-is (Node maps 'á' → UTF-8 bytes → printer must support UTF-8)
 *   - Strip diacritics (ASCII fallback → 'a')
 *
 * To keep things robust, we use 'binary' (latin1) which is a 1:1 byte mapping
 * for ASCII characters. Non-ASCII characters become mangled bytes — fine for
 * most European languages with the default CP437 page; for true Vietnamese
 * printing, set charset=UTF-8 in printer config (Node will write UTF-8 bytes).
 */
function getBufferEncoding(charset) {
  // Map our high-level charset names to Node-supported Buffer encodings.
  if (charset && charset.toUpperCase() === 'UTF-8') return 'utf8';
  return 'ascii';
}

function toPrinterText(value, charset) {
  const text = String(value ?? '');
  if (charset && charset.toUpperCase() === 'UTF-8') return text;
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .replace(/[^\x20-\x7E]/g, '?');
}

/**
 * Wrap a line of text for thermal printer output.
 * Splits on word boundaries for Vietnamese-compatible wrapping.
 */
function wrap(text, width) {
  if (!text) return [];
  const normalized = String(text).replace(/\r?\n/g, ' ');
  const lines = [];
  let buf = '';
  for (const word of normalized.split(' ')) {
    const tentative = buf ? `${buf} ${word}` : word;
    // Use display width: count ASCII as 1, others as 2 (rough)
    const visLen = displayWidth(tentative);
    if (visLen <= width) {
      buf = tentative;
    } else {
      if (buf) lines.push(buf);
      // Hard-break long words
      let remaining = word;
      while (displayWidth(remaining) > width) {
        const slice = sliceByWidth(remaining, width);
        lines.push(slice);
        remaining = remaining.slice(slice.length);
      }
      buf = remaining;
    }
  }
  if (buf) lines.push(buf);
  return lines;
}

/**
 * Approximate display width: ASCII = 1 char, CJK/Vietnamese = 2 chars.
 */
function displayWidth(str) {
  let w = 0;
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (code <= 0x7F) w += 1;
    else if (code >= 0x300 && code <= 0x36F) w += 0; // combining diacritics
    else w += 2;
  }
  return w;
}

function sliceByWidth(str, maxWidth) {
  let w = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i);
    const chW = code <= 0x7F ? 1 : (code >= 0x300 && code <= 0x36F ? 0 : 2);
    if (w + chW > maxWidth) return str.slice(0, i);
    w += chW;
  }
  return str;
}

/** Pad a string to `width` visual columns: leftPad / rightPad. */
function pad(str, width, dir = 'left') {
  const w = displayWidth(str);
  if (w >= width) return str;
  const padding = ' '.repeat(width - w);
  return dir === 'left' ? padding + str : str + padding;
}

/** Right-align a wrapped block of lines. */
function alignRight(lines, width, prefix = '') {
  return lines.map((l) => prefix + pad(l, width, 'right'));
}

/**
 * Pad a key/label on the left and value on the right within `width`.
 * Example: padRow('Tổng cộng', '120,000 ₫', 32)
 */
function padRow(label, value, width) {
  const labelDisplay = displayWidth(label);
  if (labelDisplay + displayWidth(value) + 1 <= width) {
    // Fits on one line
    return pad(label, width - displayWidth(value), 'left') + value;
  }
  // Split into two lines
  const labelLines = wrap(label, width);
  const valueLines = wrap(value, width);
  // Align last line of label + first line of value, then rest of each
  const maxLines = Math.max(labelLines.length, valueLines.length);
  const out = [];
  for (let i = 0; i < maxLines; i++) {
    const l = labelLines[i] || '';
    const v = valueLines[i] || '';
    if (i === labelLines.length - 1 && i === valueLines.length - 1) {
      out.push(pad(l, width - displayWidth(v), 'left') + v);
    } else {
      out.push(l);
    }
  }
  // Append remaining value lines right-aligned
  for (let i = labelLines.length; i < valueLines.length; i++) {
    out.push(pad(valueLines[i], width, 'right'));
  }
  return out.join('\n');
}

// ─── ESC/POS command bytes ─────────────────────────────────────────────

const CMD = {
  init:         Buffer.from([ESC, 0x40]),                  // ESC @
  reset:        Buffer.from([ESC, 0x40]),
  bold_on:      Buffer.from([ESC, 0x45, 0x01]),
  bold_off:     Buffer.from([ESC, 0x45, 0x00]),
  align_left:   Buffer.from([ESC, 0x61, 0x00]),
  align_center: Buffer.from([ESC, 0x61, 0x01]),
  align_right:  Buffer.from([ESC, 0x61, 0x02]),
  double_on:    Buffer.from([GS, 0x21, 0x11]),
  double_off:   Buffer.from([GS, 0x21, 0x00]),
  cut:          Buffer.from([GS, 0x56, 0x01]),             // partial cut
  feed: (n = 1) => Buffer.concat([Buffer.from([ESC, 0x64, n])]),
  beep: (n = 1, t = 2) => Buffer.from([ESC, 0x42, n, t]),
};

/**
 * Encode a UTF-8 template string into ESC/POS bytes.
 *
 * @param {string} template  The rendered text (already passed through template engine)
 * @param {object} options
 * @param {number} options.paperWidth - 58 (32 chars) or 80 (48 chars) mm
 * @param {string} options.charset   - 'CP437' | 'UTF-8' (default: CP437)
 */
function encode(template, options = {}) {
  const paperWidth = options.paperWidth === 58 ? 32 : 48;
  const bufEnc = getBufferEncoding(options.charset);

  const chunks = [];
  chunks.push(CMD.init);
  chunks.push(CMD.align_left);
  chunks.push(CMD.bold_off);
  chunks.push(CMD.double_off);

  // Tokenize: extract tags + text segments
  const tokens = tokenize(template);

  // Buffer for current text segment & pending text wrapping
  let align = 'left';
  let bold = false;
  let double = false;

  const flush = (text) => {
    if (!text) return;
    const lines = text.split('\n');
    for (const rawLine of lines) {
      const wrapped = wrap(rawLine, paperWidth);
      if (align === 'right') {
        for (const l of wrapped) {
          chunks.push(Buffer.from(toPrinterText(pad(l, paperWidth, 'right') + '\n', options.charset), bufEnc));
        }
      } else if (align === 'center') {
        for (const l of wrapped) {
          const w = displayWidth(l);
          const padding = w < paperWidth ? ' '.repeat(Math.floor((paperWidth - w) / 2)) : '';
          chunks.push(Buffer.from(toPrinterText(padding + l + '\n', options.charset), bufEnc));
        }
      } else {
        for (const l of wrapped) chunks.push(Buffer.from(toPrinterText(l + '\n', options.charset), bufEnc));
      }
    }
  };

  for (const tok of tokens) {
    if (tok.type === 'tag') {
      const tag = tok.name.toLowerCase();
      switch (tag) {
        case 'b':       bold = true;  chunks.push(CMD.bold_on); break;
        case '/b':      bold = false; chunks.push(CMD.bold_off); break;
        case 'center':  align = 'center'; chunks.push(CMD.align_center); break;
        case '/center': align = 'left';   chunks.push(CMD.align_left); break;
        case 'right':   align = 'right';  chunks.push(CMD.align_right); break;
        case '/right':  align = 'left';   chunks.push(CMD.align_left); break;
        case 'left':    align = 'left';   chunks.push(CMD.align_left); break;
        case '/left':   align = 'left';   chunks.push(CMD.align_left); break;
        case 'line':
          flush('-'.repeat(paperWidth));
          if (bold) { bold = false; chunks.push(CMD.bold_off); }
          if (align !== 'left') { align = 'left'; chunks.push(CMD.align_left); }
          if (double) { double = false; chunks.push(CMD.double_off); }
          break;
        case 'cut':     chunks.push(CMD.cut); break;
        case 'feed': {
          const n = parseInt(tok.attrs || '1', 10) || 1;
          chunks.push(CMD.feed(n));
          break;
        }
        case 'beep': {
          const parts = (tok.attrs || '1 2').split(/\s+/);
          chunks.push(CMD.beep(parseInt(parts[0], 10) || 1, parseInt(parts[1], 10) || 2));
          break;
        }
        case 'double':  double = true;  chunks.push(CMD.double_on); break;
        case '/double': double = false; chunks.push(CMD.double_off); break;
        case 'reset':   chunks.push(CMD.reset); break;
        default:        flush(tok.raw); break;
      }
    } else {
      flush(tok.text);
    }
  }

  return Buffer.concat(chunks);
}

/**
 * Tokenize template into 'tag' / 'text' tokens.
 * Supports <tag>, </tag>, <tag attrs> with ASCII attribs.
 */
function tokenize(template) {
  const tokens = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9_-]*)(?:\s+([^>]*))?>/g;
  let lastIndex = 0;
  let match;
  while ((match = tagRe.exec(template)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', text: template.slice(lastIndex, match.index) });
    }
    const isClose = match[0].startsWith('</');
    tokens.push({
      type: 'tag',
      name: match[1],
      attrs: match[2] ? match[2].trim() : '',
      raw: match[0],
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < template.length) {
    tokens.push({ type: 'text', text: template.slice(lastIndex) });
  }
  return tokens;
}

/**
 * Render to text (for preview or fallback). No bytes.
 */
function preview(template, options = {}) {
  const paperWidth = options.paperWidth === 58 ? 32 : 48;
  const tokens = tokenize(template);
  let align = 'left';
  let bold = false;
  const out = [];

  for (const tok of tokens) {
    if (tok.type === 'tag') {
      const tag = tok.name.toLowerCase();
      switch (tag) {
        case 'b': bold = true; break;
        case '/b': bold = false; break;
        case 'center': align = 'center'; break;
        case '/center': align = 'left'; break;
        case 'right': align = 'right'; break;
        case '/right': align = 'left'; break;
        case 'left': align = 'left'; break;
        case '/left': align = 'left'; break;
        case 'line':
          out.push('-'.repeat(paperWidth));
          bold = false; align = 'left';
          break;
        case 'cut':     out.push('[CUT]'); break;
        case 'feed':    out.push(''); break;
        case 'beep':    out.push('[BEEP]'); break;
        case 'double':  out.push('[2x]' + tok.raw); break;
        case '/double': out.push('[/2x]'); break;
        case 'reset':   break;
      }
    } else {
      const lines = tok.text.split('\n');
      for (const rawLine of lines) {
        const wrapped = wrap(rawLine, paperWidth);
        for (const l of wrapped) {
          let line = bold ? `*${l}*` : l;
          if (align === 'right') line = pad(l, paperWidth, 'right');
          else if (align === 'center') {
            const w = displayWidth(l);
            const padding = ' '.repeat(w < paperWidth ? Math.floor((paperWidth - w) / 2) : 0);
            line = padding + l;
          }
          out.push(line);
        }
      }
    }
  }
  return out.join('\n');
}

module.exports = {
  encode,
  preview,
  wrap,
  pad,
  padRow,
  displayWidth,
  // exported for tests
  _tokenize: tokenize,
};

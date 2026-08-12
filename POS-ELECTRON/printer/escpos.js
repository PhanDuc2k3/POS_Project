/**
 * ESC/POS Command Builder
 * Tạo buffer commands cho máy in nhiệt 58mm/80mm
 */

const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;
const CR = 0x0D;

function toPrinterText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^\x20-\x7E]/g, '?');
}

class ReceiptBuilder {
  constructor(options = {}) {
    this.width = options.width || 32; // 32 chars for 58mm, 48 for 80mm
    this.encoding = options.encoding || 'utf8';
    this.buffer = [];
  }

  // ─── Commands ──────────────────────────────

  init() {
    this.buffer.push(Buffer.from([ESC, 0x40])); // Initialize
    this.buffer.push(Buffer.from([ESC, 0x74, 0x00])); // Code page PC437
    this.buffer.push(Buffer.from([ESC, 0x21, 0x00])); // Normal print mode
    this.buffer.push(Buffer.from([GS, 0x21, 0x00])); // Normal character size
    return this;
  }

  alignCenter() {
    this.buffer.push(Buffer.from([ESC, 0x61, 0x01]));
    return this;
  }

  alignLeft() {
    this.buffer.push(Buffer.from([ESC, 0x61, 0x00]));
    return this;
  }

  alignRight() {
    this.buffer.push(Buffer.from([ESC, 0x61, 0x02]));
    return this;
  }

  bold(on = true) {
    this.buffer.push(Buffer.from([ESC, 0x45, on ? 0x01 : 0x00]));
    return this;
  }

  doubleHeight(on = true) {
    this.buffer.push(Buffer.from([GS, 0x21, on ? 0x10 : 0x00]));
    return this;
  }

  doubleWidth(on = true) {
    this.buffer.push(Buffer.from([GS, 0x21, on ? 0x20 : 0x00]));
    return this;
  }

  bigText(on = true) {
    this.buffer.push(Buffer.from([GS, 0x21, on ? 0x30 : 0x00]));
    return this;
  }

  text(str) {
    this.buffer.push(Buffer.from(toPrinterText(str), 'ascii'));
    return this;
  }

  newLine(count = 1) {
    for (let i = 0; i < count; i++) {
      this.buffer.push(Buffer.from([CR, LF]));
    }
    return this;
  }

  line(str) {
    return this.text(str).newLine();
  }

  // Print text with left-right alignment on same line
  leftRight(left, right) {
    const gap = this.width - left.length - right.length;
    if (gap > 0) {
      this.line(left + ' '.repeat(gap) + right);
    } else {
      this.line(left);
      this.alignRight().line(right).alignLeft();
    }
    return this;
  }

  divider(char = '-') {
    this.line(char.repeat(this.width));
    return this;
  }

  emptyLine() {
    return this.newLine();
  }

  cut() {
    // Full cut
    this.buffer.push(Buffer.from([GS, 0x56, 0x00]));
    return this;
  }

  partialCut() {
    this.buffer.push(Buffer.from([GS, 0x56, 0x01]));
    return this;
  }

  feedAndCut(lines = 3) {
    this.newLine(lines);
    return this.partialCut();
  }

  openCashDrawer() {
    // Pulse pin 2
    this.buffer.push(Buffer.from([ESC, 0x70, 0x00, 0x19, 0xFA]));
    return this;
  }

  // ─── Build ─────────────────────────────────

  build() {
    return Buffer.concat(this.buffer);
  }
}

module.exports = { ReceiptBuilder };

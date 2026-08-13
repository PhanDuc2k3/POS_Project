/**
 * ESC/POS Command Builder
 * Builds raw command buffers for 58mm/80mm thermal printers.
 */

const ESC = 0x1B;
const GS = 0x1D;
const CR = 0x0D;
const LF = 0x0A;

function toPrinterText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .replace(/[^\x20-\x7E]/g, '?');
}

function textWidth(value) {
  return Array.from(toPrinterText(value)).length;
}

class ReceiptBuilder {
  constructor(options = {}) {
    this.width = options.width || 32; // 32 chars for 58mm, 48 for 80mm
    this.encoding = options.encoding || 'utf8';
    this.buffer = [];
  }

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

  imageDataUrl(dataUrl, options = {}) {
    const raster = buildRasterImage(dataUrl, {
      maxWidthDots: options.maxWidthDots || Math.min(this.width * 8, 384),
    });
    if (!raster) return this;

    this.buffer.push(Buffer.from([
      GS, 0x76, 0x30, 0x00,
      raster.bytesPerRow & 0xFF,
      (raster.bytesPerRow >> 8) & 0xFF,
      raster.height & 0xFF,
      (raster.height >> 8) & 0xFF,
    ]));
    this.buffer.push(raster.data);
    this.newLine();
    return this;
  }

  qr(data, options = {}) {
    const text = toPrinterText(data).trim();
    if (!text) return this;

    const qrData = Buffer.from(text, 'ascii');
    const size = Math.max(1, Math.min(16, Number(options.size || 6)));
    const errorCorrection = Number(options.errorCorrection || 49); // 48=L, 49=M, 50=Q, 51=H
    const storeLength = qrData.length + 3;

    this.buffer.push(Buffer.from([GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]));
    this.buffer.push(Buffer.from([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size]));
    this.buffer.push(Buffer.from([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, errorCorrection]));
    this.buffer.push(Buffer.from([
      GS, 0x28, 0x6B,
      storeLength & 0xFF,
      (storeLength >> 8) & 0xFF,
      0x31,
      0x50,
      0x30,
    ]));
    this.buffer.push(qrData);
    this.buffer.push(Buffer.from([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]));
    this.newLine();
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

  leftRight(left, right) {
    const gap = this.width - textWidth(left) - textWidth(right);
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
    this.buffer.push(Buffer.from([ESC, 0x70, 0x00, 0x19, 0xFA]));
    return this;
  }

  build() {
    return Buffer.concat(this.buffer);
  }
}

function buildRasterImage(dataUrl, options = {}) {
  if (!dataUrl || !String(dataUrl).startsWith('data:image/')) return null;

  let nativeImage;
  try {
    nativeImage = require('electron').nativeImage;
  } catch {
    return null;
  }

  const source = nativeImage.createFromDataURL(dataUrl);
  if (!source || source.isEmpty()) return null;

  const original = source.getSize();
  if (!original.width || !original.height) return null;

  const maxWidthDots = Math.max(8, Number(options.maxWidthDots || 256));
  const width = Math.min(maxWidthDots, original.width);
  const resized = source.resize({ width });
  const size = resized.getSize();
  const bitmap = resized.toBitmap();
  const bytesPerRow = Math.ceil(size.width / 8);
  const data = Buffer.alloc(bytesPerRow * size.height);

  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      const offset = (y * size.width + x) * 4;
      const blue = bitmap[offset];
      const green = bitmap[offset + 1];
      const red = bitmap[offset + 2];
      const alpha = bitmap[offset + 3];
      const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;
      if (alpha > 32 && luminance < 180) {
        data[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
  }

  return { data, bytesPerRow, height: size.height };
}

module.exports = { ReceiptBuilder };

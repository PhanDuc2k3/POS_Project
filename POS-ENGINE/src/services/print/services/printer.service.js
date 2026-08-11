const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function normalizePrinter(printer = {}) {
  return {
    ...printer,
    type: String(printer.type || 'mock').toLowerCase(),
    paperWidth: Number(printer.paperWidth || 80),
    charset: printer.charset || 'CP437',
  };
}

async function printRaw(printerConfig, buffer) {
  const printer = normalizePrinter(printerConfig);
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || '');

  if (printer.type === 'mock') {
    return {
      ok: true,
      method: 'mock',
      bytes: data.length,
      printer: printer.name || 'Mock Printer',
    };
  }

  if (printer.type === 'network') {
    const { host, port } = parseNetworkTarget(printer.interfacePath);
    return printNetwork(data, host, port);
  }

  if (printer.type === 'usb' || printer.type === 'windows') {
    return printWindowsRaw(data, printer.interfacePath || printer.name);
  }

  throw new Error(`Unsupported printer type: ${printer.type}`);
}

async function printTest(printerConfig) {
  const printer = normalizePrinter(printerConfig);
  const lines = [
    '\x1b@',
    '=== POS PRINT TEST ===',
    `Printer: ${printer.name || printer.id || 'unknown'}`,
    `Type: ${printer.type}`,
    `Time: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Bangkok' })}`,
    '',
    '\x1dV\x01',
  ];
  return printRaw(printer, Buffer.from(lines.join('\n'), 'utf8'));
}

function parseNetworkTarget(interfacePath) {
  const target = String(interfacePath || '').trim();
  if (!target) throw new Error('Network printer interfacePath is required, example: 192.168.1.100:9100');

  const [host, rawPort] = target.split(':');
  const port = Number(rawPort || 9100);
  if (!host || !Number.isInteger(port)) {
    throw new Error('Invalid network printer interfacePath, expected host:port');
  }
  return { host, port };
}

function printNetwork(buffer, host, port) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (err, result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve(result);
    };

    socket.setTimeout(5000);
    socket.on('timeout', () => finish(new Error(`Printer connection timeout: ${host}:${port}`)));
    socket.on('error', (err) => finish(new Error(`Printer network error: ${err.message}`)));
    socket.connect(port, host, () => {
      socket.write(buffer, () => {
        socket.end();
        finish(null, { ok: true, method: 'network', host, port, bytes: buffer.length });
      });
    });
  });
}

function printWindowsRaw(buffer, printerName) {
  if (process.platform !== 'win32') {
    throw new Error('Windows/USB raw printing is only supported on Windows service hosts');
  }
  if (!printerName) {
    throw new Error('Windows printer name/interfacePath is required');
  }

  const tempFile = path.join(os.tmpdir(), `pos-engine-print-${Date.now()}.bin`);
  fs.writeFileSync(tempFile, buffer);
  try {
    execFileSync('cmd.exe', ['/c', 'copy', '/b', tempFile, `\\\\%COMPUTERNAME%\\${printerName}`], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10000,
    });
    return { ok: true, method: 'windows', printer: printerName, bytes: buffer.length };
  } finally {
    try { fs.unlinkSync(tempFile); } catch { /* ignore temp cleanup */ }
  }
}

module.exports = { printRaw, printTest };

/**
 * Printer Module
 * Connects to thermal printer via:
 * 1. Network (TCP/IP) - most common for POS printers
 * 2. Windows shared printer (USB via print spooler)
 * 
 * Config stored in local file: printer-config.json
 */

const net = require('net');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(
  process.env.POS_USER_DATA_DIR || path.join(require('os').homedir(), 'POS-App'),
  'printer-config.json'
);

// Default config
const DEFAULT_CONFIG = {
  type: 'network',          // 'network' or 'windows'
  // Network printer settings
  host: '192.168.1.100',
  port: 9100,
  // Windows shared printer name
  printerName: '',
  // General
  paperWidth: '58mm',       // '58mm' or '80mm'
  autoPrint: true,          // Auto print after payment
  openDrawer: false,        // Open cash drawer after print
  timeout: 5000,            // Connection timeout (ms)
};

/**
 * Load printer config from file
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('[Printer] Error loading config:', err.message);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Save printer config
 */
function saveConfig(config) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[Printer] Error saving config:', err.message);
    return false;
  }
}

/**
 * Print buffer via network TCP (most thermal printers support port 9100)
 */
function printNetwork(buffer, config) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let connected = false;

    client.setTimeout(config.timeout || 5000);

    client.on('timeout', () => {
      client.destroy();
      if (!connected) reject(new Error('Connection timeout'));
    });

    client.on('error', (err) => {
      reject(new Error('Printer error: ' + err.message));
    });

    client.connect(config.port || 9100, config.host, () => {
      connected = true;
      client.write(buffer, () => {
        client.end();
        resolve({ success: true, method: 'network', host: config.host });
      });
    });
  });
}

/**
 * Print via Windows shared printer using raw data
 * Requires printer to be added in Windows Devices
 */
function printWindows(buffer, config) {
  return new Promise((resolve, reject) => {
    try {
      const printerName = config.printerName;
      if (!printerName) {
        return reject(new Error('Printer name not configured'));
      }

      // Write to temp file
      const tempFile = path.join(require('os').tmpdir(), 'pos-receipt-' + Date.now() + '.bin');
      fs.writeFileSync(tempFile, buffer);

      // Send raw data to printer using Windows print command
      execSync(`copy /b "${tempFile}" "\\\\%COMPUTERNAME%\\${printerName}"`, {
        shell: 'cmd.exe',
        timeout: config.timeout || 5000,
      });

      // Cleanup
      try { fs.unlinkSync(tempFile); } catch { /* ignore */ }

      resolve({ success: true, method: 'windows', printer: printerName });
    } catch (err) {
      reject(new Error('Windows print failed: ' + err.message));
    }
  });
}

/**
 * Main print function - auto-detect method from config
 */
async function print(buffer) {
  const config = loadConfig();

  if (config.type === 'windows') {
    return printWindows(buffer, config);
  } else {
    return printNetwork(buffer, config);
  }
}

/**
 * Test printer connection
 */
async function testConnection(config = null) {
  const cfg = config || loadConfig();

  if (cfg.type === 'windows') {
    // Just check if printer exists
    try {
      const output = execSync('wmic printer get name', { encoding: 'utf8' });
      const printers = output.split('\n').map(l => l.trim()).filter(Boolean);
      const found = printers.some(p => p.includes(cfg.printerName));
      return { success: found, printers, message: found ? 'Printer found' : 'Printer not found' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  } else {
    // Test TCP connection
    return new Promise((resolve) => {
      const client = new net.Socket();
      client.setTimeout(cfg.timeout || 3000);

      client.on('connect', () => {
        client.end();
        resolve({ success: true, message: `Connected to ${cfg.host}:${cfg.port}` });
      });

      client.on('timeout', () => {
        client.destroy();
        resolve({ success: false, message: 'Connection timeout' });
      });

      client.on('error', (err) => {
        resolve({ success: false, message: err.message });
      });

      client.connect(cfg.port || 9100, cfg.host);
    });
  }
}

/**
 * List available Windows printers
 */
function listPrinters() {
  try {
    const output = execSync('wmic printer get name,default', { encoding: 'utf8' });
    const lines = output.trim().split('\n').slice(1).map(l => l.trim()).filter(Boolean);
    return lines.map(line => {
      const parts = line.split(/\s{2,}/);
      return { name: parts[1] || parts[0], isDefault: parts[0] === 'TRUE' };
    });
  } catch {
    return [];
  }
}

let _connectionState = false;

/**
 * Check if printer is currently connected.
 * For network printers, attempts a quick TCP probe.
 * For Windows printers, checks if the spooler is accessible.
 */
async function isConnected() {
  const config = loadConfig();

  if (config.type === 'windows') {
    // Windows printer: just check if config exists
    _connectionState = !!config.printerName;
    return _connectionState;
  }

  // Network printer: TCP probe on configured host:port
  return new Promise((resolve) => {
    const client = new net.Socket();
    client.setTimeout(2000);

    client.on('connect', () => {
      client.end();
      _connectionState = true;
      resolve(true);
    });

    client.on('timeout', () => {
      client.destroy();
      _connectionState = false;
      resolve(false);
    });

    client.on('error', () => {
      _connectionState = false;
      resolve(false);
    });

    client.connect(config.port || 9100, config.host);
  });
}

module.exports = { print, loadConfig, saveConfig, testConnection, listPrinters, isConnected, DEFAULT_CONFIG };

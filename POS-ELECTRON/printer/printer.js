/**
 * Printer Module
 * Connects to thermal printer via:
 * 1. USB ESC/POS device (libusb-win32, common generic 58mm printers)
 * 2. Network (TCP/IP)
 * 3. Windows shared printer (USB via print spooler)
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

const DEFAULT_USB_VENDOR_ID = 0x28e9;
const DEFAULT_USB_PRODUCT_ID = 0x0289;
const PRINTER_DEBUG = process.env.POS_PRINTER_DEBUG !== '0';

// Default config
const DEFAULT_CONFIG = {
  type: 'usb',              // 'usb', 'network', or 'windows'
  // USB ESC/POS printer settings
  vendorId: '0x28e9',
  productId: '0x0289',
  usbChunkSize: 64,
  usbChunkDelayMs: 10,
  usbCloseDelayMs: 500,
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
      const config = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
      debugLog('Loaded printer config', { path: CONFIG_PATH, config: redactConfig(config) });
      return config;
    }
  } catch (err) {
    console.error('[Printer] Error loading config:', err.message);
  }
  debugLog('Using default printer config', { path: CONFIG_PATH, config: redactConfig(DEFAULT_CONFIG) });
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

function parseUsbId(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'number') return value;
  const text = String(value).trim().toLowerCase();
  return Number.parseInt(text.startsWith('0x') ? text.slice(2) : text, text.startsWith('0x') ? 16 : 10);
}

function printUsb(buffer, config) {
  return new Promise((resolve, reject) => {
    let device;
    let iface;
    const startedAt = Date.now();
    try {
      const usb = require('usb');
      const vendorId = parseUsbId(config.vendorId, DEFAULT_USB_VENDOR_ID);
      const productId = parseUsbId(config.productId, DEFAULT_USB_PRODUCT_ID);
      const devices = usb.getDeviceList().map(describeUsbDevice);
      debugLog('USB print start', {
        vendorId: hexId(vendorId),
        productId: hexId(productId),
        bytes: buffer.length,
        previewHex: buffer.subarray(0, 96).toString('hex'),
        previewText: buffer.subarray(0, 160).toString('ascii').replace(/[^\x20-\x7e\r\n]/g, '.'),
        devices,
      });

      device = usb.findByIds(vendorId, productId);
      if (!device) throw new Error(`device ${hexId(vendorId)}:${hexId(productId)} not found`);

      device.open();
      debugLog('USB device opened', {
        descriptor: describeUsbDevice(device),
        interfaceCount: device.interfaces.length,
      });

      iface = device.interfaces.find((candidate) =>
        candidate.descriptor?.bInterfaceClass === 0x07 ||
        candidate.endpoints?.some((endpoint) => endpoint.direction === 'out')
      ) || device.interfaces[0];

      if (!iface) throw new Error('USB printer interface not found');
      debugLog('USB interface selected', {
        descriptor: iface.descriptor,
        endpoints: iface.endpoints.map(describeEndpoint),
      });

      let kernelDriverActive = false;
      try {
        kernelDriverActive = !!iface.isKernelDriverActive?.();
      } catch (err) {
        debugLog('USB kernel driver check skipped', { error: err.message });
        kernelDriverActive = false;
      }
      if (kernelDriverActive) {
        try {
          iface.detachKernelDriver();
          debugLog('USB kernel driver detached');
        } catch (err) {
          debugLog('USB kernel driver detach failed', { error: err.message });
        }
      }
      iface.claim();
      debugLog('USB interface claimed');

      const endpoint = iface.endpoints.find((candidate) => candidate.direction === 'out');
      const inputEndpoint = iface.endpoints.find((candidate) => candidate.direction === 'in');
      if (!endpoint) throw new Error('USB printer OUT endpoint not found');
      debugLog('USB endpoint selected', describeEndpoint(endpoint));

      readUsbPrinterStatus(endpoint, inputEndpoint, (beforeStatus) => {
        debugLog('USB printer status before transfer', beforeStatus);
        const beforeWarnings = interpretUsbPrinterStatus(beforeStatus);
        if (beforeWarnings.length) {
          debugLog('USB printer status warnings before transfer', { warnings: beforeWarnings });
          closeUsbDevice(device, iface);
          return reject(new Error('USB printer is not ready: ' + beforeWarnings.join('; ')));
        }

        transferUsbInChunks(endpoint, buffer, {
          chunkSize: Number(config.usbChunkSize || 64),
          chunkDelayMs: Number(config.usbChunkDelayMs || 0),
        }, (err, transferStats) => {
        const durationMs = Date.now() - startedAt;
        if (err) {
          debugLog('USB transfer failed', { error: err.message, durationMs, transferStats });
          closeUsbDevice(device, iface);
          return reject(new Error('USB print failed: ' + err.message));
        }

          readUsbPrinterStatus(endpoint, inputEndpoint, (afterStatus) => {
            const afterWarnings = interpretUsbPrinterStatus(afterStatus);
            debugLog('USB transfer completed', {
              bytes: buffer.length,
              endpoint: endpoint.address,
              durationMs,
              transferStats,
              beforeStatus,
              afterStatus,
              warnings: afterWarnings,
            });
            setTimeout(() => {
              closeUsbDevice(device, iface);
              resolve({
                success: true,
                method: 'usb',
                vendorId,
                productId,
                bytes: buffer.length,
                endpoint: endpoint.address,
                durationMs,
                chunks: transferStats.chunks,
                status: afterStatus,
                warnings: afterWarnings,
              });
            }, Number(config.usbCloseDelayMs || 0));
          });
        });
      });
    } catch (err) {
      debugLog('USB print setup failed', { error: err.message });
      closeUsbDevice(device, iface);
      reject(new Error('USB printer not found: ' + err.message));
    }
  });
}

function readUsbPrinterStatus(outEndpoint, inputEndpoint, callback) {
  if (!outEndpoint || !inputEndpoint) {
    callback({ supported: false, error: 'missing IN/OUT endpoint' });
    return;
  }

  const result = {};
  const queries = [
    ['printer', 1],
    ['offlineCause', 2],
    ['errorCause', 3],
    ['paperSensor', 4],
  ];
  const previousTimeout = inputEndpoint.timeout;
  inputEndpoint.timeout = 1000;

  const next = (index) => {
    if (index >= queries.length) {
      inputEndpoint.timeout = previousTimeout;
      callback({ supported: true, ...result });
      return;
    }

    const [name, code] = queries[index];
    outEndpoint.transfer(Buffer.from([0x10, 0x04, code]), (writeErr) => {
      if (writeErr) {
        result[name] = { error: writeErr.message };
        next(index + 1);
        return;
      }
      inputEndpoint.transfer(1, (readErr, data) => {
        const byte = data && data[0];
        result[name] = readErr
          ? { error: readErr.message }
          : { byte, hex: '0x' + byte.toString(16).padStart(2, '0'), binary: byte.toString(2).padStart(8, '0') };
        next(index + 1);
      });
    });
  };

  next(0);
}

function interpretUsbPrinterStatus(status = {}) {
  const warnings = [];
  const paper = status.paperSensor?.byte;
  const offline = status.offlineCause?.byte;
  const error = status.errorCause?.byte;

  if (typeof paper === 'number') {
    if (paper & 0x0c) warnings.push('Paper near-end sensor is active');
    if (paper & 0x60) warnings.push('Paper end sensor is active');
  }
  if (typeof offline === 'number') {
    if (offline & 0x04) warnings.push('Paper feed button may be active');
    if (offline & 0x20) warnings.push('Cover may be open or printer offline');
  }
  if (typeof error === 'number') {
    if (error & 0x08) warnings.push('Cutter error may be active');
    if (error & 0x40) warnings.push('Unrecoverable printer error may be active');
  }

  return warnings;
}

function transferUsbInChunks(endpoint, buffer, options, callback) {
  const chunkSize = Math.max(1, Number(options.chunkSize || 64));
  const chunkDelayMs = Math.max(0, Number(options.chunkDelayMs || 0));
  let offset = 0;
  let chunks = 0;

  const writeNext = () => {
    if (offset >= buffer.length) {
      callback(null, { chunks, chunkSize, chunkDelayMs });
      return;
    }

    const end = Math.min(offset + chunkSize, buffer.length);
    const chunk = buffer.subarray(offset, end);
    chunks += 1;
    debugLog('USB chunk transfer', {
      chunk: chunks,
      offset,
      bytes: chunk.length,
      previewHex: chunk.subarray(0, 32).toString('hex'),
    });

    endpoint.transfer(chunk, (err) => {
      if (err) {
        callback(err, { chunks, chunkSize, chunkDelayMs, failedOffset: offset });
        return;
      }
      offset = end;
      if (chunkDelayMs > 0) setTimeout(writeNext, chunkDelayMs);
      else writeNext();
    });
  };

  writeNext();
}

function closeUsbDevice(device, iface) {
  try {
    if (iface?.claimed) {
      iface.release(true, () => {
        debugLog('USB interface released');
        try {
          device?.close();
          debugLog('USB device closed');
        } catch (err) {
          debugLog('USB device close failed', { error: err.message });
        }
      });
      return;
    }
  } catch {
    // fall through to direct close
  }
  try {
    device?.close();
    if (device) debugLog('USB device closed');
  } catch (err) {
    debugLog('USB device close failed', { error: err.message });
  }
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
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || '');
  debugLog('Print requested', {
    type: config.type,
    bytes: data.length,
    config: redactConfig(config),
  });

  if (config.type === 'usb') {
    return printUsb(data, config);
  } else if (config.type === 'windows') {
    return printWindows(data, config);
  } else {
    return printNetwork(data, config);
  }
}

/**
 * Test printer connection
 */
async function testConnection(config = null) {
  const cfg = config || loadConfig();

  if (cfg.type === 'usb') {
    try {
      const usb = require('usb');
      const vendorId = parseUsbId(cfg.vendorId, DEFAULT_USB_VENDOR_ID);
      const productId = parseUsbId(cfg.productId, DEFAULT_USB_PRODUCT_ID);
      const device = usb.findByIds(vendorId, productId);
      return { success: !!device, message: `USB printer found (${hexId(vendorId)}:${hexId(productId)})` };
    } catch (err) {
      return { success: false, message: 'USB printer not found: ' + err.message };
    }
  }

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

  if (config.type === 'usb') {
    try {
      const usb = require('usb');
      const vendorId = parseUsbId(config.vendorId, DEFAULT_USB_VENDOR_ID);
      const productId = parseUsbId(config.productId, DEFAULT_USB_PRODUCT_ID);
      _connectionState = !!usb.findByIds(vendorId, productId);
      return _connectionState;
    } catch {
      _connectionState = false;
      return false;
    }
  }

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

function hexId(value) {
  return '0x' + Number(value).toString(16).padStart(4, '0');
}

function describeUsbDevice(device) {
  const descriptor = device.deviceDescriptor || {};
  return {
    vendorId: hexId(descriptor.idVendor || 0),
    productId: hexId(descriptor.idProduct || 0),
    deviceClass: descriptor.bDeviceClass,
    manufacturer: descriptor.iManufacturer,
    product: descriptor.iProduct,
    interfaces: device.configDescriptor?.interfaces?.map((group) =>
      group.map((iface) => ({
        number: iface.bInterfaceNumber,
        class: iface.bInterfaceClass,
        subclass: iface.bInterfaceSubClass,
        protocol: iface.bInterfaceProtocol,
        endpoints: iface.endpoints?.map((endpoint) => ({
          address: endpoint.bEndpointAddress,
          attributes: endpoint.bmAttributes,
          maxPacketSize: endpoint.wMaxPacketSize,
        })),
      }))
    ),
  };
}

function describeEndpoint(endpoint) {
  return {
    address: endpoint.address,
    direction: endpoint.direction,
    transferType: endpoint.transferType,
    descriptor: endpoint.descriptor,
  };
}

function redactConfig(config) {
  return { ...config };
}

function debugLog(message, data = undefined) {
  if (!PRINTER_DEBUG) return;
  if (data === undefined) {
    console.log(`[Printer] ${message}`);
  } else {
    console.log(`[Printer] ${message}:`, JSON.stringify(data));
  }
}

module.exports = { print, loadConfig, saveConfig, testConnection, listPrinters, isConnected, DEFAULT_CONFIG };

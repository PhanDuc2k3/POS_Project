/**
 * POS Electron - Device Agent
 *
 * Chạy trên máy POS (máy tính tiền) tại quầy.
 *
 * Vai trò:
 * 1. UI POS (renderer) - giao diện bán hàng truyền thống
 * 2. Device Agent - đăng ký thiết bị với backend, gửi heartbeat, nhận print jobs
 *
 * Device Agent Flow:
 *  1. App khởi động → collectDeviceInfo()
 *  2. User đăng nhập → connectSocket(token)
 *  3. Socket connected → socket.emit('device:register', { serial, storeId, info })
 *  4. Mỗi 30s → socket.emit('device:heartbeat', { status })
 *  5. Nhận 'print:job' event → in hóa đơn → socket.emit('device:printResult', { jobId, status })
 */

const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');
const { io } = require('socket.io-client');

// Keep Chromium stable on locked-down Windows POS machines.
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('no-sandbox');

const userDataRoot = process.env.LOCALAPPDATA || app.getPath('appData');
const userDataDir = path.join(userDataRoot, 'POS-App');
try {
  fs.mkdirSync(userDataDir, { recursive: true });
} catch {
  // Electron will still try its default path if this cannot be created.
}
app.setPath('userData', userDataDir);
process.env.POS_USER_DATA_DIR = userDataDir;

const printer = require('./printer');

// ─── State ───────────────────────────────────────────────────────────

let mainWindow = null;
let deviceSerial = null;
let deviceInfo = null;
let socket = null;
let storeConfig = null;   // Cached store + receipt config for printing
let receiptConfig = null;
let heartbeatTimer = null;
let authToken = null;     // JWT token set after login
let isRegistered = false;
let currentStoreId = null;

// ─── Device Info ─────────────────────────────────────────────────────

function getBIOSSerial() {
  try {
    if (process.platform === 'win32') {
      try {
        const output = execSync('wmic bios get serialnumber', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        const lines = output.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines[1]) return lines[1];
      } catch {
        // wmic is missing/disabled on some Windows builds.
      }

      const ps = 'try { (Get-CimInstance Win32_BIOS).SerialNumber } catch { "" }';
      const output = execSync(`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "${ps}"`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return output.trim() || null;
    } else if (process.platform === 'darwin') {
      const output = execSync('system_profiler SPHardwareDataType | grep Serial', { encoding: 'utf8' });
      const match = output.match(/Serial Number.*?:\s*(.+)/);
      return match ? match[1].trim() : null;
    } else {
      const output = execSync('cat /sys/class/dmi/id/product_serial 2>/dev/null || echo ""', { encoding: 'utf8' });
      return output.trim() || null;
    }
  } catch {
    return null;
  }
}

function getPersistentDeviceId() {
  const idPath = path.join(userDataDir, 'device-id.txt');
  try {
    if (fs.existsSync(idPath)) {
      const existing = fs.readFileSync(idPath, 'utf8').trim();
      if (existing) return existing;
    }
  } catch {
    // Fall through and generate a new local id.
  }

  const generated = `POS-${os.hostname()}-${Date.now()}`;
  try {
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.writeFileSync(idPath, generated, 'utf8');
  } catch {
    // Last-resort in-memory fallback for locked-down environments.
  }
  return generated;
}

function collectDeviceInfo() {
  const serial = getBIOSSerial();
  deviceSerial = serial || getPersistentDeviceId();
  const cpus = os.cpus();
  deviceInfo = {
    serial: deviceSerial,
    hostname: os.hostname(),
    platform: process.platform,
    arch: os.arch(),
    osVersion: os.release(),
    totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
    cpu: cpus.length > 0 ? cpus[0].model : 'Unknown',
    username: os.userInfo().username,
    appVersion: app.getVersion(),
    startedAt: new Date().toISOString(),
  };
  console.log(`[Device Agent] Started | Hostname: ${deviceInfo.hostname} | Serial: ${serial}`);
}

// ─── WebSocket ──────────────────────────────────────────────────────

function connectSocket(token) {
  if (socket) {
    socket.disconnect();
  }
  authToken = token;

  socket = io('http://localhost:4000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    console.log('[Device Agent] WebSocket connected');
    if (mainWindow) mainWindow.webContents.send('ws:connected');

    // ── Auto-register device after connection ────────────────────────────
    if (!isRegistered) {
      registerDevice();
    }

    // ── Start heartbeat ────────────────────────────────────────────────
    startHeartbeat();
  });

  socket.on('disconnect', (reason) => {
    console.log('[Device Agent] WebSocket disconnected:', reason);
    if (mainWindow) mainWindow.webContents.send('ws:disconnected');
    stopHeartbeat();
    isRegistered = false;
  });

  socket.on('connect_error', (err) => {
    console.error('[Device Agent] WebSocket connection error:', err.message);
  });

  // ── Device Agent Events ──────────────────────────────────────────────

  // Registration confirmed
  socket.on('device:registered', (data) => {
    console.log('[Device Agent] Registered with backend', JSON.stringify(data));
    isRegistered = true;
    if (mainWindow) mainWindow.webContents.send('device:registered', data);
  });

  // Print job received from backend
  socket.on('print:job', async (data) => {
    const { jobId, storeId, type, payload } = data || {};
    console.log(`[Device Agent] Print job received: #${jobId}`);

    try {
      // Get cached store/receipt config
      const store = payload?.store || storeConfig;
      const receipt = payload?.receipt || receiptConfig;

      // Format and print
      const buffer = printer.formatReceipt(payload?.order || payload, store, receipt);
      const result = await printer.print(buffer);

      // Report success back to backend
      socket.emit('device:printResult', {
        jobId,
        serial: deviceSerial,
        status: 'SUCCESS',
        method: result.method,
        printedAt: new Date().toISOString(),
      });
      console.log(`[Device Agent] Print job #${jobId} completed via ${result.method}`);
    } catch (err) {
      // Report failure back to backend
      socket.emit('device:printResult', {
        jobId,
        serial: deviceSerial,
        status: 'FAILED',
        error: err.message,
        failedAt: new Date().toISOString(),
      });
      console.error(`[Device Agent] Print job #${jobId} failed:`, err.message);
    }
  });

  // ── Business Events (forward to renderer) ──────────────────────────
  const EVENTS = [
    'product:created',
    'product:updated',
    'product:toppingUpdated',
    'product:categoryCreated',
    'store:updated',
    'store:bankUpdated',
    'store:receiptUpdated',
    'transaction:created',
    'transaction:paid',
    'transaction:cancelled',
    'transaction:refunded',
    'dashboard:refresh',
  ];

  EVENTS.forEach(event => {
    socket.on(event, (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('ws:event', { event, data });
      }
    });
  });
}

function disconnectSocket() {
  stopHeartbeat();
  isRegistered = false;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ─── Device Registration ──────────────────────────────────────────────

async function getPrinterConnected() {
  try {
    return await printer.isConnected();
  } catch {
    return false;
  }
}

async function registerDevice() {
  if (!socket || !socket.connected || !deviceSerial) return;

  socket.emit('device:register', {
    serial: deviceSerial,
    storeId: currentStoreId,
    info: deviceInfo,
    printerConnected: await getPrinterConnected(),
    registeredAt: new Date().toISOString(),
  });
  console.log('[Device Agent] Sending device:register');
}

// ─── Heartbeat ───────────────────────────────────────────────────────

const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(async () => {
    if (!socket || !socket.connected) return;

    socket.emit('device:heartbeat', {
      serial: deviceSerial,
      status: 'ONLINE',
      printerConnected: await getPrinterConnected(),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }, HEARTBEAT_INTERVAL_MS);

  console.log(`[Device Agent] Heartbeat started (every ${HEARTBEAT_INTERVAL_MS / 1000}s)`);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// ─── Window ──────────────────────────────────────────────────────────

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1280, width),
    height: Math.min(800, height),
    minWidth: 900,
    minHeight: 600,
    title: 'POS',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile('renderer/index.html');

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    disconnectSocket();
  });
}

// ─── IPC Handlers ────────────────────────────────────────────────────

ipcMain.handle('get-device-serial', () => deviceSerial);
ipcMain.handle('get-device-info', () => deviceInfo);
ipcMain.handle('get-app-version', () => app.getVersion());

// WebSocket
ipcMain.handle('connect-socket', (event, token) => {
  connectSocket(token);
  return true;
});

ipcMain.handle('disconnect-socket', () => {
  disconnectSocket();
  return true;
});

// Update storeId after login (so backend knows which store this device belongs to)
ipcMain.handle('update-store-id', (event, storeId) => {
  currentStoreId = storeId || null;
  if (deviceRegistry && deviceSerial) {
    deviceRegistry.update(deviceSerial, { storeId });
  }
  if (socket && socket.connected) {
    registerDevice();
  }
  return true;
});

// Printer
ipcMain.handle('printer:getConfig', () => {
  return printer.loadConfig();
});

ipcMain.handle('printer:saveConfig', (event, config) => {
  return printer.saveConfig(config);
});

ipcMain.handle('printer:test', async (event, config) => {
  return printer.testConnection(config || undefined);
});

ipcMain.handle('printer:listPrinters', () => {
  return printer.listPrinters();
});

ipcMain.handle('printer:print', async (event, { order, store, receipt }) => {
  try {
    const buffer = printer.formatReceipt(order, store || storeConfig, receipt || receiptConfig);
    const result = await printer.print(buffer);
    console.log('[Device Agent] Manual print success:', result.method);
    return { success: true, ...result };
  } catch (err) {
    console.error('[Device Agent] Manual print failed:', err.message);
    return { success: false, error: err.message };
  }
});

// Cache store/receipt config for printing
ipcMain.handle('printer:setStoreConfig', (event, { store, receipt }) => {
  storeConfig = store;
  receiptConfig = receipt;
  currentStoreId = store?.id || null;
  // Re-register with storeId so backend can route print jobs correctly
  if (store && store.id) {
    if (socket && socket.connected) {
      registerDevice();
    }
  }
  return true;
});

// ─── App Lifecycle ───────────────────────────────────────────────────

app.whenReady().then(() => {
  collectDeviceInfo();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  disconnectSocket();
  if (process.platform !== 'darwin') app.quit();
});

// ─── Minimal device registry (in-memory, mirrors gateway registry) ───
const deviceRegistry = {
  _data: {},
  update(serial, patch) {
    if (!this._data[serial]) this._data[serial] = {};
    this._data[serial] = { ...this._data[serial], ...patch };
  },
};

/**
 * Device fingerprint & info collector
 * 
 * Ưu tiên lấy serial thật từ Electron (BIOS serial number).
 * Nếu chạy trên trình duyệt thuần → dùng persistent ID từ localStorage.
 * 
 * Trên Electron:  serial = "NHQENSV005208087A83400" (từ wmic)
 * Trên Browser:   serial = "DEV-AB12-CD34-EF56" (generated, persistent)
 */

const DEVICE_ID_KEY = 'pos_device_id';
const DEVICE_NAME_KEY = 'pos_device_name';

/**
 * Check if running inside Electron
 */
function isElectron() {
  return !!(window.electronAPI);
}

/**
 * Generate a fallback device ID for browser
 * Format: DEV-XXXX-XXXX-XXXX
 */
function generateDeviceId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let s = 0; s < 3; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(seg);
  }
  return `DEV-${segments.join('-')}`;
}

/**
 * Get device serial number
 * - Electron: real BIOS serial (e.g. "NHQENSV005208087A83400")
 * - Browser: persistent generated ID
 */
export async function getDeviceId() {
  // Electron - get real serial from BIOS
  if (isElectron()) {
    try {
      const serial = await window.electronAPI.getDeviceSerial();
      if (serial) return serial;
    } catch {
      // fallback below
    }
  }

  // Browser fallback - persistent localStorage ID
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Synchronous version (uses cached value from last async call)
 */
export function getDeviceIdSync() {
  if (isElectron() && window.__posDeviceSerial) {
    return window.__posDeviceSerial;
  }
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Get or set custom device name
 */
export function getDeviceName() {
  const custom = localStorage.getItem(DEVICE_NAME_KEY);
  if (custom) return custom;
  return buildAutoDeviceName();
}

export function setDeviceName(name) {
  localStorage.setItem(DEVICE_NAME_KEY, name);
}

/**
 * Auto-detect device name from browser/system info
 */
function buildAutoDeviceName() {
  // Electron may provide hostname
  if (isElectron() && window.__posDeviceInfo?.hostname) {
    return window.__posDeviceInfo.hostname;
  }

  const platform = navigator.platform || navigator.userAgentData?.platform || 'Unknown';

  if (platform.includes('Win')) return `Windows PC`;
  if (platform.includes('Mac')) return `MacBook`;
  if (platform.includes('Linux')) return `Linux PC`;
  if (/iPhone/.test(navigator.userAgent)) return `iPhone`;
  if (/iPad/.test(navigator.userAgent)) return `iPad`;
  if (/Android/.test(navigator.userAgent)) return `Android`;

  return `Thiết bị Web`;
}

/**
 * Initialize device info (call once on app start)
 * Pre-fetches serial from Electron if available
 */
export async function initDeviceInfo() {
  if (isElectron()) {
    try {
      const serial = await window.electronAPI.getDeviceSerial();
      const info = await window.electronAPI.getDeviceInfo();
      window.__posDeviceSerial = serial;
      window.__posDeviceInfo = info;
    } catch {
      // ignore
    }
  }
}

/**
 * Collect full device info to send with login request
 */
export async function getDeviceInfo() {
  const deviceId = await getDeviceId();
  const screen = `${window.screen.width}x${window.screen.height}`;
  const timezone = 'Asia/Bangkok';
  const language = navigator.language;
  const platform = navigator.platform || 'Unknown';

  const info = {
    deviceId,
    deviceName: getDeviceName(),
    screenResolution: screen,
    timezone,
    language,
    platform,
    isElectron: isElectron(),
  };

  // Add extra Electron info if available
  if (isElectron() && window.__posDeviceInfo) {
    info.hostname = window.__posDeviceInfo.hostname;
    info.cpu = window.__posDeviceInfo.cpu;
    info.totalMemory = window.__posDeviceInfo.totalMemory;
  }

  return info;
}

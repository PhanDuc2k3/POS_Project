/**
 * Lightweight User-Agent parser
 * Extracts: browser, OS, device type, and friendly device name
 * No dependencies needed.
 */

function parseUserAgent(ua) {
  if (!ua) {
    return { browser: 'Unknown', os: 'Unknown', deviceType: 'unknown', deviceName: 'Thiết bị không xác định' };
  }

  const browser = detectBrowser(ua);
  const os = detectOS(ua);
  const deviceType = detectDeviceType(ua);
  const deviceName = buildDeviceName(browser, os, deviceType);

  return { browser, os, deviceType, deviceName };
}

function detectBrowser(ua) {
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Electron')) return 'POS App';
  if (ua.includes('axios') || ua.includes('node-fetch') || ua.includes('Node')) return 'API Client';
  return 'Unknown';
}

function detectOS(ua) {
  if (ua.includes('Windows NT 10')) return 'Windows 10/11';
  if (ua.includes('Windows NT')) return 'Windows';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Android')) {
    const match = ua.match(/Android ([\d.]+)/);
    return match ? `Android ${match[1]}` : 'Android';
  }
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
}

function detectDeviceType(ua) {
  if (ua.includes('Electron')) return 'pos';
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) return 'mobile';
  if (ua.includes('iPad') || ua.includes('Tablet')) return 'tablet';
  return 'desktop';
}

function buildDeviceName(browser, os, deviceType) {
  const typeLabel = {
    desktop: '💻',
    mobile: '📱',
    tablet: '📱',
    pos: '🖥️',
    unknown: '❓',
  };

  const icon = typeLabel[deviceType] || '💻';
  return `${icon} ${browser} trên ${os}`;
}

module.exports = { parseUserAgent };

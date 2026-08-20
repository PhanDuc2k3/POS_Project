import { API_URL } from './api.js';
import { getAccessToken } from './session.js';

let socket = null;
let scriptPromise = null;

function gatewayOrigin() {
  return API_URL.replace(/\/api\/?$/, '');
}

function loadSocketClient() {
  if (window.io) return Promise.resolve(window.io);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${gatewayOrigin()}/socket.io/socket.io.js`;
      script.async = true;
      script.onload = () => resolve(window.io);
      script.onerror = () => reject(new Error('Realtime client failed to load'));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export async function connectRealtime({ onStatus, onPlatformChange } = {}) {
  const token = getAccessToken();
  if (!token) return null;
  if (socket) socket.disconnect();

  const io = await loadSocketClient();
  socket = io(gatewayOrigin(), {
    transports: ['websocket', 'polling'],
    auth: { token },
  });

  socket.on('connect', () => onStatus?.({ connected: true, error: '' }));
  socket.on('disconnect', (reason) => onStatus?.({ connected: false, error: reason || '' }));
  socket.on('connect_error', (err) => onStatus?.({ connected: false, error: err.message || 'Realtime connection failed' }));
  socket.on('platform:changed', (event) => onPlatformChange?.(event));

  return socket;
}

export function disconnectRealtime() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

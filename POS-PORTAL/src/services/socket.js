/**
 * Socket.IO client for realtime updates
 * 
 * Events listened:
 *   - transaction:created     → new order came in
 *   - transaction:cancelled   → order cancelled
 *   - transaction:refunded    → order refunded
 *   - store:updated           → store info changed
 *   - store:productCreated    → menu changed
 *   - store:productUpdated    → menu changed
 *   - store:bankUpdated       → bank config changed
 *   - store:receiptUpdated    → receipt config changed
 */

import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

let socket = null;
const listeners = new Map();

/**
 * Connect to WebSocket server with auth token
 */
export function connectSocket(token) {
  if (socket?.connected) return;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.log('[Socket] Connection error:', err.message);
  });

  // Re-register existing listeners
  for (const [event, handlers] of listeners) {
    for (const handler of handlers) {
      socket.on(event, handler);
    }
  }
}

/**
 * Disconnect socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Listen to a realtime event
 * Returns unsubscribe function
 */
export function onSocketEvent(event, handler) {
  if (!listeners.has(event)) {
    listeners.set(event, []);
  }
  listeners.get(event).push(handler);

  if (socket) {
    socket.on(event, handler);
  }

  // Return unsubscribe function
  return () => {
    if (socket) socket.off(event, handler);
    const arr = listeners.get(event);
    if (arr) {
      const idx = arr.indexOf(handler);
      if (idx !== -1) arr.splice(idx, 1);
    }
  };
}

/**
 * Dispatch a realtime event to all connected clients
 * (Portal → POS notification)
 */
export function dispatchEvent(event, data) {
  if (socket && socket.connected) {
    socket.emit(event, data);
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected() {
  return socket?.connected || false;
}

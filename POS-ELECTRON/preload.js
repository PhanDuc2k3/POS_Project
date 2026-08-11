const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('posAPI', {
  // Device
  getDeviceSerial: () => ipcRenderer.invoke('get-device-serial'),
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,

  // WebSocket
  connectSocket: (token) => ipcRenderer.invoke('connect-socket', token),
  disconnectSocket: () => ipcRenderer.invoke('disconnect-socket'),
  onSocketEvent: (callback) => {
    ipcRenderer.on('ws:event', (event, payload) => callback(payload));
  },
  onSocketConnected: (callback) => {
    ipcRenderer.on('ws:connected', () => callback());
  },
  onSocketDisconnected: (callback) => {
    ipcRenderer.on('ws:disconnected', () => callback());
  },

  // Printer
  getPrinterConfig: () => ipcRenderer.invoke('printer:getConfig'),
  savePrinterConfig: (config) => ipcRenderer.invoke('printer:saveConfig', config),
  testPrinter: (config) => ipcRenderer.invoke('printer:test', config),
  listPrinters: () => ipcRenderer.invoke('printer:listPrinters'),
  printReceipt: (data) => ipcRenderer.invoke('printer:print', data),
  setStoreConfig: (data) => ipcRenderer.invoke('printer:setStoreConfig', data),
});

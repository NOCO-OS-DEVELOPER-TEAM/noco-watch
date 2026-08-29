const { contextBridge, ipcRenderer } = require('electron');

const API_PORT = Number(process.env.NOCO_PORT || 3000);

contextBridge.exposeInMainWorld('nocoDesktop', {
  isDesktop: true,
  platform: process.platform,
  apiBase: `http://127.0.0.1:${API_PORT}`,
  startServer: () => ipcRenderer.invoke('server:start'),
  stopServer: () => ipcRenderer.invoke('server:stop'),
  serverStatus: () => ipcRenderer.invoke('server:status'),
  copyText: (text) => ipcRenderer.invoke('desktop:copyText', text),
  openExternal: (url) => ipcRenderer.invoke('desktop:openExternal', url),
  onServerChanged: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('server-changed', handler);
    return () => ipcRenderer.removeListener('server-changed', handler);
  },
});

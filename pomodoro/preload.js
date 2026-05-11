const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setTitle: (title) => ipcRenderer.invoke('set-title', title),
  showNotification: (opts) => ipcRenderer.invoke('show-notification', opts),
});

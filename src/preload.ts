const { contextBridge, ipcRenderer } = require('electron');

const API = {
    getLocalData: (filename: string) => ipcRenderer.invoke('getLocalData', filename),
    openLink: (url: string) => ipcRenderer.send('openLink', url),
    showMessageDialog: (options: Electron.MessageBoxOptions) => ipcRenderer.invoke('showMessageDialog', options),
    saveData: (filename: string, data: Object) => ipcRenderer.invoke('saveData', filename, data),
    readData: (filename: string) => ipcRenderer.invoke('readData', filename)
}

contextBridge.exposeInMainWorld("api", API);

window.addEventListener('DOMContentLoaded', () => {
    const script = document.createElement('script');
    script.src = 'https://kit.fontawesome.com/d7a8d229c2.js';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
});
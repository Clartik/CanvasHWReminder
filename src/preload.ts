const { contextBridge, ipcRenderer } = require('electron');

const API = {
    openLink: (url: string) => ipcRenderer.send('openLink', url),
    showMessageDialog: (options: Electron.MessageBoxOptions) => ipcRenderer.invoke('showMessageDialog', options),
    writeSavedData: (filename: string, data: Object) => ipcRenderer.invoke('writeSavedData', filename, data),
    getSavedData: (filename: string) => ipcRenderer.invoke('getSavedData', filename),
    getLocalData: (filename: string) => ipcRenderer.invoke('getLocalData', filename),
    savedSettings: () => ipcRenderer.send('savedSettings')
}

contextBridge.exposeInMainWorld("api", API);

window.addEventListener('DOMContentLoaded', () => {
    const script = document.createElement('script');
    script.src = 'https://kit.fontawesome.com/d7a8d229c2.js';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
});
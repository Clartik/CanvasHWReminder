const { contextBridge, ipcRenderer } = require('electron');

const API = {
    getJSONData: (filename: string) => ipcRenderer.invoke('json:getData', filename),
    openLink: (url: string) => ipcRenderer.send('openLink', url),
    showMessageDialog: (options: Electron.MessageBoxOptions) => ipcRenderer.invoke('showMessageDialog', options)
}

contextBridge.exposeInMainWorld("api", API);
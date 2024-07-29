const { contextBridge, ipcRenderer } = require('electron');

const API = {
    getJSONData: (filename: string) => ipcRenderer.invoke('json:getData', filename)
}

contextBridge.exposeInMainWorld("api", API);
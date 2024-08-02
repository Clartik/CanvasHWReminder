"use strict";
const { contextBridge, ipcRenderer } = require('electron');
const API = {
    getJSONData: (filename) => ipcRenderer.invoke('json:getData', filename),
    openLink: (url) => ipcRenderer.send('openLink', url)
};
contextBridge.exposeInMainWorld("api", API);

"use strict";
const { contextBridge, ipcRenderer } = require('electron');
const API = {
    getJSONData: (filename) => ipcRenderer.invoke('json:getData', filename)
};
contextBridge.exposeInMainWorld("api", API);

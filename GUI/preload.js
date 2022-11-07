const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('versions',
{
    node: () => process.versions.node,
    chrome: () => process.versions.chrome.chrome,
    electron: () => process.versions.electron,
    ping: () => ipcRenderer.invoke('ping'),
})

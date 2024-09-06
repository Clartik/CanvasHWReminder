const { contextBridge, ipcRenderer } = require('electron');

type UpdateDataCallback = (type: string, data: Object | null) => void;

const API = {
    openLink: (url: string) => ipcRenderer.send('openLink', url),
    showMessageDialog: (options: Electron.MessageBoxOptions) => ipcRenderer.invoke('showMessageDialog', options),
    writeSavedData: (filename: string, data: Object) => ipcRenderer.invoke('writeSavedData', filename, data),
    getSavedData: (filename: string) => ipcRenderer.invoke('getSavedData', filename),
    getCachedData: (filename: string) => ipcRenderer.invoke('getCachedData', filename),
    updateData: (type: string, data: Object | null) => ipcRenderer.send('updateData', type, data),
    onUpdateData: (callback: UpdateDataCallback) => ipcRenderer.on('updateData', (_event: Event, type: string, data: Object | null) => callback(type, data)),
    keyPress: (key: string) => ipcRenderer.send('keyPress', key),
    getDebugMode: () => ipcRenderer.invoke('getDebugMode'),
    onSendAppStatus: (callback: (status: string) => void) => ipcRenderer.on('sendAppStatus', (_event: Event, status: string) => callback(status)),
    getAppStatus: () => ipcRenderer.invoke('getAppStatus')
}

contextBridge.exposeInMainWorld("api", API);

document.addEventListener('keydown', (event: KeyboardEvent) => {
    switch (event.key) {
        case 'F1':
            API.keyPress('F1');
            break;

        case 'F5':
            API.keyPress('F5');
            break;
    
        default:
            break;
    }
});
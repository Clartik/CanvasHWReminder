import { Assignment } from "src/shared/interfaces/classData";

const { contextBridge, ipcRenderer } = require('electron');

type UpdateDataCallback = (type: string, data: Object | null) => void;

const API = {
    openLink: (url: string) => ipcRenderer.send('openLink', url),
    showMessageDialog: (options: Electron.MessageBoxOptions) => ipcRenderer.invoke('showMessageDialog', options),
    writeSavedData: (filename: string, data: Object) => ipcRenderer.invoke('writeSavedData', filename, data),
    getSavedData: (filename: string) => ipcRenderer.invoke('getSavedData', filename),
    getCachedData: (filename: string) => ipcRenderer.invoke('getCachedData', filename),
    updateData: (type: string, data: Object | null) => ipcRenderer.send('updateData', type, data),
    onUpdateData: (callback: UpdateDataCallback) => ipcRenderer.on('updateData', (_event, type: string, data: Object | null) => callback(type, data)),
    keyPress: (key: string) => ipcRenderer.send('keyPress', key),
    getDebugMode: () => ipcRenderer.invoke('getDebugMode'),
    onSendAppStatus: (callback: (status: string) => void) => ipcRenderer.on('sendAppStatus', (_event, status: string) => callback(status)),
    sendAppStatus: (status: string, data?: Object) => ipcRenderer.send('sendAppStatus', status, data ?? null), 
    getAppStatus: () => ipcRenderer.invoke('getAppStatus'),
    getSelfFromCanvas: (baseUrl: string, apiToken: string) => ipcRenderer.invoke('getSelfFromCanvas', baseUrl, apiToken),
    saveSecureText: (key: string, text: string) => ipcRenderer.send('saveSecureText', key, text),
    getSecureText: (key: string) => ipcRenderer.invoke('getSecureText', key),
    disableAssignmentReminder: (assignment: Assignment) => ipcRenderer.send('disableAssignmentReminder', assignment),
    enableAssignmentReminder: (assignment: Assignment) => ipcRenderer.send('enableAssignmentReminder', assignment),
    getAssignmentsNotToRemind: () => ipcRenderer.invoke('getAssignmentsNotToRemind'),
    onSendDownloadProgress: (callback: (status: string, percent: number) => void) => ipcRenderer.on('sendDownloadProgress', (_event, status: string, percent: number) => callback(status, percent)),
    onRemoveProgressBarTextLink: (callback: () => void) => ipcRenderer.on('removeProgressBarTextLink', (_event) => callback()),
    launchUpdaterDialog: (type: string) => ipcRenderer.send('launchUpdaterDialog', type),
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

        case 'F12':
            API.keyPress('F12');
            break;
    
        default:
            break;
    }
});

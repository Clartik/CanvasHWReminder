import { Assignment } from "src/shared/interfaces/classData";
import { ContextMenuParams, ContextMenuCommandParams } from "src/shared/interfaces/contextMenuParams";

import { contextBridge, ipcRenderer } from "electron";

type UpdateDataCallback = (type: string, data: object | null) => void;

const API = {
    util: {
        sleep: (time_in_ms: number) => ipcRenderer.invoke('util:sleep', time_in_ms),
    },
    getTimeDiffInSeconds: (date1: Date, date2: Date) => ipcRenderer.invoke('getTimeDiffInSeconds', date1, date2),
    getTimeTillDueDate: (date1: Date, date2: Date) => ipcRenderer.invoke('getTimeTillDueDate', date1, date2),
    getExactDueDate: (date1: Date, date2: Date) => ipcRenderer.invoke('getExactDueDate', date1, date2),
    openLink: (url: string) => ipcRenderer.send('openLink', url),
    showMessageDialog: (options: Electron.MessageBoxOptions) => ipcRenderer.invoke('showMessageDialog', options),
    writeSavedData: (filename: string, data: object) => ipcRenderer.invoke('writeSavedData', filename, data),
    getSavedData: (filename: string) => ipcRenderer.invoke('getSavedData', filename),
    getCachedData: (filename: string) => ipcRenderer.invoke('getCachedData', filename),
    updateData: (type: string, data: object | null) => ipcRenderer.send('updateData', type, data),
    onUpdateData: (callback: UpdateDataCallback) => ipcRenderer.on('updateData', (_event, type: string, data: object | null) => callback(type, data)),
    keyPress: (key: string) => ipcRenderer.send('keyPress', key),
    getDebugMode: () => ipcRenderer.invoke('getDebugMode'),
    onSendAppStatus: (callback: (status: string) => void) => ipcRenderer.on('sendAppStatus', (_event, status: string) => callback(status)),
    sendAppStatus: (status: string, data?: object) => ipcRenderer.send('sendAppStatus', status, data ?? null), 
    getAppStatus: () => ipcRenderer.invoke('getAppStatus'),
    getSelfFromCanvas: (baseUrl: string, apiToken: string) => ipcRenderer.invoke('getSelfFromCanvas', baseUrl, apiToken),
    saveSecureText: (key: string, text: string) => ipcRenderer.send('saveSecureText', key, text),
    getSecureText: (key: string) => ipcRenderer.invoke('getSecureText', key),
    disableAssignmentReminder: (assignment: Assignment) => ipcRenderer.send('disableAssignmentReminder', assignment),
    enableAssignmentReminder: (assignment: Assignment) => ipcRenderer.send('enableAssignmentReminder', assignment),
    getAssignmentsNotToRemind: () => ipcRenderer.invoke('getAssignmentsNotToRemind'),
    onSendDownloadProgress: (callback: (status: string, percent: number) => void) => ipcRenderer.on('sendDownloadProgress', (_event, status: string, percent: number) => callback(status, percent)),
    onRemoveProgressBarTextLink: (callback: () => void) => ipcRenderer.on('removeProgressBarTextLink', () => callback()),
    launchUpdaterDialog: (type: string) => ipcRenderer.send('launchUpdaterDialog', type),
    getAssignmentsWithNoSubmissions: () => ipcRenderer.invoke('getAssignmentsWithNoSubmissions'),
    onContextMenuCommand: (callback: (command: string, data: ContextMenuCommandParams) => void) => ipcRenderer.on('context-menu-command', (_event, command: string, data: ContextMenuCommandParams) => callback(command, data)),
    showContextMenu: (type: string, data: ContextMenuParams) => ipcRenderer.send('show-context-menu', type, data),
    addAssignmentMarkedAsSubmitted: (assignment: Assignment) => ipcRenderer.send('mark-assignment-submit', assignment),
    addAssignmentMarkedAsUnsubmitted: (assignment: Assignment) => ipcRenderer.send('mark-assignment-unsubmit', assignment),
    getAssignmentSubmittedTypes: () => ipcRenderer.invoke('get-assignment-submitted-types')
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

        case 'F11':
            API.keyPress('F11');
            break;

        case 'F12':
            API.keyPress('F12');
            break;
    
        default:
            break;
    }
});

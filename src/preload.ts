import { contextBridge, ipcRenderer } from "electron";

import { Assignment } from "./interfaces/classData";
import { ContextMenuParams, ContextMenuCommandParams } from "./interfaces/contextMenuParams";

type UpdateDataCallback = (type: string, data: object | null) => void;

type Channels = {
    send: string[],
    receive: string[],
    invoke: string[],
}

const channels: Channels = {
    // From render to main
    send: [],
    // From main to render
    receive: [],
    // From render to main and back again
    invoke: [
        'getSaveVersion',

        'getTimeDiffInSeconds',
        'getTimeTillDueDate',
        'getExactDueDate',

        'getSavedData',
        'getCachedData',
        
        'writeSavedData',

        'getDebugMode',
        'getAppStatus',

        'getSelfFromCanvas',
        'getSecureText',

        'showMessageDialog',

        'getAssignmentsNotToRemind',
        'getAssignmentsWithNoSubmissions',
        'getAssignmentSubmittedTypes'
    ],
}

const API = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send: (channel: string, ...args: any[]) => {
        const validChannels = channels.send;
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, args);
        }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receive: (channel: string, listener: (...args: any[]) => unknown) => {
        const validChannels = channels.receive;
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => listener(...args));
        }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoke: (channel: string, ...args: any[]) => {
        const validChannels = channels.invoke;
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
    },

    util: {
        sleep: (time_in_ms: number) => ipcRenderer.invoke('util:sleep', time_in_ms)
    },
    openLink: (url: string) => ipcRenderer.send('openLink', url),
    updateData: (type: string, data: object | null) => ipcRenderer.send('updateData', type, data),
    onUpdateData: (callback: UpdateDataCallback) => ipcRenderer.on('updateData', (_event, type: string, data: object | null) => callback(type, data)),
    keyPress: (key: string) => ipcRenderer.send('keyPress', key),
    getDebugMode: () => ipcRenderer.invoke('getDebugMode'),
    onSendAppStatus: (callback: (status: string) => void) => ipcRenderer.on('sendAppStatus', (_event, status: string) => callback(status)),
    sendAppStatus: (status: string, data?: object) => ipcRenderer.send('sendAppStatus', status, data ?? null), 
    saveSecureText: (key: string, text: string) => ipcRenderer.send('saveSecureText', key, text),
    disableAssignmentReminder: (assignment: Assignment) => ipcRenderer.send('disableAssignmentReminder', assignment),
    enableAssignmentReminder: (assignment: Assignment) => ipcRenderer.send('enableAssignmentReminder', assignment),
    onSendDownloadProgress: (callback: (status: string, percent: number) => void) => ipcRenderer.on('sendDownloadProgress', (_event, status: string, percent: number) => callback(status, percent)),
    onRemoveProgressBarTextLink: (callback: () => void) => ipcRenderer.on('removeProgressBarTextLink', () => callback()),
    launchUpdaterDialog: (type: string) => ipcRenderer.send('launchUpdaterDialog', type),
    onContextMenuCommand: (callback: (command: string, data: ContextMenuCommandParams) => void) => ipcRenderer.on('context-menu-command', (_event, command: string, data: ContextMenuCommandParams) => callback(command, data)),
    showContextMenu: (type: string, data: ContextMenuParams) => ipcRenderer.send('show-context-menu', type, data),
    addAssignmentMarkedAsSubmitted: (assignment: Assignment) => ipcRenderer.send('mark-assignment-submit', assignment),
    addAssignmentMarkedAsUnsubmitted: (assignment: Assignment) => ipcRenderer.send('mark-assignment-unsubmit', assignment),
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

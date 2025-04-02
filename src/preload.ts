import { contextBridge, ipcRenderer } from "electron";

import { ContextMenuCommandParams } from "./interfaces/contextMenuParams";

type Channels = {
    send: string[],
    receive: string[],
    invoke: string[],
}

const channels: Channels = {
    // From render to main
    send: [
        'openLink',
        'updateData',
        'keyPress',

        'sendAppStatus',
        'saveSecureText',

        'disableAssignmentReminder',
        'enableAssignmentReminder',

        'launchUpdaterDialog',
        'showContextMenu',

        'addAssignmentMarkedAsSubmitted',
        'addAssignmentMarkedAsUnsubmitted'

    ],
    // From main to render
    receive: [
        'updateData',

    ],
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
        'getAssignmentSubmittedTypes',

        'util:sleep'
    ],
}

const API = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send: (channel: string, ...args: any[]) => {
        const validChannels = channels.send;
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, ...args);
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
    
    onSendDownloadProgress: (callback: (status: string, percent: number) => void) => ipcRenderer.on('sendDownloadProgress', (_event, status: string, percent: number) => callback(status, percent)),
    onContextMenuCommand: (callback: (command: string, data: ContextMenuCommandParams) => void) => ipcRenderer.on('context-menu-command', (_event, command: string, data: ContextMenuCommandParams) => callback(command, data)),
    onRemoveProgressBarTextLink: (callback: () => void) => ipcRenderer.on('removeProgressBarTextLink', () => callback()),
    onSendAppStatus: (callback: (status: string) => void) => ipcRenderer.on('sendAppStatus', (_event, status: string) => callback(status)),
}

contextBridge.exposeInMainWorld("api", API);

document.addEventListener('keydown', (event: KeyboardEvent) => {
    switch (event.key) {
        case 'F1':
            API.send('keyPress', 'F1');
            break;

        case 'F5':
            API.send('keyPress', 'F5');
            break;

        case 'F11':
            API.send('keyPress', 'F11');
            break;

        case 'F12':
            API.send('keyPress', 'F12');
            break;
    
        default:
            break;
    }
});

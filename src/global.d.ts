import { Assignment } from "./shared/interfaces/classData"
import { ContextMenuCommandParams, ContextMenuParams } from "./shared/interfaces/contextMenuParams"

export interface IElectronAPI {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send: (channel: string, ...args: any[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receive: (channel: string, listener: (...args: any[]) => unknown) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoke: (channel: string, ...args: any[]) => any,

    util: {
        sleep: (time_in_ms: number) => Promise<void>
    },
    openLink: (url: string) => void,
    updateData: UpdateDataCallback,
    onUpdateData: (callback: UpdateDataCallback) => void,
    keyPress: (key: string) => void,
    onSendAppStatus: (callback: (status: string) => void) => void,
    sendAppStatus: (status: string, data?: object) => void,
    saveSecureText: (key: string, text: string) => void,
    disableAssignmentReminder: (assignment: Assignment) => void,
    enableAssignmentReminder: (assignment: Assignment) => void,
    onSendDownloadProgress: (callback: (status: string, percent: number) => void) => void,
    onRemoveProgressBarTextLink: (callback: () => void) => void,
    launchUpdaterDialog: (type: string) => void,
    onContextMenuCommand: (callback: (command: string, data: ContextMenuCommandParams) => void) => void,
    showContextMenu: (type: string, data: ContextMenuParams) => void,
    addAssignmentMarkedAsSubmitted: (assignment: Assignment) => void,
    addAssignmentMarkedAsUnsubmitted: (assignment: Assignment) => void,
}

declare global {
    interface Window {
        api: IElectronAPI
    }

    // eslint-disable-next-line
    var __baseDir: string
}
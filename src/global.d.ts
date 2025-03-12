import { Assignment } from "./shared/interfaces/classData"
import { ContextMenuCommandParams, ContextMenuParams } from "./shared/interfaces/contextMenuParams"

export interface IElectronAPI {
    util: {
        sleep: (time_in_ms: number) => Promise<void>,
    },
    getTimeDiffInSeconds: (date1: Date, date2: Date) => Promise<number>,
    openLink: (url: string) => void,
    showMessageDialog: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>
    writeSavedData: (filename: string, data: object) => Promise<boolean>,
    getSavedData: (filename: string) => Promise<object | null>,
    getCachedData: (filename: string) => Promise<object | null>,
    updateData: UpdateDataCallback,
    onUpdateData: (callback: UpdateDataCallback) => void,
    keyPress: (key: string) => void,
    getDebugMode: () => Promise<object>,
    onSendAppStatus: (callback: (status: string) => void) => void,
    sendAppStatus: (status: string, data?: object) => void, 
    getAppStatus: () => Promise<object>,
    getSelfFromCanvas: (baseUrl: string, apiToken: string) => Promise<object>,
    saveSecureText: (key: string, text: string) => void,
    getSecureText: (key: string) => Promise<string | null>,
    disableAssignmentReminder: (assignment: Assignment) => void,
    enableAssignmentReminder: (assignment: Assignment) => void,
    getAssignmentsNotToRemind: () => Promise<Assignment[]>,
    getAssignmentsWithNoSubmissions: () => Promise<Assignment[]>,
    onSendDownloadProgress: (callback: (status: string, percent: number) => void) => void,
    onRemoveProgressBarTextLink: (callback: () => void) => void,
    launchUpdaterDialog: (type: string) => void,
    onContextMenuCommand: (callback: (command: string, data: ContextMenuCommandParams) => void) => void,
    showContextMenu: (type: string, data: ContextMenuParams) => void,
    addAssignmentMarkedAsSubmitted: (assignment: Assignment) => void,
    addAssignmentMarkedAsUnsubmitted: (assignment: Assignment) => void,
    getAssignmentSubmittedTypes: () => Promise<object[]>
}

declare global {
    interface Window {
        api: IElectronAPI
    }

    // eslint-disable-next-line
    var __baseDir: string
}
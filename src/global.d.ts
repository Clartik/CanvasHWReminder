import { Assignment } from "./shared/interfaces/classData"
import { ContextMenuCommandParams, ContextMenuParams } from "./shared/interfaces/contextMenuParams"

export interface IElectronAPI {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send: (channel: string, ...args: any[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receive: (channel: string, listener: (...args: any[]) => unknown) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoke: (channel: string, ...args: any[]) => any,
    
    onRemoveProgressBarTextLink: (callback: () => void) => void,
    onSendAppStatus: (callback: (status: string) => void) => void,
    onSendDownloadProgress: (callback: (status: string, percent: number) => void) => void,
    onContextMenuCommand: (callback: (command: string, data: ContextMenuCommandParams) => void) => void,
}

declare global {
    interface Window {
        api: IElectronAPI
    }

    // eslint-disable-next-line
    var __baseDir: string
}
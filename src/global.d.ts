export interface IElectronAPI {
    openLink: (url: string) => void,
    showMessageDialog: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>
    writeSavedData: (filename: string, data: Object) => Promise<boolean>,
    getSavedData: (filename: string) => Promise<Object | null>,
    getCachedData: (filename: string) => Promise<Object | null>,
    updateData: UpdateDataCallback,
    onUpdateData: (callback: UpdateDataCallback) => void,
    keyPress: (key: string) => void,
    getDebugMode: () => Promise<Object>,
    onSendAppStatus: (callback: (status: string) => void) => void,
    sendAppStatus: (status: string) => void, 
    getAppStatus: () => Promise<Object>,
    getSelfFromCanvas: (baseUrl: string, apiToken: string) => Promise<Object>
}

declare global {
    interface Window {
        api: IElectronAPI
    }

    var __baseDir: string
}
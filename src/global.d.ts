export interface IElectronAPI {
    openLink: (url: string) => void,
    showMessageDialog: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>
    writeSavedData: (filename: string, data: Object) => Promise<any>,
    getSavedData: (filename: string) => Promise<Object | null>,
    getLocalData: (filename: string) => Promise<Object | null>,
    getCachedData: (filename: string) => Promise<Object | null>,
    updateData: UpdateDataCallback,
    onUpdateData: (callback: UpdateDataCallback) => void,
    keyPress: (key: string) => void,
    getDebugMode: () => Promise<Object>
}

declare global {
    interface Window {
        api: IElectronAPI
    }
}
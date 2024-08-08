export interface IElectronAPI {
    getLocalData: (filename: string) => Promise<Object | null>,
    openLink: (url: string) => void,
    showMessageDialog: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>
    writeSavedData: (filename: string, data: Object) => Promise<any>,
    getSavedData: (filename: string) => Promise<Object | null>
}

declare global {
    interface Window {
        api: IElectronAPI
    }
}
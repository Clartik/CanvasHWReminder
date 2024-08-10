export interface IElectronAPI {
    openLink: (url: string) => void,
    showMessageDialog: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>
    writeSavedData: (filename: string, data: Object) => Promise<any>,
    getSavedData: (filename: string) => Promise<Object | null>,
    getLocalData: (filename: string) => Promise<Object | null>,
    savedSettings: () => void
}

declare global {
    interface Window {
        api: IElectronAPI
    }
}
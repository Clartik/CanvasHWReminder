export interface IElectronAPI {
    getJSONData: (filename: string) => Promise<any>,
    openLink: (url: string) => void,
    showMessageDialog: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>
    saveData: (filename: string, data: Object) => Promise<any>,
    readData: (filename: string) => Promise<Object | null>
}

declare global {
    interface Window {
        api: IElectronAPI
    }
}
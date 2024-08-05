export interface IElectronAPI {
    getJSONData: (filename: string) => Promise<any>,
    openLink: (url: string) => void,
    showMessageDialog: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>
}

declare global {
    interface Window {
        api: IElectronAPI
    }
}
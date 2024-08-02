export interface IElectronAPI {
    getJSONData: (filename: string) => Promise<any>,
    openLink: (url: string) => void
}

declare global {
    interface Window {
        api: IElectronAPI
    }
}
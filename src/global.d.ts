export interface IElectronAPI {
    getJSONData: (filename: string) => Promise<any>,
}

declare global {
    interface Window {
        api: IElectronAPI
    }
}
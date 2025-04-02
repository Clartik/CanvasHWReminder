export interface IElectronAPI {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    send: (channel: string, ...args: any[]) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receive: (channel: string, listener: (...args: any[]) => unknown) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoke: (channel: string, ...args: any[]) => any,
}

declare global {
    interface Window {
        api: IElectronAPI
    }

    // eslint-disable-next-line
    var __baseDir: string
}
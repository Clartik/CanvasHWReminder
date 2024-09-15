import { app, ipcMain } from "electron";

import AppInfo from '../interfaces/appInfo';
import AppStatus from "../../shared/interfaces/appStatus";
import DebugMode from "../../shared/interfaces/debugMode";
import SettingsData from "../../shared/interfaces/settingsData";
import IPCGetResult from "../../shared/interfaces/ipcGetResult";

import { startCheckCanvasWorker } from "../main";

import { Canvas } from "../util/canvasAPI/canvas";

import SaveManager from "../util/saveManager";
import { FetchError } from "node-fetch";

function handleFileRequests(appInfo: AppInfo, appStatus: AppStatus, debugMode: DebugMode) {
    ipcMain.handle('writeSavedData', async (event, filename: string, data: Object) => {
        console.log(`[Main]: Write Saved Data (${filename}) Event Was Handled!`);
        return await SaveManager.writeSavedData(filename, data);
    })
    
    ipcMain.handle('getSavedData', async (event: any, filename: string) => {
        console.log(`[Main]: Get Saved Data (${filename}) Event Was Handled!`)
        return await SaveManager.getSavedData(filename);
    });
    
    ipcMain.handle('getCachedData', (event, filename: string): Object | null => {
        console.log(`[Main]: Get Cached Data (${filename}) Event Was Handled!`)
    
        if (filename === 'classData') {
            return appInfo.classData;
        }
    
        if (filename === 'settingsData')
            return appInfo.settingsData ?? null;
    
        return null;
    });

    ipcMain.on('updateData', (event, type: string, data: Object | null) => {
        console.log(`[Main]: Update Data (${type}) Event Was Handled!`)
        
        if (type === 'settingsData') {
            appInfo.settingsData = data as SettingsData;

            app.setLoginItemSettings({
                openAtLogin: appInfo.settingsData?.launchOnStart
            });

            startCheckCanvasWorker();
        }
    });
    
    ipcMain.handle('getDebugMode', (event) => debugMode);
    ipcMain.handle('getAppStatus', (event) => appStatus);

    ipcMain.handle('getSelfFromCanvas', async (event, baseUrl: string, apiToken: string): Promise<IPCGetResult> => {
        const canvas = new Canvas(baseUrl, apiToken);

        try {
            const self = await canvas.getSelf();
            return { data: self };
        } catch (error) {
            console.error('[Main]: Failed to Get Self From Canvas Due to Invalid Canvas Credentials - ', error);
            return { data: null, error: 'INVALID CANVAS CREDENTIALS' };
        }
    });
}

export default handleFileRequests;
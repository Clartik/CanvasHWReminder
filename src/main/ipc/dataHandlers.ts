import { FetchError } from "node-fetch";
import * as keytar from 'keytar';

import { app, ipcMain } from "electron";

import AppInfo from '../interfaces/appInfo';
import AppStatus from "../../shared/interfaces/appStatus";
import DebugMode from "../../shared/interfaces/debugMode";
import SettingsData from "../../shared/interfaces/settingsData";
import IPCGetResult from "../../shared/interfaces/ipcGetResult";
import { APP_NAME } from "../../shared/constants";

import { startCheckCanvasWorker } from "../main";

import { Canvas } from "../util/canvasAPI/canvas";

import SaveManager from "../util/saveManager";
import { getSecureText } from "../util/dataUtil";

function getSenderHTMLFile(event: Electron.IpcMainInvokeEvent): string | undefined {
    const senderFileLocations = event.sender.getURL().split('/');
    const senderHTMLFilename = senderFileLocations.at(-1);
    return senderHTMLFilename;
}

function handleFileRequests(appInfo: AppInfo, appStatus: AppStatus, debugMode: DebugMode) {
    ipcMain.handle('writeSavedData', async (event, filename: string, data: Object) => {
        const senderHTMLFilename = getSenderHTMLFile(event);

        console.log(`[Main]: (${senderHTMLFilename}) Write Saved Data (${filename}) Event Was Handled!`);
        return await SaveManager.writeSavedData(filename, data);
    })
    
    ipcMain.handle('getSavedData', async (event: any, filename: string) => {
        const senderHTMLFilename = getSenderHTMLFile(event);

        console.log(`[Main]: (${senderHTMLFilename}) Get Saved Data (${filename}) Event Was Handled!`)
        return await SaveManager.getSavedData(filename);
    });
    
    ipcMain.handle('getCachedData', (event, filename: string): Object | null => {
        const senderHTMLFilename = getSenderHTMLFile(event);
        
        console.log(`[Main]: (${senderHTMLFilename}) Get Cached Data (${filename}) Event Was Handled!`)
    
        if (filename === 'classData') {
            return appInfo.classData;
        }
    
        if (filename === 'settingsData')
            return appInfo.settingsData ?? null;
    
        return null;
    });

    ipcMain.on('updateData', async (event, type: string, data: Object | null) => {
        const senderHTMLFilename = getSenderHTMLFile(event);

        console.log(`[Main]: (${senderHTMLFilename}) Update Data (${type}) Event Was Handled!`)
        
        if (type === 'settingsData') {
            appInfo.settingsData = data as SettingsData;

            app.setLoginItemSettings({
                openAtLogin: appInfo.settingsData?.launchOnStart
            });

            await startCheckCanvasWorker();
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

    ipcMain.on('saveSecureText', async (event, key: string, text: string) => {
        console.log(`[Main]: Using Secure Text to Save (${key})`);

        await keytar.setPassword(APP_NAME, key, text);
    });

    ipcMain.handle('getSecureText', async (event, key: string): Promise<string | null> => {
        return await getSecureText(key);
    });
}

export default handleFileRequests;
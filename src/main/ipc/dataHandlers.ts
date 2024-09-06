import { app, ipcMain } from "electron";

import AppInfo from '../interfaces/appInfo';
import AppStatus from "../../shared/interfaces/appStatus";
import DebugMode from "../../shared/interfaces/debugMode";
import SettingsData from "../../shared/interfaces/settingsData";

import { getSavedData, writeSavedData } from "../util/fileUtil";
import { startCheckCanvasWorker } from "../main";

function handleFileRequests(appInfo: AppInfo, appStatus: AppStatus, debugMode: DebugMode) {
    ipcMain.handle('writeSavedData', async (event, filename: string, data: Object) => {
        console.log(`[Main]: Write Saved Data (${filename}) Event Was Handled!`);
        return await writeSavedData(filename, data);
    })
    
    ipcMain.handle('getSavedData', async (event: any, filename: string) => {
        console.log(`[Main]: Get Saved Data (${filename}) Event Was Handled!`)
        return await getSavedData(filename);
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

    ipcMain.on('updateData', (event: Event, type: string, data: Object | null) => {
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
}

export default handleFileRequests;
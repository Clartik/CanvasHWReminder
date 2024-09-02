import { ipcMain } from "electron";

import AppInfo from '../interfaces/appInfo';
import DebugMode from "../interfaces/debugMode";

import { getSavedData, writeSavedData } from "../util/fileUtil";

function handleFileRequests(appInfo: AppInfo, debugMode: DebugMode) {
    ipcMain.handle('writeSavedData', async (event: any, filename: string, data: Object) => {
        console.log(`Write Saved Data (${filename}) Event Was Handled!`)
        return await writeSavedData(filename, data);
    })
    
    ipcMain.handle('getSavedData', async (event: any, filename: string) => {
        console.log(`Get Saved Data (${filename}) Event Was Handled!`)
        return await getSavedData(filename);
    });
    
    ipcMain.handle('getCachedData', (event: any, filename: string): Object | null => {
        console.log(`Get Cached Data (${filename}) Event Was Handled!`)
    
        if (filename === 'classData') {
            return appInfo.classData;
        }
    
        if (filename === 'settingsData')
            return appInfo.settingsData ?? null;
    
        return null;
    });

    ipcMain.on('updateData', (event: Event, type: string, data: Object | null) => {
        console.log(`Update Data (${type}) Event Was Handled!`)
        
        if (type === 'settingsData') {
            appInfo.settingsData = data as SettingsData;
        }
    });
    
    ipcMain.handle('getDebugMode', (event) => debugMode);
}

export default handleFileRequests;
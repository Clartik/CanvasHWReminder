import * as keytar from 'keytar';

import { ipcMain } from "electron";

import AppInfo from '../interfaces/appInfo';
import AppStatus from "../../shared/interfaces/appStatus";
import DebugMode from "../../shared/interfaces/debugMode";
import SettingsData from "../../shared/interfaces/settingsData";
import IPCGetResult from "../../shared/interfaces/ipcGetResult";
import { APP_NAME } from "../../shared/constants";

import { findNextAssignmentAndStartWorker, startCheckCanvasWorker } from "../main";

import { Canvas } from "../util/canvasAPI/canvas";

import SaveManager from "../util/saveManager";
import * as DataUtil from '../util/dataUtil';
import * as CourseUtil from '../util/courseUtil';

import { Assignment } from 'src/shared/interfaces/classData';

function getSenderHTMLFile(event: Electron.IpcMainInvokeEvent): string | undefined {
    const senderFileLocations = event.sender.getURL().split('/');
    const senderHTMLFilename = senderFileLocations.at(-1);
    return senderHTMLFilename;
}

function handleFileRequests(appInfo: AppInfo, appStatus: AppStatus, debugMode: DebugMode) {
    ipcMain.handle('writeSavedData', async (event, filename: string, data: object) => {
        const senderHTMLFilename = getSenderHTMLFile(event);

        console.log(`[Main]: (${senderHTMLFilename}) Write Saved Data (${filename}) Event Was Handled!`);
        return await SaveManager.writeSavedData(filename, data);
    })
    
    ipcMain.handle('getSavedData', async (event, filename: string) => {
        const senderHTMLFilename = getSenderHTMLFile(event);

        console.log(`[Main]: (${senderHTMLFilename}) Get Saved Data (${filename}) Event Was Handled!`)
        return await SaveManager.getSavedData(filename);
    });
    
    ipcMain.handle('getCachedData', (event, filename: string): object | null => {
        // const senderHTMLFilename = getSenderHTMLFile(event);
        // console.log(`[Main]: (${senderHTMLFilename}) Get Cached Data (${filename}) Event Was Handled!`)
    
        if (filename === 'classData') {
            return appInfo.classData;
        }
    
        if (filename === 'settingsData')
            return appInfo.settingsData ?? null;
    
        return null;
    });

    ipcMain.on('updateData', async (event, type: string, data: object | null) => {
        const senderHTMLFilename = getSenderHTMLFile(event);

        console.log(`[Main]: (${senderHTMLFilename}) Update Data (${type}) Event Was Handled!`)
        
        if (type === 'settingsData') {
            appInfo.settingsData = data as SettingsData;

            DataUtil.configureAppSettings(appInfo.settingsData);

            if (!appInfo.settingsData.dontRemindAssignmentsWithNoSubmissions) {
                appInfo.assignmentsWithNoSubmissions = [];
                console.log('[Main]: Cleared Any Assignments With No Submissions From Dont Remind List');
            }

            await startCheckCanvasWorker();
        }
    });
    
    ipcMain.handle('getDebugMode', () => debugMode);
    ipcMain.handle('getAppStatus', () => appStatus);

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
        return await DataUtil.getSecureText(key);
    });

    ipcMain.on('disableAssignmentReminder', (event, assignment: Assignment) => {
        for (let i = 0; i < appInfo.assignmentsToNotRemind.length; i++) {
            const assignmentToNotRemind = appInfo.assignmentsToNotRemind[i];
            
            if (assignment.id !== assignmentToNotRemind.id)
                continue;

            console.warn(`[Main]: Assignment (${assignment.name}) is Already in the Don't Remind List`);
            return;
        }

        appInfo.assignmentsToNotRemind.push(assignment)

        console.log(`[Main]: Added Assignment (${assignment.name}) To Don't Remind List`);
        console.log(`[Main]: Restarting Find Next Assignment Coroutine`);

        appInfo.nextAssignment = null;
        findNextAssignmentAndStartWorker();
    });

    ipcMain.on('enableAssignmentReminder', (event, assignment: Assignment) => {
        for (let i = 0; i < appInfo.assignmentsToNotRemind.length; i++) {
            const assignmentToNotRemind = appInfo.assignmentsToNotRemind[i];
            
            if (assignment.id !== assignmentToNotRemind.id)
                continue;

            appInfo.assignmentsToNotRemind.splice(i, 1);
            console.log(`[Main]: Removed Assignment (${assignment.name}) From Don't Remind List `);

            console.log(`[Main]: Restarting Find Next Assignment Coroutine`);
            findNextAssignmentAndStartWorker();

            return;
        }

        console.log(`[Main]: Could Not Remove Assignment (${assignment.name}) From Don't Remind List Because It Doesn't Exist!`);
    });

    ipcMain.handle('getAssignmentsNotToRemind', () => appInfo.assignmentsToNotRemind)
    ipcMain.handle('getAssignmentsWithNoSubmissions', () => appInfo.assignmentsWithNoSubmissions)
}

export default handleFileRequests;
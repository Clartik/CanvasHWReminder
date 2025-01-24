import * as keytar from 'keytar';

import { ipcMain } from "electron";

import AppInfo from '../interfaces/appInfo';
import AppStatus from "../../shared/interfaces/appStatus";
import DebugMode from "../../shared/interfaces/debugMode";
import SettingsData from "../../shared/interfaces/settingsData";
import IPCGetResult from "../../shared/interfaces/ipcGetResult";
import { APP_NAME, FILENAME_APP_INFO_SAVE_DATA_JSON } from "../../shared/constants";

import { findNextAssignmentAndStartWorker, startCheckCanvasWorker } from "../main";

import { Canvas } from "../util/canvasAPI/canvas";

import SaveManager from "../util/saveManager";
import * as DataUtil from '../util/dataUtil';
import * as CourseUtil from '../util/courseUtil';

import { Assignment } from 'src/shared/interfaces/classData';
import AppInfoSaveData from '../interfaces/appInfoData';

import * as mainLog from 'electron-log';

function getSenderHTMLFile(event: Electron.IpcMainInvokeEvent): string | undefined {
    const senderFileLocations = event.sender.getURL().split('/');
    const senderHTMLFilename = senderFileLocations.at(-1);
    return senderHTMLFilename;
}

function handleFileRequests(appInfo: AppInfo, appStatus: AppStatus, debugMode: DebugMode) {
    ipcMain.handle('writeSavedData', async (event, filename: string, data: object) => {
        // const senderHTMLFilename = getSenderHTMLFile(event);
        // electronLog.log(`[Main]: (${senderHTMLFilename}) Write Saved Data (${filename}) Event Was Handled!`);

        return await SaveManager.writeSavedData(filename, data);
    })
    
    ipcMain.handle('getSavedData', async (event, filename: string) => {
        // const senderHTMLFilename = getSenderHTMLFile(event);
        // electronLog.log(`[Main]: (${senderHTMLFilename}) Get Saved Data (${filename}) Event Was Handled!`)

        return await SaveManager.getSavedData(filename);
    });
    
    ipcMain.handle('getCachedData', (event, filename: string): object | null => {
        // const senderHTMLFilename = getSenderHTMLFile(event);
        // electronLog.log(`[Main]: (${senderHTMLFilename}) Get Cached Data (${filename}) Event Was Handled!`)
    
        if (filename === 'classData') {
            return appInfo.classData;
        }
    
        if (filename === 'settingsData')
            return appInfo.settingsData ?? null;
    
        return null;
    });

    ipcMain.on('updateData', async (event, type: string, data: object | null) => {
        const senderHTMLFilename = getSenderHTMLFile(event);

        mainLog.log(`[Main]: (${senderHTMLFilename}) Update Data (${type}) Event Was Handled!`)
        
        if (type === 'settingsData') {
            const oldSettingsData = appInfo.settingsData;
            appInfo.settingsData = data as SettingsData;

            DataUtil.configureAppSettings(appInfo.settingsData);

            if (oldSettingsData?.whenToRemindTimeValue != appInfo.settingsData.whenToRemindTimeValue ||
                oldSettingsData?.whenToRemindFormatValue != appInfo.settingsData.whenToRemindFormatValue) 
            {
                mainLog.log('[Main]: Resetting AssignmentsThatHaveBeenReminded and Saving It Due to Settings Change');

                const appInfoSaveData = await SaveManager.getSavedData(FILENAME_APP_INFO_SAVE_DATA_JSON) as AppInfoSaveData;

                appInfoSaveData.assignmentsThatHaveBeenReminded = [];
                appInfo.assignmentsThatHaveBeenReminded = [];

                SaveManager.writeSavedData(FILENAME_APP_INFO_SAVE_DATA_JSON, appInfoSaveData);
            }

            if (!appInfo.settingsData.dontRemindAssignmentsWithNoSubmissions) {
                appInfo.assignmentsWithNoSubmissions = [];
                mainLog.log('[Main]: Cleared Any Assignments With No Submissions From Dont Remind List');
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
            mainLog.error('[Main]: Failed to Get Self From Canvas Due to Invalid Canvas Credentials - ', error);
            return { data: null, error: 'INVALID CANVAS CREDENTIALS' };
        }
    });

    ipcMain.on('saveSecureText', async (event, key: string, text: string) => {
        mainLog.log(`[Main]: Using Secure Text to Save (${key})`);

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

            mainLog.warn(`[Main]: Assignment (${assignment.name}) is Already in the Don't Remind List`);
            return;
        }

        appInfo.assignmentsToNotRemind.push(assignment)

        mainLog.log(`[Main]: Added Assignment (${assignment.name}) To Don't Remind List`);
        mainLog.log(`[Main]: Restarting Find Next Assignment Coroutine`);

        appInfo.nextAssignment = null;
        findNextAssignmentAndStartWorker();
    });

    ipcMain.on('enableAssignmentReminder', (event, assignment: Assignment) => {
        for (let i = 0; i < appInfo.assignmentsToNotRemind.length; i++) {
            const assignmentToNotRemind = appInfo.assignmentsToNotRemind[i];
            
            if (assignment.id !== assignmentToNotRemind.id)
                continue;

            appInfo.assignmentsToNotRemind.splice(i, 1);
            mainLog.log(`[Main]: Removed Assignment (${assignment.name}) From Don't Remind List `);

            mainLog.log(`[Main]: Restarting Find Next Assignment Coroutine`);
            findNextAssignmentAndStartWorker();

            return;
        }

        mainLog.error(`[Main]: Could Not Remove Assignment (${assignment.name}) From Don't Remind List Because It Doesn't Exist!`);
    });

    ipcMain.handle('getAssignmentsNotToRemind', () => appInfo.assignmentsToNotRemind)
    ipcMain.handle('getAssignmentsWithNoSubmissions', () => appInfo.assignmentsWithNoSubmissions)

    ipcMain.on('mark-assignment-submit', async (event, assignment: Assignment) => {
        // is_submitted_filter is set to false because it needs to filter all assignments that aren't marked as submitted
        const index = CourseUtil.getIndexOfAssignmentFromAssignmentSubmittedTypes(appInfo.assignmentSubmittedTypes, assignment, false);
        const does_assignment_exist = index !== -1;

        if (does_assignment_exist) {
            if (assignment.is_submitted) {
                appInfo.assignmentSubmittedTypes.splice(index, 1);
                mainLog.debug('[Main]: Deleting Saved Assignment Submitted Type')
            }
            else {
                appInfo.assignmentSubmittedTypes[index].mark_as_submitted = true;
                mainLog.debug('[Main]: Modifying Saved Assignment Submitted Type to Be Submitted')
            }
        } else {
            if (!assignment.is_submitted) {
                appInfo.assignmentSubmittedTypes.push({
                    assignment: assignment,
                    mark_as_submitted: true
                });
                mainLog.debug('[Main]: Adding a New Assignment Submitted Type as Submitted')
            }
        }

        await DataUtil.saveAssignmentSubmittedTypes(appInfo.assignmentSubmittedTypes);
    });

    ipcMain.on('mark-assignment-unsubmit', async (event, assignment: Assignment) => {
        const index = CourseUtil.getIndexOfAssignmentFromAssignmentSubmittedTypes(appInfo.assignmentSubmittedTypes, assignment, true);
        const does_assignment_exist = index !== -1;

        if (does_assignment_exist) {
            if (!assignment.is_submitted) {
                appInfo.assignmentSubmittedTypes.splice(index, 1);
                mainLog.debug('[Main]: Deleting Saved Assignment Submitted Type')
            }
            else {
                appInfo.assignmentSubmittedTypes[index].mark_as_submitted = false;
                mainLog.debug('[Main]: Modifying Saved Assignment Submitted Type to Be Unsubmitted')
            }
        } else {
            if (assignment.is_submitted) {
                appInfo.assignmentSubmittedTypes.push({
                    assignment: assignment,
                    mark_as_submitted: false
                });
                mainLog.debug('[Main]: Adding a New Assignment Submitted Type as Unsubmitted')
            }
        }

        await DataUtil.saveAssignmentSubmittedTypes(appInfo.assignmentSubmittedTypes);
    });

    ipcMain.handle('get-assignment-submitted-types', () => appInfo.assignmentSubmittedTypes);
}

export default handleFileRequests;
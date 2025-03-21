import * as keytar from 'keytar';

import AppInfo from '../../interfaces/appInfo';
import DebugMode from "../../interfaces/debugMode";

import { Assignment, ClassData } from "../../interfaces/classData";
import SettingsData from "../../interfaces/settingsData";
import { APP_NAME, FILENAME_APP_INFO_SAVE_DATA_JSON, FILENAME_SETTINGS_DATA_JSON } from "../../constants";

import * as CanvasUtil from './canvasUtil'

import { updateClassData } from '../main';
import { FILENAME_CLASS_DATA_JSON, SETTINGS_DATA_VERSION, APP_INFO_SAVE_DATA_VERSION } from '../../constants';

import SaveManager from './saveManager';
import { app } from 'electron';

import AppInfoSaveData from '../../interfaces/appInfoData';

import * as mainLog from 'electron-log';
import AssignmentSubmittedType from '../../interfaces/assignmentSubmittedType';

function getDefaultSettingsData(): SettingsData {
	return {
		version: SETTINGS_DATA_VERSION,

        whenToRemindTimeValue: '6',
        whenToRemindFormatValue: 'hour',
        howLongPastDueTimeValue: '1',
        howLongPastDueFormatValue: 'hour',

        launchOnStart: true,
        minimizeOnLaunch: true,
        minimizeOnClose: true,

        showExactDueDate: false,
        alwaysExpandAllCourseCards: false,

		dontRemindAssignmentsWithNoSubmissions: false,

        silenceNotifications: false,
        keepNotificationsOnScreen: true,

		autoMarkSubmissions: false
	}
}

function getDefaultAppInfoSaveData(): AppInfoSaveData {
	return {
		version: APP_INFO_SAVE_DATA_VERSION,

		assignmentsThatHaveBeenReminded: [],
    	assignmentsNotToRemind: [],
    	assignmentSubmittedTypes: []
	}
}

async function getSecureText(key: string): Promise<string | null> {
	return await keytar.getPassword(APP_NAME, key);
}

async function getSavedClassData(): Promise<ClassData | null> {
	try {
		const classData = await SaveManager.getData('classes-data.json') as ClassData;
		return classData;
	} catch (error) {
		mainLog.error('Could Not Retrieve ClassData: ' + error)
		return null;
	}
}

async function getSavedSettingsData(): Promise<SettingsData | null> {
	try {
		const savedSettingsData = await SaveManager.getData('settings-data.json') as SettingsData;

		if (savedSettingsData.version < SETTINGS_DATA_VERSION) {
			mainLog.warn(`[Main]: Saved Settings Has Old Version! (${savedSettingsData.version})`)

			const upgradedSettingsData = await upgradeSettingsData(savedSettingsData);
			return upgradedSettingsData;
		}

		mainLog.log('[Main]: Cached Settings Data is Updated!');
		
		return savedSettingsData;
	} catch (error) {
		mainLog.error('[Main]: Could Not Retrieve Saved SettingsData: ' + error);
		return null;
	}
}

async function upgradeSettingsData(savedSettingsData: SettingsData): Promise<SettingsData> {
	const defaultSettingsData: SettingsData = getDefaultSettingsData();

	const upgradedSettingsData: SettingsData = { ...defaultSettingsData, ...savedSettingsData };
	upgradedSettingsData.version = SETTINGS_DATA_VERSION;

	mainLog.log(`[Main]: Upgraded Saved Settings Data to Latest Version! (${upgradedSettingsData.version})`);
	await SaveManager.saveData(FILENAME_SETTINGS_DATA_JSON, upgradedSettingsData);

	return upgradedSettingsData;
}

async function upgradeAppInfoSaveData(savedAppInfoSaveData: AppInfoSaveData): Promise<AppInfoSaveData> {
	const defaultAppInfoSaveData: AppInfoSaveData = getDefaultAppInfoSaveData();

	const upgradedAppInfoSaveData: AppInfoSaveData = { ...defaultAppInfoSaveData, ...savedAppInfoSaveData };
	upgradedAppInfoSaveData.version = APP_INFO_SAVE_DATA_VERSION;

	mainLog.log(`[Main]: Upgraded Saved App Info Save Data to Latest Version! (${upgradedAppInfoSaveData.version})`);
	await SaveManager.saveData(FILENAME_APP_INFO_SAVE_DATA_JSON, upgradedAppInfoSaveData);

	return upgradedAppInfoSaveData;
}

async function getAppInfoSaveData(): Promise<AppInfoSaveData | null> {
	try {
		const savedAppInfoSaveData = await SaveManager.getData(FILENAME_APP_INFO_SAVE_DATA_JSON) as AppInfoSaveData;

		if (savedAppInfoSaveData.version < APP_INFO_SAVE_DATA_VERSION) {
			mainLog.warn(`[Main]: Saved App Info Save Data Has Old Version! (${savedAppInfoSaveData.version})`)

			const upgradedAppInfoSaveData = await upgradeAppInfoSaveData(savedAppInfoSaveData);
			return upgradedAppInfoSaveData;
		}

		mainLog.log('[Main]: App Info Save Data is Loaded!');
		
		return savedAppInfoSaveData;
	} catch (error) {
		mainLog.error('[Main]: Could Not Retrieve Saved App Info Data: ' + error);
		return null;
	}
}

async function getSaveData(filename: string): Promise<object | null> {
	try {
		const savedData: object = await SaveManager.getData(filename);

		mainLog.log(`[Main]: Loaded Saved Data (${filename})`)

		return savedData;
	} catch (error) {
		mainLog.error(`[Main]: Could Not Retrieve Saved Data (${filename}): ` + error)
		return null;
	}
}

function cleanUpUnnecessarySavedAssignmentsAccordingToDueDate(assignments: Assignment[]): Assignment[] {
	const assignmentIndicesToBeRemoved: number[] = [];

	for (let i = 0; i < assignments.length; i++) {
		const assignment = assignments[i];
		
		if (!assignment.due_at)
			continue;

		const assignmentDueDate = new Date(assignment.due_at);
		const todayDate = new Date();

		if (assignmentDueDate > todayDate)
			continue;

		mainLog.log(`[Main]: Deleting Expired Saved Assignment (${assignment.name})`);

		assignmentIndicesToBeRemoved.push(i);
	}

	// Need for the double step because if assignments was purged in loop above, the location of each element would keep changing
	// This way, it identifies all assignments and removes them accordingly
	for (const assignmentIndex of assignmentIndicesToBeRemoved) {
		assignments.splice(assignmentIndex, 1);
	}

	return assignments;
}

function cleanUpUnnecessarySavedAssignmentSubmittedTypes(assignmentSubmittedTypes: AssignmentSubmittedType[]): AssignmentSubmittedType[] {
	const assignmentIndicesToBeRemoved: number[] = [];

	for (let i = 0; i < assignmentSubmittedTypes.length; i++) {
		const assignment = assignmentSubmittedTypes[i].assignment;
		
		if (!assignment.due_at)
			continue;

		const assignmentDueDate = new Date(assignment.due_at);
		const todayDate = new Date();

		if (assignmentDueDate > todayDate)
			continue;

		mainLog.log(`[Main]: Deleting Expired Saved Assignment Submitted Type (${assignment.name})`);

		assignmentIndicesToBeRemoved.push(i);
	}

	// Need for the double step because if assignments was purged in loop above, the location of each element would keep changing
	// This way, it identifies all assignments and removes them accordingly
	for (const assignmentIndex of assignmentIndicesToBeRemoved) {
		assignmentSubmittedTypes.splice(assignmentIndex, 1);
	}

	return assignmentSubmittedTypes;
}

async function reloadSettingsData(appInfo: AppInfo, debugMode: DebugMode) {
	if (!debugMode.devKeybinds)
		return;

	mainLog.log('[DEBUG MODE]: Reloading Settings Data!');
	appInfo.settingsData = await getSavedSettingsData();
}

async function reloadClassData(appInfo: AppInfo, debugMode: DebugMode) {
	if (!debugMode.devKeybinds)
		return;

	mainLog.log('[DEBUG MODE]: Reloading Class Data!');

	let classData: ClassData | null = null;

	if (debugMode.useLocalClassData) {
		classData = await SaveManager.getData(FILENAME_CLASS_DATA_JSON) as ClassData;
	}
	else {
		if (!appInfo.settingsData)
			return;

		try {
			const canvasBaseURL: string | null = await getSecureText('CanvasBaseURL');
			const canvasAPIToken: string | null = await getSecureText('CanvasAPIToken');

			if (!canvasBaseURL || !canvasAPIToken) {
				mainLog.error('[DEBUG MODE]: Canvas Credentials are NULL!');				
                throw Error;
			}

			const courses = await CanvasUtil.getCoursesFromCanvas(canvasBaseURL, canvasAPIToken);
			classData = await CanvasUtil.convertToClassData(courses);
        } catch (error) {
            mainLog.error('[DEBUG MODE]: Failed to Get Class Data From Canvas: ', error);
        }
	}
	
	await updateClassData(classData);
}

function configureAppSettings(settingsData: SettingsData) {
	app.setLoginItemSettings({
		openAtLogin: settingsData.launchOnStart
	});

	mainLog.log('[Main]: Configured App to Launch on System Bootup');
}

async function saveAssignmentSubmittedTypes(assignmentSubmittedTypes: AssignmentSubmittedType[]) {
	const appInfoSaveData = await SaveManager.getData(FILENAME_APP_INFO_SAVE_DATA_JSON) as AppInfoSaveData;

	appInfoSaveData.assignmentSubmittedTypes = assignmentSubmittedTypes;
	SaveManager.saveData(FILENAME_APP_INFO_SAVE_DATA_JSON, appInfoSaveData);
}

export { 
	getSavedClassData, getSavedSettingsData, reloadClassData, reloadSettingsData, getSecureText, 
	configureAppSettings, getAppInfoSaveData, cleanUpUnnecessarySavedAssignmentsAccordingToDueDate,
	saveAssignmentSubmittedTypes, cleanUpUnnecessarySavedAssignmentSubmittedTypes, upgradeAppInfoSaveData,
	getSaveData
 }
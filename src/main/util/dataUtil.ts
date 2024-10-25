import * as keytar from 'keytar';

import AppInfo from '../interfaces/appInfo';
import DebugMode from "../../shared/interfaces/debugMode";

import { Assignment, ClassData } from "../../shared/interfaces/classData";
import SettingsData from "../../shared/interfaces/settingsData";
import { APP_NAME, FILENAME_APP_INFO_SAVE_DATA_JSON, FILENAME_SETTINGS_DATA_JSON } from "../../shared/constants";

import * as CanvasUtil from './canvasUtil'

import { updateClassData } from '../main';
import { FILENAME_CLASS_DATA_JSON, SETTINGS_DATA_VERSION } from '../../shared/constants';

import SaveManager from './saveManager';
import { app } from 'electron';

import AppInfoSaveData from '../interfaces/appInfoData';

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
        keepNotificationsOnScreen: true
	}
}

async function getSecureText(key: string): Promise<string | null> {
	return await keytar.getPassword(APP_NAME, key);
}

async function getSavedClassData(): Promise<ClassData | null> {
	try {
		const classData = await SaveManager.getSavedData('classes-data.json') as ClassData;
		return classData;
	} catch (error) {
		console.error('Could Not Retrieve ClassData: ' + error)
		return null;
	}
}

async function getSavedSettingsData(): Promise<SettingsData | null> {
	try {
		const savedSettingsData = await SaveManager.getSavedData('settings-data.json') as SettingsData;

		if (savedSettingsData.version < SETTINGS_DATA_VERSION) {
			console.warn(`[Main]: Saved Settings Has Old Version! (${savedSettingsData.version})`)

			const upgradedSettingsData = await upgradeSettingsData(savedSettingsData);
			return upgradedSettingsData;
		}

		console.log('[Main]: Cached Settings Data is Updated!');
		
		return savedSettingsData;
	} catch (error) {
		console.error('[Main]: Could Not Retrieve Saved SettingsData: ' + error);
		return null;
	}
}

async function upgradeSettingsData(savedSettingsData: SettingsData): Promise<SettingsData> {
	const defaultSettingsData: SettingsData = getDefaultSettingsData();

	const upgradedSettingsData: SettingsData = { ...defaultSettingsData, ...savedSettingsData };
	upgradedSettingsData.version = SETTINGS_DATA_VERSION;

	console.log(`[Main]: Upgraded Saved Settings Data to Latest Version! (${upgradedSettingsData.version})`);
	await SaveManager.writeSavedData(FILENAME_SETTINGS_DATA_JSON, upgradedSettingsData);

	return upgradedSettingsData;
}

async function getAppInfoSaveData(): Promise<AppInfoSaveData | null> {
	try {
		const appInfoSaveData = await SaveManager.getSavedData(FILENAME_APP_INFO_SAVE_DATA_JSON) as AppInfoSaveData;

		console.log('[Main]: App Info Save Data is Loaded!');
		
		return appInfoSaveData;
	} catch (error) {
		console.error('[Main]: Could Not Retrieve Saved App Info Data: ' + error);
		return null;
	}
}

function cleanUpUnnecessarySavedAssignmentsAccordingToDueDate(assignments: Assignment[]): Assignment[] {
	const assignmentIndexsToBeRemoved: number[] = [];

	for (let i = 0; i < assignments.length; i++) {
		const assignment = assignments[i];
		
		if (!assignment.due_at)
			continue;

		const assignmentDueDate = new Date(assignment.due_at);
		const todayDate = new Date();

		if (assignmentDueDate > todayDate)
			continue;

		console.log(`[Main]: Deleting Expired Assignment Not To Remind (${assignment.name})`);

		assignmentIndexsToBeRemoved.push(i);
	}

	// Need for the double step because if assignments was purged in loop above, the location of each element would keep changing
	// This way, it identifies all assignments and removes them accordingly
	for (const assignmentIndex of assignmentIndexsToBeRemoved) {
		assignments.splice(assignmentIndex, 1);
	}

	return assignments;
}

async function reloadSettingsData(appInfo: AppInfo, debugMode: DebugMode) {
	if (!debugMode.devKeybinds)
		return;

	console.log('[DEBUG MODE]: Reloading Settings Data!');
	appInfo.settingsData = await getSavedSettingsData();
}

async function reloadClassData(appInfo: AppInfo, debugMode: DebugMode) {
	if (!debugMode.devKeybinds)
		return;

	console.log('[DEBUG MODE]: Reloading Class Data!');

	let classData: ClassData | null = null;

	if (debugMode.useLocalClassData) {
		classData = await SaveManager.getSavedData(FILENAME_CLASS_DATA_JSON) as ClassData;
	}
	else {
		if (!appInfo.settingsData)
			return;

		try {
			const canvasBaseURL: string | null = await getSecureText('CanvasBaseURL');
			const canvasAPIToken: string | null = await getSecureText('CanvasAPIToken');

			if (!canvasBaseURL || !canvasAPIToken) {
				console.error('[DEBUG MODE]: Canvas Credentials are NULL!');				
                throw Error;
			}

			const courses = await CanvasUtil.getCoursesFromCanvas(canvasBaseURL, canvasAPIToken);
			classData = await CanvasUtil.convertToClassData(courses);
        } catch (error) {
            console.error('[DEBUG MODE]: Failed to Get Class Data From Canvas: ', error);
        }
	}
	
	await updateClassData(classData);
}

function configureAppSettings(settingsData: SettingsData) {
	app.setLoginItemSettings({
		openAtLogin: settingsData.launchOnStart
	});

	console.log('[Main]: Configured App to Launch on System Bootup');
}

export { getSavedClassData, getSavedSettingsData, reloadClassData, reloadSettingsData, getSecureText, 
	configureAppSettings, getAppInfoSaveData, cleanUpUnnecessarySavedAssignmentsAccordingToDueDate }
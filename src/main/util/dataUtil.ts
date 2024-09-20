import * as keytar from 'keytar';

import AppInfo from '../interfaces/appInfo';
import DebugMode from "../../shared/interfaces/debugMode";

import { ClassData } from "../../shared/interfaces/classData";
import SettingsData from "../../shared/interfaces/settingsData";
import { APP_NAME } from "../../shared/constants";

import * as CanvasUtil from './canvasUtil'

import { updateClassData } from '../main';
import { FILENAME_CLASS_DATA_JSON } from '../../shared/constants';

import SaveManager from './saveManager';

function getDefaultSettingsData(): SettingsData {
	return {
		version: '0.3',

		// canvasBaseURL: '',
		// canvasAPIToken: '',
		whenToRemindTimeValue: '6',
		whenToRemindFormatValue: 'hour',
		howLongPastDueTimeValue: '30',
		howLongPastDueFormatValue: 'minute',
		
		launchOnStart: false,
		minimizeOnLaunch: false,
		minimizeOnClose: true,

		showExactDueDate: false,
		alwaysExpandAllCourseCards: false,
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
	const defaultSettingsData: SettingsData = getDefaultSettingsData();

	try {
		const savedSettingsData = await SaveManager.getSavedData('settings-data.json') as SettingsData;

		if (savedSettingsData.version >= defaultSettingsData.version)
			console.warn('[Main]: Saved Settings Has New Version!')
		else
			console.warn('[Main]: Saved Settings Has Old Version!')

		// const settingsData: SettingsData = { ...defaultSettingsData, ...savedSettingsData };
		console.log('[Main]: Cached Settings Data is Updated!');
		
		return savedSettingsData;
	} catch (error) {
		console.error('[Main]: Could Not Retrieve Saved SettingsData, Resorting to Default SettingsData: ' + error);
		return null;
	}
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
            console.error('[DEBUG MODE]: Failed to Get Class Data From Canvas -', error);
        }
	}
	
	await updateClassData(classData);
}

export { getDefaultSettingsData, getSavedClassData, getSavedSettingsData, reloadClassData, reloadSettingsData, getSecureText }
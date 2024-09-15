import AppInfo from '../interfaces/appInfo';
import DebugMode from "../../shared/interfaces/debugMode";

import { ClassData } from "../../shared/interfaces/classData";
import SettingsData from "../../shared/interfaces/settingsData";

import * as CanvasUtil from './canvasUtil'

import { updateClassData } from '../main';
import { FILENAME_CLASS_DATA_JSON } from '../../shared/constants';

import SaveManager from './saveManager';

function getDefaultSettingsData(): SettingsData {
	return {
		version: '0.2',

		canvasBaseURL: '',
		canvasAPIToken: '',
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

async function getSavedClassData(): Promise<ClassData | null> {
	try {
		const classData = await SaveManager.getSavedData('classes-data.json') as ClassData;
		return classData;
	} catch (error) {
		console.error('Could Not Retrieve ClassData: ' + error)
		return null;
	}
}

async function getSavedSettingsData(): Promise<SettingsData> {
	const defaultSettingsData: SettingsData = getDefaultSettingsData();

	try {
		const savedSettingsData = await SaveManager.getSavedData('settings-data.json') as SettingsData;

		if (savedSettingsData.version !== defaultSettingsData.version)
			console.warn('[Main]: Saved Settings Has New Version!')

		const settingsData: SettingsData = { ...defaultSettingsData, ...savedSettingsData };

		console.log('[Main]: Settings Data is Loaded!');
		
		return settingsData;
	} catch (error) {
		console.error('Could Not Retrieve Saved SettingsData, Resorting to Default SettingsData: ' + error);
		return defaultSettingsData;
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
            const courses = await CanvasUtil.getCoursesFromCanvas(appInfo.settingsData);
            classData = await CanvasUtil.convertToClassData(courses);
        } catch (error) {
            console.error('[DEVMODE]: Failed to Get Class Data From Canvas -', error);
        }
	}
	
	await updateClassData(classData);
}

export { getDefaultSettingsData, getSavedClassData, getSavedSettingsData, reloadClassData, reloadSettingsData }
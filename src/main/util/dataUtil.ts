import AppInfo from '../interfaces/appInfo';
import DebugMode from '../../shared/interfaces/debugMode';

import { updateClassData } from '../main';

import { ClassData } from "../../shared/interfaces/classData";
import SettingsData from "../../shared/interfaces/settingsData";

import * as FileUtil from './fileUtil';
import * as CourseUtil from './courseUtil';
import * as CanvasUtil from './canvasUtil'

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
		const classData = await FileUtil.getSavedData('classes-data.json') as ClassData;
		return classData;
	} catch (error) {
		console.error('Could Not Retrieve ClassData: ' + error)
		return null;
	}
}

async function getSavedSettingsData(): Promise<SettingsData> {
	const defaultSettingsData: SettingsData = getDefaultSettingsData();

	try {
		const savedSettingsData = await FileUtil.getSavedData('settings-data.json') as SettingsData;

		if (savedSettingsData.version !== defaultSettingsData.version)
			console.warn('Saved Settings Has New Version!')

		const settingsData: SettingsData = { ...defaultSettingsData, ...savedSettingsData };
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

	let _classData: ClassData | null = null;

	if (debugMode.useLocalClassData) {
        _classData = await FileUtil.getLocalData('../../assets/data/classes-data.json') as ClassData;
	}
	else {
		if (!appInfo.settingsData)
			return;

		try {
            const courses = await CanvasUtil.getCoursesFromCanvas(appInfo.settingsData);
            _classData = await CanvasUtil.convertToClassData(courses);
        } catch (error) {
            console.error('[DEVMODE]: Failed to Get Class Data From Canvas -', error);
        }
	}
	
	await updateClassData(_classData);
}

export { getDefaultSettingsData, getSavedClassData, getSavedSettingsData, reloadClassData, reloadSettingsData }
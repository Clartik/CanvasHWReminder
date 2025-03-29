import * as keytar from 'keytar';

import AppInfo from '../../interfaces/appInfo';
import DebugMode from "../../interfaces/debugMode";

import { Assignment, ClassData } from "../../interfaces/classData";
import SettingsData from "../../interfaces/settingsData";
import { APP_NAME, FILENAME_APP_INFO_SAVE_DATA_JSON, FILENAME_SETTINGS_DATA_JSON } from "../../constants";

import * as CanvasUtil from './canvasUtil'

import { updateClassData } from '../main';
import { FILENAME_CLASS_DATA_JSON } from '../../constants';

import SaveManager from './saveManager';
import { app } from 'electron';

import AppInfoSaveData from '../../interfaces/appInfoData';

import * as mainLog from 'electron-log';
import AssignmentSubmittedType from '../../interfaces/assignmentSubmittedType';

async function getSecureText(key: string): Promise<string | null> {
	return await keytar.getPassword(APP_NAME, key);
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

		mainLog.log(`Deleting Expired Saved Assignment (${assignment.name})`);

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

		mainLog.log(`Deleting Expired Saved Assignment Submitted Type (${assignment.name})`);

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
	appInfo.settingsData = await SaveManager.load(FILENAME_SETTINGS_DATA_JSON) as SettingsData | null;
}

async function reloadClassData(appInfo: AppInfo, debugMode: DebugMode) {
	if (!debugMode.devKeybinds)
		return;

	mainLog.log('[DEBUG MODE]: Reloading Class Data!');

	let classData: ClassData | null = null;

	if (debugMode.useLocalClassData) {
		classData = await SaveManager.load(FILENAME_CLASS_DATA_JSON) as ClassData | null;
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

	mainLog.log('Configured App to Launch on System Bootup');
}

async function saveAssignmentSubmittedTypes(assignmentSubmittedTypes: AssignmentSubmittedType[]) {
	const appInfoSaveData = await SaveManager.load(FILENAME_APP_INFO_SAVE_DATA_JSON) as AppInfoSaveData;

	appInfoSaveData.assignmentSubmittedTypes = assignmentSubmittedTypes;
	SaveManager.save(FILENAME_APP_INFO_SAVE_DATA_JSON, appInfoSaveData);
}

export { reloadClassData, reloadSettingsData, getSecureText, 
	configureAppSettings, cleanUpUnnecessarySavedAssignmentsAccordingToDueDate,
	saveAssignmentSubmittedTypes, cleanUpUnnecessarySavedAssignmentSubmittedTypes
 }
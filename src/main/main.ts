import electronReload from 'electron-reload'
import { promisify } from 'util'

import { app, BrowserWindow, Notification } from 'electron'

import handleIPCRequests from './ipc';

import createSystemTray from './tray'
import createMainWindow from './window';

import AppInfo from './interfaces/appInfo';
import DebugMode from './interfaces/debugMode'

import * as FileUtil from './util/fileUtil';
import * as CourseUtil from './util/courseUtil';
import * as DataUtil from './util/dataUtil';

import { createWorker } from './util/misc';

const sleep = promisify(setTimeout);

global.__baseDir = __dirname;

const checkForUpdatesTimeInSec: number = 60;				// Every Minute
const notificationDisappearTimeInSec: number = 6;			// Every 6 Seconds

const debugMode: DebugMode = {
	active: true,
	useLocalClassData: true,
	devKeybinds: true,
	saveFetchedClassData: true,
};

if (!debugMode.active) {
	debugMode.useLocalClassData = false;
	debugMode.devKeybinds = false;
	debugMode.saveFetchedClassData = false;
}

const appInfo: AppInfo = {
	isRunning: true,
	isReady: false,
	isMainWindowHidden: false,

	isWaitingOnNotification: false,

	classData: null,
	settingsData: undefined,

	nextAssignment: null,
	assignmentsThatHaveBeenReminded: [],
}

let mainWindow: BrowserWindow;

createElectronApp();
handleIPCRequests(appInfo, debugMode);
appMain();

//#region App Setup

function createElectronApp() {
	app.on('ready', async () => {
		app.setAppUserModelId('Canvas HW Reminder');		// Windows Specific Command to Show the App Name in Notification
		const tray = createSystemTray(appInfo, mainWindow);
		
		while (appInfo.settingsData === null)
			await sleep(100);
	
		mainWindow = createMainWindow(appInfo);
	
		// Windows Cannot Be Created Before Ready!
		app.on('activate', async () => {
			if (BrowserWindow.getAllWindows().length !== 0)
				return;
			
			mainWindow = createMainWindow(appInfo);
		});
	});
	
	app.on('window-all-closed', () => {
		// On macOS it is common for applications and their menu bar
		// to stay active until the user quits explicitly with Cmd + Q
		if (process.platform === 'darwin')
			return;
		
		if (appInfo.isRunning)
			return;
	
		app.quit();
	});
}

//#endregion

//#region Functions

async function appMain() {
	appInfo.settingsData = await DataUtil.getSavedSettingsData();

	if (!appInfo.settingsData)
		return;

	// while (!net.isOnline())
	// 	await sleep(1000);

	if (!debugMode.useLocalClassData) {
		const checkCanvasWorker = createWorker('./workers/checkCanvas.js', updateInfoWithClassData);
		checkCanvasWorker.postMessage(appInfo.settingsData);
	}
	else {
		const checkCanvasWorker = createWorker('./workers/checkCanvasDEBUG.js', updateInfoWithClassData);
		checkCanvasWorker.postMessage(appInfo.settingsData);
	}

	while (!appInfo.classData)
		await sleep(1000);

	while (appInfo.isRunning) {
		console.log('Checking if There is a Next Assignment/New Next Assignment!');
		
		const upcomingAssignments = CourseUtil.getUpcomingAssignments(appInfo.classData);
		CourseUtil.filterUpcomingAssignmentsToRemoveRemindedAssignments(upcomingAssignments, appInfo.assignmentsThatHaveBeenReminded);
		appInfo.nextAssignment = CourseUtil.getNextAssignment(upcomingAssignments);

		if (appInfo.nextAssignment === null || appInfo.nextAssignment.due_at === null) {
			await sleep(checkForUpdatesTimeInSec * 1000);
			continue;
		}

		console.log("The Next Assignment is " + appInfo.nextAssignment.name);

		const secondsToWait: number = CourseUtil.getSecondsToWaitTillNotification(appInfo.nextAssignment.due_at, settingsData!);
		const timeTillDueDate: string = CourseUtil.getTimeTillDueDateFromSecondsDiff(secondsToWait);
	
		appInfo.isWaitingOnNotification = true;

		console.log(`Sleeping for ${timeTillDueDate} Till Notification`);

		let secondsWaited = 0;

		while (secondsWaited < secondsToWait && appInfo.isWaitingOnNotification) {
			await sleep(1 * 1000);
			secondsWaited++;
		}

		if (!appInfo.isWaitingOnNotification) {
			console.log("Cancelled Waiting on Notification Timer! Restarting While Loop!");
			continue;
		}
		
		while (!appInfo.isReady)
			await sleep(1 * 1000);

		appInfo.isWaitingOnNotification = false;

		const notification: Notification | null = CourseUtil.getNotification(appInfo.nextAssignment);

		if (notification)
			notification.show();
		else
			console.error('Failed to Show Notification!');
	
		appInfo.assignmentsThatHaveBeenReminded.push(appInfo.nextAssignment);
		console.log(`Removing ${appInfo.nextAssignment.name} From Upcoming Assignmnets!`);

		await sleep(notificationDisappearTimeInSec * 1000);
	}
};

async function updateInfoWithClassData(classData: ClassData | null) {
	if (classData === null)
		return;

	// ClassData Is Different From Cached Classes
	if (JSON.stringify(classData.classes) === JSON.stringify(appInfo.classData?.classes)) {
		console.log('ClassData Has Not Changed!')
		return;
	}

	console.log('ClassData Has Changed!')

	if (debugMode.saveFetchedClassData)
		await FileUtil.writeSavedData('classes-data.json', classData);

	appInfo.classData = classData;

	const upcomingAssignments = CourseUtil.getUpcomingAssignments(classData);
	CourseUtil.filterUpcomingAssignmentsToRemoveRemindedAssignments(upcomingAssignments, appInfo.assignmentsThatHaveBeenReminded);
	const possibleNextAssignment = CourseUtil.getNextAssignment(upcomingAssignments);

	if (possibleNextAssignment?.name === appInfo.nextAssignment?.name)
		appInfo.isWaitingOnNotification = false;

	mainWindow?.webContents.send('updateData', 'classes', classData);
}

// #endregion

export { updateInfoWithClassData }
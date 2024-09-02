import { Worker } from 'worker_threads'
import electronReload from 'electron-reload'
import { promisify } from 'util'

import { app, BrowserWindow, net, Notification } from 'electron'

import handleIPCRequests from './ipc';

import createSystemTray from './tray'
import createMainWindow from './window';

import AppInfo from './interfaces/appInfo';
import DebugMode from './interfaces/debugMode'
import WaitOnNotificationParams from './interfaces/waitForNotificationParams';

import * as FileUtil from './util/fileUtil';
import * as CourseUtil from './util/courseUtil';
import * as DataUtil from './util/dataUtil';

import { createWorker } from './util/misc';

const sleep = promisify(setTimeout);

global.__baseDir = __dirname;

const debugMode: DebugMode = {
	active: true,
	useLocalClassData: true,
	devKeybinds: true,
	saveFetchedClassData: false,
};

if (!debugMode.active) {
	debugMode.useLocalClassData = false;
	debugMode.devKeybinds = false;
	debugMode.saveFetchedClassData = false;
}

const appInfo: AppInfo = {
	isRunning: true,
	isMainWindowHidden: false,

	classData: null,
	settingsData: null,

	nextAssignment: null,
	assignmentsThatHaveBeenReminded: [],
}

const CHECK_FOR_UPDATES_TIME_IN_SEC = 60;			// Every Minute
const NOTIFICATION_DISAPPER_TIME_IN_SEC: number = 6;			// Every 6 Seconds

let mainWindow: BrowserWindow | null = null;

let checkCanvasWorker: Worker | null = null;
let waitForNotificationWorker: Worker | null = null;

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
	
		if (appInfo.settingsData?.minimizeOnLaunch) {
			appInfo.isMainWindowHidden = true;
			return;
		}

		mainWindow = createMainWindow(appInfo);
	});

	// MACOS ONLY
	app.on('activate', async () => {
		if (BrowserWindow.getAllWindows().length === 0 && app.isReady())
			mainWindow = createMainWindow(appInfo);
	});
	
	app.on('window-all-closed', () => {
		// On macOS it is common for applications and their menu bar
		// to stay active until the user quits explicitly with Cmd + Q
		if (process.platform === 'darwin')
			return;
		
		if (appInfo.isRunning)
			return;
	
		checkCanvasWorker?.terminate();
		waitForNotificationWorker?.terminate();

		app.quit();
	});
}

//#endregion

//#region Functions

async function appMain() {
	appInfo.settingsData = await DataUtil.getSavedSettingsData();

	if (!appInfo.settingsData) {
		console.error('[Main]: SettingsData is NULL!');
		return;
	}

	if (!debugMode.useLocalClassData) {
		checkCanvasWorker = createWorker('./workers/checkCanvas.js', updateClassData);
		checkCanvasWorker.postMessage(appInfo.settingsData);
	}
	else {
		const checkCanvasWorker = createWorker('./workers/checkCanvasDEBUG.js', updateClassData);
		checkCanvasWorker.postMessage(appInfo.settingsData);
	}

	let hasToldRendererAboutInternetOnlineStatus = true;			// By Default, the Status is Assumed to Be Online
	let hasToldRendererAboutInternetOfflineStatus = false;

	while (appInfo.isRunning) {
		if (!net.isOnline() && !hasToldRendererAboutInternetOfflineStatus) {
			mainWindow?.webContents.send('sendAppStatus', 'INTERNET OFFLINE');

			hasToldRendererAboutInternetOfflineStatus = true;
			hasToldRendererAboutInternetOnlineStatus = false;
		}
		else if (net.isOnline() && !hasToldRendererAboutInternetOnlineStatus) {
			mainWindow?.webContents.send('sendAppStatus', 'INTERNET ONLINE');

			hasToldRendererAboutInternetOnlineStatus = true;
			hasToldRendererAboutInternetOfflineStatus = false;
		}

		await sleep(CHECK_FOR_UPDATES_TIME_IN_SEC * 1000);
	}
};

async function updateClassData(classData: ClassData | null) {
	if (classData === null)
		return;

	// ClassData Is Different From Cached Classes
	if (JSON.stringify(classData.classes) === JSON.stringify(appInfo.classData?.classes)) {
		console.log('[Main]: ClassData Has Not Changed!')
		return;
	}

	console.log('[Main]: ClassData Has Changed!')

	if (debugMode.saveFetchedClassData)
		await FileUtil.writeSavedData('class-data.json', classData);

	appInfo.classData = classData;
	mainWindow?.webContents.send('updateData', 'classes', classData);

	findNextAssignmentAndStartWorker();
}

function findNextAssignmentAndStartWorker() {
	if (!appInfo.classData)
		return;

	if (!appInfo.settingsData)
		return;

	const upcomingAssignments = CourseUtil.getUpcomingAssignments(appInfo.classData);
	CourseUtil.filterUpcomingAssignmentsToRemoveRemindedAssignments(upcomingAssignments, appInfo.assignmentsThatHaveBeenReminded);
	const possibleNextAssignment: Assignment | null = CourseUtil.getNextAssignment(upcomingAssignments);

	if (possibleNextAssignment === null) {
		console.log('[Main]: There is No Next Assignment!');
		return
	}

	if (possibleNextAssignment.name === appInfo.nextAssignment?.name) {
		console.log('[Main]: Possible Next Assignment is the Same As the Current Next Assignment!');	
		return;
	}

	console.log('[Main]: Next Assignment is ' + possibleNextAssignment.name);
	appInfo.nextAssignment = possibleNextAssignment;

	if (waitForNotificationWorker !== null) {
		console.log('[Main]: Terminating Old Worker (WaitOnNotification)!');
		waitForNotificationWorker.terminate();
		waitForNotificationWorker =  null;
	}

	const waitOnNotificationParams: WaitOnNotificationParams = {
		nextAssignment: appInfo.nextAssignment, 
		settingsData: appInfo.settingsData
	};

	console.log('[Main]: Starting Worker (WaitOnNotification)!');
	waitForNotificationWorker = createWorker('./workers/waitForNotification.js', showNotification);
	waitForNotificationWorker.postMessage(waitOnNotificationParams);
}

async function showNotification(nextAssignment: Assignment) {
	waitForNotificationWorker = null;

	while (!app.isReady())
		await sleep(100);
	
	const notification: Notification | null = CourseUtil.getNotification(nextAssignment);

	if (notification)
		notification.show();
	else
		console.error('[Main]: Failed to Show Notification!');

	appInfo.assignmentsThatHaveBeenReminded.push(nextAssignment);
	console.log(`[Main]: Adding ${nextAssignment.name} to Assignments That Have Been Reminded!`);

	await sleep(NOTIFICATION_DISAPPER_TIME_IN_SEC * 1000);

	findNextAssignmentAndStartWorker();
}

// #endregion

export { updateClassData }
import { Worker } from 'worker_threads'
import electronReload from 'electron-reload'
import { promisify } from 'util'

import { app, BrowserWindow, net, Notification } from 'electron'

import handleIPCRequests from './ipc';

import createSystemTray from './tray'
import createMainWindow from './window';

import AppInfo from './interfaces/appInfo';
import DebugMode from '../shared/interfaces/debugMode'
import WaitOnNotificationParams from './interfaces/waitForNotificationParams';
import WorkerResult from './interfaces/workerResult';
import AppStatus from '../shared/interfaces/appStatus';

import { ClassData, Assignment } from "../shared/interfaces/classData";

import * as FileUtil from './util/fileUtil';
import * as CourseUtil from './util/courseUtil';
import * as DataUtil from './util/dataUtil';
import * as WorkerUtil from './util/workerUtil';

const sleep = promisify(setTimeout);

global.__baseDir = __dirname;

const debugMode: DebugMode = {
	active: true,
	useLocalClassData: false,
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
	isMainWindowLoaded: false,
	isMainWindowHidden: false,

	classData: null,
	settingsData: null,

	nextAssignment: null,
	assignmentsThatHaveBeenReminded: [],
}

// Assume By Default Both are Avaiable!
const appStatus: AppStatus = {
	isOnline: true,
	isConnectedToCanvas: true
}

const CHECK_FOR_UPDATES_TIME_IN_SEC = 10;			// Every Minute
const NOTIFICATION_DISAPPER_TIME_IN_SEC: number = 6;			// Every 6 Seconds

let mainWindow: BrowserWindow | null = null;

let checkCanvasWorker: Worker | null = null;
let waitForNotificationWorker: Worker | null = null;

createElectronApp();
handleIPCRequests(appInfo, appStatus, debugMode);
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

	if (net.isOnline())
		checkCanvasWorker = createCanvasWorker();

	while (!app.isReady() || !appInfo.isMainWindowLoaded)
		await sleep(100);

	while (appInfo.isRunning) {
		if (!net.isOnline() && appStatus.isOnline) {
			appStatus.isOnline = false;
			mainWindow?.webContents.send('sendAppStatus', 'INTERNET OFFLINE');

			if (checkCanvasWorker !== null) {
				checkCanvasWorker.terminate();
				checkCanvasWorker = null;
				console.log('[Main]: Cancelled Worker (CheckCanvas) Due to No Internet!');
			}
		}
		else if (net.isOnline() && !appStatus.isOnline) {
			appStatus.isOnline = true;
			mainWindow?.webContents.send('sendAppStatus', 'INTERNET ONLINE');

			if (checkCanvasWorker === null)
				checkCanvasWorker = createCanvasWorker();
		}

		await sleep(CHECK_FOR_UPDATES_TIME_IN_SEC * 1000);
	}
};

async function updateClassData(classData: ClassData | null) {
	if (classData === null)
		return;

	if (!appStatus.isConnectedToCanvas) {
		appStatus.isConnectedToCanvas = true;
		mainWindow?.webContents.send('sendAppStatus', 'CANVAS LOGIN SUCCESS');
	}

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

	waitForNotificationWorker = WorkerUtil.createWorker('./workers/waitForNotification.js');
	waitForNotificationWorker.on('message', onShowNotificationWorkerMessageCallback);

	waitForNotificationWorker.postMessage(waitOnNotificationParams);
}

async function showNotification(nextAssignment: Assignment) {
	waitForNotificationWorker?.terminate();
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

function createCanvasWorker(): Worker {
    let _checkCanvasWorker: Worker;

	if (!debugMode.useLocalClassData) {
		_checkCanvasWorker = WorkerUtil.createWorker('./workers/checkCanvas.js');
		_checkCanvasWorker.on('message', onCheckCanvasWorkerMessageCallback);

		_checkCanvasWorker.postMessage(appInfo.settingsData);
	}
	else {
		_checkCanvasWorker = WorkerUtil.createWorker('./workers/checkCanvasDEBUG.js');
		_checkCanvasWorker.on('message', onCheckCanvasWorkerMessageCallback);

		_checkCanvasWorker.postMessage(appInfo.settingsData);
	}

	return _checkCanvasWorker;
}

async function onCheckCanvasWorkerMessageCallback(result: WorkerResult) {
	if (result.error !== null) {
		switch (result.error) {
			case 'INTERNET OFFLINE':
				checkCanvasWorker?.terminate();
				checkCanvasWorker = null;
				break;

			case 'INVALID CANVAS CREDENTIALS':
				appStatus.isConnectedToCanvas = false;
				mainWindow?.webContents.send('sendAppStatus', 'INVALID CANVAS CREDENTIALS');

				checkCanvasWorker?.terminate();
				checkCanvasWorker = null;
				break;
		
			default:
				break;
		}
		
		return;
	}

	updateClassData(result.data as ClassData | null);
}

async function onShowNotificationWorkerMessageCallback(result: WorkerResult) {
	if (result.error !== null) {
		return;
	}

	// Data Should Never Be NULL
	if (result.data === null)
		return;

	showNotification(result.data as Assignment);
}

function startCheckCanvasWorker() {
	if (checkCanvasWorker !== null)
		return;

	appStatus.isConnectedToCanvas = true;
	checkCanvasWorker = createCanvasWorker();
}

export { updateClassData, startCheckCanvasWorker }
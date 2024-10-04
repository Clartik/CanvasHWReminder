import { Worker } from 'worker_threads'
import { promisify } from 'util'
import * as path from 'path';

import { app, shell, BrowserWindow, net, Notification, Menu, dialog } from 'electron'

import { updateElectronApp } from 'update-electron-app';

import handleIPCRequests from './ipc/index';

import createSystemTray from './tray'
import createMainWindow from './window';

import AppInfo from './interfaces/appInfo';
import DebugMode from '../shared/interfaces/debugMode'
import WaitOnNotificationParams from './interfaces/waitForNotificationParams';
import WorkerResult from './interfaces/workerResult';
import AppStatus from '../shared/interfaces/appStatus';
import AppLog from './interfaces/appLog';

import { ClassData, Assignment } from "../shared/interfaces/classData";

import * as CourseUtil from './util/courseUtil';
import * as DataUtil from './util/dataUtil';
import * as WorkerUtil from './util/workerUtil';
import { FILENAME_CLASS_DATA_JSON } from '../shared/constants';

import SaveManager from './util/saveManager';

import { getIconPath, openLink } from "./util/misc";

const sleep = promisify(setTimeout);

global.__baseDir = __dirname;

const envFilepath = path.resolve(__dirname + '../../../.env');
// const envFilepath = path.resolve(__dirname + '../../../.env.prod.beta');

require('dotenv').config({ path: envFilepath });

const debugMode: DebugMode = {
	active: process.env.DEBUG_MODE === 'true',
	useLocalClassData: process.env.DEBUG_USE_LOCAL_CLASS_DATA === 'true',
	devKeybinds: process.env.DEBUG_KEYBINDS === 'true',
	saveFetchedClassData: process.env.DEBUG_SAVE_FETCHED_CLASS_DATA === 'true',
};

if (!debugMode.active) {
	debugMode.useLocalClassData = false;
	debugMode.devKeybinds = false;
	debugMode.saveFetchedClassData = false;
}

if (!debugMode.active)
	updateElectronApp();

const appInfo: AppInfo = {
	isDevelopment: process.env.NODE_ENV === 'dev',

	isRunning: true,
	isMainWindowLoaded: false,
	isMainWindowHidden: false,

	mainWindow: null,
	notification: null,

	classData: null,
	settingsData: null,

	nextAssignment: null,
	assignmentsThatHaveBeenReminded: [],
	assignmentsToNotRemind: [],

	lastCanvasCheckTime: "Never"
}

// Assume By Default Both are Avaiable!
const appStatus: AppStatus = {
	isSetupNeeded: false,

	isOnline: true,
	isConnectedToCanvas: true
}

const CHECK_FOR_UPDATES_TIME_IN_SEC = 10;						// Every Minute
const NOTIFICATION_DISAPPER_TIME_IN_SEC: number = 6;			// Every 6 Seconds

let systemTray: Electron.Tray;

let checkCanvasWorker: Worker | null = null;
let waitForNotificationWorker: Worker | null = null;

createElectronApp();
handleIPCRequests(appInfo, appStatus, debugMode);
appMain();

//#region App Setup

function createElectronApp() {
	SaveManager.init(app.getPath('userData'));

	const isLocked = app.requestSingleInstanceLock();

	if (!isLocked) {
		console.log('[Main]: Another Instance of App Exists! Exiting this Instance!');
		app.quit();
		return;
	}

	if (appInfo.isDevelopment && process.platform === 'win32')
		app.setAsDefaultProtocolClient('canvas-hw-reminder', process.execPath, [path.resolve(process.argv[1])]);
	else
		app.setAsDefaultProtocolClient('canvas-hw-reminder');

	// Listen for protocol URL when the app is already running (OS X Specific)
	app.on('open-url', (event, url) => {
		event.preventDefault(); // Prevent the default action
		handleURLProtocol(url);
  	});

	app.on('second-instance', (event, argv) => {
		const protocolUrl = argv.find((arg) => arg.startsWith('canvas-hw-reminder:'));
		
		if (protocolUrl)
			handleURLProtocol(protocolUrl);
	})

	app.whenReady().then(async () => {
		if (process.platform === 'win32')
			app.setAppUserModelId(app.name);		// Windows Specific Command to Show the App Name in Notification

		if (process.argv.length > 1)
			console.log(process.argv[1])

		if (!appInfo.isDevelopment)
			Menu.setApplicationMenu(null);

		systemTray = createSystemTray(appInfo, debugMode);
		
		while (!appInfo.settingsData && !appStatus.isSetupNeeded)
			await sleep(100);
	
		if (appInfo.settingsData?.minimizeOnLaunch) {
			appInfo.isMainWindowHidden = true;
			console.log("[Main]: Main Window Didn't Show Due to Setting");
			return;
		}

		launchMainWindowWithCorrectPage();
	});

	// MACOS ONLY
	app.on('activate', async () => {
		if (BrowserWindow.getAllWindows().length === 0 && app.isReady())
			appInfo.mainWindow = createMainWindow(appInfo, debugMode, './pages/home.html');
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

	app.on('before-quit', () => {
		checkCanvasWorker?.terminate();
		waitForNotificationWorker?.terminate();

		systemTray.destroy();
	})
}

//#endregion

//#region Functions

async function appMain() {
	appInfo.settingsData = await DataUtil.getSavedSettingsData();

	const canvasBaseURL = await DataUtil.getSecureText('CanvasBaseURL');
	const canvasAPIToken = await DataUtil.getSecureText('CanvasAPIToken');

	if (!appInfo.settingsData) {
		console.error('[Main]: SettingsData is NULL!');

		console.log('[Main]: Setup is Needed!');
		appStatus.isSetupNeeded = true;

		appInfo.mainWindow?.webContents.loadFile('./pages/welcome.html');
		return;
	}

	if (!canvasBaseURL || !canvasAPIToken) {
		console.error('[Main]: Canvas Credentials are NULL!');

		console.log('[Main]: Setup is Needed!');
		appStatus.isSetupNeeded = true;

		appInfo.mainWindow?.webContents.loadFile('./pages/welcome.html');
		return;
	}
	
	if (net.isOnline())
		checkCanvasWorker = await createCanvasWorker();
	
	while (!app.isReady()) {
		await sleep(100);
	}

	while (appInfo.isRunning) {
		if (!net.isOnline() && appStatus.isOnline) {
			console.log('[Main]: No Internet!');

			appStatus.isOnline = false;
			appInfo.mainWindow?.webContents.send('sendAppStatus', 'INTERNET OFFLINE');

			if (checkCanvasWorker !== null) {
				checkCanvasWorker.terminate();
				checkCanvasWorker = null;
				console.log('[Main]: Cancelled Worker (CheckCanvas) Due to No Internet!');
			}
		}
		else if (net.isOnline() && !appStatus.isOnline) {
			console.log('[Main]: Internet Back!');

			appStatus.isOnline = true;
			appInfo.mainWindow?.webContents.send('sendAppStatus', 'INTERNET ONLINE');

			if (checkCanvasWorker === null)
				checkCanvasWorker = await createCanvasWorker();
		}

		await sleep(CHECK_FOR_UPDATES_TIME_IN_SEC * 1000);
	}
};

function launchMainWindowWithCorrectPage() {
	if (appStatus.isSetupNeeded)
		appInfo.mainWindow = createMainWindow(appInfo, debugMode, './pages/welcome.html');
	else
		appInfo.mainWindow = createMainWindow(appInfo, debugMode, './pages/home.html');
}

async function updateClassData(classData: ClassData | null) {
	if (classData === null)
		return;

	if (!appStatus.isConnectedToCanvas) {
		appStatus.isConnectedToCanvas = true;
		appInfo.mainWindow?.webContents.send('sendAppStatus', 'CANVAS LOGIN SUCCESS');
	}

	// ClassData Is Different From Cached Classes
	if (JSON.stringify(classData.classes) === JSON.stringify(appInfo.classData?.classes)) {
		console.log('[Main]: ClassData Has Not Updated!')
		return;
	}

	console.log('[Main]: ClassData Has Updated!')

	if (debugMode.saveFetchedClassData)
		await SaveManager.writeSavedData(FILENAME_CLASS_DATA_JSON, classData);

	appInfo.classData = classData;
	appInfo.mainWindow?.webContents.send('updateData', 'classes', classData);

	findNextAssignmentAndStartWorker();
}

function findNextAssignmentAndStartWorker() {
	if (!appInfo.classData)
		return;

	if (!appInfo.settingsData)
		return;

	let upcomingAssignments = CourseUtil.getUpcomingAssignments(appInfo.classData);

	upcomingAssignments = CourseUtil.filterUpcomingAssignmentsToRemoveRemindedAssignments(upcomingAssignments, appInfo.assignmentsThatHaveBeenReminded);
	upcomingAssignments = CourseUtil.filterUpcomingAssignmentsToRemoveAssignmentsToNotRemind(upcomingAssignments, appInfo.assignmentsToNotRemind);

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

	startWaitOnNotificationWorker();
}

function getNotification(nextAssignment: Assignment): Electron.Notification | null {
	if (nextAssignment.due_at === null)
		return null;

	const currentDate = new Date();
	const nextAssignmentDueDate = new Date(nextAssignment.due_at);

	const timeTillDueDate: string = CourseUtil.getTimeTillDueDate(currentDate, nextAssignmentDueDate);

	const exactDueDate: string = CourseUtil.getExactDueDate(currentDate, nextAssignmentDueDate);

	const iconRelativePath: string = getIconPath(appInfo.isDevelopment);
	const iconAbsPath: string = path.join(__dirname, `../../${iconRelativePath}`);

	const notificationTitle = `${nextAssignment.name} is ${timeTillDueDate}!`;

	if (process.platform === 'win32') {
		const notification = new Notification({
			toastXml: `
			<toast scenario="reminder" launch="canvas-hw-reminder:action=navigate?key=value" activationType="protocol">
				<visual>
					<binding template="ToastGeneric">
						<image placement="appLogoOverride" hint-crop="circle" src="${iconAbsPath}"/>
						<text>${notificationTitle}</text>
						<text>${exactDueDate}</text>
					</binding>
				</visual>
				<actions>
					<action
						content="See Post"
						arguments="canvas-hw-reminder:action=see-post"
						activationType="protocol"/>
	
					<!-- <action
						content="Remind Later"
						arguments="canvas-hw-reminder:action=remind-later"
						activationType="protocol"/> -->
	
					<action
						content="Dismiss"
						arguments="canvas-hw-reminder:action=dismiss"
						activationType="protocol"/>
				</actions>
			</toast>`
		});	

		return notification;
	}
	else {
		const notification = new Notification({
			title: notificationTitle,
			body: 'Click on the Notification to Head to the Posting',
			icon: iconRelativePath
		})

		notification.addListener('click', () => openLink(nextAssignment.html_url));
		
		return notification;
	}
}

function handleURLProtocol(url: string) {
	const parsedURL = new URL(url);
	const action: string = parsedURL.pathname.split('action=')[1];

	switch (action) {
		case 'see-post':
			if (!appInfo.nextAssignment)
				return;

			console.log('[Notification]: Opening Post for Next Assignment');

			openLink(appInfo.nextAssignment.html_url);
			break;

		case 'dismiss':
			if (!appInfo.notification)
				return;
			
			console.log('[Notification]: Dismissing Notification');
			
			appInfo.notification.close();
			break;
	
		default:
			break;
	}
}

async function showNotification(nextAssignment: Assignment) {
	waitForNotificationWorker?.terminate();
	waitForNotificationWorker = null;

	while (!app.isReady())
		await sleep(100);
	
	appInfo.notification = getNotification(nextAssignment);

	if (appInfo.notification)
		appInfo.notification.show();
	else
		console.error('[Main]: Failed to Show Notification!');

	appInfo.assignmentsThatHaveBeenReminded.push(nextAssignment);
	console.log(`[Main]: Adding ${nextAssignment.name} to Assignments That Have Been Reminded!`);

	await sleep(NOTIFICATION_DISAPPER_TIME_IN_SEC * 1000);

	findNextAssignmentAndStartWorker();
}

// #endregion

async function createCanvasWorker(): Promise<Worker> {
    let _checkCanvasWorker: Worker;

	if (!debugMode.useLocalClassData) {
		_checkCanvasWorker = WorkerUtil.createWorker('./workers/checkCanvas.js');
		_checkCanvasWorker.on('message', onCheckCanvasWorkerMessageCallback);

		console.log('[Main]: Starting Worker (CheckCanvas)!');

		const canvasBaseURL = await DataUtil.getSecureText('CanvasBaseURL');
		const canvasAPIToken = await DataUtil.getSecureText('CanvasAPIToken');

		_checkCanvasWorker.postMessage({ canvasBaseURL, canvasAPIToken });
	}
	else {
		_checkCanvasWorker = WorkerUtil.createWorker('./workers/checkCanvasDEBUG.js');
		_checkCanvasWorker.on('message', onCheckCanvasWorkerMessageCallback);

		console.log('[Main]: Starting Worker (CheckCanvas DEBUG)!');

		_checkCanvasWorker.postMessage(app.getPath('userData'));
	}

	return _checkCanvasWorker;
}

async function onCheckCanvasWorkerMessageCallback(result: WorkerResult) {
	appInfo.lastCanvasCheckTime = new Date().toLocaleString();

	if (result.error !== null) {
		switch (result.error) {
			case 'INTERNET OFFLINE':
				checkCanvasWorker?.terminate();
				checkCanvasWorker = null;
				break;

			case 'INVALID CANVAS CREDENTIALS':
				appStatus.isConnectedToCanvas = false;
				appInfo.mainWindow?.webContents.send('sendAppStatus', 'INVALID CANVAS CREDENTIALS');

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

async function startCheckCanvasWorker() {
	if (checkCanvasWorker !== null) {
		console.log('[Main]: Settings Have Changed. Restarting Find Next Assignment Coroutine');

		appInfo.nextAssignment = null;				// Otherwise app will not restart worker because of it being the same assignment
		findNextAssignmentAndStartWorker();

		return;
	}

	appStatus.isConnectedToCanvas = true;
	checkCanvasWorker = await createCanvasWorker();
}

function startWaitOnNotificationWorker() {
	if (!appInfo.nextAssignment)
		return;

	if (!appInfo.settingsData)
		return;

	const waitOnNotificationParams: WaitOnNotificationParams = {
		nextAssignment: appInfo.nextAssignment, 
		settingsData: appInfo.settingsData
	};

	console.log('[Main]: Starting Worker (WaitOnNotification)!');

	waitForNotificationWorker = WorkerUtil.createWorker('./workers/waitForNotification.js');
	waitForNotificationWorker.on('message', onShowNotificationWorkerMessageCallback);

	waitForNotificationWorker.postMessage(waitOnNotificationParams);
}

async function outputAppLog() {
	console.log('[Main]: Outputting App Log to File!');

	const data: AppLog = {
		appInfo: appInfo,
		appStatus: appStatus,
		debugMode: debugMode,
		workers: {
			checkCanvasWorker: checkCanvasWorker !== null ? 'Running' : 'Not Running', 
			waitForNotificationWorker: waitForNotificationWorker !== null ? 'Running' : 'Not Running'
		}
	};

	await SaveManager.writeSavedData('app-log.json', data);

	if (!appInfo.mainWindow)
		return;

	const messageResponse: Electron.MessageBoxReturnValue = await dialog.showMessageBox(appInfo.mainWindow, {
		type: "info",
		title: "Saved App Log",
		message: "Outputted App Log to File",
		buttons: ['Show File', 'Ok'],
		defaultId: 1,
		cancelId: 1,
		noLink: true
	});

	const SHOW_BUTTON_RESPONSE = 0;

	if (messageResponse.response === SHOW_BUTTON_RESPONSE) {
		const appLogFilePath: string = SaveManager.getSavePath('app-log.json');
		shell.showItemInFolder(appLogFilePath);
	}
}

export { updateClassData, startCheckCanvasWorker, outputAppLog, appMain, launchMainWindowWithCorrectPage,
	findNextAssignmentAndStartWorker }
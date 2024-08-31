import { app, shell, BrowserWindow, ipcMain, dialog, Notification, Tray, Menu, NativeImage, nativeImage, net } from 'electron'
import { Worker } from 'worker_threads'

import * as path from 'path'
import * as electronReload from 'electron-reload'
import { promisify } from 'util'

import SaveManager from './save-manager'

const sleep = promisify(setTimeout);

type WorkerMessageCallback = (data: any) => void;

const checkForUpdatesTimeInSec: number = 60;				// Every Minute
const notificationDisappearTimeInSec: number = 6;			// Every 6 Seconds

interface DebugMode {
	readonly useLocalClassData: boolean;
	readonly devKeybinds: boolean
	readonly saveFetchedClassData: boolean;
}

const debugMode: DebugMode = {
	useLocalClassData: false,
	devKeybinds: true,
	saveFetchedClassData: true,
}

let isAppRunning = true;
let isAppReady = false;
let isMainWindowHidden = false;
let isCanvasDataReady = false;

let mainWindow: BrowserWindow | null = null;
let tray: Tray;

let classes: Array<Class> = [];
let upcomingAssignments: Array<Assignment> = [];
let nextAssignment: Assignment | null = null;
let assignmentsThatHaveBeenReminded: Array<Assignment> = [];
let isWaitingOnNotification: boolean = false;

let settingsData: SettingsData | null = null;

appMain();

// Main Function	
async function appMain() {
	settingsData = await getSavedSettingsData();

	while (!net.isOnline())
		await sleep(1000);

	if (!debugMode.useLocalClassData) {
		const checkCanvasWorker = createWorker('../build/Workers/checkCanvas.js', updateInfoWithClassData);
		checkCanvasWorker.postMessage(settingsData);
	}
	else {
		const checkCanvasWorker = createWorker('../build/Workers/checkCanvasDEV.js', updateInfoWithClassData);
		checkCanvasWorker.postMessage(settingsData);
	}

	while (!isCanvasDataReady)
		await sleep(1000);

	while (isAppRunning) {
		console.log('Checking for Updates!');
		
		upcomingAssignments = getUpcomingAssignments();
		removeAssignmentsThatHaveBeenRemindedFromUpcomingAssignments(assignmentsThatHaveBeenReminded, upcomingAssignments);
		nextAssignment = getNextUpcomingAssignment(upcomingAssignments);

		if (nextAssignment === null || nextAssignment.due_at === null) {
			await sleep(checkForUpdatesTimeInSec * 1000);
			continue;
		}

		console.log("The Next Assignment is " + nextAssignment.name);

		const secondsToWait: number = getSecondsToWaitTillNotification(nextAssignment.due_at);
		const timeTillDueDate: string = getTimeTillDueDateFromSecondsDiff(secondsToWait);
	
		isWaitingOnNotification = true;

		console.log(`Sleeping for ${timeTillDueDate}`);

		let secondsWaited = 0;

		while (secondsWaited < secondsToWait && isWaitingOnNotification) {
			await sleep(1 * 1000);
			secondsWaited++;
		}

		if (!isWaitingOnNotification) {
			console.log("Cancelled Waiting on Notification Timer! Restarting While Loop!");
			continue;
		}
		
		while (!isAppReady)
			await sleep(1 * 1000);

		isWaitingOnNotification = false;

		const notification: Notification | null = getNotification(nextAssignment);

		if (notification)
			notification.show();
		else
			console.error('Failed to Show Notification!');
	
		assignmentsThatHaveBeenReminded.push(nextAssignment);
		console.log(`Removing ${nextAssignment.name} From Upcoming Assignmnets!`);

		await sleep(notificationDisappearTimeInSec * 1000);
	}
};

//#region App Setup

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true,
		show: !settingsData?.minimizeOnLaunch,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true
		}
	});

	if (settingsData?.minimizeOnLaunch)
		isMainWindowHidden = true;
	
	mainWindow.loadFile('./pages/home.html');

	mainWindow.webContents.once('did-finish-load', async () => {
		if (mainWindow === null)
			return;

		while (!isCanvasDataReady)
			await sleep(1 * 1000);

		isAppReady = true;
	});

	mainWindow.on('close', (event) => {
		if (!isAppRunning)
			return;

		if (!isMainWindowHidden && settingsData?.minimizeOnClose) {
			event.preventDefault();
			mainWindow?.hide();
			isMainWindowHidden = true;
		}
		else if (!settingsData?.minimizeOnClose)
			isAppRunning = false;
	});
}

function createSystemTray() {
	const icon = nativeImage.createFromPath('./assets/images/4k.png');
	tray = new Tray(icon);
	
	const contextMenu = Menu.buildFromTemplate([
		{ label: 'Canvas HW Reminder', type: 'normal', enabled: false },
		{ type: 'separator' },
		{ label: 'Show App', type: 'normal', click: () => {
			if (!isMainWindowHidden) return;

			mainWindow?.show();
			isMainWindowHidden = false;
		} },
		// { label: "Don't Check for Today", type: 'checkbox' },
		{ label: 'Quit App', type: 'normal', click: () => {
			isAppRunning = false;
			app.quit();
		} },
	])

	tray.setContextMenu(contextMenu);

	tray.setToolTip('Canvas HW Reminder');
	tray.setTitle('Canvas HW Reminder');
}

app.whenReady().then(async () => {
	app.setAppUserModelId('Canvas HW Reminder');		// Windows Specific Command to Show the App Name in Notification

	createSystemTray();
	
	while (settingsData === null)
		await sleep(100);

	createWindow();
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform === 'darwin')
		return;
	
	if (isAppRunning)
		return;

	app.quit();
});

//#endregion

//#region API Event Handles

ipcMain.on('openLink', (event: any, url: string) => {
	try {
		shell.openExternal(url);
	} catch {
		dialog.showErrorBox('Could Not Open Assignment Post!', 'An Error Occured While Trying to Open the Assignment Post')
	}
});

ipcMain.handle('showMessageDialog', (event: any, options: Electron.MessageBoxOptions) => {
	return dialog.showMessageBox(options);
});

function getSavePath(filename: string): string {
	const userDataPath: string = app.getPath("userData");
	return `${userDataPath}/${filename}`;
}

ipcMain.handle('getLocalData', async (event: any, filename: string) => {
	console.log(`Get Local Data (${filename}) Event Was Handled!`)

	const filepath = path.join(__dirname, filename);
	return await SaveManager.getData(filepath);
});

ipcMain.handle('writeSavedData', async (event: any, filename: string, data: Object) => {
	console.log(`Write Saved Data (${filename}) Event Was Handled!`)
	
	return await writeSavedData(filename, data);
})

ipcMain.handle('getSavedData', async (event: any, filename: string) => {
	console.log(`Get Saved Data (${filename}) Event Was Handled!`)

	const savePath: string = getSavePath(filename);
	return await SaveManager.getData(savePath);
});

ipcMain.handle('getCachedData', (event: any, filename: string): Object | null => {
	console.log(`Get Cached Data (${filename}) Event Was Handled!`)

	if (filename === 'classes-data.json')
		return { classes: classes };

	if (filename === 'settings-data.json')
		return settingsData;

	return null;
});

ipcMain.on('updateData', (event: Event, type: string, data: Object | null) => {
	console.log(`Update Data (${type}) Event Was Handled!`)
	
	if (type === 'settings-data.json') {
		settingsData = data as SettingsData | null;

		if (mainWindow !== null)
			mainWindow.webContents.send('updateSettingsData', settingsData);
	}
});

ipcMain.on('keyPress', async (event, key: string) => {
	switch (key) {
		case 'F5':
			await reloadClassData();
			break;
	
		default:
			break;
	}
});

ipcMain.handle('getDebugMode', (event) => {
	return debugMode;
});

//#endregion

//#region Functions

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

async function reloadClassData() {
	if (!debugMode.devKeybinds)
		return;

	console.log('[DEVMODE]: Reloading Class Data!');

	let classData: ClassData | null = null;

	if (debugMode.useLocalClassData) {
		const filepath = path.join(__dirname, '../assets/data/classes-data.json');
		classData = await SaveManager.getData(filepath) as ClassData | null;
	}
	else {
		
	}
	
	await updateInfoWithClassData(classData);
}

function openLink(url: string) {
	try {
		shell.openExternal(url);
	} catch {
		dialog.showErrorBox('Could Not Open Assignment Post!', 'An Error Occured While Trying to Open the Assignment Post')
	}
}

async function updateInfoWithClassData(classData: ClassData | null) {
	if (classData === null)
		return;

	if (!isCanvasDataReady)
		isCanvasDataReady = true;

	// ClassData Is Different From Cached Classes
	if (JSON.stringify(classData.classes) === JSON.stringify(classes))
		return;

	console.log('ClassData Has Changed!')

	if (debugMode.saveFetchedClassData) {
		const success = await writeSavedData('classes-data.json', classData);
	}

	classes = classData.classes;

	upcomingAssignments = getUpcomingAssignments();
	removeAssignmentsThatHaveBeenRemindedFromUpcomingAssignments(assignmentsThatHaveBeenReminded, upcomingAssignments);
	const possibleNextAssignment = getNextUpcomingAssignment(upcomingAssignments);

	if (possibleNextAssignment?.name === nextAssignment?.name)
		isWaitingOnNotification = false;

	mainWindow?.webContents.send('updateData', 'classes', classData);
}

async function writeSavedData(filename: string, data: Object): Promise<boolean> {
	const savePath: string = getSavePath(filename);
	const success = await SaveManager.writeData(savePath, data);

	if (success)
		console.log(`Saved ${filename}!`)
	else
		console.error(`Failed to Save ${filename}!`)

	return success;
}

async function getClasses(): Promise<Class[]> {
	// const filepath = path.join(__dirname, '../classes.json');
	const savePath: string = getSavePath('classes-data.json');
	const classData: ClassData | null = await SaveManager.getData(savePath) as ClassData | null;

	if (classData === null) {
		console.error('Class Data is Null!')
		return [];
	}

	return classData.classes;
}

function getUpcomingAssignments(): Array<Assignment> {
	if (classes.length <= 0)
		return [];

	let upcomingAssignments: Array<Assignment> = [];

	for (let classIndex = 0; classIndex < classes.length; classIndex++) {
		const currentClass = classes[classIndex];

		for (let assignmentIndex = 0; assignmentIndex < currentClass.assignments.length; assignmentIndex++) {
			const currentAssignment = currentClass.assignments[assignmentIndex];

			if (currentAssignment.due_at === null)
				continue;
			
			const currentDate = new Date();
			const assignmentDueDate = new Date(currentAssignment.due_at);

			if (assignmentDueDate > currentDate)
				upcomingAssignments.push(currentAssignment);
		}
	}

	return upcomingAssignments;
}

function getUpcomingAssignmentWithDueDate(upcomingAssignments: Assignment[]): Assignment | null {
	for (let i = 0; i < upcomingAssignments.length; i++) {
		const upcomingAssignment = upcomingAssignments[i];
		
		if (upcomingAssignment.due_at === null)
			continue;

		return upcomingAssignment;
	}

	return null;
}

function getNextUpcomingAssignment(upcomingAssignments: Assignment[]): Assignment | null {
	if (upcomingAssignments.length === 0)
		return null;

	let _nextAssignment: Assignment | null = getUpcomingAssignmentWithDueDate(upcomingAssignments);

	if (_nextAssignment === null)
		return null;

	let closestAssignmentDueDate = new Date(_nextAssignment.due_at!);
	const currentDate = new Date();
	
	for (let i = 0; i < upcomingAssignments.length; i++) {
		const currentAssignment = upcomingAssignments[i];

		if (currentAssignment.due_at === null)
			continue;

		const assignmentDueDate = new Date(currentAssignment.due_at);

		if (assignmentDueDate < closestAssignmentDueDate) {
			closestAssignmentDueDate = assignmentDueDate;
			_nextAssignment = currentAssignment;
		}
	}
	
	const isAssignmentOverdue: boolean = currentDate > closestAssignmentDueDate;

	if (isAssignmentOverdue)
		return null;

	return _nextAssignment;
}
function getWhenToRemindInSeconds(): number {
	if (settingsData === null)
		return 0;

	const whenToRemindTime: number = Number(settingsData.whenToRemindTimeValue);

	if (settingsData.whenToRemindFormatValue === 'day') {
		return whenToRemindTime * 3600 * 24;
	}
	else if (settingsData.whenToRemindFormatValue === 'hour') {
		return whenToRemindTime * 3600;
	}
	else if (settingsData.whenToRemindFormatValue === 'minute') {
		return whenToRemindTime * 60;
	}

	return 0;
}

async function getSavedSettingsData(): Promise<SettingsData> {
	const defaultSettingsData: SettingsData = getDefaultSettingsData();

	const savedFilepath: string = getSavePath('settings-data.json');
	const savedSettingsData = await SaveManager.getData(savedFilepath) as SettingsData | null;

    if (savedSettingsData === null)
        console.warn('Saved SettingsData is Null!');

	if (savedSettingsData?.version !== defaultSettingsData.version)
		console.warn('Saved Settings Has New Version!')

	const settingsData: SettingsData = { ...defaultSettingsData, ...savedSettingsData };
	return settingsData;
}

 function removeAssignmentsThatHaveBeenRemindedFromUpcomingAssignments(assignmentsThatHaveBeenReminded: Assignment[], upcomingAssignments: Assignment[]) {
	for (const assignmentThatHasBeenReminded of assignmentsThatHaveBeenReminded) {
		for (const upcomingAssignment of upcomingAssignments) {
			
			if (upcomingAssignment.name !== assignmentThatHasBeenReminded.name)
				continue;

			const indexToRemove: number = upcomingAssignments.indexOf(upcomingAssignment);

			if (indexToRemove > -1)
				upcomingAssignments.splice(indexToRemove, 1);
		}	
	}
 }

function getTimeDiffInSeconds(date1: Date, date2: Date): number {
	if (date1 > date2)
		return 0;

    return (date2.getTime() - date1.getTime()) / 1000;
}

 function getTimeTillDueDate(date1: Date, date2: Date): string {
	let secondsDiff = getTimeDiffInSeconds(date1, date2);
	let minuteDiff = secondsDiff / 60;
	let hourDiff = minuteDiff / 60;
	let dateDiff = hourDiff / 24;

	secondsDiff = Math.floor(secondsDiff);
    minuteDiff = Math.floor(minuteDiff);
    hourDiff = Math.floor(hourDiff);
    dateDiff = Math.floor(dateDiff);

    if (dateDiff > 0) {
        if (dateDiff > 1)
            return `Due in ${dateDiff} Days`
        else
            return `Due in 1 Day`
    }

    if (hourDiff > 0) {
        if (hourDiff > 1)
            return `Due in ${hourDiff} Hours`
        else
            return `Due in 1 Hour`
    }

    if (minuteDiff > 0) {
        if (minuteDiff > 1)
            return `Due in ${minuteDiff} Minutes`
        else
            return `Due in 1 Minute`
    }

    if (secondsDiff > 0) {
		return 'Due in Less Than 1 Minute'
        // if (secondsDiff > 1)
        //     return `Due in ${secondsDiff} Seconds`
        // else
        //     return `Due in 1 Second`
    }

    return 'Due Soon'
}

 function getTimeTillDueDateFromSecondsDiff(secondsDiff: number): string {
	let minuteDiff = secondsDiff / 60;
	let hourDiff = minuteDiff / 60;
	let dateDiff = hourDiff / 24;

	secondsDiff = Math.floor(secondsDiff);
    minuteDiff = Math.floor(minuteDiff);
    hourDiff = Math.floor(hourDiff);
    dateDiff = Math.floor(dateDiff);

    if (dateDiff > 0) {
        if (dateDiff > 1)
            return `${dateDiff} Days`
        else
            return `1 Day`
    }

    if (hourDiff > 0) {
        if (hourDiff > 1)
            return `${hourDiff} Hours`
        else
            return `1 Hour`
    }

    if (minuteDiff > 0) {
        if (minuteDiff > 1)
            return `${minuteDiff} Minutes`
        else
            return `1 Minute`
    }

    if (secondsDiff > 0) {
        if (secondsDiff > 1)
            return `${secondsDiff} Seconds`
        else
            return `1 Second`
    }

    return 'Due Soon'
}

function getSecondsToWaitTillNotification(nextAssignmentDueAt: string): number {
	const currentDate = new Date();
	const nextAssignmentDueDate = new Date(nextAssignmentDueAt);

	const timeDiffInSeconds: number = getTimeDiffInSeconds(currentDate, nextAssignmentDueDate);
	const whenToRemindInSeconds: number = getWhenToRemindInSeconds();

	let secondsToWait = timeDiffInSeconds - whenToRemindInSeconds;

	if (secondsToWait < 0)
		secondsToWait = 0;

	return secondsToWait;
}

function getNotification(nextAssignment: Assignment): Notification | null {
	if (nextAssignment.due_at === null)
		return null;

	const currentDate = new Date();
	const nextAssignmentDueDate = new Date(nextAssignment.due_at);

	const timeTillDueDate: string = getTimeTillDueDate(currentDate, nextAssignmentDueDate);

	const notification = new Notification({
		title: `${nextAssignment.name} is ${timeTillDueDate}!`,
		body: 'Click on the Notification to Head to the Posting',
		icon: './assets/images/4k.png',
	}).addListener('click', () => {
		if (nextAssignment === null)
			return;

		openLink(nextAssignment.html_url);
	});

	return notification;
}

function createWorker(filepath: string, messageCallback?: WorkerMessageCallback): Worker {
	const workerScriptPath = path.join(__dirname, filepath);
	const worker = new Worker(workerScriptPath);

	if (messageCallback)
		worker.on('message', messageCallback);

	return worker;
}

// #endregion
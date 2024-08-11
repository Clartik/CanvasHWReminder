import { app, shell, BrowserWindow, ipcMain, dialog, Notification } from 'electron'
import * as path from 'path'
import * as electronReload from 'electron-reload'
import { promisify } from 'util'

import SaveManager from './save-manager'

const sleep = promisify(setTimeout);

let isAppRunning = true;
let isAppReady = false;
let mainWindow: BrowserWindow;

let classes: Array<Class> = [];
let upcomingAssignments: Array<Assignment> = [];
let nextAssignment: Assignment | null = null;
let assignmentsThatHaveBeenReminded: Array<Assignment> = [];

let settingsData: SettingsData | null = loadSettingsData();

(async () => {
	for (let i = 0; i < 10; i++) {
		console.log('Checking!!!');
		classes = getClasses();
		upcomingAssignments = getUpcomingAssignments();

		removeAssignmentsThatHaveBeenRemindedFromUpcomingAssignments();

		nextAssignment = getNextUpcomingAssignment();

		if (nextAssignment === null) {
			await sleep(10 * 1000);
			continue;
		}

		await waitTillNextAssigment();
		await sleep(6 * 1000);
	}
})();

//#region App Setup

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			sandbox: false
		}
	});
	
	mainWindow.loadFile('./pages/loading.html');

	mainWindow.webContents.once('did-finish-load', () => {
		mainWindow.loadFile('./pages/home.html').then(async () => {
			isAppReady = true;
		});
	})
}

app.whenReady().then(() => {
	app.setAppUserModelId('Canvas HW Reminder');		// Windows Specific Command to Show the App Name in Notification
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
	if (process.platform !== 'darwin') {
		isAppRunning = false;
		app.quit()
	}
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
	const filepath = path.join(__dirname, filename);
	return await SaveManager.getData(filepath);
});

ipcMain.handle('writeSavedData', async (event: any, filename: string, data: Object) => {
	const savePath: string = getSavePath(filename);
    return await SaveManager.writeData(savePath, data);
})

ipcMain.handle('getSavedData', async (event: any, filename: string) => {
	const savePath: string = getSavePath(filename);
	return await SaveManager.getData(savePath);
});

ipcMain.handle('getCachedData', (event: any, filename: string) => {
	if (filename === 'classes.json')
		return { classes: classes };

	if (filename === 'settings-data.json')
		return settingsData;

	return null;
});

ipcMain.on('savedSettingsData', (event: Event) => {
	// Update Settings Data to be Latest!
	settingsData = loadSettingsData();
	mainWindow.webContents.send('updateSettingsData', settingsData);
});

//#endregion

//#region Functions

function openLink(url: string) {
	try {
		shell.openExternal(url);
	} catch {
		dialog.showErrorBox('Could Not Open Assignment Post!', 'An Error Occured While Trying to Open the Assignment Post')
	}
}

function getClasses(): Array<Class> {
	const filepath = path.join(__dirname, '../classes.json');
	const classData: ClassData | null = SaveManager.getDataSync(filepath) as ClassData | null;

	if (classData === null) {
		console.error('Class Data is Null!')
		return [];
	}

	return classData.classes;
}

function getUpcomingAssignments(): Array<Assignment> {
	if (classes.length <= 0)
		return [];

	let _upcomingAssignments: Array<Assignment> = [];

	for (let classIndex = 0; classIndex < classes.length; classIndex++) {
		const currentClass = classes[classIndex];

		for (let assignmentIndex = 0; assignmentIndex < currentClass.assignments.length; assignmentIndex++) {
			const currentAssignment = currentClass.assignments[assignmentIndex];
			
			const currentDate = new Date();
			const assignmentDueDate = new Date(currentAssignment.due_date);

			if (assignmentDueDate > currentDate)
				_upcomingAssignments.push(currentAssignment);
		}
	}

	return _upcomingAssignments;
}

function getNextUpcomingAssignment(): Assignment | null {
	if (upcomingAssignments.length === 0)
		return null;

	let _nextAssignment: Assignment = upcomingAssignments[0];
	let closestDueDate = new Date(_nextAssignment.due_date);

	const currentDate = new Date();
	
	for (let i = 0; i < upcomingAssignments.length; i++) {
		const currentAssignment = upcomingAssignments[i];
		const assignmentDueDate = new Date(currentAssignment.due_date);

		if (assignmentDueDate < closestDueDate) {
			closestDueDate = assignmentDueDate;
			_nextAssignment = currentAssignment;
		}
	}
	
	// Check to Ensure that the Closest Due Date is Not Overdue!
	if (currentDate > closestDueDate)
		return null;

	return _nextAssignment;
}

function getTimeDiffInSeconds(date1: Date, date2: Date): number {
	if (date1 > date2)
		return 0;

	const yearDiff = date2.getFullYear() - date1.getFullYear();
	const monthDiff = date2.getMonth() - date1.getMonth();
	const dateDiff = date2.getDate() - date1.getDate();
    const hourDiff = date2.getHours() - date1.getHours();
    const minDiff = date2.getMinutes() - date1.getMinutes();
    const secDiff = date2.getSeconds() - date1.getSeconds();

	return secDiff + (minDiff * 60) + (hourDiff * 3600) + (dateDiff * 3600 * 24) + (monthDiff * 3600 * 24 * 7) + (yearDiff * 3600 * 24 * 7 * 365);
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

function loadSettingsData(): SettingsData | null {
	const savedFilepath: string = getSavePath('settings-data.json');
	let settingsData = SaveManager.getDataSync(savedFilepath) as SettingsData | null;

    if (settingsData === null) {
        console.error('Saved SettingsData is Null! Using Default Settings Data!')

		const localFilePath = path.join(__dirname, '../assets/data/default-settings-data.json');
		settingsData = SaveManager.getDataSync(localFilePath) as SettingsData | null;

		if (settingsData === null)
			return null;
    }

	return settingsData;
}

 function removeAssignmentsThatHaveBeenRemindedFromUpcomingAssignments() {
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

async function waitTillNextAssigment() {
	if (nextAssignment === null)
		return;

	const currentDate = new Date();
	const nextAssignmentDueDate = new Date(nextAssignment.due_date);

	const timeDiffInSeconds: number = getTimeDiffInSeconds(currentDate, nextAssignmentDueDate);
	const whenToRemindInSeconds: number = getWhenToRemindInSeconds();

	let secondsToWait = timeDiffInSeconds - whenToRemindInSeconds;

	if (secondsToWait < 0)
		secondsToWait = 0;

	console.log(`Sleeping for ${secondsToWait} Seconds`);
	await sleep(secondsToWait * 1000);

	while (!isAppReady) {
		await sleep(1);
	}

	let assignment = nextAssignment;
	
	new Notification({
		title: `${assignment.name} is Due Now!`,
		body: 'Click on the Notification to Head to the Posting',
		icon: './assets/images/4k.png',
	}).addListener('click', () => {
		openLink(assignment.posting);
	}).show();

	assignmentsThatHaveBeenReminded.push(nextAssignment);
	console.log(`Removing ${nextAssignment.name} From Upcoming Assignmnets!`);
};

//#endregion
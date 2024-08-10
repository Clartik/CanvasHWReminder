import { app, shell, BrowserWindow, ipcMain, dialog, Notification } from 'electron'
import * as path from 'path'
import * as electronReload from 'electron-reload'
import { promisify } from 'util'

import SaveManager from './save-manager'
import { ClassData, Class, Assignment } from './primitives/class-data'

const sleep = promisify(setTimeout);

let appIsRunning = true;
let mainWindow: BrowserWindow;

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
		mainWindow.loadFile('./pages/home.html');
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
		appIsRunning = false;
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

//#endregion

function openLink(url: string) {
	try {
		shell.openExternal(url);
	} catch {
		dialog.showErrorBox('Could Not Open Assignment Post!', 'An Error Occured While Trying to Open the Assignment Post')
	}
}

const classes: Array<Class> = getClasses();
const upcomingAssignments: Array<Assignment> = getUpcomingAssignments();
const nextAssignment: Assignment | null = getNextUpcomingAssignment();

waitTillNextAssigment();

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
	
	if (currentDate > closestDueDate)
		return null;

	return _nextAssignment;
}

function getSecondsDiff(date1: Date, date2: Date): number {
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

async function waitTillNextAssigment() {
	if (nextAssignment === null)
		return;

	const currentDate = new Date();
	const nextAssignmentDueDate = new Date(nextAssignment.due_date);

	const secondsToWait: number = getSecondsDiff(currentDate, nextAssignmentDueDate);

	console.log(`Sleeping for ${secondsToWait}`);
	await sleep(secondsToWait * 1000);
	
	new Notification({
		title: `${nextAssignment.name} is Due Now!`,
		body: 'Click on the Notification to Head to the Posting',
		icon: './assets/images/4k.png'
	}).addListener('click', () => {
		openLink(nextAssignment.posting);
	}).show();
};
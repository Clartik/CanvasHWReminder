import { app, shell, BrowserWindow, ipcMain, dialog, Notification } from 'electron'
import * as path from 'path'
import * as electronReload from 'electron-reload'
import { promisify } from 'util'

import SaveManager from './save-manager'

import * as CanvasAPI from './Canvas-API/canvas'

const sleep = promisify(setTimeout);

let isAppRunning = true;
let isAppReady = false;
let mainWindow: BrowserWindow | null = null;

let classes: Array<Class> = [];
let upcomingAssignments: Array<Assignment> = [];
let nextAssignment: Assignment | null = null;
let assignmentsThatHaveBeenReminded: Array<Assignment> = [];

let settingsData: SettingsData | null = loadSettingsData();

mainLoop();

// Main Function	
async function mainLoop() {
	try {
		await fetchCanvasDataAndSaveToJSON();
	} catch (error) {
		console.error('Failed to Fetch Data From Canvas', error);
	}

	while (isAppRunning) {
		console.log('Checking!!!');

		const newClasses = await getClasses();

		if (JSON.stringify(newClasses) !== JSON.stringify(classes)) {
			console.log('ClassData Has Changed!')
			classes = newClasses;

			const classData: ClassData = { classes: classes };
			mainWindow?.webContents.send('updateData', 'classes', classData);
		}

		upcomingAssignments = getUpcomingAssignments();

		removeAssignmentsThatHaveBeenRemindedFromUpcomingAssignments();

		nextAssignment = getNextUpcomingAssignment();
		console.log(nextAssignment?.name);

		if (nextAssignment === null) {
			await sleep(60 * 60 * 1000);									// Check every hour for updates!

			try {
				await fetchCanvasDataAndSaveToJSON();
			} catch (error) {
				console.error('Failed to Fetch Data From Canvas', error);
			}
			
			continue;
		}

		await waitTillNextAssigment();
		await sleep(6 * 1000);
	}
};

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
		if (mainWindow === null)
			return;

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

ipcMain.on('updateData', (event: Event, type: string, data: Object | null) => {
	if (type !== 'settings')
		return;

	settingsData = data as SettingsData | null;

	if (mainWindow !== null)
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

async function fetchCanvasDataAndSaveToJSON() {
	if (settingsData === null)
		return;

	console.log('Fetching Data from Canvas!');

	const canvas = new CanvasAPI.Canvas(settingsData.canvasBaseURL, settingsData.canvasAPIToken)
	const courses = await canvas.getCourses('active');

	const classes: Array<Class> = [];

	for (const course of courses) {
		const upcomingAssignments = await course.getAssignments('upcoming', 'due_at');
		const courseAssignments: Assignment[] = [];

		for (const upcomingAssignment of upcomingAssignments) {
			const assignment: Assignment = {
				name: upcomingAssignment.name,
				points: upcomingAssignment.points_possible,
				html_url: upcomingAssignment.html_url,
				is_quiz_assignment: upcomingAssignment.is_quiz_assignment,

				due_at: upcomingAssignment.due_at,
				unlock_at: upcomingAssignment.unlock_at,
				lock_at: upcomingAssignment.lock_at
			}

			courseAssignments.push(assignment);
		}

		const courseNameArray: string[] = course.name.split(" - ", 3);
		let processedCourseName: string;

		if (courseNameArray.length === 3)
			processedCourseName = courseNameArray[0] + ' - ' + courseNameArray[1];
		else
			processedCourseName = course.name;

		const courseClass: Class = {
			name: processedCourseName,
			time_zone: course.time_zone,
			assignments: courseAssignments
		};

		classes.push(courseClass);
	}

	const data: ClassData = {
		classes: classes
	};

	const savePath: string = getSavePath('classes-data.json');
	const success = await SaveManager.writeData(savePath, data);

	if (success)
		console.log('Saved Fetched Class Data!')
	else
		console.error('Failed to Save Fetched Class Data!')
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

	let _upcomingAssignments: Array<Assignment> = [];

	for (let classIndex = 0; classIndex < classes.length; classIndex++) {
		const currentClass = classes[classIndex];

		for (let assignmentIndex = 0; assignmentIndex < currentClass.assignments.length; assignmentIndex++) {
			const currentAssignment = currentClass.assignments[assignmentIndex];

			if (currentAssignment.due_at === null)
				continue;
			
			const currentDate = new Date();
			const assignmentDueDate = new Date(currentAssignment.due_at);

			if (assignmentDueDate > currentDate)
				_upcomingAssignments.push(currentAssignment);
		}
	}

	return _upcomingAssignments;
}

function getUpcomingAssignmentWithDueDate(): Assignment | null {
	for (let i = 0; i < upcomingAssignments.length; i++) {
		const upcomingAssignment = upcomingAssignments[i];
		
		if (upcomingAssignment.due_at === null)
			continue;

		return upcomingAssignment;
	}

	return null;
}

function getNextUpcomingAssignment(): Assignment | null {
	if (upcomingAssignments.length === 0)
		return null;

	let _nextAssignment: Assignment | null = getUpcomingAssignmentWithDueDate();

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

 function getTimeTillDueDate(currentDate: Date, assignmentDueDate: Date): string {
    const dayDiff = assignmentDueDate.getDate() - currentDate.getDate();
    const hourDiff = assignmentDueDate.getHours() - currentDate.getHours();
    const minDiff = assignmentDueDate.getMinutes() - currentDate.getMinutes();
    const secDiff = assignmentDueDate.getSeconds() - currentDate.getSeconds();

    let timeTillDueDate = new Date(currentDate);
    timeTillDueDate.setDate(currentDate.getDate() + dayDiff);
    timeTillDueDate.setHours(currentDate.getHours() + hourDiff);
    timeTillDueDate.setMinutes(currentDate.getMinutes() + minDiff);
    timeTillDueDate.setSeconds(currentDate.getSeconds() + secDiff);

    if (dayDiff > 0) {
        if (dayDiff > 1)
            return `Due in ${dayDiff} Days`
        else
            return `Due in a Day`
    }

    if (hourDiff > 0) {
        if (hourDiff > 1)
            return `Due in ${hourDiff} Hours`
        else
            return `Due in an Hour`
    }

    if (minDiff > 0) {
        if (minDiff > 1)
            return `Due in ${minDiff} Minutes`
        else
            return `Due in a Minute`
    }

    if (secDiff > 0) {
        if (secDiff > 1)
            return `Due in ${secDiff} Seconds`
        else
            return `Due in a Second`
    }

    return 'Due Soon'
}

async function waitTillNextAssigment() {
	if (nextAssignment === null || nextAssignment.due_at === null)
		return;

	const currentDate = new Date();
	const nextAssignmentDueDate = new Date(nextAssignment.due_at);

	const timeDiffInSeconds: number = getTimeDiffInSeconds(currentDate, nextAssignmentDueDate);
	const whenToRemindInSeconds: number = getWhenToRemindInSeconds();

	let secondsToWait = timeDiffInSeconds - whenToRemindInSeconds;

	if (secondsToWait < 0)
		secondsToWait = 0;

	console.log(`Sleeping for ${secondsToWait} Seconds`);
	await sleep(secondsToWait * 1000);

	while (!isAppReady)
		await sleep(1);

	const assignment = nextAssignment;
	const timeTilleDueDate: string = getTimeTillDueDate(currentDate, nextAssignmentDueDate);

	new Notification({
		title: `${assignment.name} is ${timeTilleDueDate}!`,
		body: 'Click on the Notification to Head to the Posting',
		icon: './assets/images/4k.png',
	}).addListener('click', () => {
		openLink(assignment.html_url);
	}).show();

	assignmentsThatHaveBeenReminded.push(nextAssignment);
	console.log(`Removing ${nextAssignment.name} From Upcoming Assignmnets!`);
};

//#endregion
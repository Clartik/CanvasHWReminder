import { app, shell, BrowserWindow, ipcMain, dialog, Notification } from 'electron'
import * as path from 'path'
import * as electronReload from 'electron-reload'
import { promisify } from 'util'
import SaveManager from './save-manager'

const sleep = promisify(setTimeout);

const createWindow = () => {

	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
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
		app.quit()
	}
});

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

checkForAssignments();

async function checkForAssignments() {
	// await sleep(1000);
	// new Notification({
	// 	title: 'Test Title',
	// 	body: 'Test Body',
	// 	icon: './assets/images/4k.png'
	// }).addListener('click', () => {
	// 	console.log('Notification Clicked!')
	// }).show();
};
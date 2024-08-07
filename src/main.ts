import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as electronReload from 'electron-reload'
import { promisify } from 'util'

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

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

app.whenReady().then(createWindow);

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

ipcMain.handle('getLocalData', async (event: any, filename: string) => {
	const filePath = path.join(__dirname, filename);

	try {
		const data = await readFileAsync(filePath, 'utf-8');
		return JSON.parse(data);
	}
	catch (error) {
		console.error(error);
		return null;
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

ipcMain.handle('saveData', async (event: any, filename: string, data: Object) => {
	const savePath: string = getSavePath(filename);
    const formattedData = JSON.stringify(data, null, 2);

	try {
		await writeFileAsync(savePath, formattedData, 'utf-8');
	} catch (error) {
		console.error(error);
		return false;
	}

	return true;
})

ipcMain.handle('readData', async (event: any, filename: string) => {
	const savePath: string = getSavePath(filename);

	try {
		const data = await readFileAsync(savePath, 'utf-8');
		return JSON.parse(data);
	}
	catch (error) {
		console.error(error);
		return null;
	}
});
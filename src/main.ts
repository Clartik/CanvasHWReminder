import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as electronReload from 'electron-reload'

const createWindow = () => {
	const loadingWindow = new BrowserWindow({
		width: 200,
		height: 200,
		transparent: true,
		resizable: false,
		frame: false,
		alwaysOnTop: true,
		hasShadow: false,
		title: "Loading"
	});

	loadingWindow.loadFile("./assets/images/Loading.gif");

	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true,
		// show: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		}
	});
	
	mainWindow.loadFile('./pages/home.html');

	mainWindow.webContents.once('did-finish-load', () => {
		mainWindow.show();
		loadingWindow.close();
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

ipcMain.handle('json:getData', (event: any, filename: string) => {
	const filePath = path.join(__dirname, filename);

	// Read the file asynchronously (non-blocking)
	const data = fs.readFileSync(filePath, 'utf-8');
	const jsonData = JSON.parse(data);
	return jsonData;
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
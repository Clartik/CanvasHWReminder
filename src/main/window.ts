import * as path from 'path';

import { BrowserWindow } from "electron";

import AppInfo from "./interfaces/appInfo";

function createMainWindow(appInfo: AppInfo, htmlPath: string): BrowserWindow {
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		minWidth: 710,
		autoHideMenuBar: true,
		show: true,
		webPreferences: {
			preload: path.join(__baseDir, '../preload/preload.js'),
			nodeIntegration: true
		}
	});
	
	mainWindow.loadFile(htmlPath);

	mainWindow.webContents.once('did-finish-load', () => {
		appInfo.isMainWindowLoaded = true;
	})

	mainWindow.on('close', (event) => {
		if (!appInfo.isRunning)
			return;

		if (!appInfo.isMainWindowHidden && appInfo.settingsData?.minimizeOnClose) {
			event.preventDefault();
			mainWindow?.hide();
			appInfo.isMainWindowHidden = true;
		}
		else if (!appInfo.settingsData?.minimizeOnClose)
			appInfo.isRunning = false;
	});

    return mainWindow;
}

export default createMainWindow;
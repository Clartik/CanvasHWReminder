import * as path from 'path';

import { BrowserWindow } from "electron";

import AppInfo from "./interfaces/appInfo";

function createMainWindow(appInfo: AppInfo): BrowserWindow {
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true,
		show: !appInfo.settingsData?.minimizeOnLaunch,
		webPreferences: {
			preload: path.join(__baseDir, '../preload/preload.js'),
			nodeIntegration: true
		}
	});

	if (appInfo.settingsData?.minimizeOnLaunch)
		appInfo.isMainWindowHidden = true;
	
	mainWindow.loadFile('./pages/home.html');

	mainWindow.webContents.once('did-finish-load', async () => {
		appInfo.isReady = true;
	});

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
import * as path from 'path';

import { app, BrowserWindow } from "electron";

import AppInfo from "./interfaces/appInfo";
import DebugMode from 'src/shared/interfaces/debugMode';
import { getIconPath } from './util/misc';

function createMainWindow(appInfo: AppInfo, debugMode: DebugMode, htmlPath: string): BrowserWindow {
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		minWidth: 710,
		autoHideMenuBar: true,
		title: app.name,
		show: true,
		icon: getIconPath('icon.ico'),
		webPreferences: {
			preload: path.join(__baseDir, '../preload/preload.js'),
			nodeIntegration: true,
			devTools: debugMode.active
		}
	});

	mainWindow.loadFile(htmlPath);
	appInfo.isMainWindowHidden = false;

	mainWindow.webContents.once('did-finish-load', () => {
		appInfo.isMainWindowLoaded = true;
	})

	mainWindow.on('close', () => {
		if (!appInfo.isRunning)
			return;

		if (!appInfo.settingsData) {
			appInfo.isRunning = false;
			return;
		}

		if (!appInfo.isMainWindowHidden && appInfo.settingsData.minimizeOnClose) {
			appInfo.mainWindow = null;
			appInfo.isMainWindowHidden = true;
		}
		else if (!appInfo.settingsData.minimizeOnClose)
			appInfo.isRunning = false;
	});

    return mainWindow;
}

export default createMainWindow;
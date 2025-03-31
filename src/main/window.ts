import * as path from 'path';
import * as fs from 'fs';
import windowStateKeeper from 'electron-window-state';

import * as mainLog from 'electron-log';

import { app, BrowserWindow } from "electron";

import AppInfo from "../interfaces/appInfo";
import DebugMode from '../interfaces/debugMode';
import { getIconPath } from './util/misc';

function createMainWindow(appInfo: AppInfo, debugMode: DebugMode, htmlPath: string): BrowserWindow {
	const mainWindowState = windowStateKeeper({
		defaultWidth: 800,
		defaultHeight: 600
	});

	const preloadPath: string = path.join(__baseDir, '../preload.js');
	const iconPath = getIconPath('icon.ico');

	if (!fs.existsSync(preloadPath))
		mainLog.error(`Filepath for Preload Doesn't Exist! (${preloadPath})`)

	if (!fs.existsSync(iconPath))
		mainLog.error(`Filepath for Icon Doesn't Exist! (${iconPath})`)

	const mainWindow = new BrowserWindow({
		x: mainWindowState.x,
		y: mainWindowState.y,

		width: mainWindowState.width,
		height: mainWindowState.height,

		minWidth: 710,
		
		autoHideMenuBar: true,

		title: app.name,
		show: true,
		icon: iconPath,

		webPreferences: {
			preload: preloadPath,
			nodeIntegration: true,
			devTools: debugMode.active
		}
	});

	mainWindowState.manage(mainWindow);
	
	mainWindow.loadFile(htmlPath);
	appInfo.isMainWindowHidden = false;

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
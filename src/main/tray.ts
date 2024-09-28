import * as path from 'path';

import { app as electronApp, Tray, nativeImage, Menu, BrowserWindow } from 'electron';

import AppInfo from './interfaces/appInfo';
import createMainWindow from './window';
import DebugMode from 'src/shared/interfaces/debugMode';
import { launchMainWindowWithCorrectPage } from './main';

function createSystemTray(appInfo: AppInfo, debugMode: DebugMode): Tray {
	let iconPath: string;
	let trayTitle: string;

	if (appInfo.isDevelopment) {
		iconPath = path.join('./assets/images/icon.ico');
		trayTitle = 'Canvas HW Reminder (DEBUG)'
	}
	else {
		iconPath = path.join('./resources/icon.ico');
		trayTitle = 'Canvas HW Reminder';
	}

	const icon = nativeImage.createFromPath(iconPath);
	const tray = new Tray(icon);
	
	const contextMenu = Menu.buildFromTemplate([
		{ label: trayTitle, type: 'normal', enabled: false },
		{ type: 'separator' },
		{ label: 'Show App', type: 'normal', click: () => {
			if (!appInfo.isMainWindowHidden)
				return;

			if (appInfo.mainWindow !== null)
				return;

			appInfo.isMainWindowHidden = false;
			launchMainWindowWithCorrectPage();
		} },
		// { label: "Don't Check for Today", type: 'checkbox' },
		{ label: 'Quit App', type: 'normal', click: () => {
			appInfo.isRunning = false;
			electronApp.quit();
		} },
	])

	tray.setContextMenu(contextMenu);

	tray.setToolTip(trayTitle);
	tray.setTitle(trayTitle);

	return tray;
}

export default createSystemTray;
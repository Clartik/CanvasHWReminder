import { app as electronApp, Tray, nativeImage, Menu, BrowserWindow } from 'electron';

import AppInfo from './interfaces/appInfo';

function createSystemTray(appInfo: AppInfo, mainWindow: BrowserWindow): Tray {
	const icon = nativeImage.createFromPath('./assets/images/4k.png');
	const tray = new Tray(icon);
	
	const contextMenu = Menu.buildFromTemplate([
		{ label: 'Canvas HW Reminder', type: 'normal', enabled: false },
		{ type: 'separator' },
		{ label: 'Show App', type: 'normal', click: () => {
			if (!appInfo.isMainWindowHidden) return;

			mainWindow.show();
			appInfo.isMainWindowHidden = false;
		} },
		// { label: "Don't Check for Today", type: 'checkbox' },
		{ label: 'Quit App', type: 'normal', click: () => {
			appInfo.isRunning = false;
			electronApp.quit();
		} },
	])

	tray.setContextMenu(contextMenu);

	tray.setToolTip('Canvas HW Reminder');
	tray.setTitle('Canvas HW Reminder');

	return tray;
}

export default createSystemTray;
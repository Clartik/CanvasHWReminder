import { app as electronApp, Tray, nativeImage, Menu, BrowserWindow } from 'electron';

import AppInfo from './interfaces/appInfo';
import createMainWindow from './window';
import DebugMode from 'src/shared/interfaces/debugMode';

function createSystemTray(appInfo: AppInfo, debugMode: DebugMode): Tray {
	const icon = nativeImage.createFromPath('./assets/images/icon.ico');
	const tray = new Tray(icon);
	
	const contextMenu = Menu.buildFromTemplate([
		{ label: 'Canvas HW Reminder', type: 'normal', enabled: false },
		{ type: 'separator' },
		{ label: 'Show App', type: 'normal', click: () => {
			if (!appInfo.isMainWindowHidden)
				return;

			if (appInfo.mainWindow !== null)
				return;

			appInfo.isMainWindowHidden = false;
			appInfo.mainWindow = createMainWindow(appInfo, debugMode, './pages/home.html')
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
import { app as electronApp, Tray, nativeImage, Menu } from 'electron';

import AppInfo from './interfaces/appInfo';
import { launchMainWindowWithCorrectPage, outputAppLog } from './main';

import { getIconPath } from './util/misc';

function showApp(appInfo: AppInfo) {
	if (!appInfo.isMainWindowHidden)
		return;

	if (appInfo.mainWindow !== null)
		return;

	appInfo.isMainWindowHidden = false;
	launchMainWindowWithCorrectPage();
}

function quitApp(appInfo: AppInfo) {
	appInfo.isRunning = false;
	electronApp.quit();
}

function createSystemTray(appInfo: AppInfo): Tray {
	const iconPath: string = getIconPath('icon.ico');
	const trayTitle: string = electronApp.name;

	const icon = nativeImage.createFromPath(iconPath);
	const tray = new Tray(icon);
	
	const contextMenu = Menu.buildFromTemplate([
		{ label: trayTitle, type: 'normal', enabled: false },
		{ type: 'separator' },
		{ label: 'Log to File', type: 'normal', click: async () => await outputAppLog() },
		{ type: 'separator' },
		{ label: 'Show App', type: 'normal', click: () => showApp(appInfo) },
		{ label: 'Quit App', type: 'normal', click: () => quitApp(appInfo) }
	])

	tray.setContextMenu(contextMenu);

	tray.setToolTip(trayTitle);
	tray.setTitle(trayTitle);

	tray.addListener('click', () => showApp(appInfo));

	return tray;
}

export default createSystemTray;
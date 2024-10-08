import { promisify } from 'util'

import { app as electronApp, Tray, nativeImage, Menu } from 'electron';

import AppInfo from './interfaces/appInfo';
import DebugMode from 'src/shared/interfaces/debugMode';
import { launchMainWindowWithCorrectPage, outputAppLog } from './main';

const sleep = promisify(setTimeout);

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

async function emulateDownload(appInfo: AppInfo) {
	for (let i = 0; i < 10; i++) {
		appInfo.mainWindow?.webContents.send('sendDownloadProgress', 'in-progress', i * 10)
		await sleep(1000);
	}
}

function createSystemTray(appInfo: AppInfo, debugMode: DebugMode): Tray {
	const iconPath: string = './assets/images/icon.ico';
	let trayTitle: string;

	if (appInfo.isDevelopment) {
		trayTitle = 'Canvas HW Reminder (DEBUG)'
	}
	else {
		trayTitle = 'Canvas HW Reminder';
	}

	const icon = nativeImage.createFromPath(iconPath);
	const tray = new Tray(icon);
	
	const contextMenu = Menu.buildFromTemplate([
		{ label: trayTitle, type: 'normal', enabled: false },
		{ type: 'separator' },
		{ label: 'Log to File', type: 'normal', click: async () => await outputAppLog() },
		{ type: 'separator' },
		{ label: 'Show App', type: 'normal', click: () => showApp(appInfo) },
		{ label: 'Quit App', type: 'normal', click: () => quitApp(appInfo) },
		{ type: 'separator' },
		{ label: 'Download Available', type: 'normal', click: () => appInfo.mainWindow?.webContents.send('sendDownloadProgress', 'available', 0) },
		{ label: 'Download In-Progress', type: 'normal', click: () =>  emulateDownload(appInfo) },
		{ label: 'Download Complete', type: 'normal', click: () => appInfo.mainWindow?.webContents.send('sendDownloadProgress', 'complete', 100) },
		{ label: 'Download Failed', type: 'normal', click: () => appInfo.mainWindow?.webContents.send('sendDownloadProgress', 'error', 100) },
	])

	tray.setContextMenu(contextMenu);

	tray.setToolTip(trayTitle);
	tray.setTitle(trayTitle);

	tray.addListener('click', () => showApp(appInfo));

	return tray;
}

export default createSystemTray;
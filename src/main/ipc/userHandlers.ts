import { ipcMain, dialog, BrowserWindow  } from "electron";

import AppInfo from "../interfaces/appInfo";
import DebugMode from "../../shared/interfaces/debugMode";
import AppStatus from "../../shared/interfaces/appStatus";

import * as DataUtil from '../util/dataUtil';
import { openLink } from "../util/misc";

import { outputAppLog } from "../main";

function handleUserRequests(appInfo: AppInfo, appStatus: AppStatus, debugMode: DebugMode) {
	ipcMain.on('openLink', (event, url: string) => openLink(url));

	ipcMain.handle('showMessageDialog', (event, options: Electron.MessageBoxOptions) => {
		const mainWindow = BrowserWindow.fromWebContents(event.sender);

		if (!mainWindow)
			return dialog.showMessageBox(options);
		else
			return dialog.showMessageBox(mainWindow, options);
	});

	ipcMain.on('keyPress', async (event, key: string) => {
		switch (key) {
			case 'F1':
				await DataUtil.reloadSettingsData(appInfo, debugMode);
				break;
	
			case 'F5':
				await DataUtil.reloadClassData(appInfo, debugMode);
				break;

			case 'F12':
				await outputAppLog();
				break;
		
			default:
				break;
		}
	});
}

export default handleUserRequests;
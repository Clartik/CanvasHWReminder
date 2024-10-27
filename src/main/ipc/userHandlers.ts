import { ipcMain, dialog, BrowserWindow } from "electron";

import AppInfo from "../interfaces/appInfo";
import DebugMode from "../../shared/interfaces/debugMode";
import AppStatus from "../../shared/interfaces/appStatus";

import * as DataUtil from '../util/dataUtil';
import { openLink } from "../util/misc";

import { appMain, outputAppLog, showUpdateAvailableDialogAndHandleResponse, showUpdateCompleteDialogAndHandleResponse, showUpdateErrorDialogAndHandleResponse } from "../main";
import SettingsData from "src/shared/interfaces/settingsData";
import { createAssignmentContextMenu } from "../menu";

import * as mainLog from 'electron-log';

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

	ipcMain.on('sendAppStatus', (event, status: string, data: object | null) => {
		switch (status) {
			case 'SETUP COMPLETE': {
				appStatus.isSetupNeeded = false;

				const settingsData = data as SettingsData;

				DataUtil.configureAppSettings(settingsData);

				mainLog.log('[Setup]: App Setup is Complete!');

				appMain();
				break;
			}
		
			default:
				break;
		}
	});

	ipcMain.on('launchUpdaterDialog', async (event, type: string) => {
		switch (type) {
			case 'available':
				await showUpdateAvailableDialogAndHandleResponse();
				break;

			case 'complete':
				await showUpdateCompleteDialogAndHandleResponse();
				break;

			case 'error':
				await showUpdateErrorDialogAndHandleResponse();
				break;
		
			default:
				break;
		}
	})

	ipcMain.on('show-context-menu', (event, type: string, data) => {
		if (type === 'assignment') {
			createAssignmentContextMenu(event.sender, data);
		}
	})
}

export default handleUserRequests;
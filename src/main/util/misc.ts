import * as path from 'path';

import { shell, dialog } from 'electron';
import AppInfo from '../interfaces/appInfo';

function openLink(url: string) {
	try {
		shell.openExternal(url);
	} catch {
		dialog.showErrorBox('Could Not Open Assignment Post!', 'An Error Occured While Trying to Open the Assignment Post')
	}
}

function getIconPath(appInfo: AppInfo): string {
	if (appInfo.isDevelopment)
		return './assets/images/icon.ico'
	else
		return path.join(process.resourcesPath, 'icon.ico')
}

export { openLink, getIconPath };
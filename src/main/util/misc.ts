import * as path from 'path';

import { app, shell, dialog } from 'electron';
import * as mainLog from 'electron-log';

function openLink(url: string) {
	try {
		shell.openExternal(url);
	} catch (err) {
		mainLog.error(`Error occured while trying to Open Link (${url}): `, err)
		dialog.showErrorBox('Could Not Open Link!', 'An Error Occured While Trying to Open Link!')
	}
}

function getIconPath(filename: string): string {
	if (!app.isPackaged)
		return `./assets/images/${filename}`
	else
		return path.join(process.resourcesPath, filename)
}

export { openLink, getIconPath };
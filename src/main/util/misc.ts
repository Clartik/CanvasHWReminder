import * as path from 'path';

import { app, shell, dialog } from 'electron';

function openLink(url: string) {
	try {
		shell.openExternal(url);
	} catch {
		dialog.showErrorBox('Could Not Open Assignment Post!', 'An Error Occured While Trying to Open the Assignment Post')
	}
}

function getIconPath(filename: string): string {
	if (!app.isPackaged)
		return `./assets/images/${filename}`
	else
		return path.join(process.resourcesPath, filename)
}

export { openLink, getIconPath };
import * as path from 'path';

import { shell, dialog } from 'electron';

function openLink(url: string) {
	try {
		shell.openExternal(url);
	} catch {
		dialog.showErrorBox('Could Not Open Assignment Post!', 'An Error Occured While Trying to Open the Assignment Post')
	}
}

function getIconPath(isDevelopment: boolean) {
	if (isDevelopment) {
		const iconPath = './assets/images/icon.ico';
		return iconPath;
	}
	else {
		const iconPath = './resources/icon.ico';
		return iconPath;
	}
}

export { openLink, getIconPath };
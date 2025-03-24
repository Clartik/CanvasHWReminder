import * as path from 'path';
import * as os from 'os';

import { app, shell, dialog } from 'electron';

function openLink(url: string) {
	try {
		shell.openExternal(url);
	} catch {
		dialog.showErrorBox('Could Not Open Assignment Post!', 'An Error Occured While Trying to Open the Assignment Post')
	}
}

function getPlatformName(): string {
	const platform: string = os.platform();

	switch (platform) {
		case 'win32':
			return 'windows';

		case 'darwin':
			return 'macos';

		case 'linux':
			return 'linux';
	
		default:
			return 'png';
	}
}

function getIconExt(platform: string): string {
	switch (platform) {
		case 'windows':
			return 'ico';

		case 'macos':
			return 'icns';
	
		default:
			return 'png';
	}
}

function getIconPath(filename: string): string {
	const platform: string = getPlatformName();
	const ext: string = getIconExt(platform);

	if (!app.isPackaged)
		return `./assets/icons/${platform}/${filename}.${ext}`
	else
		return path.join(process.resourcesPath, filename)
}

export { openLink, getIconPath };
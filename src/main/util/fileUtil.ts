import * as path from 'path';

import { app as electronApp } from 'electron';

import SaveManager from "./saveManager";

function getSavePath(filename: string): string {
	const userDataPath: string = electronApp.getPath("userData");
	return `${userDataPath}/${filename}`;
}

function getLocalPath(filename: string): string {
	const filepath = path.join(__baseDir, filename);
	return filepath;
}

async function getSavedData(filename: string): Promise<Object> {
	const savePath: string = getSavePath(filename);
	const data = await SaveManager.getData(savePath);

	return data;
}

async function writeSavedData(filename: string, data: Object): Promise<boolean> {
	const savePath: string = getSavePath(filename);
	const success = await SaveManager.writeData(savePath, data);

	if (success)
		console.log(`Saved ${filename}!`)
	else
		console.error(`Failed to Save ${filename}!`)

	return success;
}

async function getLocalData(filename: string): Promise<Object> {
	const localPath: string = getLocalPath(filename);
	const data = await SaveManager.getData(localPath);

	return data;
}

export { getSavedData, writeSavedData, getLocalData };
import { parentPort } from 'worker_threads'
import { promisify } from 'util'
import * as path from 'path'

import * as CanvasAPI from '../Canvas-API/canvas'
import SaveManager from '../save-manager';

const sleep = promisify(setTimeout);

const checkCanvasTimeInSec: number = 60 * 60;				// Every Hour

let isWorkerRunning: boolean = false;

parentPort?.on('message', async (settingsData: SettingsData | null) => {
    if (settingsData === null) {
        console.error('CheckCanvas DEV Worker: Failed to Start Due to SettingsData Being Null!');
        return;
    }

    isWorkerRunning = true;

    while (isWorkerRunning) {
        console.log('CheckCanvas DEV Worker: Getting Data from Local Canvas Save!');

        let classData: ClassData | null = null;

		const filepath = path.join(__dirname, '../../assets/data/classes-data.json');
		classData = await SaveManager.getData(filepath) as ClassData | null;

        parentPort?.postMessage(classData);

        await sleep(checkCanvasTimeInSec * 1000);
    }
});

parentPort?.on('exit', () => {
    isWorkerRunning = false;
});
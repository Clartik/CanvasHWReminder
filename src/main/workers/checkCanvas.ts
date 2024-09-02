import { parentPort } from 'worker_threads'
import { promisify } from 'util'
import * as path from 'path'

import { net } from 'electron';

import * as CanvasUtil from '../util/canvasUtil';

const sleep = promisify(setTimeout);

const checkCanvasTimeInSec: number = 60 * 60;				// Every Hour
const checkForInternetTimeInSec: number = 60;               // Every Minute

let isWorkerRunning: boolean = false;

parentPort?.on('message', async (settingsData: SettingsData | null) => {
    if (settingsData === null) {
        console.error('[CheckCanvas Worker]: Failed to Start Due to SettingsData Being Null!');
        return;
    }

    isWorkerRunning = true;

    while (isWorkerRunning) {
        if (!net.isOnline()) {
            console.error('[Worker (CheckCanvas)]: No Internet Connection! Trying Again in a Minute!');

            await sleep(checkForInternetTimeInSec * 1000);
            continue;
        }

        console.log('[Worker (CheckCanvas)]: Fetching Data from Canvas!');

        let classData: ClassData | null = null;

        try {
            const courses = await CanvasUtil.getCoursesFromCanvas(settingsData);
            classData = await CanvasUtil.convertToClassData(courses);
        } catch (error) {
            console.error('[Worker (CheckCanvas)]: Failed to Get Class Data From Canvas -', error);
        }

        parentPort?.postMessage(classData);

        await sleep(checkCanvasTimeInSec * 1000);
    }
});

parentPort?.on('exit', () => {
    isWorkerRunning = false;
});
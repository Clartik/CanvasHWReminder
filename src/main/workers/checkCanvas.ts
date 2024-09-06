import { parentPort } from 'worker_threads'
import { promisify } from 'util'
import { FetchError } from 'node-fetch';

import WorkerResult from '../interfaces/workerResult';

import * as CanvasUtil from '../util/canvasUtil';

const sleep = promisify(setTimeout);

const checkCanvasTimeInSec: number = 60 * 60;				// Every Hour

let isWorkerRunning: boolean = false;

parentPort?.on('message', async (settingsData: SettingsData | null) => {
    if (settingsData === null) {
        console.error('[CheckCanvas Worker]: Failed to Start Due to SettingsData Being Null!');
        return;
    }

    isWorkerRunning = true;

    while (isWorkerRunning) {
        console.log('[Worker (CheckCanvas)]: Fetching Data from Canvas!');

        let classData: ClassData | null = null;

        try {
            const courses = await CanvasUtil.getCoursesFromCanvas(settingsData);
            classData = await CanvasUtil.convertToClassData(courses);
        } catch (error) {
            if (error instanceof FetchError) {
                console.error('[Worker (CheckCanvas)]: Failed to Get Class Data Due to No Internet -', error);

                const result: WorkerResult = {
                    data: null,
                    error: 'INTERNET OFFLINE'
                };

                parentPort?.postMessage(result);
                return;
            }

            // if (error instanceof )
            
            console.error('[Worker (CheckCanvas)]: Failed to Get Class Data From Canvas -', error);
        }

        const result: WorkerResult = {
            data: classData,
            error: null
        };

        parentPort?.postMessage(result);

        await sleep(checkCanvasTimeInSec * 1000);
    }
});

parentPort?.on('exit', () => {
    isWorkerRunning = false;
});
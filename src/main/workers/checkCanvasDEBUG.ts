import { parentPort } from 'worker_threads'
import { promisify } from 'util'
import * as path from 'path'

import WorkerResult from '../interfaces/workerResult';

import SaveManager from '../util/saveManager';

const sleep = promisify(setTimeout);

const checkCanvasTimeInSec: number = 60 * 60;				// Every Hour

let isWorkerRunning: boolean = false;

parentPort?.on('message', async () => {
    isWorkerRunning = true;

    while (isWorkerRunning) {
        console.log('[Worker (CheckCanvas DEBUG)]: Getting Data from Local Canvas Save!');

        let classData: ClassData | null = null;

        try {
            const filepath = path.join(__dirname, '../../../assets/data/classes-data.json');
            classData = await SaveManager.getData(filepath) as ClassData | null;
        } catch (error) {
            console.error('[Worker (CheckCanvas DEBUG)]: Failed to Get Class Data From Local Canvas Save -', error);
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
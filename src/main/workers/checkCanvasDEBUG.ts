import { parentPort } from 'worker_threads'
import { promisify } from 'util'
import * as fs from 'fs'

import WorkerResult from '../../interfaces/workerResult';
import { ClassData } from "../../interfaces/classData";

import { FILENAME_CLASS_DATA_JSON } from '../../constants';

import * as mainLog from 'electron-log';

const sleep = promisify(setTimeout);
const readFileAsync = promisify(fs.readFile);

const checkCanvasTimeInSec: number = 60 * 60;				// Every Hour

let isWorkerRunning: boolean = false;

parentPort?.on('message', async (saveDataPath: string) => {
    isWorkerRunning = true;

    while (isWorkerRunning) {
        mainLog.log('[Worker (CheckCanvas DEBUG)]: Getting Data from Local Canvas Save!');

        let classData: ClassData | null = null;

        try {
            const data = await readFileAsync(saveDataPath + '\\' + FILENAME_CLASS_DATA_JSON, 'utf-8');
            classData = JSON.parse(data);
        }
        catch (error) {
            mainLog.error('[Worker (CheckCanvas DEBUG)]: Failed to Get Class Data From Local Canvas Save - ', error);
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
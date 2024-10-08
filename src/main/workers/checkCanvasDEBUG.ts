import { parentPort } from 'worker_threads'
import { promisify } from 'util'

import WorkerResult from '../interfaces/workerResult';
import { ClassData } from "../../shared/interfaces/classData";

import SaveManager from "../util/saveManager"

import { FILENAME_CLASS_DATA_JSON } from '../../shared/constants';

const sleep = promisify(setTimeout);

const checkCanvasTimeInSec: number = 60 * 60;				// Every Hour

let isWorkerRunning: boolean = false;

parentPort?.on('message', async (userDataFilepath: string) => {
    isWorkerRunning = true;

    while (isWorkerRunning) {
        console.log('[Worker (CheckCanvas DEBUG)]: Getting Data from Local Canvas Save!');

        let classData: ClassData | null = null;

        try {
            classData = await SaveManager.getData(userDataFilepath + '\\' + FILENAME_CLASS_DATA_JSON) as ClassData;
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
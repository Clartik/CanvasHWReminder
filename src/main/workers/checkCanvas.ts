import { parentPort } from 'worker_threads'
import { promisify } from 'util'
import { FetchError } from 'node-fetch';

import WorkerResult from '../interfaces/workerResult';

import { ClassData } from "../../shared/interfaces/classData";

import * as CanvasUtil from '../util/canvasUtil';
import CheckCanvasParams from '../interfaces/checkCanvasParams';

const sleep = promisify(setTimeout);

const checkCanvasTimeInSec: number = 60 * 60;				// Every Hour

let isWorkerRunning: boolean = false;

parentPort?.on('message', async (params: CheckCanvasParams) => {
    const canvasBaseURL = params.canvasBaseURL;
    const canvasAPIToken = params.canvasAPIToken;

    isWorkerRunning = true;

    while (isWorkerRunning) {
        console.log('[Worker (CheckCanvas)]: Fetching Data from Canvas!');

        let classData: ClassData | null = null;

        try {
            const courses = await CanvasUtil.getCoursesFromCanvas(canvasBaseURL, canvasAPIToken);
            classData = await CanvasUtil.convertToClassData(courses);
        } catch (error) {
            if (error instanceof FetchError) {
                if (error.type === 'system') {
                    console.error('[Worker (CheckCanvas)]: Failed to Get Class Data Due to No Internet -', error);

                    const result = {
                        data: null,
                        error: 'INTERNET OFFLINE'
                    };

                    parentPort?.postMessage(result);       
                    return;
                }
            }

            console.error('[Worker (CheckCanvas)]: Failed to Get Class Data Due to Invalid Canvas Credentials -', error);

            const result = {
                data: null,
                error: 'INVALID CANVAS CREDENTIALS'
            };

            parentPort?.postMessage(result);
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
import { parentPort } from 'worker_threads'
import { promisify } from 'util'

import WaitOnNotificationParams from '../../interfaces/waitForNotificationParams';
import WorkerResult from '../../interfaces/workerResult';

import * as CourseUtil from '../util/courseUtil';

import * as mainLog from 'electron-log';

const sleep = promisify(setTimeout);

parentPort?.on('message', async (params: WaitOnNotificationParams) => {
	const nextAssignment = params.nextAssignment;
	const settingsData = params.settingsData;

	if (nextAssignment.due_at === null) {
		mainLog.error('[Worker (WaitOnNotification)]: Next Assignment Due At Is NULL!');
		return;
	}

	const secondsToWait: number = CourseUtil.getSecondsToWaitTillNotification(nextAssignment.due_at, settingsData);
	const timeTillDueDate: string = CourseUtil.getTimeTillDueDateFromSecondsDiff(secondsToWait);

	mainLog.log(`[Worker (WaitOnNotification)]: Sleeping for ${timeTillDueDate} Till Notification`);

	await sleep(secondsToWait * 1000);

	const result: WorkerResult = {
		data: nextAssignment,
		error: null
	};

	parentPort?.postMessage(result);
});
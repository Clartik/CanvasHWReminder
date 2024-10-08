import { parentPort } from 'worker_threads'
import { promisify } from 'util'

import WaitOnNotificationParams from '../interfaces/waitForNotificationParams';
import WorkerResult from '../interfaces/workerResult';

import * as CourseUtil from '../util/courseUtil';

const sleep = promisify(setTimeout);

parentPort?.on('message', async (params: WaitOnNotificationParams) => {
	const nextAssignment = params.nextAssignment;
	const settingsData = params.settingsData;

	if (nextAssignment.due_at === null) {
		console.error('[Worker (WaitOnNotification)]: Next Assignment Due At Is NULL!');
		return;
	}

	const secondsToWait: number = CourseUtil.getSecondsToWaitTillNotification(nextAssignment.due_at, settingsData);
	const timeTillDueDate: string = CourseUtil.getTimeTillDueDateFromSecondsDiff(secondsToWait);

	console.log(`[Worker (WaitOnNotification)]: Sleeping for ${timeTillDueDate} Till Notification`);

	await sleep(secondsToWait * 1000);

	const result: WorkerResult = {
		data: nextAssignment,
		error: null
	};

	parentPort?.postMessage(result);
});
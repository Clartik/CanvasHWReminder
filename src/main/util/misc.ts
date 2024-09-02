import { Worker } from 'worker_threads'
import * as path from 'path'

import { shell, dialog } from 'electron';

type WorkerMessageCallback = (data: any) => void;

function openLink(url: string) {
	try {
		shell.openExternal(url);
	} catch {
		dialog.showErrorBox('Could Not Open Assignment Post!', 'An Error Occured While Trying to Open the Assignment Post')
	}
}

function createWorker(filepath: string, messageCallback?: WorkerMessageCallback): Worker {
	const workerScriptPath = path.join(__baseDir, filepath);
	const worker = new Worker(workerScriptPath);

	if (messageCallback)
		worker.on('message', messageCallback);

	return worker;
}

export { openLink, createWorker };
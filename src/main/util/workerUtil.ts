import { Worker } from 'worker_threads'
import * as path from 'path'

function createWorker(filepath: string): Worker {
	const workerScriptPath = path.join(__baseDir, filepath);
	const worker = new Worker(workerScriptPath);
	
	return worker;
}

export { createWorker }
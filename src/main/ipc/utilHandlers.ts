import AppInfo from "../interfaces/appInfo";
import DebugMode from "../../shared/interfaces/debugMode";
import AppStatus from "../../shared/interfaces/appStatus";

import { ipcMain } from "electron";
import { promisify } from 'util'

const sleep = promisify(setTimeout);

function handleUtilRequests(appInfo: AppInfo, appStatus: AppStatus, debugMode: DebugMode) {
    ipcMain.handle('util:sleep', async (event, time_in_ms: number) => {
        return await sleep(time_in_ms);
    });
}

export default handleUtilRequests;
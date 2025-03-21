import AppStatus from "./appStatus";
import AppInfo from "./appInfo";
import DebugMode from "./debugMode";
import SaveData from "./saveData";

interface WorkerInfo {
    readonly checkCanvasWorker: string;
    readonly waitForNotificationWorker: string;
}

interface AppLog extends SaveData {
    readonly appInfo: AppInfo,
    readonly appStatus: AppStatus,
    readonly debugMode: DebugMode,
    readonly workers: WorkerInfo,
}

export default AppLog;
import AppStatus from "./appStatus";
import AppInfo from "./appInfo";
import DebugMode from "./debugMode";

interface WorkerInfo {
    readonly checkCanvasWorker: string;
    readonly waitForNotificationWorker: string;
}

interface AppLog {
    readonly appInfo: AppInfo,
    readonly appStatus: AppStatus,
    readonly debugMode: DebugMode,
    readonly workers: WorkerInfo,
}

export default AppLog;
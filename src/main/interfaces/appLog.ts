import AppStatus from "../../shared/interfaces/appStatus";
import AppInfo from "./appInfo";
import DebugMode from "../../shared/interfaces/debugMode";

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
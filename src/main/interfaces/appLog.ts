import AppStatus from "../../shared/interfaces/appStatus";
import AppInfo from "./appInfo";

interface WorkerInfo {
    readonly checkCanvasWorker: string;
    readonly waitForNotificationWorker: string;
}

interface AppLog {
    readonly appInfo: AppInfo,
    readonly appStatus: AppStatus,
    readonly workers: WorkerInfo,
}

export default AppLog;
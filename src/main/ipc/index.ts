import AppInfo from "../interfaces/appInfo";
import AppStatus from "../../shared/interfaces/appStatus";
import DebugMode from "../../shared/interfaces/debugMode";

import handleFileRequests from "./dataHandlers";
import handleUserRequests from "./userHandlers";

function handleIPCRequests(appInfo: AppInfo, appStatus: AppStatus, debugMode: DebugMode) {
    handleFileRequests(appInfo, appStatus, debugMode);
    handleUserRequests(appInfo, debugMode);
}

export default handleIPCRequests;
import AppInfo from "../interfaces/appInfo";
import DebugMode from "../interfaces/debugMode";

import handleFileRequests from "./dataHandlers";
import handleUserRequests from "./userHandlers";

function handleIPCRequests(appInfo: AppInfo, debugMode: DebugMode) {
    handleFileRequests(appInfo, debugMode);
    handleUserRequests(appInfo, debugMode);
}

export default handleIPCRequests;
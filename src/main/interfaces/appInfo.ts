import { ClassData, Assignment } from "../../shared/interfaces/classData";
import SettingsData from "../../shared/interfaces/settingsData";

interface AppInfo {
	isDevelopment: boolean,

	isRunning: boolean,
	isMainWindowLoaded: boolean,
	isMainWindowHidden: boolean,

	mainWindow: Electron.BrowserWindow | null,
	notification: Electron.Notification | null,

	classData: ClassData | null,
	settingsData: SettingsData | null,

	nextAssignment: Assignment | null,
	assignmentsThatHaveBeenReminded: Array<Assignment>,

	lastCanvasCheckTime: string
}

export default AppInfo;
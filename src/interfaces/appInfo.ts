import { ClassData, Assignment } from "./classData";
import SettingsData from "./settingsData";
import AssignmentSubmittedType from "./assignmentSubmittedType";

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
	assignmentsThatHaveBeenReminded: Assignment[],
	assignmentsToNotRemind: Assignment[],
	assignmentsWithNoSubmissions: Assignment[],
	
	assignmentSubmittedTypes: AssignmentSubmittedType[],

	lastCanvasCheckTime: string
}

export default AppInfo;
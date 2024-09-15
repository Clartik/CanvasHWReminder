import { ClassData, Assignment } from "../../shared/interfaces/classData";
import SettingsData from "../../shared/interfaces/settingsData";

interface AppInfo {
	isRunning: boolean,
	isMainWindowLoaded: boolean,
	isMainWindowHidden: boolean,

	isSetupNeeded: boolean;

	classData: ClassData | null,
	settingsData: SettingsData | null,

	nextAssignment: Assignment | null,
	assignmentsThatHaveBeenReminded: Array<Assignment>,
}

export default AppInfo;
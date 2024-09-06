interface AppInfo {
	isRunning: boolean,
	isMainWindowLoaded: boolean,
	isMainWindowHidden: boolean,

	classData: ClassData | null,
	settingsData: SettingsData | null,

	nextAssignment: Assignment | null,
	assignmentsThatHaveBeenReminded: Array<Assignment>,
}

export default AppInfo;
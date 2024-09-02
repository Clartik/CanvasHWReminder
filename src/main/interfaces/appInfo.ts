interface AppInfo {
	isRunning: boolean,
	isMainWindowHidden: boolean,

	classData: ClassData | null,
	settingsData: SettingsData | null,

	nextAssignment: Assignment | null,
	assignmentsThatHaveBeenReminded: Array<Assignment>,
}

export default AppInfo;
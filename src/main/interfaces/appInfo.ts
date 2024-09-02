interface AppInfo {
	isRunning: boolean,
	isReady: boolean,
	isMainWindowHidden: boolean,

	isWaitingOnNotification: boolean,

	classData: ClassData | null,
	settingsData: SettingsData | undefined,

	nextAssignment: Assignment | null,
	assignmentsThatHaveBeenReminded: Array<Assignment>,
}

export default AppInfo;
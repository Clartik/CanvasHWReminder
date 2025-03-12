interface AppStatus {
	isSetupNeeded: boolean,
	isUpdateAvailable: boolean,

	updateStatus: string,
	
	isOnline: boolean,
	isConnectedToCanvas: boolean
}

export default AppStatus;
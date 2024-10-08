import { dialog } from 'electron';

async function showDownloadAvailableDialog(): Promise<Electron.MessageBoxReturnValue> {
    const response: Electron.MessageBoxReturnValue = await dialog.showMessageBox({
		type: "info",
		title: "Update Available",
		message: "A new version of Canvas HW Reminder is available. Do you want to download now?",
		buttons: ['Yes', 'No']
	});

    return response;
}

async function showDownloadCompleteDialog(): Promise<Electron.MessageBoxReturnValue> {
    const response: Electron.MessageBoxReturnValue = await dialog.showMessageBox({
		type: "info",
		title: "Update Ready",
		message: "The update has downloaded. Would you like to restart the app to apply changes?",
        buttons: ['Yes', 'No']
	});

    return response;
}

async function showDownloadFailedDialog(): Promise<Electron.MessageBoxReturnValue> {
	const response = await dialog.showMessageBox({
		type: "error",
		title: "Download Failed",
		message: "Failed to download update. Would you like to try again?",
		buttons: ['Yes', 'No']
	});

	return response
}


export { showDownloadAvailableDialog, showDownloadCompleteDialog, showDownloadFailedDialog }
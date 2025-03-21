import AppInfoSaveData from "src/interfaces/appInfoData"
import SettingsData from "src/interfaces/settingsData"
import WhatsNew from "src/interfaces/whatsNew"

export function getDefaultSettingsData(dataVersion: string): SettingsData {
	return {
		version: dataVersion,

        whenToRemindTimeValue: '6',
        whenToRemindFormatValue: 'hour',
        howLongPastDueTimeValue: '1',
        howLongPastDueFormatValue: 'hour',

        launchOnStart: true,
        minimizeOnLaunch: true,
        minimizeOnClose: true,

        showExactDueDate: false,
        alwaysExpandAllCourseCards: false,

		dontRemindAssignmentsWithNoSubmissions: false,

        silenceNotifications: false,
        keepNotificationsOnScreen: true,

		autoMarkSubmissions: false
	}
}

export function getDefaultAppInfoSaveData(dataVersion: string): AppInfoSaveData {
	return {
		version: dataVersion,

		assignmentsThatHaveBeenReminded: [],
    	assignmentsNotToRemind: [],
    	assignmentSubmittedTypes: []
	}
}

export function getDefaultWhatsNew(dataVersion: string): WhatsNew {
    return {
        version: dataVersion,
        shown: true
    }
}
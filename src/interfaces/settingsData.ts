import SaveData from "./saveData";

interface SettingsData extends SaveData {
    version: string;

    readonly whenToRemindTimeValue: string;
    readonly whenToRemindFormatValue: string;
    readonly howLongPastDueTimeValue: string;
    readonly howLongPastDueFormatValue: string;

    readonly launchOnStart: boolean;
    readonly minimizeOnLaunch: boolean;
    readonly minimizeOnClose: boolean;

    readonly showExactDueDate: boolean;
    readonly alwaysExpandAllCourseCards: boolean;

    readonly dontRemindAssignmentsWithNoSubmissions: boolean;

    readonly silenceNotifications: boolean;
    readonly keepNotificationsOnScreen: boolean;

    readonly autoMarkSubmissions: boolean;
}

export default SettingsData;
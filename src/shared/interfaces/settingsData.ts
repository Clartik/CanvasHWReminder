interface SettingsData {
    readonly version: string;

    readonly canvasBaseURL: string;
    readonly canvasAPIToken: string;

    readonly whenToRemindTimeValue: string;
    readonly whenToRemindFormatValue: string;
    readonly howLongPastDueTimeValue: string;
    readonly howLongPastDueFormatValue: string;

    readonly launchOnStart: boolean;
    readonly minimizeOnLaunch: boolean;
    readonly minimizeOnClose: boolean;

    readonly showExactDueDate: boolean;
    readonly alwaysExpandAllCourseCards: boolean;
}

export default SettingsData;
import { Assignment } from "./classData";
import SettingsData from "./settingsData";

interface WaitOnNotificationParams {
    nextAssignment: Assignment,
    settingsData: SettingsData
}

export default WaitOnNotificationParams;
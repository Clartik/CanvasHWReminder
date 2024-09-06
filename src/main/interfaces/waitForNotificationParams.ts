import { Assignment } from "../../shared/interfaces/classData";
import SettingsData from "../../shared/interfaces/settingsData";

interface WaitOnNotificationParams {
    nextAssignment: Assignment,
    settingsData: SettingsData
}

export default WaitOnNotificationParams;
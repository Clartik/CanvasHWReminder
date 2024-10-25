import { Assignment } from "src/shared/interfaces/classData";

interface AppInfoSaveData {
    assignmentsThatHaveBeenReminded: Assignment[],
    assignmentsNotToRemind: Assignment[]
}

export default AppInfoSaveData;
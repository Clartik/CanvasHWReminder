import { Assignment } from "./classData";
import AssignmentSubmittedType from "./assignmentSubmittedType";

interface AppInfoSaveData {
    version: string;
    assignmentsThatHaveBeenReminded: Assignment[],
    assignmentsNotToRemind: Assignment[],
    assignmentSubmittedTypes: AssignmentSubmittedType[]
}

export default AppInfoSaveData;
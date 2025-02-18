import { Assignment } from "src/shared/interfaces/classData";
import AssignmentSubmittedType from "./assignmentSubmittedType";

interface AppInfoSaveData {
    assignmentsThatHaveBeenReminded: Assignment[],
    assignmentsNotToRemind: Assignment[],
    assignmentSubmittedTypes: AssignmentSubmittedType[]
}

export default AppInfoSaveData;
import { Assignment } from "src/shared/interfaces/classData";
import AssignmentSubmittedType from "../main/interfaces/assignmentSubmittedType";

interface AppInfoSaveData {
    version: string;
    assignmentsThatHaveBeenReminded: Assignment[],
    assignmentsNotToRemind: Assignment[],
    assignmentSubmittedTypes: AssignmentSubmittedType[]
}

export default AppInfoSaveData;
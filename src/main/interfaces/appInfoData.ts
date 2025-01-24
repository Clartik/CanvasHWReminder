import { Assignment } from "src/shared/interfaces/classData";
import AssignmentSubmissionType from "./assignmentSubmittedType";

interface AppInfoSaveData {
    assignmentsThatHaveBeenReminded: Assignment[],
    assignmentsNotToRemind: Assignment[],
    assignmentSubmittedTypes: AssignmentSubmissionType[]
}

export default AppInfoSaveData;
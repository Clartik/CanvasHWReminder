import { Assignment } from "./classData";

interface ContextMenuParams {
    assignment: Assignment,
    isAssignmentValidForDontRemind: boolean;
    isAssignmentInDontRemind: boolean;
    isAssignmentMarkedAsSubmitted: boolean;
}

interface ContextMenuCommandParams {
    assignment: Assignment
}

export { ContextMenuParams, ContextMenuCommandParams };
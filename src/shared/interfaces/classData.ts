interface ClassData {
    readonly classes: Array<Class>;
}

interface Class {
    readonly name: string;
    readonly time_zone: string;
    readonly assignments: Array<Assignment>;
}

interface Assignment {
    readonly name: string;
    readonly points: Number;
    readonly html_url: string;
    readonly is_quiz_assignment: boolean;
    
    readonly due_at: string | null;
    readonly unlock_at: string | null;
    readonly lock_at: string | null;
}

interface AssignmentElementThatIsDue {
    readonly assignment: Assignment;
    readonly label: HTMLParagraphElement;
}

export { ClassData, Class, Assignment, AssignmentElementThatIsDue }
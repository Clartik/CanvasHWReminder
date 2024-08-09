export interface ClassData {
    readonly classes: Array<Class>;
}

export interface Class {
    readonly name: string;
    readonly professor: string;
    readonly assignments: Array<Assignment>;
}

export interface Assignment {
    readonly name: string;
    readonly points: Number;
    readonly due_date: string;
    readonly posting: string;
}
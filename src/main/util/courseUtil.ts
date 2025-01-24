import DebugMode from "src/shared/interfaces/debugMode";
import { ClassData, Assignment } from "../../shared/interfaces/classData";
import SettingsData from "../../shared/interfaces/settingsData";
import * as mainLog from 'electron-log';
import AssignmentSubmissionType from "../interfaces/assignmentSubmittedType";

function getUpcomingAssignments(classData: ClassData, debugMode: DebugMode): Array<Assignment> {
	if (classData.classes.length <= 0)
		return [];

	const upcomingAssignments: Array<Assignment> = [];

	for (let classIndex = 0; classIndex < classData.classes.length; classIndex++) {
		const currentClass = classData.classes[classIndex];

		for (let assignmentIndex = 0; assignmentIndex < currentClass.assignments.length; assignmentIndex++) {
			const currentAssignment = currentClass.assignments[assignmentIndex];

			if (currentAssignment.is_submitted && debugMode.enableSubmissions)
				continue;

			if (currentAssignment.due_at === null)
				continue;
			
			const currentDate = new Date();
			const assignmentDueDate = new Date(currentAssignment.due_at);

			if (assignmentDueDate > currentDate)
				upcomingAssignments.push(currentAssignment);
		}
	}

	return upcomingAssignments;
}

function getAssignmentWithDueDate(upcomingAssignments: Assignment[]): Assignment | null {
	for (let i = 0; i < upcomingAssignments.length; i++) {
		const upcomingAssignment = upcomingAssignments[i];
		
		if (upcomingAssignment.due_at === null)
			continue;

		return upcomingAssignment;
	}

	return null;
}

function getNextAssignment(upcomingAssignments: Assignment[], debugMode: DebugMode): Assignment | null {
	if (upcomingAssignments.length === 0)
		return null;

	let nextAssignment: Assignment | null = getAssignmentWithDueDate(upcomingAssignments);

	if (nextAssignment === null)
		return null;

	let closestAssignmentDueDate = new Date(nextAssignment.due_at!);
	const currentDate = new Date();
	
	for (let i = 0; i < upcomingAssignments.length; i++) {
		const currentAssignment = upcomingAssignments[i];

		if (currentAssignment.is_submitted && debugMode.enableSubmissions)
			continue;

		if (currentAssignment.due_at === null)
			continue;

		const assignmentDueDate = new Date(currentAssignment.due_at);

		if (assignmentDueDate < closestAssignmentDueDate) {
			closestAssignmentDueDate = assignmentDueDate;
			nextAssignment = currentAssignment;
		}
	}
	
	const isAssignmentOverdue: boolean = currentDate > closestAssignmentDueDate;

	if (isAssignmentOverdue)
		return null;

	return nextAssignment;
}

function getWhenToRemindInSeconds(settingsData: SettingsData): number {
	const whenToRemindTime: number = Number(settingsData.whenToRemindTimeValue);

	if (settingsData.whenToRemindFormatValue === 'day') {
		return whenToRemindTime * 3600 * 24;
	}
	else if (settingsData.whenToRemindFormatValue === 'hour') {
		return whenToRemindTime * 3600;
	}
	else if (settingsData.whenToRemindFormatValue === 'minute') {
		return whenToRemindTime * 60;
	}

	return 0;
}

function filterUpcomingAssignmentsToRemoveRemindedAssignments(upcomingAssignments: Assignment[], assignmentsThatHaveBeenReminded: Assignment[]): Assignment[] {
	for (const assignmentThatHasBeenReminded of assignmentsThatHaveBeenReminded) {
		for (const upcomingAssignment of upcomingAssignments) {
			if (upcomingAssignment.id !== assignmentThatHasBeenReminded.id)
				continue;

			const indexToRemove: number = upcomingAssignments.indexOf(upcomingAssignment);

			if (indexToRemove > -1)
				upcomingAssignments.splice(indexToRemove, 1);
			else
			mainLog.warn('[Main]: Failed to Filter Upcoming Assigments From Assignments That Have Been Reminded');
		}	
	}

	return upcomingAssignments;
}

function filterUpcomingAssignmentsToRemoveAssignmentsToNotRemind(upcomingAssignments: Assignment[], assignmentsToNotRemind: Assignment[]): Assignment[] {
	for (const assignmentNotToRemind of assignmentsToNotRemind) {
		for (const upcomingAssignment of upcomingAssignments) {
			if (upcomingAssignment.id !== assignmentNotToRemind.id)
				continue;

			const indexToRemove: number = upcomingAssignments.indexOf(upcomingAssignment);

			if (indexToRemove > -1)
				upcomingAssignments.splice(indexToRemove, 1);
			else
				mainLog.warn('[Main]: Failed to Filter Upcoming Assigments From Assignments Not To Remind');
		}	
	}

	return upcomingAssignments;
}

function getAssignmentsWithoutSubmissionsRequired(settingsData: SettingsData, classData: ClassData): Assignment[] {
	if (!settingsData.dontRemindAssignmentsWithNoSubmissions)
		return [];

	const assignmentsWithoutSubmissionsRequired: Assignment[] = [];

	for (const currentClass of classData.classes) {
		for (const assignment of currentClass.assignments) {
			if (!assignment.submission_types.includes('none'))
				continue;

			assignmentsWithoutSubmissionsRequired.push(assignment);
		}
	}

	return assignmentsWithoutSubmissionsRequired;
}

function getTimeDiffInSeconds(date1: Date, date2: Date): number {
	if (date1 > date2)
		return 0;

    return (date2.getTime() - date1.getTime()) / 1000;
}

 function getTimeTillDueDate(date1: Date, date2: Date): string {
	let secondsDiff = getTimeDiffInSeconds(date1, date2);
	let minuteDiff = secondsDiff / 60;
	let hourDiff = minuteDiff / 60;
	let dateDiff = hourDiff / 24;

	secondsDiff = Math.floor(secondsDiff);
    minuteDiff = Math.floor(minuteDiff);
    hourDiff = Math.floor(hourDiff);
    dateDiff = Math.floor(dateDiff);

    if (dateDiff > 0) {
        if (dateDiff > 1)
            return `Due in ${dateDiff} Days`
        else
            return `Due in 1 Day`
    }

    if (hourDiff > 0) {
        if (hourDiff > 1)
            return `Due in ${hourDiff} Hours`
        else
            return `Due in 1 Hour`
    }

    if (minuteDiff > 0) {
        if (minuteDiff > 1)
            return `Due in ${minuteDiff} Minutes`
        else
            return `Due in 1 Minute`
    }

    if (secondsDiff > 0) {
		return 'Due in Less Than 1 Minute'
        // if (secondsDiff > 1)
        //     return `Due in ${secondsDiff} Seconds`
        // else
        //     return `Due in 1 Second`
    }

    return 'Due Soon'
}

 function getTimeTillDueDateFromSecondsDiff(secondsDiff: number): string {
	let minuteDiff = secondsDiff / 60;
	let hourDiff = minuteDiff / 60;
	let dateDiff = hourDiff / 24;

	secondsDiff = Math.floor(secondsDiff);
    minuteDiff = Math.floor(minuteDiff);
    hourDiff = Math.floor(hourDiff);
    dateDiff = Math.floor(dateDiff);

    if (dateDiff > 0) {
        if (dateDiff > 1)
            return `${dateDiff} Days`
        else
            return `1 Day`
    }

    if (hourDiff > 0) {
        if (hourDiff > 1)
            return `${hourDiff} Hours`
        else
            return `1 Hour`
    }

    if (minuteDiff > 0) {
        if (minuteDiff > 1)
            return `${minuteDiff} Minutes`
        else
            return `1 Minute`
    }

    if (secondsDiff > 0) {
        if (secondsDiff > 1)
            return `${secondsDiff} Seconds`
        else
            return `1 Second`
    }

    return 'No Time'
}

function getExactDueDate(date1: Date, date2: Date): string {
    const secondsDiff = getTimeDiffInSeconds(date1, date2);
	const minuteDiff = secondsDiff / 60;
	const hourDiff = minuteDiff / 60;
	let dateDiff = hourDiff / 24;

    dateDiff = Math.floor(dateDiff);

    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    const formattedTime: string = timeFormatter.format(date2);

    if (dateDiff > 0) {
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
            month: 'numeric',
            day: "numeric"
        });

        const formattedDate: string = dateFormatter.format(date2);
        return `Due on ${formattedDate} at ${formattedTime}`;
    }
    
    return `Due Today at ${formattedTime}`;
}

function getSecondsToWaitTillNotification(nextAssignmentDueAt: string, settingsData: SettingsData): number {
	const currentDate = new Date();
	const nextAssignmentDueDate = new Date(nextAssignmentDueAt);

	const timeDiffInSeconds: number = getTimeDiffInSeconds(currentDate, nextAssignmentDueDate);
	const whenToRemindInSeconds: number = getWhenToRemindInSeconds(settingsData);

	let secondsToWait = timeDiffInSeconds - whenToRemindInSeconds;

	if (secondsToWait < 0)
		secondsToWait = 0;

	return secondsToWait;
}

function getIndexOfAssignmentFromAssignmentSubmissionTypes(assignmentSubmissionTypes: AssignmentSubmissionType[], assignment: Assignment, is_submitted_filter: boolean): number {
	for (let i = 0; i < assignmentSubmissionTypes.length; i++) {
		const assignmentSubmissionType = assignmentSubmissionTypes[i];

		if (assignmentSubmissionType.assignment.id !== assignment.id)
			continue;
		
		if (is_submitted_filter !== assignmentSubmissionType.mark_as_submitted)
			continue;

		return i;
	}

	return -1;
}

export { getUpcomingAssignments, getNextAssignment, filterUpcomingAssignmentsToRemoveRemindedAssignments, 
	filterUpcomingAssignmentsToRemoveAssignmentsToNotRemind, getTimeTillDueDate, 
	getTimeTillDueDateFromSecondsDiff, getSecondsToWaitTillNotification, getTimeDiffInSeconds, getExactDueDate,
	getAssignmentsWithoutSubmissionsRequired, getIndexOfAssignmentFromAssignmentSubmissionTypes as getIndexOfAssignmentFromAssignmentSubmittedTypes }
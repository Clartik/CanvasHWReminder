import { ClassData, Class, Assignment } from "../../shared/interfaces/classData";
import SettingsData from "../../shared/interfaces/settingsData";

import * as CanvasAPI from '../util/canvasAPI/canvas'

async function getCoursesFromCanvas(canvasBaseURL: string, canvasAPIToken: string): Promise<CanvasAPI.Course[]> {
	const canvas = new CanvasAPI.Canvas(canvasBaseURL, canvasAPIToken)
	const courses = await canvas.getCourses('active');

	return courses;
}

function getCourseNameWithNoCourseCode(courseName: string) {
	const courseNameArray: string[] = courseName.split(" - ", 3);
	let processedCourseName: string;

	if (courseNameArray.length === 3)
		processedCourseName = courseNameArray[0] + ' - ' + courseNameArray[1];
	else
		processedCourseName = courseName;

	return processedCourseName;
}

async function convertToClassData(courses: CanvasAPI.Course[]): Promise<ClassData> {
	const courseClasses: Array<Class> = [];

	for (const course of courses) {
		const upcomingAssignments = await course.getAssignments('upcoming', 'due_at');
		const courseAssignments: Assignment[] = [];

		for (const upcomingAssignment of upcomingAssignments) {
			const assignment: Assignment = {
				id: upcomingAssignment.id,
				name: upcomingAssignment.name,
				points: upcomingAssignment.points_possible,
				html_url: upcomingAssignment.html_url,
				is_quiz_assignment: upcomingAssignment.is_quiz_assignment,

				due_at: upcomingAssignment.due_at,
				unlock_at: upcomingAssignment.unlock_at,
				lock_at: upcomingAssignment.lock_at
			}

			courseAssignments.push(assignment);
		}

		const processedCourseName = getCourseNameWithNoCourseCode(course.name);		

		const courseClass: Class = {
			name: processedCourseName,
			time_zone: course.time_zone,
			assignments: courseAssignments
		};

		courseClasses.push(courseClass);
	}

	const data: ClassData = {
		classes: courseClasses
	};

	return data;
}

export { getCoursesFromCanvas, convertToClassData }
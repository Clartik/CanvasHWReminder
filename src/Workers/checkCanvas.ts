import { parentPort } from 'worker_threads'
import { promisify } from 'util'

import * as CanvasAPI from '../Canvas-API/canvas'

const sleep = promisify(setTimeout);

const checkCanvasTimeInSec: number = 60 * 60;				// Every Hour

let isWorkerRunning: boolean = false;

parentPort?.on('message', async (settingsData: SettingsData | null) => {
    if (settingsData === null) {
        console.log('Check Canvas Worker Failed to Start Due to SettingsData Being Null!');
        return;
    }

    isWorkerRunning = true;

    while (isWorkerRunning) {
        console.log('Fetching Data from Canvas!');

        let classData: ClassData | null = null;

        try {
            const courses: CanvasAPI.Course[] = await getCoursesFromCanvas(settingsData);
            classData = await convertToClassData(courses);
        } catch (error) {
            console.error('Failed to Get Class Data From Canvas', error);
        }

        parentPort?.postMessage(classData);

        await sleep(checkCanvasTimeInSec * 1000);
    }
});

parentPort?.on('exit', () => {
    isWorkerRunning = false;
});

//#region Functions

async function getCoursesFromCanvas(settingsData: SettingsData): Promise<CanvasAPI.Course[]> {
	if (settingsData === null)
		return [];

	const canvas = new CanvasAPI.Canvas(settingsData.canvasBaseURL, settingsData.canvasAPIToken)
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

//#endregion
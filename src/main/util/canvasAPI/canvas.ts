import { getAPI } from './core'

interface CourseData {
    readonly id: number;
    readonly name: string;
    readonly start_at: string;
    readonly course_code: string;
    readonly time_zone: string;
    readonly course_format: string;
    readonly access_restricted_by_date: string;
}

interface AssignmentData {
    readonly id: number;
    readonly description: string;
    readonly due_at: string | null;
    readonly unlock_at: string | null;
    readonly lock_at: string | null;
    readonly points_possible: number;
    readonly course_id: number;
    readonly name: string;
    readonly submission_types: string[];
    readonly due_date_required: boolean;
    readonly is_quiz_assignment: boolean;
    readonly html_url: string;
    readonly has_submitted_submissions: boolean;
    readonly submissions: object | null;
}

class Canvas {
    readonly baseURL: string;
    readonly accessToken: string;

    constructor(baseURL: string, accessToken: string) {
        if (baseURL.includes('api/v1/'))
            console.error('Invalid URL!');

        this.baseURL = baseURL + 'api/v1/';
        this.accessToken = accessToken;
    }

    async getSelf(): Promise<User> {
        const url = this.baseURL + 'users/self'
        return await getAPI(url, this.accessToken) as User;
    }

    async getCourses(enrollment_state?: string, state?: string): Promise<Course[]> {
        const params = new URLSearchParams();

        if (enrollment_state != undefined)
            params.append('enrollment_state', enrollment_state);

        if (state != undefined)
            params.append('state', state);

        const url = this.baseURL + 'courses?' + params.toString();

        const coursesData: CourseData[] = await getAPI(url, this.accessToken);

        const courses: Course[] = [];

        for (const courseData of coursesData) {
            if (courseData.access_restricted_by_date)
                continue;

            const course = new Course(this.baseURL, this.accessToken, courseData)
            courses.push(course);
        }

        return courses;
    }
}

class Course {
    readonly id: number;
    readonly name: string;
    readonly start_at: string;
    readonly course_code: string;
    readonly time_zone: string;
    readonly course_format: string;

    readonly baseURL: string;
    readonly accessToken: string;

    constructor(baseURL: string, accessToken: string, data: CourseData) {
        this.id = data.id;
        this.name = data.name;
        this.start_at = data.start_at;
        this.course_code = data.course_code;
        this.time_zone = data.time_zone;
        this.course_format = data.course_format;

        this.baseURL = baseURL;
        this.accessToken = accessToken;
    }

    async getAssignments(includes?: string[], bucket?: string, order_by?: string): Promise<AssignmentData[]> {
        const params = new URLSearchParams();

        if (includes !== undefined) {
            for (const element of includes) {
                params.append('include', element);
            }
        }

        if (bucket !== undefined)
            params.append('bucket', bucket);

        if (order_by !== undefined)
            params.append('order_by', order_by);

        const url = this.baseURL + `courses/${this.id}/assignments?` + params.toString();

        const assignmentObject: object = await getAPI(url, this.accessToken);

        console.log(assignmentObject);

        return assignmentObject as AssignmentData[];
    }
}

interface User {
    readonly id: number;
    readonly name: string;
    readonly created_at: string;
    readonly sortable_name: string;
    readonly short_name: string;
    readonly avatar_url: string;
    readonly last_name: string;
    readonly first_name: string;
}

export { Canvas, Course, User }
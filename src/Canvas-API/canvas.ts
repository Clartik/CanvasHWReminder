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
}

export class Canvas {
    readonly baseURL: string;
    readonly accessToken: string;

    constructor(baseURL: string, accessToken: string) {
        if (baseURL.includes('api/v1/'))
            console.error('Invalid URL!');

        this.baseURL = baseURL + 'api/v1/';
        this.accessToken = accessToken;
    }

    async getSelf(): Promise<Object> {
        const url = this.baseURL + 'users/self'
        return await getAPI(url, this.accessToken);
    }

    async getCourses(enrollment_state?: string, state?: string): Promise<Course[]> {
        const params = new URLSearchParams();

        if (enrollment_state !== undefined)
            params.append('enrollment_state', enrollment_state);

        if (state !== undefined)
            params.append('state', state);

        const url = this.baseURL + 'courses?' + params.toString();
        const coursesData: CourseData[] = await getAPI(url, this.accessToken);

        const courses: Course[] = [];

        coursesData.forEach(courseData => {
            if (courseData.access_restricted_by_date)
                return;

            const course = new Course(this.baseURL, this.accessToken, courseData)
            courses.push(course);
        });

        return courses;
    }
}

export class Course {
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

    async getAssignments(bucket?: string, order_by?: string): Promise<AssignmentData[]> {
        const params = new URLSearchParams();

        if (bucket !== undefined)
            params.append('bucket', bucket);

        if (order_by !== undefined)
            params.append('order_by', order_by);

        let url = this.baseURL + `courses/${this.id}/assignments?` + params.toString();
        return await getAPI(url, this.accessToken);
    }
}

export class Assignment {
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
    
    readonly baseURL: string;
    readonly accessToken: string;

    constructor(baseURL: string, accessToken: string, data: AssignmentData) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.due_at = data.due_at;
        this.unlock_at = data.unlock_at;
        this.lock_at = data.lock_at;
        this.points_possible = data.points_possible;
        this.course_id = data.course_id;
        this.submission_types = data.submission_types;
        this.due_date_required = data.due_date_required;
        this.is_quiz_assignment = data.is_quiz_assignment;
        this.html_url = data.html_url;

        this.baseURL = baseURL;
        this.accessToken = accessToken;
    }
}
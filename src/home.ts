//#region Interfaces

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

//#endregion

//#region Templates

const CLASS_HEADER_TEMPLATE: string = `
    <span class='class-header'>
        <div class='class-header-arrow'></div>
        <span class='class-header-label'>Class Name</span>
    </span>
`;

const CLASS_BOX_TEMPLATE: string = `
    <ul class='class-box hide'></ul>
`;

const ASSIGNMENT_TEMPLATE: string = `
    <p class='assignment-label'>Assignment Name</p>
    <button class='assignment-btn hide'>Launch Canvas</button>
`;

//#endregion

const containerColumns = document.getElementsByClassName('container-column') as HTMLCollectionOf<HTMLUListElement>;

let classHeaders: HTMLCollectionOf<HTMLSpanElement>;
let classHeadersLabels: HTMLCollectionOf<HTMLSpanElement>;
let classBoxes: HTMLCollectionOf<HTMLUListElement>;

let settingsData: SettingsData | null;

async function sleep(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

// Main Function
(async () => {
    settingsData = await getCachedSettingsData();
    
    const classes = await getClasses();
    loadElementsWithData(classes);
})();

window.api.onUpdateData((type: string, data: Object | null) => {
    if (type === 'classes') {
        const classData = data as ClassData | null;

        console.log('Received Updated ClassData!')

        if (classData !== null) {
            clearElementsFromData();
            loadElementsWithData(classData.classes);
        }
    }

    if (type === 'settings')
        settingsData = data as SettingsData | null;
});

//#region Functions

function createClassItem(): HTMLLIElement {
    let classElement = document.createElement('li');
    classElement.classList.add('class-item');
    classElement.innerHTML = CLASS_HEADER_TEMPLATE + CLASS_BOX_TEMPLATE;
    return classElement;
}

function createAssignmentElement(): HTMLLIElement {
    let assignmentElement = document.createElement('li');
    assignmentElement.innerHTML = ASSIGNMENT_TEMPLATE;
    return assignmentElement;
}

function isInt(n: number): boolean {
    return n % 1 === 0;
}

async function getClasses(): Promise<Class[]> {
    const classData: ClassData | null = await window.api.getSavedData('classes-data.json') as ClassData | null;

    if (classData === null) {
        console.error('Class Data is Null!')
        return [];
    }

    return classData.classes;
}

async function getCachedSettingsData(): Promise<SettingsData | null> {
    const cachedSettingsData = await window.api.getCachedData('settings-data.json') as SettingsData | null;

    if (cachedSettingsData === null) {
        console.error('SettingsData is Null!')
        return null;
    }

    return cachedSettingsData;
}

function loadElementsWithData(classes: Class[]): void {
    generateAllClassItems(classes.length);

    // These Elements Are Not Generated Until After the Previous Function Runs
    classHeaders = document.getElementsByClassName("class-header") as HTMLCollectionOf<HTMLSpanElement>;
    classHeadersLabels = document.getElementsByClassName('class-header-label') as HTMLCollectionOf<HTMLSpanElement>;
    classBoxes = document.getElementsByClassName("class-box") as HTMLCollectionOf<HTMLUListElement>;

    populateClassItemWithData(classes);
    addClickEventsToClassItem();
};

function clearElementsFromData(): void {
    for (const column of containerColumns) {
        column.innerHTML = ''
    }
}

function generateAllClassItems(classAmount: number): void {
    const amountOfClassesInEachColumn = Math.floor(classAmount / 2);        // Round Down Amount
    const isAmountOfClassesOdd = isInt(classAmount / 2) === false;          // Accounts for the Extra

    for (const column of containerColumns) {
        for (let childIndex = 0; childIndex < amountOfClassesInEachColumn; childIndex++) {
            const classItem = createClassItem();
            column.appendChild(classItem);
        }
    }
    
    // If Odd, Add Extra Class to First Column
    if (isAmountOfClassesOdd) {
        const classItem = createClassItem();
        containerColumns[0].appendChild(classItem);
    }
}

function populateClassItemWithData(classes: Array<Class>): void {
    for (let classIndex = 0; classIndex < classes.length; classIndex++) {
        const currentClass: Class = classes[classIndex];

        classHeadersLabels[classIndex].innerHTML = currentClass.name;

        for (const assignment of currentClass.assignments) {
            if (assignment.due_at === null)
                continue;

            const assignmentElement = createAssignmentElement();
            classBoxes[classIndex].append(assignmentElement);

            // Populating Assignment Element With Data
            const timeTillDueDate: string = getTimeTillDueDateFromAssignment(assignment.due_at);

            const assignmentLabel = assignmentElement.querySelector('.assignment-label')! as HTMLParagraphElement;
            assignmentLabel.innerHTML = assignment.name + ' - ' + timeTillDueDate;

            const assignmentButton = assignmentElement.querySelector('.assignment-btn')! as HTMLButtonElement;
            assignmentButton.addEventListener('click', () => {
                window.api.openLink(assignment.html_url);
            })

            const isAssignmentOverdue = timeTillDueDate === 'Overdue';
            if (!isAssignmentOverdue) {
                assignmentButton.classList.remove('hide');
                    
                classHeaders[classIndex].classList.add('active');
                classBoxes[classIndex].classList.remove('hide');
            }
        }

        if (currentClass.assignments.length === 0) {
            const noAssignmentsDueElement = document.createElement('li');
            noAssignmentsDueElement.innerText = 'No Assignments Due'
            classBoxes[classIndex].append(noAssignmentsDueElement);
        }
    }
}

function addClickEventsToClassItem(): void {
    for (let i = 0; i < classHeaders.length; i++) {
        classHeaders[i].addEventListener("click", () => {
            classHeaders[i].classList.toggle('active');
            classHeaders[i].parentElement?.querySelector(".class-box")?.classList.toggle("hide");
        });
    }
}

// Date2 Must Be Larger than Date1!
function getTimeDiffInSeconds(date1: Date, date2: Date): number {
	if (date1 > date2)
		return 0;

	const yearDiff = date2.getFullYear() - date1.getFullYear();
	const monthDiff = date2.getMonth() - date1.getMonth();
	const dateDiff = date2.getDate() - date1.getDate();
    const hourDiff = date2.getHours() - date1.getHours();
    const minDiff = date2.getMinutes() - date1.getMinutes();
    const secDiff = date2.getSeconds() - date1.getSeconds();

	return secDiff + (minDiff * 60) + (hourDiff * 3600) + (dateDiff * 3600 * 24) + (monthDiff * 3600 * 24 * 7) + (yearDiff * 3600 * 24 * 7 * 365);
}

function getHowLongPastDueInSeconds(): number {
	if (settingsData === null)
		return 0;

	const howLongPastDueTime: number = Number(settingsData.howLongPastDueTimeValue);

	if (settingsData.howLongPastDueFormatValue === 'day') {
		return howLongPastDueTime * 3600 * 24;
	}
	else if (settingsData.howLongPastDueFormatValue === 'hour') {
		return howLongPastDueTime * 3600;
	}
	else if (settingsData.howLongPastDueFormatValue === 'minute') {
		return howLongPastDueTime * 60;
	}
    else if (settingsData.howLongPastDueFormatValue === 'never') 
        return -1;

	return 0;
}

function getTimeTillDueDate(currentDate: Date, assignmentDueDate: Date): string {
    const dayDiff = assignmentDueDate.getDate() - currentDate.getDate();
    const hourDiff = assignmentDueDate.getHours() - currentDate.getHours();
    const minDiff = assignmentDueDate.getMinutes() - currentDate.getMinutes();
    const secDiff = assignmentDueDate.getSeconds() - currentDate.getSeconds();

    let timeTillDueDate = new Date(currentDate);
    timeTillDueDate.setDate(currentDate.getDate() + dayDiff);
    timeTillDueDate.setHours(currentDate.getHours() + hourDiff);
    timeTillDueDate.setMinutes(currentDate.getMinutes() + minDiff);
    timeTillDueDate.setSeconds(currentDate.getSeconds() + secDiff);

    if (dayDiff > 0) {
        if (dayDiff > 1)
            return `Due in ${dayDiff} Days`
        else
            return `Due in a Day`
    }

    if (hourDiff > 0) {
        if (hourDiff > 1)
            return `Due in ${hourDiff} Hours`
        else
            return `Due in an Hour`
    }

    if (minDiff > 0) {
        if (minDiff > 1)
            return `Due in ${minDiff} Minutes`
        else
            return `Due in a Minute`
    }

    if (secDiff > 0) {
        if (secDiff > 1)
            return `Due in ${secDiff} Seconds`
        else
            return `Due in a Second`
    }

    return 'Due Soon'
}

function getTimePastDueDate(currentDate: Date, assignmentDueDate: Date): string {
    const timeDiffInSec: number = getTimeDiffInSeconds(assignmentDueDate, currentDate);
    const howLongPastDueInSec: number | null = getHowLongPastDueInSeconds();

    const isHowLongPastDueNever: boolean = howLongPastDueInSec === -1;

    if (isHowLongPastDueNever) {
        const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: "numeric",
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        
        const formattedDueDate: string = dateTimeFormatter.format(assignmentDueDate);
        return `Was Due on ${formattedDueDate}`
    }

    const isTimeDiffWithinHowLongPastDueRange: boolean = timeDiffInSec > 0 && timeDiffInSec <= howLongPastDueInSec;

    if (isTimeDiffWithinHowLongPastDueRange) {
        const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        
        const formattedDueDate: string = dateTimeFormatter.format(assignmentDueDate);
        return `Was Due at ${formattedDueDate}`
    }

    return 'Overdue';
}

function getTimeTillDueDateFromAssignment(DueDate: string): string {
    const currentDate = new Date();
    const assignmentDueDate = new Date(DueDate);
    
    const isAssignmentPastDue = currentDate > assignmentDueDate;

    if (isAssignmentPastDue)
        return getTimePastDueDate(currentDate, assignmentDueDate);
    else
        return getTimeTillDueDate(currentDate, assignmentDueDate);
}

//#endregion
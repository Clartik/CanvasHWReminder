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

interface AssignmentElementThatIsDue {
    readonly assignment: Assignment;
    readonly label: HTMLParagraphElement;
}

interface DebugMode {
	readonly useLocalClassData: boolean;
	readonly devKeybinds: boolean,
	readonly hideSaveSettingsDialog: boolean
}

//#endregion

//#region Templates

const CLASS_HEADER_TEMPLATE: string = `
    <div class='class-header'>
        <div class='class-header-arrow'></div>
        <span class='class-header-label'>Class Name</span>
    </div>
`;

const CLASS_BOX_TEMPLATE: string = `
    <ul class='class-box collapse'></ul>
`;

const ASSIGNMENT_TEMPLATE: string = `
    <p class='assignment-label'>Assignment Name</p>
    <button class='assignment-btn hide'>Launch Canvas</button>
`;

const INFO_WIDGET_NO_CLASSES: string = `
    <h2>No Classes Enrolled</h2>
    <p>Canvas HW Reminder Will Check Every Hour For Updates</p>
`;

const INFO_WIDGET_NO_INTERNET: string = `
    <h2>Not Connected to Internet</h2>
    <p>Please Check Your Connection and Try Again</p>
`;

const INFO_WIDGET_INCORRECT_LOGIN: string = `
    <h2>Could Not Connect to Canvas</h2>
    <p>Please Check Your Base URL or Access Token Are Correct</p>
`;

//#endregion

const classContainer = document.getElementById('class-container') as HTMLDivElement;
const loadingOrErrorContainer = document.getElementById('loading-or-error-container') as HTMLDivElement;
const loadingCircle = document.getElementById('loading-circle') as HTMLImageElement;

let classHeaders: HTMLCollectionOf<HTMLSpanElement>;
let classHeadersLabels: HTMLCollectionOf<HTMLSpanElement>;
let classBoxes: HTMLCollectionOf<HTMLUListElement>;

let isCheckingForUpdates = true;

const checkForUpdatesTimeInSec: number = 60;                // Every Minute

let assignmentElementsThatAreDue: AssignmentElementThatIsDue[] = [];

let settingsData: SettingsData | null;
let homepageDebugMode: DebugMode;


homeMain();

// Main Function
async function homeMain() {
    homepageDebugMode = await window.api.getDebugMode() as DebugMode;
    settingsData = await homepageGetCachedSettingsData();
    
    // const classes: Class[] = await getCachedClasses();

    // if (classes.length === 0) {
    //     loadingCircle.classList.add('hide');
    //     const infoWidget = createInfoWidget(INFO_WIDGET_NO_CLASSES);
    //     loadingOrErrorContainer.append(infoWidget);
    // }

    // loadElementsWithData(classes);

    while (isCheckingForUpdates) {
        const secondsLeft = 60 - new Date().getSeconds();
        await sleep(secondsLeft * 1000);
        console.log('Checking For Any Updates!');

        for (const assignmentElement of assignmentElementsThatAreDue) {
            const assignment: Assignment = assignmentElement.assignment;

            if (assignment.due_at === null)
                break;

            const timeTillDueDate: string = getTimeTillDueDateFromAssignment(assignment.due_at);
            assignmentElement.label.innerHTML = assignment.name + ' - ' + timeTillDueDate;   
        }
    }
};

document.addEventListener('keydown', (event: KeyboardEvent) => {
    switch (event.key) {
        case 'F5':
            window.api.keyPress('F5');
            break;
    
        default:
            break;
    }
})

window.api.onUpdateData((type: string, data: Object | null) => {
    if (type === 'classes') {
        const classData = data as ClassData | null;
        
        if (classData !== null) {
            console.log('Received Updated ClassData!')

            clearLoadingOrErrorContainer();

            if (classData.classes.length === 0) {
                const infoWidget = createInfoWidget(INFO_WIDGET_NO_CLASSES);
                loadingOrErrorContainer.append(infoWidget);
                return;
            }
                
            clearElementsFromData();
            loadElementsWithData(classData.classes);
        }
        else
            console.warn('Received Updated ClassData that is NULL! Homepage Will Not Use it!')
    }

    if (type === 'settings')  {
        settingsData = data as SettingsData | null;

        if (settingsData)
            console.log('Received Updated ClassData!')
    }
});

//#region Functions

async function sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

function createInfoWidget(template?: string): HTMLDivElement {
    const infoWidget = document.createElement('div');
    infoWidget.classList.add('info-widget');
    infoWidget.innerHTML = template ?? '';
    return infoWidget;
}

function createClassItem(): HTMLDivElement {
    let classElement = document.createElement('div');
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

async function getCachedClasses(): Promise<Class[]> {
    const classData: ClassData | null = await window.api.getCachedData('classes-data.json') as ClassData | null;

    if (classData === null) {
        console.error('Class Data is Null!')
        return [];
    }

    return classData.classes;
}

async function homepageGetCachedSettingsData(): Promise<SettingsData | null> {
    const cachedSettingsData = await window.api.getCachedData('settings-data.json') as SettingsData | null;

    if (cachedSettingsData === null) {
        console.error('Cached SettingsData is Null!');
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

function clearLoadingOrErrorContainer(): void {
    loadingOrErrorContainer.innerHTML = ''
}

function clearElementsFromData(): void {
    classContainer.innerHTML = ''
}

function generateAllClassItems(classAmount: number): void {
    for (let childIndex = 0; childIndex < classAmount; childIndex++) {
        const column = document.createElement('div');
        column.classList.add('container-column');
        
        const classItem = createClassItem();
        column.appendChild(classItem);
        classContainer.appendChild(column);
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

            if (timeTillDueDate !== 'Overdue') {
                const assignmentElementThatIsDue: AssignmentElementThatIsDue = {
                    assignment: assignment,
                    label: assignmentLabel
                };
                
                assignmentElementsThatAreDue.push(assignmentElementThatIsDue);
            }

            const assignmentButton = assignmentElement.querySelector('.assignment-btn')! as HTMLButtonElement;
            assignmentButton.addEventListener('click', () => {
                window.api.openLink(assignment.html_url);
            })

            const isAssignmentOverdue = timeTillDueDate === 'Overdue';

            if (!isAssignmentOverdue) {
                assignmentButton.classList.remove('hide');
                    
                classHeaders[classIndex].classList.add('active');
                classBoxes[classIndex].classList.remove('collapse');
                // expandElement(classBoxes[classIndex]);
            }
        }

        if (currentClass.assignments.length === 0) {
            const noAssignmentsDueElement = createAssignmentElement();
            classBoxes[classIndex].append(noAssignmentsDueElement);

            const assignmentLabel = noAssignmentsDueElement.querySelector('.assignment-label')! as HTMLParagraphElement;
            assignmentLabel.innerText = 'No Assignments Due';
        }

        if (settingsData?.alwaysExpandAllCourseCards) {                    
            classHeaders[classIndex].classList.add('active');
            classBoxes[classIndex].classList.remove('collapse');
        }
    }
}

function expandElement(element: HTMLElement) {
    const startHeight = element.scrollHeight; // Get the current height
  
    // Set the height to 0 initially for a clean start
    element.style.height = '0px';

    element.offsetHeight;
  
    // Set the element height to its scrollHeight to expand
    element.style.height = startHeight + 'px';
}
  
function collapseElement(element: HTMLElement) {
    // Get the current height
    const startHeight = element.scrollHeight;

    // Set the height to the current height to start collapsing
    element.style.height = startHeight + 'px';

    element.offsetHeight;

    // Set the height to 0 to collapse
    element.style.height = '0px';
}  

function addClickEventsToClassItem(): void {
    for (let i = 0; i < classHeaders.length; i++) {
        const classHeader = classHeaders[i];
        classHeader.addEventListener("click", async () => {
            classHeader.classList.toggle('active');
            
            const classBox = classHeader.parentElement?.querySelector(".class-box") as HTMLUListElement | null;

            if (!classBox)
                return;

            if (classBox.classList.contains('collapse')) {
                classBox?.classList.remove('collapse');
                // expandElement(classBox);
            }
            else {
                classBox?.classList.add('collapse');
                // collapseElement(classBox);
            }
        });
    }
}

// Date2 Must Be Larger than Date1!
function getTimeDiffInSeconds(date1: Date, date2: Date): number {
	if (date1 > date2)
		return 0;

    return (date2.getTime() - date1.getTime()) / 1000;
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
        return `Due in < 1 Minute`
        // if (secondsDiff > 1)
        //     return `Due in ${secondsDiff} Seconds`
        // else
        //     return `Due in 1 Second`
    }

    return 'Due Soon'
}

function getExactDueDate(date1: Date, date2: Date): string {
    let secondsDiff = getTimeDiffInSeconds(date1, date2);
	let minuteDiff = secondsDiff / 60;
	let hourDiff = minuteDiff / 60;
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
        return `Due on ${formattedDate} ${formattedTime}`;
    }
    
    return `Due at ${formattedTime}`;
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

function getTimeTillDueDateFromAssignment(dueDate: string): string {
    const currentDate = new Date();
    const assignmentDueDate = new Date(dueDate);
    
    const isAssignmentPastDue = currentDate > assignmentDueDate;

    if (isAssignmentPastDue)
        return getTimePastDueDate(currentDate, assignmentDueDate);
    else {
        if (settingsData?.showExactDueDate)
            return getExactDueDate(currentDate, assignmentDueDate);
        
        return getTimeTillDueDate(currentDate, assignmentDueDate);
    }
}

//#endregion
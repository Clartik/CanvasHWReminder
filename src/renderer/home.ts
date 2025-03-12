import AppStatus from "../shared/interfaces/appStatus";
import SettingsData from "../shared/interfaces/settingsData";

import { ClassData, Class, Assignment, AssignmentElementThatIsDue } from "../shared/interfaces/classData";
import { ContextMenuParams, ContextMenuCommandParams } from "src/shared/interfaces/contextMenuParams";
// import DebugMode from "src/shared/interfaces/debugMode";
import AssignmentSubmittedType from "src/main/interfaces/assignmentSubmittedType";

//#region TEMPLATES

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

const INFO_WIDGET_TEMPLATE_NO_CLASSES: string = `
    <h2>No Classes Enrolled</h2>
    <p>Canvas HW Reminder Will Check Every Hour For Updates</p>
`;

const INFO_WIDGET_TEMPLATE_NO_INTERNET_ON_BOOT: string = `
    <h2>Not Connected to Internet</h2>
    <p>Please Check Your Connection and Try Again</p>
`;

const INFO_WIDGET_TEMPLATE_NO_INTERNET_WHILE_RUNNING: string = `
    <h2>No Internet Connection</h2>
    <p>Course/Assignment Info May Not Be Up to Date</p>
`;

const INFO_WIDGET_TEMPLATE_INTERNET_BACK: string = `
    <h2>Connected to Internet</h2>
`;

const INFO_WIDGET_TEMPLATE_CANVAS_INCORRECT_LOGIN: string = `
    <h2>Could Not Connect to Canvas</h2>
    <p>Please Check Your Base URL or Access Token Are Accurate</p>
`;

const INFO_WIDGET_TEMPLATE_CANVAS_LOGIN_SUCCESS: string = `
    <h2>Connected to Canvas</h2>
`;

const LOADING_CIRCLE_TEMPLATE: string = `
    <img id="loading-circle" src="../assets/images/Loading.gif" alt="Loading GIF" width="200px" height="200px">
`;

const BETA_TEXT_TEMPLATE: string = `
    <span class="accent-color bold-text">[</span><span class="bold-text">BETA</span><span class="accent-color bold-text">]</span>
`

//#endregion

const classContainer = document.getElementById('class-container') as HTMLDivElement;
const loadingOrErrorContainer = document.getElementById('loading-or-error-container') as HTMLDivElement;

const updateProgressBar = document.getElementById('update-progress-bar')! as HTMLDivElement;
const updateProgressBarFill = document.getElementById('update-progress-bar-fill')! as HTMLDivElement;
const updateProgressBarLabel = document.getElementById('update-progress-bar-label')! as HTMLParagraphElement;

let classHeaders: HTMLCollectionOf<HTMLSpanElement>;
let classHeadersLabels: HTMLCollectionOf<HTMLSpanElement>;
let classBoxes: HTMLCollectionOf<HTMLUListElement>;

const isCheckingForUpdates = true;

let downloadStatus: string = '';

const checkForUpdatesTimeInSec: number = 60;                // Every Minute

let assignmentElementsThatAreDue: AssignmentElementThatIsDue[] = [];
let assignmentElementsNotToRemind: HTMLLIElement[] = [];
let assignmentSubmittedTypes: AssignmentSubmittedType[] = [];

let settingsData: SettingsData | null;

homeMain();

// Main Function
async function homeMain() {
    settingsData = await homepageGetCachedSettingsData();

    const classData: ClassData | null = await getCachedClassData();
    const appStatus: AppStatus = await window.api.getAppStatus() as AppStatus;

    if (classData !== null) {
        clearLoadingOrErrorContainer();

        if (classData.classes.length === 0) {
            const infoWidget = createInfoWidget(INFO_WIDGET_TEMPLATE_NO_CLASSES);
            loadingOrErrorContainer.append(infoWidget);
        }
    
        loadElementsWithData(classData.classes);
    }

    if (!appStatus.isOnline) {
        clearLoadingOrErrorContainer();

        if (classData === null) {
            const infoWidget = createInfoWidget(INFO_WIDGET_TEMPLATE_NO_INTERNET_ON_BOOT);
            loadingOrErrorContainer.append(infoWidget);
        }
        else {
            const infoWidget = createInfoWidget(INFO_WIDGET_TEMPLATE_NO_INTERNET_WHILE_RUNNING);
            loadingOrErrorContainer.append(infoWidget);
        }
    }

    if (!appStatus.isConnectedToCanvas) {
        clearLoadingOrErrorContainer();

        if (classData !== null)
            classContainer.innerHTML = '';

        const infoWidget = createInfoWidget(INFO_WIDGET_TEMPLATE_CANVAS_INCORRECT_LOGIN);
        loadingOrErrorContainer.append(infoWidget);
    }

    if (appStatus.isUpdateAvailable) {
        let percent: number = 100;

        if (appStatus.updateStatus === 'available')
            percent = 0;
        else if (appStatus.updateStatus === 'in-progress')
            percent = 0;

        showProgressBar(appStatus.updateStatus, percent);
    }

    while (isCheckingForUpdates) {
        const secondsLeftFromAMinute = checkForUpdatesTimeInSec - new Date().getSeconds();
        await window.api.util.sleep(secondsLeftFromAMinute * 1000);
        
        console.log('Checking For Any Updates!');

        for (const assignmentElement of assignmentElementsThatAreDue) {
            const assignment: Assignment = assignmentElement.assignment;

            if (assignment.due_at === null)
                break;

            const timeTillDueDate: string = await getTimeTillDueDateFromAssignment(assignment.due_at);
            assignmentElement.label.innerHTML = assignment.name + ' - ' + timeTillDueDate;   
        }
    }
};

//#region Event Handlers

window.api.onUpdateData((type: string, data: object | null) => {
    if (type === 'classes') {
        const classData = data as ClassData | null;
        
        if (classData !== null) {
            console.log('Received Updated ClassData!');

            clearLoadingOrErrorContainer();

            if (classData.classes.length === 0) {
                const infoWidget = createInfoWidget(INFO_WIDGET_TEMPLATE_NO_CLASSES);
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

window.api.onSendAppStatus(async (status: string) => {
    console.log('Received App Status - ' + status);

    let infoWidget: HTMLDivElement;

    switch (status) {
        case "INTERNET ONLINE":
            clearLoadingOrErrorContainer();

            // Means no classes are in view
            if (classBoxes === undefined) {
                loadingOrErrorContainer.innerHTML = LOADING_CIRCLE_TEMPLATE;
            }
            else {
                const infoWidget = createInfoWidget(INFO_WIDGET_TEMPLATE_INTERNET_BACK);
                loadingOrErrorContainer.appendChild(infoWidget);

                await window.api.util.sleep(2 * 1000);
                clearLoadingOrErrorContainer();
            }
            break;

        case "INTERNET OFFLINE":
            clearLoadingOrErrorContainer();

            // Means no classes are in view
            if (classBoxes === undefined) {
                const infoWidget = createInfoWidget(INFO_WIDGET_TEMPLATE_NO_INTERNET_ON_BOOT)
                loadingOrErrorContainer.appendChild(infoWidget);
            }
            else {
                const infoWidget = createInfoWidget(INFO_WIDGET_TEMPLATE_NO_INTERNET_WHILE_RUNNING)
                loadingOrErrorContainer.appendChild(infoWidget);
            }

            break;

        case "CANVAS LOGIN SUCCESS":
            clearLoadingOrErrorContainer();
            infoWidget = createInfoWidget(INFO_WIDGET_TEMPLATE_CANVAS_LOGIN_SUCCESS);
            loadingOrErrorContainer.appendChild(infoWidget);

            await window.api.util.sleep(2 * 1000);
            clearLoadingOrErrorContainer();

            break;

        case "INVALID CANVAS CREDENTIALS":
            clearLoadingOrErrorContainer();
            infoWidget = createInfoWidget(INFO_WIDGET_TEMPLATE_CANVAS_INCORRECT_LOGIN);
            loadingOrErrorContainer.appendChild(infoWidget);

            break;
    
        default:
            break;
    }
});

window.api.onSendDownloadProgress((status: string, percent: number) => showProgressBar(status, percent))

window.api.onRemoveProgressBarTextLink(() => {
    updateProgressBarLabel.classList.remove('active');
})

window.api.onContextMenuCommand(async (command: string, data: ContextMenuCommandParams) => {
    let assignmentElement: HTMLLIElement | null = null;

    for (const classBox of classBoxes) {
        for (const currentAssignmentElement of classBox.children) {
            const assignmentLabel: HTMLParagraphElement | null = currentAssignmentElement.querySelector('.assignment-label');

            if (!assignmentLabel)
                continue;

            if (!assignmentLabel.innerText.includes(data.assignment.name))
                continue;

            assignmentElement = currentAssignmentElement as HTMLLIElement;
            break;
        }
    }

    if (!assignmentElement)
        return;

    switch (command) {
        case 'do-remind':
        case 'dont-remind':
            toggleRemind(data.assignment, assignmentElement);
            break;

        case 'mark-submit':
        case 'mark-unsubmit':
            await toggleAssignmentElementAsSubmitted(data.assignment, assignmentElement);
            assignmentSubmittedTypes = await window.api.getAssignmentSubmittedTypes() as AssignmentSubmittedType[];
            break;
    
        default:
            break;
    }
})

updateProgressBarLabel.addEventListener('click', () => {
    if (!updateProgressBarLabel.classList.contains('active'))
        return;

    switch (downloadStatus) {
        case 'available':
            window.api.launchUpdaterDialog('available');
            return;

        case 'complete':
            window.api.launchUpdaterDialog('complete');
            return;

        case 'error':
            window.api.launchUpdaterDialog('error');
            return;
    
        default:
            return;
    }
})

//#endregion

//#region Functions

function createInfoWidget(template?: string): HTMLDivElement {
    const infoWidget = document.createElement('div');
    infoWidget.classList.add('info-widget');
    infoWidget.innerHTML = template ?? '';
    return infoWidget;
}

function createClassItem(): HTMLDivElement {
    const classElement = document.createElement('div');
    classElement.classList.add('class-item');
    classElement.innerHTML = CLASS_HEADER_TEMPLATE + CLASS_BOX_TEMPLATE;
    return classElement;
}

function createAssignmentElement(): HTMLLIElement {
    const assignmentElement = document.createElement('li');
    assignmentElement.classList.add('assignment-item');
    assignmentElement.title = "Right click to see how to modify assignment's state"
    assignmentElement.innerHTML = ASSIGNMENT_TEMPLATE;
    return assignmentElement;
}

async function getCachedClassData(): Promise<ClassData | null> {
    const classData: ClassData | null = await window.api.getCachedData('classData') as ClassData | null;

    if (classData === null) {
        console.error('Class Data is Null!')
        return null;
    }

    return classData;
}

async function homepageGetCachedSettingsData(): Promise<SettingsData | null> {
    const cachedSettingsData = await window.api.getCachedData('settingsData') as SettingsData | null;

    if (cachedSettingsData === null) {
        console.error('Cached SettingsData is Null!');
        return null;
    }

    return cachedSettingsData;
}

async function loadElementsWithData(classes: Class[]): Promise<void> {    
    generateAllClassItems(classes.length);

    // These Elements Are Not Generated Until After the Previous Function Runs
    classHeaders = document.getElementsByClassName("class-header") as HTMLCollectionOf<HTMLSpanElement>;
    classHeadersLabels = document.getElementsByClassName('class-header-label') as HTMLCollectionOf<HTMLSpanElement>;
    classBoxes = document.getElementsByClassName("class-box") as HTMLCollectionOf<HTMLUListElement>;

    await populateClassItemWithData(classes);

    const assignmentsNotToRemind = await window.api.getAssignmentsNotToRemind();
    const assignmentsWithNoSubmissions = await window.api.getAssignmentsWithNoSubmissions();

    // Treat Assignments With No Submissions the Same Way as Assignments Not To Remind
    configureAssignmentsRemindStatus(assignmentsNotToRemind);
    configureAssignmentsRemindStatus(assignmentsWithNoSubmissions);

    addClickEventsToClassItem();
};

function clearLoadingOrErrorContainer(): void {
    loadingOrErrorContainer.innerHTML = ''
}

function clearElementsFromData(): void {
    classContainer.innerHTML = ''
    
    assignmentElementsThatAreDue = [];
    assignmentElementsNotToRemind = [];
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

function addContextMenu(assignment: Assignment, assignmentElement: HTMLLIElement) {
    assignmentElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();

        const assignmentLabel = assignmentElement.querySelector('.assignment-label')! as HTMLParagraphElement;
        
        let mark_as_submit = false;

        for (const assignmentSubmissionType of assignmentSubmittedTypes) {
            if (assignmentSubmissionType.assignment.id !== assignment.id)
                continue;

            mark_as_submit = assignmentSubmissionType.mark_as_submitted;
        }

        const isAssignmentValidForDontRemind: boolean = assignmentLabel.innerText !== 'No Assignments Due' || !assignmentLabel.innerText.includes('Overdue');
        const isAssignmentInDontRemind = assignmentElementsNotToRemind.includes(assignmentElement);
        const isAssignmentMarkedAsSubmitted: boolean = assignment.is_submitted && settingsData?.autoMarkSubmissions || mark_as_submit;

        const params: ContextMenuParams = {
            assignment: assignment,
            isAssignmentValidForDontRemind,
            isAssignmentInDontRemind,
            isAssignmentMarkedAsSubmitted
        };

        window.api.showContextMenu('assignment', params);
    });
}

function toggleRemind(assignment: Assignment, assignmentElement: HTMLLIElement) {
    assignmentElement.classList.toggle('dont-remind');

    const isAlreadyUnreminded = assignmentElementsNotToRemind.includes(assignmentElement)

    if (!isAlreadyUnreminded) {
        assignmentElementsNotToRemind.push(assignmentElement);
        console.log(`Assignment (${assignment.name}) Will Not Remind`);

        window.api.disableAssignmentReminder(assignment);
    }
    else {
        const index = assignmentElementsNotToRemind.indexOf(assignmentElement);

        // only splice array when item is found
        if (index <= -1)
            return;

        assignmentElementsNotToRemind.splice(index, 1);
        console.log(`Assignment (${assignment.name}) Will Remind`);

        window.api.enableAssignmentReminder(assignment);
    }
}

interface AssignmentElementInfo {
    element: HTMLLIElement,
    label: HTMLParagraphElement,
    button: HTMLButtonElement,
    assignment: Assignment
}

function getIsAssignmentMarkedAsSubmitted(assignmentSubmittedTypes: AssignmentSubmittedType[], assignment: Assignment): boolean {
    for (const assignmentSubmittedType of assignmentSubmittedTypes) {
        if (assignmentSubmittedType.assignment.id !== assignment.id)
            continue;

        return assignmentSubmittedType.mark_as_submitted;
    }

    return false;
}

async function populateClassItemWithData(classes: Array<Class>): Promise<void> {
    for (let classIndex = 0; classIndex < classes.length; classIndex++) {
        const currentClass: Class = classes[classIndex];

        classHeadersLabels[classIndex].innerHTML = currentClass.name;

        if (settingsData?.alwaysExpandAllCourseCards) {                    
            classHeaders[classIndex].classList.add('active');
            classBoxes[classIndex].classList.remove('collapse');
        }

        if (currentClass.assignments.length === 0) {
            const noAssignmentsDueElement = addNoAssignmentsElement();
            classBoxes[classIndex].append(noAssignmentsDueElement);
            continue;
        }

        let doesClassHaveAssignmentsDue = false;

        assignmentSubmittedTypes = await window.api.getAssignmentSubmittedTypes() as AssignmentSubmittedType[];

        for (const assignment of currentClass.assignments) {
            if (assignment.due_at === null)
                continue;

            const assignmentElement = createAssignmentElement();
            classBoxes[classIndex].append(assignmentElement);

            const assignmentLabel = assignmentElement.querySelector('.assignment-label')! as HTMLParagraphElement;

            const timeTillDueDate: string = await getTimeTillDueDateFromAssignment(assignment.due_at);
            assignmentLabel.innerHTML = assignment.name + ' - ' + timeTillDueDate;

            const assignmentButton = assignmentElement.querySelector('.assignment-btn')! as HTMLButtonElement;
            assignmentButton.addEventListener('click', () => window.api.openLink(assignment.html_url));

            const assignmentElementInfo: AssignmentElementInfo = {
                element: assignmentElement, 
                label: assignmentLabel, 
                button: assignmentButton, 
                assignment: assignment
            }

            const isAssignmentOverdue = timeTillDueDate === 'Overdue';

            if (!isAssignmentOverdue) {
                const is_marked_as_submitted: boolean = getIsAssignmentMarkedAsSubmitted(assignmentSubmittedTypes, assignment);

                addContextMenu(assignment, assignmentElement);

                if (assignment.is_submitted && settingsData?.autoMarkSubmissions || is_marked_as_submitted) {
                    setAssignmentElementAsSubmitted(assignmentElementInfo, is_marked_as_submitted);

                    classHeaders[classIndex].classList.add('active');
                    classBoxes[classIndex].classList.remove('collapse');
                    
                    continue;
                }

                const doesAssignmentHaveNoSubmissionsRequired: boolean = assignment.submission_types.includes('none');

                if (settingsData?.dontRemindAssignmentsWithNoSubmissions && doesAssignmentHaveNoSubmissionsRequired) {
                    setAssignmentElementAsNoSubmissionsRequired(assignmentElementInfo);

                    classHeaders[classIndex].classList.add('active');
                    classBoxes[classIndex].classList.remove('collapse');

                    continue;
                }

                setAssignmentElementAsDue(assignmentElementInfo);

                classHeaders[classIndex].classList.add('active');
                classBoxes[classIndex].classList.remove('collapse');
                
                doesClassHaveAssignmentsDue = true;
            }
            else
                assignmentElement.title = `Assignment's due date has passed`;

            if (assignmentElementsNotToRemind.includes(assignmentElement)) {
                assignmentElement.classList.add('dont-remind');
            }
        }
        
        if (doesClassHaveAssignmentsDue) {
            classHeadersLabels[classIndex].innerHTML += '*';
        }
    }
}

function addNoAssignmentsElement(): HTMLLIElement {
    const noAssignmentsDueElement = createAssignmentElement();
    noAssignmentsDueElement.title = '';
    
    const assignmentLabel = noAssignmentsDueElement.querySelector('.assignment-label')! as HTMLParagraphElement;
    assignmentLabel.innerText = 'No Assignments Due';

    return noAssignmentsDueElement;    
}

function setAssignmentElementAsSubmitted(elementInfo: AssignmentElementInfo, is_manually_marked_as_submitted: boolean) {
    if (is_manually_marked_as_submitted)
        elementInfo.label.innerHTML = elementInfo.assignment.name + ' - Submitted'
    else
        elementInfo.label.innerHTML = elementInfo.assignment.name + ' - Submitted ' + BETA_TEXT_TEMPLATE

    elementInfo.button.classList.add('hide');
    
    elementInfo.element.classList.add('complete');
    elementInfo.button.classList.add('complete');
}

async function toggleAssignmentElementAsSubmitted(assignment: Assignment, assignmentElement: HTMLLIElement) {
    const assignmentLabel = assignmentElement.querySelector('.assignment-label')! as HTMLParagraphElement;
    const assignmentButton = assignmentElement.querySelector('.assignment-btn')! as HTMLButtonElement;

    const isAssignmentMarkedAsSubmitted = assignmentLabel.innerHTML.includes('- Submitted');

    if (!isAssignmentMarkedAsSubmitted) {
        window.api.addAssignmentMarkedAsSubmitted(assignment);
        
        assignmentLabel.innerHTML = assignment.name + ' - Submitted';
        
        assignmentButton.classList.add('hide');

        assignmentElement.classList.add('complete');
        assignmentButton.classList.add('complete');
    } else {
        window.api.addAssignmentMarkedAsUnsubmitted(assignment);

        const assignmentElementInfo: AssignmentElementInfo = {
            element: assignmentElement, 
            label: assignmentLabel, 
            button: assignmentButton, 
            assignment
        }

        assignmentLabel.innerHTML = assignment.name;

        assignmentButton.classList.add('hide');
        
        assignmentElement.classList.remove('complete');
        assignmentButton.classList.remove('complete');

        if (assignment.due_at === null)
            return;
            
        const timeTillDueDate: string = await getTimeTillDueDateFromAssignment(assignment.due_at);
        assignmentLabel.innerHTML = assignment.name + ' - ' + timeTillDueDate;

        const isAssignmentOverdue = timeTillDueDate === 'Overdue';

        if (!isAssignmentOverdue) {
            const doesAssignmentHaveNoSubmissionsRequired: boolean = assignment.submission_types.includes('none');

            if (settingsData?.dontRemindAssignmentsWithNoSubmissions && doesAssignmentHaveNoSubmissionsRequired) {
                setAssignmentElementAsNoSubmissionsRequired(assignmentElementInfo);
                return;
            } 

            setAssignmentElementAsDue(assignmentElementInfo);
        }
        else
            assignmentElement.title = `Assignment's due date has passed`;

        if (assignmentElementsNotToRemind.includes(assignmentElement)) {
            assignmentElement.classList.add('dont-remind');
        }
    }
}

function setAssignmentElementAsNoSubmissionsRequired(elementInfo: AssignmentElementInfo) {
    elementInfo.label.innerHTML = elementInfo.assignment.name + ' - No Submission Required';
    elementInfo.button.classList.remove('hide');    
    elementInfo.element.classList.add('dont-remind');
    
    elementInfo.element.title = "Assignments that don't require submissions aren't reminded";
}

function setAssignmentElementAsDue(elementInfo: AssignmentElementInfo) {    
    const assignmentElementThatIsDue: AssignmentElementThatIsDue = {
        assignment: elementInfo.assignment,
        label: elementInfo.label
    };
    
    assignmentElementsThatAreDue.push(assignmentElementThatIsDue);

    elementInfo.button.classList.remove('hide');
}

function configureAssignmentsRemindStatus(assignmentsNotToRemind: Assignment[]) {
    for (const assignmentNotToRemind of assignmentsNotToRemind) {
        for (const classBox of classBoxes) {
            for (const assignmentElement of classBox.children) {
                const assignmentLabel = assignmentElement.querySelector('.assignment-label')! as HTMLParagraphElement;

                if (!assignmentLabel.innerText.includes(assignmentNotToRemind.name))
                    continue;

                if (assignmentLabel.innerText.includes('Overdue'))
                    continue;

                assignmentElement.classList.add('dont-remind');
                assignmentElementsNotToRemind.push(assignmentElement as HTMLLIElement);
            }
        }   
    }
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
            }
            else {
                classBox?.classList.add('collapse');
            }
        });
    }
}

function showProgressBar(status: string, percent: number) {
    updateProgressBar.classList.remove('hide');
    
    updateProgressBarFill.classList.remove('red');
    updateProgressBarLabel.classList.remove('active');

    downloadStatus = status;
    updateProgressBarFill.style.width = `${percent}%`;

    switch (status) {
        case 'available': 
            updateProgressBarLabel.innerText = `Download Available`
            updateProgressBarLabel.classList.add('active');
            break;

        case 'in-progress':
            updateProgressBarLabel.innerText = `Downloading - ${percent}%`
            break;

        case 'complete': 
            updateProgressBarLabel.innerText = `Download Complete`;
            updateProgressBarLabel.classList.add('active');
            break;

        case 'error':
            updateProgressBarLabel.innerText = `Download Failed`;
            updateProgressBarFill.classList.add('red');
            updateProgressBarLabel.classList.add('active');
            break;
    
        default:
            break;
    }
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

async function getTimeTillDueDate(date1: Date, date2: Date): Promise<string> {
    let secondsDiff = await window.api.getTimeDiffInSeconds(date1, date2);

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
    }

    return 'Due Soon'
}

async function getExactDueDate(date1: Date, date2: Date): Promise<string> {
    const secondsDiff = await window.api.getTimeDiffInSeconds(date1, date2);
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

async function getTimePastDueDate(currentDate: Date, assignmentDueDate: Date): Promise<string> {
    const timeDiffInSec: number = await window.api.getTimeDiffInSeconds(assignmentDueDate, currentDate);
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
        return `Was due on ${formattedDueDate}`
    }

    const isTimeDiffWithinHowLongPastDueRange: boolean = timeDiffInSec > 0 && timeDiffInSec <= howLongPastDueInSec;

    if (isTimeDiffWithinHowLongPastDueRange) {
        const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        
        const formattedDueDate: string = dateTimeFormatter.format(assignmentDueDate);
        return `Was due at ${formattedDueDate}`
    }

    return 'Overdue';
}

async function getTimeTillDueDateFromAssignment(dueDate: string): Promise<string> {
    const currentDate = new Date();
    const assignmentDueDate = new Date(dueDate);
    
    const isAssignmentPastDue = currentDate > assignmentDueDate;

    if (isAssignmentPastDue)
        return await getTimePastDueDate(currentDate, assignmentDueDate);
    else {
        if (settingsData?.showExactDueDate)
            return await getExactDueDate(currentDate, assignmentDueDate);
        
        return await getTimeTillDueDate(currentDate, assignmentDueDate);
    }
}

//#endregion
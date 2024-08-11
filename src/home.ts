//#region Interfaces

interface ClassData {
    readonly classes: Array<Class>;
}

interface Class {
    readonly name: string;
    readonly professor: string;
    readonly assignments: Array<Assignment>;
}

interface Assignment {
    readonly name: string;
    readonly points: Number;
    readonly due_date: string;
    readonly posting: string;
}

//#endregion

const classColumns = document.getElementsByClassName('class-column') as HTMLCollectionOf<HTMLUListElement>;

let dropdownHeaders: HTMLCollectionOf<HTMLSpanElement>;
let dropdownHeadersLabel: HTMLCollectionOf<HTMLSpanElement>;
let dropdownBoxes: HTMLCollectionOf<HTMLUListElement>;

let settingsData: SettingsData | null;

//#region Templates

const DROPDOWN_HEADER_TEMPLATE: string = `
    <span class='dropdown-header'>
        <div class='dropdown-header-arrow'></div>
        <span class='dropdown-header-label'>Class Name</span>
    </span>
`;

const DROPDOWN_BOX_TEMPLATE: string = `
    <ul class='dropdown-box hide'></ul>
`;

const ASSIGNMENT_ITEM_TEMPLATE: string = `
    <p class='assignment-label'>Assignment Name</p>
    <button class='assignment-btn hide'>Launch Canvas</button>
`;

//#endregion

loadClassDataAndPopulateElements();
loadCachedSettingsData();

async function loadClassDataAndPopulateElements() {
    const classData: ClassData | null = await window.api.getLocalData('../classes.json') as ClassData | null;

    if (classData === null) {
        console.error('Class Data is Null!')
        return;
    }

    const classes = classData.classes;

    generateDropdownElements(classes);

    dropdownHeaders = document.getElementsByClassName("dropdown-header") as HTMLCollectionOf<HTMLSpanElement>;
    dropdownHeadersLabel = document.getElementsByClassName('dropdown-header-label') as HTMLCollectionOf<HTMLSpanElement>;
    dropdownBoxes = document.getElementsByClassName("dropdown-box") as HTMLCollectionOf<HTMLUListElement>;

    populateDropdownElementsWithData(classes);
    addDropdownEventListeners();
};

async function loadCachedSettingsData() {
    settingsData = await window.api.getCachedData('settings-data.json') as SettingsData | null;

    if (settingsData === null) {
        console.error('SettingsData is Null!')
        return;
    }
}

window.api.onUpdateSettingsData((_settingsData: Object | null) => {
    settingsData = _settingsData as SettingsData | null;
});

function isInt(n: number): boolean {
    return n % 1 === 0;
}

function createClassElement(): HTMLLIElement {
    let classElement = document.createElement('li');
    classElement.classList.add('class-item');
    classElement.innerHTML = DROPDOWN_HEADER_TEMPLATE + DROPDOWN_BOX_TEMPLATE;
    return classElement;
}

function createAssignmentElement(): HTMLLIElement {
    let assignmentElement = document.createElement('li');
    assignmentElement.innerHTML = ASSIGNMENT_ITEM_TEMPLATE;
    return assignmentElement;
}

function generateDropdownElements(classes: Array<Class>): void {
    const amountOfChildrenInEachColumn = Math.floor(classes.length / 2);
    const isAmountOfChildrenOdd = isInt(classes.length / 2) === false;

    for (let columnIndex = 0; columnIndex < classColumns.length; columnIndex++) {
        for (let childIndex = 0; childIndex < amountOfChildrenInEachColumn; childIndex++) {
            let classElement = createClassElement();
            classColumns[columnIndex].appendChild(classElement);
        }
    }
    
    if (isAmountOfChildrenOdd) {
        let classElement = createClassElement();
        classColumns[0].appendChild(classElement);
    }
}

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

function getHowLongPastDueInSeconds(): number | null {
	if (settingsData === null)
		return 30 * 60;             // Default is 30 Mins

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
        return null;

	return 0;
}

function getFormattedDueDate(dueDate: Date): string {
    const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
    
    const dueDateFormatted: string = dateTimeFormatter.format(dueDate);
    return `Due at ${dueDateFormatted}`
}

function getTimeTillAssignmentDueDate(assignment: Assignment): string {
    let currentDate = new Date();
    let assignmentDueDate = new Date(assignment.due_date);
    
    if (currentDate > assignmentDueDate) {
        const timeDiffInSec: number = getTimeDiffInSeconds(assignmentDueDate, currentDate);
        const howLongPastDueInSec: number | null = getHowLongPastDueInSeconds();

        if (howLongPastDueInSec === null) {
            const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: "numeric",
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            });
            
            const dueDateFormatted: string = dateTimeFormatter.format(assignmentDueDate);
            return `Was Due on ${dueDateFormatted}`
        }

        if (timeDiffInSec > 0 && timeDiffInSec <= howLongPastDueInSec) {
            const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            });
            
            const dueDateFormatted: string = dateTimeFormatter.format(assignmentDueDate);
            return `Was Due at ${dueDateFormatted}`
        }

        return 'Overdue';
    }

    const dayDiff: number = assignmentDueDate.getDate() - currentDate.getDate();
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

    return 'Overdue'
}

function populateDropdownElementsWithData(classes: Array<Class>): void {
    for (let classIndex = 0; classIndex < classes.length; classIndex++) {
        if (dropdownHeadersLabel[classIndex].innerHTML !== null)
            dropdownHeadersLabel[classIndex].innerHTML = classes[classIndex].name;

        for (let assignmentIndex = 0; assignmentIndex < classes[classIndex].assignments.length; assignmentIndex++) {
            let assignmentElement = createAssignmentElement();
            dropdownBoxes[classIndex].append(assignmentElement);

            let timeTillDueDate = getTimeTillAssignmentDueDate(classes[classIndex].assignments[assignmentIndex]);
            
            let assignmentLabel = assignmentElement.querySelector('.assignment-label');
            if (assignmentLabel !== null) {
                assignmentLabel.innerHTML = classes[classIndex].assignments[assignmentIndex].name;

                assignmentLabel.innerHTML += ` - ${timeTillDueDate}`
            }

            let assignmentButton = assignmentElement.querySelector('.assignment-btn');
            if (assignmentButton !== null) {
                assignmentButton.addEventListener('click', () => {
                    window.api.openLink(classes[classIndex].assignments[assignmentIndex].posting);
                })

                if (timeTillDueDate !== 'Overdue') {
                    assignmentButton.classList.remove('hide');
                    
                    dropdownHeaders[classIndex].classList.add('active');
                    dropdownBoxes[classIndex].classList.remove('hide');
                }
            }
        }
    }
}

function addDropdownEventListeners(): void {
    for (let i = 0; i < dropdownHeaders.length; i++) {
        dropdownHeaders[i].addEventListener("click", () => {
            dropdownHeaders[i].classList.toggle('active');
            dropdownHeaders[i].parentElement?.querySelector(".dropdown-box")?.classList.toggle("hide");
        });
    }
}
let classColumns = document.getElementsByClassName('class-column');
let dropdownHeaders: HTMLCollectionOf<Element>;
let dropdownHeadersLabel: HTMLCollectionOf<Element>;
let dropdownBoxes: HTMLCollectionOf<Element>;

function isInt(n: number): boolean {
    return n % 1 === 0;
}

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

function generateDropdownElements(classes: Array<Class>) {
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
function populateDropdownElementsWithData(classes: Array<Class>) {
    for (let i = 0; i < classes.length; i++) {
        if (dropdownHeadersLabel[i].innerHTML !== null)
            dropdownHeadersLabel[i].innerHTML = classes[i].name;

        for (let assignmentIndex = 0; assignmentIndex < classes[i].assignments.length; assignmentIndex++) {
            let assignmentElement = createAssignmentElement();
            dropdownBoxes[i].append(assignmentElement);

            let assignmentLabel = assignmentElement.querySelector('.assignment-label');
            if (assignmentLabel !== null)
                assignmentLabel.innerHTML = classes[i].assignments[assignmentIndex].name;
        }
    }
}

function addDropdownEventListeners() {
    for (let i = 0; i < dropdownHeaders.length; i++) {
        dropdownHeaders[i].addEventListener("click", () => {
            console.log(dropdownHeaders[i]);
            dropdownHeaders[i].classList.toggle('active');
            dropdownHeaders[i].parentElement?.querySelector(".dropdown-box")?.classList.toggle("hide");
        });
    }
}

(async () => {
    const classData: ClassData = await window.api.getJSONData('../classes.json');
    const classes = classData.classes;

    generateDropdownElements(classes);

    dropdownHeaders = document.getElementsByClassName("dropdown-header");
    dropdownHeadersLabel = document.getElementsByClassName('dropdown-header-label');
    dropdownBoxes = document.getElementsByClassName("dropdown-box");

    populateDropdownElementsWithData(classes);
    addDropdownEventListeners();
})();

interface Assignment {
    readonly name: string;
    readonly points: Number;
    readonly due_date: string;
}

interface Class {
    readonly name: string;
    readonly professor: string;
    readonly assignments: Array<Assignment>;
}

interface ClassData {
    readonly classes: Array<Class>;
}
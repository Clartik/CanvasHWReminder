"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let classColumns = document.getElementsByClassName('class-column');
let dropdownHeaders;
let dropdownHeadersLabel;
let dropdownBoxes;
const DROPDOWN_HEADER_TEMPLATE = `
    <span class='dropdown-header'>
        <div class='dropdown-header-arrow'></div>
        <span class='dropdown-header-label'>Class Name</span>
    </span>
`;
const DROPDOWN_BOX_TEMPLATE = `
    <ul class='dropdown-box hide'></ul>
`;
const ASSIGNMENT_ITEM_TEMPLATE = `
    <p class='assignment-label'>Assignment Name</p>
    <button class='assignment-btn hide'>Launch Canvas</button>
`;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const classData = yield window.api.getJSONData('../classes.json');
    const classes = classData.classes;
    generateDropdownElements(classes);
    dropdownHeaders = document.getElementsByClassName("dropdown-header");
    dropdownHeadersLabel = document.getElementsByClassName('dropdown-header-label');
    dropdownBoxes = document.getElementsByClassName("dropdown-box");
    populateDropdownElementsWithData(classes);
    addDropdownEventListeners();
}))();
function isInt(n) {
    return n % 1 === 0;
}
function createClassElement() {
    let classElement = document.createElement('li');
    classElement.classList.add('class-item');
    classElement.innerHTML = DROPDOWN_HEADER_TEMPLATE + DROPDOWN_BOX_TEMPLATE;
    return classElement;
}
function createAssignmentElement() {
    let assignmentElement = document.createElement('li');
    assignmentElement.innerHTML = ASSIGNMENT_ITEM_TEMPLATE;
    return assignmentElement;
}
function generateDropdownElements(classes) {
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
function getTimeTillAssignmentDueDate(assignment) {
    let currentDate = new Date();
    let assignmentDueDate = new Date(assignment.due_date);
    if (currentDate > assignmentDueDate)
        return 'Overdue';
    let dayDiff = assignmentDueDate.getDate() - currentDate.getDate();
    let hourDiff = assignmentDueDate.getHours() - currentDate.getHours();
    let minDiff = assignmentDueDate.getMinutes() - currentDate.getMinutes();
    let secDiff = assignmentDueDate.getSeconds() - currentDate.getSeconds();
    let timeTillDueDate = new Date(currentDate);
    timeTillDueDate.setDate(currentDate.getDate() + dayDiff);
    timeTillDueDate.setHours(currentDate.getHours() + hourDiff);
    timeTillDueDate.setMinutes(currentDate.getMinutes() + minDiff);
    timeTillDueDate.setSeconds(currentDate.getSeconds() + secDiff);
    if (dayDiff > 0) {
        if (dayDiff > 1)
            return `Due in ${dayDiff} Days`;
        else
            return `Due in a Day`;
    }
    if (hourDiff > 0) {
        if (hourDiff > 1)
            return `Due in ${hourDiff} Hours`;
        else
            return `Due in an Hour`;
    }
    if (minDiff > 0) {
        if (minDiff > 1)
            return `Due in ${minDiff} Minutes`;
        else
            return `Due in a Minute`;
    }
    if (secDiff > 0) {
        if (secDiff > 1)
            return `Due in ${secDiff} Seconds`;
        else
            return `Due in a Second`;
    }
    return 'Overdue';
}
function populateDropdownElementsWithData(classes) {
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
                assignmentLabel.innerHTML += ` - ${timeTillDueDate}`;
            }
            let assignmentButton = assignmentElement.querySelector('.assignment-btn');
            if (assignmentButton !== null) {
                assignmentButton.addEventListener('click', () => {
                    window.api.openLink(classes[classIndex].assignments[assignmentIndex].posting);
                });
                if (timeTillDueDate !== 'Overdue') {
                    assignmentButton.classList.remove('hide');
                    dropdownBoxes[classIndex].classList.remove('hide');
                }
            }
        }
    }
}
function addDropdownEventListeners() {
    for (let i = 0; i < dropdownHeaders.length; i++) {
        dropdownHeaders[i].addEventListener("click", () => {
            var _a, _b;
            dropdownHeaders[i].classList.toggle('active');
            (_b = (_a = dropdownHeaders[i].parentElement) === null || _a === void 0 ? void 0 : _a.querySelector(".dropdown-box")) === null || _b === void 0 ? void 0 : _b.classList.toggle("hide");
        });
    }
}

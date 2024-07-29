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
function isInt(n) {
    return n % 1 === 0;
}
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
function populateDropdownElementsWithData(classes) {
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
            var _a, _b;
            console.log(dropdownHeaders[i]);
            dropdownHeaders[i].classList.toggle('active');
            (_b = (_a = dropdownHeaders[i].parentElement) === null || _a === void 0 ? void 0 : _a.querySelector(".dropdown-box")) === null || _b === void 0 ? void 0 : _b.classList.toggle("hide");
        });
    }
}
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

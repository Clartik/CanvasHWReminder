"use strict";
let canvasAPIBtn = document.getElementById('canvasAPI-btn');
let canvasAPIInput = document.getElementById('canvasAPI-input');
let timeDropdown = document.getElementById('time-dropdown');
let timeFormatDropdown = document.getElementById('time-format-dropdown');
const DAY_TIME_OPTIONS = [];
const HOUR_TIME_OPTIONS = [];
const MINUTE_TIME_OPTIONS = [];
let canvasAPIEditMode = false;
populateTimeOptions();
populateTimeDropdownWithCorrectFormatOptions();
canvasAPIBtn === null || canvasAPIBtn === void 0 ? void 0 : canvasAPIBtn.addEventListener('click', (event) => {
    if (!canvasAPIEditMode) {
        canvasAPIEditMode = true;
        if (canvasAPIInput !== null)
            canvasAPIInput.disabled = false;
        if (canvasAPIBtn !== null)
            canvasAPIBtn.innerText = 'Done';
    }
    else {
        canvasAPIEditMode = false;
        if (canvasAPIInput !== null)
            canvasAPIInput.disabled = true;
        if (canvasAPIBtn !== null)
            canvasAPIBtn.innerText = 'Edit';
    }
});
timeFormatDropdown === null || timeFormatDropdown === void 0 ? void 0 : timeFormatDropdown.addEventListener('change', (event) => {
    populateTimeDropdownWithCorrectFormatOptions();
});
function populateTimeOptions() {
    for (let i = 1; i <= 5; i++) {
        DAY_TIME_OPTIONS.push('' + i);
    }
    for (let i = 1; i <= 24; i++) {
        HOUR_TIME_OPTIONS.push('' + i);
    }
    for (let i = 1; i <= 60; i++) {
        MINUTE_TIME_OPTIONS.push('' + i);
    }
}
function addTimeOptionAndPopulateValue(timeElement) {
    let timeOption = document.createElement('option');
    timeOption.value = timeElement;
    timeOption.innerText = timeElement;
    timeDropdown === null || timeDropdown === void 0 ? void 0 : timeDropdown.appendChild(timeOption);
}
function populateTimeDropdownWithCorrectFormatOptions() {
    if (timeDropdown !== null)
        timeDropdown.innerHTML = '';
    if ((timeFormatDropdown === null || timeFormatDropdown === void 0 ? void 0 : timeFormatDropdown.value) === 'day') {
        for (let i = 0; i < DAY_TIME_OPTIONS.length; i++) {
            const timeElement = DAY_TIME_OPTIONS[i];
            addTimeOptionAndPopulateValue(timeElement);
        }
    }
    else if ((timeFormatDropdown === null || timeFormatDropdown === void 0 ? void 0 : timeFormatDropdown.value) === 'hour') {
        for (let i = 0; i < HOUR_TIME_OPTIONS.length; i++) {
            const timeElement = HOUR_TIME_OPTIONS[i];
            addTimeOptionAndPopulateValue(timeElement);
        }
    }
    else if ((timeFormatDropdown === null || timeFormatDropdown === void 0 ? void 0 : timeFormatDropdown.value) === 'minute') {
        for (let i = 0; i < MINUTE_TIME_OPTIONS.length; i++) {
            const timeElement = MINUTE_TIME_OPTIONS[i];
            addTimeOptionAndPopulateValue(timeElement);
        }
    }
}

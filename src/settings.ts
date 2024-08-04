let canvasAPIBtn = document.getElementById('canvasAPI-btn') as HTMLButtonElement | null;
let canvasAPIInput = document.getElementById('canvasAPI-input') as HTMLInputElement | null;
let timeDropdown = document.getElementById('time-dropdown') as HTMLSelectElement | null;
let timeFormatDropdown = document.getElementById('time-format-dropdown') as HTMLSelectElement | null;

const DAY_TIME_OPTIONS: Array<string> = [];
const HOUR_TIME_OPTIONS: Array<string> = [];
const MINUTE_TIME_OPTIONS: Array<string> = [];

let canvasAPIEditMode = false;

populateTimeOptions();
populateTimeDropdownWithCorrectFormatOptions();

canvasAPIBtn?.addEventListener('click', (event: MouseEvent) => {
    if (!canvasAPIEditMode) {
        canvasAPIEditMode = true;

        if (canvasAPIInput !== null)
            canvasAPIInput.disabled = false;
        
        if (canvasAPIBtn !== null)
            canvasAPIBtn.innerText = 'Done'
    }
    else {
        canvasAPIEditMode = false;

        if (canvasAPIInput !== null)
            canvasAPIInput.disabled = true;
        
        if (canvasAPIBtn !== null)
            canvasAPIBtn.innerText = 'Edit'
    }
});

timeFormatDropdown?.addEventListener('change', (event: Event) => {
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

function addTimeOptionAndPopulateValue(timeElement: string) {
    let timeOption = document.createElement('option');
    timeOption.value = timeElement;
    timeOption.innerText = timeElement;
    timeDropdown?.appendChild(timeOption);
}

function populateTimeDropdownWithCorrectFormatOptions() {
    if (timeDropdown !== null)
            timeDropdown.innerHTML = ''

    if (timeFormatDropdown?.value === 'day') {
        for (let i = 0; i < DAY_TIME_OPTIONS.length; i++) {
            const timeElement = DAY_TIME_OPTIONS[i];
            addTimeOptionAndPopulateValue(timeElement);            
        }
    }
    else if (timeFormatDropdown?.value === 'hour') {    
        for (let i = 0; i < HOUR_TIME_OPTIONS.length; i++) {
            const timeElement = HOUR_TIME_OPTIONS[i];
            addTimeOptionAndPopulateValue(timeElement);            
        }
    }
    else if (timeFormatDropdown?.value === 'minute') {    
        for (let i = 0; i < MINUTE_TIME_OPTIONS.length; i++) {
            const timeElement = MINUTE_TIME_OPTIONS[i];
            addTimeOptionAndPopulateValue(timeElement);            
        }
    }
}
let backBtnAnchor = document.getElementById('home-link') as HTMLAnchorElement | null;
let canvasAPIBtn = document.getElementById('canvasAPI-btn') as HTMLButtonElement | null;
let canvasAPIInput = document.getElementById('canvasAPI-input') as HTMLInputElement | null;
let timeDropdown = document.getElementById('time-dropdown') as HTMLSelectElement | null;
let timeFormatDropdown = document.getElementById('time-format-dropdown') as HTMLSelectElement | null;
let changeableElements = document.getElementsByClassName('changeable');

const DAY_TIME_OPTIONS: Array<string> = [];
const HOUR_TIME_OPTIONS: Array<string> = [];
const MINUTE_TIME_OPTIONS: Array<string> = [];

let canvasAPIEditMode = false;
let hasSettingsChanged = false;

populateTimeOptions();
populateTimeDropdownWithCorrectFormatOptions();

for (let i = 0; i < changeableElements.length; i++) {
    const element = changeableElements[i];

    element.addEventListener('change', () => {
        if (!hasSettingsChanged)
            hasSettingsChanged = true;
    });
};

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

backBtnAnchor?.addEventListener('click', async (event: MouseEvent) => {
    event.preventDefault();

    if (hasSettingsChanged) {
        const options: Electron.MessageBoxOptions = {
            type: "warning",
            title: "Save Settings?",
            message: "Do You Want to Save?",
            buttons: ['Yes', 'No'],
            defaultId: 0
        }
        
        const messageResponse: Electron.MessageBoxReturnValue = await window.api.showMessageDialog(options);
    
        if (messageResponse.response === 0) {
            console.log('Save!!!');
        }
    }

    // Tells it to load the other page
    if (backBtnAnchor !== null)
        window.location.href = backBtnAnchor.href;
});

function populateTimeOptions() {
    // Includes 1 to 7
    for (let i = 1; i <= 7; i++) {
        DAY_TIME_OPTIONS.push('' + i);
    }

    // Includes 1 to 23
    for (let i = 1; i <= 23; i++) {
        HOUR_TIME_OPTIONS.push('' + i);
    }

    // Includes 1 to 59
    for (let i = 1; i <= 59; i++) {
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
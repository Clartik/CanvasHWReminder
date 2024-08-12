const backBtnAnchor = document.getElementById('home-link')! as HTMLAnchorElement;

const canvasBaseURLBtn = document.getElementById('canvas-base-url-btn')! as HTMLButtonElement;
const canvasBaseURLInput = document.getElementById('canvas-base-url-input')! as HTMLInputElement;

const canvasAPITokenBtn = document.getElementById('canvas-api-token-btn')! as HTMLButtonElement;
const canvasAPITokenInput = document.getElementById('canvas-api-token-input')! as HTMLInputElement;

const whenToRemindTimeDropdown = document.getElementById('when-to-remind-time-dropdown')! as HTMLSelectElement;
const whenToRemindFormatDropdown = document.getElementById('when-to-remind-format-dropdown')! as HTMLSelectElement;

const launchOnStartCheckbox = document.getElementById('launch-on-start-checkbox')! as HTMLInputElement;
const minimizeOnCloseCheckbox = document.getElementById('minimize-on-close-checkbox')! as HTMLInputElement;
const neverOverdueAssignmentCheckbox = document.getElementById('never-overdue-assignment-checkbox')! as HTMLInputElement;

const howLongPastDueTimeDropdown = document.getElementById('how-long-past-due-time-dropdown')! as HTMLSelectElement;
const howLongPastDueFormatDropdown = document.getElementById('how-long-past-due-format-dropdown')! as HTMLSelectElement;

const changeableElements = document.getElementsByClassName('changeable');

const DAY_TIME_OPTIONS: Array<string> = [];
const HOUR_TIME_OPTIONS: Array<string> = [];
const MINUTE_TIME_OPTIONS: Array<string> = [];

let canvasAPITokenEditMode = false;
let canvasBaseURLEditMode = false;
let hasSettingsChanged = false;

interface SettingsData {
    readonly canvasBaseURL: string;
    readonly canvasAPIToken: string;
    readonly whenToRemindTimeValue: string;
    readonly whenToRemindFormatValue: string;
    readonly launchOnStart: boolean;
    readonly minimizeOnClose: boolean;
    readonly howLongPastDueTimeValue: string;
    readonly howLongPastDueFormatValue: string;
}

populateWhenToRemindTimeOptions();
populateTimeDropdownWithCorrectOptions(whenToRemindTimeDropdown, whenToRemindFormatDropdown);
populateTimeDropdownWithCorrectOptions(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);

addEventsToCheckIfSettingsChanged();

loadSettingsDataAndPopulateElements();

//#region Event Handlers

canvasBaseURLBtn.addEventListener('click', (event: MouseEvent) => {
    toggleBetweenEditModeInputButtons(canvasBaseURLEditMode, canvasBaseURLInput, canvasBaseURLBtn);
});

canvasAPITokenBtn.addEventListener('click', (event: MouseEvent) => {
    toggleBetweenEditModeInputButtons(canvasAPITokenEditMode, canvasAPITokenInput, canvasAPITokenBtn);
});

whenToRemindFormatDropdown.addEventListener('change', (event: Event) => {
    populateTimeDropdownWithCorrectOptions(whenToRemindTimeDropdown, whenToRemindFormatDropdown);
});

howLongPastDueFormatDropdown.addEventListener('change', (event: Event) => {
    populateTimeDropdownWithCorrectOptions(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
    checkIfTimeDropdownShouldBeHidden(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
});

backBtnAnchor.addEventListener('click', async (event: MouseEvent) => {
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
            const settingsData = getSettingsData();
            const success = await window.api.writeSavedData("settings-data.json", settingsData);

            if (success) {
                console.log('Settings Data Saved Successfully!')
                window.api.updateData('settings', settingsData);
            }
            else
                console.log('Failed to Save Settings Data!')
        }
    }

    // Tells it to load the other page
    window.location.href = backBtnAnchor.href;
});

//#endregion

//#region Functions

async function loadSettingsDataAndPopulateElements() {
    const settingsData = await window.api.getSavedData('settings-data.json') as SettingsData | null;

    if (settingsData === null) {
        console.error('SettingsData is Null!')
        return;
    }
    
    canvasBaseURLInput.value = settingsData.canvasBaseURL;
    canvasAPITokenInput.value = settingsData.canvasAPIToken;
    launchOnStartCheckbox.checked = settingsData.launchOnStart;
    minimizeOnCloseCheckbox.checked = settingsData.minimizeOnClose;

    whenToRemindFormatDropdown.value = settingsData.whenToRemindFormatValue;
    populateTimeDropdownWithCorrectOptions(whenToRemindTimeDropdown, whenToRemindFormatDropdown);
    whenToRemindTimeDropdown.value = settingsData.whenToRemindTimeValue;

    howLongPastDueFormatDropdown.value = settingsData.howLongPastDueFormatValue;
    populateTimeDropdownWithCorrectOptions(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
    checkIfTimeDropdownShouldBeHidden(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
    howLongPastDueTimeDropdown.value = settingsData.howLongPastDueTimeValue;
};

function getSettingsData(): SettingsData {
    return {
        canvasBaseURL: canvasBaseURLInput.value,
        canvasAPIToken: canvasAPITokenInput.value,
        whenToRemindTimeValue: whenToRemindTimeDropdown.value,
        whenToRemindFormatValue: whenToRemindFormatDropdown.value,
        launchOnStart: launchOnStartCheckbox.checked,
        minimizeOnClose: minimizeOnCloseCheckbox.checked,
        howLongPastDueTimeValue: howLongPastDueTimeDropdown.value,
        howLongPastDueFormatValue: howLongPastDueFormatDropdown.value
    };
}

function populateWhenToRemindTimeOptions() {
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

function addTimeOptionToDropdownAndPopulateValue(dropdown: HTMLSelectElement, timeElement: string) {
    let timeOption = document.createElement('option');
    timeOption.value = timeElement;
    timeOption.innerText = timeElement;
    dropdown.appendChild(timeOption);
}

function populateTimeDropdownWithCorrectOptions(timeDropdown: HTMLSelectElement, formatDropdown: HTMLSelectElement) {
    timeDropdown.innerHTML = ''            // Clear InnerHTML

    if (formatDropdown.value === 'day') {
        for (let i = 0; i < DAY_TIME_OPTIONS.length; i++) {
            const timeElement = DAY_TIME_OPTIONS[i];
            addTimeOptionToDropdownAndPopulateValue(timeDropdown, timeElement);            
        }
    }
    else if (formatDropdown.value === 'hour') {    
        for (let i = 0; i < HOUR_TIME_OPTIONS.length; i++) {
            const timeElement = HOUR_TIME_OPTIONS[i];
            addTimeOptionToDropdownAndPopulateValue(timeDropdown, timeElement);            
        }
    }
    else if (formatDropdown.value === 'minute') {    
        for (let i = 0; i < MINUTE_TIME_OPTIONS.length; i++) {
            const timeElement = MINUTE_TIME_OPTIONS[i];
            addTimeOptionToDropdownAndPopulateValue(timeDropdown, timeElement);            
        }
    }
}

function checkIfTimeDropdownShouldBeHidden(timeDropdown: HTMLSelectElement, formatDropdown: HTMLSelectElement) {
    if (formatDropdown.value !== 'never') {
        timeDropdown.classList.remove('hide');
        return;
    }

    timeDropdown.classList.add('hide');
}

function addEventsToCheckIfSettingsChanged() {
    for (let i = 0; i < changeableElements.length; i++) {
        const element = changeableElements[i];
    
        element.addEventListener('change', () => {
            if (!hasSettingsChanged)
                hasSettingsChanged = true;
        });
    };
}

function toggleBetweenEditModeInputButtons(editMode: boolean, input: HTMLInputElement, button: HTMLButtonElement) {
    if (!editMode) {
        editMode = true;

        input.disabled = false;
        button.innerText = 'Done'
    }
    else {
        editMode = false;

        input.disabled = true;
        button.innerText = 'Edit'
    }
}

//#endregion
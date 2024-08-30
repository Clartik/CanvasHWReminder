const backBtnAnchor = document.getElementById('home-link')! as HTMLAnchorElement;

const canvasBaseURLBtn = document.getElementById('canvas-base-url-btn')! as HTMLButtonElement;
const canvasBaseURLInput = document.getElementById('canvas-base-url-input')! as HTMLInputElement;

const canvasAPITokenBtn = document.getElementById('canvas-api-token-btn')! as HTMLButtonElement;
const canvasAPITokenInput = document.getElementById('canvas-api-token-input')! as HTMLInputElement;

const whenToRemindTimeDropdown = document.getElementById('when-to-remind-time-dropdown')! as HTMLSelectElement;
const whenToRemindFormatDropdown = document.getElementById('when-to-remind-format-dropdown')! as HTMLSelectElement;

const launchOnStartCheckbox = document.getElementById('launch-on-start-checkbox')! as HTMLInputElement;
const minimizeOnLaunchCheckbox = document.getElementById('minimize-on-launch-checkbox')! as HTMLInputElement;
const minimizeOnCloseCheckbox = document.getElementById('minimize-on-close-checkbox')! as HTMLInputElement;

const showExactDueDateCheckbox = document.getElementById('show-exact-due-date-checkbox')! as HTMLInputElement;
const alwaysExpandAllCourseCardsCheckbox = document.getElementById('always-expand-course-cards-checkbox')! as HTMLInputElement;

const howLongPastDueTimeDropdown = document.getElementById('how-long-past-due-time-dropdown')! as HTMLSelectElement;
const howLongPastDueFormatDropdown = document.getElementById('how-long-past-due-format-dropdown')! as HTMLSelectElement;

const changeableElements = document.getElementsByClassName('changeable');

const SETTINGS_DATA_VERSION: string = '0.2'

interface SettingsData {
    readonly version: string;

    readonly canvasBaseURL: string;
    readonly canvasAPIToken: string;

    readonly whenToRemindTimeValue: string;
    readonly whenToRemindFormatValue: string;
    readonly howLongPastDueTimeValue: string;
    readonly howLongPastDueFormatValue: string;

    readonly launchOnStart: boolean;
    readonly minimizeOnLaunch: boolean;
    readonly minimizeOnClose: boolean;

    readonly showExactDueDate: boolean;
    readonly alwaysExpandAllCourseCards: boolean;
}

let settingsPageDebugMode: DebugMode;

const DAY_TIME_OPTIONS: Array<string> = [];
const HOUR_TIME_OPTIONS: Array<string> = [];
const MINUTE_TIME_OPTIONS: Array<string> = [];

let canvasAPITokenEditMode = false;
let canvasBaseURLEditMode = false;
let hasSettingsChanged = false;

settingsMain();

async function settingsMain() {
    settingsPageDebugMode = await window.api.getDebugMode() as DebugMode;

    populateTimeOptions();
    populateTimeDropdownWithCorrectOptions(whenToRemindTimeDropdown, whenToRemindFormatDropdown);
    populateTimeDropdownWithCorrectOptions(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);

    addEventsToCheckIfSettingsChanged();

    const settingsData: SettingsData | null = await settingsPageGetCachedSettingsData();

    if (settingsData !== null)
        populateElementsWithData(settingsData);
}

//#region Event Handlers

canvasBaseURLBtn.addEventListener('click', (event: MouseEvent) => {
    if (!canvasBaseURLEditMode) {
        canvasBaseURLInput.disabled = false;
        canvasBaseURLBtn.innerText = 'Done'
    }
    else {
        canvasBaseURLInput.disabled = true;
        canvasBaseURLBtn.innerText = 'Edit'
    }

    canvasBaseURLEditMode = !canvasBaseURLEditMode;
});

canvasAPITokenBtn.addEventListener('click', (event: MouseEvent) => {
    if (!canvasAPITokenEditMode) {
        canvasAPITokenInput.disabled = false;
        canvasAPITokenInput.type = 'text';

        canvasAPITokenBtn.innerText = 'Hide';
    }
    else {
        canvasAPITokenInput.disabled = true;
        canvasAPITokenInput.type = 'password';

        canvasAPITokenBtn.innerText = 'Reveal';
    }

    canvasAPITokenEditMode = !canvasAPITokenEditMode;
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

        const YES_BUTTON_RESPONSE = 0;

        if (messageResponse.response === YES_BUTTON_RESPONSE) {
            const settingsData = getSettingsDataToSave();
            const success = await window.api.writeSavedData("settings-data.json", settingsData);

            if (success)
                window.api.updateData('settings-data.json', settingsData);
        }
    }

    // Tells it to load the other page
    window.location.href = backBtnAnchor.href;
});

//#endregion

//#region Functions

async function settingsPageGetCachedSettingsData(): Promise<SettingsData | null> {
    const cachedSettingsData = await window.api.getCachedData('settings-data.json') as SettingsData | null;

    if (cachedSettingsData === null) {
        console.error('Cached SettingsData is Null!');
        return null;
    }

    return cachedSettingsData;
}

function populateElementsWithData(settingsData: SettingsData) {
    if (settingsData === null)
        return;

    canvasBaseURLInput.value = settingsData.canvasBaseURL;
    canvasAPITokenInput.value = settingsData.canvasAPIToken;

    launchOnStartCheckbox.checked = settingsData.launchOnStart;
    minimizeOnLaunchCheckbox.checked = settingsData.minimizeOnLaunch;
    minimizeOnCloseCheckbox.checked = settingsData.minimizeOnClose;

    showExactDueDateCheckbox.checked = settingsData.showExactDueDate;
    alwaysExpandAllCourseCardsCheckbox.checked = settingsData.alwaysExpandAllCourseCards;

    whenToRemindFormatDropdown.value = settingsData.whenToRemindFormatValue;
    populateTimeDropdownWithCorrectOptions(whenToRemindTimeDropdown, whenToRemindFormatDropdown);
    whenToRemindTimeDropdown.value = settingsData.whenToRemindTimeValue;

    howLongPastDueFormatDropdown.value = settingsData.howLongPastDueFormatValue;
    populateTimeDropdownWithCorrectOptions(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
    checkIfTimeDropdownShouldBeHidden(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
    howLongPastDueTimeDropdown.value = settingsData.howLongPastDueTimeValue;
};

function getSettingsDataToSave(): SettingsData {
    return {
        version: SETTINGS_DATA_VERSION,

        canvasBaseURL: canvasBaseURLInput.value,
        canvasAPIToken: canvasAPITokenInput.value,

        whenToRemindTimeValue: whenToRemindTimeDropdown.value,
        whenToRemindFormatValue: whenToRemindFormatDropdown.value,
        howLongPastDueTimeValue: howLongPastDueTimeDropdown.value,
        howLongPastDueFormatValue: howLongPastDueFormatDropdown.value,

        launchOnStart: launchOnStartCheckbox.checked,
        minimizeOnLaunch: minimizeOnLaunchCheckbox.checked,
        minimizeOnClose: minimizeOnCloseCheckbox.checked,

        showExactDueDate: showExactDueDateCheckbox.checked,
        alwaysExpandAllCourseCards: alwaysExpandAllCourseCardsCheckbox.checked
    };
}

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

//#endregion
import SettingsData from "../interfaces/settingsData";

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

const dontRemindAssignmentsWithNoSubmissionsCheckbox = document.getElementById('dont-remind-assignments-with-no-submissions-checkbox')! as HTMLInputElement;

const silenceNotificationsCheckbox = document.getElementById('silence-notifications-checkbox')! as HTMLInputElement;
const keepNotificationsOnScreenCheckbox = document.getElementById('keep-notifications-on-screen-checkbox')! as HTMLInputElement;

const autoMarkSubmissionsCheckbox = document.getElementById('auto-mark-submissions-checkbox')! as HTMLInputElement;

const howLongPastDueTimeDropdown = document.getElementById('how-long-past-due-time-dropdown')! as HTMLSelectElement;
const howLongPastDueFormatDropdown = document.getElementById('how-long-past-due-format-dropdown')! as HTMLSelectElement;

const changeableElements = document.getElementsByClassName('changeable');

const creditsLinkBtn = document.getElementById('credits-link-btn') as HTMLButtonElement;

const DAY_TIME_OPTIONS: Array<string> = [];
const HOUR_TIME_OPTIONS: Array<string> = [];
const MINUTE_TIME_OPTIONS: Array<string> = [];

let canvasAPITokenEditMode = false;
let canvasBaseURLEditMode = false;
let hasSettingsChanged = false;

settingsMain();

async function settingsMain() {
    populateTimeOptions();
    populateTimeDropdownWithCorrectOptions(whenToRemindTimeDropdown, whenToRemindFormatDropdown);
    populateTimeDropdownWithCorrectOptions(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);

    addEventsToCheckIfSettingsChanged();

    const settingsData: SettingsData | null = await settingsPageGetCachedSettingsData();

    if (settingsData !== null) {
        populateElementsWithData(settingsData);
        await populateElemntsWithSecureData();
    }
}

//#region Event Handlers

launchOnStartCheckbox.addEventListener('click', async () => {
    if (launchOnStartCheckbox.checked)
        return;

    const NO_BUTTON_RESPONSE: number = 1;

    const response: Electron.MessageBoxReturnValue = await window.api.showMessageDialog({
        type: "warning",
        title: "Are you sure?",
        message: `Are you sure you want to disable "Launch on system bootup"?\nThis prevents Canvas HW Reminder from reminding you until you launch the app.`,
        buttons: ['Yes', 'No']
    })

    if (response.response === NO_BUTTON_RESPONSE)
        return;

    launchOnStartCheckbox.checked = false;
})

minimizeOnCloseCheckbox.addEventListener('click', async () => {
    if (minimizeOnCloseCheckbox.checked)
        return;

    const NO_BUTTON_RESPONSE: number = 1;

    const response: Electron.MessageBoxReturnValue = await window.api.showMessageDialog({
        type: "warning",
        title: "Are you sure?",
        message: `Are you sure you want to disable "Minimize on app close"?\nThis prevents Canvas HW Reminder from reminding you until you re-launch the app.`,
        buttons: ['Yes', 'No']
    })

    if (response.response === NO_BUTTON_RESPONSE)
        return;

    minimizeOnCloseCheckbox.checked = false;
})

autoMarkSubmissionsCheckbox.addEventListener('click', async () => {
    if (!autoMarkSubmissionsCheckbox.checked)
        return;

    const NO_BUTTON_RESPONSE: number = 1;

    const response: Electron.MessageBoxReturnValue = await window.api.showMessageDialog({
        type: "warning",
        title: "Are you sure? [BETA]",
        message: `Are you sure you want to enable "Auto mark submitted assignments?"\nThis feature is in BETA and may not work as expected at all times.`,
        buttons: ['Yes', 'No']
    })

    if (response.response === NO_BUTTON_RESPONSE)
        return;

    autoMarkSubmissionsCheckbox.checked = true;
})

creditsLinkBtn.addEventListener('click', async (event) => {
    event.preventDefault();

    if (hasSettingsChanged) {
        const options: Electron.MessageBoxOptions = {
            type: "warning",
            title: "Save Settings?",
            message: "Do you want to save?",
            buttons: ['Yes', 'No'],
            defaultId: 0
        }

        const messageResponse: Electron.MessageBoxReturnValue = await window.api.showMessageDialog(options);

        const YES_BUTTON_RESPONSE = 0;

        if (messageResponse.response === YES_BUTTON_RESPONSE) {
            saveSecureData();

            const settingsData = await getSettingsDataToSave();
            const success = await window.api.writeSavedData('settings-data.json', settingsData);

            if (success)
                window.api.updateData('settingsData', settingsData);
        }
    }

    window.location.href = './credits.html';
})

canvasBaseURLBtn.addEventListener('click', () => {
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

canvasAPITokenBtn.addEventListener('click', () => {
    if (!canvasAPITokenEditMode) {
        canvasAPITokenInput.disabled = false;
        canvasAPITokenInput.type = 'text';

        canvasAPITokenBtn.innerText = 'Done';
    }
    else {
        canvasAPITokenInput.disabled = true;
        canvasAPITokenInput.type = 'password';

        canvasAPITokenBtn.innerText = 'Edit';
    }

    canvasAPITokenEditMode = !canvasAPITokenEditMode;
});

whenToRemindFormatDropdown.addEventListener('change', () => {
    populateTimeDropdownWithCorrectOptions(whenToRemindTimeDropdown, whenToRemindFormatDropdown);
});

howLongPastDueFormatDropdown.addEventListener('change', () => {
    populateTimeDropdownWithCorrectOptions(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
    checkIfTimeDropdownShouldBeHidden(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
});

backBtnAnchor.addEventListener('click', async (event: MouseEvent) => {
    event.preventDefault();

    if (hasSettingsChanged) {
        const options: Electron.MessageBoxOptions = {
            type: "warning",
            title: "Save Settings?",
            message: "Do you want to save?",
            buttons: ['Yes', 'No'],
            defaultId: 0
        }

        const messageResponse: Electron.MessageBoxReturnValue = await window.api.showMessageDialog(options);

        const YES_BUTTON_RESPONSE = 0;

        if (messageResponse.response === YES_BUTTON_RESPONSE) {
            saveSecureData();

            const settingsData = await getSettingsDataToSave();
            const success = await window.api.writeSavedData('settings-data.json', settingsData);

            if (success)
                window.api.updateData('settingsData', settingsData);
        }
    }

    // Tells it to load the other page
    window.location.href = backBtnAnchor.href;
});

//#endregion

//#region Functions

async function settingsPageGetCachedSettingsData(): Promise<SettingsData | null> {
    const cachedSettingsData = await window.api.getCachedData('settingsData') as SettingsData | null;

    if (cachedSettingsData === null) {
        console.error('Cached SettingsData is Null!');
        return null;
    }

    return cachedSettingsData;
}

function populateElementsWithData(settingsData: SettingsData) {
    if (settingsData === null)
        return;

    launchOnStartCheckbox.checked = settingsData.launchOnStart;
    minimizeOnLaunchCheckbox.checked = settingsData.minimizeOnLaunch;
    minimizeOnCloseCheckbox.checked = settingsData.minimizeOnClose;

    showExactDueDateCheckbox.checked = settingsData.showExactDueDate;
    alwaysExpandAllCourseCardsCheckbox.checked = settingsData.alwaysExpandAllCourseCards;

    dontRemindAssignmentsWithNoSubmissionsCheckbox.checked = settingsData.dontRemindAssignmentsWithNoSubmissions;

    silenceNotificationsCheckbox.checked = settingsData.silenceNotifications;
    keepNotificationsOnScreenCheckbox.checked = settingsData.keepNotificationsOnScreen;

    autoMarkSubmissionsCheckbox.checked = settingsData.autoMarkSubmissions;

    whenToRemindFormatDropdown.value = settingsData.whenToRemindFormatValue;
    populateTimeDropdownWithCorrectOptions(whenToRemindTimeDropdown, whenToRemindFormatDropdown);
    whenToRemindTimeDropdown.value = settingsData.whenToRemindTimeValue;

    howLongPastDueFormatDropdown.value = settingsData.howLongPastDueFormatValue;
    populateTimeDropdownWithCorrectOptions(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
    
    checkIfTimeDropdownShouldBeHidden(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
    howLongPastDueTimeDropdown.value = settingsData.howLongPastDueTimeValue;
};

async function populateElemntsWithSecureData() {
    const canvasBaseURL: string | null = await window.api.getSecureText('CanvasBaseURL');
    const canvasAPIToken: string | null = await window.api.getSecureText('CanvasAPIToken');

    canvasBaseURLInput.value = canvasBaseURL ?? '';
    canvasAPITokenInput.value = canvasAPIToken ?? '';
}

async function getSettingsDataToSave(): Promise<SettingsData> {
    const v = await window.api.getSaveVersion('settings-data.json');

    return {
        version: v,

        whenToRemindTimeValue: whenToRemindTimeDropdown.value,
        whenToRemindFormatValue: whenToRemindFormatDropdown.value,
        howLongPastDueTimeValue: howLongPastDueTimeDropdown.value,
        howLongPastDueFormatValue: howLongPastDueFormatDropdown.value,

        launchOnStart: launchOnStartCheckbox.checked,
        minimizeOnLaunch: minimizeOnLaunchCheckbox.checked,
        minimizeOnClose: minimizeOnCloseCheckbox.checked,

        showExactDueDate: showExactDueDateCheckbox.checked,
        alwaysExpandAllCourseCards: alwaysExpandAllCourseCardsCheckbox.checked,

        dontRemindAssignmentsWithNoSubmissions: dontRemindAssignmentsWithNoSubmissionsCheckbox.checked,

        silenceNotifications: silenceNotificationsCheckbox.checked,
        keepNotificationsOnScreen: keepNotificationsOnScreenCheckbox.checked,

        autoMarkSubmissions: autoMarkSubmissionsCheckbox.checked
    };
}

function saveSecureData() {
    window.api.saveSecureText('CanvasBaseURL', canvasBaseURLInput.value);
    window.api.saveSecureText('CanvasAPIToken', canvasAPITokenInput.value);
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
    const timeOption = document.createElement('option');
    timeOption.value = timeElement;
    timeOption.innerText = timeElement;
    dropdown.appendChild(timeOption);
}

function populateTimeDropdownWithCorrectOptions(timeDropdown: HTMLSelectElement, formatDropdown: HTMLSelectElement) {
    timeDropdown.innerHTML = ''

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
            if (!hasSettingsChanged) {                
                hasSettingsChanged = true;
            }
        });
    };
}

//#endregion
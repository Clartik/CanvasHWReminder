import SettingsData from "../shared/interfaces/settingsData";

const whenToRemindTimeDropdown = document.getElementById('when-to-remind-time-dropdown')! as HTMLSelectElement;
const whenToRemindFormatDropdown = document.getElementById('when-to-remind-format-dropdown')! as HTMLSelectElement;

const howLongPastDueTimeDropdown = document.getElementById('how-long-past-due-time-dropdown')! as HTMLSelectElement;
const howLongPastDueFormatDropdown = document.getElementById('how-long-past-due-format-dropdown')! as HTMLSelectElement;

const launchOnStartCheckbox = document.getElementById('launch-on-start-checkbox')! as HTMLInputElement;
const minimizeOnLaunchCheckbox = document.getElementById('minimize-on-launch-checkbox')! as HTMLInputElement;
const minimizeOnCloseCheckbox = document.getElementById('minimize-on-close-checkbox')! as HTMLInputElement;

const showExactDueDateCheckbox = document.getElementById('show-exact-due-date-checkbox')! as HTMLInputElement;
const alwaysExpandAllCourseCardsCheckbox = document.getElementById('always-expand-course-cards-checkbox')! as HTMLInputElement;

const silenceNotificationsCheckbox = document.getElementById('silence-notifications-checkbox')! as HTMLInputElement;
const keepNotificationsOnScreenCheckbox = document.getElementById('keep-notifications-on-screen-checkbox')! as HTMLInputElement;

const doneBtn = document.getElementById('done-btn')! as HTMLButtonElement;

const DAY_TIME_OPTIONS: Array<string> = [];
const HOUR_TIME_OPTIONS: Array<string> = [];
const MINUTE_TIME_OPTIONS: Array<string> = [];

const SETTINGS_DATA_VERSION: string = '0.4';

const LOADING_SPINNER_TEMPLATE = `
    <img id="setup-spinner" src="../assets/svg/spinner.svg" width="25px">
`;

const FAKE_WAIT_SEC_FOR_COMPLETING_SETUP: number = 1;

async function sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

setupSettingsMain();

async function setupSettingsMain() {
    populateTimeOptions();
    populateTimeDropdownWithCorrectOptions(whenToRemindTimeDropdown, whenToRemindFormatDropdown);
    populateTimeDropdownWithCorrectOptions(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);

    setDefaultSettings();
}

//#region Event Listeners

launchOnStartCheckbox.addEventListener('click', async (event) => {
    if (launchOnStartCheckbox.checked)
        return;

    event.preventDefault();

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

minimizeOnCloseCheckbox.addEventListener('click', async (event) => {
    if (minimizeOnCloseCheckbox.checked)
        return;

    event.preventDefault();

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

whenToRemindFormatDropdown.addEventListener('change', (event: Event) => {
    populateTimeDropdownWithCorrectOptions(whenToRemindTimeDropdown, whenToRemindFormatDropdown);
});

howLongPastDueFormatDropdown.addEventListener('change', (event: Event) => {
    populateTimeDropdownWithCorrectOptions(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
    checkIfTimeDropdownShouldBeHidden(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
});

doneBtn.addEventListener('click', async (event) => {
    const options: Electron.MessageBoxOptions = {
        type: "warning",
        title: "Done With Setup?",
        message: "Are you sure you are done configuring?",
        buttons: ['Yes', 'No'],
        defaultId: 0
    }

    const messageResponse: Electron.MessageBoxReturnValue = await window.api.showMessageDialog(options);
    
    const YES_BUTTON_RESPONSE = 0;

    if (messageResponse.response !== YES_BUTTON_RESPONSE)
        return;

    doneBtn.innerHTML = LOADING_SPINNER_TEMPLATE;
    await sleep(FAKE_WAIT_SEC_FOR_COMPLETING_SETUP * 1000);

    const settingsDataToSave = getSettingsDataToSave();
    
    const success = await window.api.writeSavedData('settings-data.json', settingsDataToSave)

    if (!success) {
        console.warn('Failed to Save Settings Data!');
        return;
    }

    window.api.sendAppStatus('SETUP COMPLETE', settingsDataToSave);

    window.location.href = '../pages/home.html';
});

//#endregion

//#region Functions

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

function setDefaultSettings() {
    whenToRemindFormatDropdown.value = 'hour';
    populateTimeDropdownWithCorrectOptions(whenToRemindTimeDropdown, whenToRemindFormatDropdown);
    whenToRemindTimeDropdown.value = '6';

    howLongPastDueFormatDropdown.value = 'hour';
    populateTimeDropdownWithCorrectOptions(howLongPastDueTimeDropdown, howLongPastDueFormatDropdown);
    howLongPastDueTimeDropdown.value = '1';

    launchOnStartCheckbox.checked = true;
    minimizeOnLaunchCheckbox.checked = true;
    minimizeOnCloseCheckbox.checked = true;

    keepNotificationsOnScreenCheckbox.checked = true;
}

function getSettingsDataToSave(): SettingsData {
    return {
        version: SETTINGS_DATA_VERSION,

        whenToRemindTimeValue: whenToRemindTimeDropdown.value,
        whenToRemindFormatValue: whenToRemindFormatDropdown.value,
        howLongPastDueTimeValue: howLongPastDueTimeDropdown.value,
        howLongPastDueFormatValue: howLongPastDueFormatDropdown.value,

        launchOnStart: launchOnStartCheckbox.checked,
        minimizeOnLaunch: minimizeOnLaunchCheckbox.checked,
        minimizeOnClose: minimizeOnCloseCheckbox.checked,

        showExactDueDate: showExactDueDateCheckbox.checked,
        alwaysExpandAllCourseCards: alwaysExpandAllCourseCardsCheckbox.checked,

        silenceNotifications: silenceNotificationsCheckbox.checked,
        keepNotificationsOnScreen: keepNotificationsOnScreenCheckbox.checked
    };
}

//#endregion

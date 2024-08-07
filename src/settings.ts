const backBtnAnchor = document.getElementById('home-link')! as HTMLAnchorElement;

const canvasBaseURLBtn = document.getElementById('canvas-base-url-btn')! as HTMLButtonElement;
const canvasBaseURLInput = document.getElementById('canvas-base-url-input')! as HTMLInputElement;

const canvasAPITokenBtn = document.getElementById('canvas-api-token-btn')! as HTMLButtonElement;
const canvasAPITokenInput = document.getElementById('canvas-api-token-input')! as HTMLInputElement;

const whenToRemindTimeDropdown = document.getElementById('time-dropdown')! as HTMLSelectElement;
const whenToRemindFormatDropdown = document.getElementById('time-format-dropdown')! as HTMLSelectElement;

const launchOnStartCheckbox = document.getElementById('launch-on-start-checkbox')! as HTMLInputElement;
const minimizeOnCloseCheckbox = document.getElementById('minimize-on-close-checkbox')! as HTMLInputElement;

const changeableElements = document.getElementsByClassName('changeable');

const DAY_TIME_OPTIONS: Array<string> = [];
const HOUR_TIME_OPTIONS: Array<string> = [];
const MINUTE_TIME_OPTIONS: Array<string> = [];

let canvasAPITokenEditMode = false;
let canvasBaseURLEditMode = false;
let hasSettingsChanged = false;

interface SettingsData {
    canvasBaseURL: string;
    canvasAPIToken: string;
    whenToRemindTimeIndex: number;
    whenToRemindFormatIndex: number;
    launchOnStart: boolean;
    minimizeOnClose: boolean;
}

populateTimeOptions();
populateTimeDropdownWithCorrectFormatOptions();

addEventsToCheckIfSettingsChanged();

(async () => {
    const settingsData: SettingsData | null = await window.api.readData('settings-data.json') as SettingsData | null;

    if (settingsData === null) {
        console.error('SettingsData is Null!')
        return;
    }
    
    canvasBaseURLInput.value = settingsData.canvasBaseURL;
    canvasAPITokenInput.value = settingsData.canvasAPIToken;
    launchOnStartCheckbox.checked = settingsData.launchOnStart;
    minimizeOnCloseCheckbox.checked = settingsData.minimizeOnClose;

    whenToRemindFormatDropdown.selectedIndex = settingsData.whenToRemindFormatIndex;
    populateTimeDropdownWithCorrectFormatOptions();
    whenToRemindTimeDropdown.selectedIndex = settingsData.whenToRemindTimeIndex;
})();

canvasBaseURLBtn.addEventListener('click', (event: MouseEvent) => {
    if (!canvasBaseURLEditMode) {
        canvasBaseURLEditMode = true;

        canvasBaseURLInput.disabled = false;
        canvasBaseURLBtn.innerText = 'Done'
    }
    else {
        canvasBaseURLEditMode = false;

        canvasBaseURLInput.disabled = true;
        canvasBaseURLBtn.innerText = 'Edit'
    }
});

canvasAPITokenBtn.addEventListener('click', (event: MouseEvent) => {
    if (!canvasAPITokenEditMode) {
        canvasAPITokenEditMode = true;

        canvasAPITokenInput.disabled = false;
        canvasAPITokenBtn.innerText = 'Done'
    }
    else {
        canvasAPITokenEditMode = false;

        canvasAPITokenInput.disabled = true;
        canvasAPITokenBtn.innerText = 'Edit'
    }
});

whenToRemindFormatDropdown.addEventListener('change', (event: Event) => {
    populateTimeDropdownWithCorrectFormatOptions();
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
            const success = await window.api.saveData("settings-data.json", settingsData);
        }
    }

    // Tells it to load the other page
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
    whenToRemindTimeDropdown.appendChild(timeOption);
}

function populateTimeDropdownWithCorrectFormatOptions() {
    whenToRemindTimeDropdown.innerHTML = ''            // Clear InnerHTML

    if (whenToRemindFormatDropdown.value === 'day') {
        for (let i = 0; i < DAY_TIME_OPTIONS.length; i++) {
            const timeElement = DAY_TIME_OPTIONS[i];
            addTimeOptionAndPopulateValue(timeElement);            
        }
    }
    else if (whenToRemindFormatDropdown.value === 'hour') {    
        for (let i = 0; i < HOUR_TIME_OPTIONS.length; i++) {
            const timeElement = HOUR_TIME_OPTIONS[i];
            addTimeOptionAndPopulateValue(timeElement);            
        }
    }
    else if (whenToRemindFormatDropdown.value === 'minute') {    
        for (let i = 0; i < MINUTE_TIME_OPTIONS.length; i++) {
            const timeElement = MINUTE_TIME_OPTIONS[i];
            addTimeOptionAndPopulateValue(timeElement);            
        }
    }
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

function getSettingsData(): SettingsData {
    return {
        canvasBaseURL: canvasBaseURLInput !== null ? canvasBaseURLInput.value : "",
        canvasAPIToken: canvasAPITokenInput !== null ? canvasAPITokenInput.value : "",
        whenToRemindTimeIndex: whenToRemindTimeDropdown !== null ? whenToRemindTimeDropdown.selectedIndex : -1,
        whenToRemindFormatIndex: whenToRemindFormatDropdown !== null ? whenToRemindFormatDropdown.selectedIndex : -1,
        launchOnStart: launchOnStartCheckbox !== null ? launchOnStartCheckbox.checked : true,
        minimizeOnClose: minimizeOnCloseCheckbox !== null ? minimizeOnCloseCheckbox.checked : true
    };
}
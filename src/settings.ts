let backBtnAnchor = document.getElementById('home-link') as HTMLAnchorElement | null;

let canvasURLBtn = document.getElementById('canvas-url-btn') as HTMLButtonElement | null;
let canvasURLInput = document.getElementById('canvas-url-input') as HTMLInputElement | null;

let canvasAPIBtn = document.getElementById('canvas-api-btn') as HTMLButtonElement | null;
let canvasAPIInput = document.getElementById('canvas-api-input') as HTMLInputElement | null;

let timeDropdown = document.getElementById('time-dropdown') as HTMLSelectElement | null;
let timeFormatDropdown = document.getElementById('time-format-dropdown') as HTMLSelectElement | null;

const launchOnStartCheckbox = document.getElementById('launch-on-start-check') as HTMLInputElement | null;
const minimizeOnCloseCheckbox = document.getElementById('minimize-on-close-check') as HTMLInputElement | null;

let changeableElements = document.getElementsByClassName('changeable');

const DAY_TIME_OPTIONS: Array<string> = [];
const HOUR_TIME_OPTIONS: Array<string> = [];
const MINUTE_TIME_OPTIONS: Array<string> = [];

let canvasAPITokenEditMode = false;
let canvasBaseURLEditMode = false;
let hasSettingsChanged = false;

populateTimeOptions();
populateTimeDropdownWithCorrectFormatOptions();

addEventsToCheckIfSettingsChanged();

canvasURLBtn?.addEventListener('click', (event: MouseEvent) => {
    if (!canvasBaseURLEditMode) {
        canvasBaseURLEditMode = true;

        if (canvasURLInput !== null)
            canvasURLInput.disabled = false;
        
        if (canvasURLInput !== null)
            canvasURLInput.innerText = 'Done'
    }
    else {
        canvasBaseURLEditMode = false;

        if (canvasURLInput !== null)
            canvasURLInput.disabled = true;
        
        if (canvasURLInput !== null)
            canvasURLInput.innerText = 'Edit'
    }
});

canvasAPIBtn?.addEventListener('click', (event: MouseEvent) => {
    if (!canvasAPITokenEditMode) {
        canvasAPITokenEditMode = true;

        if (canvasAPIInput !== null)
            canvasAPIInput.disabled = false;
        
        if (canvasAPIBtn !== null)
            canvasAPIBtn.innerText = 'Done'
    }
    else {
        canvasAPITokenEditMode = false;

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
            const settingsData = getSettingsData();
            const success = await window.api.saveData("settings-data.json", settingsData);
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

function addEventsToCheckIfSettingsChanged() {
    for (let i = 0; i < changeableElements.length; i++) {
        const element = changeableElements[i];
    
        element.addEventListener('change', () => {
            if (!hasSettingsChanged)
                hasSettingsChanged = true;
        });
    };
}

function getSettingsData(): Object {
    const canvasBaseURL: string = canvasURLInput !== null ? canvasURLInput.value : "";
    const canvasAPIToken: string = canvasAPIInput !== null ? canvasAPIInput.value : "";
    const whenToRemindTimeIndex: number = timeDropdown !== null ? timeDropdown.selectedIndex : -1;
    const whenToRemindFormatIndex: number = timeFormatDropdown !== null ? timeFormatDropdown.selectedIndex : -1;
    const launchOnStart: boolean = launchOnStartCheckbox !== null ? launchOnStartCheckbox.checked : true;
    const minimizeOnClose: boolean = minimizeOnCloseCheckbox !== null ? minimizeOnCloseCheckbox.checked : true;

    return {
        "canvas_base_url": canvasBaseURL,
        "canvas_api_token": canvasAPIToken,
        "when_to_remind_time_index": whenToRemindTimeIndex,
        "when_to_remind_format_index": whenToRemindFormatIndex,
        "launch_on_start": launchOnStart,
        "minimize_on_close": minimizeOnClose
    };
}
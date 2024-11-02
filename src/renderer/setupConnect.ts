import * as CanvasAPI from "src/main/util/canvasAPI/canvas";
import IPCGetResult from "src/shared/interfaces/ipcGetResult";

const setupLoginContainer = document.getElementById('setup-login-container')! as HTMLDivElement;
const setupProfileContainer = document.getElementById('setup-profile-container')! as HTMLDivElement;

const canvasBaseURLInput = document.getElementById('base-url-input')! as HTMLInputElement;
const canvasAPITokenInput = document.getElementById('api-token-input')! as HTMLInputElement;

const connectBtn = document.getElementById('connect-btn')! as HTMLButtonElement;
const yesBtn = document.getElementById('yes-btn')! as HTMLButtonElement;
const noBtn = document.getElementById('no-btn')! as HTMLButtonElement;

const profileIcon = document.getElementById('profile-icon')! as HTMLImageElement;
const profileName = document.getElementById('profile-name')! as HTMLHeadingElement;

const separatorContainer = document.getElementById('separator-container')! as HTMLDivElement;
const infoWidgetContainer = document.getElementById('info-widget-container')! as HTMLDivElement;

const infoWarnWidget = document.getElementById('information-warning-container')! as HTMLDivElement;

canvasBaseURLInput.addEventListener('input', checkIfConnectBtnCanBeEnabled);
canvasAPITokenInput.addEventListener('input', checkIfConnectBtnCanBeEnabled);

async function sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

let isConnectingToCanvas = false;

connectMain();

//#region TEMPLATES

const INFO_WIDGET_TEMPLATE_NO_INTERNET: string = `
    <h2>Not Connected to Internet</h2>
    <p>Please Check Your Connection and Try Again</p>
`;

const INFO_WIDGET_TEMPLATE_CANVAS_INCORRECT_LOGIN: string = `
    <h2>Could Not Connect to Canvas</h2>
    <p>Please Check Your Base URL or Access Token Are Accurate</p>
`;

const INFO_WIDGET_TEMPLATE_ERROR: string = `
    <h2>An Error Occurred While Trying to Connect to Canvas</h2>
    <p>Please Check Your Credentials Are Accurate and You Are Connected to Internet</p>
`;

const LOADING_SPINNER_TEMPLATE = `
    <img id="spinner" src="../assets/svg/spinner.svg" width="30px">
`;

//#endregion

//#region Event Listeners

connectBtn.addEventListener('click', async () => {
    if (!canvasBaseURLInput.value || !canvasAPITokenInput.value || !isValidUrl(canvasBaseURLInput.value) && !isConnectingToCanvas)
        return;

    isConnectingToCanvas = true;
    
    connectBtn.innerHTML = LOADING_SPINNER_TEMPLATE;
    connectBtn.style.pointerEvents = 'none';
    
    if (!navigator.onLine) {
        await showInfoWidgetForNoInternet();
        return;
    }
    
    const result: IPCGetResult = await window.api.getSelfFromCanvas(canvasBaseURLInput.value, canvasAPITokenInput.value) as IPCGetResult;

    if (result.error) {
        postConnectBtnClick();

        switch (result.error) {  
            case 'INVALID CANVAS CREDENTIALS': {
                const infoWidgetInvalidCredentials = createInfoWidget(INFO_WIDGET_TEMPLATE_CANVAS_INCORRECT_LOGIN);
                infoWidgetContainer.appendChild(infoWidgetInvalidCredentials);
                return;
            }
                
            default: {
                const infoWidgetError = createInfoWidget(INFO_WIDGET_TEMPLATE_ERROR);
                infoWidgetContainer.appendChild(infoWidgetError);
                return;
            }
        }
    }
    
    if (!result.data) {
        postConnectBtnClick();
        const infoWidgetError = createInfoWidget(INFO_WIDGET_TEMPLATE_ERROR);
        infoWidgetContainer.appendChild(infoWidgetError);
        return;
    }
        
    showProfileIconAndName(result.data as CanvasAPI.User);
});

noBtn.addEventListener('click', () => {
    setupLoginContainer.classList.remove('disable');
    setupProfileContainer.classList.add('hide');
    separatorContainer.classList.add('hide');
    infoWarnWidget.classList.remove('hide');
});

yesBtn.addEventListener('click', async () => {
    saveSecureData();

    window.location.href = '../pages/setupConfigure.html' 
})

//#endregion

//#region Functions

async function connectMain() {
    const canvasBaseUrl: string | null = await window.api.getSecureText('CanvasBaseURL');
    const canvasAPIToken: string | null = await window.api.getSecureText('CanvasAPIToken');

    if (!canvasBaseUrl || !canvasAPIToken)
        return;

    canvasBaseURLInput.value = canvasBaseUrl;
    canvasAPITokenInput.value = canvasAPIToken;

    checkIfConnectBtnCanBeEnabled();
}

function checkIfConnectBtnCanBeEnabled() {
    if (!canvasBaseURLInput.value || !canvasAPITokenInput.value || !isValidUrl(canvasBaseURLInput.value) || !isValidCanvasUrl(canvasBaseURLInput.value)) {
        connectBtn.disabled = true;
        return;
    }

    connectBtn.disabled = false;
}

function isValidCanvasUrl(url: string): boolean {
    return url.includes('instructure');
}

function isValidUrl(url: string) {
    const urlPattern = new RegExp(
        '^(https?:\\/\\/)?' + // validate protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
    return !!urlPattern.test(url);
}

function createInfoWidget(template: string): HTMLDivElement {
    const infoWidget = document.createElement('div');
    infoWidget.classList.add('info-widget');
    infoWidget.innerHTML = template;
    return infoWidget;
}

async function showInfoWidgetForNoInternet() {
    await sleep(2 * 1000);

    postConnectBtnClick();

    const infoWidgetNoInternet = createInfoWidget(INFO_WIDGET_TEMPLATE_NO_INTERNET);
    infoWidgetContainer.appendChild(infoWidgetNoInternet);
}

function postConnectBtnClick() {
    isConnectingToCanvas = false;
    
    connectBtn.innerHTML = 'Connect to Canvas';
    connectBtn.style.pointerEvents = '';

    infoWarnWidget.classList.add('hide');

    infoWidgetContainer.innerHTML = '';
    infoWidgetContainer.classList.remove('hide');

    separatorContainer.classList.remove('hide');
}

function showProfileIconAndName(profile: CanvasAPI.User) {
    profileIcon.addEventListener('load', () => {
        postConnectBtnClick();

        infoWidgetContainer.classList.add('hide');
    
        setupLoginContainer.classList.add('disable');
        setupProfileContainer.classList.remove('hide');
    });
    
    profileIcon.src = profile.avatar_url;
    profileName.innerText = profile.name;
}

function saveSecureData() {
    window.api.saveSecureText('CanvasBaseURL', canvasBaseURLInput.value);
    window.api.saveSecureText('CanvasAPIToken', canvasAPITokenInput.value);
}

//#endregion
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

canvasBaseURLInput.addEventListener('input', checkIfConnectBtnCanBeEnabled);
canvasAPITokenInput.addEventListener('input', checkIfConnectBtnCanBeEnabled);

async function sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

//#region TEMPLATES

const INFO_WIDGET_TEMPLATE_NO_INTERNET: string = `
    <h2>Not Connected to Internet</h2>
    <p>Please Check Your Connection and Try Again</p>
`;

const INFO_WIDGET_TEMPLATE_CANVAS_INCORRECT_LOGIN: string = `
    <h2>Could Not Connect to Canvas</h2>
    <p>Please Check Your Base URL or Access Token Are Accurate</p>
`;

const LOADING_SPINNER_TEMPLATE = `
    <img id="spinner" src="../assets/svg/spinner.svg" width="30px">
`;

//#endregion

connectBtn.addEventListener('click', async () => {
    if (!canvasBaseURLInput.value || !canvasAPITokenInput.value || !isValidUrl(canvasBaseURLInput.value))
        return;
    
    connectBtn.innerHTML = LOADING_SPINNER_TEMPLATE;
    
    if (!navigator.onLine) {
        await showInfoWidgetForNoInternet();
        return;
    }
    
    const result: IPCGetResult = await window.api.getSelfFromCanvas(canvasBaseURLInput.value, canvasAPITokenInput.value) as IPCGetResult;
    
    postConnectBtnClick();
    
    switch (result.error) {  
        case 'INVALID CANVAS CREDENTIALS':
            const infoWidgetInvalidCredentials = createInfoWidget(INFO_WIDGET_TEMPLATE_CANVAS_INCORRECT_LOGIN);
            infoWidgetContainer.appendChild(infoWidgetInvalidCredentials);
            return;
            
        default:
            break;
    }
    
    if (result.data)
        showProfileIconAndName(result.data as CanvasAPI.User);
});

noBtn.addEventListener('click', () => {
    setupLoginContainer.classList.remove('disable');
    setupProfileContainer.classList.add('hide');
    separatorContainer.classList.add('hide');
});

yesBtn.addEventListener('click', () => {
    window.location.href = '../pages/home.html' 
})

function checkIfConnectBtnCanBeEnabled() {
    if (!canvasBaseURLInput.value || !canvasAPITokenInput.value || !isValidUrl(canvasBaseURLInput.value)) {
        connectBtn.disabled = true;
        return;
    }

    connectBtn.disabled = false;
}

function isValidUrl(url: string) {
    var urlPattern = new RegExp(
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
    connectBtn.innerHTML = 'Connect to Canvas';  

    infoWidgetContainer.innerHTML = '';
    infoWidgetContainer.classList.remove('hide');

    separatorContainer.classList.remove('hide');
}

function showProfileIconAndName(profile: CanvasAPI.User) {
    infoWidgetContainer.classList.add('hide');
    
    setupLoginContainer.classList.add('disable');
    setupProfileContainer.classList.remove('hide');
        
    profileIcon.src = profile.avatar_url;
    profileName.innerText = profile.name;
}
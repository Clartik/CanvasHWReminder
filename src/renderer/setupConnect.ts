const setupLoginContainer = document.getElementById('setup-login-container')! as HTMLDivElement;
const setupProfileContainer = document.getElementById('setup-profile-container')! as HTMLDivElement;

const canvasBaseURLInput = document.getElementById('base-url-input')! as HTMLInputElement;
const canvasAPITokenInput = document.getElementById('api-token-input')! as HTMLInputElement;

const connectBtn = document.getElementById('connect-btn')! as HTMLButtonElement;
const yesBtn = document.getElementById('yes-btn')! as HTMLButtonElement;
const noBtn = document.getElementById('no-btn')! as HTMLButtonElement;

const profileIcon = document.getElementById('profile-icon')! as HTMLImageElement;
const profileName = document.getElementById('profile-name')! as HTMLHeadingElement;

canvasBaseURLInput.addEventListener('input', checkIfConnectBtnCanBeEnabled);
canvasAPITokenInput.addEventListener('input', checkIfConnectBtnCanBeEnabled);

async function sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

const LOADING_CIRCLE_TEMPLATE = `
    <img id="spinner" src="../assets/svg/spinner.svg" width="30px">
`;

connectBtn.addEventListener('click', async () => {
    if (!canvasBaseURLInput.value || !canvasAPITokenInput.value || !isValidUrl(canvasBaseURLInput.value))
        return;

    connectBtn.innerHTML = LOADING_CIRCLE_TEMPLATE;
    await sleep(3 * 1000);
    connectBtn.innerHTML = 'Connect to Canvas';


    setupLoginContainer.classList.add('disable');
    setupProfileContainer.classList.remove('hide');
});

noBtn.addEventListener('click', () => {
    setupLoginContainer.classList.remove('disable');
    setupProfileContainer.classList.add('hide');
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

const isValidUrl = (url: string) => {
    var urlPattern = new RegExp(
        '^(https?:\\/\\/)?' + // validate protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
    return !!urlPattern.test(url);
}
const canvasBaseURLInput = document.getElementById('base-url-input')! as HTMLInputElement;

const urlNextBtn = document.getElementById('next-btn')! as HTMLButtonElement;

setupBaseURLMain();

//#region Event Listeners

canvasBaseURLInput.addEventListener('input', checkIfURLNextBtnCanBeEnabled)

urlNextBtn.addEventListener('click', () => {
    window.api.send('saveSecureText', 'CanvasBaseURL', canvasBaseURLInput.value);

    window.location.href = '../pages/setupAPIToken.html';
})

//#endregion

//#region Functions

async function setupBaseURLMain() {
    const canvasBaseUrl: string | null = await window.api.invoke('getSecureText', 'CanvasBaseURL');

    if (!canvasBaseUrl)
        return;

    canvasBaseURLInput.value = canvasBaseUrl;

    checkIfURLNextBtnCanBeEnabled();
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

function checkIfURLNextBtnCanBeEnabled() {
    if (!canvasBaseURLInput.value || !isValidUrl(canvasBaseURLInput.value) || !isValidCanvasUrl(canvasBaseURLInput.value)) {
        urlNextBtn.disabled = true;
        return;
    }

    urlNextBtn.disabled = false;
}

//#endregion
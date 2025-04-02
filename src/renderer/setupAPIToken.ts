const canvasAPITokenInput = document.getElementById('api-token-input')! as HTMLInputElement;

const apiNextBtn = document.getElementById('next-btn')! as HTMLButtonElement;

setupAPITokenMain();

//#region Event Listeners

canvasAPITokenInput.addEventListener('input', checkIfTokenNextBtnCanBeEnabled)

apiNextBtn.addEventListener('click', () => {
    window.api.send('saveSecureText', 'CanvasAPIToken', canvasAPITokenInput.value);
    
    window.location.href = '../pages/setupConnect.html';
})

//#endregion

//#region Functions

async function setupAPITokenMain() {
    const canvasAPIToken: string | null = await window.api.invoke('getSecureText', 'CanvasAPIToken');

    if (!canvasAPIToken)
        return;

    canvasAPITokenInput.value = canvasAPIToken;

    checkIfTokenNextBtnCanBeEnabled();
}

function checkIfTokenNextBtnCanBeEnabled() {
    if (!canvasAPITokenInput.value) {
        apiNextBtn.disabled = true;
        return;
    }

    apiNextBtn.disabled = false;
}

//#endregion
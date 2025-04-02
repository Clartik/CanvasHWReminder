const termsCheckbox = document.getElementById('terms-checkbox')! as HTMLInputElement;
const welcomeBtn = document.getElementById('welcome-btn')! as HTMLButtonElement;

const termsLink = document.getElementById('terms-link')! as HTMLSpanElement;

termsCheckbox.addEventListener('change', () => {
    if (!termsCheckbox.checked) {
        welcomeBtn.disabled = true;
        return;
    }

    welcomeBtn.disabled = false;
})

termsLink.addEventListener('click', () => {
    window.api.send('openLink', 'https://clartik.github.io/CanvasHWReminder-Website/tos.html');
})
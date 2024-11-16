const websiteLinkBtn = document.getElementById('website-btn')! as HTMLButtonElement;

const termsLinkCredits = document.getElementById('terms-link')! as HTMLSpanElement;

websiteLinkBtn.addEventListener('click', () => {
    window.api.openLink('https://clartik.github.io/CanvasHWReminder-Website');
});

termsLinkCredits.addEventListener('click', () => {
    window.api.openLink('https://clartik.github.io/CanvasHWReminder-Website/tos.html');
})
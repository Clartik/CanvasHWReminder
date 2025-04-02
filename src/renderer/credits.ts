const websiteLinkBtn = document.getElementById('website-btn')! as HTMLButtonElement;

const termsLinkCredits = document.getElementById('terms-link')! as HTMLSpanElement;
const privacyLinkCredits = document.getElementById('privacy-link')! as HTMLSpanElement;

websiteLinkBtn.addEventListener('click', () => {
    window.api.send('openLink', 'https://canvashwreminder.com/');
});

termsLinkCredits.addEventListener('click', () => {
    window.api.send('openLink', 'https://canvashwreminder.com/tos');
})

privacyLinkCredits.addEventListener('click', () => {
    window.api.send('openLink', 'https://canvashwreminder.com/privacy');
})
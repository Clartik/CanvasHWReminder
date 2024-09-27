const githubLinkBtn = document.getElementById('github-btn')! as HTMLButtonElement;
const websiteLinkBtn = document.getElementById('website-btn')! as HTMLButtonElement;
// const youtubeLinkBtn = document.getElementById('youtube-link-btn')! as HTMLButtonElement;
// const instagramLinkBtn = document.getElementById('instragram-link-btn')! as HTMLButtonElement;

githubLinkBtn.addEventListener('click', () => {
    window.api.openLink('https://github.com/Clartik/CanvasHWReminder');
})

websiteLinkBtn.addEventListener('click', () => {
    window.api.openLink('https://google.com');
});
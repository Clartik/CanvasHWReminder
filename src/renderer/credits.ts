const githubLinkBtn = document.getElementById('github-btn')! as HTMLButtonElement;
const websiteLinkBtn = document.getElementById('website-btn')! as HTMLButtonElement;
const youtubeLinkBtn = document.getElementById('youtube-btn')! as HTMLButtonElement;
// const instagramLinkBtn = document.getElementById('instragram-link-btn')! as HTMLButtonElement;

githubLinkBtn.addEventListener('click', () => {
    window.api.openLink('https://github.com/Clartik/CanvasHWReminder');
})

websiteLinkBtn.addEventListener('click', () => {
    window.api.openLink('https://trello.com/b/cdFdMcDf/canvas-hw-reminder');
});

youtubeLinkBtn.addEventListener('click', () => {
    window.api.openLink('https://www.youtube.com/@kartech6079')
});
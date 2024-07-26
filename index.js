var toggler = document.getElementsByClassName("dropdown-header");

for (let i = 0; i < toggler.length; i++) {
    toggler[i].addEventListener("click", function() {
        this.parentElement.querySelector(".box").classList.toggle("expand");
        // this.classList.toggle("");
    });
}
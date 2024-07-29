let headers = document.getElementsByClassName("dropdown-header");
let headers_text = document.getElementsByClassName('dropdown-header-text');
let boxes = document.getElementsByClassName("box");

let classes: Array<Class>;

(async () => {
    const classData: ClassData = await window.api.getJSONData('../classes.json');
    classes = classData.classes;

    for (let i = 0; i < classes.length; i++) {
        headers_text[i].innerHTML = classes[i].name;
    }
})();

for (let i = 0; i < boxes.length; i++) {

}

for (let i = 0; i < headers.length; i++) {
    headers[i].addEventListener("click", function() {
        headers[i].classList.toggle('active');
        headers[i].parentElement?.querySelector(".box")?.classList.toggle("expand");
    });
}

interface Assignment {
    readonly name: string;
    readonly points: Number;
    readonly due_date: string;
}

interface Class {
    readonly name: string;
    readonly professor: string;
    readonly assignments: Array<Assignment>;
}

interface ClassData {
    readonly classes: Array<Class>;
}
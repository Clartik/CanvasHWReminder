"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let headers = document.getElementsByClassName("dropdown-header");
let headers_text = document.getElementsByClassName('dropdown-header-text');
let boxes = document.getElementsByClassName("box");
let classes;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const classData = yield window.api.getJSONData('../classes.json');
    classes = classData.classes;
    for (let i = 0; i < classes.length; i++) {
        headers_text[i].innerHTML = classes[i].name;
    }
}))();
for (let i = 0; i < boxes.length; i++) {
}
for (let i = 0; i < headers.length; i++) {
    headers[i].addEventListener("click", function () {
        var _a, _b;
        headers[i].classList.toggle('active');
        (_b = (_a = headers[i].parentElement) === null || _a === void 0 ? void 0 : _a.querySelector(".box")) === null || _b === void 0 ? void 0 : _b.classList.toggle("expand");
    });
}

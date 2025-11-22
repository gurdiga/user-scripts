// ==UserScript==
// @name         DEXonline.ro user-style
// @namespace    http://tampermonkey.net/
// @version      1.123
// @description  DEXonline.ro user-style
// @author       You
// @match        https://dexonline.ro/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dexonline.ro
// ==/UserScript==

(function () {
  "use strict";

  log("BEGIN");

  /**
   * @type {HTMLInputElement | null}
   */
  const searchField = document.querySelector("#searchField");

  if (searchField) {
    log("found searchField", searchField);
    searchField.style.fontSize = "1rem";
    log("fontSize set to", searchField.style.fontSize);
  }

  log("END");
})();

function log(...args) {
  console.log("+++ User-script", ...args);
}

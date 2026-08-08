// ==UserScript==
// @name         DEXonline.ro
// @namespace    http://tampermonkey.net/
// @version      2024-08-14
// @description  try to take over the world!
// @author       You
// @match        https://dexonline.ro/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dexonline.ro
// @require      file:///Users/vlad/src/user-scripts/dexonline.user.js
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  if (!("GM_addStyle" in window)) {
    window.GM_addStyle = (css) => {
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
    };
  }

  GM_addStyle(`
        #searchField {
            font-size: 1rem;
        }

        a[href="https://dexonline.ro/spre/formular230"],
        a[href="https://formular230.ro/asociatia-dexonline"],
        button[data-permalink$="/pronuntie"],
        .pollModal,
        .banner-section {
            display: none;
        }
    `);
})();

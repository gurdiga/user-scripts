// ==UserScript==
// @name         VB24 autofill custom fields
// @namespace    https://web.vb24.md/
// @version      2026-09-07
// @description  Sets aria-label on fields from their visible captions.
// @author       You
// @match        https://web.vb24.md/wb/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=vb24.md
// @run-at       document-idle
// @grant        none
// @require      file:///Users/vlad/src/user-scripts/vb24.user.js
// ==/UserScript==

(function () {
  "use strict";

  console.log("+++ VB24 users-cript BEGIN");

  function applyLabel() {
    // This is to facilitate BitWarden custom field auto-fill.
    const selectors = [
      '[data-mask="PHONE_ORANGE"]',
      '[name="CUSTOM_IDT"]', // Starnet ID
    ].join();

    const field = document.querySelector(selectors);
    const caption = field?.closest(".field-wrapper")?.querySelector(".field-caption")?.textContent?.trim();

    if (caption && field?.getAttribute("aria-label") !== caption) {
      field.setAttribute("aria-label", caption);
    }
  }

  applyLabel();

  // VB24 is a single-page application, so the field may appear later.
  new MutationObserver(applyLabel).observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log("+++ VB24 users-cript END");
})();

// ==UserScript==
// @name         Gmail
// @namespace    https://mail.google.com/
// @version      1.0.0
// @description  Shows a message's full subject in the native browser tooltip when hovering over it in Gmail.
// @match        https://mail.google.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const rev = "ee89ecd";

  console.log(`+++ User-style add BEGIN ${rev}`);

  GM_addElement("link", {
    href: `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${rev}/gmail.css`,
    rel: "stylesheet",
  });

  console.log(`+++ User-style add END`);

  console.log(`+++ Full Subject on Hover BEGIN`);

  (() => {
    const SUBJECT_SELECTOR = 'tr[role="row"] span.bog';

    addTitles();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          const subjectElement = mutation.target.parentElement?.closest(SUBJECT_SELECTOR);

          if (subjectElement) {
            addTitle(subjectElement);
          }

          continue;
        }

        mutation.addedNodes.forEach(addTitles);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    function addTitle(subjectElement) {
      const subject = subjectElement.textContent.trim();

      if (subject && subjectElement.title !== subject) {
        subjectElement.title = subject;
      }
    }

    function addTitles(root = document) {
      if (root.nodeType !== Node.ELEMENT_NODE && root !== document) {
        return;
      }

      if (root !== document && root.matches(SUBJECT_SELECTOR)) {
        addTitle(root);
      }

      root.querySelectorAll(SUBJECT_SELECTOR).forEach(addTitle);
    }
  })();

  console.log(`+++ Full Subject on Hover END`);
})();

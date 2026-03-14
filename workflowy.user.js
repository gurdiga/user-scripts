// ==UserScript==
// @name         WorkFlowy user-style
// @namespace    http://tampermonkey.net/
// @version      1.123
// @description  WorkFlowy user-style
// @author       You
// @match        https://workflowy.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=workflowy.com
// @grant        GM.addStyle
// ==/UserScript==

(function () {
  "use strict";

  const styleRevision = "d4316f1";
  const cssUrl = `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${styleRevision}/workflowy.css`;

  const isDesktop = !(navigator.maxTouchPoints > 0);

  console.log(`+++ User-style BEGIN ${styleRevision}`);

  if (isDesktop) {
    GM_addElement("link", {
      href: cssUrl,
      rel: "stylesheet",
    });
  } else {
    fetch(cssUrl)
      .then((r) => r.text())
      .then((css) => GM.addStyle(css));
  }

  console.log("+++ User-style END");

  console.log("+++ No-Escape BEGIN");

  /**
   * Suppresses native Escape handling and dismisses the Workflowy toolbar when plain Escape is pressed.
   *
   * @param {KeyboardEvent} e Keyboard event triggered on the window during capture phase.
   */
  const handler = (e) => {
    if (e.key != "Escape") return;

    const { target } = e;

    if (!(target instanceof HTMLElement)) return;

    const isFormField = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target instanceof HTMLButtonElement;

    if (isFormField) return;

    if (areAnyItemsSelected()) {
      setTimeout(() => document.querySelector("#srch-input").blur(), 50);

      return;
    }

    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();

    if (target.isContentEditable) dismissToolbar();
  };

  // Capture phase so we run before WF's own listeners
  window.addEventListener("keydown", handler, true);
  window.addEventListener("keyup", handler, true);

  function dismissToolbar() {
    const toolbar = document.querySelector(".ctx-menu");

    if (toolbar && toolbar.parentNode) {
      toolbar.style.display = "none";
      window.getSelection()?.removeAllRanges();
    }
  }

  /**
   * WorkFlowy has its own item selection mechanism, different from dom
   * Selection DOM API. When I select a few items, a context menu comes
   * up. This function tells me if there are any items selected.
   *
   * @returns boolean
   */
  function areAnyItemsSelected() {
    return !!document.querySelector(".addedToSelection");
  }

  console.log("+++ No-Escape END");
})();

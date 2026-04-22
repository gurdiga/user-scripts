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

  const styleRevision = "6fecbaa";
  const cssUrl = `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${styleRevision}/workflowy.css`;
  const fontCssUrl = `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${styleRevision}/bookerly.css`;

  const isDesktop = !(navigator.maxTouchPoints > 0);

  console.log(`+++ User-style BEGIN ${styleRevision}`);

  if (isDesktop) {
    GM_addElement("link", {
      href: cssUrl,
      rel: "stylesheet",
    });
    GM_addElement("link", {
      href: fontCssUrl,
      rel: "stylesheet",
    });
  } else {
    fetch(cssUrl)
      .then((r) => r.text())
      .then((css) => GM.addStyle(css));
    fetch(fontCssUrl)
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

  // Wait for WF API to be ready
  const install = () => {
    console.log("+++ Fix Ctrl+▲/▼ TRY");

    try {
      if (!WF || !WF.focusedItem || !WF.collapseItem) {
        console.log("+++ Fix Ctrl+▲/▼ RETRY", { WF });
        setTimeout(install, 500);
        return;
      }
    } catch (e) {
      if (e.message === "WF is not defined") {
        console.log("+++ Fix Ctrl+▲/▼ RETRY");
        setTimeout(install, 500);
        return;
      } else {
        console.log("+++ Fix Ctrl+▲/▼ ERROR", { e });
        return;
      }
    }

    console.log("+++ Fix Ctrl+▲/▼ BEGIN");

    const handler = function (e) {
      if (!e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

      const item = WF.focusedItem();
      if (!item || !item.data || !item.data.ch || item.data.ch.length === 0) return;

      const el = WF.getItemDOMElement(item);

      if (e.key === "ArrowUp") {
        // Ctrl+Up = Collapse
        if (el && !el.classList.contains("collapsed")) {
          WF.collapseItem(item);
          e.preventDefault();
          e.stopPropagation();
        }
      } else {
        // Ctrl+Down = Expand
        if (el && !el.classList.contains("open")) {
          WF.expandItem(item);
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener("keydown", handler, true);
    console.log("+++ Ctrl+▲/▼ shortcuts restored.");

    console.log("+++ Fix Ctrl+▲/▼ END");
  };

  install();
})();

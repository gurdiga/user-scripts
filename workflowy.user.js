// ==UserScript==
// @name         WorkFlowy user-style
// @namespace    http://tampermonkey.net/
// @version      1.123
// @description  WorkFlowy user-style
// @author       You
// @match        https://workflowy.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=workflowy.com
// @grant        GM.addStyle
// @require      file:///Users/vlad/src/user-scripts/workflowy.user.js
// ==/UserScript==

(async function main() {
  const styleRevision = "49e02cd";

  ("use strict");

  const isDesktop = !(navigator.maxTouchPoints > 0);

  loadUserStyle();

  if (isDesktop) {
    disableEscapeSearch();
    fixExpandCollapseShortcut();
  }

  async function loadUserStyle() {
    log(`loadUserStyle BEGIN ${styleRevision}`);

    const cssUrl = `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${styleRevision}/workflowy.css`;
    const fontCssUrl = `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${styleRevision}/bookerly.css`;

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
      await loadCss(cssUrl);
      await loadCss(fontCssUrl);
    }

    log("loadUserStyle END");
  }

  async function loadCss(url) {
    try {
      log(`Loading CSS: ${url}`);
      const response = await fetch(url);
      log(`CSS loaded: ${url} ${response.status}`);
      const css = await response.text();
      GM.addStyle(css);
    } catch (err) {
      console.error("CSS load error:", url, err);
    }
  }

  function disableEscapeSearch() {
    log("disableEscapeSearch BEGIN");

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

    log("disableEscapeSearch END");
  }

  function fixExpandCollapseShortcut() {
    log("Fix Ctrl+▲/▼ TRY");

    // Wait for WF API to be ready
    try {
      if (!WF || !WF.focusedItem || !WF.collapseItem) {
        log("Fix Ctrl+▲/▼ RETRY", { WF });
        setTimeout(fixExpandCollapseShortcut, 500);
        return;
      }
    } catch (e) {
      if (e.message === "WF is not defined") {
        log("Fix Ctrl+▲/▼ RETRY");
        setTimeout(fixExpandCollapseShortcut, 500);
        return;
      } else {
        log("Fix Ctrl+▲/▼ ERROR", { e });
        return;
      }
    }

    log("Fix Ctrl+▲/▼ BEGIN");

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
    log("Ctrl+▲/▼ shortcuts restored.");

    log("Fix Ctrl+▲/▼ END");
  }

  function log(message) {
    console.log(`+++ ${message}`);
  }
})();

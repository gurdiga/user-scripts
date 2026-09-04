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

  addFade();

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

  function addFade() {
    log(`addFade BEGIN`);

    // ---------------------------------------------------------------------
    // The two controls are hidden by two different mechanisms, so each needs
    // its own treatment.
    //
    // 1. The "…" menu (.itemMenu) is removed from the DOM when you leave a row
    //    and inserted again when you hover the next one, always already at full
    //    opacity — so WorkFlowy's own `transition-opacity` has no earlier value
    //    to animate from.
    //
    //    Its opacity also cannot be overridden, because WorkFlowy ships:
    //      .is-desktop .name:not(.name--root):hover > .itemMenu { opacity: 1 !important }
    //    An author `!important` outranks inline styles *and* CSS animations, so
    //    anything driving `opacity` loses. `filter: opacity()` produces the same
    //    visual result and nothing else on the page uses `filter`, so a keyframe
    //    animation on it wins cleanly — and keyframes, unlike transitions, run
    //    on freshly inserted elements.
    //
    // 2. The collapse arrow (.expand) is always in the DOM. It is revealed by
    //    switching its `color` from transparent to a visible grey, which the
    //    arrow's `fill: currentColor` picks up. A plain `color` transition is
    //    all it needs. The transition is deliberately NOT applied to the inner
    //    <svg>, which carries its own `transform` transition for the rotation
    //    when a bullet is expanded or collapsed.
    // ---------------------------------------------------------------------

    var DURATION = "200ms"; // WorkFlowy's own timing; raise to taste
    var EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

    var css = [
      "@keyframes wfBulletMenuFadeIn {",
      "  from { filter: opacity(0); }",
      "  to   { filter: opacity(1); }",
      "}",
      ".itemMenu {",
      "  animation: wfBulletMenuFadeIn " + DURATION + " " + EASING + ";",
      "}",
      ".expand,",
      ".expand path {",
      "  transition: color " + DURATION + " " + EASING + ";",
      "}",
      "@media (prefers-reduced-motion: reduce) {",
      "  .itemMenu { animation: none; }",
      "  .expand, .expand path { transition: none; }",
      "}",
    ].join("\n");

    function injectStyle() {
      if (document.getElementById("wf-fade-bullet-menu")) return;

      var style = document.createElement("style");
      style.id = "wf-fade-bullet-menu";
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }

    injectStyle();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", injectStyle);
    }

    // WorkFlowy is a single-page app; re-add the stylesheet if it ever goes away.
    new MutationObserver(injectStyle).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    log(`addFade END`);
  }
})();

(function () {
  "use strict";

  const styleRevision = "ee9d872";

  console.log(`+++ User-style BEGIN ${styleRevision}`);

  GM_addElement("link", {
    href: `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${styleRevision}/workflowy.css`,
    rel: "stylesheet",
  });

  console.log("+++ User-style END");

  const isDesktop = !(navigator.maxTouchPoints > 0);

  if (isDesktop) {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        document.getSelection().collapseToStart();
      }
    });
  }

  console.log(`+++ No-Escape BEGIN ${styleRevision}`);

  /**
   * Suppresses native Escape handling and dismisses the Workflowy toolbar when plain Escape is pressed.
   *
   * @param {KeyboardEvent} e Keyboard event triggered on the window during capture phase.
   */
  const handler = (e) => {
    // plain Esc only; let Cmd/Ctrl/Alt/Shift combos through
    if (e.key != "Escape" || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.isContentEditable) {
      dismissToolbar();
      return true;
    }

    const isFormField =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLButtonElement ||
      Boolean(target.closest("[role='textbox'], [role='combobox'], input, textarea, select, button"));

    if (isFormField) return;

    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
  };

  // Capture phase so we run before WF's own listeners
  window.addEventListener("keydown", handler, true);
  window.addEventListener("keyup", handler, true);

  // Extra safeguard: if something *does* focus the search box, immediately blur it.
  window.addEventListener(
    "focusin",
    (e) => {
      const el = e.target;
      if (!el) return;
      const isSearchish =
        el.type === "search" || (el.placeholder && /search/i.test(el.placeholder)) || (el.getAttribute && /search/i.test(el.getAttribute("aria-label") || "")) || (el.id && /search/i.test(el.id));

      if (isSearchish) {
        // Give WF a tick to finish its focus logic, then blur.
        setTimeout(() => {
          if (document.activeElement === el) el.blur();
        }, 0);
      }
    },
    true
  );

  function dismissToolbar() {
    // Look for toolbar by class/role; tweak selectors if WF changes DOM
    const toolbar = document.querySelector(".ctx-menu");

    if (toolbar && toolbar.parentNode) {
      // safest: hide instead of removing
      toolbar.style.display = "none";
      // optional: also clear any text selection so toolbar doesn't reappear
      if (window.getSelection) {
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
      }
    }
  }

  console.log(`+++ No-Escape END ${styleRevision}`);
})();

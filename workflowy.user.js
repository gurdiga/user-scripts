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

  if (!isDesktop) return;

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

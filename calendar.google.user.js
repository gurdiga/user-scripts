// ==UserScript==
// @name         Google Calendar
// @namespace    http://tampermonkey.net/
// @version      2025-01-27
// @description  try to take over the world!
// @author       You
// @match        https://calendar.google.com/calendar/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  GM_addStyle(`
[role="button"][aria-label*=", Completed,"] {
  text-decoration: none;
}

html,
body,
div,
span,
p,
a,
td,
th,
input,
button,
select,
textarea,
label {
  font-family: system-ui !important;
}
    `);

  linkifyPendingTask();
})();

// Kudos to Codex 5.6 sol
// Thu Sep  3 08:31:59 EEST 2026
function linkifyPendingTask() {
  "use strict";

  const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/gi;
  const TRAILING_PUNCTUATION = /[),.;:!?\]}]+$/;

  function makeLink(url) {
    const link = document.createElement("a");
    link.href = url;
    link.textContent = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.style.color = "var(--gm3-sys-color-primary, #0b57d0)";
    link.style.textDecoration = "underline";
    link.style.cursor = "pointer";

    // Prevent Calendar's surrounding task row from handling the link click.
    link.addEventListener("click", (event) => event.stopPropagation());
    link.addEventListener("mousedown", (event) => event.stopPropagation());
    return link;
  }

  function linkifyTextNode(textNode) {
    const text = textNode.nodeValue;
    URL_PATTERN.lastIndex = 0;

    let match;
    let cursor = 0;
    let changed = false;
    const fragment = document.createDocumentFragment();

    while ((match = URL_PATTERN.exec(text)) !== null) {
      let url = match[0];
      let trailing = "";

      const punctuation = url.match(TRAILING_PUNCTUATION);
      if (punctuation) {
        trailing = punctuation[0];
        url = url.slice(0, -trailing.length);
      }

      if (!url) continue;

      fragment.append(text.slice(cursor, match.index));
      fragment.append(makeLink(url));
      fragment.append(trailing);
      cursor = match.index + match[0].length;
      changed = true;
    }

    if (!changed) return;
    fragment.append(text.slice(cursor));
    textNode.replaceWith(fragment);
  }

  function linkifyContainer(container) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !URL_PATTERN.test(node.nodeValue)) {
          URL_PATTERN.lastIndex = 0;
          return NodeFilter.FILTER_REJECT;
        }
        URL_PATTERN.lastIndex = 0;

        const parent = node.parentElement;
        if (!parent || parent.closest("a, button, input, textarea, script, style")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(linkifyTextNode);
  }

  function linkifyPendingTasks() {
    // Google Calendar labels this list "Tasks" in the Pending tasks dialog.
    document.querySelectorAll('[role="dialog"] [role="list"][aria-label="Tasks"] [role="listitem"]').forEach(linkifyContainer);
  }

  let scheduled = false;
  const scheduleLinkify = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      linkifyPendingTasks();
    });
  };

  new MutationObserver(scheduleLinkify).observe(document.body, {
    childList: true,
    subtree: true,
  });

  scheduleLinkify();
}

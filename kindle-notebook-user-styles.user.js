(function () {
  "use strict";

  GM_addElement("style", {
    textContent: `
      .kp-notebook-highlight,
      .kp-notebook-note {
        margin-bottom: 1em;
        max-width: 42em;
      }

      .kp-notebook-highlight > *,
      .kp-notebook-note > * {
        font-family: Bookerly;
        line-height: normal !important;
      }

      span[id="note-label"] {
        display: block;
      }
    `,
  });

  console.log("User-style added");
})();

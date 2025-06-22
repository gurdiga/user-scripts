(function () {
  "use strict";

  const styleRevision = "3d7b57d";

  console.log(`+++ User-style added BEGIN ${styleRevision}`);

  GM_addElement("link", {
    href: `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${styleRevision}/workflowy.css`,
    rel: "stylesheet",
  });

  console.log("+++ User-style added END");

  const isDesktop = !(navigator.maxTouchPoints > 0);

  if (isDesktop) {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        document.getSelection().collapseToStart();
      }
    });

    console.log("+++ Theme-color set BEGIN");

    const headerBackgroundColor = getComputedStyle(document.querySelector("#app .header")).backgroundColor;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", headerBackgroundColor);
    } else {
      GM_addElement("meta", {
        name: "theme-color",
        media: "(prefers-color-scheme: dark)",
        content: headerBackgroundColor,
      });
    }

    console.log("+++ Theme-color set END");
  }
})();

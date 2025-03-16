(function () {
  "use strict";

  const styleRevision = "266724d";

  console.log(`+++ User-style added BEGIN ${styleRevision}`);

  GM_addElement("link", {
    href: `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${styleRevision}/workflowy.css`,
    rel: "stylesheet",
  });

  console.log("+++ User-style added END");

  const isMobile = navigator.maxTouchPoints > 0;

  if (!isMobile) {
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

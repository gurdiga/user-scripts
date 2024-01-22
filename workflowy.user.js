(function () {
  "use strict";

  const rev = "7c8d562";

  console.log("+++ User-style added BEGIN");

  GM_addElement("link", {
    href: `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${rev}/workflowy.css`,
    rel: "stylesheet",
  });

  console.log("+++ User-style added END");

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
})();

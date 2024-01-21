(function () {
  "use strict";

  const rev = "7c8d562";

  GM_addElement("link", {
    href: `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${rev}/workflowy.css`,
    rel: "stylesheet",
  });

  console.log("+++ User-style added");

  GM_addElement("meta", {
    name: "theme-color",
    media: "(prefers-color-scheme: dark)",
    content: "#1f1f1e",
  });

  console.log("+++ Theme-color set");
})();

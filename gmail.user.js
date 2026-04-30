(function () {
  "use strict";

  const rev = "ee89ecd";

  GM_addElement("link", {
    href: `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${rev}/gmail.css`,
    rel: "stylesheet",
  });

  console.log(`+++ User-style added ${rev}`);
})();

(function () {
  "use strict";

  const rev = "4642aaf";

  GM_addElement("link", {
    href: `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${rev}/gmail.css`,
    rel: "stylesheet",
  });

  console.log("+++ User-style added");
})();

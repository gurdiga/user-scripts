(function () {
  "use strict";

  const rev = "93e2e9f";

  GM_addElement("link", {
    href: `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${rev}/gmail.css`,
    rel: "stylesheet",
  });

  console.log("+++ User-style added");
})();

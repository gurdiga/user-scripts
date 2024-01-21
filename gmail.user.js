(function () {
  "use strict";

  const rev = "8f2d4ce"; // last bc0e0ec

  GM_addElement("link", {
    href: `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${rev}/gmail.css`,
    rel: "stylesheet",
  });

  console.log("+++ User-style added");
})();

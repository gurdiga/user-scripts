(function () {
  "use strict";

  console.log("+++ User-script BEGIN: Kindle Notebook Deep Linking");

  window.addEventListener("load", () => {
    console.log("load");

    const asin = location.hash.slice(1);

    if (!asin) {
      console.log("No ASIN");
      return;
    }

    const sidebarThumbnail = document.getElementById(asin).firstElementChild;

    console.log({ asin, sidebarThumbnail });

    sidebarThumbnail.click();
  });

  console.log("+++ User-script END");
})();

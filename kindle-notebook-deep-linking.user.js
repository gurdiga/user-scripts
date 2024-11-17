(function () {
  "use strict";

  console.log("+++ User-script BEGIN: Kindle Notebook Deep Linking");

  const asin = location.hash.slice(1);

  console.log("+++ User-script", { asin });

  if (!asin) {
    console.log("+++ User-script No ASIN found");
    return;
  } else {
    console.log("+++ User-script", { asin });
  }

  const interval = setInterval(() => {
    console.log("+++ User-script setInterval");

    const sidebarThumbnail = document.getElementById(asin).firstElementChild;

    if (!sidebarThumbnail) {
      console.log(`+++ User-script element not yet found by ID: "${asin}"`);
      return;
    }

    console.log("+++ User-script", { sidebarThumbnail });

    sidebarThumbnail.click();

    console.log("+++ User-script clicked sidebarThumbnail");

    clearInterval(interval);
  }, 300);

  console.log("+++ User-script END");
})();

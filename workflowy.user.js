// ==UserScript==
// @name         WorkFlowy user-style
// @namespace    http://tampermonkey.net/
// @version      1.123
// @description  WorkFlowy user-style
// @author       You
// @match        https://workflowy.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=workflowy.com
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function () {
  "use strict";

  const styleRevision = "c9301ad";
  const cssUrl = `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${styleRevision}/workflowy.css`;

  const isDesktop = !(navigator.maxTouchPoints > 0);

  if (isDesktop) {
    console.log(`+++ User-style BEGIN ${styleRevision}`);

    GM_addElement("link", {
      href: `https://cdn.jsdelivr.net/gh/gurdiga/user-styles@${styleRevision}/workflowy.css`,
      rel: "stylesheet",
    });

    console.log("+++ User-style END");
  } else {
    const BOOKERLY_FONTS = [
      { id: "regular", url: "https://gurdiga.com/assets/bookerly/Bookerly-Regular.ttf", mime: "font/ttf" },
      { id: "bold", url: "https://gurdiga.com/assets/bookerly/Bookerly-Bold.ttf", mime: "font/ttf" },
      { id: "italic", url: "https://gurdiga.com/assets/bookerly/Bookerly-RegularItalic.ttf", mime: "font/ttf" },
      { id: "bold-italic", url: "https://gurdiga.com/assets/bookerly/Bookerly-BoldItalic.ttf", mime: "font/ttf" },
    ];

    initStyles(BOOKERLY_FONTS).catch((error) => console.error("Failed to initialize Workflowy styles.", error));
    return;
  }

  console.log("+++ No-Escape BEGIN");

  /**
   * Suppresses native Escape handling and dismisses the Workflowy toolbar when plain Escape is pressed.
   *
   * @param {KeyboardEvent} e Keyboard event triggered on the window during capture phase.
   */
  const handler = (e) => {
    if (e.key != "Escape") return;

    const { target } = e;

    if (!(target instanceof HTMLElement)) return;

    const isFormField = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target instanceof HTMLButtonElement;

    if (isFormField) return;

    if (areAnyItemsSelected()) {
      setTimeout(() => document.querySelector("#srch-input").blur(), 50);

      return;
    }

    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();

    if (target.isContentEditable) dismissToolbar();
  };

  // Capture phase so we run before WF's own listeners
  window.addEventListener("keydown", handler, true);
  window.addEventListener("keyup", handler, true);

  function dismissToolbar() {
    const toolbar = document.querySelector(".ctx-menu");

    if (toolbar && toolbar.parentNode) {
      toolbar.style.display = "none";
      window.getSelection()?.removeAllRanges();
    }
  }

  /**
   * WorkFlowy has its own item selection mechanism, different from dom
   * Selection DOM API. When I select a few items, a context menu comes
   * up. This function tells me if there are any items selected.
   *
   * @returns boolean
   */
  function areAnyItemsSelected() {
    return !!document.querySelector(".addedToSelection");
  }

  console.log("+++ No-Escape END");

  async function initStyles(fonts) {
    console.log(`+++ initStyles BEGIN ${styleRevision}`);

    let cssText;

    try {
      cssText = await gmFetchText(cssUrl);
    } catch (error) {
      console.error("Unable to fetch CSS via GM.xmlHttpRequest; falling back to link element.", error);
      appendElement("link", { rel: "stylesheet", href: cssUrl });
      console.log("+++ initStyles END (fallback link)");
      return;
    }

    let processedCss = cssText;

    try {
      processedCss = await inlineBookerlyFonts(cssText, fonts);
    } catch (error) {
      console.warn("Bookerly font inlining failed; continuing with remote font URLs.", error);
    }

    const styleElement = appendElement("style");
    styleElement.textContent = processedCss;

    console.log("+++ User-style END");
  }

  async function inlineBookerlyFonts(cssText, fonts) {
    console.log("+++ inlineBookerlyFonts BEGIN");

    let updatedCss = cssText;

    for (const font of fonts) {
      try {
        const dataUrl = await getCachedBookerlyFont(font);
        updatedCss = replaceAll(updatedCss, `url(${font.url})`, `url(${dataUrl})`);
      } catch (error) {
        console.warn(`Failed to inline Bookerly font "${font.id}".`, error);
      }
    }

    console.log("+++ inlineBookerlyFonts END");

    return updatedCss;
  }

  async function getCachedBookerlyFont(font) {
    const storageKey = `workflowy-bookerly:${font.id}:${font.url}`;
    const cached = await GM.getValue(storageKey);

    if (cached) {
      console.log("+++ getCachedBookerlyFont cached");
      return cached;
    }

    const fontBuffer = await gmFetchArrayBuffer(font.url);

    const dataUrl = `data:${font.mime};base64,${arrayBufferToBase64(fontBuffer)}`;

    await GM.setValue(storageKey, dataUrl);
    console.log("+++ stored", storageKey);

    return dataUrl;
  }

  function replaceAll(haystack, needle, replacement) {
    return haystack.split(needle).join(replacement);
  }

  function gmRequest(details) {
    return new Promise((resolve, reject) => {
      const requester = (typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function" && GM.xmlHttpRequest.bind(GM)) || (typeof GM_xmlhttpRequest === "function" && GM_xmlhttpRequest);

      if (!requester) {
        reject(new Error("GM.xmlHttpRequest is not available in this environment."));
        return;
      }

      requester({
        ...details,
        onload: (response) => {
          if (typeof response.status === "number" && response.status >= 400) {
            reject(new Error(`Request for ${details.url} failed with status ${response.status}.`));
            return;
          }

          resolve(response);
        },
        onerror: () => reject(new Error(`Network error while fetching ${details.url}.`)),
        ontimeout: () => reject(new Error(`Timed out while fetching ${details.url}.`)),
      });
    });
  }

  async function gmFetchText(url) {
    console.log("+++ gmFetchText BEGIN");
    const response = await gmRequest({ method: "GET", url });
    console.log("+++ gmFetchText END");
    return typeof response.responseText === "string" ? response.responseText : response.response;
  }

  async function gmFetchArrayBuffer(url) {
    console.log("+++ gmFetchArrayBuffer BEGIN");
    const response = await gmRequest({ method: "GET", url, responseType: "arraybuffer" });
    console.log("+++ gmFetchArrayBuffer END");
    return response.response;
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = "";

    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }

    return btoa(binary);
  }

  function appendElement(tagName, attributes = {}, parent = document.head || document.documentElement) {
    const element = document.createElement(tagName);

    for (const [key, value] of Object.entries(attributes)) {
      if (key in element) {
        element[key] = value;
      } else {
        element.setAttribute(key, value);
      }
    }

    parent.appendChild(element);

    return element;
  }
})();

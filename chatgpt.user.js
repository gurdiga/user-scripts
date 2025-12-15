// ==UserScript==
// @name         ChatGPT Message Timestamps
// @description  Appends a localised timestamp to every message in ChatGPT conversations.
// @namespace    https://github.com/gurdiga
// @version      1.0.0
// @author       You
// @match        https://chatgpt.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const MESSAGE_SELECTOR = "[data-message-id]";
  const BADGE_CLASS = "gpt-timestamp-badge";
  const BADGE_DATA_FLAG = "gptTimestampBadge";

  const state = {
    conversationKey: null,
    endpoint: null,
    messageTimes: new Map(),
    pendingFetch: null,
    scheduledFetch: null,
    accessToken: null,
  };

  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  injectStyles();
  installLocationObserver(handleUrlChange);
  handleUrlChange(location.href);
  ensureAccessToken();

  const observer = new MutationObserver((mutations) => {
    let sawNewMessages = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }

        if (node.matches?.(MESSAGE_SELECTOR)) {
          annotateMessage(node);
          sawNewMessages = true;
        }

        const nestedMessages = node.querySelectorAll?.(MESSAGE_SELECTOR);
        if (nestedMessages?.length) {
          nestedMessages.forEach(annotateMessage);
          sawNewMessages = true;
        }
      }
    }

    if (sawNewMessages) {
      scheduleConversationRefresh();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  function injectStyles() {
    if (document.head.querySelector("style[data-gpt-timestamp-style]")) {
      return;
    }

    const style = document.createElement("style");
    style.dataset.gptTimestampStyle = "true";
    style.textContent = `
      ${MESSAGE_SELECTOR} {
        position: relative;
      }
      ${MESSAGE_SELECTOR} .${BADGE_CLASS} {
        font-size: 0.7rem;
        line-height: 1.2;
        opacity: 0.7;
        align-self: flex-end;
        margin-bottom: 0.25rem;
        display: inline-flex;
        gap: 0.35rem;
        color: var(--token-text-secondary, rgba(110, 118, 129, 0.9));
      }
      ${MESSAGE_SELECTOR}[data-message-author-role="user"] .${BADGE_CLASS} {
        color: var(--token-text-secondary, rgba(99, 110, 123, 0.8));
      }
    `;
    document.head.appendChild(style);
  }

  function installLocationObserver(callback) {
    let lastHref = location.href;

    const check = () => {
      if (location.href === lastHref) {
        return;
      }
      lastHref = location.href;
      callback(location.href);
    };

    const wrapHistoryFn = (original) =>
      function (...args) {
        const result = original.apply(this, args);
        queueMicrotask(check);
        return result;
      };

    history.pushState = wrapHistoryFn(history.pushState);
    history.replaceState = wrapHistoryFn(history.replaceState);
    window.addEventListener("popstate", check);
    window.addEventListener("hashchange", check);
    setInterval(check, 1000);
  }

  function handleUrlChange(href) {
    const { conversationKey, endpoint } = resolveConversation(href);

    if (conversationKey === state.conversationKey && endpoint === state.endpoint) {
      return;
    }

    state.conversationKey = conversationKey;
    state.endpoint = endpoint;
    state.messageTimes.clear();

    document.querySelectorAll(MESSAGE_SELECTOR).forEach((node) => {
      const badge = findExistingBadge(node);
      if (badge) {
        badge.remove();
      }
    });

    if (state.endpoint) {
      loadConversationData();
    }
  }

  function resolveConversation(href) {
    try {
      const url = new URL(href, location.origin);
      const path = url.pathname;

      const shareMatch = path.match(/(?:^|\/)share\/([A-Za-z0-9-]+)/);
      if (shareMatch) {
        const shareId = shareMatch[1];
        return {
          conversationKey: `share:${shareId}`,
          endpoint: `/backend-api/share/conversation/${shareId}`,
        };
      }

      const conversationMatch = path.match(/(?:^|\/)c\/([A-Za-z0-9-]+)/);
      if (conversationMatch) {
        const conversationId = conversationMatch[1];
        return {
          conversationKey: `conversation:${conversationId}`,
          endpoint: `/backend-api/conversation/${conversationId}`,
        };
      }
    } catch (error) {
      console.debug("[ChatGPT Timestamp]", "Failed to resolve conversation id", error);
    }

    return { conversationKey: null, endpoint: null };
  }

  async function loadConversationData() {
    if (!state.endpoint) {
      return;
    }

    const token = ensureAccessToken();
    if (!token) {
      console.debug("[ChatGPT Timestamp]", "Missing access token; will retry soon");
      scheduleConversationRefresh(3000);
      return null;
    }

    if (state.pendingFetch) {
      return state.pendingFetch;
    }

    state.pendingFetch = fetch(state.endpoint, {
      credentials: "include",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}`);
          error.status = response.status;
          throw error;
        }
        return response.json();
      })
      .then((payload) => {
        mergeMessageTimes(payload);
        annotateAllMessages();
      })
      .catch((error) => {
        console.debug("[ChatGPT Timestamp]", "Failed to load conversation data from", state.endpoint, error);
        if (error?.status === 401 || error?.status === 403) {
          state.accessToken = null;
        }
      })
      .finally(() => {
        state.pendingFetch = null;
      });

    return state.pendingFetch;
  }

  function mergeMessageTimes(payload) {
    if (!payload) {
      return;
    }

    const mapping = payload.mapping || payload.messages || null;
    if (!mapping) {
      return;
    }

    const entries = Array.isArray(mapping) ? mapping : Object.values(mapping);

    for (const node of entries) {
      const message = node?.message || node;
      const messageId = message?.id;
      if (!messageId) {
        continue;
      }

      const rawTimestamp = extractTimestamp(message);
      if (!rawTimestamp) {
        continue;
      }

      state.messageTimes.set(messageId, rawTimestamp);
    }
  }

  function extractTimestamp(message) {
    const candidates = [message?.create_time, message?.metadata?.created_at, message?.metadata?.timestamp];

    for (const value of candidates) {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
    return null;
  }

  function annotateAllMessages() {
    document.querySelectorAll(MESSAGE_SELECTOR).forEach(annotateMessage);
  }

  function annotateMessage(node) {
    const messageId = node.getAttribute("data-message-id") || node.dataset?.messageId;
    if (!messageId) {
      return;
    }

    const timestampValue = state.messageTimes.get(messageId);
    if (!timestampValue) {
      return;
    }

    const display = formatTimestamp(timestampValue);
    if (!display) {
      return;
    }

    const existing = findExistingBadge(node);
    if (existing) {
      if (existing.textContent !== display) {
        existing.textContent = display;
      }
      return;
    }

    const badge = document.createElement("div");
    badge.dataset[BADGE_DATA_FLAG] = messageId;
    badge.className = BADGE_CLASS;
    badge.textContent = display;
    badge.title = new Date(normaliseTimestamp(timestampValue)).toISOString();

    node.insertBefore(badge, node.firstChild);
  }

  function findExistingBadge(node) {
    for (const child of node.children) {
      if (child.dataset && child.dataset[BADGE_DATA_FLAG]) {
        return child;
      }
    }
    return null;
  }

  function formatTimestamp(value) {
    const ms = normaliseTimestamp(value);
    if (!ms) {
      return null;
    }
    return `🕒 ${timeFormatter.format(new Date(ms))}`;
  }

  function normaliseTimestamp(value) {
    if (typeof value !== "number") {
      value = Number(value);
    }
    if (!Number.isFinite(value)) {
      return null;
    }
    return value > 1e12 ? value : value * 1000;
  }

  function scheduleConversationRefresh(delay = 1200) {
    if (state.scheduledFetch) {
      return;
    }
    state.scheduledFetch = setTimeout(() => {
      state.scheduledFetch = null;
      loadConversationData();
    }, delay);
  }

  function ensureAccessToken() {
    if (state.accessToken) {
      return state.accessToken;
    }

    const direct = window.__reactRouterContext?.loaderData?.root?.session?.accessToken;
    if (typeof direct === "string" && direct) {
      state.accessToken = direct;
      return state.accessToken;
    }

    const patterns = [/"accessToken":"([^"]+)"/, /"accessToken\\":\\"([^"\\]+)\\"/, /"accessToken\\",\\"([^"\\]+)\\"/];

    for (const script of document.scripts) {
      const text = script.textContent;
      if (!text) {
        continue;
      }
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) {
          state.accessToken = match[1];
          return state.accessToken;
        }
      }
    }

    return null;
  }
})();

import browser from "webextension-polyfill";
import { shouldBlockUrl } from "./blockingEngine.js";
import { setToStorage, getFromStorage } from "../utils/storage.js";
import {
  DEFAULT_BLOCKED_SITES,
  DEFAULT_SCHEDULE,
  DEFAULT_STREAK,
  DEFAULT_PAUSE_STATE,
  DEFAULT_AVATAR
} from "../utils/defaults.js";

const DEBUG = false; //change this to True for development

if (DEBUG) console.log("FocusFalcon background loaded");

/**
 * Install defaults once
 */
browser.runtime.onInstalled.addListener(async () => {
  if (DEBUG) console.log("FocusFalcon installed – initializing defaults");

  const {
    blockedSites,
    blockRules,
    focusStreak,
    pauseState,
    avatar
  } = await getFromStorage([
    "blockedSites",
    "blockRules",
    "focusStreak",
    "pauseState",
    "avatar"
  ]);

  if (!blockedSites) {
    await setToStorage("blockedSites", DEFAULT_BLOCKED_SITES);
  }

  if (!blockRules) {
    await setToStorage("blockRules", DEFAULT_SCHEDULE);
  }

  if (!focusStreak) {
    await setToStorage("focusStreak", DEFAULT_STREAK);
  }

  if (!pauseState) {
    await setToStorage("pauseState", DEFAULT_PAUSE_STATE);
  }

  if (!avatar) {
    await setToStorage("avatar", DEFAULT_AVATAR);
  }

  if (DEBUG) console.log("Default settings initialization complete");
});

/**
 * Core blocking enforcement
 */
browser.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (DEBUG) console.log("onBeforeNavigate fired:", details.url);

  // ONLY handle main-frame navigations
  if (details.frameId !== 0) {
    if (DEBUG) console.log("Ignored subframe navigation:", details.url);
    return;
  }

  if (!details.url || !details.url.startsWith("http")) {
    if (DEBUG) console.log("Ignored non-http URL");
    return;
  }

  const shouldBlock = await shouldBlockUrl(details.url);

  if (DEBUG) console.log(
    shouldBlock ? "WILL BLOCK" : "Allowed:",
    details.url
  );

  if (!shouldBlock) return;

  const hostname = new URL(details.url).hostname;
  const redirectUrl = browser.runtime.getURL(
    `mainpage/blocked.html?site=${hostname}`
  );

  if (DEBUG) console.log("Redirecting to block page:", redirectUrl);

  await browser.tabs.update(details.tabId, { url: redirectUrl });
});

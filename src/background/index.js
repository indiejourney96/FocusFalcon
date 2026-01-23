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

console.log("🦅 FocusFalcon background loaded");

/**
 * Install defaults once
 */
browser.runtime.onInstalled.addListener(async () => {
  console.log("📦 FocusFalcon installed – initializing defaults");

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
    console.log("✅ Default blockedSites set");
  }

  if (!blockRules) {
    await setToStorage("blockRules", DEFAULT_SCHEDULE);
    console.log("✅ Default blockRules set");
  }

  if (!focusStreak) {
    await setToStorage("focusStreak", DEFAULT_STREAK);
    console.log("✅ Default focusStreak set");
  }

  if (!pauseState) {
    await setToStorage("pauseState", DEFAULT_PAUSE_STATE);
    console.log("✅ Default pauseState set");
  }

  if (!avatar) {
    await setToStorage("avatar", DEFAULT_AVATAR);
    console.log("✅ Default avatar set");
  }

  console.log("🎉 Default settings initialization complete");
});

/**
 * Pause / Resume handling
 */
browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "PAUSE_BLOCKING") {
    await setToStorage("pauseState", {
      isPaused: true,
      timestamp: Date.now()
    });
    console.log("⏸ Blocking paused");
  }

  if (msg.type === "RESUME_BLOCKING") {
    await setToStorage("pauseState", {
      isPaused: false,
      timestamp: null
    });
    console.log("▶️ Blocking resumed");
  }
});

/**
 * Core blocking enforcement
 */
browser.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (!details.url || !details.url.startsWith("http")) return;

  const shouldBlock = await shouldBlockUrl(details.url);

  if (!shouldBlock) {
    console.log("✅ Allowed:", details.url);
    return;
  }

  const hostname = new URL(details.url).hostname;
  const redirectUrl = browser.runtime.getURL(
    `mainpage/blocked.html?site=${hostname}`
  );

  console.log(`🔀 Blocking ${details.url}`);

  await browser.tabs.update(details.tabId, { url: redirectUrl });
});

import "webextension-polyfill";

import browser from "webextension-polyfill";
import { setToStorage, getFromStorage } from "../utils/storage.js";
import {
  DEFAULT_BLOCKED_SITES,
  DEFAULT_SCHEDULE,
  DEFAULT_STREAK,
  DEFAULT_PAUSE_STATE,
  DEFAULT_AVATAR,
} from "../utils/defaults.js";

console.log("🦅 FocusFalcon background loaded");

browser.runtime.onInstalled.addListener(async () => {
  console.log("FocusFalcon installed");

  // Initialize storage if not already set
  if (!(await getFromStorage("blockedSites"))) {
    await setToStorage("blockedSites", DEFAULT_BLOCKED_SITES);
  }

  if (!(await getFromStorage("schedule"))) {
    await setToStorage("schedule", DEFAULT_SCHEDULE);
  }

  if (!(await getFromStorage("focusStreak"))) {
    await setToStorage("focusStreak", DEFAULT_STREAK);
  }

  if (!(await getFromStorage("pauseState"))) {
    await setToStorage("pauseState", DEFAULT_PAUSE_STATE);
  }

  if (!(await getFromStorage("avatar"))) {
    await setToStorage("avatar", DEFAULT_AVATAR);
  }

  console.log("✅ Default settings initialized");
});

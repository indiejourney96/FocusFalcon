import browser from "webextension-polyfill";
import { setToStorage } from "../utils/storage.js";

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📩 Message received:", msg);

  if (msg.type === "PAUSE_BLOCKING") {
    setToStorage("pauseState", {
      isPaused: true,
      timestamp: Date.now()
    }).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "RESUME_BLOCKING") {
    setToStorage("pauseState", {
      isPaused: false,
      timestamp: null
    }).then(() => sendResponse({ ok: true }));
    return true;
  }
});

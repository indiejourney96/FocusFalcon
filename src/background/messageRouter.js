import browser from "webextension-polyfill";
import { enableBlocking, disableBlocking } from "./blockingEngine.js";

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📩 Message received:", msg);

  if (msg.type === "ENABLE_BLOCKING") {
    enableBlocking(msg.sites).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "DISABLE_BLOCKING") {
    disableBlocking().then(() => sendResponse({ ok: true }));
    return true;
  }
});

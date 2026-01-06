
console.log("🦅 FocusFalcon background service worker loaded");

browser.runtime.onInstalled.addListener(() => {
  console.log("FocusFalcon installed");
});

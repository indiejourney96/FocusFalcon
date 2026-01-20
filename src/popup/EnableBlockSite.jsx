import browser from "webextension-polyfill";

export default function EnableBlockSite() {
  return (
    <button
      onClick={() => {
        browser.runtime.sendMessage({
          type: "ENABLE_BLOCKING",
          sites: ["youtube.com", "9gag.com", "reddit.com"]
        });
      }}
    >
      Enable Blocking
    </button>
  );
}

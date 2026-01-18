import browser from "webextension-polyfill";

export default function EnableBlockSite() {
  return (
    <button
      onClick={() => {
        browser.runtime.sendMessage({
          type: "ENABLE_BLOCKING",
          sites: ["youtube.com"]
        });
      }}
    >
      Enable Blocking
    </button>
  );
}

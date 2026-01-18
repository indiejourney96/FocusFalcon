import browser from "webextension-polyfill";

export default function DisableBlockSite() {
  return (
    <button
      onClick={() => {
        browser.runtime.sendMessage({ type: "DISABLE_BLOCKING" });
      }}
    >
      Disable Blocking
    </button>
  );
}

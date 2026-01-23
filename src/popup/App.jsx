import React, { useEffect, useState } from "react";
import { getFromStorage, setToStorage } from "../utils/storage.js";
import browser from "webextension-polyfill";

export default function App() {
  const [blockedSites, setBlockedSites] = useState([]);
  const [avatar, setAvatar] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      const { blockedSites = [], avatar = "falcon", pauseState = { isPaused: false } } =
        await getFromStorage(["blockedSites", "avatar", "pauseState"]);

      setBlockedSites(blockedSites);
      setAvatar(avatar);
      setIsPaused(pauseState.isPaused);
    }
    fetchData();
  }, []);

  // Toggle pause state
  const togglePause = async () => {
    const newState = !isPaused;

    // Update storage
    await setToStorage("pauseState", { isPaused: newState, timestamp: Date.now() });
    setIsPaused(newState);

    console.log(`⏸ Pause state updated: ${newState}`);

    // ✅ If resuming, refresh all tabs that match blocked sites
    if (!newState && blockedSites.length > 0) {
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        if (!tab.url || (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))) continue;
        const tabUrl = new URL(tab.url);
        if (blockedSites.some(site => tabUrl.hostname === site || tabUrl.hostname.endsWith("." + site))) {
          console.log("🔄 Refreshing tab to enforce blocking:", tab.url);
          await browser.tabs.reload(tab.id);
        }
      }
    }
  };

  return (
    <div style={{ padding: 16, textAlign: "center", width: 300 }}>
      <h1>🦅 FocusFalcon</h1>

      <button onClick={togglePause} style={{ marginBottom: 8 }}>
        {isPaused ? "▶ Resume Blocking" : "⏸ Pause Blocking"}
      </button>

      <button
        id="openSettings"
        onClick={() => browser.runtime.openOptionsPage()}
        style={{ marginBottom: 16 }}
      >
        ⚙ Settings
      </button>

      <p>Blocked Sites:</p>
      <ul>
        {blockedSites.map((site) => (
          <li key={site}>{site}</li>
        ))}
      </ul>

      <p>Avatar: {avatar}</p>
    </div>
  );
}

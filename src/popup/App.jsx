import React, { useEffect, useState } from "react";
import { getFromStorage, setToStorage } from "../utils/storage.js";

export default function App() {
  const [blockedSites, setBlockedSites] = useState([]);
  const [avatar, setAvatar] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      const {
        blockedSites = [],
        avatar = "falcon"
      } = await getFromStorage(["blockedSites", "avatar"]);

      setBlockedSites(blockedSites);
      setAvatar(avatar);
    }

    fetchData();
  }, []);


  // Toggle pause state
  const togglePause = async () => {
    const newState = !isPaused;
    await setToStorage("pauseState", { isPaused: newState, timestamp: Date.now() });
    setIsPaused(newState);
  };

  return (
    <div style={{ padding: 16, textAlign: "center", width: 300 }}>
      <h1>🦅 FocusFalcon</h1>

      <button onClick={togglePause} style={{ marginBottom: 8 }}>
        {isPaused ? "▶ Resume Blocking" : "⏸ Pause Blocking"}
      </button>

      <button
        id="openSettings"
        onClick={() => chrome.runtime.openOptionsPage()}
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
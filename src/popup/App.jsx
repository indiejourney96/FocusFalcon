import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { getFromStorage, setToStorage } from "../utils/storage.js";

export default function App() {
  const [blockedSites, setBlockedSites] = useState([]);
  const [avatar, setAvatar] = useState("falcon");

  const [isPaused, setIsPaused] = useState(false);
  const [focusSession, setFocusSession] = useState({ isActive: false });
  const [blockRules, setBlockRules] = useState({ enabled: false });
  const [duration, setDuration] = useState(25);


  /* -----------------------------
     INITIAL LOAD
  ------------------------------*/
  useEffect(() => {
    async function load() {
      const {
        blockedSites = [],
        avatar = "falcon",
        pauseState = { isPaused: false },
        focusSession = { isActive: false },
        blockRules = { enabled: false }
      } = await getFromStorage([
        "blockedSites",
        "avatar",
        "pauseState",
        "focusSession",
        "blockRules"
      ]);

      setBlockedSites(blockedSites);
      setAvatar(avatar);
      setIsPaused(pauseState.isPaused);
      setFocusSession(focusSession);
      setBlockRules(blockRules);
    }

    load();
  }, []);

  /* -----------------------------
     FOCUS SESSION (NO SCHEDULE)
  ------------------------------*/
  const startFocusSession = async () => {
    const minutes = Number(duration);
    if (!minutes || minutes <= 0) return;

    const endTimestamp = Date.now() + minutes * 60 * 1000;

    await setToStorage("focusSession", {
      isActive: true,
      endTimestamp
    });

    setFocusSession({ isActive: true, endTimestamp });

    // 🔄 Enforce immediately
    refreshBlockedTabs();
  };


  const endFocusSession = async () => {
    const confirmed = confirm(
      "⚠ End focus session early?\nYour blocks will be removed."
    );
    if (!confirmed) return;

    await setToStorage("focusSession", {
      isActive: false,
      endTimestamp: null
    });

    setFocusSession({ isActive: false });
  };

  /* -----------------------------
     SCHEDULE PAUSE / RESUME
  ------------------------------*/
  const pauseBlocking = async () => {
    const confirmed = confirm(
      "⚠ Pause blocking?\nThis breaks your schedule discipline."
    );
    if (!confirmed) return;

    await setToStorage("pauseState", {
      isPaused: true,
      timestamp: Date.now()
    });

    setIsPaused(true);
  };

  const resumeBlocking = async () => {
    await setToStorage("pauseState", {
      isPaused: false,
      timestamp: null
    });

    setIsPaused(false);
    refreshBlockedTabs();
  };

  /* -----------------------------
     TAB ENFORCEMENT
  ------------------------------*/
  const refreshBlockedTabs = async () => {
    const tabs = await browser.tabs.query({});

    for (const tab of tabs) {
      if (!tab.url || !tab.url.startsWith("http")) continue;

      const hostname = new URL(tab.url).hostname;
      if (
        blockedSites.some(
          site => hostname === site || hostname.endsWith("." + site)
        )
      ) {
        await browser.tabs.reload(tab.id);
      }
    }
  };

  const isWithinScheduleNow = (blockRules) => {
    if (!blockRules?.enabled) return false;

    const now = new Date();
    const day = now.getDay();
    const time = now.toTimeString().slice(0, 5);

    if (!blockRules.days?.includes(day)) return false;

    return blockRules.timeRanges?.some(
      range => time >= range.start && time <= range.end
    );
  };


  /* -----------------------------
     UI STATE
  ------------------------------*/
  const scheduleActiveNow =
    isWithinScheduleNow(blockRules) && !isPaused;

  const canPauseSchedule = scheduleActiveNow;

  const inFocusSession = focusSession.isActive;

  return (
    <div style={{ padding: 16, width: 300, textAlign: "center" }}>
      <h2>🦅 FocusFalcon</h2>

      {/* Avatar (future expansion point) */}
      <p>Avatar: <strong>{avatar}</strong></p>


      {/* CASE A: Scheduled blocking active now */}
      {canPauseSchedule && (
        <button onClick={pauseBlocking}>
          ⏸ Pause Blocking
        </button>
      )}

      {blockRules.enabled && isPaused && (
        <button onClick={resumeBlocking}>
          ▶ Resume Blocking
        </button>
      )}

      {/* CASE B & C: No active schedule → Focus Session */}
      {!canPauseSchedule && !inFocusSession && (
        <>
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <button onClick={startFocusSession}>
            🎯 Activate Focus Session
          </button>
        </>
      )}

      {inFocusSession && (
        <button onClick={endFocusSession}>
          ⛔ End Focus Session
        </button>
      )}

      <hr />

      <button onClick={() => browser.runtime.openOptionsPage()}>
        ⚙ Settings
      </button>

      <p style={{ marginTop: 12 }}>Blocked Sites:</p>
      <ul>
        {blockedSites.map(site => (
          <li key={site}>{site}</li>
        ))}
      </ul>
    </div>
  );
}

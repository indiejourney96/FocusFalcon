import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { getFromStorage, setToStorage } from "../utils/storage.js";
import HoldButton from "./components/HoldButton.jsx";
import "./popup.css";
import { AVATARS } from "../utils/avatars.js";


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
    const confirmed = confirm(getEncouragingMessage("endFocusSession"));
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
    const confirmed = confirm(getEncouragingMessage("pauseBlocking"));
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
    <div className="container" style={{ padding: 16, width: 300 }}>
      <div className="header-container">
        <h2>FocusFalcon</h2>

        <p className="avatar-display">
          <span>Focus Guardian:</span>
          <img
            src={AVATARS[avatar]?.image}
            alt={AVATARS[avatar]?.label}
            className="avatar-image"
          />
          <strong>{AVATARS[avatar]?.label}</strong>
        </p>
      </div>


      {/* CASE A: Scheduled blocking active now */}
      <div className="action-section">
        {canPauseSchedule && (
          <HoldButton
            text="⏸ Pause Blocking (hold to confirm)"
            onHoldComplete={() => {
              pauseBlocking(); // retains your confirm() message
            }}
            holdTime={2000} // 2 seconds hold
          />
        )}


        {blockRules.enabled && isPaused && (
          <button onClick={resumeBlocking} className="btn-primary">
            ▶ Resume Blocking
          </button>
        )}

        {/* CASE B & C: No active schedule → Focus Session */}
        {!inFocusSession && !scheduleActiveNow && !isPaused && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="input-wrapper">
              <input
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="focus-input"
              />
              <span>minutes</span>
            </div>
            <button onClick={startFocusSession} className="btn-primary">
              🎯 Activate Focus Session
            </button>
          </div>
        )}

        {inFocusSession && (
          <HoldButton
            text="⛔ End Focus Session (hold to confirm)"
            onHoldComplete={endFocusSession} // call the existing function
            holdTime={2000} // 2 seconds hold
          />
        )}
      </div>

      <hr className="divider" />

      <button className="btn-outline" onClick={() => browser.runtime.openOptionsPage()}>
        ⚙ Settings
      </button>

      <div className="sites-container">
        <span className="sites-label">Blocked Sites</span>
        <ul className="sites-list">
          {blockedSites.map(site => (
            <li key={site} className="site-tag">{site}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}


/* -----------------------------
   HELPER: Random Encouraging Messages
------------------------------*/
function getEncouragingMessage(type) {
  const messages = {
    endFocusSession: [
      "😬 Ending now…? Are you sure boss?", ,
      "🤔 Are you sure you want to stop? Your future 'you' might feel sad…",
      "😅 End it now? Okay boss"
    ],
    pauseBlocking: [
      "🤔 Pause now boss? Feels kinda risky…",
      "😅 That pause button is tempting… Are you sure you want to pause now?",
      "🤔 Hmmm… do we really wanna pause right now?"
    ]
  };

  const selected = messages[type];
  return selected[Math.floor(Math.random() * selected.length)];
}
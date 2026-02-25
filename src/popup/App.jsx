import React, { useEffect, useState, useRef } from "react";
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

  // Blocked sites manager state
  const [newSite, setNewSite] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [addError, setAddError] = useState("");
  const [saveFlash, setSaveFlash] = useState(false);
  const newSiteInputRef = useRef(null);
  const editInputRef = useRef(null);


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

  // Auto-focus edit input when editing starts
  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  /* -----------------------------
     REACT TO blockRules CHANGES
  ------------------------------*/
  useEffect(() => {
    async function handleScheduleTakeover() {
      if (focusSession.isActive && isWithinScheduleNow(blockRules)) {
        await setToStorage("focusSession", {
          isActive: false,
          endTimestamp: null
        });
        setFocusSession({ isActive: false });
        return;
      }

      if (!blockRules.enabled && isPaused) {
        await setToStorage("pauseState", {
          isPaused: false,
          timestamp: null
        });
        setIsPaused(false);
      }
    }

    handleScheduleTakeover();
  }, [blockRules]);


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
     BLOCKED SITES MANAGER
  ------------------------------*/
  const normalizeDomain = (input) => {
    return input
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0];
  };

  const isValidDomain = (domain) => {
    return /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(domain);
  };

  const persistSites = async (updatedSites) => {
    await setToStorage("blockedSites", updatedSites);
    setBlockedSites(updatedSites);
    // Flash save confirmation
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  const handleAddSite = async () => {
    const domain = normalizeDomain(newSite);
    setAddError("");

    if (!domain) return;

    if (!isValidDomain(domain)) {
      setAddError("Enter a valid domain, e.g. reddit.com");
      return;
    }

    if (blockedSites.includes(domain)) {
      setAddError("Already in your list!");
      return;
    }

    const updated = [...blockedSites, domain];
    await persistSites(updated);
    setNewSite("");
    newSiteInputRef.current?.focus();
  };

  const handleAddKeyDown = (e) => {
    if (e.key === "Enter") handleAddSite();
    if (e.key === "Escape") {
      setNewSite("");
      setAddError("");
    }
  };

  const handleRemoveSite = async (index) => {
    const updated = blockedSites.filter((_, i) => i !== index);
    await persistSites(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValue("");
    }
  };

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditingValue(blockedSites[index]);
    setAddError("");
  };

  const handleSaveEdit = async () => {
    const domain = normalizeDomain(editingValue);

    if (!isValidDomain(domain)) {
      setAddError("Enter a valid domain, e.g. reddit.com");
      return;
    }

    const duplicate = blockedSites.some((s, i) => s === domain && i !== editingIndex);
    if (duplicate) {
      setAddError("Already in your list!");
      return;
    }

    const updated = blockedSites.map((s, i) => (i === editingIndex ? domain : s));
    await persistSites(updated);
    setEditingIndex(null);
    setEditingValue("");
    setAddError("");
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") handleSaveEdit();
    if (e.key === "Escape") {
      setEditingIndex(null);
      setEditingValue("");
      setAddError("");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
    setAddError("");
  };

  /* -----------------------------
     UI STATE
  ------------------------------*/
  const scheduleActiveNow = isWithinScheduleNow(blockRules) && !isPaused;
  const inFocusSession = focusSession.isActive;

  const showPauseSchedule = scheduleActiveNow;
  const showResumeSchedule = blockRules.enabled && isPaused;
  const showEndFocusSession = inFocusSession && !scheduleActiveNow;
  const showStartFocusSession = !inFocusSession && !scheduleActiveNow && !isPaused;


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

      {/* SCHEDULE: Active → show Pause */}
      <div className="action-section">
        {showPauseSchedule && (
          <HoldButton
            text="⏸ Pause Blocking (hold to confirm)"
            onHoldComplete={() => {
              pauseBlocking();
            }}
            holdTime={2000}
          />
        )}

        {/* SCHEDULE: Paused → show Resume */}
        {showResumeSchedule && (
          <button onClick={resumeBlocking} className="btn-primary">
            ▶ Resume Blocking
          </button>
        )}

        {/* No active schedule → Focus Session */}
        {showStartFocusSession && (
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

        {showEndFocusSession && (
          <HoldButton
            text="⛔ End Focus Session (hold to confirm)"
            onHoldComplete={endFocusSession}
            holdTime={2000}
          />
        )}
      </div>

      <hr className="divider" />

      <button className="btn-outline" onClick={() => browser.runtime.openOptionsPage()}>
        ⚙ Settings
      </button>

      {/* ----------------------------------------
          BLOCKED SITES MANAGER
      ----------------------------------------- */}
      <div className="sites-container">
        <div className="sites-header">
          <span className="sites-label">Blocked Sites</span>
          {saveFlash && <span className="save-flash">✓ Saved</span>}
        </div>

        {/* Site list with edit/remove controls */}
        <ul className="sites-list-manage">
          {blockedSites.length === 0 && (
            <li className="sites-empty">No sites blocked yet. Add one below!</li>
          )}
          {blockedSites.map((site, index) => (
            <li key={site} className="site-row">
              {editingIndex === index ? (
                /* ---- Edit mode ---- */
                <div className="site-edit-row">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="site-edit-input"
                  />
                  <button className="icon-btn icon-btn--confirm" onClick={handleSaveEdit} title="Save">
                    ✓
                  </button>
                  <button className="icon-btn icon-btn--cancel" onClick={handleCancelEdit} title="Cancel">
                    ✕
                  </button>
                </div>
              ) : (
                /* ---- Display mode ---- */
                <div className="site-display-row">
                  <span className="site-name">{site}</span>
                  <div className="site-actions">
                    <button
                      className="icon-btn icon-btn--edit"
                      onClick={() => handleStartEdit(index)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      className="icon-btn icon-btn--remove"
                      onClick={() => handleRemoveSite(index)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* Add new site input */}
        <div className="add-site-row">
          <input
            ref={newSiteInputRef}
            type="text"
            value={newSite}
            onChange={(e) => {
              setNewSite(e.target.value);
              setAddError("");
            }}
            onKeyDown={handleAddKeyDown}
            placeholder="e.g. twitter.com"
            className="add-site-input"
          />
          <button
            className="icon-btn icon-btn--add"
            onClick={handleAddSite}
            title="Add site"
          >
            +
          </button>
        </div>
        {addError && <p className="sites-error">{addError}</p>}
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
      "😬 Ending now…? Are you sure boss?",
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

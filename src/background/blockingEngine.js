import browser from "webextension-polyfill";
import { getFromStorage } from "../utils/storage.js";

/**
 * Decide whether a URL should be blocked right now
 */
export async function shouldBlockUrl(url) {
  console.log("🧠 shouldBlockUrl called for:", url);
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    console.log("❌ Invalid URL");
    return false;
  }

  const hostname = parsedUrl.hostname;

  const data = await getFromStorage([
    "blockedSites",
    "blockRules",
    "pauseState",
    "focusSession"
  ]);

  console.log("📦 Storage snapshot:", data);

  const {
    blockedSites = [],
    blockRules = { enabled: false },
    pauseState = { isPaused: false },
    focusSession = { isActive: false, endTimestamp: null }
  } = data;

  // 1️⃣ Focus session overrides EVERYTHING
  if (focusSession.isActive) {
    console.log("🎯 Focus session ACTIVE");

    if (Date.now() < focusSession.endTimestamp) {
      const match = matchesBlockedSite(hostname, blockedSites);
      console.log("🔒 Focus session match:", match);
      return match;
    } else {
      console.log("⌛ Focus session expired");
      await browser.storage.local.set({
        focusSession: { isActive: false, endTimestamp: null }
      });
      return false;
    }
  }


  // 2️⃣ Pause only applies outside focus session
  if (pauseState.isPaused) {
    console.log("⏸ Blocking paused");
    return false;
  }

  // 3️⃣ No schedule → no block
  if (!blockRules.enabled) {
    console.log("📅 No schedule active");
    return false;
  }

  // 4️⃣ Schedule active → check domain + time
  const domainMatch = matchesBlockedSite(hostname, blockedSites);
  const timeMatch = isWithinSchedule(blockRules);

  console.log("📅 Schedule check:", {
    domainMatch,
    timeMatch
  });

  return domainMatch && timeMatch;
}


/**
 * Match hostname against blocked domains
 * (youtube.com matches www.youtube.com, m.youtube.com, etc)
 */
function matchesBlockedSite(hostname, blockedSites) {
  return blockedSites.some(
    site => hostname === site || hostname.endsWith("." + site)
  );
}

/**
 * Check if current time falls within allowed blocking schedule
 */
function isWithinSchedule(schedule) {
  const now = new Date();
  const day = now.getDay();
  const time = now.toTimeString().slice(0, 5);

  if (!schedule.days.includes(day)) return false;

  return schedule.timeRanges.some(
    range => time >= range.start && time <= range.end
  );
}


import browser from "webextension-polyfill";
import { getFromStorage } from "../utils/storage.js";

/**
 * Decide whether a URL should be blocked right now
 */
export async function shouldBlockUrl(url) {
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  const hostname = parsedUrl.hostname;

  const {
    blockedSites = [],
    blockRules = { enabled: false },
    pauseState = { isPaused: false }
  } = await getFromStorage([
    "blockedSites",
    "blockRules",
    "pauseState"
  ]);

  // 1️⃣ Paused = never block
  if (pauseState.isPaused) return false;

  // 2️⃣ Domain not in block list
  if (!matchesBlockedSite(hostname, blockedSites)) {
    return false;
  }

  // 3️⃣ No schedule → always block
  if (!blockRules.enabled) {
    return true;
  }

  // 4️⃣ Schedule enabled → check time
  return isWithinSchedule(blockRules);
}

/**
 * Match hostname against blocked domains
 * (youtube.com matches www.youtube.com, m.youtube.com, etc)
 */
function matchesBlockedSite(hostname, blockedSites) {
  return blockedSites.some(site =>
    hostname === site || hostname.endsWith("." + site)
  );
}

/**
 * Check if current time falls within allowed blocking schedule
 */
function isWithinSchedule(schedule) {
  const now = new Date();

  const day = now.getDay(); // 0 (Sun) → 6 (Sat)
  const time = now.toTimeString().slice(0, 5); // HH:mm

  if (!schedule.days.includes(day)) return false;

  return schedule.timeRanges.some(range =>
    time >= range.start && time <= range.end
  );
}



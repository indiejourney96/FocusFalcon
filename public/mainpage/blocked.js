const ext = typeof browser !== "undefined" ? browser : chrome;

function formatTime(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getScheduleEndTime(blockRules) {
  if (!blockRules?.enabled) return null;

  const now = new Date();
  const day = now.getDay();
  const time = now.toTimeString().slice(0, 5);

  if (!blockRules.days?.includes(day)) return null;

  const activeRange = blockRules.timeRanges?.find(
    r => time >= r.start && time <= r.end
  );

  if (!activeRange) return null;

  const [h, m] = activeRange.end.split(":");
  const end = new Date();
  end.setHours(h, m, 0, 0);

  return end.getTime();
}

function getBlockedSiteFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("site");
}

async function init() {
  const siteEl = document.getElementById("blockedSite");
  const el = document.getElementById("returnTime");
  const blockedSite = getBlockedSiteFromUrl();

  if (blockedSite) {
    siteEl.textContent = `🚫 ${blockedSite} is blocked right now`;
  } else {
    siteEl.textContent = "🚫 This site is blocked right now";
  }

  const {
    focusSession,
    blockRules
  } = await ext.storage.local.get([
    "focusSession",
    "blockRules"
  ]);

  // Focus session takes priority
  if (focusSession?.isActive && focusSession.endTimestamp) {
    el.textContent = `⏳ You can come back at ${formatTime(
      focusSession.endTimestamp
    )}`;
    return;
  }

  // Scheduled blocking
  const scheduleEnd = getScheduleEndTime(blockRules);
  if (scheduleEnd) {
    el.textContent = `🕘 You can come back at ${formatTime(scheduleEnd)}`;
    return;
  }

  // Fallback
  el.textContent = "⏳ Your focus zone is active.";


}

init();

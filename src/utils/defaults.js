export const DEFAULT_BLOCKED_SITES = [
  "youtube.com",
  "reddit.com",
  "twitter.com",
];

export const DEFAULT_SCHEDULE = {
  enabled: false,
  days: [1,2,3,4,5], // Mon-Fri
  timeRanges: [{ start: "09:00", end: "17:00" }]
};


export const DEFAULT_STREAK = {
  days: 0,
  lastFocusTimestamp: null,
};

export const DEFAULT_PAUSE_STATE = {
  isPaused: false,
  timestamp: null,
};

export const DEFAULT_AVATAR = "falcon"; // example default

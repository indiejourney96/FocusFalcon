console.log("🚫 Blocked page loaded");

const params = new URLSearchParams(window.location.search);
const site = params.get("site");

const el = document.getElementById("blocked-site");

if (el && site) {
  el.textContent = `Blocked: ${site}`;
}

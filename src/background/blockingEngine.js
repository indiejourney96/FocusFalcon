import browser from "webextension-polyfill";
import { getFromStorage, setToStorage } from "../utils/storage.js";

export async function enableBlocking(sites) {
    let blockedSites = (await getFromStorage("blockedSites")) || [];
    blockedSites = [...new Set([...blockedSites, ...sites])];
    await setToStorage("blockedSites", blockedSites);
    console.log("✅ Updated blocked sites:", blockedSites);

    // Reload affected tabs to enforce redirect
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
        if (!tab.url || (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))) {
            // Skip non-http/https tabs
            continue;
        }

        const tabUrl = new URL(tab.url);

        // Check if tab hostname matches any blocked site
        if (blockedSites.some(site => tabUrl.hostname.includes(site))) {
            console.log("🔄 Reloading tab to enforce redirect:", tab.url);
            browser.tabs.reload(tab.id);
        }
    }
}

export async function disableBlocking() {
    let blockedSites = await getFromStorage("blockedSites") || [];

    // Clear all blocked sites
    blockedSites = [];
    await setToStorage("blockedSites", blockedSites);
    console.log("✅ All blocked sites cleared");

    // Reload all tabs that used to match blocked sites
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
        if (!tab.url || (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))) continue;

        const tabUrl = new URL(tab.url);
        if (blockedSites.some(site => tabUrl.hostname.includes(site))) {
            console.log("🔄 Reloading tab to restore access:", tab.url);
            browser.tabs.reload(tab.id);
        }
    }
}


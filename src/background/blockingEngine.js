import browser from "webextension-polyfill";

const RULE_ID_START = 1000;

// 🔒 Prevent excessive cache clears
const CACHE_CLEAR_COOLDOWN_MS = 5000;
let lastCacheClearTs = 0;

/**
 * Generate DNR rules for sites
 * @param {string[]} sites - Array of domains, e.g. ["youtube.com"]
 */
export function generateRules(sites) {
    const rules = sites.map((site, index) => ({
        id: RULE_ID_START + index,
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: site,
            resourceTypes: ["main_frame"]
        }
    }));

    console.log("📝 Generated DNR rules:", rules);
    return rules;
}

/**
 * Enable blocking for the given sites
 * @param {string[]} sites
 */
export async function enableBlocking(sites) {
    const rules = generateRules(sites);

    try {
        await browser.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rules.map(r => r.id),
            addRules: rules
        });

        console.log("✅ Blocking rules updated successfully");

        // Reload affected tabs
        const allTabs = await browser.tabs.query({});
        for (const tab of allTabs) {
            if (tab.url && sites.some(site => tab.url.includes(site))) {
                console.log("🔄 Reloading tab to enforce blocking:", tab.url);
                browser.tabs.reload(tab.id);
            }
        }

        // Clear cache for these sites
        await clearCacheForSites(sites);

    } catch (err) {
        console.error("❌ Error updating blocking rules:", err);
    }
}


/**
 * Disable blocking for all sites
 */
export async function disableBlocking() {
  try {
    const existingRules =
      await browser.declarativeNetRequest.getDynamicRules();

    const sites = existingRules.map(r =>
      r.condition.urlFilter
    );

    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRules.map(r => r.id)
    });

    console.log("✅ Blocking rules removed successfully");

    // Reload previously blocked tabs
    const allTabs = await browser.tabs.query({});
    for (const tab of allTabs) {
      if (tab.url && sites.some(site => tab.url.includes(site))) {
        console.log("🔄 Reloading previously blocked tab:", tab.url);
        browser.tabs.reload(tab.id);
      }
    }

    // Clear cache (throttled)
    await clearCacheForSites(sites);

  } catch (err) {
    console.error("❌ Error removing blocking rules:", err);
  }
}


/**
 * Clear cache for the given sites only (throttled)
 * @param {string[]} sites - Array of domains
 */
async function clearCacheForSites(sites) {
  if (!browser.browsingData?.remove) {
    console.warn("⚠️ browsingData API not available");
    return;
  }

  const now = Date.now();
  if (now - lastCacheClearTs < CACHE_CLEAR_COOLDOWN_MS) {
    console.log("⏳ Skipping cache clear (cooldown active)");
    return;
  }
  lastCacheClearTs = now;

  const origins = sites
    .flatMap(expandOrigins)
    .filter((v, i, a) => a.indexOf(v) === i); // dedupe
    
  console.log("🧹 Clearing cache for origins:", origins);

  try {
    // ✅ Correct API usage
    await browser.browsingData.remove(
      {
        since: 0,
        origins
      },
      {
        cache: true
      }
    );

    console.log("✅ Cache cleared for blocked sites (per-origin)");
  } catch (err) {
    console.warn(
      "⚠️ Per-origin cache clear failed, falling back to global cache clear",
      err
    );

    // Firefox / legacy fallback
    await browser.browsingData.remove(
      { since: 0 },
      { cache: true }
    );

    console.log("✅ Cache cleared globally (fallback)");
  }
}

function expandOrigins(site) {
  const clean = site.replace(/^https?:\/\//, "").replace(/^www\./, "");

  return [
    `https://${clean}`,
    `https://www.${clean}`,
    `http://${clean}`,
    `http://www.${clean}`
  ];
}

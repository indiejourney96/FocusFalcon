import browser from "webextension-polyfill";

const RULE_ID_START = 1000;

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

export async function enableBlocking(sites) {

    const perms = await browser.permissions.getAll();
    console.log("✅ Active permissions:", perms);
    const rules = generateRules(sites);

    console.log("🚫 Enabling blocking for sites:", sites);
    console.log("🚨 Rules being sent to browser.declarativeNetRequest:", rules);


    try {
        await browser.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rules.map((r) => r.id),
            addRules: rules,
        });

        const activeRules = await browser.declarativeNetRequest.getDynamicRules();
        console.log("🔍 Active blocking rules after update:", activeRules);
        console.log("✅ Blocking rules updated successfully");

        // OPTIONAL: Force reload all tabs to apply blocking immediately
        const tabs = await browser.tabs.query({});
        for (const tab of tabs) {
            if (tab.url && sites.some(site => tab.url.includes(site))) {
                console.log("🔄 Reloading tab to enforce blocking:", tab.url);
                browser.tabs.reload(tab.id);
            }
        }
    } catch (err) {
        console.error("❌ Error updating blocking rules:", err);
    }
}


export async function disableBlocking() {
    try {
        const existing = await browser.declarativeNetRequest.getDynamicRules();
        console.log("🗑 Existing rules before removing:", existing);

        await browser.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: existing.map((r) => r.id),
        });
        console.log("✅ Blocking rules removed successfully");

    } catch (err) {
        console.error("❌ Error removing blocking rules:", err);
    }
}

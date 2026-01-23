// import browser from "webextension-polyfill";
const browser = window.browser || window.chrome;


console.log("⚙️ Settings page loaded");

const data = await browser.storage.local.get(["blockedSites", "blockRules"]);

console.log("📦 Loaded from storage:", data);

if (data.blockedSites) {
    document.getElementById("blockedSites").value =
        data.blockedSites.join("\n");
}

if (data.blockRules) {
    document.getElementById("enableSchedule").checked =
        data.blockRules.enabled;

    for (const day of data.blockRules.days || []) {
        const checkbox = document.querySelector(
            `input[type="checkbox"][value="${day}"]`
        );
        if (checkbox) checkbox.checked = true;
    }

    const range = data.blockRules.timeRanges?.[0];
    if (range) {
        document.getElementById("startTime").value = range.start;
        document.getElementById("endTime").value = range.end;
    }
}


document.getElementById("saveSettings").addEventListener("click", async () => {
    const sites = document
        .getElementById("blockedSites")
        .value
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);

    const startTime = document.getElementById("startTime");
    const endTime = document.getElementById("endTime");

    const blockRules = {
        enabled: document.getElementById("enableSchedule").checked,
        days: [...document.querySelectorAll("input[type=checkbox][value]")]
            .filter(c => c.checked)
            .map(c => Number(c.value)),
        timeRanges: [
            {
                start: startTime.value,
                end: endTime.value
            }
        ]
    };

    console.log("💾 Saving settings:", {
        blockedSites: sites,
        blockRules
    });


    await browser.storage.local.set({
        blockedSites: sites,
        blockRules
    });

    const verify = await browser.storage.local.get([
        "blockedSites",
        "blockRules"
    ]);

    console.log("✅ Verified saved values:", verify);

    alert("Settings saved");
});

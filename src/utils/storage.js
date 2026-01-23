import browser from "webextension-polyfill";

// Get data from storage
export async function getFromStorage(key) {
  const result = await browser.storage.local.get(key);
  return result;
}

// Set data to storage
export async function setToStorage(key, value) {
  await browser.storage.local.set({ [key]: value });
}

// Remove a key
export async function removeFromStorage(key) {
  await browser.storage.local.remove(key);
}


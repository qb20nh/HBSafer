chrome.runtime.onInstalled.addListener(handleRuntimeInstalled);
chrome.history.onVisited.addListener(handleHistoryVisited);

function handleRuntimeInstalled(details) {
  if (details.reason === "install") {
    chrome.storage.sync.set({
      blacklist: [],
    });
  }
}

function handleHistoryVisited(historyItem) {
  chrome.storage.sync.get("blacklist", (data) => {
    if (isBlacklisted(data.blacklist, historyItem.url)) {
      purgeUrl(historyItem.url);
    }
  });
}

function purgeUrl(url) {
  chrome.history.deleteUrl({ url });
}

function isBlacklisted(blacklist, url) {
  return blacklist.some((line) =>
    url.toLowerCase().includes(line.toLowerCase())
  );
}

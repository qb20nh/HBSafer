/**
 * Blacklist object data structure:
 * [
 *  {
 *    hostname: '<hostHash>',
 *    hostpart: <hostPartNum>,
 *    pathname: '<pathHash>',
 *    pathpart: <pathPartNum>
 *  },
 *  ...
 * ]
 * but to save storage space, we will save all values into ordered array:
 * [
 *  hostname, hostpart, pathname, pathpart,
 *  hostname, hostpart, pathname, pathpart,
 *  hostname, hostpart, pathname, pathpart,
 *  ...
 * ]
 */

function digestBlacklistURL(url) {
  var uri = URI.parse(url);
  var hostname = uri.host;
  if (!hostname) {
    uri = URI.parse("http://" + url);
    hostname = uri.host;
  }
  var hostpart = hostname.split(".").length;
  var pathname = uri.path;
  if (pathname.startsWith("/")) pathname = pathname.slice(1);
  if (pathname.endsWith("/")) pathname = pathname.slice(0, pathname.length - 1);
  var pathpart = pathname.split("/").length;
  var domain = psl.parse(hostname).domain || hostname;
  var hosthash = SparkMD5.hash(hostname);
  var pathhash = SparkMD5.hash(pathname);
  return `${domain[0]}${
    domain.length - 1
  }:${hostpart}:${hosthash}:${pathpart}:${pathhash}`;
}

chrome.storage.sync.get("blacklist", (data) => {
  if (!data.blacklist) {
    throw new Error("expected blacklist in storage");
  }

  const blacklistEl = document.getElementById("blacklist");
  blacklistEl.value = data.blacklist.join("\n");
});

const saveEl = document.getElementById("save");
saveEl.addEventListener("click", function () {
  const blacklistEl = document.getElementById("blacklist");
  const blacklist = blacklistEl.value.trim().split("\n");
  chrome.storage.sync.set({ blacklist });

  const savedNotificationEl = document.getElementById("saved-notification");
  savedNotificationEl.className = "flash";
  savedNotificationEl.offsetWidth;
  savedNotificationEl.className = "";
});
